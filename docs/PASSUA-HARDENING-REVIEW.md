# Passua Bites Production-Safety Review

**Author:** Manus AI  
**Working branch:** `hardening/production-safety-2026-08-15`  
**Workspace:** `/home/ubuntu/workspaces/passua-hardening/passua-bites-web`  
**Review date:** 15 August 2026 UTC

## Executive summary

The hardening branch now contains a local, secrets-free production-safety upgrade for Passua Bites. The highest-risk customer-data, admin-session, payment-authority, order-transaction, CORS, and deployment-contract issues were addressed without touching Vercel, Render, the production database, or the Omen machine. The frontend remains a static Vercel deployment, while the Express/tRPC API, authentication cookie issuer, payment callback surface, and database remain on Render.

The customer-facing payment channel is now **Pochi la Biashara — 0725 619 991**. The implementation deliberately does not pretend that a Pochi phone number is an API credential. Customers can submit an M-Pesa receipt code; an authenticated admin verifies it against the business account; only then can the order enter fulfillment. This is the safe behavior until Safaricom Business confirms that this particular Pochi account is eligible for a supported Daraja product.

## Security and operational changes

| Area | Implemented change | Operational effect |
| --- | --- | --- |
| Admin authentication | Removed the `passua2026` fallback, capped admin sessions at eight hours, removed raw JWT response exposure, and kept sessions in an HTTP-only cookie | Missing `ADMIN_PASSWORD` fails closed; browser JavaScript cannot read the session token |
| Public order privacy | Added a 32-character tracking token, replaced numeric-ID/phone enumeration, masked names and phone numbers, and removed public delivery-address disclosure | A customer needs the private token to track an order; public responses reveal only masked information |
| Ordering integrity | Server calculates subtotal, delivery fee, and total from current menu data; order and line items are inserted in one transaction | Browser totals are estimates only; the database is authoritative |
| Payment authority | Pochi orders remain pending until receipt submission and admin verification; direct status transitions into fulfillment are blocked until payment is verified | A customer cannot confirm payment by entering a phone number or clicking a button |
| Admin operations | Added receipt verification controls, a Pochi operations panel, tRPC-based review moderation, and refresh behavior against the Render API | The dashboard can operate correctly in the split Vercel/Render architecture |
| CORS | Replaced reflective origin behavior with an explicit allowlist | Unknown browser origins receive a rejected preflight rather than reflected credentials |
| M-Pesa/STK | Removed unsafe passkey/callback defaults; legacy STK routes require explicit Daraja configuration and are not used by the Pochi default | Production can run in Pochi mode without fake STK credentials |
| Database integrity | Added tracking/total/payment-audit columns, guarded foreign-key migration, and Drizzle journal entries | Legacy orphan data is not silently accepted during FK rollout |
| Deployment | Moved the browser API URL to `VITE_API_URL`, documented split deployment, and added baseline Vercel security headers | Vercel and Render responsibilities are explicit and reviewable |
| Content/privacy | Corrected Neon/Render/Vercel privacy claims, server-side analytics disclosure, manual deletion wording, canonical URL, location language, and Passua spelling | Public policy and SEO metadata match the actual system more closely |
| Performance/UX | Lazy-loaded admin, added deterministic vendor/chart/admin chunks, reduced-motion safeguards, reusable visual states, and richer FoodFest motion | Privileged/chart code is removed from the initial customer path |

## Pochi la Biashara research conclusion

Safaricom’s official M-PESA API page describes open web-service interfaces, automated payment receipt processing, and callback-oriented integrations, but it does not establish that an ordinary Pochi phone account can be used directly as a Daraja callback target [1]. Safaricom’s official Pochi FAQ documents customer payment channels and business-owner access, but the public page does not document a Pochi webhook, callback URL, STK Push credential model, or direct public API [2].

Safaricom’s Daraja documentation defines short codes around PayBill, Buy Goods, and Till accounts and describes asynchronous callback/result handling for supported integrations [3]. Its Pull Transactions documentation is explicitly scoped to C2B transactions under a PayBill or Till number within the previous 48 hours, with one-time registration and reconciliation queries [4]. Consequently, the branch treats **0725619991 as a Pochi payment destination, not as proof of API eligibility**.

> **Recommended business workflow:** Customer pays to Pochi, keeps the M-Pesa receipt code, submits the code through the site or WhatsApp, and the admin verifies the payment in the business account before starting fulfillment.

If automated confirmation is desired later, Safaricom Business should confirm, in writing, the account’s supported product, short-code/API eligibility, callback onboarding requirements, credentials, reconciliation capability, and production support process. The callback must then be idempotent, amount-bound to the order, duplicate-safe, and covered by mocked and staging tests before it replaces manual verification.

## FoodFest update

The FoodFest pages now describe the team’s second 2026 appearance as the **Nairobi Street Food Festival — 11th Edition: Playtime Edition**, held on **8 August 2026** at **ASK Arena / Jamhuri Showground Main Arena**. The recap uses the user-confirmed fact that this edition stayed dry and frames the day as a high-energy stall experience without inventing sales figures, awards, attendance numbers, sponsors, or unverified menu claims. Public event and post-event sources describe the wider atmosphere as food, music, games, vendors, and community [5] [6]. Public Passua Bites social references were used as supporting evidence for the festival association [7] [8].

## Validation evidence

| Validation | Result |
| --- | --- |
| `pnpm install --frozen-lockfile` | Passed |
| `pnpm run check` | Passed |
| `pnpm run test` | Passed: 2 test files, 5 tests |
| `pnpm run build` | Passed: Vite frontend plus esbuild API bundle |
| Local health endpoints | HTTP 200 on local listeners |
| Allowed CORS preflight | HTTP 204 with the exact Vercel origin |
| Unknown CORS preflight | HTTP 403; no origin reflection |
| Pochi instruction procedure | Returned `Pochi la Biashara` and `0725619991` without database access |
| Legacy callback smoke test | Malformed and unknown-shaped payloads received safe HTTP 200 acknowledgements without real credentials |
| Public privacy regression tests | Phone/name masking passed |
| Receipt validation tests | Normalization and rejection cases passed |
| Dependency audit | 0 critical, 9 high, 15 moderate, 3 low advisories in the final resolved tree |
| Secrets scan | No `.env` files or private-key material in the hardening workspace; reusable admin password removed from the Railway helper |

The local checks did not create an order, submit a real payment, connect to the production database, enter admin credentials, or deploy to Vercel/Render.

## Database migration order

The reviewed deployment must apply migrations in order, with a staging or backup-first procedure:

| Migration | Purpose |
| --- | --- |
| `0005_harden_orders_tracking_and_totals.sql` | Backfills and enforces tracking and authoritative order totals |
| `0006_add_order_foreign_keys.sql` | Adds guarded order, menu-item, user, and payment foreign keys |
| `0007_add_pochi_payment_audit.sql` | Adds Pochi receipt submission and admin-verification audit fields and changes the new-order payment default |

Before applying the migrations to the live database, take a backup, run orphan-row checks, confirm the database schema matches the Drizzle branch, and verify that no legacy payment workflow still depends on the removed PayBill destination.

## Residual risks and approval decisions

The branch still has nine high, fifteen moderate, and three low dependency advisories according to the final audit. These are visible in the review evidence and should receive a separate package-by-package upgrade review; the branch does not claim that an audit count of zero means zero risk. The existing generic OAuth/session constants retain a one-year default for non-admin flows; the admin router specifically uses its shorter eight-hour lifetime. Production deployment also requires the actual `ADMIN_PASSWORD`, `JWT_SECRET`, and database credentials to be supplied through Render’s secret store.

The most important business decision is whether the team wants to operate with manual Pochi verification for now or pursue Safaricom Business onboarding for a supported PayBill/Till/Daraja integration. No automatic Pochi confirmation should be enabled based only on the presence of the phone number.

## Release gate

This branch is ready for human review, not automatic production release. Approval should confirm the exact Pochi number, the admin verification process, the customer support/WhatsApp number, the current pickup wording, the migration backup plan, and the Render/Vercel environment variables. Only after that confirmation should the local commit be pushed or a deployment be initiated.

## References

[1]: https://www.safaricom.co.ke/main-mpesa/m-pesa-services/do-more-with-m-pesa/m-pesa-api "Safaricom M-PESA API"
[2]: https://www.safaricom.co.ke/media-center-landing/frequently-asked-questions/pochi-la-biashara "Safaricom Pochi la Biashara FAQ"
[3]: https://developer.safaricom.co.ke/apis/GettingStarted "Safaricom Daraja Getting Started"
[4]: https://developer.safaricom.co.ke/apis/PullTransaction "Safaricom Daraja Pull Transactions"
[5]: https://nairobieventsguide.com/event/nairobi-street-food-festival-playtime-edition/ "Nairobi Street Food Festival — Playtime Edition event guide"
[6]: https://capitalfm.africa/flavor-fashion-and-games-why-the-nairobi-street-food-festival-was-the-ultimate-weekend-hangout/ "Capital FM post-event report"
[7]: https://www.instagram.com/passuabites/reel/Dbqe6TkOfYN/ "Passua Bites public Instagram festival reference"
[8]: https://www.tiktok.com/@passuabites001/video/7671288247842032916 "Passua Bites public TikTok festival reference"
