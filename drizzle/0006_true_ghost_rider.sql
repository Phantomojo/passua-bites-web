-- Workstream 1 payment/order security migration (reviewed, not applied to production)
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "paidBy" varchar(64);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "paidAt" timestamp;
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "paymentReason" text;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uniq_mpesaTransactions_active_order" ON "mpesaTransactions" USING btree ("orderId") WHERE "mpesaTransactions"."status" IN ('initiating', 'pending', 'unknown');