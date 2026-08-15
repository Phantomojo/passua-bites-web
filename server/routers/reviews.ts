import { z } from "zod";
import { publicProcedure, adminProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { reviews } from "../../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";

export const reviewsRouter = router({
  // Submit a review
  create: publicProcedure
    .input(
      z.object({
        orderId: z.number().optional(),
        menuItemId: z.number().optional(),
        customerName: z.string().min(2).max(255),
        rating: z.number().min(1).max(5),
        reviewText: z.string().max(1000).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .insert(reviews)
        .values({
          orderId: input.orderId || null,
          menuItemId: input.menuItemId || null,
          customerName: input.customerName,
          rating: input.rating,
          reviewText: input.reviewText || null,
          approved: 0, // Pending moderation
        })
        .execute();

      return { success: true, message: "Review submitted for moderation" };
    }),

  // List approved reviews
  list: publicProcedure
    .input(
      z
        .object({
          menuItemId: z.number().optional(),
          limit: z.number().min(1).max(100).default(20),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const allReviews = await db
        .select()
        .from(reviews)
        .where(eq(reviews.approved, 1))
        .orderBy(desc(reviews.createdAt))
        .execute();

      const filtered = input?.menuItemId
        ? allReviews.filter((r) => r.menuItemId === input.menuItemId)
        : allReviews;

      return filtered.slice(0, input?.limit || 20);
    }),

  // Get average rating
  getAverageRating: publicProcedure
    .input(z.object({ menuItemId: z.number().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { average: 0, count: 0 };

      const allReviews = await db
        .select()
        .from(reviews)
        .where(eq(reviews.approved, 1))
        .execute();

      const filtered = input.menuItemId
        ? allReviews.filter((r) => r.menuItemId === input.menuItemId)
        : allReviews;

      if (filtered.length === 0) {
        return { average: 0, count: 0 };
      }

      const average =
        filtered.reduce((sum, r) => sum + r.rating, 0) / filtered.length;

      return {
        average: Math.round(average * 10) / 10,
        count: filtered.length,
      };
    }),

  // Admin: List pending reviews
  listPending: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db
      .select()
      .from(reviews)
      .where(eq(reviews.approved, 0))
      .orderBy(desc(reviews.createdAt))
      .execute();
  }),

  // Admin: Approve or reject review
  moderate: adminProcedure
    .input(
      z.object({
        id: z.number(),
        approved: z.boolean(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db
        .update(reviews)
        .set({ approved: input.approved ? 1 : 0 })
        .where(eq(reviews.id, input.id))
        .execute();
      return { success: true };
    }),

  // Admin: Delete review
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.delete(reviews).where(eq(reviews.id, input.id)).execute();
      return { success: true };
    }),
});
