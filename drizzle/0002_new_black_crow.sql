CREATE TABLE "analyticsEvents" (
	"id" serial PRIMARY KEY NOT NULL,
	"sessionId" varchar(64) NOT NULL,
	"ip" varchar(50),
	"country" varchar(4),
	"city" varchar(100),
	"userAgent" varchar(512),
	"device" varchar(20),
	"os" varchar(50),
	"browser" varchar(50),
	"page" varchar(500),
	"referer" varchar(500),
	"eventType" varchar(50) DEFAULT 'pageview' NOT NULL,
	"metadata" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
