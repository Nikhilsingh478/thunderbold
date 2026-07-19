# Thunderbold — Production-Grade Premium Fashion E-Commerce PWA

A full-stack, installable Progressive Web App for a curated Indian streetwear brand. React 18 + Vite frontend, Express/MongoDB backend, Firebase Auth, Firebase Cloud Messaging, and a Workbox service worker.

> **Brand:** Thunderbold · **Market:** India · **Domain:** thunderbold.shop · **Payment:** Cash on Delivery only

---

## Table of Contents

1. [Tech Stack](#1-tech-stack)
2. [Architecture Overview](#2-architecture-overview)
3. [Environment Setup](#3-environment-setup)
4. [Running the App](#4-running-the-app)
5. [Project Structure](#5-project-structure)
6. [Frontend Architecture](#6-frontend-architecture)
7. [Backend Architecture](#7-backend-architecture)
8. [Authentication System](#8-authentication-system)
9. [API Reference](#9-api-reference)
10. [Order Management System](#10-order-management-system)
11. [Returns System](#11-returns-system)
12. [Cart & Wishlist](#12-cart--wishlist)
13. [Review System](#13-review-system)
14. [Admin Panel & Analytics](#14-admin-panel--analytics)
15. [Push Notifications (FCM)](#15-push-notifications-fcm)
16. [Performance Architecture](#16-performance-architecture)
17. [Security Model](#17-security-model)
18. [PWA Architecture](#18-pwa-architecture)
19. [Service Worker & Caching](#19-service-worker--caching)
20. [Web App Manifest](#20-web-app-manifest)
21. [App Capabilities](#21-app-capabilities)
22. [Update Lifecycle](#22-update-lifecycle)
23. [Icons & Splash Screen](#23-icons--splash-screen)
24. [Deployment — Vercel](#24-deployment--vercel)
25. [TWA / Play Store Readiness](#25-twa--play-store-readiness)
26. [Database Schema Summary](#26-database-schema-summary)
27. [Pricing System](#27-pricing-system)
28. [Known Limitations](#28-known-limitations)
29. [Edge Cases Handled](#29-edge-cases-handled)
30. [Troubleshooting](#30-troubleshooting)

---

## 1. Tech Stack

| Layer | Technology | Version (package.json) |
|---|---|---|
| Frontend | React, TypeScript, Vite, Tailwind CSS | react ^18.3.1, vite ^5.4.21, tailwindcss ^3.4.19 |
| Routing | React Router | react-router-dom ^6.30.4 |
| Server State | TanStack Query | @tanstack/react-query ^5.101.0 |
| Animations | Framer Motion, GSAP | framer-motion ^12.40.0, gsap ^3.15.0 |
| Charts | Recharts | recharts ^2.15.4 |
| Carousel | Embla Carousel | embla-carousel-react ^8.6.0 |
| Icons | Lucide React | lucide-react ^0.462.0 |
| Toasts | Sonner | sonner ^1.7.4 |
| UI Primitives | Radix UI + shadcn/ui patterns | Multiple @radix-ui/* packages |
| Forms | React Hook Form + Zod | react-hook-form ^7.79.0, zod ^3.25.76 |
| Authentication | Firebase Authentication (Google OAuth + Email/Password) | firebase ^10.14.1 |
| Push Notifications | Firebase Cloud Messaging (FCM) | firebase ^10.14.1, firebase-admin ^13.10.0 |
| Database | MongoDB Atlas (Native Node.js Driver) | mongodb ^6.21.0 |
| Backend | Node.js + Express 5 (dev); Vercel Serverless Functions (prod) | express ^5.2.1 |
| Media CDN | Cloudinary (URL transforms client-side) | — |
| PWA | vite-plugin-pwa + Workbox `generateSW` | vite-plugin-pwa ^1.3.0, workbox-* ^7.4.1 |
| Build | Vite with manual chunk splitting | @vitejs/plugin-react ^4.7.0 |

> `helmet` is listed in `package.json` but is **not** used — `server.js` sets security headers manually.

---

## 2. Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                          Browser                              │
│  React 18 SPA (Vite dev server, port 5000)                    │
│  ├── React Router v6 (client-side routing)                    │
│  ├── TanStack Query (server state / caching)                  │
│  ├── Framer Motion + GSAP (animations)                        │
│  ├── Firebase Auth SDK (lazy getFirebaseAuth() — off critical path) │
│  ├── Firebase Messaging SDK (FCM push notifications)          │
│  └── Service Worker (Workbox — offline + asset caching)       │
└───────────────────────────┬──────────────────────────────────┘
                            │  /api/* (proxied in dev via Vite)
┌───────────────────────────▼──────────────────────────────────┐
│              Express API Server (port 3001)                   │
│  api/*.js — same files deployed as Vercel Serverless Fns      │
│  ├── Firebase Admin SDK (cryptographic token verification)    │
│  ├── MongoDB Atlas (getDb() singleton connection pool)        │
│  ├── FCM sendToUser / sendMulticast (order + broadcast pushes) │
│  └── In-memory rate limiter (10 req/min per IP)               │
└──────────────────────────────────────────────────────────────┘
```

**Key design decisions:**

- Frontend uses only relative `/api/...` URLs — no environment-specific URL switching needed
- Twelve serverless handler files in `api/` stay within Vercel Hobby's 12-function limit via consolidated sub-route patterns
- `purchasePrice` (internal cost) is stripped from non-admin product API responses
- Email (not Firebase UID) is used as `userId` across orders, cart, wishlist, and reviews — stable across account re-linking
- There is **no** dedicated `GET /api/products/:id` endpoint — single-product pages fetch the full catalogue client-side via `src/lib/products.ts`

---

## 3. Environment Setup

Set these as environment variables locally or in your deployment platform. **Never commit secrets.**

| Variable | Used By | Description |
|---|---|---|
| `MONGO_URI` | `api/_lib/mongodb.js` | MongoDB Atlas connection string |
| `FIREBASE_SERVICE_ACCOUNT` | `api/_lib/firebaseAdmin.js` | Stringified Firebase service account JSON (server-only) |
| `VITE_FIREBASE_VAPID_KEY` | `src/lib/firebaseMessaging.ts` | FCM Web Push VAPID public key — required for push token registration |

**Firebase client SDK config** is currently **hardcoded** in `src/lib/firebase.ts` and `public/firebase-messaging-sw-part.js`, not read from `VITE_FIREBASE_*` variables. The `.env.example` file lists additional `VITE_FIREBASE_*` keys for reference if you migrate to env-driven config.

| Variable | Status |
|---|---|
| `VITE_FIREBASE_API_KEY` | Listed in `.env.example` — not wired in `firebase.ts` |
| `VITE_FIREBASE_AUTH_DOMAIN` | Listed in `.env.example` — not wired in `firebase.ts` |
| `VITE_FIREBASE_PROJECT_ID` | Listed in `.env.example` — not wired in `firebase.ts` |
| `VITE_FIREBASE_STORAGE_BUCKET` | Listed in `.env.example` — not wired in `firebase.ts` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Listed in `.env.example` — not wired in `firebase.ts` |
| `VITE_FIREBASE_APP_ID` | Listed in `.env.example` — not wired in `firebase.ts` |

> `FIREBASE_SERVICE_ACCOUNT` and `MONGO_URI` are **server-only** and must **never** carry the `VITE_` prefix.

Without `MONGO_URI`, all data endpoints return `500 Database unavailable` — no silent fallbacks.

Without `VITE_FIREBASE_VAPID_KEY`, the app works fully but FCM token registration silently skips.

---

## 4. Running the App

```bash
npm run dev        # Concurrently: node server.js (:3001) + vite (:5000)
npm run build      # Production build — generates dist/sw.js + manifest + public/version.json
npm run preview    # Preview production build locally
```

The service worker is **only active in production builds** (`npm run build`). During development, `devOptions.enabled: false` keeps Vite HMR and the API proxy working cleanly.

---

## 5. Project Structure

```
thunderbolt-brand-world/
├── api/                              # Express / Vercel Serverless handlers (12 functions)
│   ├── _lib/
│   │   ├── mongodb.js                # Singleton pool + index bootstrap
│   │   ├── firebaseAdmin.js          # Token verification + Admin Messaging
│   │   ├── fcm.js                    # sendToUser() + sendMulticast()
│   │   ├── adminHelper.js            # isAdmin() — DB role + hardcoded allowlist
│   │   ├── rateLimit.js              # In-memory sliding-window rate limiter
│   │   ├── response.js               # Standardised JSON response helpers
│   │   └── validator.js              # Address / phone / pincode validators
│   ├── admin.js                      # Analytics + slider/hero config (subpath routing)
│   ├── address/index.js              # Legacy standalone addresses collection
│   ├── brands/index.js
│   ├── cart/index.js
│   ├── categories/index.js
│   ├── notifications/index.js        # Broadcast + test-send
│   ├── orders/index.js               # Orders CRUD + atomic stock management
│   ├── products/index.js             # Product catalogue (no [id].js file)
│   ├── returns/index.js
│   ├── reviews/index.js
│   ├── users/index.js                # Profile, addresses, FCM tokens
│   └── wishlist/index.js
│
├── src/
│   ├── App.tsx                       # Root provider tree
│   ├── AppContent.tsx                # BrowserRouter + routes + Suspense
│   ├── main.tsx                      # Vite entry + PWA SW registration + version polling
│   ├── context/
│   │   ├── AuthContext.tsx
│   │   ├── CartContext.tsx
│   │   ├── WishlistContext.tsx
│   │   └── NotificationsContext.tsx
│   ├── pages/                        # 16 route-level pages (see §6.2)
│   ├── components/                 # Shared UI (Navbar, Footer, checkout/, reviews/, auth/, Analytics/, ui/, …)
│   ├── lib/                          # firebase, apiCache, ordersCache, pricing, cloudinary, …
│   ├── hooks/                        # useSEO, etc.
│   └── utils/
│
├── public/
│   ├── icons/                        # 9 PWA icons (72–512px) + maskable variant
│   ├── screenshots/                  # mobile.png, desktop.png (+ legacy .svg files)
│   ├── banners/                      # Deal page banner assets
│   ├── .well-known/assetlinks.json   # TWA Digital Asset Links
│   ├── firebase-messaging-sw-part.js # FCM handler injected into Workbox SW
│   ├── firebase-messaging-sw.js      # Dev-only FCM fallback SW
│   ├── offline.html
│   ├── sitemap.xml
│   ├── robots.txt
│   ├── Thunderbold.apk               # Sideload APK
│   └── version.json                  # Generated at build time by vite.config.ts
│
├── server.js                         # Express server (port 3001)
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

## 6. Frontend Architecture

### 6.1 Provider Tree

```
<AuthProvider>
  <NotificationsProvider>
    <CartProvider>
      <WishlistProvider>
        <QueryClientProvider>       ← TanStack Query (30s staleTime)
          <TooltipProvider>
            <AppContent />          ← BrowserRouter + routes + modals
          </TooltipProvider>
        </QueryClientProvider>
      </WishlistProvider>
    </CartProvider>
  </NotificationsProvider>
</AuthProvider>
```

### 6.2 Routing & Code Splitting

Routes are defined in `src/AppContent.tsx`. A branded `<PageLoader />` is shown via `<Suspense>` while lazy chunks download.

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
| `/deals/:dealKey` | `DealsPage` | Lazy (`under-999`, `under-699`) |
| `/policies` | `Policies` | Lazy (accordion — no slug param) |
| `*` | `NotFound` | Eager |

### 6.3 State Management

**Server state** — TanStack Query (`useQuery` / `useMutation`) with 30-second default `staleTime`, refetch on window focus, reconnect, and mount.

**Client state** — Cart and wishlist use `useReducer` in context providers. Both read from `localStorage` on mount, sync to MongoDB when authenticated, and merge on login (deduplicated by `productId + size`).

**Auth state** — Firebase `onAuthStateChanged` in `AuthContext`. On login, `POST /api/users` upserts the MongoDB user record. Orders are prefetched via `schedulePrefetchOrders()` in `src/lib/ordersCache.ts`.

### 6.4 Login Modal System

`src/lib/modalController.ts` event bus triggers the login modal from anywhere:

| Source | Condition |
|---|---|
| `requireAuth` | Protected action while unauthenticated |
| `delayedPrompt` | 10 seconds after page load, once per session |
| `manual` | User clicks sign-in |

After login, `executeStoredAction()` in `src/lib/requireAuth.ts` re-runs any pending action.

### 6.5 Firebase Auth — Lazy Initialisation

`getFirebaseAuth()` in `src/lib/firebase.ts` defers `getAuth()` until first call, keeping the Auth iframe off the critical render path.

---

## 7. Backend Architecture

### 7.1 Express Server (`server.js`)

Runs on **port 3001**. Each route dynamically imports its handler on first request.

In development, Vite on **port 5000** proxies `/api/*` to `localhost:3001`.

### 7.2 Shared Library Modules

| Module | Purpose |
|---|---|
| `mongodb.js` | Singleton pool (`maxPoolSize: 10`, `minPoolSize: 2`); database `thunderbold`; async index bootstrap |
| `firebaseAdmin.js` | `verifyFirebaseToken()` with revocation check; `getAdminMessaging()` |
| `fcm.js` | `sendToUser()` per-user push; `sendMulticast()` batched broadcast (500 tokens/batch) |
| `adminHelper.js` | `isAdmin()` — DB `role: 'admin'` first, then `ADMIN_EMAILS` allowlist |
| `rateLimit.js` | In-memory 10 req/min per IP; stale entries purged every 5 minutes |
| `validator.js` | `validateAddress()`, `validatePhone()`, `validatePincode()`, `validateOrder()` |
| `response.js` | `successResponse()`, `errorResponse()`, etc. |

### 7.3 Cache-Control Headers

Applied in `server.js` and within handlers for public GET routes:

| Route | Cache-Control |
|---|---|
| `/api/products` | `public, s-maxage=60, stale-while-revalidate=300` (skipped for admin requests) |
| `/api/categories` | `public, s-maxage=120, stale-while-revalidate=600` |
| `/api/brands` | `public, s-maxage=120, stale-while-revalidate=600` |
| `/api/slider` | `public, s-maxage=60, stale-while-revalidate=300` |

Auth-sensitive routes (orders, cart, wishlist, users, returns, reviews) have no cache headers.

---

## 8. Authentication System

### 8.1 Client-Side

Supported methods: Google OAuth (`signInWithPopup` / redirect fallback) and Email+Password. Persistence: `browserLocalPersistence`.

### 8.2 Server-Side Token Verification

Most protected endpoints use `verifyFirebaseToken()` (cryptographic verification with revocation checking).

**Exception:** `GET`, `PATCH`, and `DELETE` on `/api/users` (non-FCM routes) decode the JWT with `jwt.decode()` without signature verification. FCM token routes use full `verifyFirebaseToken()`.

### 8.3 Admin Access

`isAdmin(email, db)` checks DB role first, then hardcoded `ADMIN_EMAILS` in `api/_lib/adminHelper.js`. Verified on every admin request — no session caching.

### 8.4 User Identity

Cart, wishlist, orders, returns, and reviews use **email** as `userId`. Profile CRUD uses Firebase **uid** as the lookup key on the `users` collection.

---

## 9. API Reference

All endpoints accept and return JSON unless noted. Protected endpoints require `Authorization: Bearer <firebase-id-token>`.

### Products

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/products` | Public | All products; `?section=` and `?maxPrice=` filters. Admin Bearer token includes `purchasePrice`. |
| `POST` | `/api/products` | Admin | Create product |
| `PUT` | `/api/products?id=:id` | Admin | Full replace |
| `DELETE` | `/api/products?id=:id` | Admin | Hard delete |

> No `GET /api/products/:id` exists. `ProductView` calls `fetchProductById()` which fetches `/api/products` and filters client-side.

### Orders

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/orders` | User/Admin | User: paginated own orders (`?page=`, 10/page). Admin: all orders. |
| `POST` | `/api/orders/create` | User | Create order + atomic stock decrement + FCM confirmation |
| `PUT` | `/api/orders/cancel` | User/Admin | Cancel + restore stock |
| `PATCH` | `/api/orders/manage?id=:id` | Admin | Update status (triggers FCM on key transitions) |
| `DELETE` | `/api/orders/manage?id=:id` | Admin | Delete order record |

### Returns

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/returns` | User/Admin | Own requests; admin sees all |
| `POST` | `/api/returns` | User | Submit return (delivered orders only; requires `upiId`) |
| `PATCH` | `/api/returns?id=:id` | Admin | `approve` / `reject` / `issue_refund` |

### Users

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/users` | User | Fetch profile by Firebase UID (`jwt.decode`) |
| `POST` | `/api/users` | Open / User | `{ uid, email, name }` upsert on login (open); or add address (auth) |
| `PATCH` | `/api/users` | User | Update name/phone or `action: set_default_address` |
| `DELETE` | `/api/users` | User | Remove address from embedded `addresses[]` |
| `POST` | `/api/users/fcm-token` | User | Register FCM token + deviceId |
| `DELETE` | `/api/users/fcm-token` | User | Remove FCM token |

### Cart / Wishlist

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/cart` | User | Fetch cart items |
| `POST` | `/api/cart` | User | Replace entire cart |
| `DELETE` | `/api/cart` | User | Clear cart |
| `GET` | `/api/wishlist` | User | Fetch wishlist |
| `POST` | `/api/wishlist` | User | Replace entire wishlist |
| `DELETE` | `/api/wishlist` | User | Clear wishlist |

> Rate limiting on cart/wishlist applies to **all methods** including GET (see Known Limitations).

### Reviews

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/reviews?productId=:id` | Public | Active reviews for product |
| `GET` | `/api/reviews?mine=true` | User | User's reviews |
| `GET` | `/api/reviews?mine=true&productId=:id` | User | Own review + eligibility flag |
| `POST` | `/api/reviews` | User | Submit (requires delivered order) |
| `PUT` | `/api/reviews?id=:id` | User | Edit own review |
| `DELETE` | `/api/reviews?id=:id` | User/Admin | Soft-delete |

### Catalogue & Content

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/categories` | Public | List categories |
| `POST/PUT/DELETE` | `/api/categories` | Admin | Manage (`?id=` for PUT/DELETE) |
| `GET` | `/api/brands` | Public | List brands |
| `POST/PUT/DELETE` | `/api/brands` | Admin | Manage (`?id=` for PUT/DELETE; body uses `logoUrl`) |
| `GET` | `/api/slider` | Public | ThunderboltSlider 4-slot config |
| `PUT` | `/api/slider` | Admin | Update slider config |
| `GET` | `/api/slider?type=hero` | Public | Hero banner image URLs |
| `PUT` | `/api/slider?type=hero` | Admin | Update hero banner (1–3 images) |

### Admin & Notifications

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/admin/analytics` | Admin | Analytics dashboard (`?range=7d\|30d`, `?month=YYYY-MM`) |
| `POST` | `/api/notifications/broadcast` | Admin | Push to all users with FCM tokens |
| `POST` | `/api/notifications/test-send` | User | Test push to own devices |

### Legacy

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/address?userId=` | **None** | Legacy standalone `addresses` collection |
| `POST` | `/api/address` | **None** | Save address to legacy collection |

---

## 10. Order Management System

### 10.1 Order Status Lifecycle

```
pending → confirmed → packed → shipped → delivered
    └──────────────────────────→ cancelled
delivered → return_requested → return_approved → refund_issued
                            └→ return_rejected
```

Valid admin PATCH statuses (`/api/orders/manage`): `pending`, `confirmed`, `packed`, `shipped`, `delivered`, `cancelled`, `return_requested`, `return_approved`, `return_rejected`.

**Customer cancellation:** only while `status === "pending"`. Admins can cancel non-delivered, non-return orders.

### 10.2 Order Creation (`POST /api/orders/create`)

1. Rate limit (10/min/IP)
2. Auth → bind `email` as `userId`
3. Idempotency via `clientOrderId` (sparse unique index)
4. Validate products array + address + payment method
5. Pre-flight stock check (outfit-aware)
6. Gift message sanitisation (strip HTML, max 300 chars)
7. Generate collision-resistant `TB-XXXXXX` order number
8. Insert order with `status: "pending"`
9. Atomic stock decrement with `$gte` guard
10. Compensation rollback on race → `409 Conflict`
11. Non-blocking FCM: "Order Received ⚡"

### 10.3 Outfit Product Stock Model

```json
{
  "topwear":    { "sizeStock": { "S": 5, "M": 3 }, "stock": 8 },
  "bottomwear": { "sizeStock": { "28": 4, "30": 6 }, "stock": 10 },
  "stock": 8
}
```

`root.stock = min(topwear.stock, bottomwear.stock)`.

---

## 11. Returns System

### 11.1 Policy

- Only `delivered` orders
- One return per order
- Reasons: `defective`, `wrong_item`, `size_issue`, `not_as_described`, `other`
- Description: 10–500 chars (HTML stripped)
- **UPI ID required** for refund payout

### 11.2 Return Flow

```
POST /api/returns → order: return_requested, return: pending
PATCH approve     → stock restored, order: return_approved, return: approved
PATCH reject      → order: return_rejected, return: rejected
PATCH issue_refund → order: refund_issued, return: refund_issued
```

Default shipping deduction: ₹50. Admin can override `shippingCharges` and `refundAmount` on approval.

---

## 12. Cart & Wishlist

- Anonymous: `localStorage` only
- Authenticated: MongoDB keyed by `userId = email`
- On login: merge local + server (dedupe by `productId + size`)
- Write strategy: full array replace on every POST

---

## 13. Review System

- Eligibility: delivered order containing the `productId`
- One active review per `(userId, productId)` — duplicate POST returns `409`
- Soft delete: `isDeleted: true`

---

## 14. Admin Panel & Analytics

Route `/admin` (lazy). Tabs: **Analytics · Orders · Products · Categories · Brands · Reviews · Slider · Notifications · Returns**.

Silent polling every 15 seconds refreshes data; slider tab skips silent fetches to preserve unsaved edits.

### Analytics Response Keys

| Key | Description |
|---|---|
| `overview` | `totalRevenue`, `netRevenue`, `totalOrders`, `averageOrderValue`, `totalUsers`, `totalProfit`, `netProfit` |
| `revenueSeries` | Per-day `{ day, revenue }` |
| `ordersSeries` | Per-day `{ day, count }` |
| `topProducts` | Top 5 by units sold |
| `stockAlerts` | `outOfStock` + `lowStock` (stock ≤ 5) |
| `recentOrders` | Latest 5 orders |

Revenue excludes cancelled/refunded/return-in-progress statuses. Profit counts only `delivered` and `completed` orders.

---

## 15. Push Notifications (FCM)

### Device Registration

1. Persistent `deviceId` in `localStorage` (`thunderbold_device_id`)
2. On permission grant → FCM token via main Workbox SW (`/sw.js`)
3. `POST /api/users/fcm-token` with `{ token, deviceId }`
4. Backend deduplicates by `deviceId` and `token`

### Delivery Triggers

- Order creation → "Order Received ⚡"
- Admin status PATCH → mapped notifications (`confirmed`, `packed`, `shipped`, `delivered`, `cancelled`)
- Admin broadcast → `POST /api/notifications/broadcast`

### Foreground vs Background

- **Foreground:** Sonner toast via `onMessage()` in `NotificationsContext`
- **Background:** `firebase-messaging-sw-part.js` injected into Workbox SW; skips duplicate `showNotification` when payload includes `notification` key

---

## 16. Performance Architecture

| Optimization | Location | Details |
|---|---|---|
| Module-level API cache | `src/lib/apiCache.ts` | 60s TTL + in-flight dedup; used by ThunderboldSlider, CategoriesSection, LiveSaleSection |
| Lazy Firebase Auth | `src/lib/firebase.ts` | `getFirebaseAuth()` deferred |
| Manual chunks | `vite.config.ts` | `vendor` (react, react-dom, react-router-dom), `firebase`, `motion` |
| Orders prefetch | `src/lib/ordersCache.ts` | `requestIdleCallback` prefetch after login |
| CDN cache headers | `server.js` + handlers | `stale-while-revalidate` on public catalogue GETs |
| Version polling | `src/main.tsx` | `/version.json` every 60s + on tab focus |
| Cloudinary transforms | `src/lib/cloudinary.ts` | CDN-optimised image URLs |
| Workbox runtime cache | `vite.config.ts` | Cloudinary images CacheFirst 30 days |

Compositor-only dot animations (`transform: scaleX()` + `opacity`) in ThunderboldSlider, HeroBanner, PromoSlider.

---

## 17. Security Model

### Headers (Express middleware)

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Cross-Origin-Resource-Policy: cross-origin
```

Not set: `Content-Security-Policy`, `Strict-Transport-Security`, `Permissions-Policy`.

### Rate Limiting

| Endpoint | Limit | Notes |
|---|---|---|
| `POST /api/orders/create` | 10/min/IP | |
| `POST /api/reviews` | 10/min/IP | |
| All `/api/cart` methods | 10/min/IP | Includes GET |
| All `/api/wishlist` methods | 10/min/IP | Includes GET |

In-memory only — resets on cold start; no cross-instance coordination.

### Input Sanitisation

Gift messages, return descriptions, review comments, and admin notes are trimmed/stripped. Phone and pincode digits normalised. `purchasePrice` never returned to non-admin callers.

---

## 18. PWA Architecture

### Strategy: `generateSW`

Workbox generates the service worker from `vite.config.ts`. FCM handler injected via `importScripts: ['/firebase-messaging-sw-part.js']`.

### Registration

- `registerType: 'autoUpdate'` — new SW activates immediately
- `skipWaiting: true`, `clientsClaim: true`
- `main.tsx` calls `updateSW(true)` on `onNeedRefresh` (auto-reload)
- `PWAUpdatePrompt` listens for custom events as a fallback UI

---

## 19. Service Worker & Caching

| Pattern | Strategy | Cache Name | TTL / Limit |
|---|---|---|---|
| `/api/*` | NetworkOnly | — | Never cached |
| JS/CSS/HTML/fonts | Precache | Workbox managed | Content-hashed |
| Google Fonts CSS | StaleWhileRevalidate | `tb-google-fonts-css` | 7 days / 8 |
| Google Fonts files | CacheFirst | `tb-google-fonts-files` | 365 days / 30 |
| Cloudinary images | CacheFirst | `tb-cloudinary-images` | 30 days / 120 |
| Local static images | CacheFirst | `tb-static-images` | 30 days / 60 |

`navigateFallback: '/index.html'` with denylist `/^\/api\//`.

---

## 20. Web App Manifest

| Field | Value |
|---|---|
| `id` | `/` |
| `name` | `Thunderbold` |
| `display` | `standalone` |
| `display_override` | `window-controls-overlay`, `standalone`, `minimal-ui` |
| `theme_color` / `background_color` | `#080808` |
| `lang` | `en-IN` |
| `shortcuts` | Cart, Wishlist, Orders, Deals |
| `share_target` | URL sharing via OS share sheet |
| `launch_handler` | `navigate-existing` |
| `icons` | 9 sizes + 1 maskable (512×512) |

---

## 21. App Capabilities

| Shortcut | URL |
|---|---|
| My Cart | `/cart` |
| My Wishlist | `/wishlist` |
| My Orders | `/orders` |
| Deals | `/deals/under-999` |

Share target opens at `/` with shared URL params. Launch handler reuses existing window.

---

## 22. Update Lifecycle

```
Build → version.json written → SW precache updated
User visit → SW checks for update (hourly + on tab focus)
New version → skipWaiting + clientsClaim → auto-reload via main.tsx
PWAUpdatePrompt → fallback toast if custom events fire
```

---

## 23. Icons & Splash Screen

| File | Size | Purpose |
|---|---|---|
| `icon-72x72.png` | 72×72 | Android legacy |
| `icon-96x96.png` | 96×96 | Shortcut icons |
| `icon-128x128.png` | 128×128 | Chrome Web Store |
| `icon-144x144.png` | 144×144 | Windows tile |
| `icon-152x152.png` | 152×152 | Apple Touch (iPad) |
| `icon-192x192.png` | 192×192 | Android home screen |
| `icon-384x384.png` | 384×384 | High-DPI Android |
| `icon-512x512.png` | 512×512 | Play Store / splash |
| `icon-512x512-maskable.png` | 512×512 | Android adaptive icon |

`splashScreen.tsx` — once per session via `sessionStorage`, ~2.4s, background `#080808` matching manifest.

---

## 24. Deployment — Vercel

| Setting | Value |
|---|---|
| Build Command | `npm run build` |
| Output Directory | `dist/` |

### Rewrites (`vercel.json`)

```
/api/admin/analytics → /api/admin
/api/slider → /api/admin?subpath=slider
/api/orders/create|cancel|manage → /api/orders?subpath=:sub
/api/users/fcm-token → /api/users?subpath=fcm-token
/api/notifications/broadcast|test-send → /api/notifications?subpath=:sub
/api/* → serverless functions
/(.*) → /index.html (SPA fallback)
```

### Static Headers

- `/sw.js`, `/workbox-*.js`, `/index.html`, `/version.json`, `/manifest.webmanifest` → no-cache
- `/icons/*` → immutable 1-year cache
- `/screenshots/*` → 1-day cache

12 serverless functions in `api/` — at Vercel Hobby limit.

---

## 25. TWA / Play Store Readiness

Manifest includes `related_applications` with Play Store IDs `shop.thunderbold.www.twa` and `shop.thunderbold.twa` plus SHA-256 fingerprints.

`public/.well-known/assetlinks.json` serves Digital Asset Links. Generate/update via PWABuilder or Bubblewrap against `https://thunderbold.shop/manifest.webmanifest`.

---

## 26. Database Schema Summary

**MongoDB Atlas** — database: `thunderbold` — **10 collections**

| Collection | Purpose |
|---|---|
| `users` | Profiles, embedded `addresses[]`, `fcmTokens[]` |
| `products` | Catalogue (standard + outfit variants); `purchasePrice` admin-only |
| `orders` | Embedded product + address snapshots |
| `returns` | One per order; includes `upiId` |
| `cart` | One doc per user; full `items[]` replace |
| `wishlist` | Same pattern as cart |
| `reviews` | Soft-deleted; eligibility gated |
| `categories` | Lookup table |
| `brands` | Lookup table (`logoUrl` field) |
| `config` | `_id: "slider"` and `_id: "hero-banner"` |

See `DATABASE.md` for full schemas, indexes, and query patterns.

---

## 27. Pricing System

| Field | Visibility | Purpose |
|---|---|---|
| `price` | Public | Selling price (INR) |
| `mrp` | Public | Crossed-out original price |
| `purchasePrice` | Admin only | Internal cost for profit calculations |

`computePrice(price, mrp)` in `src/lib/pricing.ts` derives discount percentage. API normalises legacy products: `mrp: doc.mrp ?? doc.purchasePrice ?? null`.

---

## 28. Known Limitations

| Limitation | Impact |
|---|---|
| In-memory rate limiter | Resets on serverless cold starts; ineffective across multiple instances |
| Cart/wishlist rate limit on GET | High-traffic users may hit 429 on cart/wishlist reads |
| No single-product API | Product detail page downloads entire catalogue |
| Users API jwt.decode | Profile GET/PATCH/DELETE do not cryptographically verify tokens |
| Legacy `/api/address` | Unauthenticated; uses separate `addresses` collection unused by main checkout flow |
| Hardcoded Firebase client config | Requires code change to swap Firebase projects (only VAPID key is env-driven) |
| No payment gateway | COD only — no Razorpay/PhonePe integration |
| No email receipts | Order confirmations are push-only |
| No Redis / distributed cache | Rate limiting and apiCache are process-local |
| `helmet` unused | Security headers manually set; no CSP |

---

## 29. Edge Cases Handled

| Case | Handling |
|---|---|
| Duplicate order on retry | `clientOrderId` sparse unique index |
| Race on stock | `$gte` guard + compensation rollback → 409 |
| Outfit stock | Separate topwear/bottomwear decrement/restore |
| Return idempotency | One return per `orderId` → 409 |
| Stale FCM tokens | Pruned on failed send |
| Duplicate FCM per device | `deviceId` deduplication in users collection |
| Mid-deploy stale chunks | Content-hashed filenames + `cleanupOutdatedCaches` |
| Admin slider unsaved edits | Silent poll skips slider tab |
| Instagram in-app browser | `instagram-browser` CSS class for fixed-position fixes |
| PWA SW conflicts | Unregisters non-`/sw.js` service workers on startup |

---

## 30. Troubleshooting

### Service Worker Not Detected

Test production URL (not localhost). SW only exists after `npm run build`.

### Install Prompt Not Appearing

Requires HTTPS, engagement heuristics, valid manifest + 192/512 icons.

### Blank Screen After Deploy

Unregister stale SW → hard refresh. `autoUpdate` + version polling mitigates this.

### FCM Not Working

Verify `FIREBASE_SERVICE_ACCOUNT` (server) and `VITE_FIREBASE_VAPID_KEY` (client). Test via `POST /api/notifications/test-send`.

### MongoDB Errors

Confirm `MONGO_URI` is set and Atlas IP allowlist includes your deployment IPs.

---

## Copyright

Copyright © 2026 ThunderBold Private Limited. All rights reserved.

This repository and its contents are proprietary. See [LICENSE](LICENSE) for terms.

---

*Thunderbold — Premium Indian Fashion. Built for the Bold.*

> Last updated: July 19, 2026
