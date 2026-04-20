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
import { orders, mpesaTransactions } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
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
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);

  // M-Pesa Callback endpoint (must be before tRPC middleware)
  app.post("/api/mpesa/callback", async (req, res) => {
    // Return 200 immediately to prevent Safaricom retries
    res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });

    try {
      const { Body } = req.body;
      if (!Body || !Body.stkCallback) {
        console.error("[M-Pesa] Invalid callback payload");
        return;
      }

      const { stkCallback } = Body;
      const { ResultCode, CheckoutRequestID, CallbackMetadata } = stkCallback;

      const db = await getDb();
      if (!db) {
        console.error("[M-Pesa] Database not available for callback");
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
        console.error("[M-Pesa] Transaction not found:", CheckoutRequestID);
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
          .where(
            eq(mpesaTransactions.checkoutRequestID, CheckoutRequestID)
          );

        await db
          .update(orders)
          .set({ paymentStatus: "failed" })
          .where(eq(orders.id, tx[0].orderId));

        console.log(`[M-Pesa] Payment ${status}:`, CheckoutRequestID);
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
        console.log("[M-Pesa] Duplicate callback, skipping:", CheckoutRequestID);
        return;
      }

      // Validate amount
      if (Number(Amount) !== Number(tx[0].amount)) {
        console.error("[M-Pesa] Amount mismatch:", {
          expected: tx[0].amount,
          received: Amount,
          orderId: tx[0].orderId,
        });
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
        .where(
          eq(mpesaTransactions.checkoutRequestID, CheckoutRequestID)
        );

      await db
        .update(orders)
        .set({
          paymentStatus: "completed",
          mpesaTransactionId: MpesaReceiptNumber || null,
          status: "confirmed",
        })
        .where(eq(orders.id, tx[0].orderId));

      console.log("[M-Pesa] Payment confirmed:", {
        orderId: tx[0].orderId,
        receipt: MpesaReceiptNumber,
        amount: Amount,
      });
    } catch (error) {
      console.error("[M-Pesa] Callback processing error:", error);
    }
  });

  // Health check endpoint
  app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // tRPC API
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
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
