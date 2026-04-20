# Passua Bites Website - Project TODO

## Brand & Design
- [x] Download and prepare Passua Bites logo from TikTok
- [x] Generate food product images (Smokies, Boiled Eggs, Chapati, Smochas)
- [x] Define color palette and typography (elegant, polished, premium feel)
- [x] Create design system tokens in Tailwind CSS

## Core Pages & Features

### 1. Homepage
- [x] Hero section with Passua Bites branding and logo
- [x] Location display: "Opp Rainbow Resort, Ruiru"
- [x] Contact number: "0722473873" with call/WhatsApp buttons
- [x] Social media links (Instagram, TikTok, Facebook)
- [x] Featured items preview
- [x] Call-to-action buttons (Order Now, View Menu)

### 2. Menu Page
- [x] Display all menu items with images, descriptions, and prices in KES
- [x] Menu items: Smokies (Ksh 70), Boiled Eggs (Ksh 40), Chapati, Smochas, and others
- [x] Filter/category system for menu items
- [x] Add to cart functionality
- [x] Item detail view with full description

### 3. Shopping Cart & Checkout
- [x] Cart page with item list, quantities, and total price
- [x] M-Pesa payment integration (UI/flow)
- [x] Order summary and confirmation
- [x] Customer details form (name, phone, delivery address)
- [x] Order submission and database storage

### 4. Order Tracking
- [x] Real-time order status display (Pending, Preparing, Ready, Delivered)
- [x] Order history for customers
- [x] Order details view with items and total
- [ ] Status update notifications

### 5. Customer Reviews & Ratings
- [x] Review form (rating 1-5 stars, text feedback)
- [x] Display reviews on menu items or separate reviews page
- [x] Average rating calculation and display
- [x] Review moderation capability for admin

### 6. Bolt Food Integration
- [x] Deep-link button to Passua Bites on Bolt Food
- [x] Redirect to: https://food.bolt.eu/en/320-nairobi/p/170268-passua-bites/
- [x] Clear CTA: "Order on Bolt Food"

### 7. Contact & Location Page
- [x] Embedded Google Map showing location (Opp Rainbow Resort, Ruiru)
- [x] Address display: "Opp Rainbow Resort, Ruiru"
- [x] Phone number: "0722473873" with call button
- [x] WhatsApp order link (pre-filled message)
- [x] Business hours (if applicable)
- [x] Contact form for inquiries

### 8. Admin Dashboard
- [x] Admin authentication (owner login)
- [x] Menu management (add, edit, delete items)
- [x] Order management (view all orders, update status)
- [x] Order statistics and analytics
- [x] Customer reviews moderation
- [x] Dashboard overview with key metrics

## Database Schema
- [x] Users table (customers and admin)
- [x] Menu items table (name, description, price, image URL, category)
- [x] Orders table (customer info, items, status, payment method, M-Pesa transaction ID)
- [x] Order items table (order-item relationships)
- [x] Reviews table (ratings, feedback, moderation status)

## Technical Implementation
- [ ] Set up tRPC procedures for all features
- [ ] Implement M-Pesa payment API integration
- [ ] Set up Google Maps API integration
- [ ] Configure S3 storage for food images and assets
- [ ] Implement authentication for admin dashboard
- [ ] Create vitest unit tests for critical features

## UI/UX & Optimization
- [x] Mobile-first responsive design
- [x] Fast load times (image optimization, lazy loading)
- [x] Elegant and polished visual design
- [ ] Accessibility compliance (WCAG)
- [ ] Cross-browser testing
- [ ] Performance optimization

## Deployment & Launch
- [x] Final testing and QA
- [ ] Set up custom domain (if applicable)
- [ ] Configure analytics
- [x] Create checkpoint before publishing
- [ ] Publish to production

## Notes
- Brand name: Passua Bites (exact spelling)
- Location: Opp Rainbow Resort, Ruiru (exact format)
- Phone: 0722473873 (exact format)
- Prices in KES with "Ksh" prefix
- Target audience: Kenyan smartphone users
- Design approach: Elegant, polished, premium yet approachable

## Mobile Optimization & Polish
- [x] Responsive design for all pages (mobile-first)
- [x] Fast load times and optimized images
- [x] Touch-friendly buttons and navigation
- [x] Elegant color scheme (amber/orange gradient)

## Future Enhancements
- [ ] Real M-Pesa payment gateway integration (STK push)
- [ ] Order notifications (SMS/WhatsApp to customer and owner)
- [ ] Real-time order status updates (WebSocket/polling)
- [ ] Customer authentication and order history
- [ ] Admin role-based access control (protected routes)
- [ ] Inventory management system
- [ ] Analytics and reporting dashboard
- [ ] Integration with other delivery platforms (Uber Eats, Jumia Food)
- [ ] Multi-language support (Swahili)
- [ ] Push notifications for app-like experience


## Logo Integration
- [x] Add founder logo to homepage hero section
- [ ] Create favicon from logo
- [x] Add logo to navigation header
- [ ] Add logo to footer on all pages
- [x] Create About Us page with founder story and logo
- [ ] Add logo to admin dashboard
- [ ] Use logo in order confirmation emails/notifications
