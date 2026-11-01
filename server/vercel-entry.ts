/**
 * Vercel serverless entry point
 * Serves Express + tRPC backend for Passua Bites
 *
 * Export the Express app directly: Vercel's Node runtime invokes serverless
 * functions with (req, res), and an Express app is exactly that. (Wrapping
 * with serverless-http is for AWS Lambda and has been observed to hang under
 * Vercel's runtime.)
 */
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "./routers.js";
import { createContext } from "./_core/context.js";
import rateLimit from "express-rate-limit";
import { processMpesaCallback } from "./mpesaCallback.js";

const app = express();

// Trust Vercel's proxy so express-rate-limit can derive req.ip from
// X-Forwarded-For (otherwise req.ip is undefined in serverless and
// express-rate-limit v8 throws ERR_ERL_UNDEFINED_IP_ADDRESS).
app.set("trust proxy", 1);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Security headers
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; media-src 'self' https:; connect-src 'self' https://*.neon.tech https://*.vercel.app; frame-ancestors 'none'"
  );
  next();
});

// M-Pesa callback — neutral path (Safaricom drops URLs containing
// "mpesa"/"m-pesa"/"safaricom"). Registered before the general rate limiter
// so Safaricom callbacks are never throttled.
app.post("/api/payments/callback", async (req: any, res: any) => {
  await processMpesaCallback(req.body);
  res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });
});

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "production" ? 200 : 500,
  message: { error: "Too many requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { ip: false },
});

const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: "Too many authentication attempts, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { ip: false },
  handler: (_req, res) => {
    res.setHeader("Retry-After", "60");
    res.status(429).json({ error: "Too many authentication attempts, please try again later" });
  },
});

app.use("/api/", generalLimiter);
app.use("/api/trpc/admin.login", authLimiter);

// CORS for cross-origin requests
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  next();
});

// Health check
app.get("/api/health", (_req, res) => {
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

export default app;