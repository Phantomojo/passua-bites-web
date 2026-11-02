# Migration Safety Notes — Workstream 1

- Featured-column migration `drizzle/0005_living_penance.sql` (`ALTER TABLE menuItems ADD COLUMN featured`) was applied to the live Neon database during the earlier admin-enhancements work, before the Workstream 1 branch was created. No other Workstream 1 migration has been applied to production.
- Workstream 1 adds schema fields (`orders.paidBy`, `orders.paidAt`, `orders.paymentReason`) and a partial unique index recommendation for pending M-Pesa transactions. These are source-only changes; no production migration was run.
- Recommended DB changes (apply only after review):
  - `ALTER TABLE orders ADD COLUMN IF NOT EXISTS "paidBy" varchar(64);`
  - `ALTER TABLE orders ADD COLUMN IF NOT EXISTS "paidAt" timestamp;`
  - `ALTER TABLE orders ADD COLUMN IF NOT EXISTS "paymentReason" text;`
  - `CREATE UNIQUE INDEX IF NOT EXISTS idx_mpesa_pending_per_order ON "mpesaTransactions"("orderId") WHERE status = 'pending';`
- Payment token secret: prefer `ORDER_PAYMENT_TOKEN_SECRET`; falls back to `JWT_SECRET`/`COOKIE_SECRET` for compatibility. Rotate/set dedicated secret in production.
