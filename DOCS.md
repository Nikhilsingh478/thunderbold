# Thunderbolt — Hyperdetailed Technical Documentation

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Environment Variables & Secrets](#3-environment-variables--secrets)
4. [Repository Structure](#4-repository-structure)
5. [Running the App](#5-running-the-app)
6. [Frontend Architecture](#6-frontend-architecture)
   - 6.1 [Entry Point & Provider Tree](#61-entry-point--provider-tree)
   - 6.2 [Routing & Code Splitting](#62-routing--code-splitting)
   - 6.3 [AuthContext](#63-authcontext)
   - 6.4 [CartContext](#64-cartcontext)
   - 6.5 [WishlistContext](#65-wishlistcontext)
   - 6.6 [Pages](#66-pages)
   - 6.7 [Components](#67-components)
   - 6.8 [Pricing System](#68-pricing-system)
   - 6.9 [Size System](#69-size-system)
   - 6.10 [Orders Cache](#610-orders-cache)
7. [Backend Architecture](#7-backend-architecture)
   - 7.1 [Express Server (server.js)](#71-express-server-serverjs)
   - 7.2 [Shared Helpers (api/_lib/)](#72-shared-helpers-api_lib)
   - 7.3 [API Handler Reference](#73-api-handler-reference)
8. [Data Models (MongoDB)](#8-data-models-mongodb)
9. [Authentication Flow](#9-authentication-flow)
10. [Order Lifecycle](#10-order-lifecycle)
11. [Admin Panel](#11-admin-panel)
12. [Analytics Dashboard](#12-analytics-dashboard)
13. [Brand System](#13-brand-system)
14. [Homepage Layout](#14-homepage-layout)
15. [Deployment](#15-deployment)
16. [Security Notes](#16-security-notes)
17. [Known Constraints & Design Decisions](#17-known-constraints--design-decisions)

---

## 1. Project Overview

**Thunderbolt** is a full-stack e-commerce storefront for a denim and apparel brand. It is built as a single-page React application backed by a Node.js/Express API, with Firebase Authentication for identity and MongoDB Atlas as the primary database.

The codebase is designed to run identically in two environments:

| Environment | Frontend server | API server | How API is reached |
|---|---|---|---|
| **Replit / local dev** | Vite on port 5000 | Express on port 3001 | Vite proxy forwards `/api/*` to Express |
| **Vercel (production)** | Static HTML/JS build served by Vercel CDN | Serverless functions (one file = one function) | Vercel routes `/api/*` directly to the matching file |

The same handler files in `/api/` run in both environments without modification. The only environment-specific logic is sub-route resolution inside consolidated handlers (explained in section 7.3).

---

## 2. Technology Stack

### Frontend
| Dependency | Version / Role |
|---|---|
| React | 18 — UI library |
| Vite | 5 — dev server + build tool (port 5000) |
| TypeScript | Full type coverage across all `.tsx` / `.ts` files |
| Tailwind CSS | Utility-first styling, custom design tokens |
| shadcn/ui | Accessible component primitives (Dialog, Toast, etc.) |
| React Router v6 | Client-side routing, `<Suspense>` boundaries |
| TanStack Query | Server state management, `staleTime: 60s`, `retry: 1` |
| Framer Motion | Page/component animations |
| Recharts | Admin analytics charts (area + bar) |
| Embla Carousel | Product image slider on product detail page |
| Sonner | Toast notifications |
| Lucide React | Icon set |

### Backend
| Dependency | Role |
|---|---|
| Node.js (ESM) | Runtime; all files use `import`/`export` syntax |
| Express 4 | Local dev HTTP server (port 3001) |
| `mongodb` (driver) | Direct MongoDB Atlas connection — no ORM |
| `firebase-admin` | Server-side Firebase ID token verification |
| `firebase/auth` (client SDK) | Client-side sign-in flows |

### Infrastructure
| Service | Role |
|---|---|
| MongoDB Atlas | Primary database (`thunderbold` database name) |
| Firebase Authentication | User identity (email/password + Google OAuth) |
| Vercel | Production hosting + serverless functions |
| Replit | Development environment |

---

## 3. Environment Variables & Secrets

All secrets are stored as Replit Secrets (never committed to the repository).

### Required for the backend to function

| Variable | Where used | What happens if missing |
|---|---|---|
| `MONGO_URI` | `api/_lib/mongodb.js` — `new MongoClient(...)` | All data endpoints throw `500 Database unavailable` immediately. No silent fallback. |
| `FIREBASE_SERVICE_ACCOUNT` | `api/_lib/firebaseAdmin.js` — `cert(JSON.parse(...))` | All authenticated endpoints throw `503`. All write/admin routes are blocked. |

### Required for the frontend to function

| Variable | Where used |
|---|---|
| `VITE_FIREBASE_API_KEY` | `src/lib/firebase.ts` — `initializeApp` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `src/lib/firebase.ts` |
| `VITE_FIREBASE_PROJECT_ID` | `src/lib/firebase.ts` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `src/lib/firebase.ts` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `src/lib/firebase.ts` |
| `VITE_FIREBASE_APP_ID` | `src/lib/firebase.ts` |

`VITE_` prefix means Vite inlines these into the compiled JS bundle. They are public-facing values (Firebase client config) and safe to expose in a browser.

---

## 4. Repository Structure

```
thunderbolt/
├── server.js                     # Express server — mounts all API handlers
├── vite.config.ts                # Vite config with /api proxy to :3001
├── vercel.json                   # Production rewrites for Vercel serverless
├── package.json
│
├── api/                          # API handlers (Express routes + Vercel functions)
│   ├── admin.js                  # GET /api/admin/analytics
│   ├── address/index.js          # GET/POST/PUT/DELETE /api/address
│   ├── brands/index.js           # GET/POST/PUT/DELETE /api/brands
│   ├── cart/index.js             # GET/POST/DELETE /api/cart
│   ├── categories/index.js       # GET/POST/PUT/DELETE /api/categories
│   ├── orders/index.js           # GET + POST/create + PUT/cancel + PATCH|DELETE/manage
│   ├── products/
│   │   ├── index.js              # GET/POST/PUT/DELETE /api/products
│   │   └── [id].js              # GET /api/products/:id
│   ├── reviews/index.js          # GET/POST/DELETE /api/reviews
│   ├── users/index.js            # POST /api/users/create + profile/address sub-routes
│   └── wishlist/index.js         # GET/POST/DELETE /api/wishlist
│   └── _lib/                     # Shared backend utilities
│       ├── adminHelper.js        # isAdmin(email, db)
│       ├── firebaseAdmin.js      # verifyFirebaseToken(token)
│       ├── mongodb.js            # getDb() — cached MongoClient
│       ├── rateLimit.js          # isRateLimited(req) — in-memory IP limiter
│       ├── response.js           # Standard JSON response shape helpers
│       └── validator.js          # validatePhone, validatePincode, validateAddress
│
└── src/                          # React frontend
    ├── App.tsx                   # Root — provider tree
    ├── AppContent.tsx            # Router, modal controller, lazy-loaded pages
    ├── context/
    │   ├── AuthContext.tsx        # Firebase auth state + DB sync
    │   ├── CartContext.tsx        # Cart state — localStorage + /api/cart sync
    │   └── WishlistContext.tsx   # Wishlist state — localStorage + /api/wishlist sync
    ├── pages/
    │   ├── Index.tsx             # Homepage
    │   ├── About.tsx
    │   ├── Admin.tsx             # Full admin panel (1,700+ lines)
    │   ├── BrandView.tsx         # /brand/:brandId — filtered product grid
    │   ├── BrandsPage.tsx        # /brands — all brands listing
    │   ├── Cart.tsx
    │   ├── CategoryView.tsx      # /category/:categoryId
    │   ├── Checkout.tsx
    │   ├── DealsPage.tsx         # /deals/:dealKey
    │   ├── NotFound.tsx
    │   ├── Orders.tsx
    │   ├── ProductView.tsx       # /product/:productId — detail page
    │   ├── Profile.tsx
    │   └── Wishlist.tsx
    ├── components/
    │   ├── Analytics/
    │   │   └── AnalyticsTab.tsx  # Admin analytics dashboard component
    │   ├── auth/
    │   │   └── LoginModal.tsx
    │   ├── products/
    │   │   └── ProductGrid.tsx   # Reusable product grid
    │   ├── promo/
    │   │   ├── PromoBanner.tsx   # Side-by-side static promo images
    │   │   └── promoSlides.ts    # Promo image config
    │   ├── reviews/
    │   │   ├── LightningRating.tsx
    │   │   └── ProductReviewsSection.tsx
    │   ├── AnnouncementBar.tsx
    │   ├── BrandsSection.tsx
    │   ├── CategoriesSection.tsx
    │   ├── CustomCursor.tsx
    │   ├── Footer.tsx
    │   ├── HeroBanner.tsx
    │   ├── LiveSaleSection.tsx
    │   ├── Navbar.tsx
    │   ├── PriceDisplay.tsx      # Price + crossed-out MRP + discount badge
    │   └── ScrollProgress.tsx
    └── lib/
        ├── cloudinary.ts         # optimizeCloudinaryUrl() + IMG_SIZES presets
        ├── firebase.ts           # Firebase client app init
        ├── modalController.ts    # PubSub for login modal open/close events
        ├── ordersCache.ts        # In-memory orders cache + idle prefetch
        ├── pricing.ts            # computePrice() — dynamic discount calculation
        ├── products.ts           # fetchProductById()
        ├── requireAuth.ts        # requireAuth() HOF — deferred action pattern
        └── storage.ts            # localStorage helpers for cart/wishlist
```

---

## 5. Running the App

```bash
npm run dev
```

This runs two processes concurrently (via `concurrently`):

1. `node server.js` — starts Express on port 3001
2. `vite` — starts Vite dev server on port 5000

Vite's `server.proxy` config forwards all requests matching `/api/*` to `http://localhost:3001`. The frontend always uses relative URLs like `/api/products`, so they route correctly in both environments.

**Workflow name in Replit:** `Start application`

After any change to a file inside `api/` or `server.js`, the Express server must be restarted (restart the workflow) because Node does not hot-reload backend files.

Vite hot-reloads all frontend changes automatically without a restart.

---

## 6. Frontend Architecture

### 6.1 Entry Point & Provider Tree

`src/main.tsx` renders `<App />`.

`src/App.tsx` wraps the entire app in a strict provider hierarchy — each outer context must be available to all inner ones:

```
AuthProvider                  ← Firebase user state
  CartProvider                ← needs useAuth() for DB sync
    WishlistProvider          ← needs useAuth() for DB sync
      QueryClientProvider     ← TanStack Query (staleTime: 60s, retry: 1)
        TooltipProvider       ← shadcn/ui tooltip context
          AppContent          ← router + modal controller
```

`QueryClient` is instantiated once at the module level (outside the component) so it is not recreated on re-render.

### 6.2 Routing & Code Splitting

`src/AppContent.tsx` owns the `<BrowserRouter>` and all `<Routes>`.

**Eagerly loaded pages** (small, needed on first paint):
- `Index`, `NotFound`, `About`, `CategoryView`

**Lazy loaded pages** (large; each compiles to its own JS chunk):
- `ProductView`, `Checkout`, `Cart`, `Wishlist`, `Admin`, `Orders`, `Profile`, `DealsPage`, `BrandsPage`, `BrandView`

All lazy routes are wrapped in a single `<Suspense fallback={<PageLoader />}>`. `PageLoader` renders a centered spinner on the `bg-void` background.

**Route table:**

| Path | Component | Notes |
|---|---|---|
| `/` | `Index` | Homepage |
| `/about` | `About` | |
| `/category/:categoryId` | `CategoryView` | |
| `/deals/:dealKey` | `DealsPage` | |
| `/product/:productId` | `ProductView` | |
| `/cart` | `Cart` | |
| `/wishlist` | `Wishlist` | |
| `/orders` | `Orders` | Requires auth |
| `/checkout` | `Checkout` | Requires auth |
| `/brands` | `BrandsPage` | |
| `/brand/:brandId` | `BrandView` | |
| `/admin` | `Admin` | Requires admin email |
| `/profile` | `Profile` | Requires auth |
| `*` | `NotFound` | Catch-all |

**Delayed login prompt:** If the user is not signed in, a `setTimeout` of 10 seconds fires `modalController.openModal('delayedPrompt')`, which opens the `<LoginModal>` with an informational (non-blocking) message. This only shows once per browser session (stored in `sessionStorage`).

**Login modal sources:** The modal tracks its open source (`requireAuth` | `delayedPrompt` | `manual`) to render the correct heading/copy inside `LoginModal`.

### 6.3 AuthContext

**File:** `src/context/AuthContext.tsx`

Wraps Firebase Authentication. Exposes:

| Method/Value | Type | Description |
|---|---|---|
| `user` | `User \| null` | Current Firebase user (null while loading or signed out) |
| `loading` | `boolean` | True during initial `onAuthStateChanged` resolution |
| `loginWithGoogle()` | `() => Promise<User>` | `signInWithPopup` + DB sync |
| `loginWithEmail(email, password)` | `() => Promise<User>` | `signInWithEmailAndPassword` + DB sync |
| `signupWithEmail(email, password)` | `() => Promise<User>` | `createUserWithEmailAndPassword` + DB sync |
| `logout()` | `() => Promise<void>` | `firebaseSignOut` |

**DB sync on login:** Every successful sign-in calls `POST /api/users` with `{ uid, email, name }`. This upserts the user document in MongoDB. Failure is non-fatal (logged to console only).

**Orders cache lifecycle:**
- On sign-in: `schedulePrefetchOrders(user)` fires during browser idle time to warm the orders cache before the user navigates to `/orders`.
- On sign-out: `clearOrdersCache()` wipes the in-memory cache so stale data is never shown.

### 6.4 CartContext

**File:** `src/context/CartContext.tsx`

Cart state is stored in `localStorage` (key: `'cart'`) and optionally synced to `/api/cart` for logged-in users. The cart is keyed by `productId + size` — the same product in different sizes is treated as separate line items.

**State shape:**
```ts
{
  items: CartItem[];   // { productId, name, price, image, size, quantity }
  loading: boolean;
  error: string | null;
}
```

**Reducer actions:** `SET_LOADING`, `SET_ERROR`, `SET_CART`, `ADD_ITEM`, `REMOVE_ITEM`, `UPDATE_QUANTITY`, `CLEAR_CART`.

**Key behaviours:**
- `addToCart()` increments quantity if the same `productId + size` already exists.
- `removeFromCart(productId, size)` — keyed by both productId and size.
- `syncToDb()` — fire-and-forget `POST /api/cart`. Failures are silent (`.catch(() => {})`).
- Cart is loaded from `localStorage` first (instant), then synced to DB on user state change.
- Listens to `add-to-cart-from-wishlist` window event (dispatched by `WishlistContext.moveToCart()`).

**Exposed methods:**
```ts
addToCart(item, quantity?)
removeFromCart(productId, size)
updateQuantity(productId, size, quantity)
clearCartData()
getTotalItems() → number
getTotalPrice() → number
isInCart(productId, size) → boolean
getItemQuantity(productId, size) → number
```

### 6.5 WishlistContext

**File:** `src/context/WishlistContext.tsx`

Wishlist is **per product** (not per product+size). A product is either wishlisted or not.

**Persistence strategy:**
- **Guest users:** stored in `localStorage` via `storage.ts` helpers.
- **Logged-in users:** fetched from and saved to `/api/wishlist` via Firebase token.
- **On login:** local wishlist is merged with the DB wishlist, saved back, then cleared from `localStorage`.

**Exposed methods:**
```ts
addToWishlist(item: WishlistItem)
removeFromWishlist(productId)
toggleWishlist(item)              // add if absent, remove if present
clearWishlistData()
isInWishlist(productId) → boolean
getWishlistCount() → number
moveToCart(productId)             // dispatches 'add-to-cart-from-wishlist' event, then removes
```

`moveToCart()` dispatches a window `CustomEvent` with `size: 'M'` as a default size (since wishlist items have no size). CartContext listens for this event.

### 6.6 Pages

#### ProductView (`/product/:productId`)
The most complex store-facing page.

**Image gallery:** Embla Carousel with loop + center alignment. Desktop shows thumbnail strip below; mobile shows dot indicators with the active dot expanding to a wider pill.

**Size selector:** Dynamic — reads sizes from the product's actual `sizeStock` keys using `getSizesFromProduct()`. Jeans products show `28 / 30 / 32 / 34 / 36`; apparel products show `S / M / L / XL / XXL`. Out-of-stock sizes are disabled with a strikethrough label and `OOS` sublabel.

**Stock logic:**
- `isOutOfStock` — total `stock === 0`
- `isLowStock` — `0 < stock <= 5`
- `isSizeOos(size)` — `sizeStock[size] <= 0`
- `effectiveOutOfStock` — true if total OOS **or** the selected size is OOS. This controls all button disabled states.

**Action buttons:**
- `Add to Cart` — requires a size to be selected and the item not effectively OOS.
- Wishlist heart — toggles wishlist regardless of size selection.
- Share — uses `navigator.share` on mobile; falls back to `navigator.clipboard.writeText`; falls back to `document.execCommand('copy')`.
- `Buy Now` — calls `requireAuth()` which redirects to `/checkout` via router state if the user is signed in, or opens the login modal first.

**Product Highlights:** An optional grid showing structured metadata fields: Color, Length, Prints & Pattern, Waist Rise, Shade, Length in Inches. Only rendered when at least one field has a non-empty value.

**Description:** Clamped to 4 lines with a "Read More" toggle if the description is longer than 200 characters.

#### Admin (`/admin`)
See full section [11. Admin Panel](#11-admin-panel).

### 6.7 Components

#### `PriceDisplay`
**File:** `src/components/PriceDisplay.tsx`

Props:
```ts
price: number | string | undefined        // selling price
purchasePrice?: number | string           // MRP (crossed out)
size?: 'sm' | 'md' | 'lg'               // controls font size
showSavings?: boolean                     // shows "You save ₹X" line
```

Internally calls `computePrice()`. Renders:
- Selling price in large bold condensed font (₹ with Indian locale formatting)
- If `hasDiscount`: crossed-out MRP + a red `X% off` badge
- If `hasDiscount && showSavings`: green "You save ₹X" line below

#### `ProductGrid`
**File:** `src/components/products/ProductGrid.tsx`

Reusable grid used by `CategoryView`, `DealsPage`, and `BrandView`. Accepts an array of products and renders them in a responsive CSS grid. Each card uses `PriceDisplay`.

#### `BrandsSection`
**File:** `src/components/BrandsSection.tsx`

Full-width edge-to-edge banner on the homepage. Shows brand logos/names, links to `/brands`. Zero horizontal padding so it bleeds to the screen edge on mobile.

#### `CategoriesSection`
**File:** `src/components/CategoriesSection.tsx`

Renders the multi-section collection grid:
1. Denim Collection grid
2. `PromoBanner` (two side-by-side static images)
3. T-Shirt Collection grid (only when tshirt categories exist)
4. Kurta Collection grid — always visible; shows an empty state prompt when no kurta products exist yet.

#### `AnalyticsTab`
**File:** `src/components/Analytics/AnalyticsTab.tsx`

See section [12. Analytics Dashboard](#12-analytics-dashboard).

### 6.8 Pricing System

**File:** `src/lib/pricing.ts`

```ts
function computePrice(sellingPrice, purchasePrice?): PriceInfo
```

**Rules:**
- Both inputs accept `number | string | undefined`. Strings are cleaned with `replace(/[^0-9.]/g, '')`.
- Both values are rounded to the nearest integer (no decimal prices in the UI).
- `hasDiscount` is only true when `purchasePrice > sellingPrice`.
- `discountPct = Math.round((savings / purchasePrice) * 100)`
- If `sellingPrice` is 0 or invalid, returns a zero-value struct with `hasDiscount: false`.

**Return type:**
```ts
interface PriceInfo {
  sellingPrice: number;
  purchasePrice: number;   // equals sellingPrice when no discount
  discountPct: number;     // 0 when no discount
  savings: number;         // 0 when no discount
  hasDiscount: boolean;
}
```

No discount percentages are hardcoded anywhere in the codebase. The admin sets both prices; the discount derives automatically.

### 6.9 Size System

Thunderbolt supports two distinct size sets. The correct set is determined by product section.

| Section | Sizes |
|---|---|
| `denim` | `28`, `30`, `32`, `34`, `36` |
| `live-sale` | `28`, `30`, `32`, `34`, `36` |
| `tshirts` | `S`, `M`, `L`, `XL`, `XXL` |
| `kurta` | `S`, `M`, `L`, `XL`, `XXL` |

**Frontend (`src/pages/Admin.tsx`):**
```ts
const JEANS_SIZES = ['28', '30', '32', '34', '36']
const APPAREL_SIZES = ['S', 'M', 'L', 'XL', 'XXL']

// Returns the right set for a section string:
getSizesForSection(section: string): string[]

// For edit mode — reads what's stored on the product itself:
getSizesFromStock(sizeStock: Record<string, number>): string[]
```

`getSizesFromStock` filters `SIZE_ORDER = [...JEANS_SIZES, ...APPAREL_SIZES]` to only the keys present in the product document. This ensures the correct canonical order even when editing old products.

When the Section dropdown changes between jeans-type and apparel-type sections, `sizeStock` resets to all-zeros for the new size set. Switching within the same type (e.g., `denim` → `live-sale`) preserves existing stock values.

**Frontend (`src/pages/ProductView.tsx`):**
```ts
getSizesFromProduct(sizeStock?: Record<string, number>): string[]
```
Reads the product's stored `sizeStock` keys and returns them in canonical `SIZE_ORDER`. No section knowledge needed on the product page — it's entirely key-driven.

**Backend (`api/products/index.js`):**
```js
const JEANS_SIZES = ['28', '30', '32', '34', '36']
const APPAREL_SIZES = ['S', 'M', 'L', 'XL', 'XXL']
const ALL_VALID_SIZES = new Set([...JEANS_SIZES, ...APPAREL_SIZES])

function normaliseSizeStock(sizeStock)
```
`normaliseSizeStock` accepts whatever keys are sent in the request body and keeps only those that appear in `ALL_VALID_SIZES`. It does NOT force every product into jeans sizes. Backward compatibility: if no valid keys are found at all, it falls back to all-zero jeans sizes.

`stock` (the flat total) is always recomputed as the sum of all `sizeStock` values by `computeTotalStock()`.

### 6.10 Orders Cache

**File:** `src/lib/ordersCache.ts`

An in-memory module-level cache (not React state, not localStorage) for the `/api/orders` response.

**Cache entries:**
```ts
{ uid: string; orders: Order[]; fetchedAt: number }
```

**Freshness:** Cache is considered fresh for 60 seconds (`FRESH_MS = 60_000`).

**Key functions:**
```ts
getCachedOrders(uid)          // returns orders if fresh, null if stale/missing
getStaleOrders(uid)           // returns orders regardless of freshness (instant render)
setCachedOrders(uid, orders)  // writes to cache with current timestamp
clearOrdersCache()            // wipes cache and in-flight promise
prefetchOrders(user)          // fetches /api/orders, caches result. Deduplicates concurrent calls.
schedulePrefetchOrders(user)  // fires prefetchOrders during browser idle time
```

**Deduplication:** `prefetchOrders` stores its `Promise` in `inFlight`. Any concurrent call returns the same promise. This prevents duplicate network requests during rapid navigation.

**Idle scheduling:** `schedulePrefetchOrders` uses `requestIdleCallback` (with a 2s timeout) when available, falls back to `setTimeout(800ms)` for Safari compatibility.

The Orders page uses `getStaleOrders()` for an instant first render, then re-fetches in the background.

---

## 7. Backend Architecture

### 7.1 Express Server (`server.js`)

The Express server is the local development equivalent of Vercel's function routing. It dynamically imports each handler file and mounts it at the appropriate path.

```js
import express from 'express'
const app = express()
const port = 3001

// Security headers (manual — no helmet dependency)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('X-XSS-Protection', '1; mode=block')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')
  next()
})

app.use(express.json())

// Each handler is dynamically imported — this allows handler files
// to be changed without modifying server.js
app.use('/api/products/:id', async (req, res) => {
  const { default: handler } = await import('./api/products/[id].js')
  await handler(req, res)
})
// ... (same pattern for all 11 routes)
```

**Route order matters:** `/api/products/:id` is mounted before `/api/products` to prevent Express matching the ID route as a products collection request.

### 7.2 Shared Helpers (`api/_lib/`)

#### `mongodb.js` — Database connection

```js
export async function getDb(): Promise<Db>
```

Uses a module-level `global.mongo` cache (compatible with both Express long-running process and Vercel serverless warm instances).

Connection settings:
- `maxPoolSize: 10`
- `minPoolSize: 2`
- `serverSelectionTimeoutMS: 5000`

Database name: **`thunderbold`** (note the spelling — not `thunderbolt`).

**Indexes created asynchronously on first connection** (non-blocking):

| Collection | Index |
|---|---|
| `orders` | `{ userId: 1 }` |
| `orders` | `{ createdAt: -1 }` |
| `orders` | `{ clientOrderId: 1 }` (sparse, unique — for idempotency) |
| `products` | `{ categoryId: 1 }` |
| `cart` | `{ userId: 1 }` (unique) |
| `wishlist` | `{ userId: 1 }` (unique) |
| `reviews` | `{ productId: 1, isDeleted: 1, createdAt: -1 }` |
| `reviews` | `{ userId: 1, isDeleted: 1 }` |
| `reviews` | `{ userId: 1, productId: 1 }` |

Index creation failures are non-fatal (logged as warnings).

#### `firebaseAdmin.js` — Token verification

```js
export async function verifyFirebaseToken(token: string): Promise<{ email, uid, ...claims }>
```

Initializes Firebase Admin SDK lazily on first call using the `FIREBASE_SERVICE_ACCOUNT` environment variable (parsed as JSON).

**Security guarantee:** There is NO insecure fallback. If `FIREBASE_SERVICE_ACCOUNT` is missing or the token is invalid, this function **always throws** — it never passes through. The previous implementation had a `jwt.decode` fallback that was removed as a security fix.

Error types thrown:
- `status: 503` — Firebase Admin SDK not initialized
- `status: 401` — Token invalid or expired

Token verification uses `verifyIdToken(token, true)` — the second argument (`checkRevoked: true`) verifies the token has not been revoked.

#### `adminHelper.js` — Admin check

```js
export async function isAdmin(email: string, db: Db): Promise<boolean>
```

Two-tier check:
1. Looks up the user document in `db.collection('users')` — if `role === 'admin'`, returns `true`.
2. Falls back to checking against a hardcoded `ADMIN_EMAILS` array.

**Hardcoded admin emails:**
- `adminthunderbolt@gmail.com`
- `neelsingh45940s@gmail.com`
- `thepavanartt@gmail.com`

This list must also be mirrored in `src/pages/Admin.tsx` for client-side route guarding.

#### `rateLimit.js` — In-memory rate limiter

```js
export function isRateLimited(req: Request): boolean
```

Simple sliding-window rate limiter using a module-level `Map`.

- **Window:** 60 seconds
- **Max requests:** 10 per IP per window
- **IP resolution priority:** `x-forwarded-for` → `x-real-ip` → `req.socket.remoteAddress` → `'unknown'`
- **Cleanup:** `setInterval` every 5 minutes removes entries older than 2× the window.

Currently applied to: `POST /api/orders/create` only.

#### `validator.js` — Input validation

```js
validatePhone(phone): { isValid, errors }        // 10 digits (strips non-numeric)
validatePincode(pincode): { isValid, errors }     // 6 digits
validateRequired(value, fieldName): { isValid, errors }
validateAddress(address): { isValid, errors }     // validates all address fields
validateOrder(order): { isValid, errors }         // validates product structure
```

#### `response.js` — Standard response shapes

```js
successResponse(data)
errorResponse(error, errors?)
validationErrorResponse(errors)
notFoundResponse(resource?)
serverErrorResponse(error?)
methodNotAllowedResponse(allowedMethods[])
```

These are utility functions; not all handlers use them (some inline their own JSON responses).

### 7.3 API Handler Reference

Every handler sets CORS headers (`Access-Control-Allow-Origin: *`) and handles `OPTIONS` preflight.

---

#### `GET/POST/PUT/DELETE /api/products` (`api/products/index.js`)

**GET** — public, no auth required.

Query params:
- `?maxPrice=N` — filters products with `price <= N`

Returns: `{ products[], count, source: 'database' }`

Projection on GET: `name, price, purchasePrice, image, images, description, categoryId, section, stock, sizeStock, highlights, createdAt, brandId`. Sorted by `createdAt: -1`.

**POST** — requires admin auth.

Body:
```json
{
  "name": "string",
  "price": 1499,
  "purchasePrice": 2000,
  "section": "denim|tshirts|kurta|live-sale",
  "categoryId": "string (optional for kurta/live-sale)",
  "brandId": "string (optional)",
  "images": ["url1", "url2"],
  "description": "string",
  "sizeStock": { "28": 10, "30": 15 },
  "highlights": { "color": "", "length": "", ... }
}
```

`normaliseSizeStock()` is applied to `sizeStock` — only valid keys are kept, values are clamped to ≥ 0 integers. `stock` is computed as the sum.

`purchasePrice` is only saved if `purchasePrice > 0`. `brandId` is only saved if truthy.

**PUT** — requires admin auth, `?id=<productId>`.

Same body as POST. `purchasePrice` is removed via `$unset` if not provided or zero. `brandId` is removed via `$unset` if not provided.

**DELETE** — requires admin auth, `?id=<productId>`.

---

#### `GET /api/products/:id` (`api/products/[id].js`)

Public. Returns a single product by MongoDB `_id`. Tries `new ObjectId(id)` first, falls back to string match.

---

#### `GET/POST/PUT/DELETE /api/brands` (`api/brands/index.js`)

**GET** — public, no auth.

Returns all brands sorted by name alphabetically. No projection — all fields returned including `logoUrl`.

**POST** — admin auth. Body: `{ name, logoUrl? }`.

Case-insensitive duplicate name check (`$regex: ^name$, $options: 'i'`). Returns `409` if name already exists.

**PUT** — admin auth, `?id=<brandId>`. Body: `{ name, logoUrl? }`.

**DELETE** — admin auth, `?id=<brandId>`.

Brand IDs are parsed with `parseId()` which tries `new ObjectId()` and falls back to raw string.

---

#### Orders (`api/orders/index.js`)

This is a consolidated handler that dispatches to four sub-handlers based on the sub-route.

**Sub-route resolution:**
```js
function resolveSubRoute(req) {
  const fromQuery = req.query?.subpath || ""      // Vercel (set by vercel.json rewrites)
  const fromPath = req.url.split("?")[0]...       // Express (relative URL after /api/orders)
  return fromQuery || fromPath
}
```

| HTTP | Sub-route | Handler | Auth |
|---|---|---|---|
| GET | (empty) | `handleList` | User (all orders for admin, own for regular user) |
| POST | `create` | `handleCreate` | User |
| PUT | `cancel` | `handleCancel` | User (own orders) or admin (any) |
| PATCH | `manage` | `handleManage` | Admin only |
| DELETE | `manage` | `handleManage` | Admin only |

**handleList:**
- Admin → returns all orders.
- Regular user → returns only `{ userId: user.email }` orders.
- Sorted by `createdAt: -1`.

**handleCreate (full flow):**

1. Rate limit check (10 req/min per IP).
2. Firebase token verification.
3. **Idempotency check:** if `clientOrderId` is provided and already exists in DB, returns the existing order immediately (HTTP 200).
4. Validation: products array non-empty, complete address, paymentMethod present, each product has `productId, name, price (number), image, size, quantity (>0)`.
5. **Pre-flight stock check:** for each cart item, fetches the product from DB. Checks `sizeStock[item.size]` if available, else flat `stock`. Returns `400` if insufficient stock.
6. Inserts the order document.
7. **Atomic stock decrement with compensation rollback:**
   - For each item, runs `updateOne` with a filter that includes `sizeStock.SIZE >= quantity` to prevent race conditions.
   - If any `modifiedCount === 0` (another request grabbed the stock first), restores all previously decremented items and deletes the order. Returns `409`.
8. Returns `201` with the new order.

**handleCancel:**
- Fetches the order, checks ownership or admin status.
- Returns `400` if already cancelled or delivered.
- Sets `status: 'cancelled'`.
- **Stock restoration (size-aware):** for each item in the order, checks if the product still has `sizeStock` for that size. If yes, increments both `sizeStock.SIZE` and `stock`. If no `sizeStock`, increments flat `stock` only. Failures during stock restore are logged but non-fatal.

**handleManage (admin only):**
- `PATCH` — updates status. Valid statuses: `pending`, `confirmed`, `shipped`, `delivered`. Does NOT accept `cancelled` via this route (use `cancel`).
- `DELETE` — permanently deletes the order document.

---

#### `GET /api/admin/analytics` (`api/admin.js`)

Admin-only. Runs 6 MongoDB aggregations in `Promise.all`:

1. **Overview** — total revenue, net revenue (all time), order count, user count, average order value.
2. **Revenue over time** — daily `totalAmount` sums grouped by `YYYY-MM-DD`.
3. **Orders over time** — daily order counts grouped by `YYYY-MM-DD`.
4. **Top products** — top 5 by units sold (`$unwind` products array, group by `productId`, sort by `totalSold`, join with products collection for current name/image/price).
5. **Stock alerts** — products where `stock <= 5`, split into `outOfStock` (stock === 0) and `lowStock` arrays.
6. **Recent orders** — last 5 orders sorted by `createdAt: -1`, projected to key fields only.

**Range modes** (from `?range=` query param):
- `month` (default) — current calendar month, day-by-day series
- `7d` — last 7 days
- `30d` — last 30 days
- `?month=YYYY-MM` — a specific calendar month

**Revenue exclusions:** Orders with `status: 'cancelled'`, `'canceled'`, or `'refunded'` are excluded from revenue calculations (but included in order count).

**Gap filling:** The daily series always includes every day in the range (zeros for days with no orders), so charts never have gaps.

---

#### Other handlers (brief)

| Handler | Notes |
|---|---|
| `api/cart/index.js` | GET requires auth (returns user's cart doc). POST replaces entire cart (upsert by userId). DELETE clears cart. |
| `api/wishlist/index.js` | Same pattern as cart. POST replaces entire wishlist. |
| `api/categories/index.js` | GET is public. POST/PUT/DELETE require admin. Category has: `name, image, section`. |
| `api/users/index.js` | POST `/api/users` — upserts user on login. Sub-routes for profile read/update and address management. |
| `api/address/index.js` | CRUD for saved delivery addresses. Each address requires `fullName, phone, addressLine1, city, pincode`. |
| `api/reviews/index.js` | GET is public (by productId). POST requires auth + purchase verification. DELETE requires admin. Reviews use soft delete (`isDeleted: true`). |

---

## 8. Data Models (MongoDB)

Database name: **`thunderbold`**

### `products` collection

```js
{
  _id: ObjectId,
  name: String,
  price: Number,                         // selling price (what customer pays)
  purchasePrice?: Number,                // MRP (crossed-out price) — optional
  brandId?: String,                      // references brands._id as string — optional
  image: String,                         // primary image URL (always = images[0])
  images: String[],                      // ordered array of image URLs
  description: String,
  categoryId: String,                    // empty string for kurta and live-sale sections
  section: 'live-sale'|'denim'|'tshirts'|'kurta',
  sizeStock: {                           // exactly 5 keys, one size set
    '28': Number, '30': Number, '32': Number, '34': Number, '36': Number
    // OR:
    'S': Number, 'M': Number, 'L': Number, 'XL': Number, 'XXL': Number
  },
  stock: Number,                         // computed sum of sizeStock values
  highlights?: {                         // all fields optional
    color: String,
    length: String,
    printsPattern: String,
    waistRise: String,
    shade: String,
    lengthInches: String
  } | null,
  createdAt: Date,
  updatedAt?: Date
}
```

### `orders` collection

```js
{
  _id: ObjectId,
  userId: String,                        // Firebase user email
  clientOrderId?: String,               // client-generated idempotency key (sparse unique index)
  products: [{
    productId: String,
    name: String,
    price: Number,
    image: String,
    size: String,                        // e.g. '32' or 'M'
    quantity: Number
  }],
  address: {
    fullName: String,
    phone: String,
    addressLine1: String,
    addressLine2?: String,
    city: String,
    state?: String,
    pincode: String
  },
  paymentMethod: String,
  status: 'pending'|'confirmed'|'shipped'|'delivered'|'cancelled',
  totalAmount: Number,                   // sum of (price * quantity) for all items
  createdAt: Date,
  updatedAt?: Date
}
```

### `brands` collection

```js
{
  _id: ObjectId,
  name: String,
  logoUrl: String,                       // image URL for brand logo
  createdAt: Date,
  updatedAt?: Date
}
```

### `categories` collection

```js
{
  _id: ObjectId,
  name: String,
  image: String,                         // image URL for category thumbnail
  section: 'denim'|'tshirts'|'kurta',   // live-sale not a valid category section
  createdAt: Date,
  updatedAt?: Date
}
```

### `users` collection

```js
{
  _id: ObjectId,
  uid: String,                           // Firebase UID
  email: String,
  name: String,
  role?: 'admin'|'user',
  createdAt: Date,
  updatedAt?: Date
}
```

### `cart` collection

```js
{
  _id: ObjectId,
  userId: String,                        // Firebase email (unique index)
  items: [{
    productId: String,
    name: String,
    price: Number,
    image: String,
    size: String,
    quantity: Number
  }],
  updatedAt: Date
}
```

### `wishlist` collection

```js
{
  _id: ObjectId,
  userId: String,                        // Firebase email (unique index)
  items: [{
    productId: String,
    name: String,
    price: Number,
    image: String
  }],
  updatedAt: Date
}
```

### `reviews` collection

```js
{
  _id: ObjectId,
  productId: String,
  userId: String,                        // Firebase email
  orderId: String,
  rating: Number,                        // 1–5
  comment: String,
  isDeleted: Boolean,                    // soft delete flag
  createdAt: Date,
  updatedAt?: Date
}
```

### `addresses` collection

```js
{
  _id: ObjectId,
  userId: String,
  fullName: String,
  phone: String,
  addressLine1: String,
  addressLine2?: String,
  city: String,
  state: String,
  pincode: String,
  isDefault?: Boolean,
  createdAt: Date
}
```

---

## 9. Authentication Flow

### Sign-in sequence

```
User enters credentials → Firebase Client SDK → Firebase Auth servers
→ Firebase returns ID token (JWT, signed, 1-hour expiry)
→ AuthContext stores Firebase User object
→ syncUserWithDatabase() → POST /api/users (no token needed for this endpoint)
→ schedulePrefetchOrders() fires during idle time
```

### Authenticated API request sequence

```
Frontend: user.getIdToken() → current ID token (auto-refreshed by Firebase SDK)
→ fetch('/api/endpoint', { headers: { Authorization: 'Bearer <token>' } })
→ Express / Vercel receives request
→ verifyFirebaseToken(token) → Firebase Admin SDK → cryptographic verification
→ decoded.email extracted
→ isAdmin(email, db) → DB check then hardcoded list
→ handler proceeds
```

### Token refresh

Firebase ID tokens expire after 1 hour. The client SDK automatically refreshes them. Every call to `user.getIdToken()` returns the current valid token (refreshing it silently if needed).

### Admin authorization

Admin status is determined server-side on every request. The client-side `ADMIN_EMAILS` array in `Admin.tsx` only controls which UI tab is visible — it cannot bypass server-side checks.

---

## 10. Order Lifecycle

```
                    CUSTOMER PLACES ORDER
                           │
                    POST /api/orders/create
                           │
              ┌─── Rate limit check (10/min) ────┐
              │                                   │
              ▼                                   ▼
         Allowed                           429 Too Many Requests
              │
         Firebase token verified
              │
         Idempotency: clientOrderId exists?
              ├── YES → return existing order (200)
              └── NO → continue
              │
         Validation (products, address, paymentMethod)
              │
         Pre-flight stock check (per-size)
              │
         Insert order (status: 'pending')
              │
         Atomic stock decrement loop
              ├── All succeed → 201 Created
              └── Any fails → rollback all decrements + delete order → 409
```

**Status transitions (admin only via PATCH /api/orders/manage):**

```
pending → confirmed → shipped → delivered
```

**Cancellation (user or admin via PUT /api/orders/cancel):**

```
pending|confirmed|shipped → cancelled (+ stock restore)
delivered → BLOCKED (cannot cancel delivered orders)
```

---

## 11. Admin Panel

**Route:** `/admin`

**Access guard:** Checked client-side by comparing `user.email` against `ADMIN_EMAILS`. Non-admins are redirected away immediately.

**Server-side guard:** Every admin API call independently verifies the Firebase token and calls `isAdmin()`. Client-side guard is UX only.

### Tabs

| Tab | Description |
|---|---|
| **Analytics** | Default tab. KPI cards + charts + top products + stock alerts + recent orders. |
| **Orders** | Full order list. Can update status (dropdown) or delete. |
| **Products** | Add/edit/delete products. Full product form. |
| **Categories** | Add/edit/delete categories. |
| **Brands** | Add/edit/delete brands (name + logo URL). |
| **Reviews** | Per-product review listing. Admin can delete any review. |

### Product Form (`SizeStockInput`)

The `SizeStockInput` component accepts a `sizes: string[]` prop and renders exactly those size labels. Sizes are driven by `getSizesForSection(form.section)`.

When the Section dropdown changes:
- If the new section maps to a **different size set** (e.g., `denim` → `tshirts`), `sizeStock` resets to all zeros for the new sizes.
- If the new section maps to the **same size set** (e.g., `denim` → `live-sale`), `sizeStock` is preserved.

When editing an existing product, `getSizesFromStock(editingProduct.sizeStock)` is used to load the sizes that are actually stored on the document, in canonical order.

### Analytics (admin) — see next section

---

## 12. Analytics Dashboard

**File:** `src/components/Analytics/AnalyticsTab.tsx`

Single fetch to `GET /api/admin/analytics?range=<mode>&month=<YYYY-MM>`.

**Range selector:** Three quick-select buttons (This Month / Last 7 Days / Last 30 Days) plus a month picker input. Range state is local to `AnalyticsTab`.

**Component tree:**

```
AnalyticsTab
├── StatsCard × 4           ← Total Revenue, Total Orders, Avg Order Value, Total Users
├── RevenueChart            ← Recharts AreaChart (daily revenue series)
├── OrdersChart             ← Recharts BarChart (daily order count series)
├── TopProducts             ← Top 5 products by units sold in range
├── StockAlerts             ← Products with stock ≤ 5 (split: out-of-stock + low-stock)
└── RecentOrders            ← Last 5 orders (global, not range-filtered)
```

**Mobile responsiveness:**
- `StatsCard` uses responsive grid (`grid-cols-2 lg:grid-cols-4`).
- Chart X-axis tick labels abbreviate month names on small screens.
- Range buttons use shortened labels on mobile.

**Backend aggregation details:**

Revenue: excludes orders with `status IN ['cancelled', 'canceled', 'refunded']`.

Monthly grouping format: `$dateToString: { format: '%Y-%m-%d', timezone: 'UTC' }`.

Gap filling: `eachDay(from, to)` generates every date string in the range; the aggregation result is placed into a `Map` keyed by date string; missing dates get `0`.

`getOverview()` runs 4 aggregations in `Promise.all`:
1. Period revenue (with range filter + non-cancelled filter)
2. Net revenue (all-time, non-cancelled — no date filter)
3. Period order count (all statuses)
4. Total user count (all time)

`getTopProducts()` uses `$unwind` on the embedded products array, groups by `productId`, sorts by `totalSold` descending, limits to 5, then does a separate `find` on the products collection to get current names and images (falling back to order-embedded name/image if the product was deleted).

---

## 13. Brand System

Brands are a first-class entity stored in the `brands` MongoDB collection.

### Data model
```js
{ _id, name, logoUrl, createdAt, updatedAt? }
```

### Admin flow
1. Admin opens **Brands tab** at `/admin`.
2. Creates a brand with a name and optional logo URL.
3. When adding/editing a product, a **Brand** dropdown appears — sourced from `GET /api/brands`.
4. `brandId` is saved on the product as a string reference.

### Store-facing flow
1. `GET /api/brands` is called on homepage load.
2. `BrandsSection` renders a full-width banner linking to `/brands`.
3. `/brands` (`BrandsPage`) lists all brands.
4. Clicking a brand navigates to `/brand/:brandId`.
5. `BrandView` fetches `GET /api/products` and client-filters by `brandId`.

### API auth
- `GET /api/brands` — public (no auth required).
- `POST /PUT /DELETE /api/brands` — admin Firebase token required.

---

## 14. Homepage Layout

Sections render top to bottom in `src/pages/Index.tsx`:

| # | Component | Description |
|---|---|---|
| 1 | `AnnouncementBar` | Fixed top bar with scrolling ticker text ("Delivery at your doorstep within 45 minutes") |
| 2 | `Navbar` | Navigation bar with logo, search, categories, wishlist, cart, login |
| 3 | `HeroBanner` | Full-width hero with headline, CTA button |
| 4 | `BrandsSection` | "Discover Our Brands" — edge-to-edge clickable banner → `/brands` |
| 5 | `LiveSaleSection` | "Special Offer" — product grid filtered to `section === 'live-sale'` |
| 6 | `CategoriesSection` | Multi-collection grid (see below) |
| 7 | `Footer` | Links, copyright |

### CategoriesSection detail

```
CategoriesSection
├── Denim Collection grid        (always rendered)
├── PromoBanner                  (two side-by-side static images → deals pages)
├── T-Shirts Collection grid     (rendered only when tshirt categories exist in DB)
└── Kurta Collection grid        (always rendered; shows empty state when no kurta products exist)
```

`PromoBanner` slides are configured in `src/components/promo/promoSlides.ts`. Each slide has an image URL and a link target (typically `/deals/:dealKey`).

Kurta section is always visible to encourage product addition — it shows a "No kurta products yet" empty state instead of hiding the section entirely.

---

## 15. Deployment

### Local / Replit (development)

- Workflow: `Start application` runs `npm run dev`.
- Vite dev server: port 5000 (publicly accessible via Replit proxy).
- Express API: port 3001 (internal only, accessed via Vite proxy).
- Hot reload: frontend via Vite HMR. Backend requires workflow restart.

### Vercel (production)

**Build command:** `npm run build` → Vite compiles `src/` to `dist/`.

**Output directory:** `dist/`

**Serverless functions:** 11 of the 12 allowed on the Vercel Hobby plan.

| Function file | Routes |
|---|---|
| `api/products/index.js` | `/api/products` |
| `api/products/[id].js` | `/api/products/:id` |
| `api/orders/index.js` | `/api/orders` + sub-routes |
| `api/users/index.js` | `/api/users` + sub-routes |
| `api/cart/index.js` | `/api/cart` |
| `api/wishlist/index.js` | `/api/wishlist` |
| `api/categories/index.js` | `/api/categories` |
| `api/address/index.js` | `/api/address` |
| `api/reviews/index.js` | `/api/reviews` |
| `api/admin.js` | `/api/admin/analytics` |
| `api/brands/index.js` | `/api/brands` |

**`vercel.json` rewrites:**

```json
{
  "/api/admin/analytics/:path*" → "/api/admin?subpath=:path*",
  "/api/orders/create"          → "/api/orders?subpath=create",
  "/api/orders/cancel"          → "/api/orders?subpath=cancel",
  "/api/orders/manage"          → "/api/orders?subpath=manage",
  "/api/*"                      → "/api/:path*",
  "/(.*)"                       → "/index.html"          ← SPA fallback
}
```

The `?subpath=` query param is how Vercel passes sub-route information to consolidated handlers (since Vercel cannot mount a single file at multiple paths). The `resolveSubRoute()` helper in each consolidated handler reads this param.

---

## 16. Security Notes

| Area | Implementation |
|---|---|
| Token verification | Firebase Admin SDK with `checkRevoked: true`. No fallbacks. Throws on failure. |
| Admin auth | Server-side check on every admin request (DB role + hardcoded list). |
| No jwt.decode fallback | Previously removed. `verifyFirebaseToken` never passes unverified tokens. |
| Rate limiting | In-memory IP-based limiter on order creation (10 req/min). |
| HTTP security headers | `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Referrer-Policy`, `Cross-Origin-Resource-Policy` set on all Express responses. |
| Input sanitization | `normaliseSizeStock` clamps values to `≥ 0` integers and rejects unknown size keys. |
| Idempotency | Order creation accepts a `clientOrderId` for safe retry on network failure without duplicate orders. |
| Stock race conditions | Atomic `updateOne` with a `$gte` guard prevents overselling even under concurrent requests. |
| Soft deletes | Reviews use `isDeleted: true` flag rather than hard deletes, preserving audit trail. |

---

## 17. Known Constraints & Design Decisions

### Vercel Hobby 12-function limit
The project uses 11 of 12 serverless function slots. To stay within the limit, related routes are consolidated into single files (orders, admin, users). Any new top-level API resource requires either consuming the last slot or consolidating further.

### MongoDB Atlas connection pooling
The `global.mongo` cache persists the connection across Vercel function invocations in warm instances but does not persist across cold starts. `maxPoolSize: 10` and `serverSelectionTimeoutMS: 5000` are tuned for Atlas free-tier latency.

### Cart is localStorage-first
The cart is read from `localStorage` synchronously on load (zero latency) and then synced to the DB asynchronously. This means cart data persists across sessions without requiring login, and the UI never blocks on a network request to display the cart.

### Database name typo
The MongoDB database is named `thunderbold` (missing the 't' in 'bolt'). This is intentional — changing it would require a data migration.

### Admin emails are hardcoded in two places
`api/_lib/adminHelper.js` (server) and `src/pages/Admin.tsx` (client). Both must be kept in sync. The DB `role: 'admin'` field provides an alternative that does not require code changes.

### Reviews require purchase verification
The reviews API verifies that the reviewer has an order containing the product before accepting a review, preventing fake reviews.

### Wishlist `moveToCart` defaults size to 'M'
When moving a wishlist item to cart, size defaults to `'M'` because wishlisted items have no size. Users should then change the size in the cart.

### `purchasePrice` is optional
Existing products without `purchasePrice` continue to work — `PriceDisplay` simply renders only the selling price with no discount badge.

### `categoryId` is empty for kurta and live-sale
These sections don't use category-based browsing, so `categoryId` is stored as an empty string. The backend skips the `categoryId` required check for these sections.
