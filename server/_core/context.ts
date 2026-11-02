import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { getAdminUserFromRequest } from "./adminAuth";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  adminUser: (typeof import("../../drizzle/schema").adminUsers)["$inferSelect"] | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;
  let adminUser: (typeof import("../../drizzle/schema").adminUsers)["$inferSelect"] | null = null;

  try {
    const admin = await getAdminUserFromRequest(opts.req);
    if (admin) {
      user = admin.user;
      adminUser = admin.adminUser;
    } else {
      user = await sdk.authenticateRequest(opts.req);
    }
  } catch (error) {
    try {
      user = await sdk.authenticateRequest(opts.req);
    } catch {
      user = null;
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
    adminUser,
  };
}
