import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "../_core/cookies";
import { sdk } from "../_core/sdk";
import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import * as db from "../db";
import { adminUsers } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { hashPassword, verifyPassword } from "../_core/password";

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

export const adminRouter = router({
  login: publicProcedure
    .input(z.object({ username: z.string().min(1), password: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      const database = await getDb();
      if (!database) throw new Error("Database not available");

      // Seed a default admin account on first use.
      const existing = await database
        .select()
        .from(adminUsers)
        .limit(1)
        .execute();
      if (existing.length === 0) {
        const seedPassword = getAdminSeedPassword();
        await database.insert(adminUsers).values({
          username: "admin",
          passwordHash: hashPassword(seedPassword),
          name: "Passua Bites Admin",
          role: "admin",
        });
      }

      const [user] = await database
        .select()
        .from(adminUsers)
        .where(eq(adminUsers.username, input.username))
        .limit(1)
        .execute();

      if (!user || !verifyPassword(input.password, user.passwordHash)) {
        throw new Error("Invalid username or password");
      }

      const openId = `admin:${user.username}`;
      await db.upsertUser({
        openId,
        name: user.name || user.username,
        role: "admin",
        lastSignedIn: new Date(),
      });

      const token = await sdk.createSessionToken(openId, {
        name: user.name || user.username,
        expiresInMs: ONE_YEAR_MS,
      });
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, token, {
        ...cookieOptions,
        maxAge: ONE_YEAR_MS,
      });

      return {
        success: true,
        token,
        userId: user.id,
        username: user.username,
      };
    }),

  createAccount: publicProcedure
    .input(
      z.object({
        bootstrapPassword: z.string(),
        username: z.string().min(3).max(64),
        password: z.string().min(8),
        name: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const seedPassword = getAdminSeedPassword();
      if (input.bootstrapPassword !== seedPassword) {
        throw new Error("Invalid bootstrap password");
      }
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
        role: "admin",
      });
      return { success: true };
    }),
});