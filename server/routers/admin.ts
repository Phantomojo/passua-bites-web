import { z } from "zod";
import { publicProcedure, adminProcedure, router, requireRole } from "../_core/trpc";
import { getDb } from "../db";
import * as db from "../db";
import { adminUsers } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { hashPassword, verifyPassword } from "../_core/password";
import { createAdminSession, revokeAdminSession, revokeAllAdminSessions } from "../_core/adminAuth";

const getAdminSeedPassword = () => {
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

async function ensureSeedAdmin() {
  const database = await getDb();
  if (!database) return;
  const existing = await database.select().from(adminUsers).limit(1).execute();
  if (existing.length === 0) {
    const seedPassword = getAdminSeedPassword();
    await database.insert(adminUsers).values({
      username: "admin",
      passwordHash: hashPassword(seedPassword),
      name: "Passua Bites Admin",
      role: "owner",
      isActive: true,
    });
  }
}

export const adminRouter = router({
  me: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.adminUser) return null;
    return {
      id: ctx.adminUser.id,
      username: ctx.adminUser.username,
      name: ctx.adminUser.name,
      role: ctx.adminUser.role,
      isActive: ctx.adminUser.isActive,
    };
  }),

  login: publicProcedure
    .input(z.object({ username: z.string().min(1), password: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      const database = await getDb();
      if (!database) throw new Error("Database not available");

      await ensureSeedAdmin();

      const [user] = await database
        .select()
        .from(adminUsers)
        .where(eq(adminUsers.username, input.username))
        .limit(1)
        .execute();

      if (!user || !user.isActive || !verifyPassword(input.password, user.passwordHash)) {
        throw new Error("Invalid username or password");
      }

      await createAdminSession(ctx.req, ctx.res, {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
      });

      return { success: true, username: user.username, role: user.role };
    }),

  logout: publicProcedure.mutation(async ({ ctx }) => {
    await revokeAdminSession(ctx.req, ctx.res);
    return { success: true };
  }),

  changePassword: adminProcedure
    .input(
      z.object({
        currentPassword: z.string().min(1),
        newPassword: z.string().min(8),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const database = await getDb();
      if (!database || !ctx.adminUser) throw new Error("Database not available");

      const [user] = await database
        .select()
        .from(adminUsers)
        .where(eq(adminUsers.id, ctx.adminUser.id))
        .limit(1)
        .execute();

      if (!user || !verifyPassword(input.currentPassword, user.passwordHash)) {
        throw new Error("Current password is incorrect");
      }

      await database
        .update(adminUsers)
        .set({ passwordHash: hashPassword(input.newPassword), updatedAt: new Date() })
        .where(eq(adminUsers.id, user.id))
        .execute();

      await revokeAllAdminSessions(user.id);
      await createAdminSession(ctx.req, ctx.res, {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
      });

      return { success: true };
    }),

  listAccounts: adminProcedure.query(async () => {
    const database = await getDb();
    if (!database) throw new Error("Database not available");
    const rows = await database
      .select({
        id: adminUsers.id,
        username: adminUsers.username,
        name: adminUsers.name,
        role: adminUsers.role,
        isActive: adminUsers.isActive,
        createdAt: adminUsers.createdAt,
      })
      .from(adminUsers)
      .execute();
    return rows;
  }),

  createAccount: adminProcedure
    .input(
      z.object({
        username: z.string().min(3).max(64),
        password: z.string().min(8),
        name: z.string().optional(),
        role: z.enum(["admin", "owner", "kitchen", "cashier"]).default("admin"),
      })
    )
    .mutation(async ({ input }) => {
      const database = await getDb();
      if (!database) throw new Error("Database not available");
      const [existing] = await database
        .select()
        .from(adminUsers)
        .where(eq(adminUsers.username, input.username))
        .limit(1)
        .execute();
      if (existing) throw new Error("Username already exists");
      await database.insert(adminUsers).values({
        username: input.username,
        passwordHash: hashPassword(input.password),
        name: input.name || input.username,
        role: input.role,
        isActive: true,
      });
      return { success: true };
    }),

  updateRole: adminProcedure
    .use(requireRole("owner", "admin"))
    .input(z.object({ userId: z.number(), role: z.enum(["admin", "owner", "kitchen", "cashier"]) }))
    .mutation(async ({ input }) => {
      const database = await getDb();
      if (!database) throw new Error("Database not available");
      await database
        .update(adminUsers)
        .set({ role: input.role, updatedAt: new Date() })
        .where(eq(adminUsers.id, input.userId))
        .execute();
      return { success: true };
    }),

  setAccountActive: adminProcedure
    .input(z.object({ userId: z.number(), isActive: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      const database = await getDb();
      if (!database || !ctx.adminUser) throw new Error("Database not available");
      if (input.userId === ctx.adminUser.id && !input.isActive) {
        throw new Error("Cannot deactivate your own account");
      }
      await database
        .update(adminUsers)
        .set({ isActive: input.isActive, updatedAt: new Date() })
        .where(eq(adminUsers.id, input.userId))
        .execute();
      if (!input.isActive) {
        await revokeAllAdminSessions(input.userId);
      }
      return { success: true };
    }),

  resetPassword: adminProcedure
    .use(requireRole("owner", "admin"))
    .input(z.object({ userId: z.number(), newPassword: z.string().min(8) }))
    .mutation(async ({ input }) => {
      const database = await getDb();
      if (!database) throw new Error("Database not available");
      await database
        .update(adminUsers)
        .set({ passwordHash: hashPassword(input.newPassword), updatedAt: new Date() })
        .where(eq(adminUsers.id, input.userId))
        .execute();
      await revokeAllAdminSessions(input.userId);
      return { success: true };
    }),

  revokeSessions: adminProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input }) => {
      await revokeAllAdminSessions(input.userId);
      return { success: true };
    }),
});
