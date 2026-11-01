import { appRouter } from "./server/routers/index";
import { getDb } from "./server/db";
import { sql } from "drizzle-orm";

async function run() {
  const db = await getDb();
  
  // order insights queries
        const summaryRes = await db?.execute(sql`
          SELECT
            SUM("totalPrice") AS total_revenue,
            COUNT(*)          AS total_orders,
            AVG("totalPrice") AS avg_order_value,
            (SELECT COUNT(*) FROM "orders" WHERE "userId" IN (
              SELECT "userId" FROM "orders" WHERE "userId" IS NOT NULL GROUP BY "userId" HAVING COUNT(*) > 1
            )) AS repeat_customers,
            (SELECT COUNT(DISTINCT "userId") FROM "orders" WHERE "userId" IS NOT NULL) AS total_customers
          FROM "orders"
          WHERE "status" IN ('delivered', 'ready', 'preparing')
            AND "createdAt" >= NOW() - INTERVAL '30 days'
        `);
        console.log("SummaryRes", summaryRes?.rows || summaryRes);
  process.exit(0);
}
run();
