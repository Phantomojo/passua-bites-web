# UX/UI Research & Design Guide for Kenyan Market

> Comprehensive UX/UI recommendations for Passua Bites
> Target: Kenyan smartphone users, primarily Android, price-sensitive (Ksh 40-200 range)
> Research date: April 10, 2026

---

## Table of Contents
1. [Mobile-First Design for Kenya](#1-mobile-first-design-for-kenya)
2. [Cultural UX Considerations](#2-cultural-ux-considerations)
3. [Food Ordering UX Patterns](#3-food-ordering-ux-patterns)
4. [Accessibility (WCAG 2.1)](#4-accessibility-wcag-21)
5. [Conversion Optimization](#5-conversion-optimization)
6. [Design System Recommendations](#6-design-system-recommendations)
7. [Error States & Edge Cases](#7-error-states--edge-cases)

---

## 1. Mobile-First Design for Kenya

### Android Dominance

**94.2% of Kenyan smartphone users run Android** (Business Daily Africa, Jan 2025). iPhone is 5.8%. Design for Android first, treat iOS as an afterthought.

### Screen Sizes (StatCounter Kenya 2025)

| Resolution | Market Share | Devices |
|------------|--------------|---------|
| **360x800** | 16.2% | Tecno/Infinix entry-level (most common) |
| **360x806** | 10.4% | Tecno/Infinix mid-range |
| **385x854** | 9.5% | Various Android devices |
| **360x780** | Common | Samsung A-series |
| **412x915** | Smaller | Pixel/higher-end Samsung |

**Design Breakpoint Strategy:**
- **Base design at 360px width** - covers ~60% of users
- Test at 375px and 412px
- Tablet is negligible for this audience - skip tablet-specific layouts
- Sweet spot smartphone screen: **6.5-6.8 inches** (JuaTech 2025)

### Data Cost Reality

| Safaricom Bundle | Price | Data |
|------------------|-------|------|
| Daily/Weekly | Ksh 50 | ~1GB |
| No-expiry | Ksh 100 | 200MB |
| WhatsApp Bundle | Ksh 100 | 1GB + WhatsApp |
| Monthly | Ksh 500 | 20GB + WhatsApp |
| Monthly | Ksh 1,000 | 8GB + calls + SMS + WhatsApp |
| Monthly | Ksh 2,000 | 17GB |

**Implications for Passua Bites:**
- Target **under 500KB initial page load** for first meaningful paint
- Lazy-load all food images; use WebP format with JPEG fallback
- Avoid auto-playing video on the landing page
- Inline critical CSS; defer non-critical JS
- Consider a "lite" mode toggle for users on very tight bundles
- **WhatsApp bundles are "free"** on Safaricom - this is why WhatsApp ordering is so popular

### Loading Speed Expectations

- 4G coverage exists in Ruiru/Nairobi metro, but many users experience **3G speeds** (2-5 Mbps)
- Users on limited bundles are **hyper-aware of loading times** - a 5-second load feels like wasting their data
- **Perceived performance matters more than actual performance**: skeleton screens, optimistic UI updates, and progressive image loading reduce bounce rates

### Touch Target Sizes

| Standard | Size | Use Case |
|----------|------|----------|
| **WCAG 2.5.8 (AA)** | 24x24 CSS px | Minimum for all interactive elements |
| **WCAG AAA** | 44x44 CSS px | Apple HIG standard |
| **Material Design** | 48x48 CSS px | Recommended for Android (your audience) |

**For food ordering buttons (Add to Cart, Order Now): use minimum 48x48px**

Spacing between touch targets: at least **8px gap** to prevent mis-taps

### Mobile Navigation Patterns

**Bottom navigation bar** (3-5 items max) is the standard pattern Kenyan users know from M-Pesa, Glovo, Bolt Food

**Recommended nav structure:**
```
Home | Menu | Orders | Cart | Profile
```

**Use bottom sheet drawers** (vaul is already in your dependencies) for:
- Cart
- Filters
- Item customization

This is the pattern users know from Bolt Food.

**Swipe gestures:**
- Horizontal swipe on menu categories
- Swipe-to-dismiss on cart items
- Pull-to-refresh on order history

---

## 2. Cultural UX Considerations

### Color Psychology in Kenyan/East African Culture

| Color | Cultural Meaning | Use in Passua Bites |
|-------|-----------------|---------------------|
| **Red** | Vitality, life force, passion | CTAs, "hot/fresh" badges, urgency |
| **Yellow/Amber** | Optimism, royalty, happiness | **Primary brand color** - appetite-stimulating |
| **Green** | Fertile land, renewal | "Available", "delivered", vegetarian |
| **Orange** | Warmth, energy, friendliness | Secondary brand, complements amber |
| **Brown** | Earth, grounding | Text, borders - sparingly |
| **White** | Purity, new beginnings | Background, clean space |
| **Black** | Resilience, history | Text, borders - avoid large backgrounds |

**Your current palette uses blue** (`--primary: var(--color-blue-700)`). For a street food business, **amber/orange is significantly better**:
- Blue suppresses appetite psychologically
- Blue has no cultural resonance with Kenyan food
- Warm tones align with both food psychology and African color symbolism

**Colors to avoid:**
- Large areas of dull grey (feels "boring" - African design favors vibrancy)
- Pure black backgrounds (too harsh; use dark grey like `#1a1a1a`)
- Overly pastel palettes (feel foreign/Western, not locally rooted)

### Language Preferences

| Language | Use Case | Examples |
|----------|----------|----------|
| **English** | Primary for digital interfaces, functional text | Navigation, forms, descriptions |
| **Swahili** | Warmth, microcopy, brand personality | "Karibu!" (Welcome), "Asante!" (Thank you) |
| **Sheng** | Marketing content only, sparingly | "Bomba!" (Great), "Form ni smokies" |

**Recommendation:** English for all functional text, Swahili for warmth/microcopy, Sheng only in marketing/social content.

### Trust Signals for Kenyan Users

1. **M-Pesa payment badge** - the single most important trust signal
2. **Physical location display** - "Ruiru, along Thika Road" with map pin
3. **Phone number prominently displayed** - expected to be reachable
4. **"Made in Kenya" / local branding** - subtle pride signal
5. **Real photos of the actual stall/stand** - not stock photos
6. **Social media follower counts** - "5K+ followers on TikTok"

### Social Proof Importance

- Kenyan consumers heavily rely on **word-of-mouth and social validation**
- Display review counts prominently: "4.8 (127 reviews)" not just "4.8 stars"
- Show recent orders: "John in Ruiru just ordered 3 smokies" (with privacy considerations)
- TikTok and Instagram are the dominant social platforms

### WhatsApp Integration

**Critical finding: 44.8% of Kenyan e-commerce orders happen via apps/WhatsApp** (Biznake 2026)

**Why Kenyans prefer WhatsApp ordering:**
- Uses free WhatsApp bundles
- Feels conversational and familiar
- They can ask questions before ordering

**Implementation recommendations:**
- Floating WhatsApp button on every page (bottom-right, above cart FAB)
- "Order via WhatsApp" as an alternative checkout option
- WhatsApp Business API for automated order confirmations
- Pre-filled WhatsApp message: "Hi Passua Bites! I'd like to order: [cart items]"
- WhatsApp link format: `wa.me/254722473873`

### Phone Number Format

| Format | Example | Use Case |
|--------|---------|----------|
| Local | `0712345678` | Display, input placeholder |
| International | `+254 712 345 678` | Display after formatting |
| API | `254712345678` | M-Pesa STK Push (required) |

**Input UX:**
- Accept both formats: `0712345678` and `+254712345678`
- Auto-format on blur: display as `+254 712 345 678`
- Show placeholder: `0712 345 678`
- Validation regex: `/^(?:\+254|0)[17][0-9]{8}$/`
- For M-Pesa STK push: always convert to `2547XXXXXXXX` format

---

## 3. Food Ordering UX Patterns

### Cart Abandonment Reduction

1. **Guest checkout** - do not force account creation. Collect phone number only.
2. **Single-page checkout** - maximum 2 steps: (1) Review cart + delivery details, (2) Payment
3. **Transparent pricing early** - show item prices, delivery fee, and total on cart page
4. **Save cart across sessions** - localStorage persistence
5. **WhatsApp fallback** - if checkout fails, offer "Send order via WhatsApp"
6. **Progress indicator** - "Step 1 of 2" reduces anxiety

### Checkout Flow Optimization

**Minimum fields required:**
- Phone number (for M-Pesa + contact)
- Delivery location (text input + optional map pin, or "Pickup" toggle)
- Payment method selection (M-Pesa, Cash on Delivery)
- Optional: Name, special instructions

**Do NOT require:**
- Email address (not essential for this market)
- Full address with postal code
- Account registration

### Payment Method Selection UX

| Method | Priority | Notes |
|--------|----------|-------|
| **M-Pesa (STK Push)** | Primary, default | Highlighted, M-Pesa logo prominent |
| **Cash on Delivery/Pickup** | Secondary | Important for users who distrust digital payments |

**STK Push UX:**
- Display the exact amount that will be deducted
- After STK push: show "Check your phone - enter M-Pesa PIN" with loading spinner
- Show countdown timer (STK expires in 90 seconds)
- Phone number being charged: "M-Pesa prompt sent to 2547XX XXX XXX"

### Order Tracking Status Updates

For street food, granular tracking like "driver is 200m away" is overkill.

**Recommended statuses:**
1. **"Order Received"** - confirmation immediately after payment
2. **"Preparing Your Food"** - kitchen has started
3. **"Ready for Pickup / On the Way"** - depends on delivery vs pickup
4. **"Delivered / Enjoy!"** - completion

**Use Swahili for the final status:** "Chakula tayari!" or "Asante! Enjoy your meal!"

### Reordering UX

Street food customers are creatures of habit. They order the same 2-3 items repeatedly.

**Implementation:**
- **"Order Again" button** on every past order in order history - one tap to recreate the exact cart
- **"Your Usual" section** on the home page - shows the user's most-ordered items
- After order completion: "Want to save this as your usual order?" prompt
- Smart defaults: if a user always orders "2 smokies + 1 soda", pre-populate that quantity

### Upselling Without Being Annoying

| Tactic | Where | Example |
|--------|-------|---------|
| **Combo suggestions** | Cart page | "Add a soda for Ksh 30?" |
| **Quantity nudges** | Menu page | "Most people order 2-3 smokies" |
| **Time-based** | Menu/Hero | "Breakfast Special: 2 eggs + chapati + tea - Ksh 150" |
| **Never use pop-ups** | Anywhere | They feel aggressive on mobile |

---

## 4. Accessibility (WCAG 2.1)

### Color Contrast Requirements

| Level | Normal Text | Large Text (18px+ or 14px+ bold) |
|-------|-------------|----------------------------------|
| **AA** | 4.5:1 | 3:1 |
| **AAA** | 7:1 | 4.5:1 |

**Critical issue with amber:**
- Amber `#F59E0B` on white `#FFFFFF` = **2.1:1 - FAILS AA** for text
- Amber `#F59E0B` on dark `#1a1a1a` = **8.5:1 - passes AAA**

**Solution:** Use amber for backgrounds, icons, and decorative elements. Use dark text (`#1a1a1a`) on amber backgrounds. **Never use amber as text color on white.**

### Screen Reader Compatibility

- All food images need descriptive alt text:
  - ✅ `"Grilled smokie with kachumbari on a metal grill"`
  - ❌ `"smokie.jpg"`
- Interactive elements need `aria-label`:
  - `<button aria-label="Add 2 smokies to cart">`
- Form inputs must have associated `<label>` elements
- Use `role="status"` for order status updates so screen readers announce them

### Keyboard Navigation

- All interactive elements must be reachable via Tab key
- Focus visible indicator: use `outline-ring/50` (already in your CSS)
- Skip-to-content link for screen reader users
- Modal/dialog trapping: your `Dialog` and `Sheet` components from Radix handle this

### Focus Management

- After adding to cart: move focus to the cart button or show a non-focus-stealing toast
- After checkout completion: move focus to the order confirmation heading
- On page load: focus should be on the main content, not the first nav link

### Form Label Requirements

- Every input needs a **visible label** (not just a placeholder)
- Required fields marked with `*` and explained: "* Required fields"
- Error messages associated with inputs via `aria-describedby`
- Phone number field: label as "Phone Number (for M-Pesa)" not just "Phone"

### Error Message Clarity

| Good | Bad |
|------|-----|
| "STK push failed" | "Error 500: Daraja API timeout" |
| "We couldn't process your M-Pesa payment" | "Payment gateway error" |
| "Payment was cancelled. [Try Again] or [Pay with Cash]" | "ResultCode: 1032" |

**Always provide a recovery action.**

---

## 5. Conversion Optimization

### Hero Section Best Practices

The hero should answer three questions in 3 seconds:
1. **What do you sell?** - "Fresh Smokies, Chapati, Eggs & Smochas"
2. **Where are you?** - "Ruiru, Opp Rainbow Resort"
3. **How do I order?** - Big "Order Now" CTA

**Layout recommendation:**
- Background: high-quality photo of the actual grill/stand (darkened with overlay)
- Headline: "Passua Bites - Ruiru's Best Street Food"
- Subheadline: "Smokies, Chapati, Eggs & Smochas. Fresh off the grill."
- Primary CTA: "Order Now" (amber/orange button, minimum 48px height)
- Secondary CTA: "View Menu" (outlined button)
- Trust badge: "Pay via M-Pesa" + "4.8 stars on Google"

### Call-to-Action Placement and Wording

| CTA | Placement | Wording |
|-----|-----------|---------|
| **Primary** | Sticky at bottom of screen (mobile) | "Order Now" |
| **Menu items** | Each item card | "Add to Cart" |
| **Past orders** | Order history | "Order Again" |
| **Payment** | Checkout | "Pay with M-Pesa" |

**Wording that works in Kenya:**
- ✅ "Order Now" (clear, direct)
- ✅ "Add to Cart" (standard)
- ✅ "Pay with M-Pesa" (specific, builds trust)
- ❌ "Proceed to Checkout" (too formal)
- ❌ "Buy Now" (feels like e-commerce, not food)

### Urgency Tactics

| Tactic | Example | Notes |
|--------|---------|-------|
| **"Hot & Fresh"** badge | On items currently being prepared | Use flame icon |
| **"Only X left today"** | For limited-stock items | Must be truthful |
| **"Open Now"** status | Business hours indicator | Shows availability |
| **Time-sensitive combos** | "Breakfast Special until 11 AM" | Creates urgency |
| **Avoid fake urgency** | "3 people looking at this" | Kenyan users see through it |

### Social Media Proof Integration

- **TikTok embed:** Show 3 most recent TikTok videos in horizontal scroll ("See Us in Action")
- **Instagram feed:** Grid of 4-6 food photos linking to your Instagram
- **Google Reviews widget:** Show 3-5 recent reviews with star ratings
- **Social proof numbers:** "500+ orders served" or "5K+ happy customers"

### Bolt Food Integration Positioning

- Bolt Food is a **discovery channel**, not a competitor
- Many Kenyan users find restaurants on Bolt, then order directly for better prices
- Position it as: "Also available on Bolt Food" with the Bolt logo - signals legitimacy
- Offer a **direct-ordering discount**: "Order direct and save Ksh 20 (no Bolt commission)"
- **Do not hide Bolt Food** - embrace it as social proof

---

## 6. Design System Recommendations

### Current State

Your codebase uses:
- **shadcn/ui** (New York style) with Radix primitives
- **Tailwind CSS v4** with OKLCH color space
- **Lucide React** icons (v0.453)
- **Framer Motion** for animations
- **next-themes** for dark mode support
- Current primary color: **blue** (`--color-blue-700`)

### Recommended Color Palette (Warm Tones for Food)

```css
:root {
  /* Primary: warm amber/orange - appetite-stimulating, culturally resonant */
  --primary: oklch(0.65 0.18 65);       /* #F59E0B - amber-500 */
  --primary-foreground: oklch(0.20 0.02 45);  /* dark brown text on amber */

  /* Secondary: deeper orange for accents */
  --secondary: oklch(0.70 0.16 45);     /* #EA580C - orange-600 */
  --secondary-foreground: oklch(0.98 0.005 45);

  /* Accent: warm red for urgency/badges */
  --accent: oklch(0.60 0.20 25);        /* #DC2626 - red-600 */
  --accent-foreground: oklch(0.98 0 0);

  /* Success: green for "available", "delivered" */
  --success: oklch(0.60 0.15 145);      /* #16A34A - green-600 */

  /* Background: warm white, not clinical */
  --background: oklch(0.985 0.005 65);  /* slightly warm white */
  --foreground: oklch(0.20 0.02 45);    /* warm dark brown, not pure black */

  /* Card: slightly off-white for depth */
  --card: oklch(1 0.003 65);
  --card-foreground: oklch(0.20 0.02 45);
}
```

### Typography Recommendations

**For Kenya (fast loading, good readability on small screens):**

| Font | Pros | Cons | Size (2 weights) |
|------|------|------|------------------|
| **Inter** | Excellent legibility, default shadcn | Common | ~50KB |
| **Plus Jakarta Sans** | Modern, popular in African tech | Slightly larger | ~60KB |
| **Poppins** | Friendly, geometric | Larger file | ~80KB |

**Recommendation:** **Inter** (already shadcn default) or **Plus Jakarta Sans** for more personality.

**Font loading strategy:**
- Self-host fonts (200-300ms faster than Google Fonts CDN)
- Use `font-display: swap` to prevent invisible text during font load
- Limit to 2 weights: 400 (body) and 600/700 (headings)
- Preload the WOFF2 file in `<head>`

**Type scale for mobile-first:**

| Element | Size | Weight |
|---------|------|--------|
| Body | 16px (1rem) minimum | 400 |
| H1 | 28px | 700 |
| H2 | 24px | 700 |
| H3 | 20px | 600 |
| H4 | 18px | 600 |
| Menu item names | 16px | 600 |
| Prices | 18px | 700 (in primary color) |
| Captions/descriptions | 14px | 400 |

**Never go below 14px** for any text.

### Icon Recommendations

**Lucide React** (already installed) is excellent - consistent stroke width, good mobile legibility.

**Key icons for Passua Bites:**

| Icon | Use Case |
|------|----------|
| `Flame` | "Hot & Fresh" badge |
| `MapPin` | Location |
| `Phone` | Contact/WhatsApp |
| `ShoppingBag` | Cart |
| `Clock` | Preparation time |
| `Star` | Ratings |
| `Repeat` | Reorder |
| `CheckCircle` | Order confirmed |
| `XCircle` | Payment failed |
| `Loader2` | Loading states |

### Spacing and Layout Patterns

| Element | Mobile | Tablet+ |
|---------|--------|---------|
| Card padding | 16px (p-4) | 20px (p-5) |
| Section spacing | 32px (gap-8) | 48px (gap-12) |
| Menu grid | 1 column | 2 columns at 640px+ |
| Cart drawer | Full-width | 400px max-width |
| Base spacing unit | 4px (Tailwind default) | 4px |

### Component Consistency Patterns

**Menu Item Card:**
```
┌─────────────────────┐
│                     │
│   Image (16:9)      │
│                     │
├─────────────────────┤
│ Smokie          Ksh │
│ Grilled sausage  70 │
│         [-] 1 [+]   │
│        [Add to Cart]│
└─────────────────────┘
```

**Cart Item:**
```
┌─────────────────────────┐
│ [Thumb] Smokie    Ksh 70│
│         [-] 2 [+]   140 │
│                   [Remove]│
└─────────────────────────┘
```

**Order Status Card:**
```
┌─────────────────────────┐
│ ✓ Order Confirmed       │
│ Apr 10, 2026 2:30 PM    │
│ ▓▓▓▓▓▓░░░░░░ 50%        │
│ Preparing your food...  │
└─────────────────────────┘
```

**Review Card:**
```
┌─────────────────────────┐
│ [Avatar] John K.        │
│ ★★★★★                   │
│ "Best smochas in Ruiru!"│
│ 2 days ago              │
└─────────────────────────┘
```

### Dark Mode Considerations

**40%+ of top Kenyan websites now offer dark mode** (Mamba Technologies 2025)

**Worth implementing because:**
- Battery savings on OLED/AMOLED screens (common on Tecno/Infinix mid-range phones)
- Reduced eye strain for nighttime ordering (peak hours may be 6-10 PM)
- Signals a modern, professional brand

**Implementation notes:**
- Use `next-themes` (already installed)
- Avoid pure black (`#000000`) - use `#1a1a1a` or `#18181b`
- Warm the dark background slightly: `oklch(0.18 0.01 45)` instead of neutral grey
- Ensure amber/orange colors remain visible on dark backgrounds (they should - 8.5:1 contrast)
- Food photos should not be dimmed - they should remain vibrant in both modes

---

## 7. Error States & Edge Cases

### Payment Failure UX

**Scenario: M-Pesa STK push expires or user cancels**

| Element | Content |
|---------|---------|
| Icon | `XCircle` in orange (not red) |
| Title | "M-Pesa payment was not completed" |
| Actions | `[Try M-Pesa Again]` `[Pay with Cash]` `[Contact Us]` |
| Cart | Preserve the cart - do NOT clear it |
| After 2 failures | "Having trouble? Order via WhatsApp instead" |

**Scenario: Insufficient M-Pesa balance**
- Show: "Your M-Pesa balance may be insufficient. Please check your balance and try again, or choose Cash on Delivery."
- This is empathetic and provides an alternative

### Out-of-Stock Item Handling

| Location | Behavior |
|----------|----------|
| **Menu** | Grey out with "Sold Out Today" badge (don't remove - users need to know it exists) |
| **Cart** | If item sells out while in cart: "Sorry, [item] just sold out. It has been removed from your cart." with auto-removal and toast |
| **Suggest alternatives** | "Try our [similar item] instead" with one-tap add |

### Delivery Area Validation

| Stage | Behavior |
|-------|----------|
| **Before checkout** | Show "We deliver within Ruiru and surrounding areas (up to 5km)" on cart page |
| **On address input** | Auto-validate against known delivery areas |
| **If outside area** | "Sorry, we don't deliver to [area] yet. But you can pick up from our stall!" with map pin |
| **Fallback** | Offer pickup as always-available option |

### Network Error States

| State | Message |
|-------|---------|
| **Offline** | "You're offline. Menu is available to browse. Orders will be placed when you're back online." |
| **Failed API call** | "Couldn't load the menu. [Retry]" |
| **Slow connection** | After 3 seconds: "Loading... (this may take a moment on your connection)" |
| **Submit failure** | "Your order wasn't sent. Your cart is saved - try again when you have a better connection." |

### Empty States

**Empty Cart:**
```
     🛒
  Your cart is empty
  Browse our menu and add your favorites!
        [View Menu]
```

**No Orders Yet:**
```
     📋
  No orders yet
  Your order history will appear here once you place your first order.
        [Order Now]
```

**No Reviews:**
```
     ☆
  Be the first to review!
  Try our smokies and let us know what you think.
        [Order Now]
```

**No Search Results:**
```
     🔍❌
  No results for "[query]"
  Try a different search term or browse our full menu.
        [View Full Menu]
```

### Loading States

**Skeleton screens** (you have `Skeleton` component):

**Menu items skeleton:**
```
┌─────────────────────┐
│ ░░░░░░░░░░░░░░░░░░░ │
│ ░░░░░░░░░░░░░░░░░░░ │
├─────────────────────┤
│ ░░░░░░░░░░░░░░░░░   │
│ ░░░░░░░░░░░         │
│ ░░░░░░░░░░░░░░░     │
└─────────────────────┘
```

**Best practices:**
- Skeletons must match the **exact layout** of the loaded content
- Use shimmer animation (CSS gradient animation) - your current `animate-pulse` is basic but functional
- Only show skeletons for loads over 500ms - for faster loads, skeletons cause a flash that feels worse than a spinner
- For M-Pesa STK push: use a spinner with text "Waiting for M-Pesa confirmation..." and a 90-second countdown

**Spinner usage:**
- Use for indeterminate waits (payment processing, form submission)
- Never use for content loading (skeletons are better)
- Always pair with explanatory text: "Processing your order..." not just a spinning circle

---

## Summary: Highest-Impact Recommendations

| Priority | Recommendation | Impact |
|----------|----------------|--------|
| **1** | Switch from blue to amber/orange primary color | Appetite stimulation, cultural resonance |
| **2** | Design for 360px width first | Covers 60%+ of users |
| **3** | M-Pesa STK push as default payment | Expected by Kenyan users |
| **4** | WhatsApp ordering as parallel checkout | 44.8% of Kenyan e-commerce involves WhatsApp |
| **5** | "Order Again" one-tap reordering | Street food customers order same items repeatedly |
| **6** | Guest checkout with phone number only | Minimize friction |
| **7** | Skeleton loading states | Better perceived performance |
| **8** | Dark mode support | Battery savings, modern feel |
| **9** | Self-host fonts with 2 weights | Fast loading on limited data |
| **10** | Swahili microcopy ("Karibu!", "Asante!") | Warmth while keeping English functional |

---

## Resources

- StatCounter Kenya: https://gs.statcounter.com
- Safaricom Bundle Pricing: https://www.safaricom.co.ke
- WCAG 2.1 Guidelines: https://www.w3.org/WAI/standards-guidelines/wcag/
- Material Design Touch Targets: https://m3.material.io
- African Color Symbolism: Various cultural sources
- Kenyan Digital Behavior: Biznake 2026 Report
