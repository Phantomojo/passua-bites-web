# Migration Safety Notes — Workstream 1

- Featured-column migration `drizzle/0005_living_penance.sql` (`ALTER TABLE menuItems ADD COLUMN featured`) was applied to the live Neon database during the earlier admin-enhancements work, before the Workstream 1 branch was created. No other Workstream 1 migration has been applied to production.
- Workstream 1 adds schema fields (`orders.paidBy`, `orders.paidAt`, `orders.paymentReason`) and a partial unique index for active M-Pesa transactions. These are source-only changes; no production migration was run.
- Reviewed migration file: `drizzle/0006_true_ghost_rider.sql`.
- Migration contents:
  - `ALTER TABLE orders ADD COLUMN IF NOT EXISTS "paidBy" varchar(64);`
  - `ALTER TABLE orders ADD COLUMN IF NOT EXISTS "paidAt" timestamp;`
  - `ALTER TABLE orders ADD COLUMN IF NOT EXISTS "paymentReason" text;`
  - `CREATE UNIQUE INDEX IF NOT EXISTS "uniq_mpesaTransactions_active_order" ON "mpesaTransactions" USING btree ("orderId") WHERE "mpesaTransactions"."status" IN ('initiating', 'pending', 'unknown');`
- Active M-Pesa attempt statuses protected by the unique index: `initiating`, `pending`, `unknown`.
- Pre-migration check (run before applying):
  ```sql
  SELECT "orderId", COUNT(*) AS active_count
  FROM "mpesaTransactions"
  WHERE "status" IN ('initiating', 'pending', 'unknown')
  GROUP BY "orderId"
  HAVING COUNT(*) > 1;
  ```
  If any rows are returned, resolve duplicate active attempts before creating the unique index.
- Payment token secret: `ORDER_PAYMENT_TOKEN_SECRET` is required in production and the application fails closed if it is missing. Development-only fallback to `JWT_SECRET`/`COOKIE_SECRET`/dev secret remains for local development.
- Do not apply this migration to production as part of this review.
