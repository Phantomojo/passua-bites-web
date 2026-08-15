import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "../_core/cookies";
import { sdk } from "../_core/sdk";
import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

const ADMIN_SESSION_MS = 8 * 60 * 60 * 1000;

function getAdminPassword(): string | null {
  const password = process.env.ADMIN_PASSWORD?.trim();
  return password ? password : null;
}

function passwordsMatch(candidate: string, expected: string): boolean {
  const candidateBytes = Buffer.from(candidate);
  const expectedBytes = Buffer.from(expected);
  if (candidateBytes.length !== expectedBytes.length) return false;
  return timingSafeEqual(candidateBytes, expectedBytes);
}

export const adminRouter = router({
  // Login with a server-configured password. The session token is never returned to JavaScript.
  login: publicProcedure
    .input(z.object({ password: z.string().min(1).max(256) }))
    .mutation(async ({ input, ctx }) => {
      const adminPassword = getAdminPassword();
      if (!adminPassword) {
        throw new Error("Admin login is not configured");
      }
      if (!passwordsMatch(input.password, adminPassword)) {
        throw new Error("Invalid password");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

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
        expiresInMs: ADMIN_SESSION_MS,
      });
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, token, {
        ...cookieOptions,
        maxAge: ADMIN_SESSION_MS,
      });

      return {
        success: true,
        userId: admin.id,
        name: admin.name || "Admin",
        expiresInMs: ADMIN_SESSION_MS,
      };
    }),

  // Session discovery uses the HTTP-only cookie and does not expose the token.
  me: publicProcedure.query(({ ctx }) => {
    if (!ctx.user || ctx.user.role !== "admin") return null;
    return { userId: ctx.user.id, name: ctx.user.name || "Admin" };
  }),

  logout: publicProcedure.mutation(({ ctx }) => {
    ctx.res.clearCookie(COOKIE_NAME, getSessionCookieOptions(ctx.req));
    return { success: true };
  }),
});
