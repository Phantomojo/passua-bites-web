import { getDb } from "./server/db";
import { sql } from "drizzle-orm";

async function run() {
  const db = await getDb();
  if (!db) return;
  const result = await db.execute(sql`
    DELETE FROM "analyticsEvents" 
    WHERE "ip" = '::1' 
       OR "ip" = '::ffff:127.0.0.1' 
       OR "ip" = '127.0.0.1'
       OR "userAgent" LIKE '%curl%'
       OR "userAgent" LIKE '%HeadlessChrome%'
  `);
  console.log("Deleted simulated rows:", result.rowCount ?? result);
  process.exit(0);
}
run();
