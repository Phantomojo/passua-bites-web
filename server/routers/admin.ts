import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "../_core/cookies";
import { sdk } from "../_core/sdk";
import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

const getAdminPassword = () => {
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

const ADMIN_PASSWORD = getAdminPassword();

export const adminRouter = router({
  // Login with password
  login: publicProcedure
    .input(z.object({ password: z.string() }))
    .mutation(async ({ input, ctx }) => {
      if (input.password !== ADMIN_PASSWORD) {
        throw new Error("Invalid password");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Find or create admin user
      let adminUser = await db
        .select()
        .from(users)
        .where(eq(users.role, "admin"))
        .limit(1)
        .execute();

      if (adminUser.length === 0) {
        const result = await db
          .insert(users)
          .values({
            openId: "admin-local",
            name: "Passua Bites Admin",
            role: "admin",
          })
          .execute();
        adminUser = [
          {
            id: Number((result as any).insertId || 0),
            openId: "admin-local",
            name: "Passua Bites Admin",
            role: "admin",
          } as any,
        ];
      }

      const admin = adminUser[0];
      const token = await sdk.createSessionToken(admin.openId, {
        name: admin.name || "Admin",
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
        userId: admin.id,
      };
    }),
});
