# Thunderbolt — Replit Project

## Overview
A full-stack e-commerce storefront called **Thunderbolt** (denim/apparel). React + Vite frontend with a Node.js/Express API backend. Uses Firebase for authentication and MongoDB Atlas for products, orders, users, reviews, cart, wishlist, and addresses. Designed to run identically in local development (Replit) and production (Vercel serverless).

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
- `pages/` — `Index`, `About`, `CategoryView`, `ProductView`, `Cart`, `Wishlist`, `Checkout`, `Orders`, `Admin`, `Profile`, `NotFound`
- `components/` — UI (shadcn/ui base + custom: `Navbar`, `Footer`, `HeroSection`, etc.)
- `components/promo/` — Promo banner slider (`PromoSlider`, `PromoSlide`, `promoSlides.ts`)
- `components/Analytics/` — Admin analytics dashboard (see below)
- `lib/ordersCache.ts` — Deduped fetch + in-memory cache for `/api/orders`

### Backend (`api/`)
Each file is one Vercel serverless function. Sub-routed handlers exist to stay under the Hobby-plan 12-function limit.

| File | Routes served |
| --- | --- |
| `api/products/index.js` | `GET/POST/PUT/DELETE /api/products` |
| `api/products/[id].js` | `GET /api/products/:id` |
| `api/orders/index.js` | `GET /api/orders`, `POST /api/orders/create`, `PUT /api/orders/cancel`, `PATCH/DELETE /api/orders/manage?id=...` (consolidated dispatcher) |
| `api/users/index.js` | `POST /api/users/create`, profile + address sub-routes |
| `api/cart/index.js` | `GET/POST/DELETE /api/cart` |
| `api/wishlist/index.js` | `GET/POST/DELETE /api/wishlist` |
| `api/categories/index.js` | `GET /api/categories` |
| `api/address/index.js` | `GET/POST/PUT/DELETE /api/address` |
| `api/reviews/index.js` | `GET/POST /api/reviews` |
| `api/admin.js` | `GET /api/admin/analytics/{overview,revenue,orders,top-products,stock-alerts,recent-orders}` (consolidated analytics) |

**Sub-route resolution:** Consolidated handlers (`api/orders/index.js`, `api/admin.js`) determine the action from either:
- `req.url` path remainder (Express, local dev), or
- `req.query.subpath` (Vercel, set by `vercel.json` rewrites in production)

### Shared backend (`api/_lib/`)
- `mongodb.js` — Cached MongoClient (`getDb()` returns `thunderbold` database)
- `firebaseAdmin.js` — `verifyFirebaseToken(idToken)`
- `adminHelper.js` — `isAdmin(email, db)` — checks against hardcoded `ADMIN_EMAILS` list
- `rateLimit.js` — `isRateLimited(req)` for write endpoints
- `validator.js`, `response.js` — Input validation + standard JSON responses

## Size-Based Stock System
Products use a `sizeStock` map (`Record<string, number>`) keyed by `['28','30','32','34','36']`. The flat `stock` field is kept as the computed total (sum of `sizeStock` values).

- **Admin** (`src/pages/Admin.tsx`) — `SizeStockInput` sets per-size stock; product cards render a per-size grid. `SIZES` constant is the single source of truth.
- **Store** (`src/pages/ProductView.tsx`) — Size buttons disabled + strikethrough + "OOS" label when `sizeStock[size] === 0`. Action buttons use `effectiveOutOfStock` (total OOS OR selected size OOS).
- **Backend** (`api/products/index.js`) — POST/PUT accept `sizeStock`, compute total `stock` via `normaliseSizeStock` + `computeTotalStock`. GET projects `sizeStock`.
- **Order create** (`api/orders/index.js` → `handleCreate`) — Pre-flight stock check uses `sizeStock[size]` when present. Atomic decrement with **compensation rollback** if any item's stock changed mid-flight (prevents oversells under concurrency).
- **Order cancel** (`api/orders/index.js` → `handleCancel`) — Restores stock per size when `sizeStock` exists; otherwise restores total `stock`.
- **Backward compat** — Products without `sizeStock` fall back to flat `stock` everywhere.

## Order Idempotency
`POST /api/orders/create` accepts an optional `clientOrderId` (UUID generated on the client at checkout). The server checks for an existing order with the same `clientOrderId` before inserting; on a duplicate-key error, it returns the existing order. Prevents accidental double-charges from retries / double-clicks.

## Admin Analytics Dashboard
Default tab on `src/pages/Admin.tsx` (route `/admin`).

- **Component tree**: `AnalyticsTab` orchestrates a single fetch to `/api/admin/analytics`, then passes slices to:
  - `StatsCard` — KPI tiles (revenue, order count, AOV, etc.)
  - `RevenueChart`, `OrdersChart` — Recharts area/bar charts
  - `TopProducts` — top sellers leaderboard
  - `StockAlerts` — low / out-of-stock products
  - `RecentOrders` — latest orders feed
- **Backend** (`api/admin.js`) — Runs all aggregations in `Promise.all`. Excludes orders in status `cancelled / canceled / refunded` from revenue. Uses `totalAmount` field on orders.
- **Theme**: Dark with brass accent `#d4a32c`, mobile-first responsive grid.

## Promo Banner Slider (`src/components/promo/`)
Static slides defined in `promoSlides.ts`, banner images in `public/banners/`. Uses `aspect-[1944/809]` + `object-contain` to match source artwork. Drag tuned with `threshold 40px`, `velocity 300`, `dragElastic 0.6`, `dragMomentum false`. Arrows (`ArrowLeft` / `ArrowRight` from lucide) visible at all breakpoints.

## Deployment

### Local / Replit (development)
- Workflow `Start application` runs `npm run dev` (Vite on :5000, Express on :3001)
- Vite proxies `/api/*` to Express

### Vercel (production)
- **Build**: `npm run build` (Vite output to `dist/`)
- **Functions**: 10 serverless functions total (out of 12 allowed on Hobby)
- **`vercel.json` rewrites**:
  - `/api/admin/analytics/:path*` → `/api/admin?subpath=:path*`
  - `/api/orders/{create|cancel|manage}` → `/api/orders?subpath=:sub`
  - All other `/api/*` → matching file in `/api/`
  - Everything else → `/index.html` (SPA fallback)

The same handler files run unchanged in both environments; sub-routing is the only environment-specific concern and is resolved inside each handler.

## Recent Changes
- **Consolidated `/api/orders`** — Merged `create.js`, `cancel.js`, `manage.js`, `index.js` into one dispatcher to free up Vercel function slots. Frontend URLs unchanged.
- **Consolidated admin analytics** — Moved analytics into a single `api/admin.js` file; production routing handled by `vercel.json` rewrites.
- **Promo slider polish** — Updated to user-supplied banners with correct aspect ratio, larger rounded corners, always-visible arrows, smoother drag.
- **Admin Analytics Dashboard** — New default admin tab with KPIs, charts, top products, stock alerts, recent orders.
