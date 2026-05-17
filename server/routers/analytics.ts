import { adminProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { sql } from "drizzle-orm";
import { analyticsEvents } from "../../drizzle/schema";
import { z } from "zod";
import { createHash } from "crypto";

function rows(result: any): any[] {
  return result?.rows ?? result ?? [];
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

function getClientIp(req: any): string {
  const fwd = req.headers?.["x-forwarded-for"];
  if (fwd) {
    const first = Array.isArray(fwd) ? fwd[0] : fwd;
    return first.split(",")[0].trim().slice(0, 50);
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

export const analyticsRouter = router({

  recordPageview: publicProcedure
    .input(z.object({
      page: z.string().max(500),
      referrer: z.string().max(500).nullable().optional(),
      userAgent: z.string().max(512).nullable().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return { success: false };

      const ua = input.userAgent || "";
      const ip = getClientIp(ctx.req);
      const referrer = input.referrer || null;

      try {
        await db.insert(analyticsEvents).values({
          sessionId: makeSessionId(ip, ua),
          ip: ip.slice(0, 50),
          userAgent: ua?.slice(0, 512) || null,
          device: parseDevice(ua),
          os: parseOS(ua),
          browser: parseBrowser(ua),
          page: input.page,
          referer: referrer?.slice(0, 500) || null,
          eventType: "pageview",
          metadata: null,
        }).execute();
      } catch {
        // Analytics must never crash
      }

      return { success: true };
    }),

  getTraffic: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return null;

    const [summaryRes, dailyRes, pagesRes, devicesRes, countriesRes, browsersRes, referrersRes] =
      await Promise.all([

        db.execute(sql`
          SELECT
            COUNT(*)                        AS total_pageviews,
            COUNT(DISTINCT "sessionId")     AS total_sessions,
            COUNT(DISTINCT "ip")            AS unique_ips
          FROM "analyticsEvents"
          WHERE "createdAt" >= NOW() - INTERVAL '30 days'
            AND "eventType" = 'pageview'
        `),

        db.execute(sql`
          SELECT
            DATE("createdAt")               AS date,
            COUNT(*)                        AS pageviews,
            COUNT(DISTINCT "sessionId")     AS sessions,
            COUNT(DISTINCT "ip")            AS visitors
          FROM "analyticsEvents"
          WHERE "createdAt" >= NOW() - INTERVAL '30 days'
            AND "eventType" = 'pageview'
          GROUP BY DATE("createdAt")
          ORDER BY date ASC
        `),

        db.execute(sql`
          SELECT
            "page",
            COUNT(*) AS views
          FROM "analyticsEvents"
          WHERE "createdAt" >= NOW() - INTERVAL '30 days'
            AND "eventType" = 'pageview'
            AND "page" IS NOT NULL
          GROUP BY "page"
          ORDER BY views DESC
          LIMIT 10
        `),

        db.execute(sql`
          SELECT
            COALESCE("device", 'unknown')   AS device,
            COUNT(DISTINCT "sessionId")     AS sessions
          FROM "analyticsEvents"
          WHERE "createdAt" >= NOW() - INTERVAL '30 days'
          GROUP BY "device"
          ORDER BY sessions DESC
        `),

        db.execute(sql`
          SELECT
            COALESCE("country", 'Unknown')  AS country,
            COUNT(DISTINCT "ip")            AS visitors
          FROM "analyticsEvents"
          WHERE "createdAt" >= NOW() - INTERVAL '30 days'
          GROUP BY "country"
          ORDER BY visitors DESC
          LIMIT 10
        `),

        db.execute(sql`
          SELECT
            COALESCE("browser", 'Other')    AS browser,
            COUNT(DISTINCT "sessionId")     AS sessions
          FROM "analyticsEvents"
          WHERE "createdAt" >= NOW() - INTERVAL '30 days'
          GROUP BY "browser"
          ORDER BY sessions DESC
        `),

        db.execute(sql`
          SELECT
            COALESCE("referer", 'Direct')   AS source,
            COUNT(*)                        AS visits
          FROM "analyticsEvents"
          WHERE "createdAt" >= NOW() - INTERVAL '30 days'
            AND "eventType" = 'pageview'
          GROUP BY "referer"
          ORDER BY visits DESC
          LIMIT 8
        `),
      ]);

    const s = rows(summaryRes)[0] ?? {};

    return {
      summary: {
        totalPageviews: Number(s.total_pageviews ?? 0),
        totalSessions:  Number(s.total_sessions  ?? 0),
        uniqueVisitors: Number(s.unique_ips       ?? 0),
      },
      daily: rows(dailyRes).map((r: any) => ({
        date:      String(r.date).slice(0, 10),
        pageviews: Number(r.pageviews),
        sessions:  Number(r.sessions),
        visitors:  Number(r.visitors),
      })),
      topPages: rows(pagesRes).map((r: any) => ({
        page:  r.page as string,
        views: Number(r.views),
      })),
      devices: rows(devicesRes).map((r: any) => ({
        device:   r.device as string,
        sessions: Number(r.sessions),
      })),
      countries: rows(countriesRes).map((r: any) => ({
        country:  r.country as string,
        visitors: Number(r.visitors),
      })),
      browsers: rows(browsersRes).map((r: any) => ({
        browser:  r.browser as string,
        sessions: Number(r.sessions),
      })),
      referrers: rows(referrersRes).map((r: any) => ({
        source: r.source as string,
        visits: Number(r.visits),
      })),
    };
  }),

  getOrderInsights: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return null;

    const [revenueRes, topItemsRes, peakRes, aovRes, repeatRes, statusRes] =
      await Promise.all([

        db.execute(sql`
          SELECT
            DATE("createdAt")                   AS date,
            COUNT(*)                            AS order_count,
            SUM("totalPrice"::numeric)          AS revenue
          FROM "orders"
          WHERE "createdAt" >= NOW() - INTERVAL '30 days'
            AND "paymentStatus" = 'completed'
          GROUP BY DATE("createdAt")
          ORDER BY date ASC
        `),

        db.execute(sql`
          SELECT
            m.name,
            SUM(oi.quantity)                                AS units,
            SUM(oi.quantity * oi."priceAtTime"::numeric)    AS revenue
          FROM "orderItems" oi
          JOIN "menuItems"  m ON m.id = oi."menuItemId"
          JOIN "orders"     o ON o.id = oi."orderId"
          WHERE o."createdAt" >= NOW() - INTERVAL '30 days'
          GROUP BY m.name
          ORDER BY revenue DESC
          LIMIT 8
        `),

        db.execute(sql`
          SELECT
            EXTRACT(HOUR FROM "createdAt")::int AS hour,
            COUNT(*)                            AS orders
          FROM "orders"
          WHERE "createdAt" >= NOW() - INTERVAL '30 days'
          GROUP BY hour
          ORDER BY hour ASC
        `),

        db.execute(sql`
          SELECT
            ROUND(AVG("totalPrice"::numeric), 2)  AS avg_order_value,
            COUNT(*)                              AS total_orders,
            SUM("totalPrice"::numeric)            AS total_revenue
          FROM "orders"
          WHERE "paymentStatus" = 'completed'
        `),

        db.execute(sql`
          SELECT
            COUNT(*)                                                AS total_customers,
            SUM(CASE WHEN order_count > 1 THEN 1 ELSE 0 END)       AS repeat_customers
          FROM (
            SELECT "customerPhone", COUNT(*) AS order_count
            FROM "orders"
            GROUP BY "customerPhone"
          ) sub
        `),

        db.execute(sql`
          SELECT "status", COUNT(*) AS count
          FROM "orders"
          GROUP BY "status"
          ORDER BY count DESC
        `),
      ]);

    const aov    = rows(aovRes)[0]    ?? {};
    const repeat = rows(repeatRes)[0] ?? {};
    const total  = Number(repeat.total_customers  ?? 0);
    const rpt    = Number(repeat.repeat_customers ?? 0);

    const peakMap = new Map<number, number>();
    rows(peakRes).forEach((r: any) => peakMap.set(Number(r.hour), Number(r.orders)));
    const peakHours = Array.from({ length: 24 }, (_, h) => ({
      hour:   h,
      label:  `${String(h).padStart(2, "0")}:00`,
      orders: peakMap.get(h) ?? 0,
    }));

    return {
      revenueTrend: rows(revenueRes).map((r: any) => ({
        date:    String(r.date).slice(0, 10),
        orders:  Number(r.order_count),
        revenue: Number(r.revenue ?? 0),
      })),
      topItems: rows(topItemsRes).map((r: any) => ({
        name:    r.name as string,
        units:   Number(r.units),
        revenue: Number(r.revenue ?? 0),
      })),
      peakHours,
      summary: {
        avgOrderValue: Number(aov.avg_order_value ?? 0),
        totalOrders:   Number(aov.total_orders    ?? 0),
        totalRevenue:  Number(aov.total_revenue   ?? 0),
        repeatRate:    total > 0 ? Math.round((rpt / total) * 100) : 0,
      },
      statusBreakdown: rows(statusRes).map((r: any) => ({
        status: r.status as string,
        count:  Number(r.count),
      })),
    };
  }),
});
