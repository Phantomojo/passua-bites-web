import { nanoid } from "nanoid";
import { z } from "zod";
import { publicProcedure, adminProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { orders, orderItems, menuItems, customerMessagingPreferences } from "../../drizzle/schema";
import { eq, desc, inArray } from "drizzle-orm";
import { logger } from "../logger";
import { normalizeKenyanWhatsAppPhone, sendWhatsAppTemplateMessage } from "../_core/whatsapp";

// Phone validation for Kenyan numbers
const phoneRegex = /^(?:\+254|0)[7][0-9]{8}$/;
const trackingTokenRegex = /^[A-Za-z0-9_-]{32}$/;

const DELIVERY_FEES = {
  ruiru: 0,
  environs: 50,
  other: null,
} as const;

type DeliveryZone = keyof typeof DELIVERY_FEES;

export function maskPhone(phone: string): string {
  return `••••••${phone.slice(-4)}`;
}

export function maskName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "Customer";
  const parts = trimmed.split(/\s+/);
  return parts.length > 1
    ? `${parts[0].charAt(0)}••• ${parts[parts.length - 1].charAt(0)}•••`
    : `${trimmed.charAt(0)}•••`;
}

async function getPublicOrderByTrackingToken(
  trackingToken: string,
  db: Awaited<ReturnType<typeof getDb>>
) {
  if (!db) return undefined;

  const orderResult = await db
    .select()
    .from(orders)
    .where(eq(orders.trackingToken, trackingToken))
    .limit(1)
    .execute();

  if (orderResult.length === 0) return undefined;
  const order = orderResult[0];

  const items = await db
    .select({
      id: orderItems.id,
      quantity: orderItems.quantity,
      priceAtTime: orderItems.priceAtTime,
      name: menuItems.name,
    })
    .from(orderItems)
    .leftJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
    .where(eq(orderItems.orderId, order.id))
    .execute();

  return {
    id: order.id,
    trackingToken: order.trackingToken,
    customerName: maskName(order.customerName),
    customerPhone: maskPhone(order.customerPhone),
    deliveryAddress: order.deliveryAddress ? "Delivery address on file" : null,
    subtotal: order.subtotal,
    deliveryFee: order.deliveryFee,
    totalPrice: order.totalPrice,
    status: order.status,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    items,
  };
}

export const ordersRouter = router({
  // Create a new order. Prices and delivery fees are calculated from server-side data.
  create: publicProcedure
    .input(
      z.object({
        customerName: z.string().trim().min(2).max(255),
        customerPhone: z
          .string()
          .regex(phoneRegex, "Invalid Kenyan phone number"),
        customerEmail: z.string().email().optional(),
        deliveryAddress: z.string().trim().min(5).max(500),
        deliveryZone: z.enum(["ruiru", "environs", "other"]),
        items: z
          .array(
            z.object({
              menuItemId: z.number().int().positive(),
              quantity: z.number().int().min(1).max(50),
            })
          )
          .min(1)
          .max(20),
        paymentMethod: z.enum(["pochi", "cash", "mpesa"]).default("pochi"),
        whatsappOrderUpdatesOptIn: z.boolean().default(false),
        whatsappMarketingOptIn: z.boolean().default(false),
        notes: z.string().trim().max(500).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      if (input.deliveryZone === "other") {
        throw new Error("Orders outside Ruiru require a delivery quote via WhatsApp");
      }

      const requestedMenuItems = await db
        .select()
        .from(menuItems)
        .where(inArray(menuItems.id, input.items.map(item => item.menuItemId)))
        .execute();

      let subtotal = 0;
      const orderItemsData: Array<{
        menuItemId: number;
        quantity: number;
        priceAtTime: string;
      }> = [];

      for (const item of input.items) {
        const menuItem = requestedMenuItems.find(m => m.id === item.menuItemId);
        if (!menuItem) throw new Error("One of the selected menu items is no longer available.");
        if (menuItem.available !== 1) {
          throw new Error(`${menuItem.name} is sold out. Remove it from your cart and try again.`);
        }
        const lineTotal = Number(menuItem.price) * item.quantity;
        subtotal += lineTotal;
        orderItemsData.push({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          priceAtTime: menuItem.price,
        });
      }

      const deliveryFee = DELIVERY_FEES[input.deliveryZone as DeliveryZone];
      if (deliveryFee === null) {
        throw new Error("A delivery quote is required for this location");
      }
      const totalPrice = subtotal + deliveryFee;
      const trackingToken = nanoid(32);

      const orderId = await db.transaction(async tx => {
        const [inserted] = await tx
          .insert(orders)
          .values({
            customerName: input.customerName,
            customerPhone: input.customerPhone,
            customerEmail: input.customerEmail || null,
            deliveryAddress: input.deliveryAddress,
            trackingToken,
            subtotal: subtotal.toFixed(2),
            deliveryFee: deliveryFee.toFixed(2),
            deliveryZone: input.deliveryZone,
            totalPrice: totalPrice.toFixed(2),
            status: "pending",
            paymentMethod: input.paymentMethod,
            paymentStatus: "pending",
            notes: input.notes || null,
            whatsappOrderUpdatesOptIn: input.whatsappOrderUpdatesOptIn,
            whatsappOrderUpdatesOptInAt: input.whatsappOrderUpdatesOptIn ? new Date() : null,
          })
          .returning({ id: orders.id });

        for (const oi of orderItemsData) {
          await tx.insert(orderItems).values({
            orderId: inserted.id,
            menuItemId: oi.menuItemId,
            quantity: oi.quantity,
            priceAtTime: oi.priceAtTime,
          });
        }

        return inserted.id;
      });

      // Marketing consent is separate from per-order transactional consent.
      if (input.whatsappMarketingOptIn) {
        try {
          const phone = normalizeKenyanWhatsAppPhone(input.customerPhone);
          const consentedAt = new Date();
          await db.insert(customerMessagingPreferences).values({
            phone, whatsappMarketingOptIn: true, marketingOptInAt: consentedAt,
            marketingOptOutAt: null, marketingConsentSource: "checkout", updatedAt: consentedAt,
          }).onConflictDoUpdate({
            target: customerMessagingPreferences.phone,
            set: {
              whatsappMarketingOptIn: true, marketingOptInAt: consentedAt,
              marketingOptOutAt: null, marketingConsentSource: "checkout", updatedAt: consentedAt,
            },
          });
        } catch (error) {
          logger.error({ err: error, orderId }, "[WhatsApp] Failed to store marketing consent");
        }
      }

      let whatsappNotificationStatus: "not_requested" | "not_configured" | "sent" | "failed" =
        input.whatsappOrderUpdatesOptIn ? "not_configured" : "not_requested";
      if (input.whatsappOrderUpdatesOptIn) {
        const notification = await sendWhatsAppTemplateMessage({
          to: input.customerPhone,
          templateName: process.env.WHATSAPP_ORDER_RECEIVED_TEMPLATE,
          parameters: [
            input.customerName, `PB-${orderId}`, `KSh ${totalPrice.toFixed(2)}`,
            input.paymentMethod === "pochi" ? "Pochi payment is awaiting staff verification" : "Cash on delivery",
          ],
        });
        whatsappNotificationStatus = notification.status;
        if (notification.status === "failed") {
          logger.warn({ orderId, reason: notification.reason }, "[WhatsApp] Order-received notification failed");
        }
      }

      return { success: true, orderId, trackingToken, subtotal, deliveryFee, totalPrice, whatsappNotificationStatus };
    }),

  // Public tracking requires a high-entropy token. The response is intentionally masked.
  getByTrackingToken: publicProcedure
    .input(z.object({ trackingToken: z.string().regex(trackingTokenRegex) }))
    .query(async ({ input }) => {
      const db = await getDb();
      return getPublicOrderByTrackingToken(input.trackingToken, db);
    }),

  // Admin: List all orders
  listAll: adminProcedure
    .input(
      z
        .object({
          status: z
            .enum([
              "pending",
              "confirmed",
              "preparing",
              "ready",
              "delivered",
              "cancelled",
            ])
            .optional(),
          limit: z.number().min(1).max(100).default(50),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const limit = input?.limit || 50;

      if (input?.status) {
        return db
          .select()
          .from(orders)
          .orderBy(desc(orders.createdAt))
          .where(eq(orders.status, input.status))
          .limit(limit)
          .execute();
      }

      return db
        .select()
        .from(orders)
        .orderBy(desc(orders.createdAt))
        .limit(limit)
        .execute();
    }),

  // Admin: Update order status
  updateStatus: adminProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        status: z.enum([
          "pending",
          "confirmed",
          "preparing",
          "ready",
          "delivered",
          "cancelled",
        ]),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const [order] = await db
        .select({
          paymentMethod: orders.paymentMethod, paymentStatus: orders.paymentStatus,
          status: orders.status, customerName: orders.customerName,
          customerPhone: orders.customerPhone, totalPrice: orders.totalPrice,
          whatsappOrderUpdatesOptIn: orders.whatsappOrderUpdatesOptIn,
        })
        .from(orders)
        .where(eq(orders.id, input.id))
        .limit(1)
        .execute();
      if (!order) throw new Error("Order not found");
      if (
        ["confirmed", "preparing", "ready", "delivered"].includes(input.status) &&
        order.paymentMethod === "pochi" &&
        order.paymentStatus !== "completed"
      ) {
        throw new Error("Verify the Pochi receipt before fulfillment can begin");
      }

      await db
        .update(orders)
        .set({ status: input.status, updatedAt: new Date() })
        .where(eq(orders.id, input.id))
        .execute();

      let whatsappNotificationStatus: "not_requested" | "not_configured" | "sent" | "failed" =
        order.whatsappOrderUpdatesOptIn ? "not_configured" : "not_requested";
      if (order.whatsappOrderUpdatesOptIn && order.status !== input.status) {
        const notification = await sendWhatsAppTemplateMessage({
          to: order.customerPhone,
          templateName: process.env.WHATSAPP_ORDER_STATUS_TEMPLATE,
          parameters: [order.customerName, `PB-${input.id}`, input.status, `KSh ${Number(order.totalPrice).toFixed(2)}`],
        });
        whatsappNotificationStatus = notification.status;
        if (notification.status === "failed") {
          logger.warn({ orderId: input.id, reason: notification.reason }, "[WhatsApp] Order-status notification failed");
        }
      }
      return { success: true, whatsappNotificationStatus };
    }),

  // Admin: Get dashboard stats
  getStats: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db)
      return {
        totalOrders: 0,
        pendingOrders: 0,
        todayRevenue: 0,
        totalRevenue: 0,
      };

    const allOrders = await db.select().from(orders).execute();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayOrders = allOrders.filter(o => new Date(o.createdAt) >= today);

    return {
      totalOrders: allOrders.length,
      pendingOrders: allOrders.filter(o => o.status === "pending").length,
      todayRevenue: todayOrders
        .filter(o => o.paymentStatus === "completed")
        .reduce((sum, o) => sum + Number(o.totalPrice), 0),
      totalRevenue: allOrders
        .filter(o => o.paymentStatus === "completed")
        .reduce((sum, o) => sum + Number(o.totalPrice), 0),
    };
  }),
});
