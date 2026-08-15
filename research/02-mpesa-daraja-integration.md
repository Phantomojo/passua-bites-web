# M-Pesa Daraja API Integration Guide

> Complete reference for integrating M-Pesa payments into Passua Bites
> Based on Daraja 3.0 (late 2025/early 2026)
> Sources: Safaricom Developer Portal, integration documentation, real-world implementations

---

## Table of Contents
1. [Daraja API Setup](#1-daraja-api-setup)
2. [STK Push Implementation](#2-stk-push-implementation)
3. [STK Push Query API](#3-stk-push-query-api)
4. [Error Handling](#4-error-handling)
5. [C2B Integration](#5-c2b-integration)
6. [B2C Integration](#6-b2c-integration)
7. [Security & Compliance](#7-security--compliance)
8. [Go-Live Process](#8-go-live-process)
9. [Code Implementation Guide](#9-code-implementation-guide)

---

## 1. Daraja API Setup

### Creating a Developer Account

1. Go to **developer.safaricom.co.ke**
2. Register with your email and phone number
3. Create a new application
4. Select required APIs:
   - Lipa Na M-Pesa Online (STK Push)
   - C2B (Customer to Business)
   - B2C (Business to Customer) - optional
5. Receive **Consumer Key** and **Consumer Secret**

### Sandbox vs Production

| Aspect | Sandbox | Production |
|--------|---------|------------|
| Base URL | `https://sandbox.safaricom.co.ke` | `https://api.safaricom.co.ke` |
| Shortcode | Test shortcode `174379` | Your own assigned shortcode |
| Passkey | Provided in sandbox portal | Emailed upon go-live approval |
| Transactions | Simulated only | Real money |
| STK Query | Known to be unreliable | Works correctly |

### Required Credentials

| Credential | Description | Where to Get |
|------------|-------------|--------------|
| **Consumer Key** | API identifier | Daraja portal (immediate) |
| **Consumer Secret** | API secret | Daraja portal (immediate) |
| **Business Shortcode** | 5-6 digit Paybill/Till | Safaricom Business (2-10 days) |
| **Passkey** | Used for STK password | Sandbox: portal / Production: email |
| **SecurityCredential** | For B2C only | Encrypt initiator password with Safaricom cert |

### Getting a Shortcode

**For Individuals:**
- Application form
- National ID
- KRA PIN certificate
- Bank account details
- Proof of online business
- Timeline: 2-4 working days

**For Sole Proprietors:**
- Business certificate/permit
- Owner's National ID
- KRA PIN certificate
- Bank account details
- Timeline: 2-4 working days

**For Limited Companies:**
- CR12 form
- Certificate of Incorporation
- Directors' IDs
- KRA PINs (company + directors)
- Bank letter
- BOF form
- C2B Application Form
- Timeline: 7-10 working days

Apply at a **Safaricom Shop** or via the **Safaricom Business Portal**.

### Costs

**API Access:** FREE - no charge to call endpoints

**Transaction Fees** (depends on tariff plan):

| Tariff Plan | Who Pays | Best For |
|-------------|----------|----------|
| **Mgao** | Shared (customer + business) | Startups |
| **Business Bouquet** | Business absorbs all | E-commerce/food ordering ✓ |
| **Customer Bouquet** | Customer pays all | Utilities/schools |

**Customer Charges (2025):**
- KES 1-100: Free
- KES 101-500: KES 7
- KES 501-1,000: KES 13
- KES 1,001-1,500: KES 23
- KES 1,501-2,500: KES 33

**Recommendation:** Use **Business Bouquet** so customers aren't charged extra.

### OAuth Token Generation

```typescript
import axios from 'axios';

const consumerKey = process.env.MPESA_CONSUMER_KEY;
const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
const isProduction = process.env.NODE_ENV === 'production';
const baseUrl = isProduction 
  ? 'https://api.safaricom.co.ke' 
  : 'https://sandbox.safaricom.co.ke';

let accessToken: string | null = null;
let tokenExpiry: Date | null = null;

async function getAccessToken(): Promise<string> {
  // Refresh token if expired or about to expire (60s buffer)
  if (accessToken && tokenExpiry && new Date() < new Date(tokenExpiry.getTime() - 60000)) {
    return accessToken;
  }

  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
  
  const response = await axios.get(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${auth}` }
  });

  accessToken = response.data.access_token;
  tokenExpiry = new Date(Date.now() + 3600000); // Tokens expire in ~1 hour
  return accessToken;
}
```

---

## 2. STK Push Implementation

### What is STK Push?

STK (Simulator Toolkit) Push triggers an M-Pesa payment prompt directly on the customer's phone. They see:
- Business name (registered to shortcode)
- Amount in KES
- Account reference (your order number)
- Prompt to enter M-Pesa PIN
- Expires after 60-90 seconds

### API Endpoint

```
POST {baseUrl}/mpesa/stkpush/v1/processrequest
```

- Sandbox: `https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest`
- Production: `https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest`

### Request Body

```json
{
  "BusinessShortCode": "174379",
  "Password": "<base64_encoded>",
  "Timestamp": "20260410143022",
  "TransactionType": "CustomerPayBillOnline",
  "Amount": 500,
  "PartyA": "254712345678",
  "PartyB": "174379",
  "PhoneNumber": "254712345678",
  "CallBackURL": "https://yourdomain.com/api/mpesa/callback",
  "AccountReference": "Order123",
  "TransactionDesc": "Food order payment"
}
```

### Field Details

| Field | Description | Constraints |
|-------|-------------|-------------|
| **BusinessShortCode** | Your Paybill/Till number | 5-6 digits |
| **Password** | Base64(Shortcode + Passkey + Timestamp) | Generated per transaction |
| **Timestamp** | YYYYMMDDHHmmss format | Must be current time |
| **TransactionType** | `CustomerPayBillOnline` or `CustomerBuyGoodsOnline` | Paybill vs Till |
| **Amount** | Amount in KES | Whole numbers only, no decimals |
| **PartyA** | Customer phone number | 2547XXXXXXXX format |
| **PartyB** | Same as BusinessShortCode | Must match |
| **PhoneNumber** | Customer phone number | 2547XXXXXXXX format |
| **CallBackURL** | Your HTTPS webhook URL | Must be publicly accessible |
| **AccountReference** | Order identifier | Max 12 chars, alphanumeric |
| **TransactionDesc** | Description | Max 13 characters |

### Password Generation

```typescript
function generatePassword(shortcode: string, passkey: string): { password: string, timestamp: string } {
  const now = new Date();
  const timestamp = now.getFullYear().toString() +
    (now.getMonth() + 1).toString().padStart(2, '0') +
    now.getDate().toString().padStart(2, '0') +
    now.getHours().toString().padStart(2, '0') +
    now.getMinutes().toString().padStart(2, '0') +
    now.getSeconds().toString().padStart(2, '0');
  
  const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');
  return { password, timestamp };
}
```

### Phone Number Formatting

```typescript
function formatPhoneNumber(phone: string): string {
  // Remove spaces, dashes, plus signs
  let cleaned = phone.replace(/[\s\-\+]/g, '');
  
  // Convert 07XXXXXXXX to 2547XXXXXXXX
  if (cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.slice(1);
  }
  
  // Validate format
  if (!/^254[17]\d{8}$/.test(cleaned)) {
    throw new Error('Invalid Kenyan phone number format');
  }
  
  return cleaned;
}

// Examples:
// "0712345678" -> "254712345678"
// "+254712345678" -> "254712345678"
// "254 712 345 678" -> "254712345678"
```

### Immediate Response

```json
{
  "MerchantRequestID": "1946-28543908-1",
  "CheckoutRequestID": "ws_CO_10042026143022789",
  "ResponseCode": "0",
  "ResponseDescription": "The service request is processed successfully."
}
```

**CRITICAL:** `ResponseCode: "0"` only means Safaricom accepted your request. It does **NOT** mean payment succeeded. **Never fulfill orders based on this response alone.**

### Callback Data Structure

**Success Callback:**
```json
{
  "Body": {
    "stkCallback": {
      "MerchantRequestID": "1946-28543908-1",
      "CheckoutRequestID": "ws_CO_10042026143022789",
      "ResultCode": 0,
      "ResultDesc": "The service request is processed successfully.",
      "CallbackMetadata": {
        "Item": [
          {"Name": "Amount", "Value": 500},
          {"Name": "MpesaReceiptNumber", "Value": "QJK7XXXXXXXX"},
          {"Name": "TransactionDate", "Value": 20260410143045},
          {"Name": "PhoneNumber", "Value": 254712345678}
        ]
      }
    }
  }
}
```

**Failure Callback:**
```json
{
  "Body": {
    "stkCallback": {
      "MerchantRequestID": "1946-28543908-1",
      "CheckoutRequestID": "ws_CO_10042026143022789",
      "ResultCode": 1032,
      "ResultDesc": "Request cancelled by user."
    }
  }
}
```

Note: Failure callbacks do **NOT** include `CallbackMetadata`.

---

## 3. STK Push Query API

### When to Query

- After STK expires (~90 seconds) if no callback received
- As reconciliation cron job (every 5 minutes) for missed callbacks
- **NOT for polling** - don't poll aggressively

### Endpoint

```
POST {baseUrl}/mpesa/stkpushquery/v1/query
```

### Request Body

```json
{
  "BusinessShortCode": "174379",
  "Password": "<base64_encoded>",
  "Timestamp": "20260410143022",
  "CheckoutRequestID": "ws_CO_10042026143022789"
}
```

### Response Codes

| Code | Meaning | Action |
|------|---------|--------|
| `0` | Payment completed | Fulfill order |
| `1032` | Cancelled by user | Do not retry, show message |
| `1037` | Timeout/user unreachable | Wait 2-3 min, offer retry |

**Note:** Sandbox STK Query is known to return "FAILED" even for successful payments. Production works correctly.

---

## 4. Error Handling

### Common Error Codes

| Code | Meaning | User-Facing Message | Action |
|------|---------|---------------------|--------|
| `0` | Success | "Payment confirmed!" | Fulfill order |
| `1` | Insufficient funds | "Your M-Pesa balance is insufficient. Add funds or use Fuliza, then retry." | Offer retry |
| `1001` | Transaction in progress | "Another transaction is in progress. Please wait 1-2 minutes and try again." | Wait, retry |
| `1019` | Transaction expired | "Payment prompt expired. Please try again." | Offer retry |
| `1032` | Cancelled by user | "Payment was cancelled. Would you like to try again?" | Do NOT auto-retry |
| `1037` | Timeout | "Payment timed out. Check your network and try again." | Wait 2-3 min, retry |
| `2001` | Invalid PIN | "Incorrect PIN entered. Please try again." | User can retry |
| `9999` | System error | "M-Pesa system error. Please try again in a moment." | Wait 1-2 min, retry |

### Retry Logic Rules

- **NEVER auto-retry on 1032** (user cancellation) - ask user to re-initiate
- **Retry on 1001, 1019, 1025, 9999** after 1-2 minute delay
- **Max 2 retries** before offering alternative payment
- **Use MpesaReceiptNumber as unique key** to prevent duplicate processing

---

## 5. C2B Integration

### What is C2B?

C2B handles payments where the **customer manually initiates** payment via their M-Pesa SIM menu. Your system receives webhook callbacks.

### When to Use C2B vs STK Push

| Scenario | Use |
|----------|-----|
| Seamless checkout | **STK Push** ✓ |
| Customer pays manually | **C2B** |
| STK Push fails | **C2B** (fallback) |
| Offline/USSD payment | **C2B** |

### Register URLs

```
POST {baseUrl}/mpesa/c2b/v1/registerurl
```

```json
{
  "ShortCode": "600584",
  "ResponseType": "Completed",
  "ConfirmationURL": "https://yourdomain.com/api/mpesa/c2b/confirm",
  "ValidationURL": "https://yourdomain.com/api/mpesa/c2b/validate"
}
```

### Confirmation Payload

```json
{
  "TransactionType": "Pay Bill",
  "TransID": "UCB030CBG1",
  "TransTime": "20260311161727",
  "TransAmount": "500.00",
  "BusinessShortCode": "600991",
  "BillRefNumber": "Order123",
  "MSISDN": "254712345678",
  "FirstName": "John"
}
```

---

## 6. B2C Integration

### When Passua Bites Needs B2C

- **Refunds** - customer cancelled, wrong items, quality issues
- **Delivery rider payments** - pay riders their delivery fees
- **Promotional payouts** - loyalty rewards, referral bonuses
- **Supplier payments** - pay food suppliers

### Endpoint

```
POST {baseUrl}/mpesa/b2c/v1/paymentrequest
```

### Request Body

```json
{
  "InitiatorName": "testapi",
  "SecurityCredential": "<encrypted_initiator_password>",
  "CommandID": "BusinessPayment",
  "Amount": 500,
  "PartyA": "600000",
  "PartyB": "254712345678",
  "Remarks": "Refund for order #123",
  "QueueTimeOutURL": "https://yourdomain.com/api/mpesa/b2c/timeout",
  "ResultURL": "https://yourdomain.com/api/mpesa/b2c/result",
  "Occasion": "Order refund"
}
```

### CommandID Types

| Type | Use Case |
|------|----------|
| `BusinessPayment` | General payments (refunds) ✓ |
| `SalaryPayment` | Employee payments (different tax handling) |
| `PromotionPayment` | Rewards, bonuses |

### Limits

- Maximum KES 150,000 per transaction
- Implement batching with delays to avoid API throttling

---

## 7. Security & Compliance

### PCI-DSS

- **M-Pesa handles PCI-DSS compliance** - you never handle card data or M-Pesa PINs
- Your responsibility:
  - Secure callback endpoints
  - Protect API credentials
  - Use HTTPS everywhere

### Kenya Data Protection Act (2019)

- **Phone numbers are personal data** - encrypt at rest, mask in logs
- Obtain consent before storing customer data
- Implement data retention policies
- Use CSRF tokens for web forms

### Transaction Record Keeping (KRA)

- Store all `MpesaReceiptNumber` values for reconciliation
- Keep transaction records for tax purposes
- Reconcile daily: match order totals with M-Pesa settlement reports
- Run scheduled cron job every 5 minutes to query pending transactions

### Credential Security

- **NEVER commit** Consumer Key, Consumer Secret, Passkey, or SecurityCredential to Git
- Use `.env` files with proper access controls
- Generate OAuth tokens server-side, cache with auto-refresh
- Generate Base64 password server-side per transaction

### Callback Security

- **HTTPS required** for all callback URLs
- **Verify callback data** - match Amount, CheckoutRequestID, phone numbers
- **Return 200 OK immediately** before processing to prevent Safaricom retries
- **Rate limiting** on payment initiation endpoints

---

## 8. Go-Live Process

### Step-by-Step

1. **Test thoroughly in Sandbox**
   - All payment flows
   - Error handling
   - Edge cases

2. **Obtain Paybill/Till shortcode** from Safaricom (if not done)

3. **Write go-live letter** on company letterhead including:
   - Company name and registration
   - Shortcode requested
   - APIs requested
   - Confirmation of sandbox testing
   - Public HTTPS callback URLs
   - Technical and admin contacts

4. **Submit to Safaricom**
   - Email: m-pesabusiness@safaricom.co.ke
   - Or via Safaricom Business Portal

5. **Wait for approval** (2-7 business days)

6. **Receive production credentials**
   - Consumer Key
   - Consumer Secret
   - Passkey

7. **Switch to production**
   - Base URL: `https://api.safaricom.co.ke`
   - Update credentials
   - Update shortcode

8. **Test with small live transactions** before full rollout

---

## 9. Code Implementation Guide

### Database Schema Addition

```typescript
// Add to drizzle/schema.ts

export const mpesaTransactions = mysqlTable("mpesaTransactions", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  checkoutRequestID: varchar("checkoutRequestID", { length: 255 }).notNull().unique(),
  merchantRequestID: varchar("merchantRequestID", { length: 255 }),
  mpesaReceiptNumber: varchar("mpesaReceiptNumber", { length: 255 }),
  phoneNumber: varchar("phoneNumber", { length: 20 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  accountReference: varchar("accountReference", { length: 12 }).notNull(),
  status: mysqlEnum("status", ["pending", "completed", "failed", "cancelled"]).default("pending").notNull(),
  resultCode: int("resultCode"),
  resultDesc: text("resultDesc"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
```

### STK Push Initiation (Server-Side)

```typescript
// server/routers/payment.ts
import { router, protectedProcedure, publicProcedure } from '../_core/trpc';
import { z } from 'zod';
import axios from 'axios';
import { db } from '../db';
import { orders, mpesaTransactions } from '../storage';

const baseUrl = process.env.NODE_ENV === 'production'
  ? 'https://api.safaricom.co.ke'
  : 'https://sandbox.safaricom.co.ke';

async function getAccessToken() {
  // ... (see OAuth section above)
}

function generatePassword(shortcode: string, passkey: string) {
  // ... (see password generation above)
}

export const paymentRouter = router({
  initiateStkPush: publicProcedure
    .input(z.object({
      orderId: z.number(),
      phoneNumber: z.string(),
    }))
    .mutation(async ({ input }) => {
      const order = await db.query.orders.findFirst({
        where: (orders, { eq }) => eq(orders.id, input.orderId),
      });

      if (!order) {
        throw new Error('Order not found');
      }

      if (order.status !== 'pending') {
        throw new Error('Order is not in pending state');
      }

      const phone = formatPhoneNumber(input.phoneNumber);
      const amount = Math.round(Number(order.totalPrice)); // Whole numbers only
      const { password, timestamp } = generatePassword(
        process.env.MPESA_SHORTCODE!,
        process.env.MPESA_PASSKEY!
      );

      const accessToken = await getAccessToken();

      const response = await axios.post(
        `${baseUrl}/mpesa/stkpush/v1/processrequest`,
        {
          BusinessShortCode: process.env.MPESA_SHORTCODE,
          Password: password,
          Timestamp: timestamp,
          TransactionType: 'CustomerPayBillOnline',
          Amount: amount,
          PartyA: phone,
          PartyB: process.env.MPESA_SHORTCODE,
          PhoneNumber: phone,
          CallBackURL: process.env.MPESA_CALLBACK_URL,
          AccountReference: `Order${input.orderId}`,
          TransactionDesc: 'Passua Bites food order',
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // Store transaction record
      await db.insert(mpesaTransactions).values({
        orderId: input.orderId,
        checkoutRequestID: response.data.CheckoutRequestID,
        merchantRequestID: response.data.MerchantRequestID,
        phoneNumber: phone,
        amount: amount.toString(),
        accountReference: `Order${input.orderId}`,
        status: 'pending',
      });

      return {
        success: true,
        checkoutRequestID: response.data.CheckoutRequestID,
        message: 'STK Push sent successfully',
      };
    }),

  queryPaymentStatus: publicProcedure
    .input(z.object({
      checkoutRequestID: z.string(),
    }))
    .query(async ({ input }) => {
      const transaction = await db.query.mpesaTransactions.findFirst({
        where: (t, { eq }) => eq(t.checkoutRequestID, input.checkoutRequestID),
      });

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      // If already completed, return cached status
      if (transaction.status === 'completed') {
        return {
          status: 'completed',
          mpesaReceiptNumber: transaction.mpesaReceiptNumber,
        };
      }

      // Query Safaricom API
      const { password, timestamp } = generatePassword(
        process.env.MPESA_SHORTCODE!,
        process.env.MPESA_PASSKEY!
      );
      const accessToken = await getAccessToken();

      const response = await axios.post(
        `${baseUrl}/mpesa/stkpushquery/v1/query`,
        {
          BusinessShortCode: process.env.MPESA_SHORTCODE,
          Password: password,
          Timestamp: timestamp,
          CheckoutRequestID: input.checkoutRequestID,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        status: response.data.ResultCode === '0' ? 'completed' : 'pending',
        resultDesc: response.data.ResultDesc,
      };
    }),
});
```

### Callback Handler

```typescript
// server/_core/mpesaCallback.ts
import express from 'express';
import { db } from '../db';
import { mpesaTransactions, orders } from '../storage';

const router = express.Router();

router.post('/api/mpesa/callback', async (req, res) => {
  // 1. Return 200 IMMEDIATELY to prevent Safaricom retries
  res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });

  try {
    const { Body: { stkCallback } } = req.body;
    const { ResultCode, CheckoutRequestID, CallbackMetadata } = stkCallback;

    // 2. Find transaction
    const transaction = await db.query.mpesaTransactions.findFirst({
      where: (t, { eq }) => eq(t.checkoutRequestID, CheckoutRequestID),
    });

    if (!transaction) {
      console.error('Transaction not found:', CheckoutRequestID);
      return;
    }

    // 3. Handle failures
    if (ResultCode !== 0) {
      await db.update(mpesaTransactions)
        .set({
          status: ResultCode === 1032 ? 'cancelled' : 'failed',
          resultCode: ResultCode,
          resultDesc: stkCallback.ResultDesc,
        })
        .where((t, { eq }) => eq(t.checkoutRequestID, CheckoutRequestID));

      await db.update(orders)
        .set({ paymentStatus: 'failed' })
        .where((o, { eq }) => eq(o.id, transaction.orderId));

      return;
    }

    // 4. Extract metadata
    const metadata: Record<string, any> = {};
    CallbackMetadata?.Item?.forEach((item: any) => {
      metadata[item.Name] = item.Value;
    });

    const { MpesaReceiptNumber, Amount, PhoneNumber } = metadata;

    // 5. Idempotency - prevent duplicate processing
    if (transaction.status === 'completed') {
      console.log('Duplicate callback, skipping:', CheckoutRequestID);
      return;
    }

    // 6. Validate amount
    if (Number(Amount) !== Number(transaction.amount)) {
      console.error('Amount mismatch:', {
        expected: transaction.amount,
        received: Amount,
        orderId: transaction.orderId,
      });
      // Flag for manual review
      return;
    }

    // 7. Confirm payment and fulfill order
    await db.update(mpesaTransactions)
      .set({
        status: 'completed',
        mpesaReceiptNumber: MpesaReceiptNumber,
        resultCode: ResultCode,
        resultDesc: stkCallback.ResultDesc,
      })
      .where((t, { eq }) => eq(t.checkoutRequestID, CheckoutRequestID));

    await db.update(orders)
      .set({
        paymentStatus: 'completed',
        mpesaTransactionId: MpesaReceiptNumber,
        status: 'confirmed', // Move from pending to confirmed
      })
      .where((o, { eq }) => eq(o.id, transaction.orderId));

    console.log('Payment confirmed:', {
      orderId: transaction.orderId,
      receipt: MpesaReceiptNumber,
      amount: Amount,
    });

  } catch (error) {
    console.error('Callback processing error:', error);
  }
});

export default router;
```

### Environment Variables

```env
# M-Pesa Daraja API
MPESA_CONSUMER_KEY=your_consumer_key_here
MPESA_CONSUMER_SECRET=your_consumer_secret_here
MPESA_SHORTCODE=174379
MPESA_PASSKEY=your_passkey_here
MPESA_CALLBACK_URL=https://yourdomain.com/api/mpesa/callback

# Switch for production
NODE_ENV=development  # or production
```

---

## Quick Reference

### Phone Number Format
- Input: `0712345678` or `+254712345678`
- API: `254712345678` (always)
- Validation: `/^(?:\+254|0)[17][0-9]{8}$/`

### Amount Format
- API accepts: Whole numbers only (no decimals)
- Ksh 70.00 → `70`
- Use `Math.round(Number(amount))`

### Transaction Types
- `CustomerPayBillOnline` - for Paybill numbers
- `CustomerBuyGoodsOnline` - for Till/Buy Goods numbers

### Key IDs to Store
- `CheckoutRequestID` - for querying status
- `MerchantRequestID` - for reference
- `MpesaReceiptNumber` - for reconciliation (success only)

### Callback Response Codes
- `0` = Success
- `1` = Insufficient funds
- `1032` = Cancelled by user
- `1037` = Timeout

---

## Testing Checklist

- [ ] STK Push initiates successfully
- [ ] Callback receives and processes success
- [ ] Callback handles failure (user cancels)
- [ ] Callback handles failure (insufficient funds)
- [ ] Callback handles failure (timeout)
- [ ] Idempotency works (duplicate callbacks)
- [ ] Amount validation works
- [ ] Order status updates correctly
- [ ] MpesaReceiptNumber stored correctly
- [ ] Query API works for missed callbacks
- [ ] Phone number formatting works
- [ ] Error messages are user-friendly
- [ ] Production credentials work
- [ ] Small live transaction succeeds

---

## Resources

- Safaricom Developer Portal: https://developer.safaricom.co.ke
- Daraja API Documentation: https://developer.safaricom.co.ke/APIs
- M-Pesa Business Portal: https://business.safaricom.co.ke
- Daraja 3.0 Announcement: https://developer.safaricom.co.ke/daraja3
