import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { getDb } from "../db";
import { orders, mpesaTransactions, customerMessagingPreferences } from "../../drizzle/schema";
import { eq, inArray } from "drizzle-orm";
import {
  extractWhatsAppMarketingOptOutSenders, getKenyanWhatsAppPhoneVariants,
  verifyWhatsAppWebhookSignature, verifyWhatsAppWebhookToken,
} from "./whatsapp";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";
import { logger } from "../logger";

// Security: Rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "production" ? 200 : 500,
  message: { error: "Too many requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

const orderLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 orders per minute
  message: { error: "Too many orders, please slow down" },
  standardHeaders: true,
  legacyHeaders: false,
});

const trackingLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30,
  message: { error: "Too many tracking lookups, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: "Too many authentication attempts, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.setHeader("Retry-After", "60");
    res.status(429).json({ error: "Too many authentication attempts, please try again later" });
  },
});

// Security: Security headers middleware
function securityHeaders(req: any, res: any, next: any) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );
  next();
}

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({
    limit: "50mb",
    verify: (req, _res, buffer) => {
      (req as typeof req & { rawBody?: Buffer }).rawBody = Buffer.from(buffer);
    },
  }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === "/health" } }));

  // Security middleware
  app.use(securityHeaders);
  app.use("/api/", generalLimiter); // Apply rate limiting to API routes

  // CORS for the known frontend origins only. Credentialed requests must never reflect arbitrary origins.
  const allowedOrigins = new Set([
    "https://passua-bites-web.vercel.app",
    "http://localhost:3000",
    "http://localhost:5173",
  ]);
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && allowedOrigins.has(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Vary", "Origin");
    }
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    if (req.method === "OPTIONS") {
      return res.status(origin && allowedOrigins.has(origin) ? 204 : 403).end();
    }
    next();
  });

  registerOAuthRoutes(app);

  app.get("/api/webhooks/whatsapp", (req, res) => {
    const mode = String(req.query["hub.mode"] ?? "");
    const token = String(req.query["hub.verify_token"] ?? "");
    const challenge = String(req.query["hub.challenge"] ?? "");
    if (mode === "subscribe" && challenge &&
      verifyWhatsAppWebhookToken(token, process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN)) {
      return res.status(200).type("text/plain").send(challenge);
    }
    return res.sendStatus(403);
  });

  app.post("/api/webhooks/whatsapp", async (req, res) => {
    const rawBody = (req as typeof req & { rawBody?: Buffer }).rawBody;
    if (!verifyWhatsAppWebhookSignature(rawBody, req.get("x-hub-signature-256"), process.env.WHATSAPP_APP_SECRET)) {
      return res.sendStatus(401);
    }
    try {
      const senders = extractWhatsAppMarketingOptOutSenders(req.body);
      if (senders.length > 0) {
        const db = await getDb();
        if (!db) return res.sendStatus(503);
        const optedOutAt = new Date();
        for (const phone of senders) {
          await db.insert(customerMessagingPreferences).values({
            phone, whatsappMarketingOptIn: false, marketingOptOutAt: optedOutAt,
            marketingConsentSource: "whatsapp_stop", updatedAt: optedOutAt,
          }).onConflictDoUpdate({
            target: customerMessagingPreferences.phone,
            set: {
              whatsappMarketingOptIn: false, marketingOptOutAt: optedOutAt,
              marketingConsentSource: "whatsapp_stop", updatedAt: optedOutAt,
            },
          });
        }
        const variants = Array.from(new Set(senders.flatMap(getKenyanWhatsAppPhoneVariants)));
        await db.update(orders)
          .set({ whatsappOrderUpdatesOptIn: false, updatedAt: optedOutAt })
          .where(inArray(orders.customerPhone, variants))
          .execute();
        logger.info({ optedOutCount: senders.length }, "[WhatsApp] Processed customer opt-outs");
      }
      return res.sendStatus(200);
    } catch (error) {
      logger.error({ err: error }, "[WhatsApp] Failed to process inbound webhook");
      return res.sendStatus(500);
    }
  });

  // M-Pesa Callback endpoint (must be before tRPC middleware)
  app.post("/api/mpesa/callback", async (req, res) => {
    // Return 200 immediately to prevent Safaricom retries
    res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });

    try {
      const { Body } = req.body;
      if (!Body || !Body.stkCallback) {
        logger.error("[M-Pesa] Invalid callback payload");
        return;
      }

      const { stkCallback } = Body;
      const { ResultCode, CheckoutRequestID, CallbackMetadata } = stkCallback;

      const db = await getDb();
      if (!db) {
        logger.error("[M-Pesa] Database not available for callback");
        return;
      }

      // Find transaction
      const tx = await db
        .select()
        .from(mpesaTransactions)
        .where(eq(mpesaTransactions.checkoutRequestID, CheckoutRequestID))
        .limit(1)
        .execute();

      if (tx.length === 0) {
        logger.error({ checkoutRequestID: CheckoutRequestID }, "[M-Pesa] Transaction not found");
        return;
      }

      // Handle failures
      if (ResultCode !== 0) {
        const status = ResultCode === 1032 ? "cancelled" : "failed";
        await db
          .update(mpesaTransactions)
          .set({
            status,
            resultCode: ResultCode,
            resultDesc: stkCallback.ResultDesc,
          })
          .where(eq(mpesaTransactions.checkoutRequestID, CheckoutRequestID));

        await db
          .update(orders)
          .set({ paymentStatus: "failed" })
          .where(eq(orders.id, tx[0].orderId));

        logger.info({ status, checkoutRequestID: CheckoutRequestID }, "[M-Pesa] Payment processed");
        return;
      }

      // Extract metadata
      const metadata: Record<string, any> = {};
      CallbackMetadata?.Item?.forEach((item: any) => {
        metadata[item.Name] = item.Value;
      });

      const { MpesaReceiptNumber, Amount } = metadata;

      // Idempotency check
      if (tx[0].status === "completed") {
        logger.info({ checkoutRequestID: CheckoutRequestID }, "[M-Pesa] Duplicate callback, skipping");
        return;
      }

      // Validate amount
      if (Number(Amount) !== Number(tx[0].amount)) {
        logger.error({ expected: tx[0].amount, received: Amount, orderId: tx[0].orderId }, "[M-Pesa] Amount mismatch");
        return;
      }

      // Confirm payment
      await db
        .update(mpesaTransactions)
        .set({
          status: "completed",
          mpesaReceiptNumber: MpesaReceiptNumber || null,
          resultCode: ResultCode,
          resultDesc: stkCallback.ResultDesc,
        })
        .where(eq(mpesaTransactions.checkoutRequestID, CheckoutRequestID));

      await db
        .update(orders)
        .set({
          paymentStatus: "completed",
          mpesaTransactionId: MpesaReceiptNumber || null,
          status: "confirmed",
        })
        .where(eq(orders.id, tx[0].orderId));

      logger.info({ orderId: tx[0].orderId, receipt: MpesaReceiptNumber, amount: Amount }, "[M-Pesa] Payment confirmed");
    } catch (error) {
      logger.error({ err: error }, "[M-Pesa] Callback processing error");
    }
  });

  // Health check endpoint
  app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // tRPC API with stricter rate limiting on mutations
  app.use(
    "/api/trpc/orders.create",
    orderLimiter, // Stricter limit for orders
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  app.use(
    "/api/trpc/payments.initiateStkPush",
    orderLimiter, // Stricter limit for payments
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  app.use(
    "/api/trpc/orders.getByTrackingToken",
    trackingLimiter,
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  app.use(
    "/api/trpc/admin.login",
    authLimiter,
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // Other API routes with general limit
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    logger.info({ preferredPort, port }, "Port busy, using alternative");
  }

  server.listen(port, () => {
    logger.info({ port }, "Server running");
  });
}

startServer().catch((err) => logger.fatal({ err }, "Server failed to start"));
