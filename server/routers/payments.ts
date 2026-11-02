import crypto from "crypto";
import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { orders, mpesaTransactions } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import axios from "axios";
import {
  signOrderPaymentToken,
  verifyOrderPaymentToken,
} from "../_core/paymentToken";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(`${name} is required`);
  }
  return value.trim();
}

const isProduction = process.env.NODE_ENV === "production";
const MPESA_BASE_URL = isProduction
  ? "https://api.safaricom.co.ke"
  : "https://sandbox.safaricom.co.ke";

function getMpesaConfig() {
  return {
    shortcode: requireEnv("MPESA_SHORTCODE"),
    passkey: requireEnv("MPESA_PASSKEY"),
    consumerKey: requireEnv("MPESA_CONSUMER_KEY"),
    consumerSecret: requireEnv("MPESA_CONSUMER_SECRET"),
    callbackUrl:
      process.env.MPESA_CALLBACK_URL ||
      (process.env.APP_URL
        ? `${process.env.APP_URL.replace(/\/$/, "")}/api/payments/callback`
        : null),
  };
}

export function getCallbackUrl(): string {
  const cfg = getMpesaConfig();
  if (!cfg.callbackUrl) {
    throw new Error("MPESA_CALLBACK_URL or APP_URL is required");
  }
  const secret = process.env.MPESA_CALLBACK_SECRET;
  const isProduction = process.env.NODE_ENV === "production";
  if (isProduction) {
    if (!secret || secret.trim() === "") {
      throw new Error("MPESA_CALLBACK_SECRET is required in production");
    }
  }
  if (secret && secret.trim() !== "") {
    const url = new URL(cfg.callbackUrl);
    url.searchParams.set("token", secret.trim());
    return url.toString();
  }
  return cfg.callbackUrl;
}

export async function queryStkPushStatus(checkoutRequestID: string): Promise<any> {
  const cfg = getMpesaConfig();
  const { password, timestamp } = generatePassword();
  const token = await getMpesaAccessToken();
  const response = await axios.post(
    `${MPESA_BASE_URL}/mpesa/stkpushquery/v1/query`,
    {
      BusinessShortCode: cfg.shortcode,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestID,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      timeout: 10000,
    }
  );
  return response.data;
}

let accessToken: string | null = null;
let tokenExpiry: Date | null = null;

async function getMpesaAccessToken(): Promise<string> {
  if (
    accessToken &&
    tokenExpiry &&
    new Date() < new Date(tokenExpiry.getTime() - 60000)
  ) {
    return accessToken;
  }

  const cfg = getMpesaConfig();
  const auth = Buffer.from(
    `${cfg.consumerKey}:${cfg.consumerSecret}`
  ).toString("base64");

  const response = await axios.get(
    `${MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
    {
      headers: { Authorization: `Basic ${auth}` },
      timeout: 10000,
    }
  );

  accessToken = response.data.access_token as string;
  tokenExpiry = new Date(Date.now() + 3600000);
  return accessToken;
}

function generatePassword(): { password: string; timestamp: string } {
  const cfg = getMpesaConfig();
  const now = new Date();
  const timestamp =
    now.getFullYear().toString() +
    (now.getMonth() + 1).toString().padStart(2, "0") +
    now.getDate().toString().padStart(2, "0") +
    now.getHours().toString().padStart(2, "0") +
    now.getMinutes().toString().padStart(2, "0") +
    now.getSeconds().toString().padStart(2, "0");

  const password = Buffer.from(
    `${cfg.shortcode}${cfg.passkey}${timestamp}`
  ).toString("base64");
  return { password, timestamp };
}

export function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/[\s\-+]/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = "254" + cleaned.slice(1);
  }
  if (!/^254[17]\d{8}$/.test(cleaned)) {
    throw new Error("Invalid Kenyan phone number format");
  }
  return cleaned;
}

export const paymentsRouter = router({
  initiateStkPush: publicProcedure
    .input(
      z.object({
        orderId: z.number(),
        paymentToken: z.string().min(1),
        phoneNumber: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      if (!verifyOrderPaymentToken(input.paymentToken, input.orderId)) {
        throw new Error("Invalid payment token");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const cfg = getMpesaConfig();

      const orderResult = await db
        .select()
        .from(orders)
        .where(
          and(eq(orders.id, input.orderId), eq(orders.status, "pending"))
        )
        .limit(1)
        .execute();

      if (orderResult.length === 0) {
        throw new Error("Order not found or not in pending state");
      }

      const order = orderResult[0];

      if (order.paymentStatus === "completed") {
        throw new Error("Order already paid");
      }

      const phone = formatPhoneNumber(input.phoneNumber);
      const orderPhone = formatPhoneNumber(order.customerPhone);
      if (phone !== orderPhone) {
        throw new Error("Phone number does not match order");
      }

      const existingTx = await db
        .select()
        .from(mpesaTransactions)
        .where(eq(mpesaTransactions.orderId, input.orderId))
        .orderBy(desc(mpesaTransactions.createdAt))
        .limit(1)
        .execute();

      if (existingTx.length > 0) {
        const tx = existingTx[0];
        if (tx.status === "completed") {
          throw new Error("Order already paid");
        }
        if (tx.status === "pending") {
          return {
            success: true,
            checkoutRequestID: tx.checkoutRequestID,
            message: "STK Push already pending. Check your phone.",
          };
        }
      }

      const amount = Number(order.totalPrice);
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error("Order amount must be a positive number");
      }
      if (!Number.isInteger(amount)) {
        throw new Error("Order amount must be a whole number of KSh");
      }

      // Reserve an idempotent payment attempt before contacting Safaricom.
      const reservationKey = `INITIATING-${crypto.randomUUID()}`;
      let reservationId: number;
      try {
        const [inserted] = await db
          .insert(mpesaTransactions)
          .values({
            orderId: input.orderId,
            checkoutRequestID: reservationKey,
            merchantRequestID: null,
            phoneNumber: phone,
            amount: amount.toString(),
            accountReference: `PB${input.orderId}`,
            status: "initiating",
          })
          .returning({ id: mpesaTransactions.id });
        reservationId = inserted.id;
      } catch (reserveError: any) {
        const [existing] = await db
          .select()
          .from(mpesaTransactions)
          .where(eq(mpesaTransactions.orderId, input.orderId))
          .orderBy(desc(mpesaTransactions.createdAt))
          .limit(1)
          .execute();
        if (existing && (existing.status === "pending" || existing.status === "initiating" || existing.status === "unknown")) {
          return {
            success: true,
            checkoutRequestID: existing.checkoutRequestID,
            message: "STK Push already in progress. Check your phone.",
          };
        }
        throw reserveError;
      }

      const { password, timestamp } = generatePassword();
      const token = await getMpesaAccessToken();

      let response: any;
      try {
        response = await axios.post(
          `${MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest`,
          {
            BusinessShortCode: cfg.shortcode,
            Password: password,
            Timestamp: timestamp,
            TransactionType: "CustomerPayBillOnline",
            Amount: amount,
            PartyA: phone,
            PartyB: cfg.shortcode,
            PhoneNumber: phone,
            CallBackURL: getCallbackUrl(),
            AccountReference: `PB${input.orderId}`,
            TransactionDesc: "Passua Bites order",
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            timeout: 15000,
          }
        );
      } catch (error: any) {
        const isAmbiguous =
          !error?.response ||
          error?.code === "ECONNABORTED" ||
          error?.code === "ETIMEDOUT" ||
          /timeout/i.test(String(error?.message || ""));
        const errorMsg =
          error.response?.data?.errorMessage || error.message || "STK Push failed";
        await db
          .update(mpesaTransactions)
          .set({
            status: isAmbiguous ? "unknown" : "failed",
            resultDesc: isAmbiguous
              ? "Ambiguous STK response; reconcile before retry"
              : `STK Push failed: ${errorMsg}`,
          })
          .where(eq(mpesaTransactions.id, reservationId))
          .execute()
          .catch(() => undefined);
        throw new Error(`M-Pesa STK Push failed: ${errorMsg}`);
      }

      try {
        await db
          .update(mpesaTransactions)
          .set({
            checkoutRequestID: response.data.CheckoutRequestID,
            merchantRequestID: response.data.MerchantRequestID,
            status: "pending",
          })
          .where(eq(mpesaTransactions.id, reservationId))
          .execute();
      } catch (insertError: any) {
        await db
          .update(mpesaTransactions)
          .set({ status: "failed", resultDesc: "Reservation update failed" })
          .where(eq(mpesaTransactions.id, reservationId))
          .execute();
        throw insertError;
      }

      return {
        success: true,
        checkoutRequestID: response.data.CheckoutRequestID,
        message: "STK Push sent successfully. Check your phone.",
      };
    }),

  queryStatus: publicProcedure
    .input(
      z.object({
        checkoutRequestID: z.string(),
        paymentToken: z.string().min(1),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const transaction = await db
        .select()
        .from(mpesaTransactions)
        .where(
          eq(mpesaTransactions.checkoutRequestID, input.checkoutRequestID)
        )
        .limit(1)
        .execute();

      if (transaction.length === 0) {
        throw new Error("Transaction not found");
      }

      const tx = transaction[0];
      if (!verifyOrderPaymentToken(input.paymentToken, tx.orderId)) {
        throw new Error("Invalid payment token");
      }

      if (tx.status === "completed") {
        return {
          status: "completed",
          mpesaReceiptNumber: tx.mpesaReceiptNumber,
          resultCode: tx.resultCode ?? 0,
        };
      }

      const cfg = getMpesaConfig();
      const { password, timestamp } = generatePassword();
      const token = await getMpesaAccessToken();

      try {
        const response = await axios.post(
          `${MPESA_BASE_URL}/mpesa/stkpushquery/v1/query`,
          {
            BusinessShortCode: cfg.shortcode,
            Password: password,
            Timestamp: timestamp,
            CheckoutRequestID: input.checkoutRequestID,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            timeout: 10000,
          }
        );

        const resultCode = Number(response.data.ResultCode);

        if (resultCode === 0) {
          // Require query IDs to be present and match stored values.
          const queryCheckoutId = response.data.CheckoutRequestID;
          const queryMerchantId = response.data.MerchantRequestID;
          if (
            !queryCheckoutId ||
            queryCheckoutId !== input.checkoutRequestID ||
            queryCheckoutId !== tx.checkoutRequestID
          ) {
            await db
              .update(mpesaTransactions)
              .set({ status: "pending", resultCode, resultDesc: "CheckoutRequestID mismatch" })
              .where(
                and(
                  eq(mpesaTransactions.checkoutRequestID, input.checkoutRequestID),
                  eq(mpesaTransactions.status, "pending")
                )
              )
              .execute();
            return { status: "pending", resultDesc: "CheckoutRequestID mismatch", resultCode };
          }
          if (
            !queryMerchantId ||
            !tx.merchantRequestID ||
            queryMerchantId !== tx.merchantRequestID
          ) {
            await db
              .update(mpesaTransactions)
              .set({ status: "pending", resultCode, resultDesc: "MerchantRequestID mismatch" })
              .where(
                and(
                  eq(mpesaTransactions.checkoutRequestID, input.checkoutRequestID),
                  eq(mpesaTransactions.status, "pending")
                )
              )
              .execute();
            return { status: "pending", resultDesc: "MerchantRequestID mismatch", resultCode };
          }

          // STK Query does not return CallbackMetadata. Only reconcile if the
          // callback has already supplied a receipt; otherwise stay pending.
          if (!tx.mpesaReceiptNumber) {
            await db
              .update(mpesaTransactions)
              .set({ status: "pending", resultCode, resultDesc: "Awaiting callback metadata" })
              .where(
                and(
                  eq(mpesaTransactions.checkoutRequestID, input.checkoutRequestID),
                  eq(mpesaTransactions.status, "pending")
                )
              )
              .execute();
            return { status: "pending", resultDesc: "Awaiting callback metadata", resultCode };
          }

          const receipt = tx.mpesaReceiptNumber;
          const upd = await db
            .update(mpesaTransactions)
            .set({
              status: "completed",
              mpesaReceiptNumber: receipt,
              resultCode,
              resultDesc: response.data.ResultDesc,
            })
            .where(
              and(
                eq(mpesaTransactions.checkoutRequestID, input.checkoutRequestID),
                eq(mpesaTransactions.status, "pending")
              )
            )
            .execute();

          const rowCount = (upd as any).rowCount ?? 0;
          if (rowCount === 0) {
            return {
              status: tx.status as any,
              mpesaReceiptNumber: tx.mpesaReceiptNumber,
              resultCode: tx.resultCode ?? 0,
            };
          }

          const [order] = await db
            .select()
            .from(orders)
            .where(eq(orders.id, tx.orderId))
            .limit(1)
            .execute();

          await db
            .update(orders)
            .set({
              paymentStatus: "completed",
              mpesaTransactionId: receipt,
              paymentReason:
                order?.status === "cancelled"
                  ? "Late payment after cancellation - reconcile/refund"
                  : order?.paymentReason ?? null,
            })
            .where(eq(orders.id, tx.orderId))
            .execute();

          await db
            .update(orders)
            .set({ status: "confirmed" })
            .where(and(eq(orders.id, tx.orderId), eq(orders.status, "pending")))
            .execute();

          return {
            status: "completed",
            mpesaReceiptNumber: receipt,
            resultCode: 0,
          };
        } else {
          const status =
            resultCode === 1032 ? "cancelled" : "failed";
          await db
            .update(mpesaTransactions)
            .set({
              status,
              resultCode: resultCode,
              resultDesc: response.data.ResultDesc,
            })
            .where(
              and(
                eq(mpesaTransactions.checkoutRequestID, input.checkoutRequestID),
                eq(mpesaTransactions.status, "pending")
              )
            );

          return {
            status: status as "failed" | "cancelled" | "pending",
            resultDesc: response.data.ResultDesc,
            resultCode,
          };
        }
      } catch (error: any) {
        return {
          status: tx.status,
          resultDesc: "Query failed, check callback for status",
          resultCode: tx.resultCode,
        };
      }
    }),

  getOrderPaymentStatus: publicProcedure
    .input(
      z.object({
        orderId: z.number(),
        paymentToken: z.string().min(1),
      })
    )
    .query(async ({ input }) => {
      if (!verifyOrderPaymentToken(input.paymentToken, input.orderId)) {
        throw new Error("Invalid payment token");
      }

      const db = await getDb();
      if (!db) return { paymentStatus: "unknown" };

      const orderResult = await db
        .select()
        .from(orders)
        .where(eq(orders.id, input.orderId))
        .limit(1)
        .execute();

      if (orderResult.length === 0) {
        throw new Error("Order not found");
      }

      const order = orderResult[0];

      const txResult = await db
        .select()
        .from(mpesaTransactions)
        .where(eq(mpesaTransactions.orderId, input.orderId))
        .orderBy(desc(mpesaTransactions.createdAt))
        .limit(1)
        .execute();

      return {
        paymentStatus: order.paymentStatus,
        orderStatus: order.status,
        mpesaReceiptNumber:
          txResult.length > 0 ? txResult[0].mpesaReceiptNumber : null,
      };
    }),
});
