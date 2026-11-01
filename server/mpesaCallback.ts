import { getDb } from "./db";
import { orders, mpesaTransactions } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { logger } from "./logger";

/**
 * Process a Safaricom Daraja STK Push callback payload.
 *
 * Safaricom POSTs the final result of an STK Push to the CallBackURL.
 * A successful callback carries CallbackMetadata with Amount, MpesaReceiptNumber,
 * TransactionDate and PhoneNumber. A failed/cancelled callback only carries
 * ResultCode + ResultDesc (no metadata).
 *
 * Result codes seen in practice:
 *   0     success
 *   1     insufficient funds
 *   1001  unable to lock subscriber (concurrent session)
 *   1019  transaction expired
 *   1032  cancelled by user
 *   1037  DS timeout / phone unreachable
 *   2001  wrong PIN
 *
 * NOTE: the callback URL itself must NOT contain the substrings "mpesa",
 * "m-pesa" or "safaricom" (case-insensitive) — Safaricom's registration
 * filter silently drops such callbacks. Use a neutral path such as
 * /api/payments/callback.
 */
export async function processMpesaCallback(body: any): Promise<void> {
  try {
    const { Body } = body || {};
    if (!Body || !Body.stkCallback) {
      logger.error("[M-Pesa] Invalid callback payload (missing stkCallback)");
      return;
    }

    const { stkCallback } = Body;
    const {
      ResultCode,
      CheckoutRequestID,
      CallbackMetadata,
      ResultDesc,
    } = stkCallback;

    const code = Number(ResultCode);

    const db = await getDb();
    if (!db) {
      logger.error("[M-Pesa] Database not available for callback");
      return;
    }

    // Find transaction
    const tx = await db
      .select()
      .from(mpesaTransactions)
      .where(eq(mpesaTransactions.checkoutRequestID, CheckoutRequestID))
      .limit(1)
      .execute();

    if (tx.length === 0) {
      logger.error(
        { checkoutRequestID: CheckoutRequestID },
        "[M-Pesa] Transaction not found for callback"
      );
      return;
    }

    // Idempotency: already completed
    if (tx[0].status === "completed") {
      logger.info(
        { checkoutRequestID: CheckoutRequestID },
        "[M-Pesa] Duplicate callback, skipping"
      );
      return;
    }

    // Handle failures (cancelled / failed / timeout / insufficient funds / etc.)
    if (code !== 0) {
      const status = code === 1032 ? "cancelled" : "failed";
      await db
        .update(mpesaTransactions)
        .set({
          status,
          resultCode: code,
          resultDesc: ResultDesc || null,
        })
        .where(eq(mpesaTransactions.checkoutRequestID, CheckoutRequestID));

      await db
        .update(orders)
        .set({ paymentStatus: "failed" })
        .where(eq(orders.id, tx[0].orderId));

      logger.info(
        { status, code, checkoutRequestID: CheckoutRequestID, orderId: tx[0].orderId },
        "[M-Pesa] Payment not completed"
      );
      return;
    }

    // Extract metadata
    const metadata: Record<string, any> = {};
    CallbackMetadata?.Item?.forEach((item: any) => {
      metadata[item.Name] = item.Value;
    });

    const { MpesaReceiptNumber, Amount } = metadata;

    // Validate amount when present
    if (Amount !== undefined && Number(Amount) !== Number(tx[0].amount)) {
      logger.error(
        {
          expected: tx[0].amount,
          received: Amount,
          orderId: tx[0].orderId,
          checkoutRequestID: CheckoutRequestID,
        },
        "[M-Pesa] Amount mismatch in callback"
      );
      return;
    }

    // Confirm payment
    await db
      .update(mpesaTransactions)
      .set({
        status: "completed",
        mpesaReceiptNumber: MpesaReceiptNumber || null,
        resultCode: code,
        resultDesc: ResultDesc || null,
      })
      .where(eq(mpesaTransactions.checkoutRequestID, CheckoutRequestID));

    await db
      .update(orders)
      .set({
        paymentStatus: "completed",
        mpesaTransactionId: MpesaReceiptNumber || null,
        status: "confirmed",
      })
      .where(eq(orders.id, tx[0].orderId));

    logger.info(
      {
        orderId: tx[0].orderId,
        receipt: MpesaReceiptNumber,
        amount: Amount,
      },
      "[M-Pesa] Payment confirmed"
    );
  } catch (error) {
    logger.error({ err: error }, "[M-Pesa] Callback processing error");
  }
}