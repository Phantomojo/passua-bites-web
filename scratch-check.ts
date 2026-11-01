import { getDb } from "./server/db";
import { sql } from "drizzle-orm";

async function run() {
  const db = await getDb();
  const result = await db?.execute(sql`SELECT "userAgent", "page" FROM "analyticsEvents" ORDER BY "createdAt" DESC LIMIT 5`);
  console.log(result?.rows || result);
  process.exit(0);
}
run();
