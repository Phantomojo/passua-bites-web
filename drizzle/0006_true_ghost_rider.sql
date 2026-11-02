CREATE TABLE "adminUsers" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" varchar(64) NOT NULL,
	"passwordHash" varchar(255) NOT NULL,
	"name" text,
	"role" varchar(20) DEFAULT 'admin' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "adminUsers_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "announcements" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"body" text,
	"type" varchar(30) DEFAULT 'info' NOT NULL,
	"active" integer DEFAULT 1 NOT NULL,
	"startsAt" timestamp,
	"endsAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "channel" varchar(20) DEFAULT 'online' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "paidBy" varchar(64);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "paidAt" timestamp;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "paymentReason" text;--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_mpesaTransactions_active_order" ON "mpesaTransactions" USING btree ("orderId") WHERE "mpesaTransactions"."status" IN ('initiating', 'pending');