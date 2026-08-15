CREATE TABLE "menuItems" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"price" numeric(10, 2) NOT NULL,
	"imageUrl" text,
	"category" varchar(100),
	"available" integer DEFAULT 1 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mpesaTransactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"orderId" integer NOT NULL,
	"checkoutRequestID" varchar(255) NOT NULL,
	"merchantRequestID" varchar(255),
	"mpesaReceiptNumber" varchar(255),
	"phoneNumber" varchar(20) NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"accountReference" varchar(12) NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"resultCode" integer,
	"resultDesc" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "mpesaTransactions_checkoutRequestID_unique" UNIQUE("checkoutRequestID")
);
--> statement-breakpoint
CREATE TABLE "orderItems" (
	"id" serial PRIMARY KEY NOT NULL,
	"orderId" integer NOT NULL,
	"menuItemId" integer NOT NULL,
	"quantity" integer NOT NULL,
	"priceAtTime" numeric(10, 2) NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer,
	"customerName" varchar(255) NOT NULL,
	"customerPhone" varchar(20) NOT NULL,
	"customerEmail" varchar(320),
	"deliveryAddress" text,
	"totalPrice" numeric(10, 2) NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"paymentMethod" varchar(50) DEFAULT 'mpesa' NOT NULL,
	"paymentStatus" varchar(20) DEFAULT 'pending' NOT NULL,
	"mpesaTransactionId" varchar(255),
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"orderId" integer,
	"menuItemId" integer,
	"userId" integer,
	"customerName" varchar(255) NOT NULL,
	"rating" integer NOT NULL,
	"reviewText" text,
	"approved" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "siteSettings" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar(100) NOT NULL,
	"value" text NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "siteSettings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" varchar(20) DEFAULT 'user' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
