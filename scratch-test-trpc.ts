import { appRouter } from "./server/routers/index";
import { getDb } from "./server/db";

async function run() {
  const ctx = {
    req: {} as any,
    res: {} as any,
    session: { userId: 1 } as any, // Admin session
    db: await getDb(),
  };
  const caller = appRouter.createCaller(ctx);
  
  try {
    const res = await caller.analytics.getTraffic();
    console.log("SUCCESS:", res.summary);
  } catch (err) {
    console.error("TRPC ERROR:", err);
  }
  process.exit(0);
}
run();
