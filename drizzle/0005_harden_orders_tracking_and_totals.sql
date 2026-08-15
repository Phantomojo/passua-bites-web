ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "trackingToken" varchar(64);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "subtotal" numeric(10,2);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "deliveryFee" numeric(10,2);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "deliveryZone" varchar(20);

UPDATE "orders"
SET
  "trackingToken" = md5(concat("id", '-', random(), '-', clock_timestamp()::text)),
  "subtotal" = COALESCE("subtotal", "totalPrice"),
  "deliveryFee" = COALESCE("deliveryFee", 0),
  "deliveryZone" = COALESCE("deliveryZone", 'ruiru')
WHERE "trackingToken" IS NULL
   OR "subtotal" IS NULL
   OR "deliveryFee" IS NULL
   OR "deliveryZone" IS NULL;

ALTER TABLE "orders" ALTER COLUMN "trackingToken" SET NOT NULL;
ALTER TABLE "orders" ALTER COLUMN "subtotal" SET NOT NULL;
ALTER TABLE "orders" ALTER COLUMN "deliveryFee" SET NOT NULL;
ALTER TABLE "orders" ALTER COLUMN "deliveryZone" SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'orders_trackingToken_unique'
  ) THEN
    ALTER TABLE "orders"
      ADD CONSTRAINT "orders_trackingToken_unique" UNIQUE ("trackingToken");
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "idx_orders_trackingToken"
  ON "orders" ("trackingToken");
--> statement-breakpoint
