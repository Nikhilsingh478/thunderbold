# Thunderbold — Production-Grade Premium Fashion E-Commerce PWA

A full-stack, installable Progressive Web App built for a real retail brand selling curated Indian streetwear. React 18 + Vite frontend, Express/MongoDB backend, Firebase Auth, Firebase Cloud Messaging, and a Workbox service worker.

> **Brand:** Thunderbold · **Market:** India · **Domain:** thunderbolddenim.com · **Payment:** Cash on Delivery only

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
28. [Edge Cases Handled](#28-edge-cases-handled)
29. [Troubleshooting](#29-troubleshooting)

---

## 1. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite 5, Tailwind CSS |
| Routing | React Router v6 |
| Server State | TanStack Query (React Query) v5 |
| Animations | Framer Motion |
| Charts | Recharts |
| Icons | Lucide React |
| Toasts | Sonner |
| Authentication | Firebase Authentication (Google OAuth + Email/Password) |
| Push Notifications | Firebase Cloud Messaging (FCM) |
| Database | MongoDB Atlas (Native Node.js Driver) |
| Backend | Node.js + Express 5 (dev + prod); Vercel Serverless Functions (prod) |
| Media CDN | Cloudinary |
| PWA | vite-plugin-pwa v1.x + Workbox `generateSW` strategy |
| Build | Vite 5.4 with manual chunk splitting |

---

## 2. Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                          Browser                              │
│  React 18 SPA (Vite, port 5000 in dev)                        │
│  ├── React Router v6 (client-side routing)                    │
│  ├── TanStack Query (server state / caching)                  │
│  ├── Framer Motion (GPU-composited animations)                │
│  ├── Firebase Auth SDK (lazy-initialised — off critical path) │
│  ├── Firebase Messaging SDK (FCM push notifications)          │
│  └── Service Worker (Workbox — offline + asset caching)       │
└───────────────────────────┬──────────────────────────────────┘
                            │  /api/* (proxied in dev via Vite)
┌───────────────────────────▼──────────────────────────────────┐
│              Express API Server (port 3001)                   │
│  api/*.js — same files deployed as Vercel Serverless Fns      │
│  ├── Firebase Admin SDK (cryptographic token verification)    │
│  ├── MongoDB Atlas (getDb() singleton connection pool)        │
│  ├── FCM multicast (admin broadcast, order status pushes)     │
│  └── In-memory rate limiter (10 req/min per IP)               │
└──────────────────────────────────────────────────────────────┘
```

**Key design decisions:**
- Frontend uses only relative `/api/...` URLs — no environment-specific URL switching needed
- All API handlers are consolidated (one file per resource) to stay within Vercel Hobby's 12-function limit
- `purchasePrice` (internal cost) is stripped via MongoDB projection from every non-admin API response
- Email (not Firebase UID) is used as `userId` across orders/cart/wishlist — stable across account re-linking

---

## 3. Environment Setup

Set these as Replit secrets (or `.env` locally). **Never commit these values.**

| Variable | Used By | Description |
|---|---|---|
| `MONGO_URI` | `api/_lib/mongodb.js` | MongoDB Atlas connection string |
| `FIREBASE_SERVICE_ACCOUNT` | `api/_lib/firebaseAdmin.js` | Stringified Firebase service account JSON (server-only) |
| `VITE_FIREBASE_API_KEY` | `src/lib/firebase.ts` | Firebase public API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | `src/lib/firebase.ts` | Firebase Auth domain |
| `VITE_FIREBASE_PROJECT_ID` | `src/lib/firebase.ts` | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | `src/lib/firebase.ts` | Firebase Storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `src/lib/firebase.ts` | Firebase Messaging sender ID |
| `VITE_FIREBASE_APP_ID` | `src/lib/firebase.ts` | Firebase App ID |

> `VITE_*` variables are embedded into the frontend bundle at build time by Vite. Firebase client SDK keys are designed to be public — they are not secrets.
>
> `FIREBASE_SERVICE_ACCOUNT` and `MONGO_URI` are **server-only** and must **never** carry the `VITE_` prefix.

Without `MONGO_URI`, all data endpoints return `500 Database unavailable` — no silent fallbacks.

---

## 4. Running the App

```bash
npm run dev        # Concurrently: node server.js (:3001) + vite (:5000)
npm run build      # Production build — generates dist/sw.js + manifest
npm run preview    # Preview production build locally
```

The service worker is **only active in production builds** (`npm run build`). During development, `devOptions.enabled: false` keeps Vite HMR and the API proxy working cleanly.

---

## 5. Project Structure

```
thunderbold/
├── api/                              # Express / Vercel Serverless handlers
│   ├── _lib/                         # Shared backend utilities
│   │   ├── mongodb.js                # Singleton connection pool + index bootstrap
│   │   ├── firebaseAdmin.js          # Token verification + Admin Messaging
│   │   ├── fcm.js                    # sendToUser() + sendMulticast() helpers
│   │   ├── adminHelper.js            # isAdmin() — DB role + hardcoded allowlist
│   │   ├── rateLimit.js              # In-memory sliding-window rate limiter
│   │   ├── response.js               # Standardised JSON response helpers
│   │   └── validator.js              # Address / phone / pincode validators
│   ├── orders/index.js               # Orders CRUD + atomic stock management
│   ├── returns/index.js              # Return requests + admin approve/reject
│   ├── users/index.js                # User profile + address book + FCM tokens
│   ├── products/
│   │   ├── index.js                  # Product catalogue (public read, admin write)
│   │   └── [id].js                   # Single product by MongoDB ObjectId
│   ├── cart/index.js                 # Per-user cart (full replace on each write)
│   ├── wishlist/index.js             # Per-user wishlist
│   ├── reviews/index.js              # Verified-purchase review system
│   ├── categories/index.js           # Category management
│   ├── brands/index.js               # Brand management
│   ├── address/index.js              # Address management
│   ├── notifications/index.js        # Admin broadcast + test-send push notifications
│   └── admin.js                      # Analytics dashboard + slider data
│
├── src/
│   ├── App.tsx                       # Root provider tree
│   ├── AppContent.tsx                # BrowserRouter + route definitions + Suspense
│   ├── main.tsx                      # Vite entry + PWA SW registration + version polling
│   ├── vite-env.d.ts                 # Vite + vite-plugin-pwa type references
│   │
│   ├── context/
│   │   ├── AuthContext.tsx           # Firebase auth state + MongoDB sync on login
│   │   ├── CartContext.tsx           # Cart state (server-synced + localStorage fallback)
│   │   ├── WishlistContext.tsx       # Wishlist state (server-synced + localStorage fallback)
│   │   └── NotificationsContext.tsx  # FCM token registration + deviceId deduplication
│   │
│   ├── pages/
│   │   ├── Index.tsx                 # Homepage
│   │   ├── About.tsx                 # Brand story
│   │   ├── CategoryView.tsx          # Product listing by category
│   │   ├── ProductView.tsx           # Product detail + reviews + add to cart (lazy)
│   │   ├── Cart.tsx                  # Shopping cart (lazy)
│   │   ├── Checkout.tsx              # Address selection + order placement (lazy)
│   │   ├── Orders.tsx                # Order history + return requests (lazy)
│   │   ├── Wishlist.tsx              # Saved products (lazy)
│   │   ├── Profile.tsx               # User profile + address book (lazy)
│   │   ├── Admin.tsx                 # Full admin panel (lazy)
│   │   ├── BrandsPage.tsx            # Brand listing (lazy)
│   │   ├── BrandView.tsx             # Brand detail + products (lazy)
│   │   ├── DealsPage.tsx             # Deals / filtered product listings (lazy)
│   │   ├── Policies.tsx              # Returns, shipping, privacy policies (lazy)
│   │   └── NotFound.tsx              # 404 fallback
│   │
│   ├── components/
│   │   ├── Navbar.tsx                # Sticky nav with cart badge + search + auth
│   │   ├── Footer.tsx                # Site links, policies, social (customer pages only)
│   │   ├── SplashScreen.tsx          # Cinematic branded intro (once per session)
│   │   ├── PWAUpdatePrompt.tsx       # SW update / offline-ready toast
│   │   ├── HeroBanner.tsx            # Hero carousel with compositor-only dot animation
│   │   ├── ThunderboldSlider.tsx     # Full-screen product showcase slider (LCP-optimised)
│   │   ├── CategoriesSection.tsx     # Category grid with lazy-loaded product tiles
│   │   ├── LiveSaleSection.tsx       # Live sale product row
│   │   ├── BrandsSection.tsx         # Brand logo grid
│   │   ├── AnnouncementBar.tsx       # Top announcement ticker
│   │   ├── Ticker.tsx                # Scrolling announcement text
│   │   ├── SearchOverlay.tsx         # Full-screen search modal
│   │   ├── PriceDisplay.tsx          # Price / MRP / discount badge
│   │   ├── ScrollProgress.tsx        # Page scroll progress bar
│   │   ├── CustomCursor.tsx          # Custom cursor for desktop
│   │   ├── ReturnRequestModal.tsx    # Return request submission flow
│   │   ├── ApkBanner.tsx             # PWA / APK install prompt banner
│   │   ├── NotificationPermissionPrompt.tsx  # FCM permission request UI
│   │   ├── AnalyticsNumbers.tsx      # KPI number cards
│   │   ├── promo/
│   │   │   └── PromoSlider.tsx       # Homepage promo slider with brass dot animation
│   │   ├── products/
│   │   │   └── ProductGrid.tsx       # Responsive product grid with skeleton states
│   │   ├── checkout/                 # Address form + order summary components
│   │   ├── reviews/                  # Star rating + review card components
│   │   ├── auth/                     # Login modal components
│   │   ├── Analytics/                # Admin analytics dashboard charts (Recharts)
│   │   └── ui/                       # shadcn/ui primitives
│   │
│   ├── lib/
│   │   ├── apiCache.ts               # Module-level fetch cache: 60s TTL + in-flight dedup
│   │   ├── firebase.ts               # Firebase client SDK + lazy getFirebaseAuth() getter
│   │   ├── firebaseMessaging.ts      # FCM client setup + SW synchronisation
│   │   ├── ordersCache.ts            # Idle-time prefetch of orders into TanStack cache
│   │   ├── pricing.ts                # computePrice(price, mrp) — discount % derivation
│   │   ├── cloudinary.ts             # Cloudinary URL transformation helpers
│   │   ├── requireAuth.ts            # Pending action gating behind auth
│   │   ├── modalController.ts        # Event bus for login modal (no prop drilling)
│   │   ├── storage.ts                # localStorage cart/wishlist helpers
│   │   ├── policyContent.ts          # Static policy text (returns, shipping, privacy)
│   │   └── usePWAInstall.ts          # beforeinstallprompt hook
│   │
│   └── utils/
│       ├── printInvoice.ts           # Client-side invoice PDF generation
│       └── utils.ts                  # Shared formatting helpers
│
├── public/
│   ├── icons/                        # 9 PWA icons (72–512px) + maskable variant
│   ├── screenshots/
│   │   ├── mobile.svg                # Narrow (540×960) — manifest install dialog
│   │   └── desktop.svg               # Wide (1280×800) — manifest install dialog
│   ├── offline.html                  # Custom branded offline fallback page
│   ├── sitemap.xml                   # Static sitemap for search indexing
│   ├── robots.txt                    # Crawler directives
│   └── Thunderbolt.apk               # Sideload APK (TWA build)
│
├── server.js                         # Express server (port 3001) — dev + Replit prod
├── vite.config.ts                    # Vite + VitePWA + proxy + manual chunk splitting
├── index.html                        # Entry HTML (SEO meta tags, JSON-LD schema, preconnects)
├── tailwind.config.ts                # Tailwind + custom design tokens (brass, obsidian)
├── vercel.json                       # Serverless routing + static asset headers
├── package.json
├── README.md                         # This file
├── DATABASE.md                       # Full MongoDB schema + migration guide
└── DOCS.md                           # Comprehensive technical reference
```

---

## 6. Frontend Architecture

### 6.1 Provider Tree

```
<QueryClientProvider>          ← TanStack Query global client
  <AuthProvider>               ← Firebase auth state + DB sync on login
    <CartProvider>             ← Cart state (server-synced + localStorage)
      <WishlistProvider>       ← Wishlist state (server-synced + localStorage)
        <BrowserRouter>
          <AppContent />       ← Routes + Suspense + login modal + splash screen
        </BrowserRouter>
      </WishlistProvider>
    </CartProvider>
  </AuthProvider>
</QueryClientProvider>
```

### 6.2 Routing & Code Splitting

Routes are defined in `src/AppContent.tsx`. Heavy pages use `React.lazy()` — each becomes a separate Rollup chunk loaded on demand. A branded `<PageLoader />` (bolt icon on `#0a0a0a`) is shown via `<Suspense>` while chunks download.

| Path | Component | Strategy |
|---|---|---|
| `/` | `Index` | Eager |
| `/about` | `About` | Eager |
| `/category/:id` | `CategoryView` | Eager |
| `/product/:id` | `ProductView` | Lazy |
| `/cart` | `Cart` | Lazy |
| `/checkout` | `Checkout` | Lazy |
| `/orders` | `Orders` | Lazy |
| `/wishlist` | `Wishlist` | Lazy |
| `/profile` | `Profile` | Lazy |
| `/admin` | `Admin` | Lazy |
| `/deals/:slug` | `DealsPage` | Lazy |
| `/brands` | `BrandsPage` | Lazy |
| `/brands/:id` | `BrandView` | Lazy |
| `/policies/:slug` | `Policies` | Lazy |
| `*` | `NotFound` | Eager |

### 6.3 State Management

**Server state** is handled entirely by TanStack Query (`useQuery` / `useMutation`). Covers products, orders, user profiles, reviews, and categories. Provides caching, background refetch, deduplication, and error states.

**Client state** for cart and wishlist uses React `useReducer` inside context providers. Both:
- Read from `localStorage` immediately on mount (zero-latency for returning users)
- Sync to MongoDB once authenticated
- Fall back to `localStorage`-only for anonymous users
- Merge localStorage items with server items on login (deduplicated by `productId + size`)

**Auth state** wraps Firebase's `onAuthStateChanged`. On every login, the user record is upserted in MongoDB via `POST /api/users`.

### 6.4 Login Modal System

`src/lib/modalController.ts` is a custom event bus that lets any component trigger the login modal without prop drilling. Three trigger sources:

| Source | Condition |
|---|---|
| `requireAuth` | User action (add to cart / wishlist) while unauthenticated |
| `delayedPrompt` | 10 seconds after page load, once per session, for unauthenticated visitors |
| `manual` | User clicks a sign-in button directly |

After login, any stored pending action is automatically re-executed via `executeStoredAction()` in `src/lib/requireAuth.ts`.

### 6.5 Firebase Auth — Lazy Initialisation

`src/lib/firebase.ts` exposes `getFirebaseAuth()` — a lazy getter that initialises Firebase Auth only on first call, caching the instance for all subsequent calls. This defers the Auth iframe and SDK bootstrap off the critical render path. The `initializeApp()` call is still eager (needed for Firestore/Storage), but `getAuth()` is deferred.

```typescript
let _auth: Auth | null = null;
export function getFirebaseAuth(): Auth {
  if (!_auth) _auth = getAuth(app);
  return _auth;
}
```

All `AuthContext.tsx` handlers call `getFirebaseAuth()` instead of the old top-level `auth` export.

---

## 7. Backend Architecture

### 7.1 Express Server (`server.js`)

Runs on **port 3001**. Each API route dynamically imports its handler module on first request, avoiding ESM circular dependency issues and keeping startup fast.

In development, Vite's dev server on **port 5000** proxies all `/api/*` requests to `localhost:3001`. Frontend code always uses relative `/api/...` URLs.

### 7.2 Shared Library Modules

**`api/_lib/mongodb.js`**
- Singleton pool cached in `global.mongo` — survives serverless warm-starts
- Pool: `maxPoolSize: 10`, `minPoolSize: 2`, `serverSelectionTimeoutMS: 5000`
- Database: `thunderbold`
- Bootstraps all required MongoDB indexes asynchronously on first connection (non-blocking, non-fatal)

**`api/_lib/firebaseAdmin.js`**
- Initialises Firebase Admin SDK from `FIREBASE_SERVICE_ACCOUNT` environment variable (JSON string)
- `verifyFirebaseToken(token)` — cryptographic ID token verification with revocation checking
- `getAdminMessaging()` — returns Firebase Admin Messaging instance for FCM
- No insecure fallback: throws `401` on invalid token, `503` if SDK is unconfigured

**`api/_lib/fcm.js`**
- `sendToUser(db, userId, payload, origin)` — sends to all FCM tokens for one user; never throws (callers are never blocked by notification failures); automatically prunes stale/invalid tokens from DB
- `sendMulticast(messaging, tokens, payload, origin)` — batches tokens in groups of 500 (FCM limit); used by admin broadcast; collects and returns invalid token list for cleanup

**`api/_lib/adminHelper.js`**
- `isAdmin(email, db)` — two-step resolution: DB role check (`users.role === 'admin'`) first, then hardcoded `ADMIN_EMAILS` allowlist fallback

**`api/_lib/rateLimit.js`**
- In-memory sliding-window limiter: 10 req/min per IP
- IP extracted from `X-Forwarded-For` → `X-Real-IP` → socket address
- Stale entries purged every 5 minutes

**`api/_lib/validator.js`**
- `validateAddress()` — validates all 6 required address fields
- `validatePhone()` — 10-digit India format
- `validatePincode()` — 6-digit India format

### 7.3 Cache-Control Headers (server.js)

Public, read-only GET routes return CDN-friendly cache headers:

```
Cache-Control: public, s-maxage=60, stale-while-revalidate=300
```

Applied to: `/api/products`, `/api/categories`, `/api/brands`, `/api/slider`.

Only fires on `GET` requests — writes (POST/PUT/DELETE) are never cached. Auth-sensitive routes (orders, cart, wishlist, users, returns, address, reviews) have no cache headers.

---

## 8. Authentication System

### 8.1 Client-Side (Firebase Auth)

`src/lib/firebase.ts` initialises with `browserLocalPersistence` — users stay logged in across browser sessions.

Supported sign-in methods:
- **Google OAuth** — `signInWithPopup` + `GoogleAuthProvider` (`prompt: 'select_account'` always shows account picker)
- **Email + Password** — `signInWithEmailAndPassword` / `createUserWithEmailAndPassword`

After every successful sign-in, `AuthContext.syncUserWithDatabase()` calls `POST /api/users` with `{ uid, email, name }` to upsert the user record in MongoDB.

### 8.2 Server-Side Token Verification

Every protected endpoint extracts the token from `Authorization: Bearer <token>` and calls `verifyFirebaseToken(token)`. The decoded payload provides `{ email, uid, ...claims }`.

**User identity note:** Cart, wishlist, and orders use `email` as `userId` (not Firebase UID). This is intentional — Firebase UIDs can change on account re-linking, but email is stable for COD order tracking.

### 8.3 Admin Access

Admin endpoints additionally call `isAdmin(email, db)`:
1. DB lookup: `users.role === 'admin'`
2. Hardcoded allowlist: `ADMIN_EMAILS` in `api/_lib/adminHelper.js`

Admin status is verified on every request — no session-based admin caching.

### 8.4 Auth Flow Diagram

```
User attempts protected action
        │
        ├── Not authenticated → store pending action → open login modal
        │
        └── Authenticated
                │
                Firebase ID token → Authorization header
                        │
                verifyFirebaseToken(token)
                  ├── Fail → 401 Unauthorized
                  └── Pass → { email, uid }
                                │
                         Admin endpoint?
                           ├── Yes → isAdmin() → 403 if not admin
                           └── No  → process request
```

---

## 9. API Reference

All endpoints accept and return JSON. Protected endpoints require `Authorization: Bearer <firebase-id-token>`.

### Products

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/products` | Public | All products; supports `?section=` and `?maxPrice=` filters. `purchasePrice` excluded. |
| `GET` | `/api/products/:id` | Public | Single product by MongoDB ObjectId |
| `POST` | `/api/products` | Admin | Create product |
| `PUT` | `/api/products?id=:id` | Admin | Full replace of product |
| `DELETE` | `/api/products?id=:id` | Admin | Hard delete product |

> Admin `GET` requests include `purchasePrice`. Public `GET` never exposes it.

### Orders

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/orders` | User/Admin | User sees own orders; admin sees all |
| `POST` | `/api/orders/create` | User | Create order with idempotency check + atomic stock decrement |
| `PUT` | `/api/orders/cancel` | User/Admin | Cancel order + restore stock |
| `PATCH` | `/api/orders/manage?id=:id` | Admin | Update order status (triggers FCM push) |
| `DELETE` | `/api/orders/manage?id=:id` | Admin | Delete order record |

### Returns

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/returns` | User/Admin | User sees own requests; admin sees all |
| `POST` | `/api/returns` | User | Submit return request (delivered orders only; one per order) |
| `PATCH` | `/api/returns?id=:id` | Admin | Approve / reject / issue refund |

### Users

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/users` | User | Fetch own profile (by Firebase UID) |
| `POST` | `/api/users` | Open | Create/sync user on login |
| `PATCH` | `/api/users` | User | Update name/phone or set default address |
| `DELETE` | `/api/users` | User | Remove address from address book |
| `POST` | `/api/users?subpath=fcm-token` | User | Register/update device FCM token |

### Cart

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/cart` | User | Fetch cart items |
| `POST` | `/api/cart` | User | Replace entire cart |
| `DELETE` | `/api/cart` | User | Clear cart |

### Wishlist

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/wishlist` | User | Fetch wishlist items |
| `POST` | `/api/wishlist` | User | Replace entire wishlist |
| `DELETE` | `/api/wishlist` | User | Clear wishlist |

### Reviews

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/reviews?productId=:id` | Public | Active reviews for a product |
| `GET` | `/api/reviews?mine=true` | User | All of current user's reviews |
| `GET` | `/api/reviews?mine=true&productId=:id` | User | Own review + purchase eligibility flag |
| `POST` | `/api/reviews` | User | Submit review (requires delivered order) |
| `PUT` | `/api/reviews?id=:id` | User | Edit own review |
| `DELETE` | `/api/reviews?id=:id` | User/Admin | Soft-delete review |

### Catalogue & Content

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/categories` | Public | List all categories |
| `POST/PUT/DELETE` | `/api/categories` | Admin | Manage categories |
| `GET` | `/api/brands` | Public | List all brands |
| `POST/PUT/DELETE` | `/api/brands` | Admin | Manage brands |
| `GET` | `/api/slider` | Public | Homepage banner slider entries |
| `PUT` | `/api/slider` | Admin | Update slider configuration |

### Admin & Notifications

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/admin/analytics` | Admin | Full analytics dashboard payload |
| `POST` | `/api/notifications/broadcast` | Admin | Send push notification to all users |
| `POST` | `/api/notifications/test-send` | User | Send test push to own devices |

---

## 10. Order Management System

### 10.1 Order Status Lifecycle

```
pending → confirmed → shipped → delivered
    └──────────────────────────→ cancelled
    └──────────────────────────→ return_requested → return_approved → refund_issued
                                                  └→ return_rejected
```

`delivered` orders cannot be cancelled via the standard cancel route. Only admins advance status via `PATCH /api/orders/manage`.

### 10.2 Order Creation Flow (`POST /api/orders/create`)

1. **Rate limit** — rejects if IP exceeds 10 req/min
2. **Auth** — verifies Firebase token; binds `email` as `userId`
3. **Idempotency** — if `clientOrderId` matches existing order, returns it immediately (prevents double-taps / retries)
4. **Request validation** — validates products array, address fields, payment method
5. **Pre-flight stock check** — fetches each product; verifies `sizeStock[size] >= quantity`. Outfit products check both `topwear.sizeStock[topwearSize]` and `bottomwear.sizeStock[bottomwearSize]`
6. **Gift message sanitisation** — strips HTML tags, trims, caps at 300 chars
7. **Order ID generation** — generates a unique 6-character alphanumeric code prefixed `TB-` (excluding ambiguous chars `I`, `O`, `0`, `1`); collision-checked at write time
8. **Atomic stock decrement** — MongoDB `$inc` with `$gte` guard; both `sizeStock[size]` and aggregate `stock` decremented together
9. **Compensation rollback** — if any decrement fails (race condition), all previously decremented items are restored and the order document is deleted. Returns `409 Conflict`
10. **FCM push** — `sendToUser()` fires an order confirmation notification to the customer's registered devices (non-blocking; never delays the response)

### 10.3 Outfit Product Stock Model

```json
{
  "topwear":    { "sizeStock": { "S": 5, "M": 3 }, "stock": 8 },
  "bottomwear": { "sizeStock": { "28": 4, "30": 6 }, "stock": 10 },
  "stock": 8
}
```

`root.stock = min(topwear.stock, bottomwear.stock)` — the bottleneck component determines available outfit quantity.

---

## 11. Returns System

### 11.1 Policy

- Return requests may only be raised for orders with `status: "delivered"`
- One return request per order (idempotency enforced at DB level)
- Valid reasons: `defective`, `wrong_item`, `size_issue`, `not_as_described`, `other`
- Description minimum 10 characters, maximum 500 characters

### 11.2 Return Flow

```
Customer submits POST /api/returns
        │
        Order status updated: delivered → return_requested
        Return document created: status "pending"
        │
Admin reviews via PATCH /api/returns?id=:id
        │
        ├── action: "approve"
        │     ├── Calculates refundAmount = totalAmount − shippingCharges (admin can override)
        │     ├── Restores product stock (size-aware, outfit-aware)
        │     ├── Order status: return_requested → return_approved
        │     └── return status: pending → approved
        │
        ├── action: "reject"
        │     ├── Stores adminNotes
        │     ├── Order status: return_requested → return_rejected
        │     └── return status: pending → rejected
        │
        └── action: "issue_refund" (after approval)
              ├── return status: approved → refund_issued
              └── Order status: return_approved → refund_issued
```

### 11.3 Refund Calculation

Default shipping deduction: ₹50. Admin can override both `shippingCharges` and `refundAmount` during approval. Formula: `refundAmount = max(0, totalAmount − shippingCharges)`.

---

## 12. Cart & Wishlist

Both follow the same sync pattern:

- **Anonymous users** — items stored in `localStorage` only
- **Authenticated users** — items synced to MongoDB (keyed by `userId = email`)
- **On login** — localStorage items merged with server items (deduplicated by `productId + size`)
- **Write strategy** — entire array replaced on every update (no incremental PATCH)

Required cart item fields: `productId`, `name`, `price` (number), `image`, `size`, `quantity` (positive integer).

Required wishlist item fields: `productId`, `name`, `price` (number), `image`.

---

## 13. Review System

### Eligibility Gate
Only users who have a `delivered` order containing the specific `productId` can submit a review. Verified server-side on every `POST /api/reviews`.

### Deduplication
One active review per `(userId, productId)` pair. Duplicate `POST` returns `409 Conflict` with the existing review — client can switch to edit mode.

### Soft Delete
Reviews are never hard-deleted. `DELETE` sets `isDeleted: true`. All public and user-scoped `GET` queries filter `{ isDeleted: { $ne: true } }`. Admins can soft-delete any review; users can only delete their own.

---

## 14. Admin Panel & Analytics

### 14.1 Access

Route `/admin` loads `src/pages/Admin.tsx` (lazy). Every admin API call requires Firebase Bearer token + admin verification. No footer on admin pages.

Tabs: **Analytics · Orders · Products · Categories · Brands · Reviews**

### 14.2 Analytics Endpoint (`GET /api/admin/analytics`)

Query params:
- `?range=7d` — last 7 days
- `?range=30d` — last 30 days
- `?month=YYYY-MM` — specific calendar month
- (default) — current calendar month

Response shape:

| Key | Description |
|---|---|
| `overview` | `totalRevenue`, `netRevenue`, `totalOrders`, `averageOrderValue`, `totalUsers`, `totalProfit`, `netProfit` |
| `revenueSeries` | Per-day `{ day, revenue }` array for the selected range |
| `ordersSeries` | Per-day `{ day, count }` array for the selected range |
| `topProducts` | Top 5 products by units sold in the range (with image + price) |
| `stockAlerts` | Products with `stock ≤ 5`, split into `outOfStock` and `lowStock` |
| `recentOrders` | Latest 5 orders (all time) with customer name, total, and item count |

### 14.3 Profit Calculation

Calculated via MongoDB aggregation pipeline:
- Filters `status: { $in: ["delivered", "completed"] }` only
- `$lookup` joins each order item with `products.purchasePrice`
- Excludes items where `purchasePrice` is null/missing
- Formula: `profit = (sellingPrice − purchasePrice) × quantity`
- Two values: `totalProfit` (within date range) and `netProfit` (all-time)

---

## 15. Push Notifications (FCM)

### 15.1 Device Token Registration

`src/context/NotificationsContext.tsx` manages the full client-side FCM lifecycle:

1. Generates a persistent random `deviceId` stored in `localStorage` (one per browser/device)
2. On permission grant, obtains the FCM registration token via `getToken(messaging, { vapidKey, serviceWorkerRegistration })`
3. Calls `POST /api/users?subpath=fcm-token` with `{ token, deviceId }`
4. Backend deduplicates: removes any existing entry for the same `deviceId` or same `token` before inserting the new one — guarantees exactly one active token per device

### 15.2 Service Worker Synchronisation

`src/lib/firebaseMessaging.ts` polls for the main Workbox PWA service worker (`/sw.js`) for up to 3 seconds before falling back to the default Firebase registration (`/firebase-messaging-sw.js`). This prevents dual service worker registrations and duplicate notification delivery.

### 15.3 Notification Delivery

**Order status updates:** When admin updates order status via `PATCH /api/orders/manage`, `sendToUser()` fires a push to the customer's registered devices. Non-blocking — notification failure never blocks the API response.

**Admin broadcasts:** `POST /api/notifications/broadcast` sends to all users with registered FCM tokens. Tokens are batched in groups of 500 (FCM API limit). Invalid/expired tokens discovered during the send are automatically removed from the DB.

### 15.4 Notification Payload (Web Push)

```
title:    e.g. "Order Confirmed ✅" / "Custom broadcast message"
body:     Order details or broadcast text
icon:     /icons/icon-192x192.png
badge:    /favicon.svg
vibrate:  [200, 100, 200]
actions:  [{ action: 'track_order', title: 'Track Order 📦' }, ...]
link:     /orders?orderId=... (order notifications) or / (broadcasts)
android priority: high
TTL:      4 weeks (2,419,200 seconds)
```

---

## 16. Performance Architecture

### 16.1 Module-Level API Cache (`src/lib/apiCache.ts`)

A singleton fetch cache shared across all components. Two layers:

- **In-flight deduplication** — if two components call the same URL simultaneously, only one HTTP request fires; both get the same Promise
- **TTL cache** — responses stored in a `Map` with a timestamp; default TTL 60 seconds; repeated calls skip the network entirely

Applied to: `ThunderboldSlider`, `CategoriesSection`, `LiveSaleSection`. Usage:

```typescript
import('../lib/apiCache').then(({ cachedFetch }) =>
  cachedFetch<{ products?: Product[] }>('/api/products')
)
```

`clearCache(url?)` evicts one entry or the entire cache.

### 16.2 Lazy Firebase Auth

`getFirebaseAuth()` in `src/lib/firebase.ts` defers `getAuth(app)` until the first authentication action. This removes the Firebase Auth SDK initialisation and its associated cross-origin iframe from the critical render path — these no longer block the initial paint.

### 16.3 Bundle Splitting (`vite.config.ts`)

Manual chunks via Rollup `manualChunks`:

| Chunk | Contents | Purpose |
|---|---|---|
| `vendor` | react, react-dom, react-router-dom, lucide-react | Core UI framework — cached separately from app code |
| `firebase` | all `firebase/*` packages | Firebase SDK is large; cached until Firebase releases an update |
| `motion` | framer-motion | Animation library — cached separately from both |

Effect: updating app code no longer busts the Firebase or Framer Motion cache entry.

### 16.4 Compositor-Only Animations

All carousel dot indicators (`ThunderboldSlider`, `HeroBanner`, `PromoSlider`) use `transform: scaleX()` + `opacity` instead of `width` + `background-color`. Width changes force layout recalc on every frame; scale + opacity run entirely on the GPU compositor thread.

```css
/* Inactive dot — no layout, no paint */
transform: scaleX(0.25);
opacity: 0.35;
transition: transform 300ms ease, opacity 300ms ease;
will-change: transform, opacity;
```

`ThunderboldSlider`'s heading keyframe also had `letter-spacing` removed (forces layout on every frame). The animation now touches only `opacity`, `transform`, and `filter`.

### 16.5 LCP Image Prioritisation

The first slide image in `ThunderboldSlider` is the Largest Contentful Paint element:

```jsx
fetchPriority="high"   // promoted to top of browser fetch queue
decoding="sync"        // guaranteed to render in first frame, no async decode tick
loading="eager"        // (already; confirmed)
```

All subsequent slide images use `fetchPriority="low"` and `decoding="async"`.

### 16.6 Version Polling

`src/main.tsx` polls `/version.json` to detect new deployments. Consolidations made:

- Removed 5-second backup `setTimeout` (redundant)
- `visibilitychange` listener registered exactly once (was registered inside the interval callback — caused duplicates)
- Polling interval changed: **15 s → 60 s** (sufficient to detect a new deploy within 1 minute)

### 16.7 Server-Side `stale-while-revalidate`

```
Cache-Control: public, s-maxage=60, stale-while-revalidate=300
```

On CDN-served deployments (Vercel Edge Network), product/category/brand/slider responses are served from edge cache for 60 seconds. After expiry, the CDN serves the stale version instantly while revalidating in the background — zero perceived latency on cache refresh.

### 16.8 Orders Prefetch

`src/lib/ordersCache.ts` uses `requestIdleCallback` (with `setTimeout` fallback) to prefetch the orders list into TanStack Query's cache during idle time after login. The Orders page opens instantly with no loading state.

### 16.9 Cloudinary CDN + Workbox

All product images are hosted on Cloudinary (CDN-distributed, format-optimised). After first load, Workbox's `CacheFirst` strategy caches them locally for 30 days. Repeat visitors — and offline users — load product images from disk.

---

## 17. Security Model

### 17.1 Authentication

- All state-changing endpoints require a cryptographically verified Firebase ID token
- Token revocation checking is enabled (`verifyIdToken(token, true)`)
- No insecure fallback: unconfigured Firebase Admin SDK returns `503`, not a pass-through
- Tokens expire after 1 hour; Firebase client SDK auto-refreshes them

### 17.2 HTTP Security Headers

Applied globally by Express middleware on every response:

```
X-Content-Type-Options:           nosniff
X-Frame-Options:                  DENY
X-XSS-Protection:                 1; mode=block
Referrer-Policy:                  strict-origin-when-cross-origin
Cross-Origin-Resource-Policy:     cross-origin
```

### 17.3 Rate Limiting

| Endpoint | Limit |
|---|---|
| `POST /api/orders/create` | 10 req/min per IP |
| `POST /api/cart` | 10 req/min per IP |
| `POST /api/wishlist` | 10 req/min per IP |
| `POST /api/reviews` | 10 req/min per IP |

> Current implementation is in-memory. For multi-instance production deployments, replace with Redis-backed rate limiting (e.g. `rate-limiter-flexible` + `ioredis`).

### 17.4 Input Sanitisation

| Input | Sanitisation |
|---|---|
| Gift message | HTML tags stripped, trimmed, max 300 chars |
| Return description | HTML tags stripped, trimmed, 10–500 chars |
| Review comment | Trimmed, max 1000 chars |
| Admin notes | HTML tags stripped, trimmed, max 500 chars |
| Phone number | Non-digit chars stripped before storage |
| Pincode | Non-digit chars stripped before storage |
| Product prices | `purchasePrice` stripped from all public GET projections |

### 17.5 Privilege Isolation

- `purchasePrice` is never returned to non-admin callers (MongoDB projection)
- Admin status verified on every admin request — no session caching
- Users can cancel only their own orders (ownership: `order.userId !== userEmail`)
- Users can edit/delete only their own reviews (ownership: `review.userId === userId`)
- Users can submit returns only for their own delivered orders
- Admin PATCH on orders rejects any status outside the valid set

---

## 18. PWA Architecture

### 18.1 Strategy: `generateSW`

Workbox generates the entire service worker from `vite.config.ts`. No custom `sw.ts` to maintain.

### 18.2 Registration Flow

```
src/main.tsx
  └── import('virtual:pwa-register')
        └── registerSW({ onNeedRefresh, onOfflineReady })
              ├── onNeedRefresh(reloadFn) → dispatches 'pwa-update-available'
              └── onOfflineReady()        → dispatches 'pwa-offline-ready'

src/components/PWAUpdatePrompt.tsx
  └── Listens for both events → shows non-intrusive bottom toast
```

### 18.3 `registerType: 'prompt'`

- New SW installs in background — does not take control immediately
- User sees a subtle "Update available" toast at the bottom of screen
- Clicking "Refresh" triggers `skipWaiting` + page reload
- No forced mid-checkout reloads — user decides when to apply
- Old SW continues serving until user acts

---

## 19. Service Worker & Caching

### Generated Files

| File | Description |
|---|---|
| `dist/sw.js` | Main SW — Workbox runtime + precache manifest + runtime route rules |
| `dist/workbox-*.js` | Workbox runtime (content-hashed) |
| `dist/manifest.webmanifest` | Web App Manifest |

### Never Cached — NetworkOnly

```
/api/*    — All API routes (always fresh — no stale cart, stock, or auth data)
```

### Precache (Install Time)

- All JS/CSS chunks (content-hashed — immutable)
- `index.html` (navigation fallback)
- `offline.html`
- Icons (`/icons/*.png`)
- SVG assets

### Runtime Cache

| Pattern | Strategy | Cache Name | TTL | Limit |
|---|---|---|---|---|
| `fonts.googleapis.com/*` | StaleWhileRevalidate | `tb-google-fonts-css` | 7 days | 8 |
| `fonts.gstatic.com/*` | CacheFirst | `tb-google-fonts-files` | 365 days | 30 |
| `res.cloudinary.com/*` | CacheFirst | `tb-cloudinary-images` | 30 days | 120 |
| `*.{png,jpg,webp,svg,…}` | CacheFirst | `tb-static-images` | 30 days | 60 |

### Offline Strategy

- **App shell** — precached `index.html` + all JS/CSS bundles load instantly from cache with no network
- **Navigation fallback** — all SPA routes served from cached shell; API calls fail gracefully, UI shows error states
- **Hard offline** — `offline.html` served for uncached routes when completely offline

What works offline: previously cached product images · app shell · cart/wishlist from localStorage
What requires network: live product data · server cart sync · checkout · Firebase auth

### Stale Chunk Prevention

All JS/CSS filenames include content hashes (`index-CoGOINT0.js`). New deployments produce new hashes. `cleanupOutdatedCaches: true` removes stale cache entries on SW activation.

---

## 20. Web App Manifest

Generated as `dist/manifest.webmanifest` from `vite.config.ts`.

| Field | Value |
|---|---|
| `id` | `/` |
| `name` | `Thunderbold` |
| `short_name` | `Thunderbold` |
| `description` | `Premium Indian Denim — Built for the Bold` |
| `start_url` | `/` |
| `scope` | `/` |
| `display` | `standalone` |
| `display_override` | `['window-controls-overlay', 'standalone', 'minimal-ui']` |
| `orientation` | `portrait-primary` |
| `theme_color` | `#0a0a0a` |
| `background_color` | `#0a0a0a` |
| `lang` | `en-IN` |
| `dir` | `ltr` |
| `categories` | `['shopping']` |
| `shortcuts` | 4 (Cart, Wishlist, Orders, Deals) |
| `screenshots` | 2 (narrow mobile 540×960, wide desktop 1280×800) |
| `share_target` | URL sharing via OS share sheet |
| `launch_handler` | `navigate-existing` |
| `icons` | 9 sizes (72–512px) + 1 maskable |

---

## 21. App Capabilities

### Shortcuts (long-press icon / right-click taskbar)

| Shortcut | URL |
|---|---|
| My Cart | `/cart` |
| My Wishlist | `/wishlist` |
| My Orders | `/orders` |
| Deals | `/deals/under-999` |

### Share Target

Other apps can share URLs into Thunderbold via the OS share sheet:
```json
{ "action": "/", "method": "GET", "params": { "title": "title", "text": "text", "url": "url" } }
```

### Launch Handler

Reuses the existing app window instead of opening a second tab:
```json
{ "client_mode": "navigate-existing" }
```

### Window Controls Overlay

`window-controls-overlay` is first in `display_override`. On desktop Chromium PWA installs, the title bar area becomes part of the CSS drawing surface.

---

## 22. Update Lifecycle

```
User visits app
  → SW checks /sw.js hash in background
    → New version found → new SW downloads + installs
      → onNeedRefresh(reloadFn) fires
        → 'pwa-update-available' event dispatched with reloadFn
          → PWAUpdatePrompt toast appears (bottom of screen)
            → User clicks "Refresh"
                → reloadFn() → SW.skipWaiting() → clients.claim()
                  → Page reloads with new version
            → User dismisses
                → Old SW continues until next full page load
```

---

## 23. Icons & Splash Screen

### Icon Set

| File | Size | Purpose |
|---|---|---|
| `icon-72x72.png` | 72×72 | Android legacy |
| `icon-96x96.png` | 96×96 | Shortcut icons |
| `icon-128x128.png` | 128×128 | Chrome Web Store |
| `icon-144x144.png` | 144×144 | Windows tile |
| `icon-152x152.png` | 152×152 | Apple Touch (iPad) |
| `icon-192x192.png` | 192×192 | Android home screen (`any`) |
| `icon-384x384.png` | 384×384 | High-DPI Android |
| `icon-512x512.png` | 512×512 | Play Store / splash (`any`) |
| `icon-512x512-maskable.png` | 512×512 | Android adaptive icon (`maskable`) |

The maskable icon has the lightning bolt centered within the 80% safe zone — renders correctly under all Android mask shapes (circle, squircle, teardrop).

### Splash Screen (`src/components/SplashScreen.tsx`)

Renders once per browser session (controlled via `sessionStorage`). Total duration ~2.4 seconds:

1. Lightning bolt scales + fades in (spring easing)
2. Amber glow pulses behind the bolt
3. "THUNDERBOLD" text expands with letter-spacing animation
4. "CURATED FASHION" tagline fades in
5. Amber sweep bar progresses across the bottom
6. Full screen fades out

All animations use GPU-composited transforms — no layout thrash. Does not block React Suspense.

---

## 24. Deployment — Vercel

### Build Settings

| Setting | Value |
|---|---|
| Build Command | `npm run build` |
| Output Directory | `dist/` |
| Node.js Version | 20.x |

### Routing (`vercel.json`)

```
Rewrites (in order):
  1. /api/admin/analytics/* → /api/admin?subpath=*
  2. /api/orders/create|cancel|manage → /api/orders?subpath=*
  3. /api/* → Vercel serverless functions
  4. /(.*) → /index.html  (SPA fallback — static files evaluated first)

Static file headers:
  /sw.js           → no-cache + Service-Worker-Allowed: /
  /workbox-*.js    → no-cache
  /icons/*         → immutable 1-year cache
  /screenshots/*   → 1-day cache
```

Zero-cache on the service worker ensures new deployments propagate immediately.

### Serverless Function Layout

12 handler files in `api/` map to Vercel serverless functions. The consolidated handler pattern (one file per resource, sub-routes resolved via URL/query parsing) stays within the Vercel Hobby 12-function limit.

---

## 25. TWA / Play Store Readiness

### Manifest Checklist

- `id: '/'` — stable app identity
- `display: 'standalone'` — required for TWA
- Maskable icon at 512×512
- `theme_color` + `background_color` for splash/status bar
- Valid service worker at root scope (`/`)

### Generating the APK

**Via PWABuilder (web UI):**
1. Visit [PWABuilder.com](https://www.pwabuilder.com)
2. Enter production URL: `https://thunderbolddenim.com`
3. Package for stores → Android → Download `.aab`
4. Upload to Google Play Console

**Via Bubblewrap (CLI):**
```bash
npm install -g @bubblewrap/cli
bubblewrap init --manifest https://thunderbolddenim.com/manifest.webmanifest
bubblewrap build
```

### Digital Asset Links

After generating your signing key fingerprint, create `public/.well-known/assetlinks.json`:

```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "YOUR.PACKAGE.NAME",
    "sha256_cert_fingerprints": ["YOUR:SHA256:FINGERPRINT"]
  }
}]
```

---

## 26. Database Schema Summary

**MongoDB Atlas** — database: `thunderbold` — 9 collections

| Collection | Description |
|---|---|
| `products` | Product catalogue (standard + outfit variants) |
| `orders` | Customer orders with embedded product + address snapshots |
| `returns` | Return requests with admin approval/rejection workflow |
| `users` | User profiles with embedded addresses + FCM tokens |
| `cart` | Per-user cart (one document per user) |
| `wishlist` | Per-user wishlist (one document per user) |
| `categories` | Category records (admin-managed lookup table) |
| `brands` | Brand records (admin-managed lookup table) |
| `reviews` | Per-product customer reviews (soft-deleted) |

See `DATABASE.md` for full field-level schemas, indexes, query patterns, integrity mechanisms, and PostgreSQL migration readiness assessment.

---

## 27. Pricing System

| Field | Visibility | Purpose |
|---|---|---|
| `price` | Public | Actual selling price (INR) |
| `mrp` | Public | Original / crossed-out price shown to customers |
| `purchasePrice` | Admin only | Internal cost for profit calculations |

`src/lib/pricing.ts` → `computePrice(price, mrp)` derives the discount percentage dynamically. `purchasePrice` is stripped from all non-admin API responses via MongoDB projection — it never reaches the client.

---

## 28. Edge Cases Handled

| Case | Handling |
|---|---|
| Old products with `purchasePrice` as MRP | `mrp: doc.mrp ?? doc.purchasePrice ?? null` — no migration needed |
| Products with no `purchasePrice` | Excluded from profit calculations — no division by zero |
| Out-of-stock sizes | Size buttons disabled; atomic stock check on order create |
| Order cancellation | Restores `sizeStock` per size + total `stock` |
| Return approval | Restores `sizeStock` per size (size-aware, outfit-aware) |
| Mid-checkout SW update | `registerType: 'prompt'` — user decides when to reload |
| Stale JS chunks after deploy | Content-hash filenames + `cleanupOutdatedCaches: true` |
| API offline | `NetworkOnly` — no stale API data ever served |
| Navigation offline (uncached) | Served from precached `index.html` (SPA shell) |
| SW not supported | `'serviceWorker' in navigator` guard in `main.tsx` |
| PWA register import failure | try/catch in `main.tsx` — app works without SW |
| Duplicate app windows | `launch_handler: navigate-existing` prevents it |
| Duplicate FCM notifications | `deviceId` deduplication in DB; one active token per device |
| Stale FCM tokens | Automatically pruned from DB on first failed send attempt |
| Duplicate order on retry | `clientOrderId` sparse unique index — returns existing order |
| Race condition on stock | `$gte` guard + compensation rollback on `modifiedCount === 0` |
| Return on non-delivered order | 400 error with current status in message |
| Duplicate return request | 409 Conflict with existing return ID + status |

---

## 29. Troubleshooting

### Service Worker Not Detected by PWABuilder

- Must test the **production URL**, not localhost
- SW is only generated by `npm run build` — dev mode has no SW
- Confirm `dist/sw.js` exists and `Content-Type` is `application/javascript` (not `text/html`)

### Install Prompt Not Appearing

- Must be served over HTTPS
- Chrome has an engagement heuristic (2+ visits, 30+ second sessions)
- Check DevTools → Application → Manifest for parsing errors
- Confirm 192×192 (`any`) and 512×512 (`maskable`) icons are present

### Blank Screen After Deploy

- A stale SW may be serving an old `index.html` referencing deleted chunk hashes
- DevTools → Application → Service Workers → Unregister → hard refresh
- The `prompt` strategy prevents this in most cases since users get a "Refresh" button

### API Calls Failing Offline

- Expected — `NetworkOnly` ensures no stale data
- UI shows error/empty state — not a crash

### FCM Notifications Not Arriving

- Check that `FIREBASE_SERVICE_ACCOUNT` is set on the server
- Verify the browser has granted notification permission
- Check DevTools → Application → Service Workers — SW must be active
- Test via `POST /api/notifications/test-send` with a valid Bearer token

### MongoDB Connection Error on Startup

- `MONGO_URI` secret not set — all data endpoints return 500
- Verify Atlas cluster is running and IP allowlist includes `0.0.0.0/0` (or Replit's IP range)

---

## Copyright

Copyright © 2026 ThunderBold Private Limited. All rights reserved.

This repository and its contents are proprietary. No permission is granted to copy, modify, distribute, sublicense, sell, or commercially use any part of this software without prior written permission from ThunderBold Private Limited.

See [LICENSE](LICENSE) for the full proprietary license terms.

---

*Thunderbold — Premium Indian Fashion. Built for the Bold.*

> Last updated: June 18, 2026
