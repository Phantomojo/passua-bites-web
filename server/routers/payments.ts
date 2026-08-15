import { z } from "zod";
import { adminProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { orders, mpesaTransactions } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import axios from "axios";

const isProduction = process.env.NODE_ENV === "production";
const MPESA_BASE_URL = isProduction
  ? "https://api.safaricom.co.ke"
  : "https://sandbox.safaricom.co.ke";
const MPESA_SHORTCODE = process.env.MPESA_SHORTCODE?.trim() || "";
const POCHI_BUSINESS_NUMBER = process.env.POCHI_BUSINESS_NUMBER?.trim() || "0725619991";
const POCHI_LABEL = "Pochi la Biashara";
const MPESA_PASSKEY = process.env.MPESA_PASSKEY?.trim() || "";
const MPESA_CALLBACK_URL = process.env.MPESA_CALLBACK_URL?.trim() || "";
const trackingTokenRegex = /^[A-Za-z0-9_-]{32}$/;

function validateMpesaConfig(): void {
  const missing = [
    ["MPESA_SHORTCODE", MPESA_SHORTCODE],
    ["MPESA_PASSKEY", MPESA_PASSKEY],
    ["MPESA_CALLBACK_URL", MPESA_CALLBACK_URL],
    ["MPESA_CONSUMER_KEY", process.env.MPESA_CONSUMER_KEY?.trim()],
    ["MPESA_CONSUMER_SECRET", process.env.MPESA_CONSUMER_SECRET?.trim()],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missing.length > 0) {
    throw new Error(`M-Pesa configuration is incomplete. Missing: ${missing.join(", ")}`);
  }

  if (isProduction && !MPESA_CALLBACK_URL.startsWith("https://")) {
    throw new Error("MPESA_CALLBACK_URL must use HTTPS in production");
  }
}

// STK Push remains available only when its explicit Daraja configuration is supplied.
// Pochi la Biashara is the default customer-facing payment channel and does not use STK credentials.
if (isProduction && process.env.PAYMENT_MODE?.trim().toLowerCase() === "stk") {
  validateMpesaConfig();
}

let accessToken: string | null = null;
let tokenExpiry: Date | null = null;

export function normalizeReceiptCode(value: string): string {
  const code = value.trim().toUpperCase();
  if (!/^[A-Z0-9]{8,20}$/.test(code)) {
    throw new Error("Enter the M-Pesa receipt code from the confirmation SMS");
  }
  return code;
}

function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/[\s\-\+]/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = "254" + cleaned.slice(1);
  }
  if (!/^254[17]\d{8}$/.test(cleaned)) {
    throw new Error("Invalid Kenyan phone number format");
  }
  return cleaned;
}

async function getMpesaAccessToken(): Promise<string> {
  validateMpesaConfig();
  if (
    accessToken &&
    tokenExpiry &&
    new Date() < new Date(tokenExpiry.getTime() - 60000)
  ) {
    return accessToken;
  }

  const consumerKey = process.env.MPESA_CONSUMER_KEY!.trim();
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET!.trim();
  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");

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
  validateMpesaConfig();
  const now = new Date();
  const timestamp =
    now.getFullYear().toString() +
    (now.getMonth() + 1).toString().padStart(2, "0") +
    now.getDate().toString().padStart(2, "0") +
    now.getHours().toString().padStart(2, "0") +
    now.getMinutes().toString().padStart(2, "0") +
    now.getSeconds().toString().padStart(2, "0");

  const password = Buffer.from(
    `${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`
  ).toString("base64");
  return { password, timestamp };
}

export const paymentsRouter = router({
  getInstructions: publicProcedure.query(() => ({
    method: "pochi" as const,
    label: POCHI_LABEL,
    businessNumber: POCHI_BUSINESS_NUMBER,
    instructions: [
      "Open the M-Pesa app or dial *334#.",
      "Choose Pay, then Pochi la Biashara.",
      `Enter ${POCHI_BUSINESS_NUMBER} and the confirmed order total.`,
      "Keep the M-Pesa SMS receipt code for order confirmation.",
    ],
  })),

  submitPochiReceipt: publicProcedure
    .input(
      z.object({
        trackingToken: z.string().regex(trackingTokenRegex),
        receiptCode: z.string().min(8).max(20),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const receiptCode = normalizeReceiptCode(input.receiptCode);
      const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.trackingToken, input.trackingToken))
        .limit(1)
        .execute();

      if (!order || order.status === "cancelled") {
        throw new Error("Order not found or no longer accepting payment updates");
      }
      if (order.paymentMethod !== "pochi") {
        throw new Error("This order is not configured for Pochi la Biashara");
      }
      if (order.paymentStatus === "completed") {
        return { success: true, status: "completed" as const };
      }

      await db
        .update(orders)
        .set({
          paymentReference: receiptCode,
          paymentSubmittedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(orders.id, order.id))
        .execute();

      return { success: true, status: "pending" as const };
    }),

  verifyPochiReceipt: adminProcedure
    .input(
      z.object({
        orderId: z.number().int().positive(),
        receiptCode: z.string().min(8).max(20),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const receiptCode = normalizeReceiptCode(input.receiptCode);
      const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, input.orderId))
        .limit(1)
        .execute();

      if (!order || order.status === "cancelled") {
        throw new Error("Order not found or cancelled");
      }
      if (order.paymentMethod !== "pochi") {
        throw new Error("Only Pochi la Biashara orders can be verified here");
      }
      if (order.paymentStatus === "completed") {
        if (order.paymentReference !== receiptCode) {
          throw new Error("This order is already verified with a different receipt");
        }
        return { success: true, status: "completed" as const };
      }

      const verifiedBy = ctx.user.email || ctx.user.openId || "admin";
      await db
        .update(orders)
        .set({
          paymentStatus: "completed",
          mpesaTransactionId: receiptCode,
          paymentReference: receiptCode,
          paymentSubmittedAt: order.paymentSubmittedAt || new Date(),
          paymentVerifiedAt: new Date(),
          paymentVerifiedBy: verifiedBy.slice(0, 320),
          status: order.status === "pending" ? "confirmed" : order.status,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, order.id))
        .execute();

      return { success: true, status: "completed" as const };
    }),

  initiateStkPush: publicProcedure
    .input(
      z.object({
        trackingToken: z.string().regex(trackingTokenRegex),
        phoneNumber: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const orderResult = await db
        .select()
        .from(orders)
        .where(
          and(
            eq(orders.trackingToken, input.trackingToken),
            eq(orders.status, "pending")
          )
        )
        .limit(1)
        .execute();

      if (orderResult.length === 0) {
        throw new Error("Order not found or not in pending state");
      }

      const order = orderResult[0];
      if (order.paymentMethod !== "mpesa") {
        throw new Error("This order uses Pochi la Biashara; STK Push is not enabled for it");
      }
      const phone = formatPhoneNumber(input.phoneNumber);
      const orderPhone = formatPhoneNumber(order.customerPhone);
      if (phone !== orderPhone) {
        throw new Error("The payment phone number does not match the order");
      }

      const amount = Number(order.totalPrice);
      if (!Number.isInteger(amount) || amount <= 0) {
        throw new Error("M-Pesa orders must have a positive whole-KES total");
      }

      const { password, timestamp } = generatePassword();
      const token = await getMpesaAccessToken();

      try {
        const response = await axios.post(
          `${MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest`,
          {
            BusinessShortCode: MPESA_SHORTCODE,
            Password: password,
            Timestamp: timestamp,
            TransactionType: "CustomerPayBillOnline",
            Amount: amount,
            PartyA: phone,
            PartyB: MPESA_SHORTCODE,
            PhoneNumber: phone,
            CallBackURL: MPESA_CALLBACK_URL,
            AccountReference: `PB${order.id}`,
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

        await db.insert(mpesaTransactions).values({
          orderId: order.id,
          checkoutRequestID: response.data.CheckoutRequestID,
          merchantRequestID: response.data.MerchantRequestID,
          phoneNumber: phone,
          amount: amount.toString(),
          accountReference: `PB${order.id}`,
          status: "pending",
        });

        return {
          success: true,
          checkoutRequestID: response.data.CheckoutRequestID,
          message: "STK Push sent successfully. Check your phone.",
        };
      } catch (error: any) {
        const errorMsg =
          error.response?.data?.errorMessage || error.message || "STK Push failed";
        throw new Error(`M-Pesa STK Push failed: ${errorMsg}`);
      }
    }),

  queryStatus: publicProcedure
    .input(
      z.object({
        trackingToken: z.string().regex(trackingTokenRegex),
        checkoutRequestID: z.string().min(10).max(255),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const orderResult = await db
        .select({ id: orders.id })
        .from(orders)
        .where(eq(orders.trackingToken, input.trackingToken))
        .limit(1)
        .execute();
      if (orderResult.length === 0) throw new Error("Order not found");

      const transaction = await db
        .select()
        .from(mpesaTransactions)
        .where(
          and(
            eq(mpesaTransactions.checkoutRequestID, input.checkoutRequestID),
            eq(mpesaTransactions.orderId, orderResult[0].id)
          )
        )
        .limit(1)
        .execute();
      if (transaction.length === 0) throw new Error("Transaction not found");

      const tx = transaction[0];
      if (tx.status === "completed") {
        return { status: "completed", mpesaReceiptNumber: tx.mpesaReceiptNumber };
      }

      const { password, timestamp } = generatePassword();
      const token = await getMpesaAccessToken();

      try {
        const response = await axios.post(
          `${MPESA_BASE_URL}/mpesa/stkpushquery/v1/query`,
          {
            BusinessShortCode: MPESA_SHORTCODE,
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

        const resultCode = String(response.data.ResultCode);
        if (resultCode === "0") {
          const metadata: Record<string, any> = {};
          response.data.CallbackMetadata?.Item?.forEach((item: any) => {
            metadata[item.Name] = item.Value;
          });

          await db
            .update(mpesaTransactions)
            .set({
              status: "completed",
              mpesaReceiptNumber: metadata.MpesaReceiptNumber || null,
              resultCode: 0,
              resultDesc: response.data.ResultDesc,
            })
            .where(eq(mpesaTransactions.checkoutRequestID, input.checkoutRequestID));

          await db
            .update(orders)
            .set({
              paymentStatus: "completed",
              mpesaTransactionId: metadata.MpesaReceiptNumber || null,
              status: "confirmed",
            })
            .where(eq(orders.id, tx.orderId));

          return { status: "completed", mpesaReceiptNumber: metadata.MpesaReceiptNumber };
        }

        const status = resultCode === "1032" ? "cancelled" : "failed";
        await db
          .update(mpesaTransactions)
          .set({
            status,
            resultCode: parseInt(resultCode, 10),
            resultDesc: response.data.ResultDesc,
          })
          .where(eq(mpesaTransactions.checkoutRequestID, input.checkoutRequestID));

        return { status: status as "failed" | "cancelled" | "pending", resultDesc: response.data.ResultDesc };
      } catch (_error: any) {
        return { status: tx.status, resultDesc: "Query failed, check callback for status" };
      }
    }),

  getOrderPaymentStatus: publicProcedure
    .input(z.object({ trackingToken: z.string().regex(trackingTokenRegex) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { paymentStatus: "unknown" };

      const orderResult = await db
        .select()
        .from(orders)
        .where(eq(orders.trackingToken, input.trackingToken))
        .limit(1)
        .execute();

      if (orderResult.length === 0) throw new Error("Order not found");
      const order = orderResult[0];

      const txResult = await db
        .select()
        .from(mpesaTransactions)
        .where(eq(mpesaTransactions.orderId, order.id))
        .limit(1)
        .execute();

      return {
        paymentStatus: order.paymentStatus,
        orderStatus: order.status,
        mpesaReceiptNumber: txResult.length > 0 ? txResult[0].mpesaReceiptNumber : null,
      };
    }),
});
