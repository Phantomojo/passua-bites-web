# Passua Bites deployment contract

## Architecture

The public frontend is a Vite static build deployed to **Vercel**. The tRPC API, Express middleware, M-Pesa callback, authentication cookie issuer, and database access are deployed to **Render**. The browser receives the Render tRPC endpoint from the Vercel build variable `VITE_API_URL`; it must not rely on a hardcoded production hostname in source code.

The production frontend value is:

```text
https://passua-api.onrender.com/api/trpc
```

The Render API must allow the exact Vercel origin `https://passua-bites-web.vercel.app` in its credentialed CORS allowlist. Local development may use `http://localhost:5173` for the Vite browser and `http://localhost:3000` for the Express API.

## Required configuration

Set `VITE_API_URL` in the Vercel project. Set server-only values in Render; never prefix server secrets with `VITE_` and never commit a real `.env` file. The minimum production configuration is `DATABASE_URL`, `JWT_SECRET`, `ADMIN_PASSWORD`, `PAYMENT_MODE=pochi`, and `POCHI_BUSINESS_NUMBER=0725619991`. The `MPESA_SHORTCODE`, `MPESA_PASSKEY`, `MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET`, and HTTPS `MPESA_CALLBACK_URL` variables are required only if the separately gated legacy STK mode is intentionally enabled.

## Release sequence

Run `pnpm install --frozen-lockfile`, `pnpm run check`, `pnpm run test`, and `pnpm run build` in the hardening branch. Apply the reviewed Drizzle migrations to a database backup or staging database first. Confirm the Render health endpoint and CORS preflight from the deployed Vercel origin. Only after those checks should a human approve a Vercel/Render production deployment.

The API is intentionally not proxied through Vercel by this contract. The SPA rewrite covers frontend routes only; `/api/*` remains reserved for a separately deployed API path and should not be assumed to exist on the static Vercel deployment.

## Payment contract: Pochi la Biashara

The customer-facing payment method is **Pochi la Biashara — 0725 619 991**. New orders use `paymentMethod=pochi` and remain pending until a customer receipt code is submitted and a logged-in admin verifies that code against the business account. The server blocks the normal `confirmed` status transition for an unverified Pochi order.

The phone number is not treated as proof of payment. Public Safaricom documentation confirms automated callbacks and Pull Transactions for supported PayBill/Till C2B integrations, but does not establish that a Pochi phone account is directly eligible for those APIs. Do not enable automated confirmation for this Pochi account until Safaricom Business confirms eligibility and provisions the required credentials, short code, callback onboarding, and reconciliation access.

The legacy Daraja STK endpoints remain isolated behind explicit `MPESA_*` configuration and are not required when `PAYMENT_MODE=pochi`. If Safaricom later provisions a supported API, add idempotent callback handling, callback-IP controls, receipt/amount/order matching, duplicate protection, and reconciliation tests before changing the default mode.
