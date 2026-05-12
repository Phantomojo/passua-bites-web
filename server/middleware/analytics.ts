import type { Request, Response, NextFunction } from "express";
import { createHash } from "crypto";
import { getDb } from "../db";
import { analyticsEvents } from "../../drizzle/schema";

let geo: typeof import("geoip-lite") | null = null;
async function getGeo() {
  if (geo) return geo;
  try {
    geo = (await import("geoip-lite")).default;
  } catch {
    geo = null;
  }
  return geo;
}

function getClientIp(req: Request): string {
  const fwd = req.headers["x-forwarded-for"];
  if (fwd) {
    const first = Array.isArray(fwd) ? fwd[0] : fwd;
    return first.split(",")[0].trim();
  }
  return req.socket?.remoteAddress || req.ip || "unknown";
}

function makeSessionId(ip: string, ua: string): string {
  const day = new Date().toISOString().slice(0, 10);
  return createHash("sha256")
    .update(`${ip}:${ua}:${day}`)
    .digest("hex")
    .slice(0, 32);
}

function parseDevice(ua: string): "mobile" | "tablet" | "desktop" {
  if (/ipad|tablet|playbook|silk/i.test(ua)) return "tablet";
  if (/mobile|android|iphone|ipod|blackberry|opera mini|iemobile/i.test(ua))
    return "mobile";
  return "desktop";
}

function parseBrowser(ua: string): string {
  if (/edg\//i.test(ua)) return "Edge";
  if (/opr\/|opera/i.test(ua)) return "Opera";
  if (/chrome\/\d/i.test(ua) && !/chromium/i.test(ua)) return "Chrome";
  if (/firefox\/\d/i.test(ua)) return "Firefox";
  if (/safari\/\d/i.test(ua) && !/chrome/i.test(ua)) return "Safari";
  return "Other";
}

function parseOS(ua: string): string {
  if (/android/i.test(ua)) return "Android";
  if (/iphone|ipad|ipod/i.test(ua)) return "iOS";
  if (/windows nt/i.test(ua)) return "Windows";
  if (/mac os x/i.test(ua)) return "macOS";
  if (/linux/i.test(ua)) return "Linux";
  return "Other";
}

const SKIP = [
  /^\/api\//,
  /^\/health$/,
  /^\/_vite\//,
  /\.(js|css|map|png|jpg|jpeg|webp|svg|ico|woff|woff2|ttf|eot|json|txt)(\?.*)?$/i,
];

export function analyticsMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  if (req.method !== "GET" || SKIP.some(p => p.test(req.path))) {
    return next();
  }

  next();

  setImmediate(async () => {
    try {
      const db = await getDb();
      if (!db) return;

      const ip = getClientIp(req);
      const ua = (req.headers["user-agent"] || "").slice(0, 512);
      const geoLib = await getGeo();
      const location = geoLib && ip !== "unknown" ? geoLib.lookup(ip) : null;

      await db
        .insert(analyticsEvents)
        .values({
          sessionId: makeSessionId(ip, ua),
          ip: ip.slice(0, 50),
          country: location?.country?.slice(0, 4) || null,
          city: location?.city?.slice(0, 100) || null,
          userAgent: ua || null,
          device: parseDevice(ua),
          os: parseOS(ua),
          browser: parseBrowser(ua),
          page: req.path.slice(0, 500),
          referer: (req.headers.referer || null)?.slice(0, 500) || null,
          eventType: "pageview",
          metadata: null,
        })
        .execute();
    } catch {
      // Analytics must never crash the app
    }
  });
}
