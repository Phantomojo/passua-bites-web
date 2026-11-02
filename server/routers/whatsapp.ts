import { z } from "zod";
import { publicProcedure, adminProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { whatsappOptOuts, whatsappOutboundMessages } from "../../drizzle/schema";
import { eq, and, lte } from "drizzle-orm";
import { sendWhatsAppTemplateMessage, normalizeKenyanWhatsAppPhone } from "../_core/whatsapp";

export const whatsappRouter = router({
  enqueue: adminProcedure
    .input(
      z.object({
        to: z.string(),
        templateName: z.string().min(1),
        parameters: z.array(z.string()).default([]),
      })
    )
    .mutation(async ({ input }) => {
      const database = await getDb();
      if (!database) throw new Error("Database not available");
      const to = normalizeKenyanWhatsAppPhone(input.to);
      // Respect opt-outs
      const [optOut] = await database
        .select()
        .from(whatsappOptOuts)
        .where(eq(whatsappOptOuts.phone, to))
        .limit(1)
        .execute();
      if (optOut) {
        return { success: false, reason: "recipient_opted_out" } as const;
      }
      await database.insert(whatsappOutboundMessages).values({
        toPhone: to,
        templateName: input.templateName,
        parameters: JSON.stringify(input.parameters),
        status: "pending",
      });
      return { success: true } as const;
    }),

  listPending: adminProcedure.query(async () => {
    const database = await getDb();
    if (!database) throw new Error("Database not available");
    return database
      .select()
      .from(whatsappOutboundMessages)
      .where(eq(whatsappOutboundMessages.status, "pending"))
      .execute();
  }),

  processPending: adminProcedure.mutation(async () => {
    const database = await getDb();
    if (!database) throw new Error("Database not available");
    const now = new Date();
    const rows = await database
      .select()
      .from(whatsappOutboundMessages)
      .where(
        and(
          eq(whatsappOutboundMessages.status, "pending"),
          lte(whatsappOutboundMessages.nextAttemptAt, now)
        )
      )
      .limit(10)
      .execute();

    let sent = 0;
    let failed = 0;
    for (const row of rows) {
      // opt-out check
      const [optOut] = await database
        .select()
        .from(whatsappOptOuts)
        .where(eq(whatsappOptOuts.phone, row.toPhone))
        .limit(1)
        .execute();
      if (optOut) {
        await database
          .update(whatsappOutboundMessages)
          .set({ status: "skipped", updatedAt: new Date() })
          .where(eq(whatsappOutboundMessages.id, row.id))
          .execute();
        continue;
      }

      let params: string[] = [];
      try {
        params = JSON.parse(row.parameters || "[]");
      } catch {
        params = [];
      }

      const result = await sendWhatsAppTemplateMessage({
        to: row.toPhone,
        templateName: row.templateName,
        parameters: params,
      });

      const attempts = row.attempts + 1;
      if (result.status === "sent") {
        await database
          .update(whatsappOutboundMessages)
          .set({ status: "sent", attempts, updatedAt: new Date() })
          .where(eq(whatsappOutboundMessages.id, row.id))
          .execute();
        sent++;
      } else if (result.status === "not_configured") {
        await database
          .update(whatsappOutboundMessages)
          .set({ status: "failed", attempts, lastError: result.reason, updatedAt: new Date() })
          .where(eq(whatsappOutboundMessages.id, row.id))
          .execute();
        failed++;
      } else {
        const retry = attempts < 5;
        const delayMs = Math.min(60_000 * Math.pow(2, attempts - 1), 3_600_000);
        await database
          .update(whatsappOutboundMessages)
          .set({
            status: retry ? "pending" : "failed",
            attempts,
            lastError: result.reason,
            nextAttemptAt: new Date(Date.now() + delayMs),
            updatedAt: new Date(),
          })
          .where(eq(whatsappOutboundMessages.id, row.id))
          .execute();
        if (!retry) failed++;
      }
    }

    return { processed: rows.length, sent, failed };
  }),
});
