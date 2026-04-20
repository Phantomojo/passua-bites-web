import { z } from "zod";
import { publicProcedure, adminProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { orders, orderItems } from "../../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";

// Phone validation for Kenyan numbers
const phoneRegex = /^(?:\+254|0)[7][0-9]{8}$/;

export const ordersRouter = router({
  // Create a new order
  create: publicProcedure
    .input(
      z.object({
        customerName: z.string().min(2).max(255),
        customerPhone: z
          .string()
          .regex(phoneRegex, "Invalid Kenyan phone number"),
        customerEmail: z.string().email().optional(),
        deliveryAddress: z.string().min(5).max(500),
        items: z
          .array(
            z.object({
              menuItemId: z.number(),
              quantity: z.number().min(1).max(50),
            })
          )
          .min(1)
          .max(20),
        paymentMethod: z.enum(["mpesa", "cash"]).default("mpesa"),
        notes: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Fetch menu items to calculate total and verify availability
      // Get actual menu items
      const { menuItems: menuItemsTable } =
        await import("../../drizzle/schema");
      const availableItems = await db
        .select()
        .from(menuItemsTable)
        .where(eq(menuItemsTable.available, 1))
        .execute();

      let totalPrice = 0;
      const orderItemsData: Array<{
        menuItemId: number;
        quantity: number;
        priceAtTime: string;
      }> = [];

      for (const item of input.items) {
        const menuItem = availableItems.find(m => m.id === item.menuItemId);
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
          priceAtTime: menuItem.price,
        });
      }

      // Create order
      const [inserted] = await db
        .insert(orders)
        .values({
          customerName: input.customerName,
          customerPhone: input.customerPhone,
          customerEmail: input.customerEmail || null,
          deliveryAddress: input.deliveryAddress,
          totalPrice: totalPrice.toFixed(2),
          status: "pending",
          paymentMethod: input.paymentMethod,
          paymentStatus: "pending",
          notes: input.notes || null,
        })
        .returning({ id: orders.id });

      const orderId = inserted.id;

      // Create order items
      for (const oi of orderItemsData) {
        await db
          .insert(orderItems)
          .values({
            orderId,
            menuItemId: oi.menuItemId,
            quantity: oi.quantity,
            priceAtTime: oi.priceAtTime,
          })
          .execute();
      }

      return {
        success: true,
        orderId,
        totalPrice,
      };
    }),

  // Track order by ID
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return undefined;

      const orderResult = await db
        .select()
        .from(orders)
        .where(eq(orders.id, input.id))
        .limit(1)
        .execute();

      if (orderResult.length === 0) return undefined;

      const order = orderResult[0];

      // Get order items with menu item names
      const { menuItems: menuItemsTable } =
        await import("../../drizzle/schema");
      const items = await db
        .select({
          id: orderItems.id,
          quantity: orderItems.quantity,
          priceAtTime: orderItems.priceAtTime,
          name: menuItemsTable.name,
        })
        .from(orderItems)
        .leftJoin(menuItemsTable, eq(orderItems.menuItemId, menuItemsTable.id))
        .where(eq(orderItems.orderId, input.id))
        .execute();

      return { ...order, items };
    }),

  // List orders by phone number
  listByPhone: publicProcedure
    .input(z.object({ phone: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db
        .select()
        .from(orders)
        .where(eq(orders.customerPhone, input.phone))
        .orderBy(desc(orders.createdAt))
        .limit(50)
        .execute();
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
        id: z.number(),
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
      await db
        .update(orders)
        .set({ status: input.status })
        .where(eq(orders.id, input.id))
        .execute();
      return { success: true };
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
