import { getDb } from "./server/db";
import { sql } from "drizzle-orm";

async function run() {
  const db = await getDb();
  const summaryRes = await db?.execute(sql`
          SELECT
            SUM(CASE WHEN "browser" != 'Bot/Crawler' THEN 1 ELSE 0 END) AS total_pageviews,
            COUNT(DISTINCT CASE WHEN "browser" != 'Bot/Crawler' THEN "sessionId" END) AS total_sessions,
            COUNT(DISTINCT CASE WHEN "browser" != 'Bot/Crawler' THEN "ip" END) AS unique_ips,
            SUM(CASE WHEN "browser" = 'Bot/Crawler' THEN 1 ELSE 0 END) AS bot_hits
          FROM "analyticsEvents"
          WHERE 1=0
        `);
  const s = summaryRes?.rows?.[0] ?? summaryRes?.[0] ?? summaryRes;
  console.log(s);
  process.exit(0);
}
run();
