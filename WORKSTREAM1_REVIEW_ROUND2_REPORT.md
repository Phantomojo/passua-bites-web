# Passua Bites — Workstream 1 Review Round 2 Report

Branch: `workstream/payment-order-security`
Commit: `ed67251` (pushed to origin)
Previous reviewed HEAD: `e8678aeb507bac6a50880afe9fa68a90b83537ba`

## Summary

Implemented the independent review findings on the existing branch. No Workstream 2, no merge, no deploy, no production migration.

## Changes

### P0 — Forged M-Pesa callback prevention
- Callback endpoint now requires a server-held `MPESA_CALLBACK_SECRET` via query/header; fail-closed in production.
- `processMpesaCallback` no longer trusts callback JSON. It independently verifies the checkout with Daraja via `queryStkPushStatus` before settling.
- Matched stored `CheckoutRequestID` and `MerchantRequestID`, expected amount, and phone.
- Required receipt evidence; missing/mismatched evidence leaves transaction pending/failed.
- Added callback secret to callback URL when configured.

### P0 — Phone metadata required
- Callback and `queryStatus` now require a valid phone field; normalized with strict `formatPhoneNumber`; no swallowed errors.

### P1 — Duplicate STK initiation race
- Reserve an idempotent payment attempt (`initiating`) before contacting Safaricom; concurrent requests return in-progress.

### P1 — Cash fallback for failed orders
- `markPaid` supports failed→cash-paid transition with actor/time/reason; distinguishes already-paid vs no update. Frontend updated to pass reason.

### P1 — Late callback resurrection
- Successful callback/query no longer revive cancelled orders; status only set to confirmed if previously pending.

### P1 — Phone lookup disclosure
- `listByPhone` is now admin-only; customer OrderTracking no longer exposes multi-order phone lookup.

### P1 — Dedicated token secret
- `paymentToken.ts` requires `ORDER_PAYMENT_TOKEN_SECRET` in production; dev fallback only.

### P1 — POS cash audit fields
- `createWalkIn` records `paidBy`, `paidAt`, `paymentReason` for cash sales.

### Migration / CI
- Added `.github/workflows/ci.yml` and `WORKSTREAMS_REPORT.md`.
- No production migration applied.

## Verification

- `pnpm run check` — passed
- `pnpm test` — 7 tests passed
- `pnpm run build` — passed
- `pnpm run vercel-build` — passed

## Outstanding
- Forged-callback regression test not yet added (reviewer requested); existing tests still pass.
- SQL migration for new columns remains in `MIGRATION_NOTES.md` only (not applied).
