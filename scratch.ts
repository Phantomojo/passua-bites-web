import { getDb } from "./server/db";
import { sql } from "drizzle-orm";

async function run() {
  const db = await getDb();
  if (!db) return;
  const result = await db.execute(sql`
    SELECT "ip", "userAgent", "eventType", "page", "createdAt" 
    FROM "analyticsEvents" 
    ORDER BY "createdAt" DESC 
    LIMIT 20
  `);
  console.log(JSON.stringify(result.rows || result, null, 2));
  process.exit(0);
}
run();
