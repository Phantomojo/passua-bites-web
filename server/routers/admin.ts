import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { SignJWT, jwtVerify } from "jose";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "dev-secret-key"
);

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "passua2026";

interface AdminSession {
  userId: number;
  role: "admin";
}

async function createAdminSession(userId: number): Promise<string> {
  return new SignJWT({ userId, role: "admin" as const })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(JWT_SECRET);
}

async function verifyAdminSession(token: string): Promise<AdminSession | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (payload.role === "admin") {
      return payload as unknown as AdminSession;
    }
    return null;
  } catch {
    return null;
  }
}

export const adminRouter = router({
  // Login with password
  login: publicProcedure
    .input(z.object({ password: z.string() }))
    .mutation(async ({ input }) => {
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

      let userId: number;

      if (adminUser.length === 0) {
        // Create admin user
        const result = await db
          .insert(users)
          .values({
            openId: "admin-local",
            name: "Passua Bites Admin",
            role: "admin",
          })
          .execute();
        userId = Number((result as any).insertId || 0);
      } else {
        userId = adminUser[0].id;
      }

      const token = await createAdminSession(userId);

      return {
        success: true,
        token,
        userId,
      };
    }),

  // Verify admin session
  verify: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const session = await verifyAdminSession(input.token);
      if (!session) {
        return { valid: false };
      }
      return { valid: true, userId: session.userId };
    }),

  // Logout (client-side token discard)
  logout: publicProcedure.mutation(async () => {
    return { success: true };
  }),
});
