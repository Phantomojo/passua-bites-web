import {
  decimal,
  serial,
  pgTable,
  text,
  timestamp,
  varchar,
  integer,
} from "drizzle-orm/pg-core";

/**
 * Core user table backing auth flow.
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: varchar("role", { length: 20 }).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Menu items table for Passua Bites
 */
export const menuItems = pgTable("menuItems", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  imageUrl: text("imageUrl"),
  videoUrl: text("videoUrl"),
  category: varchar("category", { length: 100 }),
  available: integer("available").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type MenuItem = typeof menuItems.$inferSelect;
export type InsertMenuItem = typeof menuItems.$inferInsert;

/**
 * Orders table for tracking customer orders
 */
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("userId"),
  customerName: varchar("customerName", { length: 255 }).notNull(),
  customerPhone: varchar("customerPhone", { length: 20 }).notNull(),
  customerEmail: varchar("customerEmail", { length: 320 }),
  deliveryAddress: text("deliveryAddress"),
  totalPrice: decimal("totalPrice", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status", { length: 20 }).default("pending").notNull(),
  paymentMethod: varchar("paymentMethod", { length: 50 })
    .default("mpesa")
    .notNull(),
  paymentStatus: varchar("paymentStatus", { length: 20 })
    .default("pending")
    .notNull(),
  mpesaTransactionId: varchar("mpesaTransactionId", { length: 255 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

/**
 * Order items table (line items for each order)
 */
export const orderItems = pgTable("orderItems", {
  id: serial("id").primaryKey(),
  orderId: integer("orderId").notNull(),
  menuItemId: integer("menuItemId").notNull(),
  quantity: integer("quantity").notNull(),
  priceAtTime: decimal("priceAtTime", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = typeof orderItems.$inferInsert;

/**
 * Reviews and ratings table
 */
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  orderId: integer("orderId"),
  menuItemId: integer("menuItemId"),
  userId: integer("userId"),
  customerName: varchar("customerName", { length: 255 }).notNull(),
  rating: integer("rating").notNull(),
  reviewText: text("reviewText"),
  approved: integer("approved").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Review = typeof reviews.$inferSelect;
export type InsertReview = typeof reviews.$inferInsert;

/**
 * Site settings table for displacement banner, business info, etc.
 */
export const siteSettings = pgTable("siteSettings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type SiteSetting = typeof siteSettings.$inferSelect;
export type InsertSiteSetting = typeof siteSettings.$inferInsert;

/**
 * M-Pesa transactions table for payment tracking
 */
export const mpesaTransactions = pgTable("mpesaTransactions", {
  id: serial("id").primaryKey(),
  orderId: integer("orderId").notNull(),
  checkoutRequestID: varchar("checkoutRequestID", { length: 255 })
    .notNull()
    .unique(),
  merchantRequestID: varchar("merchantRequestID", { length: 255 }),
  mpesaReceiptNumber: varchar("mpesaReceiptNumber", { length: 255 }),
  phoneNumber: varchar("phoneNumber", { length: 20 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  accountReference: varchar("accountReference", { length: 12 }).notNull(),
  status: varchar("status", { length: 20 }).default("pending").notNull(),
  resultCode: integer("resultCode"),
  resultDesc: text("resultDesc"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type MpesaTransaction = typeof mpesaTransactions.$inferSelect;
export type InsertMpesaTransaction = typeof mpesaTransactions.$inferInsert;

/**
 * Analytics events table — passive traffic + behaviour tracking (no external service)
 */
export const analyticsEvents = pgTable("analyticsEvents", {
  id: serial("id").primaryKey(),
  sessionId: varchar("sessionId", { length: 64 }).notNull(),
  ip: varchar("ip", { length: 50 }),
  country: varchar("country", { length: 4 }),
  city: varchar("city", { length: 100 }),
  userAgent: varchar("userAgent", { length: 512 }),
  device: varchar("device", { length: 20 }),
  os: varchar("os", { length: 50 }),
  browser: varchar("browser", { length: 50 }),
  page: varchar("page", { length: 500 }),
  referer: varchar("referer", { length: 500 }),
  eventType: varchar("eventType", { length: 50 }).default("pageview").notNull(),
  metadata: text("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type InsertAnalyticsEvent = typeof analyticsEvents.$inferInsert;
