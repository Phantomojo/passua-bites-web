import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { orders, mpesaTransactions } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import axios from "axios";

// M-Pesa configuration
const isProduction = process.env.NODE_ENV === "production";
const MPESA_BASE_URL = isProduction
  ? "https://api.safaricom.co.ke"
  : "https://sandbox.safaricom.co.ke";

const MPESA_SHORTCODE = process.env.MPESA_SHORTCODE || "174379";
const MPESA_PASSKEY = process.env.MPESA_PASSKEY || "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919";
const MPESA_CALLBACK_URL =
  process.env.MPESA_CALLBACK_URL || "https://your-domain.com/api/mpesa/callback";

// OAuth token cache
let accessToken: string | null = null;
let tokenExpiry: Date | null = null;

async function getMpesaAccessToken(): Promise<string> {
  // Return cached token if still valid (with 60s buffer)
  if (
    accessToken &&
    tokenExpiry &&
    new Date() < new Date(tokenExpiry.getTime() - 60000)
  ) {
    return accessToken;
  }

  const consumerKey = process.env.MPESA_CONSUMER_KEY || "";
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET || "";
  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString(
    "base64"
  );

  const response = await axios.get(
    `${MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
    {
      headers: { Authorization: `Basic ${auth}` },
      timeout: 10000,
    }
  );

  accessToken = response.data.access_token as string;
  tokenExpiry = new Date(Date.now() + 3600000); // 1 hour
  return accessToken;
}

function generatePassword(): { password: string; timestamp: string } {
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

export const paymentsRouter = router({
  // Initiate STK Push
  initiateStkPush: publicProcedure
    .input(
      z.object({
        orderId: z.number(),
        phoneNumber: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get order
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
      const phone = formatPhoneNumber(input.phoneNumber);
      const amount = Math.round(Number(order.totalPrice)); // Whole numbers only

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

        // Store transaction record
        await db.insert(mpesaTransactions).values({
          orderId: input.orderId,
          checkoutRequestID: response.data.CheckoutRequestID,
          merchantRequestID: response.data.MerchantRequestID,
          phoneNumber: phone,
          amount: amount.toString(),
          accountReference: `PB${input.orderId}`,
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

  // Query payment status
  queryStatus: publicProcedure
    .input(z.object({ checkoutRequestID: z.string() }))
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

      // If already completed, return cached status
      if (tx.status === "completed") {
        return {
          status: "completed",
          mpesaReceiptNumber: tx.mpesaReceiptNumber,
        };
      }

      // Query Safaricom API
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

        const resultCode = response.data.ResultCode;

        if (resultCode === "0") {
          // Payment completed - update records
          const metadata: Record<string, any> = {};
          response.data.CallbackMetadata?.Item?.forEach((item: any) => {
            metadata[item.Name] = item.Value;
          });

          await db
            .update(mpesaTransactions)
            .set({
              status: "completed",
              mpesaReceiptNumber: metadata.MpesaReceiptNumber || null,
              resultCode: parseInt(resultCode),
              resultDesc: response.data.ResultDesc,
            })
            .where(
              eq(
                mpesaTransactions.checkoutRequestID,
                input.checkoutRequestID
              )
            );

          await db
            .update(orders)
            .set({
              paymentStatus: "completed",
              mpesaTransactionId: metadata.MpesaReceiptNumber || null,
              status: "confirmed",
            })
            .where(eq(orders.id, tx.orderId));

          return {
            status: "completed",
            mpesaReceiptNumber: metadata.MpesaReceiptNumber,
          };
        } else {
          // Payment failed or pending
          const status =
            resultCode === "1032" ? "cancelled" : "failed";
          await db
            .update(mpesaTransactions)
            .set({
              status,
              resultCode: parseInt(resultCode),
              resultDesc: response.data.ResultDesc,
            })
            .where(
              eq(
                mpesaTransactions.checkoutRequestID,
                input.checkoutRequestID
              )
            );

          return {
            status: status as "failed" | "cancelled" | "pending",
            resultDesc: response.data.ResultDesc,
          };
        }
      } catch (error: any) {
        // Query failed - return current status
        return {
          status: tx.status,
          resultDesc: "Query failed, check callback for status",
        };
      }
    }),

  // Get order payment status
  getOrderPaymentStatus: publicProcedure
    .input(z.object({ orderId: z.number() }))
    .query(async ({ input }) => {
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
