import { getDb } from "./db";
import { orders, mpesaTransactions } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { logger } from "./logger";
import { queryStkPushStatus } from "./routers/payments";
import { formatPhoneNumber } from "./routers/payments";

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
    const { ResultCode, CheckoutRequestID, CallbackMetadata, ResultDesc } =
      stkCallback;

    const code = Number(ResultCode);

    const db = await getDb();
    if (!db) {
      logger.error("[M-Pesa] Database not available for callback");
      return;
    }

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

    const transaction = tx[0];

    // Match merchant request ID when the callback provides it.
    const callbackMerchantRequestID = stkCallback.MerchantRequestID;
    if (
      callbackMerchantRequestID &&
      transaction.merchantRequestID &&
      callbackMerchantRequestID !== transaction.merchantRequestID
    ) {
      logger.error(
        { checkoutRequestID: CheckoutRequestID },
        "[M-Pesa] Merchant request ID mismatch in callback"
      );
      return;
    }

    // Idempotency: already completed — never downgrade.
    if (transaction.status === "completed") {
      logger.info(
        { checkoutRequestID: CheckoutRequestID },
        "[M-Pesa] Duplicate callback for completed payment, skipping"
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
        .where(
          and(
            eq(mpesaTransactions.checkoutRequestID, CheckoutRequestID),
            eq(mpesaTransactions.status, "pending")
          )
        )
        .execute();

      await db
        .update(orders)
        .set({ paymentStatus: "failed" })
        .where(
          and(eq(orders.id, transaction.orderId), eq(orders.paymentStatus, "pending"))
        )
        .execute();

      logger.info(
        { status, code, checkoutRequestID: CheckoutRequestID },
        "[M-Pesa] Payment not completed"
      );
      return;
    }

    // Independently verify with Daraja before settling.
    let queryData: any;
    try {
      queryData = await queryStkPushStatus(CheckoutRequestID);
    } catch (error) {
      logger.error({ err: error, checkoutRequestID: CheckoutRequestID }, "[M-Pesa] Daraja verification failed");
      await db
        .update(mpesaTransactions)
        .set({ status: "pending", resultDesc: "Provider verification unavailable" })
        .where(
          and(
            eq(mpesaTransactions.checkoutRequestID, CheckoutRequestID),
            eq(mpesaTransactions.status, "pending")
          )
        )
        .execute();
      return;
    }

    if (Number(queryData?.ResultCode) !== 0) {
      logger.info({ checkoutRequestID: CheckoutRequestID }, "[M-Pesa] Daraja verification did not confirm payment");
      await db
        .update(mpesaTransactions)
        .set({ status: "pending", resultDesc: "Provider verification pending" })
        .where(
          and(
            eq(mpesaTransactions.checkoutRequestID, CheckoutRequestID),
            eq(mpesaTransactions.status, "pending")
          )
        )
        .execute();
      return;
    }

    const metadata: Record<string, any> = {};
    queryData?.CallbackMetadata?.Item?.forEach((item: any) => {
      metadata[item.Name] = item.Value;
    });

    const receipt = metadata.MpesaReceiptNumber;
    const amount = metadata.Amount;
    const phone = metadata.PhoneNumber;

    // Require receipt and amount evidence.
    if (!receipt || amount === undefined || amount === null) {
      logger.error(
        { checkoutRequestID: CheckoutRequestID },
        "[M-Pesa] Missing receipt or amount in callback"
      );
      await db
        .update(mpesaTransactions)
        .set({
          status: "pending",
          resultCode: code,
          resultDesc: "Insufficient payment evidence",
        })
        .where(
          and(
            eq(mpesaTransactions.checkoutRequestID, CheckoutRequestID),
            eq(mpesaTransactions.status, "pending")
          )
        )
        .execute();
      return;
    }

    // Validate amount.
    if (Number(amount) !== Number(transaction.amount)) {
      logger.error(
        {
          expected: transaction.amount,
          received: amount,
          checkoutRequestID: CheckoutRequestID,
        },
        "[M-Pesa] Amount mismatch in callback"
      );
      await db
        .update(mpesaTransactions)
        .set({ status: "failed", resultCode: code, resultDesc: "Amount mismatch" })
        .where(
          and(
            eq(mpesaTransactions.checkoutRequestID, CheckoutRequestID),
            eq(mpesaTransactions.status, "pending")
          )
        )
        .execute();
      await db
        .update(orders)
        .set({ paymentStatus: "failed" })
        .where(
          and(eq(orders.id, transaction.orderId), eq(orders.paymentStatus, "pending"))
        )
        .execute();
      return;
    }

    // Require and validate phone evidence.
    if (!phone) {
      logger.error({ checkoutRequestID: CheckoutRequestID }, "[M-Pesa] Missing phone in verification");
      await db
        .update(mpesaTransactions)
        .set({ status: "pending", resultDesc: "Missing phone evidence" })
        .where(
          and(
            eq(mpesaTransactions.checkoutRequestID, CheckoutRequestID),
            eq(mpesaTransactions.status, "pending")
          )
        )
        .execute();
      return;
    }

    try {
      const normalized = formatPhoneNumber(String(phone));
      const txPhone = formatPhoneNumber(transaction.phoneNumber);
      if (normalized !== txPhone) {
        logger.error({ checkoutRequestID: CheckoutRequestID }, "[M-Pesa] Phone mismatch in callback");
        await db
          .update(mpesaTransactions)
          .set({ status: "failed", resultCode: code, resultDesc: "Phone mismatch" })
          .where(
            and(
              eq(mpesaTransactions.checkoutRequestID, CheckoutRequestID),
              eq(mpesaTransactions.status, "pending")
            )
          )
          .execute();
        await db
          .update(orders)
          .set({ paymentStatus: "failed" })
          .where(
            and(eq(orders.id, transaction.orderId), eq(orders.paymentStatus, "pending"))
          )
          .execute();
        return;
      }
    } catch {
      logger.error({ checkoutRequestID: CheckoutRequestID }, "[M-Pesa] Invalid phone in callback");
      await db
        .update(mpesaTransactions)
        .set({ status: "failed", resultCode: code, resultDesc: "Invalid phone" })
        .where(
          and(
            eq(mpesaTransactions.checkoutRequestID, CheckoutRequestID),
            eq(mpesaTransactions.status, "pending")
          )
        )
        .execute();
      await db
        .update(orders)
        .set({ paymentStatus: "failed" })
        .where(
          and(eq(orders.id, transaction.orderId), eq(orders.paymentStatus, "pending"))
        )
        .execute();
      return;
    }

    // Confirm payment conditionally.
    const upd = await db
      .update(mpesaTransactions)
      .set({
        status: "completed",
        mpesaReceiptNumber: receipt,
        resultCode: code,
        resultDesc: ResultDesc || null,
      })
      .where(
        and(
          eq(mpesaTransactions.checkoutRequestID, CheckoutRequestID),
          eq(mpesaTransactions.status, "pending")
        )
      )
      .execute();

    const rowCount = (upd as any).rowCount ?? 0;
    if (rowCount === 0) {
      logger.info(
        { checkoutRequestID: CheckoutRequestID },
        "[M-Pesa] Duplicate callback, skipping"
      );
      return;
    }

    await db
      .update(orders)
      .set({
        paymentStatus: "completed",
        mpesaTransactionId: receipt,
      })
      .where(eq(orders.id, transaction.orderId))
      .execute();

    await db
      .update(orders)
      .set({ status: "confirmed" })
      .where(
        and(eq(orders.id, transaction.orderId), eq(orders.status, "pending"))
      )
      .execute();

    logger.info(
      { orderId: transaction.orderId, receipt, amount },
      "[M-Pesa] Payment confirmed"
    );
  } catch (error) {
    logger.error({ err: error }, "[M-Pesa] Callback processing error");
  }
}