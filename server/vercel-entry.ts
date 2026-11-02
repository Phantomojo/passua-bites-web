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

const ALLOWED_ORIGINS = new Set(
  [
    process.env.APP_URL,
    "https://passua-bites-web.vercel.app",
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
  ].filter(Boolean) as string[]
);

function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return true; // same-origin requests may omit Origin
  return ALLOWED_ORIGINS.has(origin);
}

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
  const secret = process.env.MPESA_CALLBACK_SECRET;
  const provided =
    req.query?.token || req.headers["x-callback-token"] || req.headers["x-mpesa-callback-token"];
  if (secret) {
    if (provided !== secret) {
      return res.status(401).json({ ResultCode: 1, ResultDesc: "Unauthorized" });
    }
  } else if (process.env.NODE_ENV === "production") {
    return res.status(503).json({ ResultCode: 1, ResultDesc: "Callback not configured" });
  }
  try {
    await processMpesaCallback(req.body);
    res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });
  } catch (error) {
    res.status(500).json({ ResultCode: 1, ResultDesc: "Callback processing failed" });
  }
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

const orderLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
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
app.use("/api/trpc/orders.create", orderLimiter);
app.use("/api/trpc/payments.initiateStkPush", orderLimiter);

// CORS for cross-origin requests
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && !isAllowedOrigin(origin)) {
    return res.status(403).json({ error: "Origin not allowed" });
  }
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  // CSRF/origin protection for cookie-authenticated state-changing requests
  if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method) && origin) {
    if (!isAllowedOrigin(origin)) {
      return res.status(403).json({ error: "CSRF origin check failed" });
    }
  }
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  next();
});

// NOTE: Rate limits use an in-memory store. In serverless deployments this is
// per-instance and not shared; effective distributed limits require a shared
// store (e.g., Redis/Upstash) if strict global throttling is required.
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