import { getDb } from "./server/db";
import { sql } from "drizzle-orm";

async function run() {
  const db = await getDb();
  if (!db) return;

  const queries = [
        db.execute(sql`
          SELECT
            SUM(CASE WHEN "browser" != 'Bot/Crawler' THEN 1 ELSE 0 END) AS total_pageviews,
            COUNT(DISTINCT CASE WHEN "browser" != 'Bot/Crawler' THEN "sessionId" END) AS total_sessions,
            COUNT(DISTINCT CASE WHEN "browser" != 'Bot/Crawler' THEN "ip" END) AS unique_ips,
            SUM(CASE WHEN "browser" = 'Bot/Crawler' THEN 1 ELSE 0 END) AS bot_hits
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
            AND "browser" != 'Bot/Crawler'
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
            AND "browser" != 'Bot/Crawler'
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
            AND "browser" != 'Bot/Crawler'
          GROUP BY "device"
          ORDER BY sessions DESC
        `),
        db.execute(sql`
          SELECT
            COALESCE("country", 'Unknown')  AS country,
            COUNT(DISTINCT "ip")            AS visitors
          FROM "analyticsEvents"
          WHERE "createdAt" >= NOW() - INTERVAL '30 days'
            AND "browser" != 'Bot/Crawler'
          GROUP BY "country"
          ORDER BY visitors DESC
          LIMIT 10
        `),
        db.execute(sql`
          SELECT
            COALESCE("city", 'Unknown')  AS city,
            COUNT(DISTINCT "ip")         AS visitors
          FROM "analyticsEvents"
          WHERE "createdAt" >= NOW() - INTERVAL '30 days'
            AND "browser" != 'Bot/Crawler'
          GROUP BY "city"
          ORDER BY visitors DESC
          LIMIT 10
        `),
        db.execute(sql`
          SELECT
            COALESCE("browser", 'Other')    AS browser,
            COUNT(DISTINCT "sessionId")     AS sessions
          FROM "analyticsEvents"
          WHERE "createdAt" >= NOW() - INTERVAL '30 days'
            AND "browser" != 'Bot/Crawler'
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
            AND "browser" != 'Bot/Crawler'
          GROUP BY "referer"
          ORDER BY visits DESC
          LIMIT 8
        `)
  ];

  for (let i = 0; i < queries.length; i++) {
    try {
      await queries[i];
      console.log(`Query ${i} OK`);
    } catch (e: any) {
      console.log(`Query ${i} FAILED:`, e.message);
    }
  }
  process.exit(0);
}
run();
