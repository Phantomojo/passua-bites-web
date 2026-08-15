-- PostgreSQL migration for Passua Bites
-- Run with: npx drizzle-kit push

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Menu items table
CREATE TABLE "menuItems" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "price" DECIMAL(10,2) NOT NULL,
  "imageUrl" TEXT,
  "category" VARCHAR(100),
  "available" INTEGER DEFAULT 1 NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Order items table
CREATE TABLE "orderItems" (
  "id" SERIAL PRIMARY KEY,
  "orderId" INTEGER NOT NULL,
  "menuItemId" INTEGER NOT NULL,
  "quantity" INTEGER NOT NULL,
  "priceAtTime" DECIMAL(10,2) NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Orders table
CREATE TABLE "orders" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER,
  "customerName" VARCHAR(255) NOT NULL,
  "customerPhone" VARCHAR(20) NOT NULL,
  "customerEmail" VARCHAR(320),
  "deliveryAddress" TEXT,
  "totalPrice" DECIMAL(10,2) NOT NULL,
  "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
  "paymentMethod" VARCHAR(50) NOT NULL DEFAULT 'mpesa',
  "paymentStatus" VARCHAR(20) NOT NULL DEFAULT 'pending',
  "mpesaTransactionId" VARCHAR(255),
  "notes" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Reviews table
CREATE TABLE "reviews" (
  "id" SERIAL PRIMARY KEY,
  "orderId" INTEGER,
  "menuItemId" INTEGER,
  "userId" INTEGER,
  "customerName" VARCHAR(255) NOT NULL,
  "rating" INTEGER NOT NULL,
  "reviewText" TEXT,
  "approved" INTEGER DEFAULT 0 NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Site settings table
CREATE TABLE "siteSettings" (
  "id" SERIAL PRIMARY KEY,
  "key" VARCHAR(100) NOT NULL UNIQUE,
  "value" TEXT NOT NULL,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Seed menu items
INSERT INTO "menuItems" ("name", "description", "price", "category", "available") VALUES
('Passua Smocha', 'Chapati, beef smokie, kachumbari, indomie, avocado, seasoned with sauces', 110, 'smoshas', 1),
('Zigizaga', 'Chapati, beef smokie, kachumbari, indomie, avocado, topped with a boiled egg, seasoned with sauces', 140, 'smoshas', 1),
('Burger', 'Buns, lettuce, sliced kachumbari, sauces, beef pattie', 150, 'burgers', 1),
('Masala Chips', 'Crunchy outside, soft inside fries, well marinated — spicy or non-spicy', 150, 'sides', 1),
('Hot Blazer', 'Two chapatis (wrapped), lettuce, kachumbari, boerewors, indomie, avocado, gravy sauce', 200, 'specials', 1),
('Sultan', 'Two chapatis (wrapped), lettuce, kachumbari, one beef pattie, masala chips, avocado, sauces — comes with a soda', 270, 'combos', 1),
('Pasua Corn', 'One beef burger + masala chips (spicy or non-spicy)', 300, 'sides', 1),
('Mega Sultan', 'Two chapatis (wrapped), lettuce, kachumbari, two beef patties, cheese, masala chips, avocado, sauces — comes with a soda', 560, 'combos', 1);

-- Seed site settings
INSERT INTO "siteSettings" ("key", "value") VALUES
('displacementMessage', 'We are currently displaced due to road expansion. Order via Bolt Food or WhatsApp!'),
('businessPhone', '0722473873'),
('whatsappPhone', '254722473873'),
('location', 'Opp Rainbow Resort, Ruiru');