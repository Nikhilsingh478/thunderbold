# Thunderbold — Master Technical Documentation

> Production-grade e-commerce PWA for curated Indian streetwear & fashion.
> Stack: React 18 + Vite · Express · MongoDB Atlas · Firebase Auth · Cloudinary · Workbox PWA

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
9. [Cart & Wishlist](#9-cart--wishlist)
10. [Review System](#10-review-system)
11. [Admin Panel & Analytics](#11-admin-panel--analytics)
12. [PWA Configuration](#12-pwa-configuration)
13. [Performance Architecture](#13-performance-architecture)
14. [Security Model](#14-security-model)
15. [Deployment](#15-deployment)
16. [Future Roadmap](#16-future-roadmap)

---

## 1. Project Overview

**Thunderbold** is a mobile-first Progressive Web App (PWA) for a curated Indian fashion brand selling denim, shirts, t-shirts, kurtas, and outfits. It is designed to feel like a native Android app — installable, offline-capable, and fast on low-bandwidth connections.

### Key Characteristics

| Attribute          | Value                                                       |
|--------------------|-------------------------------------------------------------|
| Brand              | Thunderbold                                                 |
| Domain             | thunderbolddenim.com                                        |
| Support email      | support@thunderbolddenim.com                                |
| Instagram          | @thunderbold.shop                                           |
| Target market      | India (INR pricing, 6-digit pincodes, 10-digit phones)      |
| Payment model      | Cash on Delivery (COD) only — no payment gateway            |
| Product sections   | denim · shirts · t-shirts · kurtas · outfits · live-sale    |
| PWA install        | Yes — Play Store TWA-ready, desktop window-controls-overlay |

---

## 2. Repository Structure

```
thunderbold/
├── api/                        # Express/Vercel serverless handlers
│   ├── _lib/                   # Shared utilities
│   │   ├── mongodb.js          # Connection pool + index bootstrap
│   │   ├── firebaseAdmin.js    # Token verification (server-side)
│   │   ├── adminHelper.js      # Admin role resolution
│   │   ├── rateLimit.js        # In-memory IP rate limiter
│   │   ├── response.js         # Standardised response helpers
│   │   └── validator.js        # Address / order / phone validators
│   ├── orders/index.js         # Orders CRUD + stock management
│   ├── users/index.js          # User profile + address book
│   ├── products/index.js       # Product catalogue (public read, admin write)
│   ├── products/[id].js        # Single product by MongoDB ObjectId
│   ├── cart/index.js           # Per-user cart (server-synced)
│   ├── wishlist/index.js       # Per-user wishlist
│   ├── reviews/index.js        # Verified-purchase review system
│   ├── categories/index.js     # Category management
│   ├── brands/index.js         # Brand management
│   ├── address/index.js        # Address management
│   ├── slider.js               # Homepage banner slider data
│   └── admin.js                # Analytics dashboard endpoint
├── src/
│   ├── AppContent.tsx          # BrowserRouter + route definitions
│   ├── App.tsx                 # Root provider tree
│   ├── main.tsx                # Vite entry point + PWA SW registration
│   ├── context/
│   │   ├── AuthContext.tsx     # Firebase auth state + DB sync
│   │   ├── CartContext.tsx     # Cart state with server sync
│   │   └── WishlistContext.tsx # Wishlist state with server sync
│   ├── lib/
│   │   ├── firebase.ts         # Firebase client SDK initialisation
│   │   ├── storage.ts          # LocalStorage cart/wishlist fallback
│   │   ├── ordersCache.ts      # Background prefetch + TanStack cache warm
│   │   ├── requireAuth.ts      # Pending action gating behind auth
│   │   └── modalController.ts  # Event bus for login modal
│   ├── pages/                  # Route-level page components
│   ├── components/             # Shared UI components
│   └── utils/                  # Formatting and helper utilities
├── public/
│   ├── icons/                  # PWA icon set (72px → 512px + maskable)
│   ├── screenshots/            # PWA install screenshots (narrow + wide)
│   ├── offline.html            # Custom offline fallback page
│   ├── sitemap.xml             # Static sitemap for search indexing
│   └── robots.txt              # Crawler rules
├── server.js                   # Express server (port 3001) — dev + production
├── vite.config.ts              # Vite + VitePWA plugin + /api proxy config
├── index.html                  # Entry HTML (SEO meta, JSON-LD schema)
├── tailwind.config.ts          # Tailwind + custom design tokens
└── package.json
```

---

## 3. Environment & Secrets

All secrets are managed as environment variables. **Never commit these values.**

| Variable                            | Used By                        | Description                                     |
|-------------------------------------|--------------------------------|-------------------------------------------------|
| `MONGO_URI`                         | `api/_lib/mongodb.js`          | MongoDB Atlas connection string                 |
| `FIREBASE_SERVICE_ACCOUNT`          | `api/_lib/firebaseAdmin.js`    | Stringified Firebase service account JSON       |
| `VITE_FIREBASE_API_KEY`             | `src/lib/firebase.ts`          | Firebase public API key                         |
| `VITE_FIREBASE_AUTH_DOMAIN`         | `src/lib/firebase.ts`          | Firebase auth domain                            |
| `VITE_FIREBASE_PROJECT_ID`          | `src/lib/firebase.ts`          | Firebase project ID                             |
| `VITE_FIREBASE_STORAGE_BUCKET`      | `src/lib/firebase.ts`          | Firebase storage bucket                         |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `src/lib/firebase.ts`          | Firebase messaging sender ID                    |
| `VITE_FIREBASE_APP_ID`              | `src/lib/firebase.ts`          | Firebase app ID                                 |

> `VITE_*` variables are embedded into the frontend bundle at build time by Vite. Firebase client SDK keys are designed to be public.
>
> `FIREBASE_SERVICE_ACCOUNT` and `MONGO_URI` are server-only secrets and must **never** carry the `VITE_` prefix.

---

## 4. Frontend Architecture

### 4.1 Tech Stack

| Library           | Role                                                    |
|-------------------|---------------------------------------------------------|
| React 18          | UI rendering                                            |
| Vite + SWC        | Build toolchain (SWC is faster than Babel)              |
| Tailwind CSS 3    | Utility-first styling                                   |
| TanStack Query 5  | Server state, caching, background refetch               |
| React Router DOM 6| Client-side routing                                     |
| Framer Motion     | Animations and page transitions                         |
| Lucide React      | Icon set                                                |
| Sonner            | Toast notifications                                     |
| vite-plugin-pwa   | Workbox service worker generation                       |

### 4.2 Provider Tree

```
<QueryClientProvider>          ← TanStack Query global client
  <AuthProvider>               ← Firebase auth state + DB sync on login
    <CartProvider>             ← Cart state (server-synced + localStorage)
      <WishlistProvider>       ← Wishlist state (server-synced + localStorage)
        <BrowserRouter>
          <AppContent />       ← Routes + login modal + splash screen
        </BrowserRouter>
      </WishlistProvider>
    </CartProvider>
  </AuthProvider>
</QueryClientProvider>
```

### 4.3 Routing

Routes are defined in `src/AppContent.tsx`. Heavy pages are wrapped with `React.lazy()` to enable code splitting — each becomes its own JS chunk, loaded on demand.

| Path                    | Component       | Strategy |
|-------------------------|-----------------|----------|
| `/`                     | `Index`         | Eager    |
| `/about`                | `About`         | Eager    |
| `/category/:id`         | `CategoryView`  | Eager    |
| `/product/:id`          | `ProductView`   | Lazy     |
| `/cart`                 | `Cart`          | Lazy     |
| `/checkout`             | `Checkout`      | Lazy     |
| `/orders`               | `Orders`        | Lazy     |
| `/wishlist`             | `Wishlist`      | Lazy     |
| `/profile`              | `Profile`       | Lazy     |
| `/admin`                | `Admin`         | Lazy     |
| `/deals/:slug`          | `DealsPage`     | Lazy     |
| `/brands`               | `BrandsPage`    | Lazy     |
| `/brands/:id`           | `BrandView`     | Lazy     |
| `/policies/:slug`       | `Policies`      | Lazy     |
| `*`                     | `NotFound`      | Eager    |

A branded `<PageLoader />` (bolt icon + shimmer bar on `#0a0a0a`) is shown via `<Suspense>` during lazy chunk loads.

### 4.4 State Management

**Server state** is managed entirely by TanStack Query (`useQuery` / `useMutation`). This handles caching, deduplication, background refetching, and loading/error states for products, orders, and user profile data.

**Client state** for cart and wishlist uses React `useReducer` inside context providers. Both:
- Read from `localStorage` immediately on mount (zero-latency initial render for returning users)
- Sync to MongoDB once the user authenticates
- Fall back to localStorage-only for anonymous users

**Auth state** wraps Firebase's `onAuthStateChanged` in `AuthContext`. On every login (any method), the user record is upserted in MongoDB via `POST /api/users`.

### 4.5 Login Modal System

A custom event bus (`src/lib/modalController.ts`) lets any component trigger the login modal without prop drilling. Three trigger sources:

| Source          | Condition                                                       |
|-----------------|-----------------------------------------------------------------|
| `requireAuth`   | User action (add to cart / wishlist) while unauthenticated      |
| `delayedPrompt` | 10 seconds after page load for unauthenticated visitors (once per session) |
| `manual`        | User clicks a sign-in button directly                           |

After login, any stored pending action is automatically re-executed via `executeStoredAction()` in `src/lib/requireAuth.ts`.

---

## 5. Backend Architecture

### 5.1 Server

`server.js` runs an Express application on **port 3001**. Each API route dynamically imports its handler module on the first request (avoids ESM circular dependency issues and keeps the startup fast).

During development, Vite's dev server on **port 5000** proxies all `/api/*` requests to `localhost:3001`. Frontend code always uses relative `/api/...` URLs — no environment-specific URL configuration required.

```
Browser / Vite dev server (:5000)
          ↓  /api/* (proxied)
    Express server (:3001)
          ↓  dynamic import
    api/<resource>/index.js
          ↓
    MongoDB Atlas  ←→  Firebase Admin SDK
```

In production (Vercel), each file in `api/` becomes a serverless function and the Vite proxy is not used. The consolidated handler pattern (one file per resource, sub-routes resolved via URL/query parsing) was designed specifically to stay within Vercel Hobby's 12-function limit.

### 5.2 Shared Library Modules

**`api/_lib/mongodb.js`**
- Singleton pool cached in `global.mongo` to survive serverless cold starts
- Pool: `maxPoolSize: 10`, `minPoolSize: 2`, `serverSelectionTimeoutMS: 5000`
- Database name: `thunderbold`
- Bootstraps all required indexes asynchronously on first connection (non-blocking)

**`api/_lib/firebaseAdmin.js`**
- Initialises Firebase Admin SDK from `FIREBASE_SERVICE_ACCOUNT` (JSON string)
- `verifyFirebaseToken(token)` — cryptographic token verification with revocation checking
- **No insecure fallback**: throws `401` on invalid token, `503` if SDK is unconfigured

**`api/_lib/adminHelper.js`**
- `isAdmin(email, db)` — two-step resolution:
  1. DB lookup: `users.role === 'admin'`
  2. Hardcoded allowlist fallback: `ADMIN_EMAILS` array

**`api/_lib/rateLimit.js`**
- In-memory sliding-window limiter: 10 req/min per IP
- IP extracted from `X-Forwarded-For` → `X-Real-IP` → socket address
- Stale entries purged every 5 minutes

**`api/_lib/validator.js`**
- `validateAddress()` — validates all 6 address fields
- `validatePhone()` — 10-digit India format
- `validatePincode()` — 6-digit India format
- Returns `{ isValid: boolean, errors: string[] }`

---

## 6. Authentication System

### 6.1 Client-Side (Firebase Auth)

`src/lib/firebase.ts` initialises the Firebase client SDK with `browserLocalPersistence` — users stay logged in across sessions.

Supported sign-in methods:
- **Google OAuth** — `signInWithPopup` + `GoogleAuthProvider` (always shows account picker via `prompt: 'select_account'`)
- **Email + Password** — `signInWithEmailAndPassword` / `createUserWithEmailAndPassword`

After every successful sign-in, `AuthContext.syncUserWithDatabase()` calls `POST /api/users` with `{ uid, email, name }` to upsert the user record.

### 6.2 Server-Side Token Verification

Every protected endpoint extracts the token from `Authorization: Bearer <token>` and calls `verifyFirebaseToken(token)`. The decoded payload provides `{ email, uid, ...claims }`.

**Note on user identity**: Cart, wishlist, and orders use `email` as the `userId` in MongoDB rather than Firebase `uid`. This is intentional — Firebase UIDs can change on account re-linking, but email is stable for COD order tracking.

### 6.3 Admin Access

Admin endpoints additionally call `isAdmin(email, db)`. Two routes to admin status:
1. **DB role**: set `role: 'admin'` on the user's MongoDB document
2. **Hardcoded allowlist**: add email to `ADMIN_EMAILS` in `api/_lib/adminHelper.js`

The DB check runs first; the hardcoded list is the fallback.

### 6.4 Auth Flow

```
User attempts protected action
        │
        ├── Not authenticated → Store pending action → Open login modal
        │
        └── Authenticated ─────────────────────────────────────┐
                                                                │
                  Firebase ID token → Authorization header      │
                        │                                       │
                  verifyFirebaseToken(token)                    │
                    ├── Fail → 401 Unauthorized                 │
                    └── Pass → { email, uid }                   │
                                    │                           │
                             Admin endpoint?                    │
                               ├── Yes → isAdmin() → 403 if No │
                               └── No  → Proceed ──────────────┘
```

---

## 7. Data Layer — API Reference

All endpoints accept and return JSON. Protected endpoints require `Authorization: Bearer <firebase-id-token>`.

### Products

| Method | Path                             | Auth   | Description                                       |
|--------|----------------------------------|--------|---------------------------------------------------|
| GET    | `/api/products`                  | Public | All products; supports `?section=` and `?maxPrice=` filters |
| GET    | `/api/products/:id`              | Public | Single product by MongoDB ObjectId                |
| POST   | `/api/products`                  | Admin  | Create product                                    |
| PUT    | `/api/products?id=:id`           | Admin  | Full replace of product                           |
| DELETE | `/api/products?id=:id`           | Admin  | Hard delete product                               |

> Admin GET requests include `purchasePrice` (internal cost). Public GETs never expose this field.

### Orders

| Method | Path                          | Auth       | Description                           |
|--------|-------------------------------|------------|---------------------------------------|
| GET    | `/api/orders`                 | User/Admin | Own orders; all orders for admin      |
| POST   | `/api/orders/create`          | User       | Create order with stock validation    |
| PUT    | `/api/orders/cancel`          | User/Admin | Cancel order + restore stock          |
| PATCH  | `/api/orders/manage?id=:id`   | Admin      | Update order status                   |
| DELETE | `/api/orders/manage?id=:id`   | Admin      | Delete order record                   |

### Users

| Method | Path         | Auth  | Description                                             |
|--------|--------------|-------|---------------------------------------------------------|
| GET    | `/api/users` | User  | Fetch own profile (looked up by Firebase UID)           |
| POST   | `/api/users` | Open  | Create/sync user on login (no token required for upsert)|
| PATCH  | `/api/users` | User  | Update name/phone, or set default address               |
| DELETE | `/api/users` | User  | Remove address from address book                        |

### Cart

| Method | Path        | Auth | Description             |
|--------|-------------|------|-------------------------|
| GET    | `/api/cart` | User | Fetch cart items        |
| POST   | `/api/cart` | User | Replace entire cart     |
| DELETE | `/api/cart` | User | Clear cart              |

### Wishlist

| Method | Path            | Auth | Description             |
|--------|-----------------|------|-------------------------|
| GET    | `/api/wishlist` | User | Fetch wishlist items    |
| POST   | `/api/wishlist` | User | Replace entire wishlist |
| DELETE | `/api/wishlist` | User | Clear wishlist          |

### Reviews

| Method | Path                                        | Auth       | Description                                  |
|--------|---------------------------------------------|------------|----------------------------------------------|
| GET    | `/api/reviews?productId=:id`                | Public     | Active reviews for a product                 |
| GET    | `/api/reviews?mine=true`                    | User       | All of current user's reviews                |
| GET    | `/api/reviews?mine=true&productId=:id`      | User       | Own review + purchase eligibility flag       |
| POST   | `/api/reviews`                              | User       | Submit review (requires delivered order)     |
| PUT    | `/api/reviews?id=:id`                       | User       | Edit own review (rating/comment)             |
| DELETE | `/api/reviews?id=:id`                       | User/Admin | Soft-delete review                           |

### Other Endpoints

| Method | Path                      | Auth   | Description                         |
|--------|---------------------------|--------|-------------------------------------|
| GET    | `/api/categories`         | Public | List all categories                 |
| POST/PUT/DELETE | `/api/categories` | Admin | Manage categories              |
| GET    | `/api/brands`             | Public | List all brands                     |
| POST/PUT/DELETE | `/api/brands`     | Admin  | Manage brands                       |
| GET    | `/api/slider`             | Public | Homepage banner slider entries      |
| GET    | `/api/admin/analytics`    | Admin  | Full analytics dashboard payload    |

---

## 8. Order Management System

### 8.1 Order Lifecycle

```
pending → confirmed → shipped → delivered
    └──────────────────────────→ cancelled
```

`delivered` orders cannot be cancelled. Only admins can advance status via `PATCH /api/orders/manage`.

### 8.2 Order Creation Flow (`POST /api/orders/create`)

Executes these steps in sequence:

1. **Rate limit** — rejects if IP exceeds 10 req/min
2. **Auth** — verifies Firebase token; binds `email` as `userId`
3. **Idempotency** — if `clientOrderId` matches an existing order, returns the existing record immediately (prevents duplicate orders from retries / double-taps)
4. **Request validation** — validates products array structure, address fields, payment method
5. **Pre-flight stock check** — fetches each product from DB; verifies `sizeStock[size] >= quantity`. Outfit products check both `topwear.sizeStock[topwearSize]` and `bottomwear.sizeStock[bottomwearSize]`
6. **Gift message sanitisation** — strips HTML tags, trims, caps at 300 chars
7. **Order insertion** — inserts document with `status: "pending"` and computed `totalAmount`
8. **Atomic stock decrement** — uses MongoDB `$inc` with a conditional filter (`$gte` guard) to prevent overselling. Both `sizeStock[size]` and aggregate `stock` fields are decremented together
9. **Compensation rollback** — if any decrement fails (race condition), all previously decremented items are restored and the order document is deleted. Returns `409 Conflict`

### 8.3 Outfit Product Stock Model

Outfit products maintain a bifurcated stock structure:

```json
{
  "topwear":    { "sizeStock": { "S": 5, "M": 3 }, "stock": 8 },
  "bottomwear": { "sizeStock": { "28": 4, "30": 6 }, "stock": 10 },
  "stock": 8
}
```

`root.stock = min(topwear.stock, bottomwear.stock)` — the bottleneck component determines available outfit quantity.

### 8.4 Order Cancellation (`PUT /api/orders/cancel`)

Ownership-checked (users can only cancel their own orders; admins can cancel any). Restores stock for every item using the same size-aware logic as creation. Stock restoration is best-effort — individual item failures are logged but do not block the cancellation.

---

## 9. Cart & Wishlist

Both follow the same sync pattern:

- **Anonymous users**: items stored in `localStorage` only
- **Authenticated users**: items synced to MongoDB (keyed by `userId = email`)
- **On login**: localStorage items are merged with server items (deduplicated by `productId + size`)
- **Write strategy**: the entire array is replaced on every update

Required cart item fields: `productId`, `name`, `price` (number), `image`, `size`, `quantity` (positive integer).

Required wishlist item fields: `productId`, `name`, `price` (number), `image`.

Both APIs use full `verifyFirebaseToken` cryptographic verification.

---

## 10. Review System

### Eligibility Gate

Only users who have received (order `status === "delivered"`) the specific product can submit a review. Verified server-side on every `POST`.

### Deduplication

One active review per `(userId, productId)` pair. Duplicate `POST` returns `409 Conflict` with the existing review so the client can switch to edit mode.

### Soft Delete

Reviews are never hard-deleted. `DELETE` sets `isDeleted: true`. All public and user-scoped `GET` queries filter `{ isDeleted: { $ne: true } }`. Admins can soft-delete any review; owners can only delete their own.

---

## 11. Admin Panel & Analytics

### 11.1 Access

`/admin` loads `src/pages/Admin.tsx` (lazy). Every admin API call includes the Firebase Bearer token. The backend verifies admin status on every request — no session-based admin caching.

### 11.2 Analytics Endpoint (`GET /api/admin/analytics`)

Query params:
- `?range=7d` — last 7 days
- `?range=30d` — last 30 days
- `?month=YYYY-MM` — specific calendar month
- (default) — current calendar month

Response shape:

| Key             | Description                                                              |
|-----------------|--------------------------------------------------------------------------|
| `overview`      | `totalRevenue`, `netRevenue`, `totalOrders`, `averageOrderValue`, `totalUsers`, `totalProfit`, `netProfit` |
| `revenueSeries` | Per-day `{ day, revenue }` array for the selected range                  |
| `ordersSeries`  | Per-day `{ day, count }` array for the selected range                    |
| `topProducts`   | Top 5 products by units sold in the range (with image + price)           |
| `stockAlerts`   | Products with `stock ≤ 5`, split into `outOfStock` and `lowStock`        |
| `recentOrders`  | Latest 5 orders (all time) with customer name, total, and item count     |

### 11.3 Profit Calculation

Calculated via MongoDB aggregation pipeline:
- Filters `status: { $in: ["delivered", "completed"] }` only
- `$lookup` joins each order item with `products.purchasePrice`
- Excludes items where `purchasePrice` is null/missing
- Formula: `profit = (sellingPrice − purchasePrice) × quantity`
- Two values returned: `totalProfit` (within the date range) and `netProfit` (all-time)

`purchasePrice` is stripped from all public product API responses — it never reaches non-admin clients.

---

## 12. PWA Configuration

Configured in `vite.config.ts` using `vite-plugin-pwa` with Workbox `generateSW` strategy.

### 12.1 Service Worker Behaviour

| Setting             | Value                  | Reason                                            |
|---------------------|------------------------|---------------------------------------------------|
| `strategies`        | `generateSW`           | Workbox manages SW fully; no custom SW maintenance|
| `skipWaiting`       | `true`                 | New SW activates immediately on install           |
| `clientsClaim`      | `true`                 | New SW takes control of all open tabs             |
| `devOptions.enabled`| `false`                | Avoids conflicts with Vite HMR + API proxy        |
| `navigateFallback`  | `/index.html`          | SPA: all navigation returns the app shell         |
| `navigateFallbackDenylist` | `/^\/api\//` | API requests always bypass SW                     |

### 12.2 Runtime Caching Strategy

| Resource                     | Handler               | Cache                     | TTL / Cap           |
|------------------------------|-----------------------|---------------------------|---------------------|
| `/api/*`                     | `NetworkOnly`         | —                         | Never cached        |
| JS / CSS / HTML / fonts      | Precache (build time) | Workbox managed           | Indefinite          |
| Google Fonts CSS             | `StaleWhileRevalidate`| `tb-google-fonts-css`     | 7 days / 8 entries  |
| Google Fonts binary          | `CacheFirst`          | `tb-google-fonts-files`   | 365 days / 30 entries |
| Cloudinary images            | `CacheFirst`          | `tb-cloudinary-images`    | 30 days / 120 entries |
| Local static images          | `CacheFirst`          | `tb-static-images`        | 30 days / 60 entries  |

API routes are always `NetworkOnly`. Stale auth, cart, or order data would corrupt checkout.

### 12.3 Web App Manifest

| Property              | Value                                                     |
|-----------------------|-----------------------------------------------------------|
| `id`                  | `/` (stable across deployments)                           |
| `name`                | Thunderbold                                               |
| `display`             | `standalone`                                              |
| `display_override`    | `window-controls-overlay` → `standalone` → `minimal-ui`  |
| `theme_color`         | `#0a0a0a`                                                 |
| `lang`                | `en-IN`                                                   |
| `share_target`        | Receives shared URLs via OS share sheet (`/?share_url=…`) |
| `launch_handler`      | `navigate-existing` — reuses open window on re-launch     |
| `shortcuts`           | Cart · Wishlist · Orders · Deals/Under-999                |
| `related_applications`| Play Store TWA (app ID + SHA-256 fingerprint)             |

Icons: 9 sizes (72×72 → 512×512) including a maskable variant for Android adaptive icons.

Screenshots: `narrow` (540×960 mobile) and `wide` (1280×800 desktop) for browser install dialogs.

---

## 13. Performance Architecture

### 13.1 Code Splitting

All heavy pages use `React.lazy()` and become separate Rollup output chunks loaded on demand. Eager-loaded pages (Index, About, CategoryView, NotFound) are on the critical first-paint path.

### 13.2 Image Strategy

All product images are hosted on **Cloudinary** — CDN-distributed, format-optimised, and served via transformation URLs. After first load, Workbox caches them for 30 days. This means repeat visitors load images from disk even while offline.

### 13.3 Orders Cache Prefetch

`src/lib/ordersCache.ts` uses `requestIdleCallback` (with `setTimeout` fallback) to prefetch the orders list into TanStack Query's cache during idle time after login. The Orders page opens instantly from cache with no visible loading state.

### 13.4 Database Indexes

Bootstrapped asynchronously on first MongoDB connection. All performance-critical access patterns are covered:

| Collection | Index Fields                                   | Options         |
|------------|------------------------------------------------|-----------------|
| `orders`   | `{ userId: 1 }`                                |                 |
| `orders`   | `{ createdAt: -1 }`                            |                 |
| `orders`   | `{ clientOrderId: 1 }`                         | sparse + unique |
| `products` | `{ categoryId: 1 }`                            |                 |
| `cart`     | `{ userId: 1 }`                                | unique          |
| `wishlist` | `{ userId: 1 }`                                | unique          |
| `reviews`  | `{ productId: 1, isDeleted: 1, createdAt: -1 }`|                 |
| `reviews`  | `{ userId: 1, isDeleted: 1 }`                  |                 |
| `reviews`  | `{ userId: 1, productId: 1 }`                  |                 |

---

## 14. Security Model

### 14.1 Authentication Security

- All state-changing endpoints require a cryptographically verified Firebase ID token
- Token revocation checking is enabled (`verifyIdToken(token, true)`)
- **No insecure fallback**: unconfigured Firebase Admin SDK returns `503`, not a pass-through
- Tokens are short-lived (1 hour); Firebase auto-refreshes via the client SDK

### 14.2 HTTP Security Headers

Applied globally by Express middleware on every response:

```
X-Content-Type-Options:  nosniff
X-Frame-Options:         DENY
X-XSS-Protection:        1; mode=block
Referrer-Policy:         strict-origin-when-cross-origin
Cross-Origin-Resource-Policy: cross-origin
```

### 14.3 Rate Limiting

Applied to high-risk write endpoints:

| Endpoint                  | Limit              |
|---------------------------|--------------------|
| `POST /api/orders/create` | 10 req/min per IP  |
| `POST /api/cart`          | 10 req/min per IP  |
| `POST /api/wishlist`      | 10 req/min per IP  |
| `POST /api/reviews`       | 10 req/min per IP  |

> The current implementation is in-memory. It resets on server restart and does not coordinate across multiple instances. For a multi-instance production deployment, replace with Redis-backed rate limiting (e.g. `rate-limiter-flexible` + `ioredis`).

### 14.4 Input Sanitisation

| Input           | Sanitisation Applied                                        |
|-----------------|-------------------------------------------------------------|
| Gift message    | HTML tags stripped, trimmed, max 300 chars                  |
| Review comment  | Trimmed, max 1000 chars                                     |
| Phone number    | Non-digit characters stripped before storage                |
| Pincode         | Non-digit characters stripped before storage                |
| Product prices  | `purchasePrice` stripped from public GET responses          |

### 14.5 Privilege Isolation

- `purchasePrice` is never returned to non-admin callers
- Admin status is verified on every admin request — no session caching
- Users can cancel only their own orders (ownership check: `order.userId !== userEmail`)
- Users can edit/delete only their own reviews (ownership check: `review.userId === userId`)
- Admin PATCH on orders rejects any status outside the valid set (`pending`, `confirmed`, `shipped`, `delivered`)

---

## 15. Deployment

### Development (Replit / Local)

Two concurrent processes:

```bash
# Terminal 1: API server
node server.js          # port 3001

# Terminal 2: Frontend dev server
vite                    # port 5000 — proxies /api/* to :3001
```

Vite's proxy (`vite.config.ts`) forwards all `/api/*` requests to port 3001. Frontend code uses only relative `/api/` URLs — no environment-specific URL switching needed.

### Production (Vercel)

- `api/` directory — deployed as Vercel serverless functions (one function per file)
- `dist/` — Vite build output served as a static site
- `vercel.json` rewrites: `/api/**` → serverless functions; `/*` → `dist/index.html`

The consolidated handler pattern (one file per resource, sub-routes resolved via URL/query) was designed to stay within Vercel Hobby's 12-function cap.

### Android (Play Store — Trusted Web Activity)

The PWA manifest includes:
- `related_applications` entry with Play Store `id: 'app.vercel.thunderbold.twa'`
- SHA-256 certificate fingerprint for Digital Asset Links verification

Use [PWABuilder](https://www.pwabuilder.com) or Bubblewrap to generate the Android APK and publish to the Play Store. The existing `Thunderbolt.apk` in `public/` is a direct download link for sideloading.

---

## 16. Future Roadmap

| Feature                   | Notes                                                                    |
|---------------------------|--------------------------------------------------------------------------|
| Push notifications        | FCM service worker is primed; needs `firebase-messaging` init in SW + subscription backend endpoint + admin send UI |
| Redis rate limiting       | Required for multi-instance production deployments                       |
| Payment gateway           | Razorpay or PhonePe; requires backend webhook handler + `paymentStatus` field on orders |
| Order tracking            | Real-time status via WebSocket or SSE push from admin status updates     |
| Email receipts            | Order confirmation emails via Resend or SendGrid                         |
| Low-stock webhooks        | Push admin alerts when stock drops below threshold                       |
| Product search            | MongoDB Atlas Search for full-text + filter search across product catalogue |
| Discount / coupon codes   | Coupon collection with usage limits, expiry, and per-user redemption tracking |
| Multi-instance rate limit | Redis-backed `rate-limiter-flexible` replacing in-memory store           |
| PostgreSQL migration      | See `DATABASE.md` for full migration readiness assessment and schema mapping |
