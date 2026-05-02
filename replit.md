# Thunderbolt — Replit Project

## Overview
A full-stack e-commerce storefront called **Thunderbolt** (denim/apparel). React + Vite frontend with a Node.js/Express API backend. Uses Firebase for authentication and MongoDB Atlas for products, orders, users, reviews, cart, wishlist, addresses, categories, and brands. Designed to run identically in local development (Replit) and production (Vercel serverless).

## Architecture

- **Frontend**: React 18, Vite (port 5000), Tailwind CSS, shadcn/ui, React Router v6, TanStack Query, Framer Motion, Recharts
- **Backend**: Node.js/Express server (`server.js`) on port 3001, proxied through Vite under the `/api` prefix
- **Auth**: Firebase Authentication (email/password) with Firebase Admin token verification on the server
- **Database**: MongoDB Atlas (database name: `thunderbold`)
- **API handlers**: Located in `/api/` — same files run as Express routes locally and as Vercel serverless functions in production
- **Shared helpers**: `/api/_lib/` (mongo client, firebase admin, admin email helper, rate limiting, validators, response utils)

## Running the App
The app is started with `npm run dev`, which concurrently runs:
- `node server.js` (Express API on port 3001)
- `vite` (frontend dev server on port 5000)

The Vite proxy forwards `/api/*` to the Express server.

## Environment Variables Required
Set these as Replit secrets:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `MONGO_URI` — MongoDB Atlas connection string

Without `MONGO_URI`, all data endpoints return `500 Database unavailable` (expected, by design — no silent fallbacks).

## Project Structure

### Frontend (`src/`)
- `App.tsx` — Root with providers (Auth, Cart, Wishlist, QueryClient)
- `AppContent.tsx` — Router, modal management, delayed login prompt
- `context/` — `AuthContext`, `CartContext`, `WishlistContext`
- `pages/` — `Index`, `About`, `CategoryView`, `ProductView`, `Cart`, `Wishlist`, `Checkout`, `Orders`, `Admin`, `Profile`, `NotFound`, `BrandsPage`, `BrandView`, `DealsPage`
- `components/` — UI (shadcn/ui base + custom: `Navbar`, `Footer`, `HeroBanner`, `BrandsSection`, `LiveSaleSection`, `CategoriesSection`, etc.)
- `components/promo/` — Static side-by-side promo banner (`PromoBanner`, `promoSlides.ts`)
- `components/Analytics/` — Admin analytics dashboard (see below)
- `components/products/` — `ProductGrid` (reusable grid used by CategoryView, DealsPage, BrandView)
- `lib/ordersCache.ts` — Deduped fetch + in-memory cache for `/api/orders`
- `lib/pricing.ts` — `computePrice(sellingPrice, purchasePrice)` — derives discount dynamically (no hardcoded %)
- `components/PriceDisplay.tsx` — Shows selling price + optional crossed-out purchasePrice + savings badge

### Backend (`api/`)
Each file is one Vercel serverless function. Sub-routed handlers exist to stay under the Hobby-plan **12-function limit** (currently using 11 of 12).

| File | Routes served |
| --- | --- |
| `api/products/index.js` | `GET/POST/PUT/DELETE /api/products` |
| `api/products/[id].js` | `GET /api/products/:id` |
| `api/orders/index.js` | `GET /api/orders`, `POST /api/orders/create`, `PUT /api/orders/cancel`, `PATCH/DELETE /api/orders/manage?id=...` |
| `api/users/index.js` | `POST /api/users/create`, profile + address sub-routes |
| `api/cart/index.js` | `GET/POST/DELETE /api/cart` |
| `api/wishlist/index.js` | `GET/POST/DELETE /api/wishlist` |
| `api/categories/index.js` | `GET/POST/PUT/DELETE /api/categories` |
| `api/address/index.js` | `GET/POST/PUT/DELETE /api/address` |
| `api/reviews/index.js` | `GET/POST/DELETE /api/reviews` |
| `api/admin.js` | `GET /api/admin/analytics` — consolidated analytics |
| `api/brands/index.js` | `GET/POST/PUT/DELETE /api/brands` |

**Sub-route resolution:** Consolidated handlers (`api/orders/index.js`, `api/admin.js`) determine the action from either:
- `req.url` path remainder (Express, local dev), or
- `req.query.subpath` (Vercel, set by `vercel.json` rewrites in production)

### Shared backend (`api/_lib/`)
- `mongodb.js` — Cached MongoClient (`getDb()` returns `thunderbold` database)
- `firebaseAdmin.js` — `verifyFirebaseToken(idToken)`
- `adminHelper.js` — `isAdmin(email, db)` — checks against hardcoded `ADMIN_EMAILS` list
- `rateLimit.js` — `isRateLimited(req)` for write endpoints
- `validator.js`, `response.js` — Input validation + standard JSON responses

## Product Data Model
```js
{
  _id, name, price, purchasePrice?,   // purchasePrice = MRP/crossed-out price (optional)
  brandId?,                            // references brands._id (optional)
  image, images[],                     // first image is primary
  description, categoryId, section,   // section: 'live-sale' | 'denim' | 'tshirts' | 'kurta'
  sizeStock: { '28':n, '30':n, '32':n, '34':n, '36':n },
  stock,                               // computed sum of sizeStock values
  highlights?,                         // { color, length, printsPattern, waistRise, shade, lengthInches }
  createdAt, updatedAt?
}
```

## Brand System
Brands are a separate MongoDB collection (`brands`). They are simple name records.

**Data model:**
```js
{ _id, name, createdAt, updatedAt? }
```

**Flow:**
1. Admin creates brand names in the **Brands tab** of the admin panel (`/admin` → Brands tab)
2. When adding/editing a product, admin selects a brand from a dropdown (optional — existing products are unbranded by default)
3. On the store homepage, a **"Shop by Brand"** section appears between the Hero and the Special Offer section
4. Clicking the banner navigates to `/brands` (all brands listing page)
5. Clicking any brand navigates to `/brand/:brandId` (products filtered by that brand, using the shared `ProductGrid` component)

**API:** `GET /api/brands` is public (no auth). `POST/PUT/DELETE` require admin Firebase token.

## Pricing System
- `purchasePrice` — the original/MRP price stored on the product (optional). Shown as a crossed-out price on the store.
- `price` — the selling/actual price customers pay.
- `src/lib/pricing.ts` — `computePrice(sellingPrice, purchasePrice)` calculates the discount % dynamically.
- `src/components/PriceDisplay.tsx` — renders `price`, optional `purchasePrice` strikethrough, and a savings badge. Accepts `size` (`sm` | `lg`) and `showSavings` props.

## Admin Panel (`/admin`)
Admin emails are hardcoded in both `api/_lib/adminHelper.js` and `src/pages/Admin.tsx` (`ADMIN_EMAILS`).

**Tabs:**
| Tab | Description |
| --- | --- |
| Analytics | KPI cards, monthly revenue/orders charts (last 12 months), top products, stock alerts, recent orders |
| Orders | View, update status, delete orders |
| Products | Add/edit/delete products. Form includes: name, section, category, brand (dropdown), purchase price, selling price, size stock, images, description, highlights |
| Categories | Add/edit/delete categories (name, image URL, section) |
| Brands | Add/edit/delete brand names. These populate the brand dropdown in the product form |
| Reviews | Per-product review listing with admin delete |

## Size-Based Stock System
Products use a `sizeStock` map (`Record<string, number>`) keyed by `['28','30','32','34','36']`. The flat `stock` field is the computed total (sum of `sizeStock` values).

- **Admin** (`src/pages/Admin.tsx`) — `SizeStockInput` sets per-size stock. `SIZES` constant is the single source of truth.
- **Store** (`src/pages/ProductView.tsx`) — Size buttons disabled when `sizeStock[size] === 0`.
- **Backend** (`api/products/index.js`) — POST/PUT accept `sizeStock`, compute total `stock`.
- **Order create** — Pre-flight stock check with atomic decrement + compensation rollback (prevents oversells).
- **Order cancel** — Restores stock per size when `sizeStock` exists.

## Homepage Sections (top to bottom)
1. `HeroBanner` — full-width hero with CTA
2. `BrandsSection` — "Shop by Brand" heading + clickable banner → `/brands`
3. `LiveSaleSection` — "Special Offer" grid (products where `section === 'live-sale'`)
4. `CategoriesSection`:
   - Denim Collection grid
   - `PromoBanner` (two side-by-side static images → deals pages)
   - T-Shirt Collection grid (shown only when tshirt categories exist)
   - Kurta Collection grid (shown only when kurta categories exist)

## Analytics Dashboard
Default tab on `src/pages/Admin.tsx`. Monthly data for last 12 months.

- **Component tree**: `AnalyticsTab` → single fetch to `/api/admin/analytics` → sliced into:
  - `StatsCard` — KPI tiles (total revenue, orders, AOV, users)
  - `RevenueChart` — Recharts area chart, monthly `YYYY-MM` labels
  - `OrdersChart` — Recharts bar chart, monthly `YYYY-MM` labels
  - `TopProducts`, `StockAlerts`, `RecentOrders`
- **Backend** (`api/admin.js`) — All aggregations in `Promise.all`. Revenue excludes `cancelled/refunded` orders. Groups by `%Y-%m`, fills gaps with zeros using `eachMonth()`.

## Deployment

### Local / Replit (development)
- Workflow `Start application` runs `npm run dev` (Vite on :5000, Express on :3001)
- Vite proxies `/api/*` to Express

### Vercel (production)
- **Build**: `npm run build` (Vite output to `dist/`)
- **Functions**: 11 serverless functions (out of 12 allowed on Hobby)
- **`vercel.json` rewrites**:
  - `/api/admin/analytics/:path*` → `/api/admin?subpath=:path*`
  - `/api/orders/{create|cancel|manage}` → `/api/orders?subpath=:sub`
  - All other `/api/*` → matching file in `/api/`
  - Everything else → `/index.html` (SPA fallback)

The same handler files run unchanged in both environments; sub-routing is the only environment-specific concern.

## Recent Changes
- **Brands system** — New `api/brands/index.js` (11th serverless function). Admin Brands tab for CRUD. Brand dropdown in product form. Homepage `BrandsSection`, `/brands` listing page, `/brand/:brandId` product page.
- **Purchase price / MRP** — Products now store `purchasePrice` (optional). Admin form has separate "Purchase Price / MRP" and "Selling Price" fields. Store shows crossed-out price + dynamic discount % when `purchasePrice > price`.
- **Kurta Collection** — Added `kurta` as a product/category section. Appears in admin dropdowns and on the homepage CategoriesSection.
- **Promo banner** — Replaced old slider with static side-by-side `PromoBanner` between Denim and T-Shirts sections.
- **Monthly analytics** — Charts now show last 12 months (was: last 30 days). Data grouped by `YYYY-MM`.
- **Admin Analytics Dashboard** — Default admin tab with KPIs, monthly charts, top products, stock alerts, recent orders.
