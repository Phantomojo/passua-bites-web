# Technical Architecture & Implementation Guide

> Complete technical reference for building Passua Bites
> Stack: React 19 + TypeScript + Vite 7, Express + tRPC, MySQL + Drizzle, TailwindCSS 4 + shadcn/ui

---

## Table of Contents
1. [tRPC Architecture](#1-trpc-architecture)
2. [Database & Performance](#2-database--performance)
3. [Security Requirements](#3-security-requirements)
4. [Deployment & Infrastructure](#4-deployment--infrastructure)
5. [Mobile Optimization & PWA](#5-mobile-optimization--pwa)
6. [Testing Strategy](#6-testing-strategy)
7. [Performance Optimization](#7-performance-optimization)
8. [Monitoring & Logging](#8-monitoring--logging)

---

## 1. tRPC Architecture

### Router Structure

```
server/routers.ts (main router)
├── menuRouter
│   ├── list (public) - get all menu items
│   ├── getById (public) - get single menu item
│   ├── create (admin) - add menu item
│   ├── update (admin) - edit menu item
│   └── delete (admin) - remove menu item
├── orderRouter
│   ├── create (public) - place new order
│   ├── getById (public) - track order status
│   ├── listByPhone (public) - order history
│   ├── listAll (admin) - all orders
│   └── updateStatus (admin) - update order status
├── paymentRouter
│   ├── initiateStkPush (public) - start M-Pesa payment
│   ├── queryStatus (public) - check payment status
│   └── callback (public, webhook) - M-Pesa callback
├── reviewRouter
│   ├── create (public) - submit review
│   ├── list (public) - get approved reviews
│   ├── listPending (admin) - reviews needing moderation
│   └── approve (admin) - approve/reject review
└── adminRouter
    ├── login (public) - admin authentication
    ├── logout (public) - end admin session
    ├── stats (admin) - dashboard statistics
    └── updateMenuAvailability (admin) - toggle item availability
```

### Input Validation with Zod v4

```typescript
import { z } from 'zod';

// Menu item validation
const menuItemSchema = z.object({
  name: z.string().min(2).max(255),
  description: z.string().max(1000).optional(),
  price: z.number().positive().max(99999.99),
  imageUrl: z.string().url().optional(),
  category: z.string().max(100).optional(),
  available: z.boolean().default(true),
});

// Order validation
const orderSchema = z.object({
  customerName: z.string().min(2).max(255),
  customerPhone: z.string().regex(/^(?:\+254|0)[17][0-9]{8}$/),
  customerEmail: z.string().email().optional(),
  deliveryAddress: z.string().max(500).optional(),
  items: z.array(z.object({
    menuItemId: z.number(),
    quantity: z.number().min(1).max(50),
  })).min(1).max(20),
  paymentMethod: z.enum(['mpesa', 'cash']),
  notes: z.string().max(500).optional(),
});

// Review validation
const reviewSchema = z.object({
  orderId: z.number().optional(),
  menuItemId: z.number().optional(),
  customerName: z.string().min(2).max(255),
  rating: z.number().min(1).max(5),
  reviewText: z.string().max(1000).optional(),
});
```

### Authentication Middleware

```typescript
// server/_core/trpc.ts
import { initTRPC, TRPCError } from '@trpc/server';
import { Context } from './context';

const t = initTRPC.context<Context>().create();

// Base router and procedure
export const router = t.router;
export const publicProcedure = t.procedure;

// Admin authentication middleware
const isAdmin = t.middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in',
    });
  }

  if (ctx.user.role !== 'admin') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Admin access required',
    });
  }

  return next({
    ctx: {
      user: ctx.user,
    },
  });
});

export const adminProcedure = t.procedure.use(isAdmin);
```

### Error Handling

```typescript
// shared/_core/errors.ts
import { TRPCError } from '@trpc/server';

export class AppError {
  static notFound(message = 'Resource not found') {
    return new TRPCError({ code: 'NOT_FOUND', message });
  }

  static badRequest(message = 'Invalid request') {
    return new TRPCError({ code: 'BAD_REQUEST', message });
  }

  static unauthorized(message = 'Unauthorized') {
    return new TRPCError({ code: 'UNAUTHORIZED', message });
  }

  static forbidden(message = 'Forbidden') {
    return new TRPCError({ code: 'FORBIDDEN', message });
  }

  static internal(message = 'Internal server error') {
    return new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message });
  }

  static conflict(message = 'Resource conflict') {
    return new TRPCError({ code: 'CONFLICT', message });
  }
}
```

### File Upload Handling

For food images (admin uploading new menu item images):

```typescript
// Use AWS S3 presigned URLs
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'af-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export const uploadRouter = router({
  getPresignedUrl: adminProcedure
    .input(z.object({
      fileName: z.string(),
      contentType: z.string(),
    }))
    .mutation(async ({ input }) => {
      const key = `menu-items/${Date.now()}-${input.fileName}`;
      
      const command = new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: key,
        ContentType: input.contentType,
      });

      const uploadUrl = await getSignedUrl(s3Client, command, {
        expiresIn: 3600, // 1 hour
      });

      return {
        uploadUrl,
        publicUrl: `https://${process.env.AWS_S3_BUCKET}.s3.amazonaws.com/${key}`,
      };
    }),
});
```

---

## 2. Database & Performance

### MySQL Connection Pooling

```typescript
// server/db.ts
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from '../drizzle/schema';

const poolConnection = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'passua_bites',
  waitForConnections: true,
  connectionLimit: 10, // Adjust based on expected load
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

export const db = drizzle(poolConnection, { schema, mode: 'default' });
```

### Indexing Strategy

```sql
-- Add to drizzle migrations

-- Orders: frequently queried by phone and status
CREATE INDEX idx_orders_phone ON orders(customerPhone);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(createdAt);
CREATE INDEX idx_orders_payment_status ON orders(paymentStatus);

-- Menu items: frequently filtered by availability and category
CREATE INDEX idx_menuItems_available ON menuItems(available);
CREATE INDEX idx_menuItems_category ON menuItems(category);

-- Reviews: filtered by approval status
CREATE INDEX idx_reviews_approved ON reviews(approved);
CREATE INDEX idx_reviews_menuItem ON reviews(menuItemId);

-- M-Pesa transactions: queried by checkout request ID
CREATE INDEX idx_mpesa_checkout_id ON mpesaTransactions(checkoutRequestID);
CREATE INDEX idx_mpesa_order_id ON mpesaTransactions(orderId);
```

### Migration Management

```bash
# Development
pnpm db:push  # Generates and applies migration

# Production
npx drizzle-kit generate  # Generate migration only
npx drizzle-kit migrate   # Apply migration

# Always backup database before running migrations in production
```

### Database Backup Strategy

```bash
#!/bin/bash
# backup.sh - Run daily via cron

BACKUP_DIR="/backups/mysql"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_NAME="passua_bites"

mysqldump -u $DB_USER -p$DB_PASSWORD $DB_NAME > "$BACKUP_DIR/$DB_NAME_$TIMESTAMP.sql"

# Keep last 30 days of backups
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete

# Upload to S3 for offsite backup
aws s3 cp "$BACKUP_DIR/$DB_NAME_$TIMESTAMP.sql" s3://your-backup-bucket/mysql/
```

### Query Optimization

```typescript
// Good: Select only needed fields
const orders = await db.query.orders.findMany({
  columns: {
    id: true,
    customerName: true,
    totalPrice: true,
    status: true,
    createdAt: true,
  },
  with: {
    orderItems: {
      columns: {
        quantity: true,
        priceAtTime: true,
      },
      with: {
        menuItem: {
          columns: {
            name: true,
          },
        },
      },
    },
  },
  orderBy: (orders, { desc }) => [desc(orders.createdAt)],
  limit: 50,
});

// Bad: Selecting everything
const badQuery = await db.select().from(orders);
```

---

## 3. Security Requirements

### OWASP Top 10 Mitigations

| Vulnerability | Mitigation |
|---------------|-----------|
| **A01: Broken Access Control** | Role-based middleware (isAdmin), tRPC procedures with auth |
| **A02: Cryptographic Failures** | HTTPS everywhere, encrypt sensitive data, secure API keys |
| **A03: Injection** | Drizzle ORM parameterized queries (prevents SQL injection), input validation with Zod |
| **A04: Insecure Design** | Rate limiting, payment verification before order fulfillment |
| **A05: Security Misconfiguration** | Environment variables, disable error details in production |
| **A06: Vulnerable Components** | Regular dependency updates, `pnpm audit` |
| **A07: Auth Failures** | Secure session management, JWT with short expiry |
| **A08: Data Integrity Failures** | Verify M-Pesa callbacks, validate all inputs |
| **A09: Logging Failures** | Log security events, don't log sensitive data |
| **A10: SSRF** | Validate callback URLs, restrict outbound requests |

### Input Sanitization

```typescript
// Phone number validation
const phoneRegex = /^(?:\+254|0)[17][0-9]{8}$/;

function sanitizePhone(phone: string): string {
  return phone.replace(/[\s\-\+]/g, '');
}

// Name sanitization (prevent XSS)
function sanitizeName(name: string): string {
  return name
    .replace(/[<>]/g, '') // Remove < and >
    .trim()
    .slice(0, 255);
}

// Address sanitization
function sanitizeAddress(address: string): string {
  return address
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, 500);
}
```

### Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

// Payment initiation rate limit
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 payment attempts per window
  message: 'Too many payment attempts. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// General API rate limit
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // 100 requests per 15 minutes
  message: 'Too many requests. Please try again later.',
});

// Apply in Express
app.use('/api/trpc/', apiLimiter);
app.use('/api/mpesa/stkpush', paymentLimiter);
```

### CSRF Protection

```typescript
import csrf from 'csurf';

// For web forms (not tRPC which uses JSON)
const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  },
});
```

### Secure Session Management

```typescript
import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

async function createSession(user: User) {
  const token = await new SignJWT({
    userId: user.id,
    role: user.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET);

  return token;
}

async function verifySession(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch {
    return null;
  }
}
```

### Environment Variable Management

```env
# .env (NEVER commit to Git)

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=passua_user
DB_PASSWORD=strong_password_here
DB_NAME=passua_bites

# M-Pesa
MPESA_CONSUMER_KEY=your_key
MPESA_CONSUMER_SECRET=your_secret
MPESA_SHORTCODE=174379
MPESA_PASSKEY=your_passkey
MPESA_CALLBACK_URL=https://yourdomain.com/api/mpesa/callback

# JWT
JWT_SECRET=generate_a_long_random_secret_here

# AWS S3
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=af-south-1
AWS_S3_BUCKET=passua-bites-images

# Google Maps
GOOGLE_MAPS_API_KEY=your_key

# App
NODE_ENV=development
PORT=3000
APP_URL=http://localhost:3000
```

### .gitignore

```gitignore
# Already in your .gitignore, verify these are present:
.env
.env.local
.env.production
node_modules/
dist/
*.log
.DS_Store
```

---

## 4. Deployment & Infrastructure

### Hosting Options for Kenya

| Option | Cost/Month | Latency to Kenya | Best For |
|--------|-----------|------------------|----------|
| **AWS Africa (Cape Town)** | $20-50 | ~80ms | Production, scaling |
| **DigitalOcean (NYC/LON)** | $6-20 | ~150-200ms | Budget, simplicity |
| **Vultr (Johannesburg)** | $6-20 | ~60ms | Good Kenya latency |
| **Local Kenyan Host** | Varies | ~20-40ms | Lowest latency |
| **VPS (Hetzner, OVH)** | $5-15 | ~180ms | Budget option |

**Recommendation:** Start with **Vultr Johannesburg** or **DigitalOcean** for cost-effectiveness. Migrate to **AWS Africa (Cape Town)** when scaling.

### Database Hosting

| Option | Cost/Month | Management | Best For |
|--------|-----------|------------|----------|
| **Self-hosted on VPS** | Included in VPS cost | Manual | Budget, control |
| **AWS RDS** | $15-50 | Managed | Production, scaling |
| **DigitalOcean Managed MySQL** | $15-30 | Managed | Simplicity |
| **PlanetScale** | Free tier | Managed | Serverless MySQL |

**Recommendation:** Start with **self-hosted MySQL** on same VPS. Migrate to **managed MySQL** when you need reliability guarantees.

### Domain Registration

| TLD | Cost/Year | Best For |
|-----|-----------|----------|
| **.co.ke** | Ksh 1,000-2,000 | Kenyan businesses (local trust) |
| **.com** | Ksh 1,200-1,500 | Global recognition |
| **.ke** | Ksh 5,000-10,000 | Premium Kenyan |

**Recommendation:** Register **both** `.co.ke` and `.com`. Redirect `.com` to `.co.ke` or vice versa.

**Registrars:**
- Kenya: Kenya Web Experts, HostPinnacle, Sasahost
- Global: Namecheap, Cloudflare, Google Domains

### SSL/TLS Configuration

```bash
# Using Let's Encrypt (free)
sudo apt install certbot python3-certbot-nginx

# For Nginx
sudo certbot --nginx -d passuabites.co.ke -d www.passuabites.co.ke

# Auto-renewal (certbot sets this up automatically)
# Verify with:
sudo certbot renew --dry-run
```

### CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Deploy Passua Bites

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm check
      - run: pnpm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: |
          # SSH to server and deploy
          ssh ${{ secrets.DEPLOY_USER }}@${{ secrets.DEPLOY_HOST }} << 'EOF'
            cd /var/www/passua-bites
            git pull origin main
            pnpm install
            pnpm db:push
            pnpm build
            pm2 restart passua-bites
          EOF
```

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name passuabites.co.ke www.passuabites.co.ke;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name passuabites.co.ke;

    ssl_certificate /etc/letsencrypt/live/passuabites.co.ke/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/passuabites.co.ke/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;" always;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
    gzip_min_length 1000;

    # Reverse proxy to Node.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # M-Pesa callback (no rate limiting)
    location /api/mpesa/callback {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Process Management (PM2)

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start dist/index.js --name passua-bites

# Auto-restart on crash
pm2 restart passua-bites

# Start on boot
pm2 startup
pm2 save

# Monitor
pm2 monit

# Logs
pm2 logs passua-bites
```

---

## 5. Mobile Optimization & PWA

### PWA Setup

```typescript
// vite.config.ts - Add PWA plugin
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Passua Bites',
        short_name: 'Passua Bites',
        description: "Ruiru's best street food - Smokies, Chapati, Eggs & Smochas",
        theme_color: '#F59E0B',
        background_color: '#FFFFFF',
        display: 'standalone',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
});
```

### Service Worker for Offline

```typescript
// public/sw.js
const CACHE_NAME = 'passua-bites-v1';
const OFFLINE_URL = '/offline.html';

const STATIC_ASSETS = [
  '/',
  '/menu',
  '/offline.html',
  '/icon-192.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(OFFLINE_URL);
      })
    );
  }
});
```

### Image Optimization

```typescript
// Already using WebP - good!
// Add lazy loading and responsive images

<img
  src={item.imageUrl}
  alt={item.name}
  loading="lazy"
  sizes="(max-width: 640px) 100vw, 50vw"
  srcSet={`
    ${item.imageUrl}?w=400 400w,
    ${item.imageUrl}?w=800 800w,
    ${item.imageUrl}?w=1200 1200w
  `}
/>
```

### Bundle Size Optimization

```bash
# Analyze bundle
npx vite-bundle-analyzer dist

# Target: < 200KB initial load (gzipped)
# Strategies:
# 1. Code splitting (Vite does this automatically)
# 2. Lazy load routes
# 3. Tree shake unused code
# 4. Compress with Brotli
```

### Core Web Vitals

| Metric | Target | How to Achieve |
|--------|--------|----------------|
| **LCP** (Largest Contentful Paint) | < 2.5s | Optimize hero images, use WebP, CDN |
| **FID** (First Input Delay) | < 100ms | Minimize JS, defer non-critical scripts |
| **CLS** (Cumulative Layout Shift) | < 0.1 | Set image dimensions, avoid layout shifts |
| **INP** (Interaction to Next Paint) | < 200ms | Optimize event handlers, avoid long tasks |

---

## 6. Testing Strategy

### Unit Tests (Vitest)

```typescript
// server/payment.test.ts
import { describe, it, expect, vi } from 'vitest';
import { formatPhoneNumber, generatePassword } from './_core/mpesa';

describe('M-Pesa Utilities', () => {
  describe('formatPhoneNumber', () => {
    it('converts 07XX format to 2547XX', () => {
      expect(formatPhoneNumber('0712345678')).toBe('254712345678');
    });

    it('handles +254 format', () => {
      expect(formatPhoneNumber('+254712345678')).toBe('254712345678');
    });

    it('removes spaces and dashes', () => {
      expect(formatPhoneNumber('0712 345 678')).toBe('254712345678');
    });

    it('throws on invalid format', () => {
      expect(() => formatPhoneNumber('12345')).toThrow();
    });
  });

  describe('generatePassword', () => {
    it('generates valid Base64 password', () => {
      const { password, timestamp } = generatePassword('174379', 'test_passkey');
      expect(password).toBeDefined();
      expect(timestamp).toMatch(/^\d{14}$/);
    });
  });
});
```

### Integration Tests (tRPC)

```typescript
// server/menu.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import { appRouter } from './routers';
import { db } from './db';

describe('Menu Router', () => {
  beforeAll(async () => {
    // Seed test data
    await db.insert(menuItems).values({
      name: 'Test Smokie',
      price: '70',
      description: 'Test item',
    });
  });

  it('lists all available menu items', async () => {
    const caller = appRouter.createCaller({ user: null } as any);
    const items = await caller.menu.list();
    expect(items.length).toBeGreaterThan(0);
  });

  it('gets menu item by ID', async () => {
    const caller = appRouter.createCaller({ user: null } as any);
    const item = await caller.menu.getById({ id: 1 });
    expect(item.name).toBe('Test Smokie');
  });
});
```

### E2E Testing (Playwright)

```typescript
// tests/e2e/order.spec.ts
import { test, expect } from '@playwright/test';

test('customer can browse menu and add to cart', async ({ page }) => {
  await page.goto('/');
  
  // Navigate to menu
  await page.click('text=View Menu');
  await expect(page).toHaveURL('/menu');
  
  // Add item to cart
  await page.click('text=Smokies >> button:has-text("Add")');
  
  // Cart should update
  await expect(page.locator('[data-testid="cart-count"]')).toHaveText('1');
  
  // Go to checkout
  await page.click('text=Checkout');
  await expect(page).toHaveURL('/checkout');
});

test('customer can complete checkout with M-Pesa', async ({ page }) => {
  // ... (test full checkout flow with mocked M-Pesa)
});
```

### Payment Flow Testing (M-Pesa Sandbox)

```typescript
// Use Safaricom's sandbox credentials
// Test all scenarios:
// 1. Successful payment
// 2. User cancels
// 3. Insufficient funds
// 4. Timeout
// 5. Callback failure
// 6. Duplicate callback (idempotency)
```

### Load Testing

```bash
# Using k6
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 50, // 50 virtual users
  duration: '5m',
};

export default function () {
  const res = http.get('https://passuabites.co.ke/api/trpc/menu.list');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
  sleep(1);
}
```

---

## 7. Performance Optimization

### Image Optimization

- **Already using WebP** - excellent!
- Add responsive images with `srcSet`
- Lazy load below-the-fold images
- Use CloudFront CDN (already doing this)
- Compress images before upload (TinyPNG, Squoosh)

### Code Splitting

```typescript
// Lazy load routes
import { lazy, Suspense } from 'react';

const Menu = lazy(() => import('./pages/Menu'));
const Checkout = lazy(() => import('./pages/Checkout'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

// Use with Suspense
<Suspense fallback={<Skeleton />}>
  <Menu />
</Suspense>
```

### Caching Strategy

```typescript
// tRPC query caching
import { httpBatchLink } from '@trpc/client';

const trpcClient = createTRPCReact<AppRouter>({
  links: [
    httpBatchLink({
      url: '/api/trpc',
    }),
  ],
});

// React Query caching (built into tRPC)
// Default: staleTime = 0, gcTime = 5 minutes
// Customize per query:
const { data } = trpc.menu.list.useQuery(undefined, {
  staleTime: 60 * 1000, // 1 minute
  gcTime: 5 * 60 * 1000, // 5 minutes
});
```

### Database Query Optimization

```typescript
// Use indexes (see indexing strategy above)
// Avoid N+1 queries with proper joins
const orders = await db.query.orders.findMany({
  with: {
    orderItems: {
      with: {
        menuItem: true,
      },
    },
  },
  limit: 50,
});

// Bad: N+1 query
const orders = await db.select().from(orders);
for (const order of orders) {
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
}
```

---

## 8. Monitoring & Logging

### Error Tracking

**Options:**
- **Sentry** (recommended) - Free tier, excellent React integration
- **LogRocket** - Session replay + errors
- **GlitchTip** - Open-source Sentry alternative

```typescript
// client/src/main.tsx
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1, // 10% of transactions
});
```

### Application Logging

```typescript
// server/_core/logger.ts
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

// Usage
logger.info('Order created', { orderId: 123 });
logger.error('Payment failed', { error, orderId: 123 });
```

### Health Check Endpoint

```typescript
// server/_core/health.ts
import express from 'express';
import { db } from '../db';

const router = express.Router();

router.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: 'unknown',
  };

  try {
    await db.execute('SELECT 1');
    health.database = 'connected';
  } catch (error) {
    health.database = 'disconnected';
    health.status = 'degraded';
  }

  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
});

export default router;
```

### Uptime Monitoring

**Options:**
- **UptimeRobot** (free, 50 monitors)
- **Pingdom** (paid, more features)
- **Better Stack** (free tier)

Monitor:
- `/health` endpoint
- Homepage load
- Menu page load
- Checkout flow (synthetic monitoring)

---

## Quick Reference

### Essential Environment Variables

```env
# Required
DB_HOST=
DB_USER=
DB_PASSWORD=
DB_NAME=
MPESA_CONSUMER_KEY=
MPESA_CONSUMER_SECRET=
MPESA_SHORTCODE=
MPESA_PASSKEY=
MPESA_CALLBACK_URL=
JWT_SECRET=
NODE_ENV=
PORT=

# Optional
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=
GOOGLE_MAPS_API_KEY=
SENTRY_DSN=
```

### Deployment Checklist

- [ ] Database migrations applied
- [ ] Environment variables set
- [ ] SSL certificate installed
- [ ] M-Pesa callback URL accessible
- [ ] Error tracking configured
- [ ] Health check endpoint working
- [ ] Process manager (PM2) configured
- [ ] Backups scheduled
- [ ] Rate limiting enabled
- [ ] CORS configured correctly
- [ ] Build succeeds without errors
- [ ] Tests pass
- [ ] Production M-Pesa credentials configured
- [ ] Domain DNS configured
- [ ] Nginx reverse proxy configured

---

## Resources

- tRPC Documentation: https://trpc.io
- Drizzle ORM: https://orm.drizzle.team
- Vite: https://vitejs.dev
- Safaricom Daraja: https://developer.safaricom.co.ke
- React 19: https://react.dev
- TailwindCSS: https://tailwindcss.com
- shadcn/ui: https://ui.shadcn.com
