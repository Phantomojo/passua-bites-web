# Pasua Bites Owner PWA — Builder Design & Implementation Brief

> **Purpose:** Product, design and engineering guidance for evolving the existing owner experience. This document is a set of principles and implementation constraints, not a claim that every described capability is already implemented.

## 1. Mission

Evolve the existing Pasua Bites admin experience into a dependable restaurant operating system for the owners.

This is not a request to install a generic SaaS dashboard template or to redesign the business identity. The owner application must feel like a natural extension of the existing Pasua Bites storefront: recognisably the same brand, adapted for fast operational work.

**North-star principle: improve the experience without diluting the brand.**

The owners should be able to understand what needs attention, take the next valid action quickly, and manage approved business content without needing a developer for routine changes. The technical controller retains control of the platform, design system, code and integrations.

## 2. Brand identity is a hard constraint

The current public website and its source design system are the source of truth.

- Preserve the existing brand palette and its actual colour values. Do not invent a replacement palette.
- Reuse the repository's CSS variables, theme tokens, typography, spacing conventions, imagery and established visual treatments.
- Inspect the real source styles and components before changing anything. Do not infer colours from screenshots or substitute approximate hex values.
- Preserve the existing relationships between primary, secondary, accent, background, surface, border and text colours.
- Any new semantic states (success, warning, danger, pending) must be introduced carefully and remain compatible with the brand palette and accessible contrast requirements.
- Do not introduce unrelated neon colours, generic SaaS blues/purples, decorative gradients or a separate visual identity.
- Do not assume dark mode is inherently better. Match the site's existing light/dark decisions and extend them consistently.
- Reuse the site's existing fonts and hierarchy. Do not add new font families simply to make the dashboard look different.

The owner application may use denser layouts and stronger operational contrast than the marketing site, but its surfaces, typography, accents and tone must clearly belong to the same brand.

**Do not change the public storefront palette as part of an admin redesign.**

## 3. Design and product principles

### Function before decoration
Every visual element must communicate information, support a task or provide meaningful feedback. Avoid decorative cards, gratuitous gradients, redundant icons, unnecessary charts and animation without a user benefit.

### Operational clarity
A busy owner should understand the state of the restaurant within seconds. Incoming orders, overdue actions, payment state, sold-out items and temporary closures must be more visible than secondary analytics or settings.

### Mobile-first, not mobile-adapted
Assume the owner is using a phone or tablet in a busy kitchen, sometimes with one hand and limited attention. Prioritise large touch targets, readable type, short task paths, clear action hierarchy, minimal typing and layouts that tolerate narrow screens. Desktop should expand naturally without becoming a different product.

### Progressive disclosure
Show the immediate decision first. Keep advanced filters, configuration and reporting available without placing them in the way of frequent tasks.

### Consistency and accessibility
Use consistent navigation, button hierarchy, form patterns, dialogs, status labels, empty states and loading states. Maintain keyboard access, visible focus, semantic controls, contrast and reduced-motion support.

### Evidence-led implementation
Inspect what exists before proposing replacements. Prefer small, reversible improvements over broad rewrites. Every major decision should be tied to a user need, an existing architectural constraint or a measurable reliability improvement.

## 4. Start with repository reconnaissance

Before changing UI or data models:

1. Inspect the current default branch and the head/base of every open PR.
2. Read package scripts, application entry points, routes, authentication middleware, API procedures, database schema and migrations.
3. Inventory existing admin functionality and reusable components.
4. Inspect the actual storefront tokens, fonts, components and responsive behaviour.
5. Trace the real order, payment, menu, announcement and review flows end-to-end.
6. Identify overlapping work in branches and PRs. Do not reimplement functionality that is already merged or present in the current code.
7. Produce a concise gap analysis: existing, broken, missing, duplicated, risky and proposed.
8. Separate work that belongs in the current PR from follow-up work requiring its own migration, tests or review.

Do not infer PR status from old notes. Check GitHub's current state and compare branch ancestry against the current default branch before deciding what to cherry-pick, close or rebuild.

## 5. Owner application information architecture

The existing admin already contains operational areas such as POS, orders, menu, announcements, reviews, settings, analytics and sales. Reorganise and improve those capabilities; do not create a second dashboard alongside them.

A sensible primary navigation for mobile is:

- **Kitchen** — live operational queue and immediate actions.
- **Orders** — searchable order history and order details.
- **Menu** — items, categories, availability, modifiers and media.
- **Promote** — approved announcements and marketing tools as they become available.
- **More** — reports, website content, business settings and account controls.

On larger screens, use a compact sidebar or rail and make efficient use of horizontal space. Keep Kitchen as the default landing view after authentication.

### Kitchen queue
Present clearly grouped states such as New, Accepted, Preparing and Ready. Each order should show the reference, elapsed time, items and quantities, modifiers, special instructions, fulfilment method, relevant payment state and only the customer details required for the task.

Each order card should expose one obvious **next valid action**. Prevent invalid state transitions in the API, not merely by hiding buttons in the UI.

Support audible alerts after an explicit user gesture, vibration where supported, an obvious pause-orders control and clear behaviour when the network is unavailable. Never imply an action succeeded until the server confirms it.

### Orders
Provide practical search and filters, a complete event/status history, fulfilment details, payment verification, cancellation reasons and appropriate customer contact actions. Keep **payment state** separate from **fulfilment state**.

### Menu
Make routine changes easy: item name and description, price, category, image, modifiers, ingredients, allergen information, portions and availability. Support a reason for sold-out status and timed re-enablement where the data model supports it. Confirm destructive or price-changing operations appropriately.

### Reports and settings
Keep reporting and configuration accessible but secondary to the kitchen workflow. Include clear empty states and distinguish actual data from estimates or incomplete integrations.

## 6. Three separate identities and permission boundaries

The target model is three distinct people/accounts, never three labels sharing one password.

### Platform administrator / technical controller
A separate platform-level identity with technical configuration, account provisioning, recovery and emergency access, integrations, audit visibility and platform administration. Business owners must not be able to remove or downgrade this identity. Emergency actions should be explicit and audited; use time limits or reauthentication for sensitive access where practical.

### Business owner A and Business owner B
Each owner has an independent account, password/passkey, recovery path and session inventory. Both receive the agreed owner permissions for daily restaurant operations and approved business-content editing.

Do not hardcode specific people or permissions into React components. Model roles and permissions centrally, enforce them in server-side procedures and test direct API calls. No public self-registration.

Recommended invitation flow:
1. Platform administrator creates a one-time, expiring invitation for a specific owner identity.
2. The invitee opens the invitation and sees the installation/onboarding introduction first.
3. They install the PWA or deliberately continue in the browser.
4. They set their own unique password and configure the chosen MFA/passkey method.
5. They save recovery codes and enter the kitchen experience.

PWA installation is a convenience, **not** an authorization factor. Continuing in a browser must remain possible. Do not claim password setup or individual accounts are implemented until the invitation and authentication migration actually ships.

## 7. Owner-editable website content (typed CMS)

Owners should be able to maintain routine business content without modifying React files. Build a structured editor using approved content types; do not expose arbitrary HTML, scripts, CSS, Markdown-as-code or unrestricted iframe embeds.

Candidate editable sections:

- Homepage hero copy, approved imagery and CTA.
- Featured menu items and menu spotlights selected from existing menu records.
- Promotional/announcement banners.
- Story/editorial sections.
- Approved photo/video gallery assets.
- FAQs and moderated social proof.
- Opening hours and temporary closure notices.
- Canonical contact details, pickup/delivery information and marketplace links.
- SEO title/description and social sharing metadata.

Expected workflow:
- Draft → preview → publish, with scheduling only if a reliable scheduler exists.
- Mobile and desktop preview.
- Revision history, author attribution and restore.
- Image validation, alt text, captions and file-size constraints.
- Clear publishing confirmation and useful validation messages.
- Approval gates for sensitive payment, legal, policy or identity information.

The technical controller owns the content block schema, renderer, components, responsive behaviour, design tokens, typography, motion and integrations. Owners edit the allowed content and arrange approved blocks within those constraints.

Start with the smallest typed schema that solves the confirmed owner needs. Avoid designing an elaborate page-builder database before there is a working editor and a clear publishing workflow.

## 8. Promotions and customer communication

Keep communication categories separate:

1. **Transactional:** order receipt, payment update and fulfilment status.
2. **Marketing:** offers, launches and promotional campaigns.
3. **Public notices:** opening hours, temporary closures and service changes.

Marketing requires explicit, recorded customer consent. Enforce suppression and opt-out at send time, not only when building an audience. Include audience preview, approved templates where required by the provider, frequency limits, quiet hours, idempotent sends, retries and delivery records. An order must never automatically subscribe a customer to marketing.

Do not build a bulk sender as a side effect of a visual calendar mock-up. First establish provider capability, consent data, queue/outbox behaviour, failure handling and operational ownership.

## 9. Security, privacy and reliability

Treat security as an end-to-end product requirement.

- Enforce authentication and authorization on every protected API operation.
- Do not store bearer credentials or session tokens in localStorage.
- Prefer server-managed, secure, HTTP-only cookies with appropriate SameSite and CSRF/origin protections.
- Use per-user password hashes, secure invitation tokens, expiry, rate limiting, recovery controls and session revocation.
- Require reauthentication or equivalent protection for sensitive account/payment actions.
- Keep payment verification authoritative on the server; a submitted receipt is not proof of payment.
- Make order creation, payment callbacks and message sending idempotent.
- Validate input on the server and avoid leaking internal errors or customer details.
- Never cache authenticated API responses, orders, payment information, customer information or tracking tokens in the service worker.
- Do not put secrets in browser bundles, logs, analytics events, referrers or third-party URLs.
- Provide audit records for sensitive owner and platform-admin actions.
- Document backup, restore and migration rollback procedures.
- Make offline states explicit. An offline interface must not show stale operational data as current or claim that a write succeeded before server confirmation.

Noindex, a hidden URL or a PWA install boundary are not authorization controls.

## 10. Scope discipline and pull-request hygiene

Do not turn one PR into an uncontrolled redesign and backend migration.

For each proposed change:
- State the user problem and expected outcome.
- Identify the files, API contracts, database changes and dependencies affected.
- Check for overlap with current branches and open/merged PRs.
- Keep unrelated refactoring out of the change.
- Add focused tests and update docs/config examples.
- Call out migrations, deployment steps and rollback requirements.
- Mark incomplete UI or integrations honestly; do not present placeholders as working features.

Keep the current PR's stated scope intact. Account migration, typed CMS, campaign infrastructure and broad Kitchen redesign may require dedicated follow-up PRs if they involve separate authorization models, migrations or release risk.

## 11. Definition of done

A feature is not complete just because it renders.

For each relevant change, verify:
- pnpm run check
- pnpm run test
- pnpm run build
- Mobile and desktop responsiveness.
- Keyboard navigation, focus states and contrast.
- Correct loading, empty, error and offline states.
- Server-side permission enforcement using anonymous, owner, platform-admin and disabled-account cases where relevant.
- Regression of existing storefront checkout, menu availability, POS, order management and payment verification.
- PWA installation, manifest and service-worker scope.
- No authenticated or customer-specific API response enters Cache Storage.

Report the actual command outcomes and any manual checks. Do not describe an untested path as verified, and do not deploy or run production migrations without an explicit release plan.

## 12. Creative freedom within guardrails

The builder is encouraged to make thoughtful design and engineering decisions, explore better interaction patterns and improve weak existing implementation details. This brief is not a pixel-perfect specification.

However:
- Preserve the existing Pasua Bites brand palette and visual identity.
- Explain significant deviations from existing patterns.
- Prefer accessible, maintainable solutions over effects that merely look impressive.
- Do not invent business facts, prices, contacts, menu items, social activity or integrations.
- Ask for owner confirmation where real business information is ambiguous.
- Make the simplest robust decision that fits the current architecture.

**Final direction:** Build a real restaurant operating system that happens to have a distinctive, polished interface — not a generic dashboard pretending to be one.
