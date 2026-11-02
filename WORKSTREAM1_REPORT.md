# Passua Bites — Engineering Report

**Date:** 2026-11-02  
**Repository:** `Phantomojo/passua-bites-web`  
**Live site:** https://passua-bites-web.vercel.app  
**Admin:** https://passua-bites-web.vercel.app/admin

## 1. Production deployment (Vercel serverless)

- Project deployed to Vercel using `server/vercel-entry.ts` bundled to `api/index.js`.
- Fixed serverless hang by exporting the Express app directly instead of `serverless-http`.
- Fixed `express-rate-limit` undefined IP via `app.set("trust proxy", 1)` and `validate: { ip: false }`.
- Replaced legacy `vercel.json` `builds`+`routes` (which overrode `outputDirectory` and caused "Index of /") with modern `rewrites`: `/api/(.*)` → `/api/index.js`, catch-all → `/index.html`.
- Pushed local `.env` values to Vercel production via `vercel env add` (values redacted).
- Verified live: `/api/health` 200, `/api/trpc/menu.list` 200 with DB rows, `/api/payments/callback` 200.

## 2. Admin and operations

- Admin tRPC client switched to same-origin `/api/trpc`; Bearer token from `localStorage` sent as `Authorization`.
- `server/_core/sdk.ts` `authenticateRequest` accepts Bearer tokens in addition to cookies.
- Admin token hydrated from `localStorage` on load.
- CORS allows `Authorization` header.
- `adminUsers` table with scrypt password hashing; seeded default `admin` / `passua2026` (rotate before production).
- Admin dashboard: Orders, Menu, POS, Announcements, Sales, Reviews, Settings, Analytics, WhatsApp links.
- POS walk-in orders (`orders.createWalkIn`) and sales summary (`orders.getSalesSummary`).
- Order status filtering and server-side transition/payment gating.
- Pause/resume orders endpoints enforced in `orders.create`.
- Cash orders created as `completed`; non-cash orders gated on payment.
- `markPaid` mutation + "Mark paid (cash)" UI action.
- Kitchen board displays real item names and quantities from `orders.listAll`.
- Announcements table + CRUD router + public banner on Home.
- PWA: manifest, icons, service worker, registration.

## 3. M-Pesa Daraja integration

- Sandbox STK push tested with phone `254708374149`; push accepted (`ResponseCode: 0`, `CheckoutRequestID: ws_CO_011120262354077708374149`).
- Callback endpoint returns `{"ResultCode":0,"ResultDesc":"Accepted"}` HTTP 200.
- Checkout UI: STK prompt prominent, manual Paybill fallback collapsible, confirmation-code input removed.
- Terms of Service updated: STK push + manual Paybill fallback `400200`/`1053125`, 14-business-day refund.

## 4. Workstream 1 — Payment and order security (branch `workstream/payment-order-security`)

**Commits:** `97bbbc0`, `370d1ec`, `e8678ae`, `ed67251` (pushed to PR #6; not merged)

### Implemented
- `server/_core/paymentToken.ts`: HMAC `signOrderPaymentToken` / `verifyOrderPaymentToken`.
- `server/routers/payments.ts` rewritten:
  - Removed unsafe Daraja defaults; all required env values enforced via `requireEnv`.
  - `initiateStkPush`, `queryStatus`, `getOrderPaymentStatus` bound to order payment token.
  - Duplicate / already-paid protection; phone validation.
- `server/routers/orders.ts`:
  - `create` returns `paymentToken`.
  - Cash orders created `completed`.
  - `markPaid` cash fallback; transition/payment gating; pause endpoints.
- `client/src/pages/Checkout.tsx`: stores `paymentToken`, passes to STK initiation/status query.
- `server/payments.security.test.ts`: token sign/verify/rejection + phone normalization/rejection; `import "dotenv/config"`.

### Verified end-to-end (sandbox)
- STK push with token-bound request succeeded: `checkoutRequestID: ws_CO_021120261021176708374149`.
- Invalid payment token rejected.
- `pnpm check` clean; `pnpm test` 6 passed.

### Fixes during verification
- Fixed tRPC mutation routing: special rate-limiter mounts were stripping the procedure path, causing `orders.create`/`initiateStkPush`/`admin.login` 404s.
- Ensured `orders.create` returns `paymentToken` (early return was missing it).

## 5. Hardening and content

- `server/vercel-entry.ts`: CSP, Referrer-Policy, Permissions-Policy; CORS restricted to reflected origin.
- `client/src/App.tsx`: lazy-loaded `AdminDashboard` with `Suspense`; cookie consent banner.
- `client/src/pages/Menu.tsx`: "Today's Specials" section from `featured` items.
- `featured` column added to `menuItems` schema + migration applied to live DB.
- `server/routers/upload.ts`: admin-gated Vercel Blob image upload, 5 MB cap.
- `robots.txt` and `sitemap.xml` confirmed present.
- TypeScript compile and `vercel-build` passed; admin chunk split (477 KB).

## 6. PR handling

- PR #1 (`hardening/production-safety-2026-08-15`): not merged — conflicts with live Vercel/STK strategy.
- PR #3 (`feat/customer-whatsapp-availability-2026-11-02`): tests passed; fixed `Set` spread iteration with `Array.from` in `server/_core/index.ts` and `server/_core/whatsapp.ts`; pushed `fix/pr3-set-iteration`.
- PR #4 and PR #5: fast-forward merged into `master`; closed.

## 7. Remaining / blocked

- Workstream 1 awaiting review before Workstream 2 (owner auth).
- Workstream 1 PR not opened yet.
- Admin password still default `passua2026` — rotate before production.
- Production Daraja still requires production credentials (current are sandbox).
- ODPC registration and external legal compliance remain client-owned.
- No production deploy or DB migration performed during Workstream 1.

## 8. Environment (redacted)

- `DATABASE_URL`, `BLOB_READ_WRITE_TOKEN`, `ADMIN_PASSWORD`, `JWT_SECRET`, `MPESA_*`, `APP_URL`, `MPESA_CALLBACK_URL` present in `.env` and Vercel.
- `OAUTH_SERVER_URL` and `VITE_APP_ID` unset (OAuth optional).
- Callback URL: `https://passua-bites-web.vercel.app/api/payments/callback`.
- Paybill fallback: Business No. `400200`, Account No. `1053125`.
