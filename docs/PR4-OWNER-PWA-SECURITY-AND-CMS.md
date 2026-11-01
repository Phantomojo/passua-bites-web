# PR #4 — Owner PWA, security boundary and content operations

## Scope of this PR

This PR is based on the current `master` line (including the existing POS, announcements, sales dashboard and PWA work), not the older PR #3 base. It makes the install surface owner-specific and removes unsafe offline caching of API responses. It also records the product/security decisions required before the next account and CMS migration.

### Implemented here
- The owner manifest is no longer advertised globally from the public storefront HTML.
- The manifest identifies Passua Ops, starts at `/admin`, and has an `/admin` scope.
- The service worker is registered only from the admin dashboard with the `/admin` scope.
- The service worker never caches API responses. Only the app shell and same-origin static assets may be cached.
- First-time authenticated admin visits see an install guide before the dashboard. It supports the Chromium install prompt and gives iOS Safari instructions, with an explicit continue-in-browser option.
- The visual language reuses the storefront's existing dark, ember, ivory, Playfair Display, DM Sans and DM Mono design tokens.

### Explicitly not claimed as complete
- This PR does not yet replace the legacy shared-password admin login with individual owner and platform-admin accounts.
- It does not yet add password setup, invitations, MFA, recovery codes, session revocation or a role-management UI.
- It does not yet build a full block-based CMS or WhatsApp campaign sender.
- It does not deploy or change production data.

## Account model decision

Use three distinct identities, not one shared owner password:

1. **Platform administrator (Michael / technical controller):** separate credentials, platform-admin role, MFA, recovery path, account/device management and emergency intervention. This identity must not be editable or removable by business owners.
2. **Business owner account A:** individually invited, unique password/passkey and owner permissions.
3. **Business owner account B:** individually invited, unique password/passkey and owner permissions.

Owners should not share credentials. The platform administrator should not sign in as an owner for routine work. Emergency access should be explicit, audited, time-limited where possible, and visible in the audit log.

Recommended first-run sequence:
1. Owner receives a one-time invitation link, not a shared permanent password.
2. Owner opens the owner app and sees the install guide first.
3. Owner installs (or chooses continue in browser).
4. Owner sets a unique password and MFA/passkey, then saves recovery codes.
5. Owner lands on the live kitchen queue.

Installation is a convenience, not an authorization factor. Skipping installation must remain possible. Password setup must not be represented as complete until the separate-account auth migration ships.

## Current security findings to carry into the account migration

- The current dashboard stores `pb_admin_token` in `localStorage`; the API client sends it as a Bearer token. Move to server-managed HTTP-only cookies and never return the session JWT to browser JavaScript.
- The current admin login uses one environment password for every administrator and creates/finds one shared admin user. The fallback `passua2026` exists outside production. Remove the fallback in every environment.
- The current admin JWT lifetime is one year. Use short-lived sessions (e.g. 8 hours), rotation, explicit logout/revocation and reauthentication for sensitive actions.
- The current `adminProcedure` only recognizes role `admin`. Introduce explicit `platform_admin` and `owner` permissions and separate platform-only procedures.
- Add login throttling, password hashing (Argon2id preferred; scrypt with per-user salt if native-only), breached-password checks, MFA/passkeys, invite expiry, one-time token hashing, account disablement, session inventory and recovery.
- Add CSRF protection for cookie-authenticated state-changing requests, strict origin checks, secure cookie settings and security event logging.
- Ensure no admin endpoint relies on frontend route hiding. Test direct tRPC calls with anonymous, owner, platform-admin and disabled sessions.

## Service-worker and privacy rules

- Never cache `/api/*`, authenticated tRPC responses, order data, payment data, customer details, admin HTML containing private data, or tracking-token responses.
- Cache only versioned static assets and the generic application shell.
- Do not store credentials or customer data in IndexedDB/localStorage for offline use.
- The owner PWA must show an offline/unavailable state rather than stale order information.
- Do not include tracking tokens in analytics events, referrers, logs or third-party URLs.
- Add `noindex` to owner pages, but treat that as discoverability hygiene only; authorization remains server-side.

## Owner UI direction

Do not replace the existing admin with a generic SaaS template. Keep the visual DNA of the public site:
- near-black / roasted-coffee background;
- ember/orange accents;
- warm ivory typography;
- Playfair Display for editorial headings;
- DM Sans for operational text;
- DM Mono for compact labels, order references and status metadata;
- restrained borders, large tap targets, strong contrast and minimal decoration.

The dashboard already has POS, orders, menu, announcements, reviews, settings, analytics and sales. Reorganize it into a kitchen-first mobile experience:
- **Home / Kitchen:** new, accepted, preparing, ready; large order cards; one obvious next action; sound/vibration controls; new-order badge; quick pause-orders control.
- **Orders:** filters, order detail, customer contact action, payment verification, cancellation reason and order history.
- **Menu:** availability toggles, edit price/content, categories, modifiers, sold-out schedule, featured item and photo/video library.
- **Promote:** website announcements, offers, WhatsApp campaigns (only opted-in audience), campaign preview/schedule and send history.
- **Website:** edit approved page sections and navigation content.
- **Business:** hours, temporary closure, pickup/delivery zones, fees, location, contacts and marketplace links.
- **Reports:** sales, best sellers, payment reconciliation, cancellations, average preparation time and export.
- **Settings:** owner accounts, devices/sessions, notification preferences and support.

On phones, use a bottom navigation bar for Kitchen, Orders, Menu, Promote and More. On desktop/tablet, use a compact left rail and wider order lanes. Kitchen must remain the default landing screen.

## Editable website / CMS model

Owners should edit content without editing React files, while the developer retains control over layout and custom components.

Use structured, typed content—not arbitrary HTML or unrestricted Markdown. Suggested tables:
- `sitePages`: slug, title, status (draft/published), SEO title/description, published version, timestamps.
- `sitePageVersions`: page ID, version number, typed JSON content, author ID, change note, created timestamp.
- `siteAssets`: storage key, MIME type, dimensions, alt text, caption, file size, uploader and timestamps.
- `businessProfile`: canonical phone, WhatsApp, address, map coordinates, opening hours, pickup/delivery settings and marketplace links.
- `promotions`: title, offer details, start/end, coupon/code, visibility, channels, status and terms.
- `campaigns` / `campaignRecipients` / `messageOutbox`: consent-filtered audiences, approved template, idempotency key, provider message ID, attempt count, status and delivery timestamps.

Use reusable block types:
- Hero (eyebrow, heading, copy, CTA, image/video asset)
- Menu spotlight (menu item IDs)
- Story/editorial section (heading, copy, image)
- Gallery (approved asset IDs)
- Announcement banner (announcement ID)
- Social proof (approved review IDs)
- Location/hours/contact (business profile fields)
- Delivery partners (admin-managed external links)
- FAQ (question/answer entries)

The developer owns the component renderer, responsive layout, typography, design tokens, animation and allowed block schema. Owners can reorder approved blocks, edit copy/media/CTA, draft, preview, schedule and publish. Provide revision history, restore, preview on mobile/desktop and an approval gate for sensitive legal/payment content. Do not let owners paste scripts, arbitrary HTML or external iframe embeds.

## Business details and content verification required

Public references currently disagree on some contact details:
- The website's contact page uses **0722 473 873**.
- The PR #1 payment research says the Pochi la Biashara destination is **0725 619 991**.
- A public Ruiru directory listing also has another Passua Bites entry with **0718 137 947** and a different email.
These may be separate contact/payment channels or stale listings. Do not silently merge them. Confirm the official customer phone, WhatsApp number, payment number, email and physical pickup wording with the owners before publishing.

The current site contains hard-coded opening hours, location text, phone/WhatsApp links and Bolt Food, Glovo and Uber Eats links. Move these into the business profile/CMS and add link health checks so owners can update them without a code deployment.

## Social presence research snapshot

The project's previous research identified:
- Instagram: https://www.instagram.com/passuabites/
- TikTok: https://www.tiktok.com/@passuabites001
- A project-linked social reference to the Nairobi Street Food Festival — 11th Edition / Playtime Edition, 8 August 2026, ASK Arena / Jamhuri Showground Main Arena.

Automated access to Instagram and TikTok post content was restricted during this review, so no new menu items, discounts, opening hours, awards, stock claims or current campaigns are asserted from inaccessible posts. The owners should connect/confirm the official accounts and approve the latest content before it is copied to the website. Build a content queue with source URL, post date, caption, selected media, rights/permission status and publication approval.

## Small details / release checklist

- Order lifecycle: accepted vs confirmed, preparing, ready, collected/delivered, cancelled, refunded; prevent invalid transitions.
- Payment: Pochi manual receipt verification remains distinct from order status; amount/reference matching, duplicate receipt detection and immutable audit.
- Fulfilment: pickup/delivery choice, address validation, delivery zones/fees, delivery instructions, estimated times and unavailable-zone handling.
- Menu: modifiers (spicy/non-spicy, extras), ingredient/allergen notes, portion/serving info, sold-out reason and automatic re-enable time.
- Kitchen: audible alert with user gesture, vibration where supported, missed-order escalation, pause new orders and business-hours guard.
- Messaging: transactional vs marketing consent, opt-out, template approval, per-campaign audience preview, frequency caps, quiet hours, outbox retries, delivery receipts and suppression list.
- Website: page drafts, preview, scheduled publish, revisions, rollback, image alt text, SEO/social preview, broken links and mobile checks.
- Privacy: data retention/deletion process, privacy notice accuracy, analytics minimisation, no customer data in service-worker caches, no tracking token leakage.
- Reliability: database backup/restore test, migration rollback plan, health checks, error monitoring, provider outage states and idempotent callbacks.
- Operations: daily close, cash/Pochi reconciliation, refunds/voids, sales export and staff activity log.
- Legal/brand: verify business identity, canonical brand spelling, prices, contact details, allergen disclaimers and current marketplace availability.

## Social / product content candidates (pending owner confirmation)

- FoodFest participation recap and approved event photos.
- Current best-selling Passua combinations and kitchen videos.
- Weekly/limited-time special with actual price, expiry and stock limit.
- New menu launches and sold-out/returning item notices.
- Updated opening hours, temporary closures and delivery partner availability.
- Customer reviews only after moderation and permission checks.

## Validation

Run `pnpm run check`, `pnpm run test`, `pnpm run build` and manual PWA checks on Android Chrome and iOS Safari. Verify the manifest is not attached to public pages, `/admin` is noindex, the service worker scope is only `/admin`, and no API response enters Cache Storage. This PR has not been deployed and does not run migrations.


## Builder handoff

The detailed implementation and design principles are maintained in [PR4-BUILDER-DESIGN-AND-IMPLEMENTATION-BRIEF.md](./PR4-BUILDER-DESIGN-AND-IMPLEMENTATION-BRIEF.md).

That brief makes the existing Pasua Bites storefront palette and design system a hard constraint. Builders must inspect and reuse the actual source tokens; they must not substitute a generic dashboard theme or invent a new palette. It also provides repository reconnaissance steps, kitchen-first UX principles, the three-identity permission model, typed CMS boundaries, messaging consent requirements, security principles, PR scope discipline and definition-of-done checks.

The brief is guidance for implementation planning, not evidence that future account, CMS or campaign features are already shipped. Keep this PR's implemented scope distinct from follow-up work that requires separate migrations, authorization changes or release validation.
