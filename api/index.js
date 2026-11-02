var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// shared/const.ts
var COOKIE_NAME, ONE_YEAR_MS, AXIOS_TIMEOUT_MS, UNAUTHED_ERR_MSG, NOT_ADMIN_ERR_MSG;
var init_const = __esm({
  "shared/const.ts"() {
    "use strict";
    COOKIE_NAME = "app_session_id";
    ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
    AXIOS_TIMEOUT_MS = 3e4;
    UNAUTHED_ERR_MSG = "Please login (10001)";
    NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";
  }
});

// server/logger.ts
import pino from "pino";
var level, logger;
var init_logger = __esm({
  "server/logger.ts"() {
    "use strict";
    level = process.env.LOG_LEVEL || (process.env.NODE_ENV === "production" ? "info" : "debug");
    logger = pino({
      level,
      transport: process.env.NODE_ENV !== "production" ? { target: "pino/file", options: { destination: 1 } } : void 0,
      formatters: {
        level(label) {
          return { level: label };
        }
      },
      timestamp: pino.stdTimeFunctions.isoTime,
      redact: [
        "req.headers.authorization",
        "req.headers.cookie",
        "*.password",
        "*.token",
        "*.secret"
      ]
    });
  }
});

// server/_core/env.ts
var ENV;
var init_env = __esm({
  "server/_core/env.ts"() {
    "use strict";
    ENV = {
      appId: process.env.VITE_APP_ID ?? "",
      cookieSecret: process.env.JWT_SECRET ?? "",
      databaseUrl: process.env.DATABASE_URL ?? "",
      oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
      ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
      isProduction: process.env.NODE_ENV === "production",
      forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
      forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? ""
    };
  }
});

// server/_core/trpc.ts
import { initTRPC, TRPCError as TRPCError2 } from "@trpc/server";
import superjson from "superjson";
var t, router, publicProcedure, requireUser, protectedProcedure, adminProcedure;
var init_trpc = __esm({
  "server/_core/trpc.ts"() {
    "use strict";
    init_const();
    t = initTRPC.context().create({
      transformer: superjson
    });
    router = t.router;
    publicProcedure = t.procedure;
    requireUser = t.middleware(async (opts) => {
      const { ctx, next } = opts;
      if (!ctx.user) {
        throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
      }
      return next({
        ctx: {
          ...ctx,
          user: ctx.user
        }
      });
    });
    protectedProcedure = t.procedure.use(requireUser);
    adminProcedure = t.procedure.use(
      t.middleware(async (opts) => {
        const { ctx, next } = opts;
        if (!ctx.user || ctx.user.role !== "admin") {
          throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
        }
        return next({
          ctx: {
            ...ctx,
            user: ctx.user
          }
        });
      })
    );
  }
});

// drizzle/schema.ts
var schema_exports = {};
__export(schema_exports, {
  adminUsers: () => adminUsers,
  analyticsEvents: () => analyticsEvents,
  announcements: () => announcements,
  menuItems: () => menuItems,
  mpesaCallbackEvents: () => mpesaCallbackEvents,
  mpesaTransactions: () => mpesaTransactions,
  orderItems: () => orderItems,
  orders: () => orders,
  reviews: () => reviews,
  siteSettings: () => siteSettings,
  users: () => users
});
import { sql } from "drizzle-orm";
import {
  decimal,
  index,
  uniqueIndex,
  serial,
  pgTable,
  text,
  timestamp,
  varchar,
  integer
} from "drizzle-orm/pg-core";
var users, menuItems, orders, orderItems, reviews, siteSettings, mpesaTransactions, analyticsEvents, announcements, adminUsers, mpesaCallbackEvents;
var init_schema = __esm({
  "drizzle/schema.ts"() {
    "use strict";
    users = pgTable("users", {
      id: serial("id").primaryKey(),
      openId: varchar("openId", { length: 64 }).notNull().unique(),
      name: text("name"),
      email: varchar("email", { length: 320 }),
      loginMethod: varchar("loginMethod", { length: 64 }),
      role: varchar("role", { length: 20 }).default("user").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull(),
      lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull()
    });
    menuItems = pgTable("menuItems", {
      id: serial("id").primaryKey(),
      name: varchar("name", { length: 255 }).notNull(),
      description: text("description"),
      price: decimal("price", { precision: 10, scale: 2 }).notNull(),
      imageUrl: text("imageUrl"),
      videoUrl: text("videoUrl"),
      category: varchar("category", { length: 100 }),
      available: integer("available").default(1).notNull(),
      featured: integer("featured").default(0).notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    orders = pgTable("orders", {
      id: serial("id").primaryKey(),
      userId: integer("userId"),
      customerName: varchar("customerName", { length: 255 }).notNull(),
      customerPhone: varchar("customerPhone", { length: 20 }).notNull(),
      customerEmail: varchar("customerEmail", { length: 320 }),
      deliveryAddress: text("deliveryAddress"),
      totalPrice: decimal("totalPrice", { precision: 10, scale: 2 }).notNull(),
      status: varchar("status", { length: 20 }).default("pending").notNull(),
      paymentMethod: varchar("paymentMethod", { length: 50 }).default("mpesa").notNull(),
      paymentStatus: varchar("paymentStatus", { length: 20 }).default("pending").notNull(),
      channel: varchar("channel", { length: 20 }).default("online").notNull(),
      paidBy: varchar("paidBy", { length: 64 }),
      paidAt: timestamp("paidAt"),
      paymentReason: text("paymentReason"),
      mpesaTransactionId: varchar("mpesaTransactionId", { length: 255 }),
      notes: text("notes"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    }, (t2) => [index("idx_orders_userId").on(t2.userId)]);
    orderItems = pgTable("orderItems", {
      id: serial("id").primaryKey(),
      orderId: integer("orderId").notNull(),
      menuItemId: integer("menuItemId").notNull(),
      quantity: integer("quantity").notNull(),
      priceAtTime: decimal("priceAtTime", { precision: 10, scale: 2 }).notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    reviews = pgTable("reviews", {
      id: serial("id").primaryKey(),
      orderId: integer("orderId"),
      menuItemId: integer("menuItemId"),
      userId: integer("userId"),
      customerName: varchar("customerName", { length: 255 }).notNull(),
      rating: integer("rating").notNull(),
      reviewText: text("reviewText"),
      approved: integer("approved").default(0).notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    siteSettings = pgTable("siteSettings", {
      id: serial("id").primaryKey(),
      key: varchar("key", { length: 100 }).notNull().unique(),
      value: text("value").notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    mpesaTransactions = pgTable("mpesaTransactions", {
      id: serial("id").primaryKey(),
      orderId: integer("orderId").notNull(),
      checkoutRequestID: varchar("checkoutRequestID", { length: 255 }).notNull().unique(),
      merchantRequestID: varchar("merchantRequestID", { length: 255 }),
      mpesaReceiptNumber: varchar("mpesaReceiptNumber", { length: 255 }),
      phoneNumber: varchar("phoneNumber", { length: 20 }).notNull(),
      amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
      accountReference: varchar("accountReference", { length: 12 }).notNull(),
      status: varchar("status", { length: 20 }).default("pending").notNull(),
      resultCode: integer("resultCode"),
      resultDesc: text("resultDesc"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    }, (t2) => [
      index("idx_mpesaTransactions_orderId").on(t2.orderId),
      uniqueIndex("uniq_mpesaTransactions_active_order").on(t2.orderId).where(sql`${t2.status} IN ('initiating', 'pending', 'unknown')`)
    ]);
    analyticsEvents = pgTable("analyticsEvents", {
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
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    announcements = pgTable("announcements", {
      id: serial("id").primaryKey(),
      title: varchar("title", { length: 255 }).notNull(),
      body: text("body"),
      type: varchar("type", { length: 30 }).default("info").notNull(),
      active: integer("active").default(1).notNull(),
      startsAt: timestamp("startsAt"),
      endsAt: timestamp("endsAt"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    adminUsers = pgTable("adminUsers", {
      id: serial("id").primaryKey(),
      username: varchar("username", { length: 64 }).notNull().unique(),
      passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
      name: text("name"),
      role: varchar("role", { length: 20 }).default("admin").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    mpesaCallbackEvents = pgTable("mpesaCallbackEvents", {
      id: serial("id").primaryKey(),
      idempotencyKey: varchar("idempotencyKey", { length: 255 }).notNull().unique(),
      payload: text("payload").notNull(),
      receivedAt: timestamp("receivedAt").defaultNow().notNull(),
      status: varchar("status", { length: 20 }).default("received").notNull(),
      processedAt: timestamp("processedAt"),
      error: text("error")
    });
  }
});

// server/db.ts
var db_exports = {};
__export(db_exports, {
  createOrder: () => createOrder,
  createReview: () => createReview,
  getAllMenuItems: () => getAllMenuItems,
  getAllOrders: () => getAllOrders,
  getAllSiteSettings: () => getAllSiteSettings,
  getDb: () => getDb,
  getMenuItemById: () => getMenuItemById,
  getOrderById: () => getOrderById,
  getReviewsByMenuItem: () => getReviewsByMenuItem,
  getSiteSetting: () => getSiteSetting,
  getUserByOpenId: () => getUserByOpenId,
  setSiteSetting: () => setSiteSetting,
  upsertUser: () => upsertUser
});
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const sql5 = neon(process.env.DATABASE_URL);
      _db = drizzle(sql5);
    } catch (error) {
      logger.warn({ err: error }, "[Database] Failed to connect");
      _db = null;
    }
  }
  return _db;
}
async function upsertUser(user) {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  const db = await getDb();
  if (!db) {
    logger.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const values = {
      openId: user.openId
    };
    const updateSet = {};
    const textFields = ["name", "email", "loginMethod"];
    const assignNullable = (field) => {
      const value = user[field];
      if (value === void 0) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== void 0) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== void 0) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }
    if (!values.lastSignedIn) {
      values.lastSignedIn = /* @__PURE__ */ new Date();
    }
    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = /* @__PURE__ */ new Date();
    }
    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet
    });
  } catch (error) {
    logger.error({ err: error }, "[Database] Failed to upsert user");
    throw error;
  }
}
async function getUserByOpenId(openId) {
  const db = await getDb();
  if (!db) {
    logger.warn("[Database] Cannot get user: database not available");
    return void 0;
  }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getAllMenuItems() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(menuItems).execute();
}
async function getMenuItemById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(menuItems).where(eq(menuItems.id, id)).limit(1).execute();
  return result.length > 0 ? result[0] : void 0;
}
async function createOrder(order) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(orders).values(order).execute();
  return result;
}
async function getOrderById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(orders).where(eq(orders.id, id)).limit(1).execute();
  return result.length > 0 ? result[0] : void 0;
}
async function getAllOrders() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orders).execute();
}
async function createReview(review) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(reviews).values(review).execute();
}
async function getReviewsByMenuItem(menuItemId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(reviews).where(eq(reviews.menuItemId, menuItemId)).execute();
}
async function getSiteSetting(key) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(siteSettings).where(eq(siteSettings.key, key)).limit(1).execute();
  return result.length > 0 ? result[0] : void 0;
}
async function setSiteSetting(key, value) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await getSiteSetting(key);
  if (existing) {
    await db.update(siteSettings).set({ value }).where(eq(siteSettings.key, key)).execute();
  } else {
    await db.insert(siteSettings).values({ key, value }).execute();
  }
}
async function getAllSiteSettings() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(siteSettings).execute();
}
var _db;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_schema();
    init_env();
    init_logger();
    _db = null;
  }
});

// server/_core/paymentToken.ts
import crypto from "crypto";
function getSecret() {
  const isProduction2 = process.env.NODE_ENV === "production";
  const secret = process.env.ORDER_PAYMENT_TOKEN_SECRET;
  if (isProduction2) {
    if (!secret || secret.trim() === "") {
      throw new Error("ORDER_PAYMENT_TOKEN_SECRET is required in production");
    }
    return secret.trim();
  }
  return (secret || process.env.JWT_SECRET || process.env.COOKIE_SECRET || "dev-payment-token-secret").trim();
}
function encodePayload(payload) {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}
function signOrderPaymentToken(orderId, expiresInMs = DEFAULT_TTL_MS) {
  const payload = {
    v: TOKEN_VERSION,
    p: TOKEN_PURPOSE,
    o: orderId,
    exp: Date.now() + expiresInMs
  };
  const encoded = encodePayload(payload);
  const hmac = crypto.createHmac("sha256", getSecret()).update(encoded).digest("base64url");
  return `${encoded}.${hmac}`;
}
function verifyOrderPaymentToken(token, orderId) {
  if (typeof token !== "string" || token.indexOf(".") === -1) return false;
  const [encoded, hmac] = token.split(".");
  if (!encoded || !hmac) return false;
  let payload;
  try {
    payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
  } catch {
    return false;
  }
  if (!payload || typeof payload !== "object") return false;
  if (payload.v !== TOKEN_VERSION) return false;
  if (payload.p !== TOKEN_PURPOSE) return false;
  if (payload.o !== orderId) return false;
  if (typeof payload.exp !== "number" || !Number.isFinite(payload.exp)) return false;
  if (Date.now() > payload.exp) return false;
  const expected = crypto.createHmac("sha256", getSecret()).update(encoded).digest("base64url");
  const a = Buffer.from(hmac);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
var TOKEN_VERSION, TOKEN_PURPOSE, DEFAULT_TTL_MS;
var init_paymentToken = __esm({
  "server/_core/paymentToken.ts"() {
    "use strict";
    TOKEN_VERSION = 1;
    TOKEN_PURPOSE = "order_payment";
    DEFAULT_TTL_MS = 2 * 60 * 60 * 1e3;
  }
});

// server/routers/payments.ts
import crypto2 from "crypto";
import { z as z3 } from "zod";
import { eq as eq3, and, desc, inArray, sql as sql2 } from "drizzle-orm";
import axios from "axios";
function requireEnv(name) {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(`${name} is required`);
  }
  return value.trim();
}
function getMpesaConfig() {
  return {
    shortcode: requireEnv("MPESA_SHORTCODE"),
    passkey: requireEnv("MPESA_PASSKEY"),
    consumerKey: requireEnv("MPESA_CONSUMER_KEY"),
    consumerSecret: requireEnv("MPESA_CONSUMER_SECRET"),
    callbackUrl: process.env.MPESA_CALLBACK_URL || (process.env.APP_URL ? `${process.env.APP_URL.replace(/\/$/, "")}/api/payments/callback` : null)
  };
}
function getCallbackUrl() {
  const cfg = getMpesaConfig();
  if (!cfg.callbackUrl) {
    throw new Error("MPESA_CALLBACK_URL or APP_URL is required");
  }
  const secret = process.env.MPESA_CALLBACK_SECRET;
  const isProduction2 = process.env.NODE_ENV === "production";
  if (isProduction2) {
    if (!secret || secret.trim() === "") {
      throw new Error("MPESA_CALLBACK_SECRET is required in production");
    }
  }
  if (secret && secret.trim() !== "") {
    const url = new URL(cfg.callbackUrl);
    url.searchParams.set("token", secret.trim());
    return url.toString();
  }
  return cfg.callbackUrl;
}
async function queryStkPushStatus(checkoutRequestID) {
  const cfg = getMpesaConfig();
  const { password, timestamp: timestamp2 } = generatePassword();
  const token = await getMpesaAccessToken();
  const response = await axios.post(
    `${MPESA_BASE_URL}/mpesa/stkpushquery/v1/query`,
    {
      BusinessShortCode: cfg.shortcode,
      Password: password,
      Timestamp: timestamp2,
      CheckoutRequestID: checkoutRequestID
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      timeout: 1e4
    }
  );
  return response.data;
}
async function getMpesaAccessToken() {
  if (accessToken && tokenExpiry && /* @__PURE__ */ new Date() < new Date(tokenExpiry.getTime() - 6e4)) {
    return accessToken;
  }
  const cfg = getMpesaConfig();
  const auth = Buffer.from(
    `${cfg.consumerKey}:${cfg.consumerSecret}`
  ).toString("base64");
  const response = await axios.get(
    `${MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
    {
      headers: { Authorization: `Basic ${auth}` },
      timeout: 1e4
    }
  );
  accessToken = response.data.access_token;
  tokenExpiry = new Date(Date.now() + 36e5);
  return accessToken;
}
function generatePassword() {
  const cfg = getMpesaConfig();
  const now = /* @__PURE__ */ new Date();
  const timestamp2 = now.getFullYear().toString() + (now.getMonth() + 1).toString().padStart(2, "0") + now.getDate().toString().padStart(2, "0") + now.getHours().toString().padStart(2, "0") + now.getMinutes().toString().padStart(2, "0") + now.getSeconds().toString().padStart(2, "0");
  const password = Buffer.from(
    `${cfg.shortcode}${cfg.passkey}${timestamp2}`
  ).toString("base64");
  return { password, timestamp: timestamp2 };
}
function formatPhoneNumber(phone) {
  let cleaned = phone.replace(/[\s\-+]/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = "254" + cleaned.slice(1);
  }
  if (!/^254[17]\d{8}$/.test(cleaned)) {
    throw new Error("Invalid Kenyan phone number format");
  }
  return cleaned;
}
var isProduction, MPESA_BASE_URL, accessToken, tokenExpiry, paymentsRouter;
var init_payments = __esm({
  "server/routers/payments.ts"() {
    "use strict";
    init_trpc();
    init_db();
    init_schema();
    init_paymentToken();
    isProduction = process.env.NODE_ENV === "production";
    MPESA_BASE_URL = isProduction ? "https://api.safaricom.co.ke" : "https://sandbox.safaricom.co.ke";
    accessToken = null;
    tokenExpiry = null;
    paymentsRouter = router({
      initiateStkPush: publicProcedure.input(
        z3.object({
          orderId: z3.number(),
          paymentToken: z3.string().min(1),
          phoneNumber: z3.string()
        })
      ).mutation(async ({ input }) => {
        if (!verifyOrderPaymentToken(input.paymentToken, input.orderId)) {
          throw new Error("Invalid payment token");
        }
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const cfg = getMpesaConfig();
        const orderResult = await db.select().from(orders).where(
          and(eq3(orders.id, input.orderId), eq3(orders.status, "pending"))
        ).limit(1).execute();
        if (orderResult.length === 0) {
          throw new Error("Order not found or not in pending state");
        }
        const order = orderResult[0];
        if (order.paymentStatus === "completed") {
          throw new Error("Order already paid");
        }
        const phone = formatPhoneNumber(input.phoneNumber);
        const orderPhone = formatPhoneNumber(order.customerPhone);
        if (phone !== orderPhone) {
          throw new Error("Phone number does not match order");
        }
        const existingTx = await db.select().from(mpesaTransactions).where(eq3(mpesaTransactions.orderId, input.orderId)).orderBy(desc(mpesaTransactions.createdAt)).limit(1).execute();
        if (existingTx.length > 0) {
          const tx = existingTx[0];
          if (tx.status === "completed") {
            throw new Error("Order already paid");
          }
          if (tx.status === "pending") {
            return {
              success: true,
              checkoutRequestID: tx.checkoutRequestID,
              message: "STK Push already pending. Check your phone."
            };
          }
        }
        const amount = Number(order.totalPrice);
        if (!Number.isFinite(amount) || amount <= 0) {
          throw new Error("Order amount must be a positive number");
        }
        if (!Number.isInteger(amount)) {
          throw new Error("Order amount must be a whole number of KSh");
        }
        const oauthToken = await getMpesaAccessToken();
        const callbackUrl = getCallbackUrl();
        const reservationKey = `INITIATING-${crypto2.randomUUID()}`;
        let reservationId;
        try {
          const result = await db.execute(sql2`
          INSERT INTO "mpesaTransactions" (
            "orderId", "checkoutRequestID", "merchantRequestID", "phoneNumber", "amount",
            "accountReference", "status"
          )
          SELECT ${input.orderId}, ${reservationKey}, NULL, ${phone}, ${amount.toString()}, ${`PB${input.orderId}`}, 'initiating'
          WHERE NOT EXISTS (
            SELECT 1 FROM "orders" WHERE "id" = ${input.orderId} AND "paymentStatus" = 'completed'
          )
          RETURNING "id"
        `);
          const rows2 = result.rows || (Array.isArray(result) ? result : []);
          if (!rows2 || rows2.length === 0 || !rows2[0]?.id) {
            throw new Error("Order already paid");
          }
          reservationId = rows2[0].id;
        } catch (reserveError) {
          const [existing] = await db.select().from(mpesaTransactions).where(eq3(mpesaTransactions.orderId, input.orderId)).orderBy(desc(mpesaTransactions.createdAt)).limit(1).execute();
          if (existing && (existing.status === "pending" || existing.status === "initiating" || existing.status === "unknown")) {
            return {
              success: true,
              checkoutRequestID: existing.checkoutRequestID,
              message: "STK Push already in progress. Check your phone."
            };
          }
          if (reserveError?.message === "Order already paid") {
            throw new Error("Order already paid");
          }
          throw reserveError;
        }
        const { password, timestamp: timestamp2 } = generatePassword();
        const token = oauthToken;
        let response;
        try {
          response = await axios.post(
            `${MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest`,
            {
              BusinessShortCode: cfg.shortcode,
              Password: password,
              Timestamp: timestamp2,
              TransactionType: "CustomerPayBillOnline",
              Amount: amount,
              PartyA: phone,
              PartyB: cfg.shortcode,
              PhoneNumber: phone,
              CallBackURL: callbackUrl,
              AccountReference: `PB${input.orderId}`,
              TransactionDesc: "Passua Bites order"
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
              },
              timeout: 15e3
            }
          );
        } catch (error) {
          const isAmbiguous = !error?.response || error?.code === "ECONNABORTED" || error?.code === "ETIMEDOUT" || /timeout/i.test(String(error?.message || ""));
          const errorMsg = error.response?.data?.errorMessage || error.message || "STK Push failed";
          await db.update(mpesaTransactions).set({
            status: isAmbiguous ? "unknown" : "failed",
            resultDesc: isAmbiguous ? "Ambiguous STK response; reconcile before retry" : `STK Push failed: ${errorMsg}`
          }).where(eq3(mpesaTransactions.id, reservationId)).execute().catch(() => void 0);
          throw new Error(`M-Pesa STK Push failed: ${errorMsg}`);
        }
        try {
          await db.update(mpesaTransactions).set({
            checkoutRequestID: response.data.CheckoutRequestID,
            merchantRequestID: response.data.MerchantRequestID,
            status: "pending"
          }).where(eq3(mpesaTransactions.id, reservationId)).execute();
        } catch (insertError) {
          const returnedCheckout = response?.data?.CheckoutRequestID;
          const returnedMerchant = response?.data?.MerchantRequestID;
          await db.update(mpesaTransactions).set({
            status: "unknown",
            resultDesc: `Safaricom accepted but persistence failed; reconcile. checkout=${returnedCheckout || "unknown"} merchant=${returnedMerchant || "unknown"}`
          }).where(eq3(mpesaTransactions.id, reservationId)).execute().catch(() => void 0);
          throw insertError;
        }
        return {
          success: true,
          checkoutRequestID: response.data.CheckoutRequestID,
          message: "STK Push sent successfully. Check your phone."
        };
      }),
      queryStatus: publicProcedure.input(
        z3.object({
          checkoutRequestID: z3.string(),
          paymentToken: z3.string().min(1)
        })
      ).query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const transaction = await db.select().from(mpesaTransactions).where(
          eq3(mpesaTransactions.checkoutRequestID, input.checkoutRequestID)
        ).limit(1).execute();
        if (transaction.length === 0) {
          throw new Error("Transaction not found");
        }
        const tx = transaction[0];
        if (!verifyOrderPaymentToken(input.paymentToken, tx.orderId)) {
          throw new Error("Invalid payment token");
        }
        if (tx.status === "completed") {
          return {
            status: "completed",
            mpesaReceiptNumber: tx.mpesaReceiptNumber,
            resultCode: tx.resultCode ?? 0
          };
        }
        const cfg = getMpesaConfig();
        const { password, timestamp: timestamp2 } = generatePassword();
        const token = await getMpesaAccessToken();
        try {
          const response = await axios.post(
            `${MPESA_BASE_URL}/mpesa/stkpushquery/v1/query`,
            {
              BusinessShortCode: cfg.shortcode,
              Password: password,
              Timestamp: timestamp2,
              CheckoutRequestID: input.checkoutRequestID
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
              },
              timeout: 1e4
            }
          );
          const resultCode = Number(response.data.ResultCode);
          if (resultCode === 0) {
            const queryCheckoutId = response.data.CheckoutRequestID;
            const queryMerchantId = response.data.MerchantRequestID;
            if (!queryCheckoutId || queryCheckoutId !== input.checkoutRequestID || queryCheckoutId !== tx.checkoutRequestID) {
              await db.update(mpesaTransactions).set({ status: "pending", resultCode, resultDesc: "CheckoutRequestID mismatch" }).where(
                and(
                  eq3(mpesaTransactions.checkoutRequestID, input.checkoutRequestID),
                  eq3(mpesaTransactions.status, "pending")
                )
              ).execute();
              return { status: "pending", resultDesc: "CheckoutRequestID mismatch", resultCode };
            }
            if (!queryMerchantId || !tx.merchantRequestID || queryMerchantId !== tx.merchantRequestID) {
              await db.update(mpesaTransactions).set({ status: "pending", resultCode, resultDesc: "MerchantRequestID mismatch" }).where(
                and(
                  eq3(mpesaTransactions.checkoutRequestID, input.checkoutRequestID),
                  eq3(mpesaTransactions.status, "pending")
                )
              ).execute();
              return { status: "pending", resultDesc: "MerchantRequestID mismatch", resultCode };
            }
            if (!tx.mpesaReceiptNumber) {
              await db.update(mpesaTransactions).set({ status: "pending", resultCode, resultDesc: "Awaiting callback metadata" }).where(
                and(
                  eq3(mpesaTransactions.checkoutRequestID, input.checkoutRequestID),
                  eq3(mpesaTransactions.status, "pending")
                )
              ).execute();
              return { status: "pending", resultDesc: "Awaiting callback metadata", resultCode };
            }
            const receipt = tx.mpesaReceiptNumber;
            const upd = await db.update(mpesaTransactions).set({
              status: "completed",
              mpesaReceiptNumber: receipt,
              resultCode,
              resultDesc: response.data.ResultDesc
            }).where(
              and(
                eq3(mpesaTransactions.checkoutRequestID, input.checkoutRequestID),
                eq3(mpesaTransactions.status, "pending")
              )
            ).execute();
            const rowCount = upd.rowCount ?? 0;
            if (rowCount === 0) {
              return {
                status: tx.status,
                mpesaReceiptNumber: tx.mpesaReceiptNumber,
                resultCode: tx.resultCode ?? 0
              };
            }
            const [order] = await db.select().from(orders).where(eq3(orders.id, tx.orderId)).limit(1).execute();
            await db.update(orders).set({
              paymentStatus: "completed",
              mpesaTransactionId: receipt,
              paymentReason: order?.status === "cancelled" ? "Late payment after cancellation - reconcile/refund" : order?.paymentReason ?? null
            }).where(
              and(
                eq3(orders.id, tx.orderId),
                inArray(orders.paymentStatus, ["pending", "failed"])
              )
            ).execute();
            await db.update(orders).set({ status: "confirmed" }).where(and(eq3(orders.id, tx.orderId), eq3(orders.status, "pending"))).execute();
            return {
              status: "completed",
              mpesaReceiptNumber: receipt,
              resultCode: 0
            };
          } else {
            const status = resultCode === 1032 ? "cancelled" : "failed";
            await db.update(mpesaTransactions).set({
              status,
              resultCode,
              resultDesc: response.data.ResultDesc
            }).where(
              and(
                eq3(mpesaTransactions.checkoutRequestID, input.checkoutRequestID),
                eq3(mpesaTransactions.status, "pending")
              )
            );
            return {
              status,
              resultDesc: response.data.ResultDesc,
              resultCode
            };
          }
        } catch (error) {
          return {
            status: tx.status,
            resultDesc: "Query failed, check callback for status",
            resultCode: tx.resultCode
          };
        }
      }),
      reconcileStkAttempt: adminProcedure.input(
        z3.object({
          orderId: z3.number(),
          checkoutRequestID: z3.string().min(1),
          merchantRequestID: z3.string().min(1),
          resolution: z3.enum(["pending", "failed"])
        })
      ).mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const [tx] = await db.select().from(mpesaTransactions).where(eq3(mpesaTransactions.orderId, input.orderId)).orderBy(desc(mpesaTransactions.createdAt)).limit(1).execute();
        if (!tx || tx.status !== "initiating" && tx.status !== "unknown") {
          throw new Error("No reconcilable STK attempt found");
        }
        let queryData;
        try {
          queryData = await queryStkPushStatus(input.checkoutRequestID);
        } catch (error) {
          throw new Error("Provider verification unavailable");
        }
        const queryCheckoutId = queryData?.CheckoutRequestID;
        const queryMerchantId = queryData?.MerchantRequestID;
        const queryResultCode = Number(queryData?.ResultCode);
        if (!queryCheckoutId || queryCheckoutId !== input.checkoutRequestID || !queryMerchantId || queryMerchantId !== input.merchantRequestID) {
          throw new Error("Provider identifiers do not match");
        }
        if (input.resolution === "failed") {
          if (queryResultCode === 0 || Number.isNaN(queryResultCode)) {
            throw new Error("Cannot mark a successful or ambiguous attempt as failed");
          }
        } else {
          if (queryResultCode !== 0) {
            throw new Error("Provider did not confirm the attempt");
          }
        }
        const upd = await db.update(mpesaTransactions).set({
          checkoutRequestID: input.checkoutRequestID,
          merchantRequestID: input.merchantRequestID,
          status: input.resolution,
          resultDesc: "Reconciled by admin after provider verification"
        }).where(
          and(
            eq3(mpesaTransactions.id, tx.id),
            inArray(mpesaTransactions.status, ["initiating", "unknown"])
          )
        ).execute();
        const rowCount = upd.rowCount ?? 0;
        if (rowCount === 0) {
          throw new Error("Reconciliation lost the race");
        }
        return { success: true };
      }),
      getOrderPaymentStatus: publicProcedure.input(
        z3.object({
          orderId: z3.number(),
          paymentToken: z3.string().min(1)
        })
      ).query(async ({ input }) => {
        if (!verifyOrderPaymentToken(input.paymentToken, input.orderId)) {
          throw new Error("Invalid payment token");
        }
        const db = await getDb();
        if (!db) return { paymentStatus: "unknown" };
        const orderResult = await db.select().from(orders).where(eq3(orders.id, input.orderId)).limit(1).execute();
        if (orderResult.length === 0) {
          throw new Error("Order not found");
        }
        const order = orderResult[0];
        const txResult = await db.select().from(mpesaTransactions).where(eq3(mpesaTransactions.orderId, input.orderId)).orderBy(desc(mpesaTransactions.createdAt)).limit(1).execute();
        return {
          paymentStatus: order.paymentStatus,
          orderStatus: order.status,
          mpesaReceiptNumber: txResult.length > 0 ? txResult[0].mpesaReceiptNumber : null
        };
      })
    });
  }
});

// server/mpesaCallback.ts
var mpesaCallback_exports = {};
__export(mpesaCallback_exports, {
  processMpesaCallback: () => processMpesaCallback,
  processMpesaCallbackDurable: () => processMpesaCallbackDurable,
  reconcileOrderPayment: () => reconcileOrderPayment
});
import crypto3 from "crypto";
import { eq as eq4, and as and2, desc as desc2, inArray as inArray2 } from "drizzle-orm";
async function reconcileOrderPayment(orderId) {
  const db = await getDb();
  if (!db) return;
  const [tx] = await db.select().from(mpesaTransactions).where(
    and2(eq4(mpesaTransactions.orderId, orderId), eq4(mpesaTransactions.status, "completed"))
  ).orderBy(desc2(mpesaTransactions.createdAt)).limit(1).execute();
  if (!tx) return;
  const [order] = await db.select().from(orders).where(eq4(orders.id, orderId)).limit(1).execute();
  if (!order) return;
  if (order.paymentStatus === "completed") return;
  await db.update(orders).set({
    paymentStatus: "completed",
    mpesaTransactionId: tx.mpesaReceiptNumber || order.mpesaTransactionId,
    paymentReason: order.paymentReason || "Reconciled from completed M-Pesa transaction",
    status: order.status === "pending" ? "confirmed" : order.status
  }).where(eq4(orders.id, orderId)).execute();
}
async function processMpesaCallbackDurable(payload) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const body = payload?.Body?.stkCallback || {};
  const checkoutRequestID = body.CheckoutRequestID;
  const resultCode = body.ResultCode;
  const keySource = checkoutRequestID ? `${checkoutRequestID}:${resultCode}` : JSON.stringify(payload);
  const idempotencyKey = crypto3.createHash("sha256").update(keySource).digest("hex");
  let eventId = null;
  try {
    const [row] = await db.insert(mpesaCallbackEvents).values({
      idempotencyKey,
      payload: JSON.stringify(payload),
      status: "received"
    }).returning({ id: mpesaCallbackEvents.id });
    eventId = row.id;
  } catch (error) {
    const [existing] = await db.select().from(mpesaCallbackEvents).where(eq4(mpesaCallbackEvents.idempotencyKey, idempotencyKey)).limit(1).execute();
    if (existing?.status === "processed") {
      logger.info({ idempotencyKey }, "[M-Pesa] Duplicate callback already processed");
      return;
    }
    eventId = existing?.id ?? null;
  }
  try {
    await processMpesaCallback(payload);
    if (eventId) {
      await db.update(mpesaCallbackEvents).set({ status: "processed", processedAt: /* @__PURE__ */ new Date() }).where(eq4(mpesaCallbackEvents.id, eventId)).execute();
    }
  } catch (error) {
    if (eventId) {
      await db.update(mpesaCallbackEvents).set({ status: "failed", error: String(error), processedAt: /* @__PURE__ */ new Date() }).where(eq4(mpesaCallbackEvents.id, eventId)).execute().catch(() => void 0);
    }
    throw error;
  }
}
async function processMpesaCallback(body) {
  try {
    const { Body } = body || {};
    if (!Body || !Body.stkCallback) {
      logger.error("[M-Pesa] Invalid callback payload (missing stkCallback)");
      return;
    }
    const { stkCallback } = Body;
    const { ResultCode, CheckoutRequestID, CallbackMetadata, ResultDesc } = stkCallback;
    const code = Number(ResultCode);
    const db = await getDb();
    if (!db) {
      logger.error("[M-Pesa] Database not available for callback");
      return;
    }
    const tx = await db.select().from(mpesaTransactions).where(eq4(mpesaTransactions.checkoutRequestID, CheckoutRequestID)).limit(1).execute();
    if (tx.length === 0) {
      logger.error(
        { checkoutRequestID: CheckoutRequestID },
        "[M-Pesa] Transaction not found for callback"
      );
      return;
    }
    const transaction = tx[0];
    const callbackMerchantRequestID = stkCallback.MerchantRequestID;
    if (!callbackMerchantRequestID || !transaction.merchantRequestID || callbackMerchantRequestID !== transaction.merchantRequestID) {
      logger.error(
        { checkoutRequestID: CheckoutRequestID },
        "[M-Pesa] Merchant request ID missing or mismatched in callback"
      );
      await db.update(mpesaTransactions).set({ status: "pending", resultDesc: "Merchant request ID mismatch" }).where(
        and2(
          eq4(mpesaTransactions.checkoutRequestID, CheckoutRequestID),
          eq4(mpesaTransactions.status, "pending")
        )
      ).execute();
      return;
    }
    if (transaction.status === "completed") {
      logger.info(
        { checkoutRequestID: CheckoutRequestID },
        "[M-Pesa] Duplicate callback for completed payment, skipping"
      );
      return;
    }
    if (code !== 0) {
      const status = code === 1032 ? "cancelled" : "failed";
      await db.update(mpesaTransactions).set({
        status,
        resultCode: code,
        resultDesc: ResultDesc || null
      }).where(
        and2(
          eq4(mpesaTransactions.checkoutRequestID, CheckoutRequestID),
          eq4(mpesaTransactions.status, "pending")
        )
      ).execute();
      await db.update(orders).set({ paymentStatus: "failed" }).where(
        and2(eq4(orders.id, transaction.orderId), eq4(orders.paymentStatus, "pending"))
      ).execute();
      logger.info(
        { status, code, checkoutRequestID: CheckoutRequestID },
        "[M-Pesa] Payment not completed"
      );
      return;
    }
    let queryData;
    try {
      queryData = await queryStkPushStatus(CheckoutRequestID);
    } catch (error) {
      logger.error({ err: error, checkoutRequestID: CheckoutRequestID }, "[M-Pesa] Daraja verification failed");
      await db.update(mpesaTransactions).set({ status: "pending", resultDesc: "Provider verification unavailable" }).where(
        and2(
          eq4(mpesaTransactions.checkoutRequestID, CheckoutRequestID),
          eq4(mpesaTransactions.status, "pending")
        )
      ).execute();
      return;
    }
    if (Number(queryData?.ResultCode) !== 0) {
      logger.info({ checkoutRequestID: CheckoutRequestID }, "[M-Pesa] Daraja verification did not confirm payment");
      await db.update(mpesaTransactions).set({ status: "pending", resultDesc: "Provider verification pending" }).where(
        and2(
          eq4(mpesaTransactions.checkoutRequestID, CheckoutRequestID),
          eq4(mpesaTransactions.status, "pending")
        )
      ).execute();
      return;
    }
    if (!queryData?.CheckoutRequestID || queryData.CheckoutRequestID !== CheckoutRequestID || queryData.CheckoutRequestID !== transaction.checkoutRequestID) {
      logger.error({ checkoutRequestID: CheckoutRequestID }, "[M-Pesa] CheckoutRequestID mismatch in query");
      await db.update(mpesaTransactions).set({ status: "pending", resultDesc: "CheckoutRequestID mismatch" }).where(
        and2(
          eq4(mpesaTransactions.checkoutRequestID, CheckoutRequestID),
          eq4(mpesaTransactions.status, "pending")
        )
      ).execute();
      return;
    }
    if (!queryData?.MerchantRequestID || queryData.MerchantRequestID !== callbackMerchantRequestID || queryData.MerchantRequestID !== transaction.merchantRequestID) {
      logger.error({ checkoutRequestID: CheckoutRequestID }, "[M-Pesa] MerchantRequestID mismatch in query");
      await db.update(mpesaTransactions).set({ status: "pending", resultDesc: "MerchantRequestID mismatch" }).where(
        and2(
          eq4(mpesaTransactions.checkoutRequestID, CheckoutRequestID),
          eq4(mpesaTransactions.status, "pending")
        )
      ).execute();
      return;
    }
    const metadata = {};
    CallbackMetadata?.Item?.forEach((item) => {
      metadata[item.Name] = item.Value;
    });
    const receipt = metadata.MpesaReceiptNumber;
    const amount = metadata.Amount;
    const phone = metadata.PhoneNumber;
    if (!receipt || amount === void 0 || amount === null) {
      logger.error(
        { checkoutRequestID: CheckoutRequestID },
        "[M-Pesa] Missing receipt or amount in callback"
      );
      await db.update(mpesaTransactions).set({
        status: "pending",
        resultCode: code,
        resultDesc: "Insufficient payment evidence"
      }).where(
        and2(
          eq4(mpesaTransactions.checkoutRequestID, CheckoutRequestID),
          eq4(mpesaTransactions.status, "pending")
        )
      ).execute();
      return;
    }
    if (Number(amount) !== Number(transaction.amount)) {
      logger.error(
        {
          expected: transaction.amount,
          received: amount,
          checkoutRequestID: CheckoutRequestID
        },
        "[M-Pesa] Amount mismatch in callback"
      );
      await db.update(mpesaTransactions).set({ status: "failed", resultCode: code, resultDesc: "Amount mismatch" }).where(
        and2(
          eq4(mpesaTransactions.checkoutRequestID, CheckoutRequestID),
          eq4(mpesaTransactions.status, "pending")
        )
      ).execute();
      await db.update(orders).set({ paymentStatus: "failed" }).where(
        and2(eq4(orders.id, transaction.orderId), eq4(orders.paymentStatus, "pending"))
      ).execute();
      return;
    }
    if (!phone) {
      logger.error({ checkoutRequestID: CheckoutRequestID }, "[M-Pesa] Missing phone in verification");
      await db.update(mpesaTransactions).set({ status: "pending", resultDesc: "Missing phone evidence" }).where(
        and2(
          eq4(mpesaTransactions.checkoutRequestID, CheckoutRequestID),
          eq4(mpesaTransactions.status, "pending")
        )
      ).execute();
      return;
    }
    try {
      const normalized = formatPhoneNumber(String(phone));
      const txPhone = formatPhoneNumber(transaction.phoneNumber);
      if (normalized !== txPhone) {
        logger.error({ checkoutRequestID: CheckoutRequestID }, "[M-Pesa] Phone mismatch in callback");
        await db.update(mpesaTransactions).set({ status: "failed", resultCode: code, resultDesc: "Phone mismatch" }).where(
          and2(
            eq4(mpesaTransactions.checkoutRequestID, CheckoutRequestID),
            eq4(mpesaTransactions.status, "pending")
          )
        ).execute();
        await db.update(orders).set({ paymentStatus: "failed" }).where(
          and2(eq4(orders.id, transaction.orderId), eq4(orders.paymentStatus, "pending"))
        ).execute();
        return;
      }
    } catch {
      logger.error({ checkoutRequestID: CheckoutRequestID }, "[M-Pesa] Invalid phone in callback");
      await db.update(mpesaTransactions).set({ status: "failed", resultCode: code, resultDesc: "Invalid phone" }).where(
        and2(
          eq4(mpesaTransactions.checkoutRequestID, CheckoutRequestID),
          eq4(mpesaTransactions.status, "pending")
        )
      ).execute();
      await db.update(orders).set({ paymentStatus: "failed" }).where(
        and2(eq4(orders.id, transaction.orderId), eq4(orders.paymentStatus, "pending"))
      ).execute();
      return;
    }
    const upd = await db.update(mpesaTransactions).set({
      status: "completed",
      mpesaReceiptNumber: receipt,
      resultCode: code,
      resultDesc: ResultDesc || null
    }).where(
      and2(
        eq4(mpesaTransactions.checkoutRequestID, CheckoutRequestID),
        eq4(mpesaTransactions.status, "pending")
      )
    ).execute();
    const rowCount = upd.rowCount ?? 0;
    if (rowCount === 0) {
      logger.info(
        { checkoutRequestID: CheckoutRequestID },
        "[M-Pesa] Duplicate callback, skipping"
      );
      return;
    }
    const [order] = await db.select().from(orders).where(eq4(orders.id, transaction.orderId)).limit(1).execute();
    await db.update(orders).set({
      paymentStatus: "completed",
      mpesaTransactionId: receipt,
      paymentReason: order?.status === "cancelled" ? "Late payment after cancellation - reconcile/refund" : order?.paymentReason ?? null
    }).where(
      and2(
        eq4(orders.id, transaction.orderId),
        inArray2(orders.paymentStatus, ["pending", "failed"])
      )
    ).execute();
    await db.update(orders).set({ status: "confirmed" }).where(
      and2(eq4(orders.id, transaction.orderId), eq4(orders.status, "pending"))
    ).execute();
    logger.info(
      { orderId: transaction.orderId, receipt, amount },
      "[M-Pesa] Payment confirmed"
    );
  } catch (error) {
    logger.error({ err: error }, "[M-Pesa] Callback processing error");
    throw error;
  }
}
var init_mpesaCallback = __esm({
  "server/mpesaCallback.ts"() {
    "use strict";
    init_db();
    init_schema();
    init_logger();
    init_payments();
    init_payments();
  }
});

// server/vercel-entry.ts
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// server/routers.ts
init_const();

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  const secure = isSecureRequest(req);
  return {
    httpOnly: true,
    path: "/",
    sameSite: secure ? "none" : "lax",
    secure
  };
}

// server/_core/systemRouter.ts
import { z } from "zod";

// server/_core/notification.ts
init_logger();
init_env();
import { TRPCError } from "@trpc/server";
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      logger.warn(
        { status: response.status, statusText: response.statusText, detail },
        "[Notification] Failed to notify owner"
      );
      return false;
    }
    return true;
  } catch (error) {
    logger.warn(
      { err: error },
      "[Notification] Error calling notification service"
    );
    return false;
  }
}

// server/_core/systemRouter.ts
init_trpc();
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/routers.ts
init_trpc();
import { z as z10 } from "zod";

// server/routers/menu.ts
init_trpc();
init_db();
init_logger();
init_schema();
import { z as z2 } from "zod";
import { eq as eq2 } from "drizzle-orm";
var FALLBACK_MENU = [
  {
    id: 1,
    name: "Burger",
    price: "150.00",
    imageUrl: "/media/images/burger.jpg",
    description: "Buns, lettuce, sliced kachumbari, sauces, beef pattie",
    category: "Burgers",
    available: 1,
    videoUrl: null
  },
  {
    id: 2,
    name: "Masala Chips",
    price: "150.00",
    imageUrl: "/media/images/masala-chips.jpg",
    description: "Crunchy outside, soft inside fries, well marinated \u2014 spicy or non-spicy",
    category: "Sides",
    available: 1,
    videoUrl: null
  },
  {
    id: 3,
    name: "Hot Blazer",
    price: "200.00",
    imageUrl: "/media/images/hot-blazer.jpg",
    description: "Two chapatis (wrapped), lettuce, kachumbari, boerewors, indomie, avocado, gravy sauce",
    category: "Specials",
    available: 1,
    videoUrl: null
  },
  {
    id: 4,
    name: "Pasua Corn",
    price: "300.00",
    imageUrl: "/media/images/pasua-corn.jpg",
    description: "One beef burger + masala chips (spicy or non-spicy)",
    category: "Sides",
    available: 1,
    videoUrl: null
  },
  {
    id: 5,
    name: "Passua Smocha",
    price: "110.00",
    imageUrl: "/media/images/hot-blazer.jpg",
    description: "Chapati, beef smokie, kachumbari, indomie, avocado, seasoned with sauces",
    category: "Smoshas",
    available: 1,
    videoUrl: "/media/videos/Pasuasmocha.mp4"
  },
  {
    id: 6,
    name: "Zigizaga",
    price: "140.00",
    imageUrl: "/media/images/hot-blazer.jpg",
    description: "Chapati, beef smokie, kachumbari, indomie, avocado, topped with a boiled egg, seasoned with sauces",
    category: "Smoshas",
    available: 1,
    videoUrl: "/media/videos/zigizaga.mp4"
  },
  {
    id: 7,
    name: "Sultan",
    price: "270.00",
    imageUrl: "/media/images/hot-blazer.jpg",
    description: "Two chapatis (wrapped), lettuce, kachumbari, one beef pattie, masala chips, avocado, sauces \u2014 comes with a soda",
    category: "Combos",
    available: 1,
    videoUrl: "/media/videos/Sultan.mp4"
  },
  {
    id: 8,
    name: "Mega Sultan",
    price: "560.00",
    imageUrl: "/media/images/hot-blazer.jpg",
    description: "Two chapatis (wrapped), lettuce, kachumbari, two beef patties, cheese, masala chips, avocado, sauces \u2014 comes with a soda",
    category: "Combos",
    available: 1,
    videoUrl: "/media/videos/megasultan.mp4"
  }
];
var menuRouter = router({
  // List all available menu items
  list: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) {
      logger.info("[Menu] Using fallback menu (DB unavailable)");
      return FALLBACK_MENU;
    }
    const items = await db.select().from(menuItems).where(eq2(menuItems.available, 1)).execute();
    if (items.length === 0) {
      logger.info("[Menu] Using fallback menu (DB empty)");
      return FALLBACK_MENU;
    }
    return items;
  }),
  // Get single menu item by ID
  getById: publicProcedure.input(z2.object({ id: z2.number() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return void 0;
    const result = await db.select().from(menuItems).where(eq2(menuItems.id, input.id)).limit(1).execute();
    return result.length > 0 ? result[0] : void 0;
  }),
  // Admin: Create new menu item
  create: adminProcedure.input(
    z2.object({
      name: z2.string().min(2).max(255),
      description: z2.string().max(1e3).optional(),
      price: z2.number().positive().max(99999.99),
      imageUrl: z2.string().optional(),
      videoUrl: z2.string().optional(),
      category: z2.string().max(100).optional(),
      available: z2.boolean().default(true),
      featured: z2.boolean().default(false)
    })
  ).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const result = await db.insert(menuItems).values({
      name: input.name,
      description: input.description || null,
      price: input.price.toString(),
      imageUrl: input.imageUrl || null,
      videoUrl: input.videoUrl || null,
      category: input.category || null,
      available: input.available ? 1 : 0,
      featured: input.featured ? 1 : 0
    }).execute();
    return { success: true, insertId: Number(result.insertId || 0) };
  }),
  // Admin: Update menu item
  update: adminProcedure.input(
    z2.object({
      id: z2.number(),
      name: z2.string().min(2).max(255).optional(),
      description: z2.string().max(1e3).optional(),
      price: z2.number().positive().max(99999.99).optional(),
      imageUrl: z2.string().optional().nullable(),
      videoUrl: z2.string().optional().nullable(),
      category: z2.string().max(100).optional(),
      available: z2.boolean().optional(),
      featured: z2.boolean().optional()
    })
  ).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const updates = {};
    if (input.name !== void 0) updates.name = input.name;
    if (input.description !== void 0)
      updates.description = input.description;
    if (input.price !== void 0) updates.price = input.price.toString();
    if (input.imageUrl !== void 0)
      updates.imageUrl = input.imageUrl || null;
    if (input.videoUrl !== void 0)
      updates.videoUrl = input.videoUrl || null;
    if (input.category !== void 0) updates.category = input.category;
    if (input.available !== void 0)
      updates.available = input.available ? 1 : 0;
    if (input.featured !== void 0)
      updates.featured = input.featured ? 1 : 0;
    if (Object.keys(updates).length === 0) {
      return { success: false, message: "No fields to update" };
    }
    await db.update(menuItems).set(updates).where(eq2(menuItems.id, input.id)).execute();
    return { success: true };
  }),
  // Admin: Delete menu item
  delete: adminProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.delete(menuItems).where(eq2(menuItems.id, input.id)).execute();
    return { success: true };
  }),
  // Admin: Toggle availability
  toggleAvailability: adminProcedure.input(z2.object({ id: z2.number(), available: z2.boolean() })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.update(menuItems).set({ available: input.available ? 1 : 0 }).where(eq2(menuItems.id, input.id)).execute();
    return { success: true };
  }),
  // Admin: Toggle featured (today's special)
  toggleFeatured: adminProcedure.input(z2.object({ id: z2.number(), featured: z2.boolean() })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.update(menuItems).set({ featured: input.featured ? 1 : 0 }).where(eq2(menuItems.id, input.id)).execute();
    return { success: true };
  })
});

// server/routers/orders.ts
init_trpc();
init_db();
init_mpesaCallback();
init_schema();
init_paymentToken();
import { z as z4 } from "zod";
import { eq as eq5, desc as desc3, and as and3, inArray as inArray3, sql as sql3 } from "drizzle-orm";
var phoneRegex = /^(?:\+254|0)[7][0-9]{8}$/;
var ordersRouter = router({
  // Create a new order
  create: publicProcedure.input(
    z4.object({
      customerName: z4.string().min(2).max(255),
      customerPhone: z4.string().regex(phoneRegex, "Invalid Kenyan phone number"),
      customerEmail: z4.string().email().optional(),
      deliveryAddress: z4.string().min(5).max(500),
      items: z4.array(
        z4.object({
          menuItemId: z4.number(),
          quantity: z4.number().min(1).max(50)
        })
      ).min(1).max(20),
      paymentMethod: z4.enum(["mpesa", "cash"]).default("mpesa"),
      notes: z4.string().max(500).optional()
    })
  ).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const { getSiteSetting: getSiteSetting2 } = await Promise.resolve().then(() => (init_db(), db_exports));
    const paused = await getSiteSetting2("orders_paused");
    if (paused?.value === "true") {
      throw new Error("Ordering is currently paused. Please try again later.");
    }
    const { menuItems: menuItemsTable } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    const availableItems = await db.select().from(menuItemsTable).where(eq5(menuItemsTable.available, 1)).execute();
    let totalPrice = 0;
    const orderItemsData = [];
    for (const item of input.items) {
      const menuItem = availableItems.find((m) => m.id === item.menuItemId);
      if (!menuItem) {
        throw new Error(
          `Menu item ${item.menuItemId} not found or unavailable`
        );
      }
      const lineTotal = Number(menuItem.price) * item.quantity;
      totalPrice += lineTotal;
      orderItemsData.push({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        priceAtTime: menuItem.price
      });
    }
    const [inserted] = await db.insert(orders).values({
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      customerEmail: input.customerEmail || null,
      deliveryAddress: input.deliveryAddress,
      totalPrice: totalPrice.toFixed(2),
      status: "pending",
      paymentMethod: input.paymentMethod,
      paymentStatus: "pending",
      notes: input.notes || null
    }).returning({ id: orders.id });
    const orderId = inserted.id;
    for (const oi of orderItemsData) {
      await db.insert(orderItems).values({
        orderId,
        menuItemId: oi.menuItemId,
        quantity: oi.quantity,
        priceAtTime: oi.priceAtTime
      }).execute();
    }
    return {
      success: true,
      orderId,
      totalPrice,
      paymentToken: signOrderPaymentToken(orderId)
    };
  }),
  // Track order by ID
  getById: publicProcedure.input(
    z4.object({
      id: z4.number(),
      paymentToken: z4.string().min(1)
    })
  ).query(async ({ input }) => {
    if (!verifyOrderPaymentToken(input.paymentToken, input.id)) {
      throw new Error("Invalid payment token");
    }
    await reconcileOrderPayment(input.id);
    const db = await getDb();
    if (!db) return void 0;
    const orderResult = await db.select().from(orders).where(eq5(orders.id, input.id)).limit(1).execute();
    if (orderResult.length === 0) return void 0;
    const order = orderResult[0];
    const { menuItems: menuItemsTable } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    const items = await db.select({
      id: orderItems.id,
      quantity: orderItems.quantity,
      priceAtTime: orderItems.priceAtTime,
      name: menuItemsTable.name
    }).from(orderItems).leftJoin(menuItemsTable, eq5(orderItems.menuItemId, menuItemsTable.id)).where(eq5(orderItems.orderId, input.id)).execute();
    return {
      id: order.id,
      status: order.status,
      paymentStatus: order.paymentStatus,
      totalPrice: order.totalPrice,
      createdAt: order.createdAt,
      items
    };
  }),
  listByPhone: adminProcedure.input(z4.object({ phone: z4.string().regex(phoneRegex, "Invalid Kenyan phone number") })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];
    const rows2 = await db.select().from(orders).where(eq5(orders.customerPhone, input.phone)).orderBy(desc3(orders.createdAt)).limit(50).execute();
    return rows2.map((o) => ({
      id: o.id,
      status: o.status,
      paymentStatus: o.paymentStatus,
      totalPrice: o.totalPrice,
      createdAt: o.createdAt
    }));
  }),
  // Admin: List all orders
  listAll: adminProcedure.input(
    z4.object({
      status: z4.enum([
        "pending",
        "confirmed",
        "preparing",
        "ready",
        "delivered",
        "cancelled"
      ]).optional(),
      limit: z4.number().min(1).max(100).default(50)
    }).optional()
  ).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];
    const limit = input?.limit || 50;
    const orderRows = await (input?.status ? db.select().from(orders).orderBy(desc3(orders.createdAt)).where(eq5(orders.status, input.status)).limit(limit).execute() : db.select().from(orders).orderBy(desc3(orders.createdAt)).limit(limit).execute());
    if (orderRows.length === 0) return orderRows;
    const ids = orderRows.map((o) => o.id);
    const itemRows = await db.select({
      orderId: orderItems.orderId,
      id: orderItems.id,
      menuItemId: orderItems.menuItemId,
      name: menuItems.name,
      quantity: orderItems.quantity,
      price: orderItems.priceAtTime
    }).from(orderItems).leftJoin(menuItems, eq5(orderItems.menuItemId, menuItems.id)).where(inArray3(orderItems.orderId, ids)).execute();
    const byOrder = /* @__PURE__ */ new Map();
    for (const it of itemRows) {
      if (!byOrder.has(it.orderId)) byOrder.set(it.orderId, []);
      byOrder.get(it.orderId).push(it);
    }
    return orderRows.map((o) => ({
      ...o,
      items: byOrder.get(o.id) || []
    }));
  }),
  markPaid: adminProcedure.input(
    z4.object({
      id: z4.number(),
      reason: z4.string().min(3).max(500)
    })
  ).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const [order] = await db.select().from(orders).where(eq5(orders.id, input.id)).limit(1).execute();
    if (!order) throw new Error("Order not found");
    if (order.paymentStatus === "completed") {
      return { success: true, alreadyPaid: true };
    }
    const upd = await db.update(orders).set({
      paymentMethod: "cash",
      paymentStatus: "completed",
      status: order.status === "pending" ? "confirmed" : order.status,
      paidBy: ctx.user?.name || ctx.user?.openId || "admin",
      paidAt: /* @__PURE__ */ new Date(),
      paymentReason: input.reason
    }).where(
      and3(
        eq5(orders.id, input.id),
        inArray3(orders.paymentStatus, ["pending", "failed"]),
        sql3`NOT EXISTS (SELECT 1 FROM "mpesaTransactions" WHERE "orderId" = ${input.id} AND "status" IN ('initiating', 'pending', 'unknown'))`
      )
    ).execute();
    const rowCount = upd.rowCount ?? 0;
    if (rowCount === 0) {
      return { success: false, alreadyPaid: false };
    }
    return { success: true, alreadyPaid: false };
  }),
  updateStatus: adminProcedure.input(
    z4.object({
      id: z4.number(),
      status: z4.enum([
        "pending",
        "confirmed",
        "preparing",
        "ready",
        "delivered",
        "cancelled"
      ])
    })
  ).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const [order] = await db.select().from(orders).where(eq5(orders.id, input.id)).limit(1).execute();
    if (!order) throw new Error("Order not found");
    const allowed = {
      pending: ["confirmed", "cancelled"],
      confirmed: ["preparing", "cancelled"],
      preparing: ["ready", "cancelled"],
      ready: ["delivered", "cancelled"],
      delivered: [],
      cancelled: []
    };
    if (!(allowed[order.status] || []).includes(input.status)) {
      throw new Error(
        `Invalid transition: ${order.status} -> ${input.status}`
      );
    }
    if (input.status === "preparing" || input.status === "ready" || input.status === "delivered") {
      const method = order.paymentMethod || "mpesa";
      if (method !== "cash" && order.paymentStatus !== "completed") {
        throw new Error("Payment not completed for this order");
      }
    }
    if (order.status === "cancelled") {
      throw new Error("Cancelled orders cannot be updated");
    }
    await db.update(orders).set({ status: input.status }).where(eq5(orders.id, input.id)).execute();
    return { success: true };
  }),
  // Admin: Create walk-in / POS order
  createWalkIn: adminProcedure.input(
    z4.object({
      customerName: z4.string().min(1).max(255),
      customerPhone: z4.string().regex(phoneRegex, "Invalid Kenyan phone number"),
      deliveryAddress: z4.string().max(500).optional(),
      items: z4.array(
        z4.object({
          menuItemId: z4.number(),
          quantity: z4.number().min(1).max(50)
        })
      ).min(1).max(50),
      paymentMethod: z4.enum(["mpesa", "cash"]).default("cash"),
      notes: z4.string().max(500).optional()
    })
  ).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const { menuItems: menuItemsTable } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    const availableItems = await db.select().from(menuItemsTable).execute();
    let totalPrice = 0;
    const orderItemsData = [];
    for (const item of input.items) {
      const menuItem = availableItems.find((m) => m.id === item.menuItemId);
      if (!menuItem) {
        throw new Error(`Menu item ${item.menuItemId} not found`);
      }
      const lineTotal = Number(menuItem.price) * item.quantity;
      totalPrice += lineTotal;
      orderItemsData.push({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        priceAtTime: menuItem.price
      });
    }
    const isCash = input.paymentMethod === "cash";
    const [inserted] = await db.insert(orders).values({
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      deliveryAddress: input.deliveryAddress || "Walk-in / POS",
      totalPrice: totalPrice.toFixed(2),
      status: isCash ? "confirmed" : "pending",
      paymentMethod: input.paymentMethod,
      paymentStatus: isCash ? "completed" : "pending",
      channel: "pos",
      paidBy: isCash ? ctx.user?.name || ctx.user?.openId || "pos" : null,
      paidAt: isCash ? /* @__PURE__ */ new Date() : null,
      paymentReason: isCash ? "POS cash receipt" : null,
      notes: input.notes || null
    }).returning({ id: orders.id });
    const orderId = inserted.id;
    for (const oi of orderItemsData) {
      await db.insert(orderItems).values({
        orderId,
        menuItemId: oi.menuItemId,
        quantity: oi.quantity,
        priceAtTime: oi.priceAtTime
      }).execute();
    }
    return { success: true, orderId, totalPrice, paymentToken: signOrderPaymentToken(orderId) };
  }),
  // Admin: sales summary
  getSalesSummary: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { today: 0, week: 0, month: 0, topItems: [] };
    const allOrders = await db.select().from(orders).execute();
    const allItems = await db.select().from(orderItems).execute();
    const allMenu = await db.select().from(menuItems).execute();
    const now = /* @__PURE__ */ new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);
    const startOfMonth = new Date(now);
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const completed = allOrders.filter((o) => o.paymentStatus === "completed");
    const sum = (from) => completed.filter((o) => new Date(o.createdAt) >= from).reduce((s, o) => s + Number(o.totalPrice), 0);
    const qtyByItem = /* @__PURE__ */ new Map();
    for (const oi of allItems) {
      const ord = allOrders.find((o) => o.id === oi.orderId);
      if (!ord || ord.paymentStatus !== "completed") continue;
      qtyByItem.set(oi.menuItemId, (qtyByItem.get(oi.menuItemId) || 0) + oi.quantity);
    }
    const topItems = Array.from(qtyByItem.entries()).map(([id, qty]) => ({
      id,
      name: allMenu.find((m) => m.id === id)?.name || `Item ${id}`,
      quantity: qty
    })).sort((a, b) => b.quantity - a.quantity).slice(0, 5);
    return {
      today: sum(startOfDay),
      week: sum(startOfWeek),
      month: sum(startOfMonth),
      topItems
    };
  }),
  getStats: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db)
      return {
        totalOrders: 0,
        pendingOrders: 0,
        todayRevenue: 0,
        totalRevenue: 0
      };
    const allOrders = await db.select().from(orders).execute();
    const today = /* @__PURE__ */ new Date();
    today.setHours(0, 0, 0, 0);
    const todayOrders = allOrders.filter((o) => new Date(o.createdAt) >= today);
    return {
      totalOrders: allOrders.length,
      pendingOrders: allOrders.filter((o) => o.status === "pending").length,
      todayRevenue: todayOrders.filter((o) => o.paymentStatus === "completed").reduce((sum, o) => sum + Number(o.totalPrice), 0),
      totalRevenue: allOrders.filter((o) => o.paymentStatus === "completed").reduce((sum, o) => sum + Number(o.totalPrice), 0)
    };
  }),
  isPaused: publicProcedure.query(async () => {
    const { getSiteSetting: getSiteSetting2 } = await Promise.resolve().then(() => (init_db(), db_exports));
    const setting = await getSiteSetting2("orders_paused");
    return setting?.value === "true";
  }),
  setPaused: adminProcedure.input(z4.object({ paused: z4.boolean() })).mutation(async ({ input }) => {
    const { setSiteSetting: setSiteSetting2 } = await Promise.resolve().then(() => (init_db(), db_exports));
    await setSiteSetting2("orders_paused", input.paused ? "true" : "false");
    return { success: true, paused: input.paused };
  })
});

// server/routers.ts
init_payments();

// server/routers/reviews.ts
init_trpc();
init_db();
init_schema();
import { z as z5 } from "zod";
import { eq as eq6, desc as desc4 } from "drizzle-orm";
var reviewsRouter = router({
  // Submit a review
  create: publicProcedure.input(
    z5.object({
      orderId: z5.number().optional(),
      menuItemId: z5.number().optional(),
      customerName: z5.string().min(2).max(255),
      rating: z5.number().min(1).max(5),
      reviewText: z5.string().max(1e3).optional()
    })
  ).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.insert(reviews).values({
      orderId: input.orderId || null,
      menuItemId: input.menuItemId || null,
      customerName: input.customerName,
      rating: input.rating,
      reviewText: input.reviewText || null,
      approved: 0
      // Pending moderation
    }).execute();
    return { success: true, message: "Review submitted for moderation" };
  }),
  // List approved reviews
  list: publicProcedure.input(
    z5.object({
      menuItemId: z5.number().optional(),
      limit: z5.number().min(1).max(100).default(20)
    }).optional()
  ).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];
    const allReviews = await db.select().from(reviews).where(eq6(reviews.approved, 1)).orderBy(desc4(reviews.createdAt)).execute();
    const filtered = input?.menuItemId ? allReviews.filter((r) => r.menuItemId === input.menuItemId) : allReviews;
    return filtered.slice(0, input?.limit || 20);
  }),
  // Get average rating
  getAverageRating: publicProcedure.input(z5.object({ menuItemId: z5.number().optional() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return { average: 0, count: 0 };
    const allReviews = await db.select().from(reviews).where(eq6(reviews.approved, 1)).execute();
    const filtered = input.menuItemId ? allReviews.filter((r) => r.menuItemId === input.menuItemId) : allReviews;
    if (filtered.length === 0) {
      return { average: 0, count: 0 };
    }
    const average = filtered.reduce((sum, r) => sum + r.rating, 0) / filtered.length;
    return {
      average: Math.round(average * 10) / 10,
      count: filtered.length
    };
  }),
  // Admin: List pending reviews
  listPending: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(reviews).where(eq6(reviews.approved, 0)).orderBy(desc4(reviews.createdAt)).execute();
  }),
  // Admin: Approve or reject review
  moderate: adminProcedure.input(
    z5.object({
      id: z5.number(),
      approved: z5.boolean()
    })
  ).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.update(reviews).set({ approved: input.approved ? 1 : 0 }).where(eq6(reviews.id, input.id)).execute();
    return { success: true };
  }),
  // Admin: Delete review
  delete: adminProcedure.input(z5.object({ id: z5.number() })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.delete(reviews).where(eq6(reviews.id, input.id)).execute();
    return { success: true };
  })
});

// server/routers/admin.ts
init_const();

// server/_core/sdk.ts
init_const();

// shared/_core/errors.ts
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var ForbiddenError = (msg) => new HttpError(403, msg);

// server/_core/sdk.ts
init_db();
init_logger();
init_env();
import axios2 from "axios";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";
var isNonEmptyString2 = (value) => typeof value === "string" && value.length > 0;
var EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
var GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
var GET_USER_INFO_WITH_JWT_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`;
var OAuthService = class {
  constructor(client) {
    this.client = client;
    logger.info({ baseURL: ENV.oAuthServerUrl }, "[OAuth] Initialized");
    if (!ENV.oAuthServerUrl) {
      logger.error("[OAuth] OAUTH_SERVER_URL is not configured");
    }
  }
  decodeState(state) {
    const redirectUri = atob(state);
    return redirectUri;
  }
  async getTokenByCode(code, state) {
    const payload = {
      clientId: ENV.appId,
      grantType: "authorization_code",
      code,
      redirectUri: this.decodeState(state)
    };
    const { data } = await this.client.post(
      EXCHANGE_TOKEN_PATH,
      payload
    );
    return data;
  }
  async getUserInfoByToken(token) {
    const { data } = await this.client.post(
      GET_USER_INFO_PATH,
      {
        accessToken: token.accessToken
      }
    );
    return data;
  }
};
var createOAuthHttpClient = () => axios2.create({
  baseURL: ENV.oAuthServerUrl,
  timeout: AXIOS_TIMEOUT_MS
});
var SDKServer = class {
  client;
  oauthService;
  constructor(client = createOAuthHttpClient()) {
    this.client = client;
    this.oauthService = new OAuthService(this.client);
  }
  deriveLoginMethod(platforms, fallback) {
    if (fallback && fallback.length > 0) return fallback;
    if (!Array.isArray(platforms) || platforms.length === 0) return null;
    const set = new Set(
      platforms.filter((p) => typeof p === "string")
    );
    if (set.has("REGISTERED_PLATFORM_EMAIL")) return "email";
    if (set.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
    if (set.has("REGISTERED_PLATFORM_APPLE")) return "apple";
    if (set.has("REGISTERED_PLATFORM_MICROSOFT") || set.has("REGISTERED_PLATFORM_AZURE"))
      return "microsoft";
    if (set.has("REGISTERED_PLATFORM_GITHUB")) return "github";
    const first = Array.from(set)[0];
    return first ? first.toLowerCase() : null;
  }
  /**
   * Exchange OAuth authorization code for access token
   * @example
   * const tokenResponse = await sdk.exchangeCodeForToken(code, state);
   */
  async exchangeCodeForToken(code, state) {
    return this.oauthService.getTokenByCode(code, state);
  }
  /**
   * Get user information using access token
   * @example
   * const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
   */
  async getUserInfo(accessToken2) {
    const data = await this.oauthService.getUserInfoByToken({
      accessToken: accessToken2
    });
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  parseCookies(cookieHeader) {
    if (!cookieHeader) {
      return /* @__PURE__ */ new Map();
    }
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }
  getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }
  /**
   * Create a session token for a Manus user openId
   * @example
   * const sessionToken = await sdk.createSessionToken(userInfo.openId);
   */
  async createSessionToken(openId, options = {}) {
    return this.signSession(
      {
        openId,
        appId: ENV.appId,
        name: options.name || ""
      },
      options
    );
  }
  async signSession(payload, options = {}) {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
    const secretKey = this.getSessionSecret();
    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name
    }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(secretKey);
  }
  async verifySession(cookieValue) {
    if (!cookieValue) {
      logger.warn("[Auth] Missing session cookie");
      return null;
    }
    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"]
      });
      const { openId, appId, name } = payload;
      if (!isNonEmptyString2(openId) || typeof appId !== "string" || name !== void 0 && typeof name !== "string") {
        logger.warn(
          { openId, appId, name },
          "[Auth] Session payload missing required fields"
        );
        return null;
      }
      return {
        openId,
        appId,
        name: name ?? ""
      };
    } catch (error) {
      logger.warn({ err: error }, "[Auth] Session verification failed");
      return null;
    }
  }
  async getUserInfoWithJwt(jwtToken) {
    const payload = {
      jwtToken,
      projectId: ENV.appId
    };
    const { data } = await this.client.post(
      GET_USER_INFO_WITH_JWT_PATH,
      payload
    );
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  async authenticateRequest(req) {
    let cookieValue = null;
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
      cookieValue = authHeader.slice(7).trim();
    } else {
      const cookies = this.parseCookies(req.headers.cookie);
      cookieValue = cookies.get(COOKIE_NAME) ?? null;
    }
    const session = await this.verifySession(cookieValue);
    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }
    const sessionUserId = session.openId;
    const signedInAt = /* @__PURE__ */ new Date();
    let user = await getUserByOpenId(sessionUserId);
    if (!user) {
      try {
        const userInfo = await this.getUserInfoWithJwt(cookieValue ?? "");
        await upsertUser({
          openId: userInfo.openId,
          name: userInfo.name || null,
          email: userInfo.email ?? null,
          loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
          lastSignedIn: signedInAt
        });
        user = await getUserByOpenId(userInfo.openId);
      } catch (error) {
        logger.error({ err: error }, "[Auth] Failed to sync user from OAuth");
        throw ForbiddenError("Failed to sync user info");
      }
    }
    if (!user) {
      throw ForbiddenError("User not found");
    }
    await upsertUser({
      openId: user.openId,
      lastSignedIn: signedInAt
    });
    return user;
  }
};
var sdk = new SDKServer();

// server/routers/admin.ts
init_trpc();
init_db();
init_db();
init_schema();
import { z as z6 } from "zod";
import { eq as eq7 } from "drizzle-orm";

// server/_core/password.ts
import crypto4 from "crypto";
var SCRYPT_KEYLEN = 64;
var SCRYPT_COST = 16384;
function hashPassword(password) {
  const salt = crypto4.randomBytes(16);
  const derived = crypto4.scryptSync(password, salt, SCRYPT_KEYLEN, {
    N: SCRYPT_COST
  });
  return `scrypt$${SCRYPT_COST}$${salt.toString("hex")}$${derived.toString("hex")}`;
}
function verifyPassword(password, hash) {
  const parts = hash.split("$");
  if (parts.length !== 4 || parts[0] !== "scrypt") return false;
  const cost = Number(parts[1]);
  const salt = Buffer.from(parts[2], "hex");
  const stored = Buffer.from(parts[3], "hex");
  const derived = crypto4.scryptSync(password, salt, stored.length, { N: cost });
  return crypto4.timingSafeEqual(stored, derived);
}

// server/routers/admin.ts
var getAdminSeedPassword = () => {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "ADMIN_PASSWORD environment variable is required in production"
      );
    }
    return "passua2026";
  }
  return password;
};
var adminRouter = router({
  login: publicProcedure.input(z6.object({ username: z6.string().min(1), password: z6.string().min(1) })).mutation(async ({ input, ctx }) => {
    const database = await getDb();
    if (!database) throw new Error("Database not available");
    const existing = await database.select().from(adminUsers).limit(1).execute();
    if (existing.length === 0) {
      const seedPassword = getAdminSeedPassword();
      await database.insert(adminUsers).values({
        username: "admin",
        passwordHash: hashPassword(seedPassword),
        name: "Passua Bites Admin",
        role: "admin"
      });
    }
    const [user] = await database.select().from(adminUsers).where(eq7(adminUsers.username, input.username)).limit(1).execute();
    if (!user || !verifyPassword(input.password, user.passwordHash)) {
      throw new Error("Invalid username or password");
    }
    const openId = `admin:${user.username}`;
    await upsertUser({
      openId,
      name: user.name || user.username,
      role: "admin",
      lastSignedIn: /* @__PURE__ */ new Date()
    });
    const token = await sdk.createSessionToken(openId, {
      name: user.name || user.username,
      expiresInMs: ONE_YEAR_MS
    });
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.cookie(COOKIE_NAME, token, {
      ...cookieOptions,
      maxAge: ONE_YEAR_MS
    });
    return {
      success: true,
      token,
      userId: user.id,
      username: user.username
    };
  }),
  createAccount: publicProcedure.input(
    z6.object({
      bootstrapPassword: z6.string(),
      username: z6.string().min(3).max(64),
      password: z6.string().min(8),
      name: z6.string().optional()
    })
  ).mutation(async ({ input }) => {
    const seedPassword = getAdminSeedPassword();
    if (input.bootstrapPassword !== seedPassword) {
      throw new Error("Invalid bootstrap password");
    }
    const database = await getDb();
    if (!database) throw new Error("Database not available");
    const [existing] = await database.select().from(adminUsers).where(eq7(adminUsers.username, input.username)).limit(1).execute();
    if (existing) throw new Error("Username already exists");
    await database.insert(adminUsers).values({
      username: input.username,
      passwordHash: hashPassword(input.password),
      name: input.name || input.username,
      role: "admin"
    });
    return { success: true };
  })
});

// server/routers/analytics.ts
init_trpc();
init_db();
init_schema();
import { sql as sql4 } from "drizzle-orm";
import { z as z7 } from "zod";
import { createHash } from "crypto";
var geo = null;
async function getGeo() {
  if (geo) return geo;
  try {
    geo = (await import("geoip-lite")).default;
  } catch {
    geo = null;
  }
  return geo;
}
function rows(result) {
  return result?.rows ?? result ?? [];
}
function parseDevice(ua) {
  if (/ipad|tablet|playbook|silk/i.test(ua)) return "tablet";
  if (/mobile|android|iphone|ipod|blackberry|opera mini|iemobile/i.test(ua))
    return "mobile";
  return "desktop";
}
function parseBrowser(ua) {
  if (/curl|headlesschrome|playwright|bot|spider|crawl|wget|postman/i.test(ua))
    return "Bot/Crawler";
  if (/edg\//i.test(ua)) return "Edge";
  if (/opr\/|opera/i.test(ua)) return "Opera";
  if (/chrome\/\d/i.test(ua) && !/chromium/i.test(ua)) return "Chrome";
  if (/firefox\/\d/i.test(ua)) return "Firefox";
  if (/safari\/\d/i.test(ua) && !/chrome/i.test(ua)) return "Safari";
  return "Other";
}
function parseOS(ua) {
  if (/android/i.test(ua)) return "Android";
  if (/iphone|ipad|ipod/i.test(ua)) return "iOS";
  if (/windows nt/i.test(ua)) return "Windows";
  if (/mac os x/i.test(ua)) return "macOS";
  if (/linux/i.test(ua)) return "Linux";
  return "Other";
}
function getClientIp(req) {
  const fwd = req.headers?.["x-forwarded-for"];
  if (fwd) {
    const first = Array.isArray(fwd) ? fwd[0] : fwd;
    return first.split(",")[0].trim().slice(0, 50);
  }
  return req.socket?.remoteAddress || req.ip || "unknown";
}
function makeSessionId(ip, ua) {
  const day = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  return createHash("sha256").update(`${ip}:${ua}:${day}`).digest("hex").slice(0, 32);
}
var analyticsRouter = router({
  recordPageview: publicProcedure.input(
    z7.object({
      page: z7.string().max(500),
      referrer: z7.string().max(500).nullable().optional(),
      userAgent: z7.string().max(512).nullable().optional()
    })
  ).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) return { success: false };
    const ua = input.userAgent || "";
    const ip = getClientIp(ctx.req);
    const referrer = input.referrer || null;
    const geoLib = await getGeo();
    const location = geoLib && ip !== "unknown" ? geoLib.lookup(ip) : null;
    try {
      await db.insert(analyticsEvents).values({
        sessionId: makeSessionId(ip, ua),
        ip: ip.slice(0, 50),
        country: location?.country?.slice(0, 4) || null,
        city: location?.city?.slice(0, 100) || null,
        userAgent: ua?.slice(0, 512) || null,
        device: parseDevice(ua),
        os: parseOS(ua),
        browser: parseBrowser(ua),
        page: input.page,
        referer: referrer?.slice(0, 500) || null,
        eventType: "pageview",
        metadata: null
      }).execute();
    } catch {
    }
    return { success: true };
  }),
  getTraffic: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return null;
    const [
      summaryRes,
      dailyRes,
      pagesRes,
      devicesRes,
      countriesRes,
      citiesRes,
      browsersRes,
      referrersRes
    ] = await Promise.all([
      db.execute(sql4`
          SELECT
            SUM(CASE WHEN "browser" != 'Bot/Crawler' THEN 1 ELSE 0 END) AS total_pageviews,
            COUNT(DISTINCT CASE WHEN "browser" != 'Bot/Crawler' THEN "sessionId" END) AS total_sessions,
            COUNT(DISTINCT CASE WHEN "browser" != 'Bot/Crawler' THEN "ip" END) AS unique_ips,
            SUM(CASE WHEN "browser" = 'Bot/Crawler' THEN 1 ELSE 0 END) AS bot_hits
          FROM "analyticsEvents"
          WHERE "createdAt" >= NOW() - INTERVAL '30 days'
            AND "eventType" = 'pageview'
        `),
      db.execute(sql4`
          SELECT
            DATE("createdAt")               AS date,
            COUNT(*)                        AS pageviews,
            COUNT(DISTINCT "sessionId")     AS sessions,
            COUNT(DISTINCT "ip")            AS visitors
          FROM "analyticsEvents"
          WHERE "createdAt" >= NOW() - INTERVAL '30 days'
            AND "eventType" = 'pageview'
            AND "browser" != 'Bot/Crawler'
          GROUP BY DATE("createdAt")
          ORDER BY date ASC
        `),
      db.execute(sql4`
          SELECT
            "page",
            COUNT(*) AS views
          FROM "analyticsEvents"
          WHERE "createdAt" >= NOW() - INTERVAL '30 days'
            AND "eventType" = 'pageview'
            AND "page" IS NOT NULL
            AND "browser" != 'Bot/Crawler'
          GROUP BY "page"
          ORDER BY views DESC
          LIMIT 10
        `),
      db.execute(sql4`
          SELECT
            COALESCE("device", 'unknown')   AS device,
            COUNT(DISTINCT "sessionId")     AS sessions
          FROM "analyticsEvents"
          WHERE "createdAt" >= NOW() - INTERVAL '30 days'
            AND "browser" != 'Bot/Crawler'
          GROUP BY "device"
          ORDER BY sessions DESC
        `),
      db.execute(sql4`
          SELECT
            COALESCE("country", 'Unknown')  AS country,
            COUNT(DISTINCT "ip")            AS visitors
          FROM "analyticsEvents"
          WHERE "createdAt" >= NOW() - INTERVAL '30 days'
            AND "browser" != 'Bot/Crawler'
          GROUP BY "country"
          ORDER BY visitors DESC
          LIMIT 10
        `),
      db.execute(sql4`
          SELECT
            COALESCE("city", 'Unknown')  AS city,
            COUNT(DISTINCT "ip")         AS visitors
          FROM "analyticsEvents"
          WHERE "createdAt" >= NOW() - INTERVAL '30 days'
            AND "browser" != 'Bot/Crawler'
          GROUP BY "city"
          ORDER BY visitors DESC
          LIMIT 10
        `),
      db.execute(sql4`
          SELECT
            COALESCE("browser", 'Other')    AS browser,
            COUNT(DISTINCT "sessionId")     AS sessions
          FROM "analyticsEvents"
          WHERE "createdAt" >= NOW() - INTERVAL '30 days'
            AND "browser" != 'Bot/Crawler'
          GROUP BY "browser"
          ORDER BY sessions DESC
        `),
      db.execute(sql4`
          SELECT
            COALESCE("referer", 'Direct')   AS source,
            COUNT(*)                        AS visits
          FROM "analyticsEvents"
          WHERE "createdAt" >= NOW() - INTERVAL '30 days'
            AND "eventType" = 'pageview'
            AND "browser" != 'Bot/Crawler'
          GROUP BY "referer"
          ORDER BY visits DESC
          LIMIT 8
        `)
    ]);
    const s = rows(summaryRes)[0] ?? {};
    return {
      summary: {
        totalPageviews: Number(s.total_pageviews ?? 0),
        totalSessions: Number(s.total_sessions ?? 0),
        uniqueVisitors: Number(s.unique_ips ?? 0),
        botHits: Number(s.bot_hits ?? 0)
      },
      daily: rows(dailyRes).map((r) => ({
        date: String(r.date).slice(0, 10),
        pageviews: Number(r.pageviews),
        sessions: Number(r.sessions),
        visitors: Number(r.visitors)
      })),
      topPages: rows(pagesRes).map((r) => ({
        page: r.page,
        views: Number(r.views)
      })),
      devices: rows(devicesRes).map((r) => ({
        device: r.device,
        sessions: Number(r.sessions)
      })),
      countries: rows(countriesRes).map((r) => ({
        country: r.country,
        visitors: Number(r.visitors)
      })),
      cities: rows(citiesRes).map((r) => ({
        city: r.city,
        visitors: Number(r.visitors)
      })),
      browsers: rows(browsersRes).map((r) => ({
        browser: r.browser,
        sessions: Number(r.sessions)
      })),
      referrers: rows(referrersRes).map((r) => ({
        source: r.source,
        visits: Number(r.visits)
      }))
    };
  }),
  getOrderInsights: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return null;
    const [revenueRes, topItemsRes, peakRes, aovRes, repeatRes, statusRes] = await Promise.all([
      db.execute(sql4`
          SELECT
            DATE("createdAt")                   AS date,
            COUNT(*)                            AS order_count,
            SUM("totalPrice"::numeric)          AS revenue
          FROM "orders"
          WHERE "createdAt" >= NOW() - INTERVAL '30 days'
            AND "paymentStatus" = 'completed'
          GROUP BY DATE("createdAt")
          ORDER BY date ASC
        `),
      db.execute(sql4`
          SELECT
            m.name,
            SUM(oi.quantity)                                AS units,
            SUM(oi.quantity * oi."priceAtTime"::numeric)    AS revenue
          FROM "orderItems" oi
          JOIN "menuItems"  m ON m.id = oi."menuItemId"
          JOIN "orders"     o ON o.id = oi."orderId"
          WHERE o."createdAt" >= NOW() - INTERVAL '30 days'
          GROUP BY m.name
          ORDER BY revenue DESC
          LIMIT 8
        `),
      db.execute(sql4`
          SELECT
            EXTRACT(HOUR FROM "createdAt")::int AS hour,
            COUNT(*)                            AS orders
          FROM "orders"
          WHERE "createdAt" >= NOW() - INTERVAL '30 days'
          GROUP BY hour
          ORDER BY hour ASC
        `),
      db.execute(sql4`
          SELECT
            ROUND(AVG("totalPrice"::numeric), 2)  AS avg_order_value,
            COUNT(*)                              AS total_orders,
            SUM("totalPrice"::numeric)            AS total_revenue
          FROM "orders"
          WHERE "paymentStatus" = 'completed'
        `),
      db.execute(sql4`
          SELECT
            COUNT(*)                                                AS total_customers,
            SUM(CASE WHEN order_count > 1 THEN 1 ELSE 0 END)       AS repeat_customers
          FROM (
            SELECT "customerPhone", COUNT(*) AS order_count
            FROM "orders"
            GROUP BY "customerPhone"
          ) sub
        `),
      db.execute(sql4`
          SELECT "status", COUNT(*) AS count
          FROM "orders"
          GROUP BY "status"
          ORDER BY count DESC
        `)
    ]);
    const aov = rows(aovRes)[0] ?? {};
    const repeat = rows(repeatRes)[0] ?? {};
    const total = Number(repeat.total_customers ?? 0);
    const rpt = Number(repeat.repeat_customers ?? 0);
    const peakMap = /* @__PURE__ */ new Map();
    rows(peakRes).forEach(
      (r) => peakMap.set(Number(r.hour), Number(r.orders))
    );
    const peakHours = Array.from({ length: 24 }, (_, h) => ({
      hour: h,
      label: `${String(h).padStart(2, "0")}:00`,
      orders: peakMap.get(h) ?? 0
    }));
    return {
      revenueTrend: rows(revenueRes).map((r) => ({
        date: String(r.date).slice(0, 10),
        orders: Number(r.order_count),
        revenue: Number(r.revenue ?? 0)
      })),
      topItems: rows(topItemsRes).map((r) => ({
        name: r.name,
        units: Number(r.units),
        revenue: Number(r.revenue ?? 0)
      })),
      peakHours,
      summary: {
        avgOrderValue: Number(aov.avg_order_value ?? 0),
        totalOrders: Number(aov.total_orders ?? 0),
        totalRevenue: Number(aov.total_revenue ?? 0),
        repeatRate: total > 0 ? Math.round(rpt / total * 100) : 0
      },
      statusBreakdown: rows(statusRes).map((r) => ({
        status: r.status,
        count: Number(r.count)
      }))
    };
  })
});

// server/routers/upload.ts
init_trpc();
import { z as z8 } from "zod";
import { put } from "@vercel/blob";
var uploadRouter = router({
  // Admin: upload an image to Vercel Blob and return its public URL
  image: adminProcedure.input(
    z8.object({
      filename: z8.string().min(1).max(255),
      data: z8.string().min(1),
      // base64-encoded file contents
      contentType: z8.string().optional()
    })
  ).mutation(async ({ input }) => {
    const buffer = Buffer.from(input.data, "base64");
    if (buffer.length > 5 * 1024 * 1024) {
      throw new Error("Image must be smaller than 5 MB");
    }
    const safeName = input.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const blob = await put(`passua/${Date.now()}-${safeName}`, buffer, {
      access: "public",
      contentType: input.contentType || "image/jpeg"
    });
    return { url: blob.url };
  })
});

// server/routers/announcements.ts
init_trpc();
init_db();
init_schema();
import { z as z9 } from "zod";
import { eq as eq8, desc as desc5, and as and5, or, isNull, gte, lte } from "drizzle-orm";
var announcementsRouter = router({
  // Public: active announcements currently in window
  listActive: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    const now = /* @__PURE__ */ new Date();
    return db.select().from(announcements).where(
      and5(
        eq8(announcements.active, 1),
        or(isNull(announcements.startsAt), lte(announcements.startsAt, now)),
        or(isNull(announcements.endsAt), gte(announcements.endsAt, now))
      )
    ).orderBy(desc5(announcements.createdAt)).execute();
  }),
  // Admin: all
  listAll: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(announcements).orderBy(desc5(announcements.createdAt)).execute();
  }),
  create: adminProcedure.input(
    z9.object({
      title: z9.string().min(1).max(255),
      body: z9.string().max(2e3).optional(),
      type: z9.enum(["info", "offer", "alert"]).default("info"),
      active: z9.boolean().default(true),
      startsAt: z9.string().datetime().optional(),
      endsAt: z9.string().datetime().optional()
    })
  ).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const [row] = await db.insert(announcements).values({
      title: input.title,
      body: input.body || null,
      type: input.type,
      active: input.active ? 1 : 0,
      startsAt: input.startsAt ? new Date(input.startsAt) : null,
      endsAt: input.endsAt ? new Date(input.endsAt) : null
    }).returning({ id: announcements.id });
    return { success: true, id: row.id };
  }),
  update: adminProcedure.input(
    z9.object({
      id: z9.number(),
      title: z9.string().min(1).max(255).optional(),
      body: z9.string().max(2e3).optional(),
      type: z9.enum(["info", "offer", "alert"]).optional(),
      active: z9.boolean().optional(),
      startsAt: z9.string().datetime().nullable().optional(),
      endsAt: z9.string().datetime().nullable().optional()
    })
  ).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const patch = { updatedAt: /* @__PURE__ */ new Date() };
    if (input.title !== void 0) patch.title = input.title;
    if (input.body !== void 0) patch.body = input.body || null;
    if (input.type !== void 0) patch.type = input.type;
    if (input.active !== void 0) patch.active = input.active ? 1 : 0;
    if (input.startsAt !== void 0)
      patch.startsAt = input.startsAt ? new Date(input.startsAt) : null;
    if (input.endsAt !== void 0)
      patch.endsAt = input.endsAt ? new Date(input.endsAt) : null;
    await db.update(announcements).set(patch).where(eq8(announcements.id, input.id)).execute();
    return { success: true };
  }),
  delete: adminProcedure.input(z9.object({ id: z9.number() })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.delete(announcements).where(eq8(announcements.id, input.id)).execute();
    return { success: true };
  }),
  toggle: adminProcedure.input(z9.object({ id: z9.number(), active: z9.boolean() })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.update(announcements).set({ active: input.active ? 1 : 0, updatedAt: /* @__PURE__ */ new Date() }).where(eq8(announcements.id, input.id)).execute();
    return { success: true };
  })
});

// server/routers.ts
var appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true };
    })
  }),
  // Passua Bites routers
  menu: menuRouter,
  orders: ordersRouter,
  payments: paymentsRouter,
  reviews: reviewsRouter,
  admin: adminRouter,
  analytics: analyticsRouter,
  upload: uploadRouter,
  announcements: announcementsRouter,
  // Location/Displacement message router
  location: router({
    get: publicProcedure.query(async () => {
      const { getSiteSetting: getSiteSetting2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const setting = await getSiteSetting2("displacementMessage");
      return setting?.value ?? "We're currently displaced. Order via Bolt Food or WhatsApp!";
    }),
    update: adminProcedure.input(z10.object({ message: z10.string() })).mutation(async ({ input }) => {
      const { setSiteSetting: setSiteSetting2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      await setSiteSetting2("displacementMessage", input.message);
      return { success: true };
    }),
    getAll: adminProcedure.query(async () => {
      const { getAllSiteSettings: getAllSiteSettings2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      return getAllSiteSettings2();
    })
  })
});

// server/_core/context.ts
async function createContext(opts) {
  let user = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// server/vercel-entry.ts
import rateLimit from "express-rate-limit";
var ALLOWED_ORIGINS = new Set(
  [
    process.env.APP_URL,
    "https://passua-bites-web.vercel.app",
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000"
  ].filter(Boolean)
);
function isAllowedOrigin(origin) {
  if (!origin) return true;
  return ALLOWED_ORIGINS.has(origin);
}
var app = express();
app.set("trust proxy", 1);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; media-src 'self' https:; connect-src 'self' https://*.neon.tech https://*.vercel.app; frame-ancestors 'none'"
  );
  next();
});
app.post("/api/payments/callback", async (req, res) => {
  const secret = process.env.MPESA_CALLBACK_SECRET;
  const provided = req.query?.token || req.headers["x-callback-token"] || req.headers["x-mpesa-callback-token"];
  if (secret) {
    if (provided !== secret) {
      return res.status(401).json({ ResultCode: 1, ResultDesc: "Unauthorized" });
    }
  } else if (process.env.NODE_ENV === "production") {
    return res.status(503).json({ ResultCode: 1, ResultDesc: "Callback not configured" });
  }
  try {
    const { processMpesaCallbackDurable: processMpesaCallbackDurable2 } = await Promise.resolve().then(() => (init_mpesaCallback(), mpesaCallback_exports));
    await processMpesaCallbackDurable2(req.body);
    res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });
  } catch (error) {
    res.status(500).json({ ResultCode: 1, ResultDesc: "Callback processing failed" });
  }
});
var generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1e3,
  max: process.env.NODE_ENV === "production" ? 200 : 500,
  message: { error: "Too many requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { ip: false }
});
var orderLimiter = rateLimit({
  windowMs: 60 * 1e3,
  max: 10,
  message: { error: "Too many requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { ip: false }
});
var authLimiter = rateLimit({
  windowMs: 60 * 1e3,
  max: 5,
  message: { error: "Too many authentication attempts, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { ip: false },
  handler: (_req, res) => {
    res.setHeader("Retry-After", "60");
    res.status(429).json({ error: "Too many authentication attempts, please try again later" });
  }
});
app.use("/api/", generalLimiter);
app.use("/api/trpc/admin.login", authLimiter);
app.use("/api/trpc/orders.create", orderLimiter);
app.use("/api/trpc/payments.initiateStkPush", orderLimiter);
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && !isAllowedOrigin(origin)) {
    return res.status(403).json({ error: "Origin not allowed" });
  }
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method) && origin) {
    if (!isAllowedOrigin(origin)) {
      return res.status(403).json({ error: "CSRF origin check failed" });
    }
  }
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  next();
});
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
});
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext
  })
);
var vercel_entry_default = app;
export {
  vercel_entry_default as default
};
