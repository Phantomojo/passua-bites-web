CREATE TABLE "mpesaCallbackEvents" (
	"id" serial PRIMARY KEY NOT NULL,
	"idempotencyKey" varchar(255) NOT NULL,
	"payload" text NOT NULL,
	"receivedAt" timestamp DEFAULT now() NOT NULL,
	"status" varchar(20) DEFAULT 'received' NOT NULL,
	"processedAt" timestamp,
	"error" text,
	CONSTRAINT "mpesaCallbackEvents_idempotencyKey_unique" UNIQUE("idempotencyKey")
);
--> statement-breakpoint
DROP INDEX "uniq_mpesaTransactions_active_order";--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_mpesaTransactions_active_order" ON "mpesaTransactions" USING btree ("orderId") WHERE "mpesaTransactions"."status" IN ('initiating', 'pending', 'unknown');