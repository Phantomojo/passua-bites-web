import { z } from "zod";
import { publicProcedure, adminProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { announcements } from "../../drizzle/schema";
import { eq, desc, and, or, isNull, gte, lte } from "drizzle-orm";

export const announcementsRouter = router({
  // Public: active announcements currently in window
  listActive: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    const now = new Date();
    return db
      .select()
      .from(announcements)
      .where(
        and(
          eq(announcements.active, 1),
          or(isNull(announcements.startsAt), lte(announcements.startsAt, now)),
          or(isNull(announcements.endsAt), gte(announcements.endsAt, now))
        )
      )
      .orderBy(desc(announcements.createdAt))
      .execute();
  }),

  // Admin: all
  listAll: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(announcements).orderBy(desc(announcements.createdAt)).execute();
  }),

  create: adminProcedure
    .input(
      z.object({
        title: z.string().min(1).max(255),
        body: z.string().max(2000).optional(),
        type: z.enum(["info", "offer", "alert"]).default("info"),
        active: z.boolean().default(true),
        startsAt: z.string().datetime().optional(),
        endsAt: z.string().datetime().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const [row] = await db
        .insert(announcements)
        .values({
          title: input.title,
          body: input.body || null,
          type: input.type,
          active: input.active ? 1 : 0,
          startsAt: input.startsAt ? new Date(input.startsAt) : null,
          endsAt: input.endsAt ? new Date(input.endsAt) : null,
        })
        .returning({ id: announcements.id });
      return { success: true, id: row.id };
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().min(1).max(255).optional(),
        body: z.string().max(2000).optional(),
        type: z.enum(["info", "offer", "alert"]).optional(),
        active: z.boolean().optional(),
        startsAt: z.string().datetime().nullable().optional(),
        endsAt: z.string().datetime().nullable().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const patch: any = { updatedAt: new Date() };
      if (input.title !== undefined) patch.title = input.title;
      if (input.body !== undefined) patch.body = input.body || null;
      if (input.type !== undefined) patch.type = input.type;
      if (input.active !== undefined) patch.active = input.active ? 1 : 0;
      if (input.startsAt !== undefined)
        patch.startsAt = input.startsAt ? new Date(input.startsAt) : null;
      if (input.endsAt !== undefined)
        patch.endsAt = input.endsAt ? new Date(input.endsAt) : null;
      await db.update(announcements).set(patch).where(eq(announcements.id, input.id)).execute();
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.delete(announcements).where(eq(announcements.id, input.id)).execute();
      return { success: true };
    }),

  toggle: adminProcedure
    .input(z.object({ id: z.number(), active: z.boolean() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db
        .update(announcements)
        .set({ active: input.active ? 1 : 0, updatedAt: new Date() })
        .where(eq(announcements.id, input.id))
        .execute();
      return { success: true };
    }),
});