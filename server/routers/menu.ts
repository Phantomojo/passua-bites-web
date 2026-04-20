import { z } from "zod";
import { publicProcedure, adminProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { menuItems } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const menuRouter = router({
  // List all available menu items
  list: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db
      .select()
      .from(menuItems)
      .where(eq(menuItems.available, 1))
      .execute();
  }),

  // Get single menu item by ID
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return undefined;
      const result = await db
        .select()
        .from(menuItems)
        .where(eq(menuItems.id, input.id))
        .limit(1)
        .execute();
      return result.length > 0 ? result[0] : undefined;
    }),

  // Admin: Create new menu item
  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(2).max(255),
        description: z.string().max(1000).optional(),
        price: z.number().positive().max(99999.99),
        imageUrl: z.string().optional(),
        videoUrl: z.string().optional(),
        category: z.string().max(100).optional(),
        available: z.boolean().default(true),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const result = await db
        .insert(menuItems)
        .values({
          name: input.name,
          description: input.description || null,
          price: input.price.toString(),
          imageUrl: input.imageUrl || null,
          videoUrl: input.videoUrl || null,
          category: input.category || null,
          available: input.available ? 1 : 0,
        })
        .execute();
      return { success: true, insertId: Number((result as any).insertId || 0) };
    }),

  // Admin: Update menu item
  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(2).max(255).optional(),
        description: z.string().max(1000).optional(),
        price: z.number().positive().max(99999.99).optional(),
        imageUrl: z.string().optional().nullable(),
        videoUrl: z.string().optional().nullable(),
        category: z.string().max(100).optional(),
        available: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const updates: Record<string, unknown> = {};
      if (input.name !== undefined) updates.name = input.name;
      if (input.description !== undefined)
        updates.description = input.description;
      if (input.price !== undefined) updates.price = input.price.toString();
      if (input.imageUrl !== undefined)
        updates.imageUrl = input.imageUrl || null;
      if (input.videoUrl !== undefined)
        updates.videoUrl = input.videoUrl || null;
      if (input.category !== undefined) updates.category = input.category;
      if (input.available !== undefined)
        updates.available = input.available ? 1 : 0;

      if (Object.keys(updates).length === 0) {
        return { success: false, message: "No fields to update" };
      }

      await db
        .update(menuItems)
        .set(updates)
        .where(eq(menuItems.id, input.id))
        .execute();

      return { success: true };
    }),

  // Admin: Delete menu item
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.delete(menuItems).where(eq(menuItems.id, input.id)).execute();
      return { success: true };
    }),

  // Admin: Toggle availability
  toggleAvailability: adminProcedure
    .input(z.object({ id: z.number(), available: z.boolean() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db
        .update(menuItems)
        .set({ available: input.available ? 1 : 0 })
        .where(eq(menuItems.id, input.id))
        .execute();
      return { success: true };
    }),
});
