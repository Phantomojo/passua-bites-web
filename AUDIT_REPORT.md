# Passua Bites — Comprehensive Audit Report

**Site:** https://passua-bites-web.vercel.app
**Date:** 2026-11-01
**Auditor:** Anansi (Hermes Agent)

---

## 1. Admin Functionality — Status: FUNCTIONAL

The admin dashboard (`/admin`) is fully wired and live-tested:

| Feature | Status | Notes |
|---|---|---|
| Password login | ✅ | `ADMIN_PASSWORD` env var (default `passua2026` — **change in prod**) |
| Orders overview + status updates | ✅ | pending → confirmed → preparing → ready → delivered |
| Menu CRUD (add/edit/delete/toggle) | ✅ | Image URL, video URL, category, price |
| Reviews moderation (approve/reject/delete) | ✅ | |
| Displacement message (site notice) | ✅ | |
| Analytics tab | ✅ | pageviews, sessions, devices, countries, browsers |
| New-order sound alert | ✅ | |
| WhatsApp deep-link per order | ✅ | |

**Gaps / recommendations:**
- **No image upload UI** — admin pastes image URLs manually. Consider a direct upload to Vercel Blob (token already configured) so non-technical staff can add photos.
- **No order search/filter/export** — only full list; add CSV export and date-range filter for accounting.
- **No menu reorder / drag-and-drop** — items appear in DB order.
- **No audit log** of who changed what (single shared password).
- **Session token in localStorage** — acceptable for a single-owner tool, but note XSS risk (see Security).
- **No 2FA** — password-only auth. Acceptable for now given low stakes.

---

## 2. Media & Efficiency

**Current state:**
- 18 MB in `client/public/media` (JPG + WebP variants)
- `LazyImage` component with IntersectionObserver lazy loading ✅
- `loading="lazy"` on most `<img>` ✅
- No responsive `srcset` / `<picture>` — serving full-size images to mobile
- No image CDN / optimization (Vercel Image Optimization not configured)
- Videos: `/media/videos/` referenced but no compression/transcoding pipeline
- JS bundle: 1.07 MB (single chunk, no code-splitting) — `(!) Some chunks are larger than 500 kB`

**Recommendations:**
1. **Add `srcset` + `<picture>`** for hero/menu images (serve 400w/800w/1200w).
2. **Convert all JPG to WebP/AVIF** and serve with `<picture>` fallback. WebP variants already exist for some.
3. **Enable Vercel Image Optimization** (`next/image` equivalent) or use `/_vercel/image?url=...&w=...&q=...`.
4. **Code-split** the admin bundle (it's 1 MB+ including recharts) — dynamic import `AdminDashboard`.
5. **Compress videos** with ffmpeg (H.264, 720p, CRF 23) — check current sizes.
6. **Add `Cache-Control` headers** for `/media/*` (immutable, 1 year).
7. **Preload** hero image + critical fonts (`<link rel="preload">`).

---

## 3. Security Audit

### Findings

| # | Severity | Finding | Location |
|---|---|---|---|
| S1 | Medium | Admin token stored in `localStorage` (XSS → token theft) | `AdminDashboard.tsx:143` |
| S2 | Medium | Admin auth is single shared password, no rate limit on `/api/trpc/admin.login` is registered in `vercel-entry.ts` (only in dev server) | `vercel-entry.ts` |
| S3 | Low | `dangerouslySetInnerHTML` for JSON-LD schema — safe (stringified), but verify no user input flows in | `Home.tsx:788` |
| S4 | Low | CORS allows any origin with credentials (`Access-Control-Allow-Origin: *` + credentials) — browsers block credentialed wildcard, but misconfiguration | `vercel-entry.ts` CORS block |
| S5 | Low | No CSRF protection on mutations (tRPC mutations accept POST without CSRF token) | all routers |
| S6 | Info | `console.log` in `vite.ts` for build errors only — no secret leakage found | |
| S7 | Info | SQL uses drizzle tagged templates (parameterized) — **no SQL injection** | `analytics.ts` |
| S8 | Info | Rate limiting registered on `/api/` (200 req/15min) ✅ | `vercel-entry.ts` |
| S9 | Info | Security headers (X-Content-Type-Options, X-Frame-Options, XSS-Protection, Referrer-Policy, Permissions-Policy) ✅ | `vercel-entry.ts` |
| S10 | Info | HTTPS enforced by Vercel ✅ | |

### Recommendations
1. **Move admin token to httpOnly cookie** (requires backend change) — eliminates XSS token theft.
2. **Add rate limiting to `admin.login`** in the Vercel entry (currently only in dev server's `server/_core/index.ts`).
3. **Fix CORS**: when `origin` is present, reflect it (already done) but don't set `*` with credentials. Current code sets `origin || "*"` — with credentials this is technically invalid per spec; browsers will block. For same-origin admin calls it's fine.
4. **Add input validation/sanitization** on review text and order notes (stored XSS risk if rendered unescaped).
5. **Rotate the default admin password** (`passua2026`) — it's in `.env.example` and is guessable.
6. **Add a Content-Security-Policy header** (currently missing).
7. **Verify no secrets in client bundle** — grep for `MPESA_CONSUMER_SECRET`, `DATABASE_URL`, `JWT_SECRET` in `dist/`.

---

## 4. Legal & Compliance (Kenya)

The site already has a comprehensive Privacy Policy and Terms of Service aligned with the **Kenya Data Protection Act, 2019** and references the **ODPC**. Remaining items:

### Covered ✅
- Data collection disclosure, legal basis, retention (2 years), user rights (access/correction/deletion/objection/withdraw consent), ODPC complaint path
- Terms: orders as requests, payment (M-Pesa Paybill 400200/1053125), delivery, cancellations/refunds, food safety/allergens, IP, governing law (Kenya)
- Cookies: essential only, no tracking

### Gaps
1. **M-Pesa Paybill mismatch**: Terms says Business No. 400200 / Account 1053125, but the live integration uses STK Push with shortcode 174379 (sandbox). Update Terms once production shortcode is confirmed.
2. **Food business license / health certificate** — not displayed. Consider adding KEPHIS/county health permit number to footer (builds trust).
3. **Consumer Protection Act (2012)** — refund policy says "M-Pesa reversal" but no timeframe. Add 14-day refund commitment.
4. **Accessibility (PWD Act)** — no WCAG 2.1 AA statement. Add an accessibility statement page.
5. **Cookie consent banner** — none shown (site claims essential-only cookies, so a banner is optional but recommended for transparency).
6. **Data controller registration** — ODPC requires registration for data controllers processing personal data. Ensure Passua Bites is registered.
7. **Delivery zone / pricing transparency** — delivery fees "communicated before confirmation" — make this explicit.
8. **Allergen disclaimer** — present but could be more prominent on menu items.

---

## 5. Other Improvements

| Area | Item |
|---|---|
| SEO | `og:image`, structured data (JSON-LD menu) already present ✅. Add `sitemap.xml` and `robots.txt`. |
| Performance | Bundle 1.07 MB — code-split admin + analytics. |
| PWA | No service worker / manifest — add for offline menu + install prompt. |
| Error monitoring | No Sentry/LogRocket — add for production errors. |
| Backups | Neon DB — enable automated backups (point-in-time recovery). |
| Admin UX | No image upload (paste URL only), no order export, no menu reorder. |
| i18n | English only — consider Swahili for local market. |
| Testing | No E2E tests — add Playwright smoke tests for checkout + admin. |

---

## Priority Action Items (ordered)

1. **Rotate admin password** from `passua2026` (high, quick)
2. **Switch to production Daraja credentials** when ready for real payments (high)
3. **Add rate limiting to `admin.login`** in Vercel entry (medium, quick)
4. **Code-split the bundle** (medium, perf)
5. **Add `srcset`/`<picture>` for images** (medium, perf)
6. **Update Terms M-Pesa Paybill numbers** to match live integration (medium, legal)
7. **Add Content-Security-Policy header** (medium, security)
8. **Register with ODPC** as data controller (legal, one-time)
9. **Add cookie consent banner** (low, compliance polish)
10. **Add image upload to admin** (low, UX)