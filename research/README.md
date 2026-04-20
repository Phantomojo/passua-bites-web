# Passua Bites - Complete Research & Implementation Guide

> **Project:** Passua Bites Web Platform
> **Business:** Street food business in Ruiru, Kenya (Smokies, Chapati, Eggs, Smochas)
> **Location:** Opp Rainbow Resort, Ruiru
> **Phone:** 0722473873
> **Research Compiled:** April 10, 2026
> **Tech Stack:** React 19 + TypeScript + Vite 7, Express + tRPC, MySQL + Drizzle, TailwindCSS 4

---

## Overview

This folder contains comprehensive research across all dimensions needed to build and launch a successful food ordering platform for the Kenyan market. The research covers technical architecture, business strategy, payment integration, UX/UI design, and operational considerations.

---

## Research Documents

### 📊 [01 - Market & Business Research](./01-market-business-research.md)

**Covers:**
- Kenyan food delivery market analysis (size, growth, major players)
- Payment landscape (M-Pesa dominance, alternatives)
- Regulatory & legal requirements (Data Protection Act, business licensing, taxes)
- Competitive analysis (what works, what fails)
- Customer psychology (trust factors, price sensitivity, mobile behavior)
- Delivery logistics (radius, fees, personnel options)
- Marketing strategy (TikTok, Instagram, WhatsApp, Google My Business)
- Customer retention (loyalty programs, SMS marketing)
- Financial planning (revenue projections, tax obligations)
- Risk management (food safety, fraud, delivery risks)
- Scaling strategy (hiring, expansion, technology upgrades)

**Key Insights:**
- Bolt Food charges 25-35% commission - direct orders save significant money
- 44.8% of Kenyan e-commerce orders happen via apps/WhatsApp
- M-Pesa handles 90%+ of mobile money transactions
- Design for 360px width first (covers 60%+ of users on Tecno/Infinix)
- Target under 500KB initial page load (users on limited data bundles)

---

### 💳 [02 - M-Pesa Daraja Integration](./02-mpesa-daraja-integration.md)

**Covers:**
- Complete Daraja API setup guide
- STK Push implementation (Lipa Na M-Pesa Online)
- STK Push Query API
- C2B integration (Customer to Business)
- B2C integration (Business to Customer - for refunds)
- Error handling and retry logic
- Security & compliance requirements
- Go-live process step-by-step
- Complete code implementation guide with TypeScript examples

**Key Technical Details:**
- Sandbox shortcode: `174379`
- STK Push endpoint: `/mpesa/stkpush/v1/processrequest`
- Password: Base64(Shortcode + Passkey + Timestamp)
- Phone format: `2547XXXXXXXX` (always)
- Amount: Whole numbers only (no decimals)
- Callback must return 200 OK immediately
- Use `MpesaReceiptNumber` as unique key for idempotency

**Error Codes:**
- `0` = Success
- `1` = Insufficient funds
- `1032` = Cancelled by user (NEVER auto-retry)
- `1037` = Timeout

---

### 🏗️ [03 - Technical Architecture](./03-technical-architecture.md)

**Covers:**
- tRPC router structure (menu, orders, payments, reviews, admin)
- Input validation with Zod v4
- Authentication/authorization middleware
- Database & performance (connection pooling, indexing, migrations)
- Security requirements (OWASP Top 10, rate limiting, CSRF, XSS prevention)
- Deployment & infrastructure (hosting options, domain, SSL, CI/CD)
- Mobile optimization & PWA (service workers, push notifications)
- Testing strategy (unit, integration, E2E, load testing)
- Performance optimization (image optimization, code splitting, caching)
- Monitoring & logging (error tracking, health checks, uptime monitoring)

**Recommended Stack:**
- **Hosting:** Vultr Johannesburg or DigitalOcean (start), AWS Africa Cape Town (scale)
- **Database:** Self-hosted MySQL (start), managed MySQL (scale)
- **Domain:** `.co.ke` (local trust) + `.com` (global)
- **SSL:** Let's Encrypt (free)
- **Process Manager:** PM2
- **Error Tracking:** Sentry
- **CI/CD:** GitHub Actions

---

### 🎨 [04 - UX/UI Design for Kenyan Market](./04-ux-ui-design-kenyan-market.md)

**Covers:**
- Mobile-first design for Kenya (Android dominance, screen sizes, data costs)
- Cultural UX considerations (color psychology, language preferences, trust signals)
- Food ordering UX patterns (cart abandonment, checkout flow, reordering)
- Accessibility (WCAG 2.1 compliance)
- Conversion optimization (hero section, CTAs, urgency tactics)
- Design system recommendations (color palette, typography, icons, spacing)
- Error states & edge cases (payment failure, out-of-stock, network errors)

**Critical Recommendations:**
1. **Switch from blue to amber/orange** - blue suppresses appetite, amber is appetite-stimulating and culturally resonant
2. **Design for 360px width first** - covers Tecno/Infinix entry-level (most common devices)
3. **WhatsApp ordering as parallel checkout** - 44.8% of Kenyan e-commerce involves WhatsApp
4. **Guest checkout with phone number only** - minimize friction
5. **"Order Again" one-tap reordering** - street food customers order same items repeatedly
6. **Swahili microcopy** ("Karibu!", "Asante!") for warmth while keeping English functional
7. **Skeleton loading states** - better perceived performance than spinners
8. **Dark mode support** - battery savings on OLED screens, modern feel

**Color Palette:**
```css
--primary: oklch(0.65 0.18 65);    /* Amber - appetite-stimulating */
--secondary: oklch(0.70 0.16 45);  /* Orange - warm accents */
--success: oklch(0.60 0.15 145);   /* Green - available, delivered */
--accent: oklch(0.60 0.20 25);     /* Red - urgency, hot/fresh */
```

---

## Quick Reference Cards

### Business Essentials

| Item | Details |
|------|---------|
| **Brand Name** | Passua Bites (exact spelling) |
| **Location** | Opp Rainbow Resort, Ruiru |
| **Phone** | 0722473873 |
| **WhatsApp** | https://wa.me/254722473873 |
| **Bolt Food** | https://food.bolt.eu/en/320-nairobi/p/170268-passua-bites/ |
| **Instagram** | https://www.instagram.com/passuabites/ |
| **TikTok** | https://www.tiktok.com/@passuabites001 |
| **Facebook** | https://www.facebook.com/PassuaBites/ |

### Menu Items

| Item | Price (Ksh) | Description |
|------|-------------|-------------|
| Smokies | 70 | Smoked sausage bites, perfect for a quick snack |
| Boiled Eggs | 40 | Simple, protein-rich hard-boiled eggs |
| Chapati | TBD | Freshly cooked Indian flatbread |
| Smochas | TBD | Smoked sausage wrapped in chapati, best smochas in town |

### Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, TypeScript, Vite 7 |
| **UI** | TailwindCSS 4, shadcn/ui, Framer Motion |
| **Routing** | Wouter |
| **State** | tRPC + React Query |
| **Backend** | Express.js, tRPC |
| **Database** | MySQL, Drizzle ORM |
| **Payments** | M-Pesa Daraja API |
| **Storage** | AWS S3 + CloudFront CDN |
| **Maps** | Google Maps API |
| **Testing** | Vitest |

### Key URLs

| Service | URL |
|---------|-----|
| Daraja Sandbox | https://sandbox.safaricom.co.ke |
| Daraja Production | https://api.safaricom.co.ke |
| Daraja Portal | https://developer.safaricom.co.ke |
| M-Pesa Business | https://business.safaricom.co.ke |

---

## Implementation Priority

### Phase 1: Foundation (Must Have)
1. ✅ Database schema (already done)
2. ✅ UI components (already done)
3. ⬜ tRPC routers (menu, orders, reviews)
4. ⬜ M-Pesa STK Push integration
5. ⬜ Admin authentication
6. ⬜ Order placement flow
7. ⬜ Order tracking

### Phase 2: Polish (Should Have)
8. ⬜ WhatsApp integration
9. ⬜ Google Maps embedding
10. ⬜ Reviews system
11. ⬜ Admin dashboard (menu management, order management)
12. ⬜ Mobile optimization
13. ⬜ Error handling & edge cases

### Phase 3: Launch (Nice to Have)
14. ⬜ PWA setup
15. ⬜ Dark mode
16. ⬜ Analytics
17. ⬜ Testing suite
18. ⬜ Performance optimization
19. ⬜ Deployment to production

---

## Next Steps

1. **Read all research documents** - understand the full scope
2. **Set up M-Pesa Daraja account** - start sandbox testing
3. **Register business properly** - county permit, food handling cert
4. **Set up WhatsApp Business** - free, essential for customer communication
5. **Claim Google My Business** - critical for local discovery
6. **Implement tRPC routers** - start with menu, then orders, then payments
7. **Build checkout flow** - the most critical user journey
8. **Test thoroughly** - especially payment flows
9. **Soft launch** - with existing customers first
10. **Gather feedback and iterate** - reviews, testimonials, improvements

---

## Important Considerations

### Legal & Compliance
- Kenya Data Protection Act (2019) requires proper handling of personal data
- Privacy Policy and Terms of Service required
- Business licensing from Kiambu County
- Food handling certificate required
- Tax obligations (VAT if turnover exceeds Ksh 5M annually)

### Security
- Never commit API credentials to Git
- Use HTTPS everywhere
- Validate all inputs with Zod
- Implement rate limiting
- Secure M-Pesa callback endpoint
- Regular dependency updates

### Performance
- Target under 500KB initial page load
- Lazy-load all images
- Use WebP format (already doing this)
- Implement skeleton loading states
- Optimize for 3G speeds

### User Experience
- Mobile-first design (94% Android)
- Guest checkout (no forced registration)
- M-Pesa as primary payment
- WhatsApp as fallback
- Clear error messages with recovery actions
- Swahili microcopy for warmth

---

## Resources & Links

### Documentation
- [tRPC Docs](https://trpc.io)
- [Drizzle ORM](https://orm.drizzle.team)
- [Vite](https://vitejs.dev)
- [React 19](https://react.dev)
- [TailwindCSS](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com)

### Business
- [Safaricom Daraja Portal](https://developer.safaricom.co.ke)
- [Kenya Data Protection Act](https://www.odpc.go.ke)
- [KRA iTax](https://itax.kra.go.ke)
- [Google My Business](https://business.google.com)

### Design
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/standards-guidelines/wcag/)
- [Material Design](https://m3.material.io)
- [Lucide Icons](https://lucide.dev)
- [OKLCH Color Picker](https://oklch.com)

---

## Contact & Support

For questions about this research or implementation:
- Review the relevant document above
- Check official documentation links
- Search for specific topics in the documents
- Test in sandbox environment before production

---

**Remember:** This research is a foundation. Real-world testing with actual Kenyan users will reveal additional insights. Launch, measure, iterate.

*Good luck with Passua Bites! 🍖🔥*
