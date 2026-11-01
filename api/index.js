var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

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

// drizzle/schema.ts
var schema_exports = {};
__export(schema_exports, {
  analyticsEvents: () => analyticsEvents,
  announcements: () => announcements,
  menuItems: () => menuItems,
  mpesaTransactions: () => mpesaTransactions,
  orderItems: () => orderItems,
  orders: () => orders,
  reviews: () => reviews,
  siteSettings: () => siteSettings,
  users: () => users
});
import {
  decimal,
  index,
  serial,
  pgTable,
  text,
  timestamp,
  varchar,
  integer
} from "drizzle-orm/pg-core";
var users, menuItems, orders, orderItems, reviews, siteSettings, mpesaTransactions, analyticsEvents, announcements;
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
    }, (t2) => [index("idx_mpesaTransactions_orderId").on(t2.orderId)]);
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
      const sql2 = neon(process.env.DATABASE_URL);
      _db = drizzle(sql2);
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

// server/vercel-entry.ts
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var AXIOS_TIMEOUT_MS = 3e4;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

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

// server/_core/trpc.ts
import { initTRPC, TRPCError as TRPCError2 } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
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
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
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

// server/_core/systemRouter.ts
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
import { z as z10 } from "zod";

// server/routers/menu.ts
import { z as z2 } from "zod";
init_db();
init_logger();
init_schema();
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
import { z as z3 } from "zod";
init_db();
init_schema();
import { eq as eq3, desc, inArray } from "drizzle-orm";
var phoneRegex = /^(?:\+254|0)[7][0-9]{8}$/;
var ordersRouter = router({
  // Create a new order
  create: publicProcedure.input(
    z3.object({
      customerName: z3.string().min(2).max(255),
      customerPhone: z3.string().regex(phoneRegex, "Invalid Kenyan phone number"),
      customerEmail: z3.string().email().optional(),
      deliveryAddress: z3.string().min(5).max(500),
      items: z3.array(
        z3.object({
          menuItemId: z3.number(),
          quantity: z3.number().min(1).max(50)
        })
      ).min(1).max(20),
      paymentMethod: z3.enum(["mpesa", "cash"]).default("mpesa"),
      notes: z3.string().max(500).optional()
    })
  ).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const { menuItems: menuItemsTable } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    const availableItems = await db.select().from(menuItemsTable).where(eq3(menuItemsTable.available, 1)).execute();
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
      paymentStatus: input.paymentMethod === "cash" ? "completed" : "pending",
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
      totalPrice
    };
  }),
  // Track order by ID
  getById: publicProcedure.input(z3.object({ id: z3.number() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return void 0;
    const orderResult = await db.select().from(orders).where(eq3(orders.id, input.id)).limit(1).execute();
    if (orderResult.length === 0) return void 0;
    const order = orderResult[0];
    const { menuItems: menuItemsTable } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    const items = await db.select({
      id: orderItems.id,
      quantity: orderItems.quantity,
      priceAtTime: orderItems.priceAtTime,
      name: menuItemsTable.name
    }).from(orderItems).leftJoin(menuItemsTable, eq3(orderItems.menuItemId, menuItemsTable.id)).where(eq3(orderItems.orderId, input.id)).execute();
    return { ...order, items };
  }),
  // List orders by phone number
  listByPhone: publicProcedure.input(z3.object({ phone: z3.string() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(orders).where(eq3(orders.customerPhone, input.phone)).orderBy(desc(orders.createdAt)).limit(50).execute();
  }),
  // Admin: List all orders
  listAll: adminProcedure.input(
    z3.object({
      status: z3.enum([
        "pending",
        "confirmed",
        "preparing",
        "ready",
        "delivered",
        "cancelled"
      ]).optional(),
      limit: z3.number().min(1).max(100).default(50)
    }).optional()
  ).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];
    const limit = input?.limit || 50;
    const orderRows = await (input?.status ? db.select().from(orders).orderBy(desc(orders.createdAt)).where(eq3(orders.status, input.status)).limit(limit).execute() : db.select().from(orders).orderBy(desc(orders.createdAt)).limit(limit).execute());
    if (orderRows.length === 0) return orderRows;
    const ids = orderRows.map((o) => o.id);
    const itemRows = await db.select({
      orderId: orderItems.orderId,
      id: orderItems.id,
      menuItemId: orderItems.menuItemId,
      name: menuItems.name,
      quantity: orderItems.quantity,
      price: orderItems.priceAtTime
    }).from(orderItems).leftJoin(menuItems, eq3(orderItems.menuItemId, menuItems.id)).where(inArray(orderItems.orderId, ids)).execute();
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
  // Admin: Mark an order as paid (cash fallback after failed M-Pesa)
  markPaid: adminProcedure.input(z3.object({ id: z3.number() })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const [order] = await db.select().from(orders).where(eq3(orders.id, input.id)).limit(1).execute();
    if (!order) throw new Error("Order not found");
    if (order.paymentStatus === "completed") {
      return { success: true, alreadyPaid: true };
    }
    await db.update(orders).set({
      paymentMethod: "cash",
      paymentStatus: "completed",
      status: order.status === "pending" ? "confirmed" : order.status
    }).where(eq3(orders.id, input.id)).execute();
    return { success: true };
  }),
  updateStatus: adminProcedure.input(
    z3.object({
      id: z3.number(),
      status: z3.enum([
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
    const [order] = await db.select().from(orders).where(eq3(orders.id, input.id)).limit(1).execute();
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
    await db.update(orders).set({ status: input.status }).where(eq3(orders.id, input.id)).execute();
    return { success: true };
  }),
  // Admin: Create walk-in / POS order
  createWalkIn: adminProcedure.input(
    z3.object({
      customerName: z3.string().min(1).max(255),
      customerPhone: z3.string().regex(phoneRegex, "Invalid Kenyan phone number"),
      deliveryAddress: z3.string().max(500).optional(),
      items: z3.array(
        z3.object({
          menuItemId: z3.number(),
          quantity: z3.number().min(1).max(50)
        })
      ).min(1).max(50),
      paymentMethod: z3.enum(["mpesa", "cash"]).default("cash"),
      notes: z3.string().max(500).optional()
    })
  ).mutation(async ({ input }) => {
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
    return { success: true, orderId, totalPrice };
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
  })
});

// server/routers/payments.ts
import { z as z4 } from "zod";
init_db();
init_schema();
import { eq as eq4, and as and2 } from "drizzle-orm";
import axios from "axios";
var isProduction = process.env.NODE_ENV === "production";
var MPESA_BASE_URL = isProduction ? "https://api.safaricom.co.ke" : "https://sandbox.safaricom.co.ke";
var MPESA_SHORTCODE = process.env.MPESA_SHORTCODE || "174379";
var MPESA_PASSKEY = process.env.MPESA_PASSKEY || "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919";
var MPESA_CALLBACK_URL = process.env.MPESA_CALLBACK_URL || (process.env.APP_URL ? `${process.env.APP_URL.replace(/\/$/, "")}/api/payments/callback` : "https://your-domain.com/api/payments/callback");
var accessToken = null;
var tokenExpiry = null;
async function getMpesaAccessToken() {
  if (accessToken && tokenExpiry && /* @__PURE__ */ new Date() < new Date(tokenExpiry.getTime() - 6e4)) {
    return accessToken;
  }
  const consumerKey = process.env.MPESA_CONSUMER_KEY || "";
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET || "";
  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString(
    "base64"
  );
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
  const now = /* @__PURE__ */ new Date();
  const timestamp2 = now.getFullYear().toString() + (now.getMonth() + 1).toString().padStart(2, "0") + now.getDate().toString().padStart(2, "0") + now.getHours().toString().padStart(2, "0") + now.getMinutes().toString().padStart(2, "0") + now.getSeconds().toString().padStart(2, "0");
  const password = Buffer.from(
    `${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp2}`
  ).toString("base64");
  return { password, timestamp: timestamp2 };
}
function formatPhoneNumber(phone) {
  let cleaned = phone.replace(/[\s\-\+]/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = "254" + cleaned.slice(1);
  }
  if (!/^254[17]\d{8}$/.test(cleaned)) {
    throw new Error("Invalid Kenyan phone number format");
  }
  return cleaned;
}
var paymentsRouter = router({
  // Initiate STK Push
  initiateStkPush: publicProcedure.input(
    z4.object({
      orderId: z4.number(),
      phoneNumber: z4.string()
    })
  ).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const orderResult = await db.select().from(orders).where(
      and2(eq4(orders.id, input.orderId), eq4(orders.status, "pending"))
    ).limit(1).execute();
    if (orderResult.length === 0) {
      throw new Error("Order not found or not in pending state");
    }
    const order = orderResult[0];
    const phone = formatPhoneNumber(input.phoneNumber);
    const amount = Math.round(Number(order.totalPrice));
    const { password, timestamp: timestamp2 } = generatePassword();
    const token = await getMpesaAccessToken();
    try {
      const response = await axios.post(
        `${MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest`,
        {
          BusinessShortCode: MPESA_SHORTCODE,
          Password: password,
          Timestamp: timestamp2,
          TransactionType: "CustomerPayBillOnline",
          Amount: amount,
          PartyA: phone,
          PartyB: MPESA_SHORTCODE,
          PhoneNumber: phone,
          CallBackURL: MPESA_CALLBACK_URL,
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
      await db.insert(mpesaTransactions).values({
        orderId: input.orderId,
        checkoutRequestID: response.data.CheckoutRequestID,
        merchantRequestID: response.data.MerchantRequestID,
        phoneNumber: phone,
        amount: amount.toString(),
        accountReference: `PB${input.orderId}`,
        status: "pending"
      });
      return {
        success: true,
        checkoutRequestID: response.data.CheckoutRequestID,
        message: "STK Push sent successfully. Check your phone."
      };
    } catch (error) {
      const errorMsg = error.response?.data?.errorMessage || error.message || "STK Push failed";
      throw new Error(`M-Pesa STK Push failed: ${errorMsg}`);
    }
  }),
  // Query payment status
  queryStatus: publicProcedure.input(z4.object({ checkoutRequestID: z4.string() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const transaction = await db.select().from(mpesaTransactions).where(
      eq4(mpesaTransactions.checkoutRequestID, input.checkoutRequestID)
    ).limit(1).execute();
    if (transaction.length === 0) {
      throw new Error("Transaction not found");
    }
    const tx = transaction[0];
    if (tx.status === "completed") {
      return {
        status: "completed",
        mpesaReceiptNumber: tx.mpesaReceiptNumber,
        resultCode: tx.resultCode ?? 0
      };
    }
    const { password, timestamp: timestamp2 } = generatePassword();
    const token = await getMpesaAccessToken();
    try {
      const response = await axios.post(
        `${MPESA_BASE_URL}/mpesa/stkpushquery/v1/query`,
        {
          BusinessShortCode: MPESA_SHORTCODE,
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
        const metadata = {};
        response.data.CallbackMetadata?.Item?.forEach((item) => {
          metadata[item.Name] = item.Value;
        });
        await db.update(mpesaTransactions).set({
          status: "completed",
          mpesaReceiptNumber: metadata.MpesaReceiptNumber || null,
          resultCode,
          resultDesc: response.data.ResultDesc
        }).where(
          eq4(
            mpesaTransactions.checkoutRequestID,
            input.checkoutRequestID
          )
        );
        await db.update(orders).set({
          paymentStatus: "completed",
          mpesaTransactionId: metadata.MpesaReceiptNumber || null,
          status: "confirmed"
        }).where(eq4(orders.id, tx.orderId));
        return {
          status: "completed",
          mpesaReceiptNumber: metadata.MpesaReceiptNumber,
          resultCode: 0
        };
      } else {
        const status = resultCode === 1032 ? "cancelled" : "failed";
        await db.update(mpesaTransactions).set({
          status,
          resultCode,
          resultDesc: response.data.ResultDesc
        }).where(
          eq4(
            mpesaTransactions.checkoutRequestID,
            input.checkoutRequestID
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
  // Get order payment status
  getOrderPaymentStatus: publicProcedure.input(z4.object({ orderId: z4.number() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return { paymentStatus: "unknown" };
    const orderResult = await db.select().from(orders).where(eq4(orders.id, input.orderId)).limit(1).execute();
    if (orderResult.length === 0) {
      throw new Error("Order not found");
    }
    const order = orderResult[0];
    const txResult = await db.select().from(mpesaTransactions).where(eq4(mpesaTransactions.orderId, input.orderId)).limit(1).execute();
    return {
      paymentStatus: order.paymentStatus,
      orderStatus: order.status,
      mpesaReceiptNumber: txResult.length > 0 ? txResult[0].mpesaReceiptNumber : null
    };
  })
});

// server/routers/reviews.ts
import { z as z5 } from "zod";
init_db();
init_schema();
import { eq as eq5, desc as desc2 } from "drizzle-orm";
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
    const allReviews = await db.select().from(reviews).where(eq5(reviews.approved, 1)).orderBy(desc2(reviews.createdAt)).execute();
    const filtered = input?.menuItemId ? allReviews.filter((r) => r.menuItemId === input.menuItemId) : allReviews;
    return filtered.slice(0, input?.limit || 20);
  }),
  // Get average rating
  getAverageRating: publicProcedure.input(z5.object({ menuItemId: z5.number().optional() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return { average: 0, count: 0 };
    const allReviews = await db.select().from(reviews).where(eq5(reviews.approved, 1)).execute();
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
    return db.select().from(reviews).where(eq5(reviews.approved, 0)).orderBy(desc2(reviews.createdAt)).execute();
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
    await db.update(reviews).set({ approved: input.approved ? 1 : 0 }).where(eq5(reviews.id, input.id)).execute();
    return { success: true };
  }),
  // Admin: Delete review
  delete: adminProcedure.input(z5.object({ id: z5.number() })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.delete(reviews).where(eq5(reviews.id, input.id)).execute();
    return { success: true };
  })
});

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
import { z as z6 } from "zod";
init_db();
init_schema();
import { eq as eq6 } from "drizzle-orm";
var getAdminPassword = () => {
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
var ADMIN_PASSWORD = getAdminPassword();
var adminRouter = router({
  // Login with password
  login: publicProcedure.input(z6.object({ password: z6.string() })).mutation(async ({ input, ctx }) => {
    if (input.password !== ADMIN_PASSWORD) {
      throw new Error("Invalid password");
    }
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    let adminUser = await db.select().from(users).where(eq6(users.role, "admin")).limit(1).execute();
    if (adminUser.length === 0) {
      const result = await db.insert(users).values({
        openId: "admin-local",
        name: "Passua Bites Admin",
        role: "admin"
      }).execute();
      adminUser = [
        {
          id: Number(result.insertId || 0),
          openId: "admin-local",
          name: "Passua Bites Admin",
          role: "admin"
        }
      ];
    }
    const admin = adminUser[0];
    const token = await sdk.createSessionToken(admin.openId, {
      name: admin.name || "Admin",
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
      userId: admin.id
    };
  })
});

// server/routers/analytics.ts
init_db();
init_schema();
import { sql } from "drizzle-orm";
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
      db.execute(sql`
          SELECT
            SUM(CASE WHEN "browser" != 'Bot/Crawler' THEN 1 ELSE 0 END) AS total_pageviews,
            COUNT(DISTINCT CASE WHEN "browser" != 'Bot/Crawler' THEN "sessionId" END) AS total_sessions,
            COUNT(DISTINCT CASE WHEN "browser" != 'Bot/Crawler' THEN "ip" END) AS unique_ips,
            SUM(CASE WHEN "browser" = 'Bot/Crawler' THEN 1 ELSE 0 END) AS bot_hits
          FROM "analyticsEvents"
          WHERE "createdAt" >= NOW() - INTERVAL '30 days'
            AND "eventType" = 'pageview'
        `),
      db.execute(sql`
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
      db.execute(sql`
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
      db.execute(sql`
          SELECT
            COALESCE("device", 'unknown')   AS device,
            COUNT(DISTINCT "sessionId")     AS sessions
          FROM "analyticsEvents"
          WHERE "createdAt" >= NOW() - INTERVAL '30 days'
            AND "browser" != 'Bot/Crawler'
          GROUP BY "device"
          ORDER BY sessions DESC
        `),
      db.execute(sql`
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
      db.execute(sql`
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
      db.execute(sql`
          SELECT
            COALESCE("browser", 'Other')    AS browser,
            COUNT(DISTINCT "sessionId")     AS sessions
          FROM "analyticsEvents"
          WHERE "createdAt" >= NOW() - INTERVAL '30 days'
            AND "browser" != 'Bot/Crawler'
          GROUP BY "browser"
          ORDER BY sessions DESC
        `),
      db.execute(sql`
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
      db.execute(sql`
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
      db.execute(sql`
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
      db.execute(sql`
          SELECT
            EXTRACT(HOUR FROM "createdAt")::int AS hour,
            COUNT(*)                            AS orders
          FROM "orders"
          WHERE "createdAt" >= NOW() - INTERVAL '30 days'
          GROUP BY hour
          ORDER BY hour ASC
        `),
      db.execute(sql`
          SELECT
            ROUND(AVG("totalPrice"::numeric), 2)  AS avg_order_value,
            COUNT(*)                              AS total_orders,
            SUM("totalPrice"::numeric)            AS total_revenue
          FROM "orders"
          WHERE "paymentStatus" = 'completed'
        `),
      db.execute(sql`
          SELECT
            COUNT(*)                                                AS total_customers,
            SUM(CASE WHEN order_count > 1 THEN 1 ELSE 0 END)       AS repeat_customers
          FROM (
            SELECT "customerPhone", COUNT(*) AS order_count
            FROM "orders"
            GROUP BY "customerPhone"
          ) sub
        `),
      db.execute(sql`
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
import { z as z9 } from "zod";
init_db();
init_schema();
import { eq as eq7, desc as desc3, and as and4, or, isNull, gte, lte } from "drizzle-orm";
var announcementsRouter = router({
  // Public: active announcements currently in window
  listActive: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    const now = /* @__PURE__ */ new Date();
    return db.select().from(announcements).where(
      and4(
        eq7(announcements.active, 1),
        or(isNull(announcements.startsAt), lte(announcements.startsAt, now)),
        or(isNull(announcements.endsAt), gte(announcements.endsAt, now))
      )
    ).orderBy(desc3(announcements.createdAt)).execute();
  }),
  // Admin: all
  listAll: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(announcements).orderBy(desc3(announcements.createdAt)).execute();
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
    await db.update(announcements).set(patch).where(eq7(announcements.id, input.id)).execute();
    return { success: true };
  }),
  delete: adminProcedure.input(z9.object({ id: z9.number() })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.delete(announcements).where(eq7(announcements.id, input.id)).execute();
    return { success: true };
  }),
  toggle: adminProcedure.input(z9.object({ id: z9.number(), active: z9.boolean() })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.update(announcements).set({ active: input.active ? 1 : 0, updatedAt: /* @__PURE__ */ new Date() }).where(eq7(announcements.id, input.id)).execute();
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

// server/mpesaCallback.ts
init_db();
init_schema();
init_logger();
import { eq as eq8 } from "drizzle-orm";
async function processMpesaCallback(body) {
  try {
    const { Body } = body || {};
    if (!Body || !Body.stkCallback) {
      logger.error("[M-Pesa] Invalid callback payload (missing stkCallback)");
      return;
    }
    const { stkCallback } = Body;
    const {
      ResultCode,
      CheckoutRequestID,
      CallbackMetadata,
      ResultDesc
    } = stkCallback;
    const code = Number(ResultCode);
    const db = await getDb();
    if (!db) {
      logger.error("[M-Pesa] Database not available for callback");
      return;
    }
    const tx = await db.select().from(mpesaTransactions).where(eq8(mpesaTransactions.checkoutRequestID, CheckoutRequestID)).limit(1).execute();
    if (tx.length === 0) {
      logger.error(
        { checkoutRequestID: CheckoutRequestID },
        "[M-Pesa] Transaction not found for callback"
      );
      return;
    }
    if (tx[0].status === "completed") {
      logger.info(
        { checkoutRequestID: CheckoutRequestID },
        "[M-Pesa] Duplicate callback, skipping"
      );
      return;
    }
    if (code !== 0) {
      const status = code === 1032 ? "cancelled" : "failed";
      await db.update(mpesaTransactions).set({
        status,
        resultCode: code,
        resultDesc: ResultDesc || null
      }).where(eq8(mpesaTransactions.checkoutRequestID, CheckoutRequestID));
      await db.update(orders).set({ paymentStatus: "failed" }).where(eq8(orders.id, tx[0].orderId));
      logger.info(
        { status, code, checkoutRequestID: CheckoutRequestID, orderId: tx[0].orderId },
        "[M-Pesa] Payment not completed"
      );
      return;
    }
    const metadata = {};
    CallbackMetadata?.Item?.forEach((item) => {
      metadata[item.Name] = item.Value;
    });
    const { MpesaReceiptNumber, Amount } = metadata;
    if (Amount !== void 0 && Number(Amount) !== Number(tx[0].amount)) {
      logger.error(
        {
          expected: tx[0].amount,
          received: Amount,
          orderId: tx[0].orderId,
          checkoutRequestID: CheckoutRequestID
        },
        "[M-Pesa] Amount mismatch in callback"
      );
      return;
    }
    await db.update(mpesaTransactions).set({
      status: "completed",
      mpesaReceiptNumber: MpesaReceiptNumber || null,
      resultCode: code,
      resultDesc: ResultDesc || null
    }).where(eq8(mpesaTransactions.checkoutRequestID, CheckoutRequestID));
    await db.update(orders).set({
      paymentStatus: "completed",
      mpesaTransactionId: MpesaReceiptNumber || null,
      status: "confirmed"
    }).where(eq8(orders.id, tx[0].orderId));
    logger.info(
      {
        orderId: tx[0].orderId,
        receipt: MpesaReceiptNumber,
        amount: Amount
      },
      "[M-Pesa] Payment confirmed"
    );
  } catch (error) {
    logger.error({ err: error }, "[M-Pesa] Callback processing error");
  }
}

// server/vercel-entry.ts
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
  await processMpesaCallback(req.body);
  res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });
});
var generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1e3,
  max: process.env.NODE_ENV === "production" ? 200 : 500,
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
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
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
