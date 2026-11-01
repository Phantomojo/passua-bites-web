# PR #5 — Static QA and Builder Handoff

**Scope reviewed:** owner workspace navigation, kitchen queue, existing admin page wiring, current order API/payment behaviour and repository test/workflow inventory.

**Review status:** static source review only. No local dependency install, TypeScript compiler, browser session or mobile device was available in this pass. Do not interpret this document as a passing test report.

## Changes made during static recheck

1. Added a visible retry/error state to the Kitchen queue. A failed query is no longer presented as four empty lanes.
2. Removed the obsolete overview stats query and unused status-colour/stat variables left behind after replacing the overview screen.
3. Updated the admin page title/description to reflect the owner workspace.
4. Corrected the misleading pending-order action text. It now says **Accept order**, not **Confirm Payment**, because the current status mutation only changes the fulfilment status.
5. Added a client-side hold for M-Pesa orders whose order payment status is not completed. The Kitchen and Orders views show **Awaiting M-Pesa** instead of an action that could imply payment has been verified.
6. Split the unfiltered Kitchen feed from the Orders page's status-filtered query, so changing the Orders filter cannot hide lanes in Kitchen.
7. Switched new-order sound detection from list length to the newest order ID, avoiding the 100-row cap making the sound indicator stop detecting new arrivals.

These client-side checks are a usability safeguard, not a security boundary. The API must enforce the same rules.

## Findings for the next implementation pass

### P0 — Complete before relying on the new Kitchen workflow

- **Order cards do not contain the food being prepared.** `orders.listAll` currently returns order rows only. The Kitchen board therefore cannot display item names, quantities, modifiers or per-item notes. Extend the API with a stable order-detail shape (preferably batched/joined rather than one query per card), then test the current Orders table consumers for compatibility.
- **Server-side status transitions are not constrained.** `orders.updateStatus` accepts any allowed status enum and updates the row directly. UI button sequencing is not sufficient. Enforce allowed transitions on the server and ensure payment-sensitive states cannot be bypassed by directly calling the API.
- **Payment failure/fallback needs a proper lifecycle.** Successful M-Pesa callbacks mark the order paid and confirmed. The failure path updates the M-Pesa transaction but does not consistently move the order into an actionable failed/expired state. A pending M-Pesa order can remain held indefinitely. Add a reconciliation/retry/fallback-to-cash flow with clear audit history. Do not treat a customer-provided receipt code as verified payment.
- **Individual identities and secure sessions remain outstanding.** The current admin uses the legacy shared-password/localStorage token path. Implement separate platform-admin and owner identities, secure server-managed sessions, invitation-based onboarding, revocation/recovery and server-side role checks before production owner rollout.

### P1 — Finish operational UX

- The Kitchen board currently groups orders by status and shows basic customer/order/payment metadata; it has no order line items yet, search, queue filters, priority/age escalation, fulfilment SLA or pause-orders state. Its feed is isolated from the Orders page filter, but both remain limited to the latest 100 rows.
- The order list is limited to the latest 100 records and has no pagination. A queue count is therefore a count of the returned list, not necessarily all orders in the system.
- The existing Orders, POS, Menu, Reviews, Promotions, Sales, Analytics and Settings panels remain largely their previous implementations. They are still reachable through the new shell, but should receive focused responsive/layout reviews and improvements.
- Add thoughtful states for offline/stale data, query retries, mutation retries and conflicting updates. Avoid presenting stale cached data as live.
- Review the mobile More panel for escape-key/outside-click dismissal, focus handling and safe-area behaviour.
- Confirm the sound notification flow after an explicit user gesture and decide whether owners need an actual sound/vibration preference. The existing sound alert is not a complete kitchen alert-preference system.
- Test the bottom navigation and all existing tab forms/tables on narrow devices. The responsive CSS is source-reviewed but not device-verified.

### P2 — Separate product work

- Typed owner CMS with drafts, preview, revisions and approval boundaries.
- Individual platform-admin/owner permission matrix and account-management UI.
- Marketing campaign infrastructure, consent/suppression and provider-approved WhatsApp messaging.
- Operational reports, shift close/reconciliation and audit views.

## Repository validation inventory

- The repository has a `pnpm run check`, `pnpm run test` and `pnpm run build` script.
- The source tree currently contains only one test file: `server/auth.logout.test.ts`.
- No `.github/workflows/*` CI workflow files were found in the inspected tree.
- Vercel deployment status is reported separately on the PR commit. A successful Vercel deployment is not a substitute for the missing UI/API tests or manual device checks.

## Suggested manual acceptance checklist

- [ ] Owner can reach Kitchen, Orders, Menu, POS, Promote, Reviews, Sales, Analytics and Settings on desktop.
- [ ] Mobile bottom navigation and More panel expose every section without covering content or actions.
- [ ] Kitchen lanes show correct status, age, payment and fulfilment details.
- [ ] A pending cash order can be accepted according to the agreed cash-on-delivery workflow.
- [ ] A pending M-Pesa order cannot be advanced as though payment has completed.
- [ ] Successful M-Pesa callback moves the order into the expected confirmed state.
- [ ] Failed/expired M-Pesa payment can be recovered or converted to cash through an audited server flow.
- [ ] No API failure is displayed as an empty queue.
- [ ] Stale and offline states are obvious; unconfirmed writes never appear successful.
- [ ] Existing menu updates, POS walk-in creation, review moderation, announcements and sales reports still work.
- [ ] Phone, tablet and desktop viewports are checked in real browsers.
- [ ] All server-side status transitions and role boundaries are tested with direct API requests.

**Handoff principle:** keep the current Pasua Bites brand tokens. Continue from this implementation; do not replace it with a generic admin template or rebuild existing modules without first mapping their current functionality.
