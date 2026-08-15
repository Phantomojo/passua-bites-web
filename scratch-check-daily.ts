import { getDb } from "./server/db";
import { sql } from "drizzle-orm";

async function run() {
  const db = await getDb();
  const dailyRes = await db?.execute(sql`
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
        `);
  console.log(dailyRes?.rows || dailyRes);
  process.exit(0);
}
run();
