ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "paymentReference" varchar(255);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "paymentSubmittedAt" timestamp;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "paymentVerifiedAt" timestamp;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "paymentVerifiedBy" varchar(320);
ALTER TABLE "orders" ALTER COLUMN "paymentMethod" SET DEFAULT 'pochi';
