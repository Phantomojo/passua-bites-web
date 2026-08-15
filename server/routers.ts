import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, adminProcedure } from "./_core/trpc";
import { z } from "zod";
import { menuRouter } from "./routers/menu";
import { ordersRouter } from "./routers/orders";
import { paymentsRouter } from "./routers/payments";
import { reviewsRouter } from "./routers/reviews";
import { adminRouter } from "./routers/admin";
import { analyticsRouter } from "./routers/analytics";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // Passua Bites routers
  menu: menuRouter,
  orders: ordersRouter,
  payments: paymentsRouter,
  reviews: reviewsRouter,
  admin: adminRouter,
  analytics: analyticsRouter,

  // Location/Displacement message router
  location: router({
    get: publicProcedure.query(async () => {
      const { getSiteSetting } = await import("./db");
      const setting = await getSiteSetting("displacementMessage");
      return (
        setting?.value ??
        "We're currently displaced. Order via Bolt Food or WhatsApp!"
      );
    }),
    update: adminProcedure
      .input(z.object({ message: z.string() }))
      .mutation(async ({ input }) => {
        const { setSiteSetting } = await import("./db");
        await setSiteSetting("displacementMessage", input.message);
        return { success: true };
      }),
    getAll: adminProcedure.query(async () => {
      const { getAllSiteSettings } = await import("./db");
      return getAllSiteSettings();
    }),
  }),
});

export type AppRouter = typeof appRouter;
