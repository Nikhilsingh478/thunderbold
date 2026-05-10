# Thunderbolt — Project Documentation

## Overview

Thunderbolt is a production-grade premium denim e-commerce storefront built for a real retail brand. It features a full-stack architecture with a React 18 + Vite frontend, Node.js/Express API backend, Firebase Authentication, and MongoDB Atlas database. The platform supports product browsing, cart, wishlist, checkout, order management, brand pages, deals pages, and a full admin panel with analytics.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite 5, Tailwind CSS, shadcn/ui |
| Routing | React Router v6 |
| State / Data | TanStack Query (React Query) |
| Animations | Framer Motion |
| Charts | Recharts |
| Authentication | Firebase Authentication (email/password) |
| Database | MongoDB Atlas |
| Backend | Node.js + Express (local dev), Vercel Serverless Functions (production) |
| PWA | vite-plugin-pwa v1.x + Workbox generateSW strategy |
| Icons | Lucide React |
| Build | Vite (frontend) |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    Browser                           │
│  React 18 SPA (Vite, port 5000)                     │
│  - React Router v6 (client-side routing)            │
│  - TanStack Query (server state / caching)          │
│  - Framer Motion (animations)                       │
│  - Firebase Auth SDK (client-side auth)             │
└───────────────────────┬─────────────────────────────┘
                        │ /api/* (proxied by Vite dev server)
┌───────────────────────▼─────────────────────────────┐
│                Express API (port 3001)               │
│  api/*.js — same files run in Vercel as functions   │
│  - Firebase Admin (token verification)              │
│  - MongoDB Atlas (getDb() shared client)            │
└─────────────────────────────────────────────────────┘
```

### Running the App

```bash
npm run dev
```

This runs two processes concurrently:
- `node server.js` — Express API on port 3001
- `vite` — Frontend dev server on port 5000, proxying `/api/*` to Express

---

## Environment Variables

Set these as Replit secrets (never commit to source):

| Variable | Purpose |
|---|---|
| `MONGO_URI` | MongoDB Atlas connection string |
| `VITE_FIREBASE_API_KEY` | Firebase project API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase App ID |

Without `MONGO_URI`, all data endpoints explicitly return `500 Database unavailable` — no silent fallbacks by design.

---

## Project Structure

### Frontend (`src/`)

```
src/
├── App.tsx                    — Root with providers (Auth, Cart, Wishlist, QueryClient)
├── AppContent.tsx             — Router, SplashScreen, PageLoader, modal management
├── context/
│   ├── AuthContext.tsx        — Firebase auth state
│   ├── CartContext.tsx        — Cart state (localStorage synced)
│   └── WishlistContext.tsx    — Wishlist state
├── pages/
│   ├── Index.tsx              — Homepage
│   ├── About.tsx
│   ├── CategoryView.tsx       — Category product listing
│   ├── ProductView.tsx        — Product detail page
│   ├── Cart.tsx
│   ├── Wishlist.tsx
│   ├── Checkout.tsx
│   ├── Orders.tsx             — Customer order history
│   ├── Admin.tsx              — Full admin panel
│   ├── Profile.tsx
│   ├── BrandsPage.tsx         — All brands listing
│   ├── BrandView.tsx          — Brand-filtered product listing
│   ├── DealsPage.tsx          — Denim-only price-filtered deals
│   └── NotFound.tsx
├── components/
│   ├── SplashScreen.tsx       — Cinematic branded intro (once per session)
│   ├── Navbar.tsx
│   ├── Footer.tsx             — Customer-facing pages only (not admin)
│   ├── HeroBanner.tsx
│   ├── BrandsSection.tsx
│   ├── LiveSaleSection.tsx
│   ├── CategoriesSection.tsx
│   ├── PriceDisplay.tsx       — Unified price renderer (selling + MRP strikethrough)
│   ├── Analytics/
│   │   ├── AnalyticsTab.tsx   — Admin analytics dashboard
│   │   ├── StatsCard.tsx      — KPI tile
│   │   ├── RevenueChart.tsx   — Monthly revenue area chart
│   │   ├── OrdersChart.tsx    — Monthly orders bar chart
│   │   ├── TopProducts.tsx
│   │   ├── StockAlerts.tsx
│   │   ├── RecentOrders.tsx
│   │   └── types.ts           — Shared TypeScript interfaces
│   └── products/
│       └── ProductGrid.tsx    — Reusable product card grid
├── lib/
│   ├── pricing.ts             — computePrice(sellingPrice, mrp) → PriceInfo
│   ├── cloudinary.ts          — Image URL optimization helpers
│   ├── ordersCache.ts         — Deduped fetch + in-memory cache for /api/orders
│   ├── requireAuth.ts         — Action deferral until authenticated
│   └── modalController.ts     — Event-based login modal controller
└── utils/
    └── printInvoice.ts        — Packing slip print utility (opens browser print)
```

### Backend (`api/`)

Each file is a Vercel serverless function (also mounted as Express routes locally via `server.js`).

| File | Routes |
|---|---|
| `api/products/index.js` | `GET/POST/PUT/DELETE /api/products` |
| `api/products/[id].js` | `GET /api/products/:id` |
| `api/orders/index.js` | `GET /api/orders`, `POST /api/orders/create`, `PUT /api/orders/cancel`, `PATCH/DELETE /api/orders/manage` |
| `api/users/index.js` | `POST /api/users/create`, profile + address sub-routes |
| `api/cart/index.js` | `GET/POST/DELETE /api/cart` |
| `api/wishlist/index.js` | `GET/POST/DELETE /api/wishlist` |
| `api/categories/index.js` | `GET/POST/PUT/DELETE /api/categories` |
| `api/address/index.js` | `GET/POST/PUT/DELETE /api/address` |
| `api/reviews/index.js` | `GET/POST/DELETE /api/reviews` |
| `api/admin.js` | `GET /api/admin/analytics` — consolidated analytics + profit metrics |
| `api/brands/index.js` | `GET/POST/PUT/DELETE /api/brands` |

### Shared Backend Helpers (`api/_lib/`)

| File | Purpose |
|---|---|
| `mongodb.js` | Cached MongoClient — `getDb()` returns the `thunderbold` database |
| `firebaseAdmin.js` | `verifyFirebaseToken(idToken)` — decodes and validates Firebase JWT |
| `adminHelper.js` | `isAdmin(email, db)` — checks hardcoded `ADMIN_EMAILS` list |
| `rateLimit.js` | `isRateLimited(req)` — in-memory rate limiting for write endpoints |
| `validator.js` | Input validation utilities |
| `response.js` | Standard JSON response helpers |

---

## Database

**MongoDB Atlas** — database name: `thunderbold`

### Collections

| Collection | Description |
|---|---|
| `products` | Product catalog |
| `orders` | Customer orders |
| `users` | User profiles |
| `cart` | Per-user cart items |
| `wishlist` | Per-user wishlisted products |
| `categories` | Category records |
| `brands` | Brand name records |
| `addresses` | Saved delivery addresses |
| `reviews` | Per-product customer reviews |

---

## Product Data Model

```js
{
  _id,
  name,
  price,           // Selling price — what the customer pays
  mrp?,            // MRP / original price — shown crossed-out on the storefront (optional)
  purchasePrice?,  // Internal cost price — admin-only, used for profit analytics (never sent to customers)
  brandId?,        // References brands._id (optional)
  image,           // Primary display image URL
  images[],        // All images (first is primary)
  description,
  categoryId,
  section,         // 'live-sale' | 'denim' | 'tshirts' | 'kurta'
  sizeStock: { '28':n, '30':n, '32':n, '34':n, '36':n },  // Per-size inventory
  stock,           // Computed total (sum of sizeStock values)
  highlights?,     // { color, length, printsPattern, waistRise, shade, lengthInches }
  createdAt,
  updatedAt?
}
```

---

## Pricing System

Three separate fields serve distinct purposes:

| Field | Visibility | Purpose |
|---|---|---|
| `price` | Public (customers + admin) | Actual selling price — what the customer pays |
| `mrp` | Public (customers + admin) | Original/MRP price — shown crossed-out to indicate a discount |
| `purchasePrice` | Admin only — never in public API responses | Internal cost price — used for profit calculations in analytics |

### Frontend Rendering

`src/lib/pricing.ts` — `computePrice(sellingPrice, mrp)` derives the discount percentage dynamically (no hardcoded %):

```ts
computePrice(price, mrp) → {
  sellingPrice,   // cleaned selling price
  mrp,            // original/MRP price
  discountPct,    // % off, derived dynamically
  savings,        // absolute savings (MRP - selling)
  hasDiscount     // true when MRP > selling price
}
```

`src/components/PriceDisplay.tsx` renders: selling price + optional crossed-out MRP + savings badge. Used on every product card and the product detail page.

### Backward Compatibility

Existing products that stored MRP in the old `purchasePrice` field are handled gracefully by the API:

```js
// GET /api/products — normalises for backward compat
mrp: doc.mrp ?? doc.purchasePrice ?? null
```

Old products continue to show their crossed-out price without any data migration.

### Admin Panel Fields

The product create/edit form (Admin → Products tab) has three distinct fields:
1. **MRP (₹)** — customer-facing original price
2. **Selling Price (₹)** — the actual checkout price
3. **Purchase Price / Cost (₹)** — internal cost, marked "Admin only", never exposed publicly

---

## Analytics System

### Overview

Single endpoint: `GET /api/admin/analytics` — returns all metrics in one payload via `Promise.all` across multiple MongoDB aggregation pipelines.

### KPI Cards

| Card | Definition |
|---|---|
| Total Revenue | Sum of `totalAmount` for all non-cancelled orders in the period |
| Net Revenue | Same, lifetime |
| Total Orders | Count of all orders in the period |
| Avg Order Value | Total Revenue ÷ Total Orders |
| Period Profit | Profit from delivered orders in the current period |
| Net Profit (All Time) | Lifetime profit from all delivered/completed orders |

### Profit Calculation

Only **delivered** and **completed** orders are counted toward profit.

Per-item profit: `(order item selling price − product purchasePrice) × quantity`

The calculation uses a MongoDB aggregation pipeline with `$lookup` to join order items to their products' `purchasePrice`. Items from products without a `purchasePrice` set are excluded gracefully — no errors, no zero-padding.

```
orders (delivered/completed)
  → $unwind products[]
  → $lookup products.purchasePrice
  → $filter (exclude items with no purchasePrice)
  → $group: sum((sellingPrice - cost) × qty)
```

Both **period profit** (current date range) and **lifetime profit** run in parallel via `Promise.all`.

### Monthly Charts

Revenue and order volume are charted for the last 12 months (`YYYY-MM` labels). Months with zero activity are filled in automatically so the chart always shows a complete 12-month window.

---

## Promo Banner Filtering

The deals pages (`/deals/under-999`, `/deals/under-699`) filter products by **both price cap AND denim section**:

```
GET /api/products?maxPrice=999&section=denim
```

This ensures only denim/jeans products appear — no kurtas or t-shirts — regardless of price. Newly added denim products automatically appear on the correct deals page without any manual configuration.

---

## Admin Panel

Route: `/admin` — admin-email-restricted, requires Firebase token with an email in `ADMIN_EMAILS`.

### Tabs

| Tab | Description |
|---|---|
| Analytics | KPI cards (revenue, orders, profit), monthly charts, top products, stock alerts, recent orders |
| Orders | View all orders, update status, print packing slip, delete |
| Products | Create/edit/delete products. Form includes: name, section, category, brand, MRP, selling price, purchase price/cost (admin-only), size stock, images, description, highlights |
| Categories | Create/edit/delete categories |
| Brands | Create/edit/delete brand names |
| Reviews | Per-product review listing with admin delete |

The admin panel has **no footer** — the storefront footer only renders on customer-facing pages.

---

## Order Print / Packing Slip

`src/utils/printInvoice.ts` — `printInvoice(order)` opens a new browser window with a professionally formatted HTML packing slip and automatically triggers `window.print()`.

The packing slip includes:
- Thunderbolt brand header
- Order ID + date + payment method + status badge
- Ship-to address block
- Itemized product table (name, size, quantity, unit price, line total)
- Subtotal + shipping + total summary
- Customer name + print timestamp footer

The print button (printer icon) appears next to the delete button on every order row — both mobile cards and desktop table — in the admin Orders tab.

---

## Splash Screen

`src/components/SplashScreen.tsx` — renders once per browser session (controlled via `sessionStorage`).

- Full-screen dark background (`#0a0a0a`)
- Lightning bolt icon animates in (scale + opacity, spring easing)
- Amber glow pulses behind the bolt
- "THUNDERBOLT" brand text expands in with letter-spacing animation
- "PREMIUM DENIM" tagline fades in
- Amber sweep bar progresses across the bottom
- Smooth fade-out after 2 seconds
- Zero impact on route rendering — overlays the app, does not block Suspense

---

## Brand System

Brands are stored in the `brands` MongoDB collection.

**Flow:**
1. Admin creates brand names in the Brands tab (`/admin` → Brands)
2. When adding/editing a product, admin selects a brand from a dropdown (optional)
3. Homepage shows a "Shop by Brand" `BrandsSection`
4. Clicking navigates to `/brands` (all brands) or `/brand/:brandId` (filtered products)

---

## Size-Based Stock System

Products use a `sizeStock` map keyed by `['28','30','32','34','36']` for jeans (or `['S','M','L','XL','XXL']` for apparel). The flat `stock` field is the computed total.

- **Ordering**: Pre-flight stock check with atomic decrement + compensation rollback (prevents oversells)
- **Cancellation**: Restores stock per size when `sizeStock` exists on the product

---

## Deployment

### Local / Replit (development)

```bash
npm run dev        # Concurrently: node server.js (3001) + vite (5000)
```

Vite proxies `/api/*` → Express.

### Vercel (production)

- **Build command**: `npm run build` (Vite output to `dist/`)
- **Functions**: 11 serverless functions out of 12 allowed on Hobby plan
- **`vercel.json` rewrites**: Sub-route consolidated handlers use `?subpath=` query param (Vercel) vs URL path remainder (Express)

The same handler files run unchanged in both environments.

---

## API Security Notes

- All write endpoints require a valid Firebase ID token (`Authorization: Bearer <token>`)
- Admin endpoints additionally check `isAdmin(email, db)` against the hardcoded `ADMIN_EMAILS` list
- `purchasePrice` (internal cost) is **never included** in public `GET /api/products` responses — it is only returned when the request is authenticated as an admin
- Rate limiting is applied to all write endpoints via `api/_lib/rateLimit.js`

---

## Edge Cases Handled

| Case | Handling |
|---|---|
| Old products with `purchasePrice` as MRP | API normalises: `mrp: doc.mrp ?? doc.purchasePrice ?? null` — no migration needed |
| Products with no `purchasePrice` (cost) | Excluded from profit calculations gracefully — no errors |
| Out-of-stock sizes | Size buttons disabled on ProductView; atomic stock checks on order create |
| Order cancellation | Restores `sizeStock` per size (if available) and total `stock` |
| Missing `brandId` on products | Optional — backwards compatible, unbranded products still work |
| Deals page with mixed categories | Section filter (`?section=denim`) ensures only denim products appear |

---

## User Preferences

- No emojis in code or comments unless user explicitly requests
- No Footer inside Admin panel
- Admin emails are hardcoded in `api/_lib/adminHelper.js` and `src/pages/Admin.tsx`
- Database name is `thunderbold` (not `thunderbolt`) — this is intentional
- Pricing: `mrp` = crossed-out display price; `purchasePrice` = internal cost (admin-only)
- All data endpoints must fail explicitly with `500 Database unavailable` when MongoDB is unavailable — no silent fallbacks
