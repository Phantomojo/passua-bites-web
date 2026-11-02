import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";
import { logger } from "../logger";
import { processMpesaCallbackDurable } from "../mpesaCallback";

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
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === "/health" } }));

  // Security middleware
  app.use(securityHeaders);

  // CORS for cross-origin requests (Vercel frontend)
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    res.setHeader("Access-Control-Allow-Origin", origin || "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    if (req.method === "OPTIONS") {
      return res.status(204).end();
    }
    next();
  });

  // M-Pesa Callback endpoint — protected by a server-held secret token.
  app.post("/api/payments/callback", async (req: any, res: any) => {
    const secret = process.env.MPESA_CALLBACK_SECRET;
    const provided =
      req.query?.token || req.headers["x-callback-token"] || req.headers["x-mpesa-callback-token"];
    if (secret) {
      if (provided !== secret) {
        logger.warn("[M-Pesa] Callback rejected: invalid callback secret");
        return res.status(401).json({ ResultCode: 1, ResultDesc: "Unauthorized" });
      }
    } else if (process.env.NODE_ENV === "production") {
      logger.error("[M-Pesa] MPESA_CALLBACK_SECRET is required in production");
      return res.status(503).json({ ResultCode: 1, ResultDesc: "Callback not configured" });
    }
    try {
      await processMpesaCallbackDurable(req.body);
      res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });
    } catch (error) {
      logger.error({ err: error }, "[M-Pesa] Callback processing failed");
      res.status(500).json({ ResultCode: 1, ResultDesc: "Callback processing failed" });
    }
  });

  app.use("/api/", generalLimiter); // Apply rate limiting to other API routes

  registerOAuthRoutes(app);

  // Health check endpoint
  app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // tRPC API with path-aware rate limiting on sensitive mutations
  app.use(
    "/api/trpc",
    (req, _res, next) => {
      const p = req.path || "";
      if (p === "/orders.create" || p.startsWith("/orders.create?")) {
        return orderLimiter(req, _res, next);
      }
      if (
        p === "/payments.initiateStkPush" ||
        p.startsWith("/payments.initiateStkPush?")
      ) {
        return orderLimiter(req, _res, next);
      }
      if (p === "/admin.login" || p.startsWith("/admin.login?")) {
        return authLimiter(req, _res, next);
      }
      next();
    },
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
