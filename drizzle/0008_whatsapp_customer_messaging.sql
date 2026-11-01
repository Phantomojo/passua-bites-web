ALTER TABLE "orders"
  ADD COLUMN IF NOT EXISTS "whatsappOrderUpdatesOptIn" boolean NOT NULL DEFAULT false;
--> statement-breakpoint
ALTER TABLE "orders"
  ADD COLUMN IF NOT EXISTS "whatsappOrderUpdatesOptInAt" timestamp;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "customerMessagingPreferences" (
  "id" serial PRIMARY KEY NOT NULL,
  "phone" varchar(20) NOT NULL,
  "whatsappMarketingOptIn" boolean DEFAULT false NOT NULL,
  "marketingOptInAt" timestamp,
  "marketingOptOutAt" timestamp,
  "marketingConsentSource" varchar(50),
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "customerMessagingPreferences_phone_unique" UNIQUE("phone")
);
