# Thunderbold — Master Technical Documentation

> Production-grade e-commerce PWA for curated Indian streetwear & fashion.
> Stack: React 18 + Vite · Express 5 · MongoDB Atlas · Firebase Auth · Cloudinary · Workbox PWA

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Repository Structure](#2-repository-structure)
3. [Environment & Secrets](#3-environment--secrets)
4. [Frontend Architecture](#4-frontend-architecture)
5. [Backend Architecture](#5-backend-architecture)
6. [Authentication System](#6-authentication-system)
7. [Data Layer — API Reference](#7-data-layer--api-reference)
8. [Order Management System](#8-order-management-system)
9. [Returns System](#9-returns-system)
10. [Cart & Wishlist](#10-cart--wishlist)
11. [Review System](#11-review-system)
12. [Admin Panel & Analytics](#12-admin-panel--analytics)
13. [Push Notifications (FCM)](#13-push-notifications-fcm)
14. [PWA Configuration](#14-pwa-configuration)
15. [Performance Architecture](#15-performance-architecture)
16. [Security Model](#16-security-model)
17. [Deployment](#17-deployment)
18. [Future Roadmap](#18-future-roadmap)

---

## 1. Project Overview

**Thunderbold** is a mobile-first Progressive Web App for a curated Indian fashion brand selling denim, shirts, t-shirts, kurtas, and outfits. It is designed to feel like a native Android app — installable, offline-capable, and fast on low-bandwidth connections.

### Key Characteristics

| Attribute | Value |
|---|---|
| Brand | Thunderbold |
| Domain | thunderbold.shop |
| Support email | support@thunderbold.shop |
| Instagram | @thunderbold.shop |
| Target market | India (INR pricing, 6-digit pincodes, 10-digit phones) |
| Payment model | Cash on Delivery (COD) only |
| Product sections | denim · shirts · t-shirts · kurta · outfits · live-sale |
| PWA install | Yes — Play Store TWA-ready, desktop window-controls-overlay |

---

## 2. Repository Structure

```
thunderbolt-brand-world/
├── api/                        # 12 Vercel serverless handlers
│   ├── _lib/                   # mongodb, firebaseAdmin, fcm, adminHelper, rateLimit, response, validator
│   ├── admin.js                # Analytics + slider/hero config
│   ├── address/index.js        # Legacy addresses collection
│   ├── brands/index.js
│   ├── cart/index.js
│   ├── categories/index.js
│   ├── notifications/index.js
│   ├── orders/index.js
│   ├── products/index.js       # No [id].js — single product fetched client-side
│   ├── returns/index.js
│   ├── reviews/index.js
│   ├── users/index.js
│   └── wishlist/index.js
├── src/
│   ├── App.tsx                 # Provider tree
│   ├── AppContent.tsx          # BrowserRouter + routes + Suspense
│   ├── main.tsx                # Entry + PWA registration + version polling
│   ├── context/                # Auth, Cart, Wishlist, Notifications
│   ├── pages/                  # 16 page components
│   ├── components/             # UI, checkout/, reviews/, auth/, Analytics/, ui/
│   ├── lib/                    # firebase, apiCache, ordersCache, products, pricing, …
│   ├── hooks/
│   └── utils/
├── public/
│   ├── icons/                  # 9 PNG icons (72–512px) + maskable
│   ├── screenshots/            # mobile.png, desktop.png
│   ├── firebase-messaging-sw-part.js
│   ├── offline.html, sitemap.xml, robots.txt
│   └── Thunderbold.apk
├── server.js                   # Express (port 3001)
├── vite.config.ts
├── vercel.json
├── index.html
├── tailwind.config.ts
├── package.json
├── README.md
├── DOCS.md
└── DATABASE.md
```

---

## 3. Environment & Secrets

| Variable | Used By | Required | Description |
|---|---|---|---|
| `MONGO_URI` | `api/_lib/mongodb.js` | **Yes** | MongoDB Atlas connection string |
| `FIREBASE_SERVICE_ACCOUNT` | `api/_lib/firebaseAdmin.js` | **Yes** (for auth + FCM server) | Stringified service account JSON |
| `VITE_FIREBASE_VAPID_KEY` | `src/lib/firebaseMessaging.ts` | For push | FCM Web Push VAPID public key |

**Build-time (automatic):**

| Symbol | Source | Description |
|---|---|---|
| `__APP_VERSION__` | `vite.config.ts` | Build timestamp written to `public/version.json` |
| `import.meta.env.DEV` | Vite | Dev vs production branching |

**Not currently wired (listed in `.env.example` only):**

`VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID` — Firebase client config is hardcoded in `src/lib/firebase.ts`.

---

## 4. Frontend Architecture

### 4.1 Tech Stack

| Library | Version | Role |
|---|---|---|
| React | ^18.3.1 | UI rendering |
| Vite + @vitejs/plugin-react | ^5.4.21 / ^4.7.0 | Build toolchain |
| Tailwind CSS | ^3.4.19 | Utility-first styling |
| TanStack Query | ^5.101.0 | Server state |
| React Router DOM | ^6.30.4 | Client-side routing |
| Framer Motion | ^12.40.0 | Animations |
| GSAP | ^3.15.0 | Splash screen timeline |
| Recharts | ^2.15.4 | Admin analytics charts |
| Embla Carousel | ^8.6.0 | Product image carousel |
| Lucide React | ^0.462.0 | Icons |
| Sonner | ^1.7.4 | Toasts |
| vite-plugin-pwa | ^1.3.0 | Workbox SW generation |

### 4.2 Provider Tree

```
AuthProvider
  NotificationsProvider
    CartProvider
      WishlistProvider
        QueryClientProvider     (staleTime: 30s, refetchOnWindowFocus: true)
          TooltipProvider
            AppContent
```

`BrowserRouter` lives inside `AppContent.tsx`, not `App.tsx`.

### 4.3 Routing & Lazy Loading

| Path | Component | Strategy |
|---|---|---|
| `/` | `Index` | Eager |
| `/about` | `About` | Eager |
| `/category/:categoryId` | `CategoryView` | Eager |
| `/brands` | `BrandsPage` | Eager |
| `/brand/:brandId` | `BrandView` | Eager |
| `/product/:productId` | `ProductView` | Lazy |
| `/cart` | `Cart` | Lazy |
| `/checkout` | `Checkout` | Lazy |
| `/orders` | `Orders` | Lazy |
| `/wishlist` | `Wishlist` | Lazy |
| `/profile` | `Profile` | Lazy |
| `/admin` | `Admin` | Lazy |
| `/deals/:dealKey` | `DealsPage` | Lazy |
| `/policies` | `Policies` | Lazy |
| `*` | `NotFound` | Eager |

Deal keys: `under-999` (maxPrice 999), `under-699` (maxPrice 699).

### 4.4 Global UI Components (AppContent)

- `SplashScreen` — once per session
- `AnnouncementBar` — top ticker
- `BottomNav` — mobile navigation
- `ScrollToTop` — scroll restoration via sessionStorage
- `LoginModal` — auth overlay
- `PWAUpdatePrompt` — offline-ready / update toasts
- `AppUpdatePrompt` — native app store update nudge
- `NotificationPermissionPrompt` — FCM permission (3s after first login)

Customer-facing pages include `Navbar`, `Footer`, `CustomCursor`, `ScrollProgress` individually.

### 4.5 State Management

**Server state** — TanStack Query for products, orders, categories, brands, reviews, analytics.

**Client state** — Cart/wishlist contexts with localStorage fallback and MongoDB sync on auth.

**Orders cache** — Module-level cache in `src/lib/ordersCache.ts` keyed by Firebase UID; prefetched on login via `requestIdleCallback`.

### 4.6 Login Modal System

| Source | Trigger |
|---|---|
| `requireAuth` | Add to cart/wishlist/checkout while logged out |
| `delayedPrompt` | 10s timer, once per session |
| `manual` | Sign-in button click |

### 4.7 Single Product Fetch Pattern

`src/lib/products.ts`:

```typescript
export async function fetchProductById(id: string): Promise<Product | null> {
  const data = await fetchProducts(); // GET /api/products
  return data.products.find(p => p._id === id) || null;
}
```

There is no backend endpoint for a single product by ID.

---

## 5. Backend Architecture

### 5.1 Server

`server.js` — Express on **port 3001**. Vite dev server on **port 5000** proxies `/api/*`.

Production: each `api/**/*.js` file becomes a Vercel serverless function. Sub-routes resolved via URL path parsing or `?subpath=` query (see `vercel.json` rewrites).

### 5.2 Handler Inventory (12 functions)

| File | Routes |
|---|---|
| `admin.js` | `/api/admin/analytics`, `/api/slider`, `/api/slider?type=hero` |
| `address/index.js` | `/api/address` |
| `brands/index.js` | `/api/brands` |
| `cart/index.js` | `/api/cart` |
| `categories/index.js` | `/api/categories` |
| `notifications/index.js` | `/api/notifications/broadcast`, `/api/notifications/test-send` |
| `orders/index.js` | `/api/orders`, `/api/orders/create`, `/api/orders/cancel`, `/api/orders/manage` |
| `products/index.js` | `/api/products` |
| `returns/index.js` | `/api/returns` |
| `reviews/index.js` | `/api/reviews` |
| `users/index.js` | `/api/users`, `/api/users/fcm-token` |
| `wishlist/index.js` | `/api/wishlist` |

### 5.3 MongoDB Connection

- Database: `thunderbold`
- Pool: `minPoolSize: 2`, `maxPoolSize: 10`, `serverSelectionTimeoutMS: 5000`
- Cached in `global.mongo` for serverless warm starts
- **10 collections** — see `DATABASE.md`

### 5.4 Index Bootstrap

Created asynchronously on first connection in `api/_lib/mongodb.js` — see DATABASE.md §3.

---

## 6. Authentication System

### 6.1 Client

Firebase Auth with Google OAuth and Email/Password. `getFirebaseAuth()` lazy-init. Google redirect handled via `getRedirectResult()` before `onAuthStateChanged`.

On login: `POST /api/users` with `{ uid, email, name }` (no auth token required for sync).

### 6.2 Server Verification Matrix

| Endpoint group | Verification method |
|---|---|
| Orders, returns, cart, wishlist, reviews (write), notifications, FCM, admin, products (admin write) | `verifyFirebaseToken()` — full crypto + revocation |
| Users GET/PATCH/DELETE (profile) | `jwt.decode()` — **decode only, no signature check** |
| Users POST sync | Open (uid+email+name body) |
| Products GET | Public; optional admin Bearer for `purchasePrice` |
| Categories/brands/slider GET | Public |
| Legacy `/api/address` | **No auth** |

### 6.3 Admin Resolution

1. `users.role === 'admin'` in MongoDB
2. Fallback: email in `ADMIN_EMAILS` array in `adminHelper.js`

### 6.4 Identity Keys

| Domain | Key |
|---|---|
| orders, cart, wishlist, returns, reviews | `email` as `userId` |
| users profile CRUD | Firebase `uid` |
| FCM token storage | keyed on `email` |

---

## 7. Data Layer — API Reference

### Products

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/products` | Public | All products; `?section=`, `?maxPrice=` filters |
| POST | `/api/products` | Admin | Create |
| PUT | `/api/products?id=:id` | Admin | Full replace |
| DELETE | `/api/products?id=:id` | Admin | Hard delete |

Admin GET with Bearer token includes `purchasePrice`. Public responses strip it (with MRP fallback from legacy data).

### Orders

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/orders` | User/Admin | User: paginated (10/page, `?page=`). Admin: all. |
| POST | `/api/orders/create` | User | Create + stock decrement + FCM |
| PUT | `/api/orders/cancel` | User/Admin | Cancel + stock restore |
| PATCH | `/api/orders/manage?id=:id` | Admin | Status update + FCM |
| DELETE | `/api/orders/manage?id=:id` | Admin | Delete record |

### Returns

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/returns` | User/Admin | List returns |
| POST | `/api/returns` | User | Create (`orderId`, `reason`, `description`, `upiId`) |
| PATCH | `/api/returns?id=:id` | Admin | `{ action: approve\|reject\|issue_refund, refundAmount?, shippingCharges?, adminNotes? }` |

### Users

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/users` | User | Profile by uid |
| POST | `/api/users` | Open/User | Sync on login OR add address |
| PATCH | `/api/users` | User | Update profile or set default address |
| DELETE | `/api/users` | User | Remove address by `{ id }` |
| POST | `/api/users/fcm-token` | User | Register `{ token, deviceId }` |
| DELETE | `/api/users/fcm-token` | User | Remove token |

### Cart / Wishlist

| Method | Path | Auth | Rate Limited |
|---|---|---|---|
| GET/POST/DELETE | `/api/cart` | User | Yes (all methods) |
| GET/POST/DELETE | `/api/wishlist` | User | Yes (all methods) |

### Reviews

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/reviews?productId=:id` | Public | Product reviews |
| GET | `/api/reviews?mine=true` | User | User's reviews |
| GET | `/api/reviews?mine=true&productId=:id` | User | Review + eligibility |
| POST | `/api/reviews` | User | Create (rate limited) |
| PUT | `/api/reviews?id=:id` | User | Edit own |
| DELETE | `/api/reviews?id=:id` | User/Admin | Soft delete |

### Categories / Brands

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/categories` | Public | Cache 120s |
| POST/PUT/DELETE | `/api/categories` | Admin | PUT/DELETE use `?id=` |
| GET | `/api/brands` | Public | Cache 120s; sorted by name |
| POST/PUT/DELETE | `/api/brands` | Admin | Body field: `logoUrl` (not `image`) |

### Slider / Hero / Analytics / Notifications

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/slider` | Public | 4-slot ThunderboltSlider config |
| PUT | `/api/slider` | Admin | Update slider |
| GET | `/api/slider?type=hero` | Public | Hero banner URLs |
| PUT | `/api/slider?type=hero` | Admin | Update hero (1–3 images) |
| GET | `/api/admin/analytics` | Admin | Dashboard data |
| POST | `/api/notifications/broadcast` | Admin | `{ title, body, imageUrl? }` |
| POST | `/api/notifications/test-send` | User | Test push to self |

### Legacy Address

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/address?userId=` | None | Last address from `addresses` collection |
| POST | `/api/address` | None | Insert to `addresses` collection |

---

## 8. Order Management System

### 8.1 Status Values

| Status | Set by |
|---|---|
| `pending` | Order creation |
| `confirmed` | Admin PATCH |
| `packed` | Admin PATCH |
| `shipped` | Admin PATCH |
| `delivered` | Admin PATCH |
| `cancelled` | Cancel endpoint |
| `return_requested` | Return POST |
| `return_approved` | Return PATCH approve |
| `return_rejected` | Return PATCH reject |
| `refund_issued` | Return PATCH issue_refund |

### 8.2 Lifecycle Diagram

```
pending → confirmed → packed → shipped → delivered
    └──────────────────────────→ cancelled

delivered → return_requested → return_approved → refund_issued
                            └→ return_rejected
```

### 8.3 Cancellation Rules

- **Customer:** only `pending` orders
- **Admin:** any order except `delivered`, `return_requested`, `return_approved`, `return_rejected`

### 8.4 FCM on Status Change

Admin PATCH fires push for: `confirmed`, `packed`, `shipped`, `delivered`, `cancelled`. Order creation fires "Order Received ⚡".

---

## 9. Returns System

### 9.1 Return Document Status

```
pending → approved → refund_issued
        → rejected
```

### 9.2 Required Fields (POST)

- `orderId` — must reference a `delivered` order owned by caller
- `reason` — enum
- `description` — 10–500 chars
- `upiId` — validated format (`localpart@provider`)

### 9.3 Refund Calculation

Default: `refundAmount = max(0, totalAmount − shippingCharges)` with default shipping ₹50. Admin overrides on approve.

On approve: stock restored (outfit-aware); `returnShippingCharges`, `returnRefundAmount`, `adminNotes` written to order document.

---

## 10. Cart & Wishlist

Identical sync pattern. Cart items require `productId`, `name`, `price`, `image`, `size`, `quantity`. Wishlist omits `size` and `quantity`.

POST replaces entire `items[]` array. Unique index on `{ userId: 1 }` for both collections.

---

## 11. Review System

Eligibility: `orders.findOne({ userId, status: 'delivered', 'products.productId': productId })`.

One active review per user+product. Rating 1–5 integer. Comment max 1000 chars. Soft delete sets `isDeleted: true`.

---

## 12. Admin Panel & Analytics

### 12.1 Tabs

`analytics` · `orders` · `products` · `categories` · `brands` · `reviews` · `slider` · `notifications` · `returns`

### 12.2 Polling

15-second silent refresh for active tab data. Slider tab: `fetchSliderConfig` only on non-silent (manual) refresh to avoid overwriting unsaved slider/hero edits.

### 12.3 Analytics Query Params

| Param | Effect |
|---|---|
| `?range=7d` | Last 7 days |
| `?range=30d` | Last 30 days |
| `?month=YYYY-MM` | Specific calendar month |
| (default) | Current calendar month |

### 12.4 Revenue Exclusions

Statuses excluded from revenue: `cancelled`, `canceled`, `refunded`, `return_requested`, `return_approved`, `refund_issued`.

Profit: only `delivered` and `completed` orders; items without `purchasePrice` excluded.

---

## 13. Push Notifications (FCM)

### 13.1 Architecture

```
NotificationsContext
  ├── deviceId in localStorage
  ├── requestAndRegisterToken() → POST /api/users/fcm-token
  ├── onMessage() → Sonner toast (foreground)
  └── Auto-register if permission already granted

firebase-messaging-sw-part.js (in Workbox SW)
  └── onBackgroundMessage() → browser-native notification rendering

api/_lib/fcm.js
  ├── sendToUser() — order notifications
  └── sendMulticast() — admin broadcast (500/batch)
```

### 13.2 Service Worker Coordination

Production: FCM token registered against main Workbox SW (`navigator.serviceWorker.ready`).

Development: falls back to `/firebase-messaging-sw.js`.

On startup, `main.tsx` unregisters any SW not ending in `/sw.js` to prevent duplicates.

### 13.3 Token Lifecycle

- POST registers token with `deviceId`
- DELETE removes token on logout (if implemented client-side)
- Stale tokens pruned server-side on FCM send failure

### 13.4 Notification Payload

Web Push includes icon `/icons/icon-192x192.png`, badge `/favicon.svg`, vibrate `[200,100,200]`, TTL 4 weeks, high urgency. Order notifications link to `/orders?orderId=...`.

---

## 14. PWA Configuration

Configured in `vite.config.ts` via `vite-plugin-pwa`.

| Setting | Value |
|---|---|
| `strategies` | `generateSW` |
| `registerType` | `autoUpdate` |
| `injectRegister` | `null` (manual in main.tsx) |
| `skipWaiting` | `true` |
| `clientsClaim` | `true` |
| `devOptions.enabled` | `false` |
| `navigateFallback` | `/index.html` |
| `navigateFallbackDenylist` | `/^\/api\//`, `/^\/sw\.js$/` |
| `importScripts` | `['/firebase-messaging-sw-part.js']` |
| `cleanupOutdatedCaches` | `true` |

### Runtime Caching

| Pattern | Handler | Cache | TTL / Cap |
|---|---|---|---|
| `/api/*` | NetworkOnly | — | Never |
| Google Fonts CSS | StaleWhileRevalidate | `tb-google-fonts-css` | 7d / 8 |
| Google Fonts files | CacheFirst | `tb-google-fonts-files` | 365d / 30 |
| Cloudinary | CacheFirst | `tb-cloudinary-images` | 30d / 120 |
| Local images | CacheFirst | `tb-static-images` | 30d / 60 |

### Manifest Highlights

- `theme_color` / `background_color`: `#080808`
- Screenshots: `mobile.png` (540×960), `desktop.png` (1280×800)
- `related_applications`: Play Store TWA entries with SHA-256 fingerprints

---

## 15. Performance Architecture

### 15.1 Code Splitting

Lazy pages become separate Rollup chunks. Manual chunks: `vendor`, `firebase`, `motion`. Lucide is excluded from `optimizeDeps` pre-bundle.

### 15.2 apiCache.ts

60-second TTL + in-flight deduplication. Export: `cachedFetch()`, `invalidateCache()`.

Used by: `ThunderboldSlider`, `CategoriesSection`, `LiveSaleSection`.

### 15.3 ordersCache.ts

Module-level cache keyed by Firebase UID. `schedulePrefetchOrders()` fires on login via `requestIdleCallback` (800ms fallback).

### 15.4 Version Detection

`vite.config.ts` writes `public/version.json` at build. `main.tsx` polls every 60s and on tab focus; triggers SW update when version differs from `__APP_VERSION__`.

### 15.5 Compositor Animations

Carousel dots in ThunderboldSlider, HeroBanner, PromoSlider use `transform: scaleX()` + `opacity` instead of width/color transitions.

### 15.6 LCP Optimisation

HeroBanner active slide uses `fetchPriority="high"` and `decoding="sync"`.

---

## 16. Security Model

### 16.1 Headers (server.js)

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Cross-Origin-Resource-Policy: cross-origin
```

**Missing:** CSP, HSTS, Permissions-Policy. CORS: `Access-Control-Allow-Origin: *` on all API handlers.

### 16.2 Rate Limiting

10 requests/minute/IP on: `POST /api/orders/create`, `POST /api/reviews`, all `/api/cart` methods, all `/api/wishlist` methods.

In-memory Map — not suitable for multi-instance production without Redis.

### 16.3 Privilege Isolation

- `purchasePrice` admin-only
- Order cancel ownership check
- Return ownership + delivered-only check
- Review ownership on edit/delete
- Admin verified per request

### 16.4 Known Security Gaps

- Users profile routes use `jwt.decode` without verification
- Legacy `/api/address` has no authentication
- Wide-open CORS (`*`)
- No CSP header

---

## 17. Deployment

### Development

```bash
npm run dev   # server.js :3001 + vite :5000
```

### Production (Vercel)

- Static: `dist/`
- API: `api/` serverless functions
- `vercel.json` rewrites + cache headers (see README §24)

### Node.js

Use Node 20.x on Vercel.

---

## 18. Future Roadmap

| Feature | Status | Notes |
|---|---|---|
| Redis rate limiting | Not implemented | Required for multi-instance production |
| Payment gateway | Not implemented | Razorpay/PhonePe + webhook + `paymentStatus` on orders |
| Email receipts | Not implemented | Resend/SendGrid order confirmations |
| Product search | Not implemented | MongoDB Atlas Search or dedicated search service |
| Single-product API | Not implemented | Would reduce catalogue payload on product pages |
| Discount / coupon codes | Not implemented | Coupon collection + redemption tracking |
| Env-driven Firebase config | Not implemented | Currently hardcoded in `firebase.ts` |
| Users API token verification | Partial | Profile routes should use `verifyFirebaseToken()` |
| PostgreSQL migration | Planned | See DATABASE.md §7 |
| Low-stock admin alerts | Not implemented | Webhook or push when stock ≤ threshold |
| Real-time order tracking | Not implemented | WebSocket/SSE from admin status updates |

> Push notifications, returns system, reviews, admin analytics, and PWA install are **fully implemented** — documented in §12–§14 above, not listed as future work.

---

*Thunderbold — Premium Indian Fashion. Built for the Bold.*

> Last updated: July 19, 2026
