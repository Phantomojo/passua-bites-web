import crypto from "crypto";
import { getDb } from "../db";
import * as db from "../db";
import { adminUsers, adminSessions } from "../../drizzle/schema";
import type { User } from "../../drizzle/schema";
import { eq, and, gt, isNull } from "drizzle-orm";
import type { Request, Response } from "express";
import { getSessionCookieOptions } from "./cookies";

export const ADMIN_SESSION_COOKIE = "admin_session";
export const ADMIN_SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function readCookie(req: Request, name: string): string | null {
  const header = req.headers.cookie;
  if (!header) return null;
  const match = header
    .split(";")
    .map(part => part.trim())
    .find(part => part.startsWith(`${name}=`));
  if (!match) return null;
  try {
    return decodeURIComponent(match.slice(name.length + 1));
  } catch {
    return match.slice(name.length + 1);
  }
}

export async function createAdminSession(
  req: Request,
  res: Response,
  adminUser: { id: number; username: string; name: string | null; role: string }
): Promise<void> {
  const database = await getDb();
  if (!database) throw new Error("Database not available");

  const token = crypto.randomBytes(32).toString("base64url");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + ADMIN_SESSION_TTL_MS);

  await database.insert(adminSessions).values({
    adminUserId: adminUser.id,
    tokenHash,
    expiresAt,
    ip: req.ip ?? null,
    userAgent: (req.headers["user-agent"] as string) ?? null,
  });

  const openId = `admin:${adminUser.username}`;
  await db.upsertUser({
    openId,
    name: adminUser.name || adminUser.username,
    role: "admin",
    lastSignedIn: new Date(),
  });

  res.cookie(ADMIN_SESSION_COOKIE, token, {
    ...getSessionCookieOptions(req),
    httpOnly: true,
    maxAge: ADMIN_SESSION_TTL_MS,
  });
}

export async function getAdminUserFromRequest(req: Request): Promise<{
  adminUser: (typeof adminUsers)["$inferSelect"];
  user: User;
} | null> {
  const token = readCookie(req, ADMIN_SESSION_COOKIE);
  if (!token) return null;

  const database = await getDb();
  if (!database) return null;

  const tokenHash = hashToken(token);
  const now = new Date();

  const [session] = await database
    .select()
    .from(adminSessions)
    .where(
      and(
        eq(adminSessions.tokenHash, tokenHash),
        isNull(adminSessions.revokedAt),
        gt(adminSessions.expiresAt, now)
      )
    )
    .limit(1)
    .execute();

  if (!session) return null;

  const [adminUser] = await database
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.id, session.adminUserId))
    .limit(1)
    .execute();

  if (!adminUser || !adminUser.isActive) return null;

  // Touch lastUsedAt (best effort)
  await database
    .update(adminSessions)
    .set({ lastUsedAt: now })
    .where(eq(adminSessions.id, session.id))
    .execute()
    .catch(() => undefined);

  const openId = `admin:${adminUser.username}`;
  await db.upsertUser({
    openId,
    name: adminUser.name || adminUser.username,
    role: "admin",
    lastSignedIn: now,
  });

  const user = await db.getUserByOpenId(openId);
  if (!user) return null;

  return { adminUser, user };
}

export async function revokeAdminSession(req: Request, res: Response): Promise<void> {
  const token = readCookie(req, ADMIN_SESSION_COOKIE);
  const database = await getDb();
  if (token && database) {
    const tokenHash = hashToken(token);
    await database
      .update(adminSessions)
      .set({ revokedAt: new Date() })
      .where(eq(adminSessions.tokenHash, tokenHash))
      .execute()
      .catch(() => undefined);
  }
  res.clearCookie(ADMIN_SESSION_COOKIE, { path: "/" });
}

export async function revokeAllAdminSessions(adminUserId: number): Promise<void> {
  const database = await getDb();
  if (!database) return;
  await database
    .update(adminSessions)
    .set({ revokedAt: new Date() })
    .where(eq(adminSessions.adminUserId, adminUserId))
    .execute()
    .catch(() => undefined);
}
