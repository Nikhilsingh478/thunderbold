# Thunderbolt — Production-Grade Premium Denim E-Commerce PWA

A full-stack, installable Progressive Web App built for a real retail brand. React 18 + Vite frontend, Express/MongoDB backend, Firebase Auth, and a production-grade Workbox service worker.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Architecture Overview](#architecture-overview)
3. [Environment Setup](#environment-setup)
4. [Running the App](#running-the-app)
5. [PWA Architecture](#pwa-architecture)
6. [Service Worker Architecture](#service-worker-architecture)
7. [Caching Strategy](#caching-strategy)
8. [Offline Strategy](#offline-strategy)
9. [Manifest Setup](#manifest-setup)
10. [App Capabilities](#app-capabilities)
11. [Update Lifecycle](#update-lifecycle)
12. [Icon Strategy](#icon-strategy)
13. [Splash Screen System](#splash-screen-system)
14. [Deployment (Vercel)](#deployment-vercel)
15. [TWA / Play Store Readiness](#twa--play-store-readiness)
16. [Project Structure](#project-structure)
17. [Database Schema](#database-schema)
18. [Pricing System](#pricing-system)
19. [Analytics System](#analytics-system)
20. [Admin Panel](#admin-panel)
21. [API Reference](#api-reference)
22. [PWABuilder Verification](#pwabuilder-verification)
23. [Edge Cases Handled](#edge-cases-handled)
24. [Troubleshooting](#troubleshooting)

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
| Backend | Node.js + Express (dev), Vercel Serverless Functions (prod) |
| PWA | vite-plugin-pwa v1.x + Workbox `generateSW` strategy |
| Icons | Lucide React |
| Build | Vite |

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│                        Browser                            │
│  React 18 SPA (Vite, port 5000)                          │
│  - React Router v6 (client-side routing)                 │
│  - TanStack Query (server state / caching)               │
│  - Framer Motion (animations)                            │
│  - Firebase Auth SDK (client-side auth)                  │
│  - Service Worker (Workbox — offline + asset caching)    │
└────────────────────────┬─────────────────────────────────┘
                         │ /api/* (proxied by Vite dev server)
┌────────────────────────▼─────────────────────────────────┐
│                  Express API (port 3001)                  │
│  api/*.js — same files run in Vercel as serverless fns   │
│  - Firebase Admin (token verification)                   │
│  - MongoDB Atlas (getDb() shared client)                 │
└──────────────────────────────────────────────────────────┘
```

---

## Environment Setup

Set these as Replit secrets (never commit):

| Variable | Purpose |
|---|---|
| `MONGO_URI` | MongoDB Atlas connection string |
| `VITE_FIREBASE_API_KEY` | Firebase project API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase App ID |

Without `MONGO_URI`, all data endpoints explicitly return `500 Database unavailable` — no silent fallbacks.

---

## Running the App

```bash
npm run dev        # Concurrently: node server.js (3001) + vite (5000)
npm run build      # Production build — generates dist/sw.js + manifest
npm run preview    # Preview production build locally
```

The service worker is **only active in production builds** (`npm run build`). During development, `devOptions.enabled: false` keeps Vite HMR and the API proxy working cleanly.

---

## PWA Architecture

### Root Cause of Previous PWABuilder Failure

`vite-plugin-pwa` was listed in `package.json` but **not installed** in `node_modules`. The build failed before generating any `sw.js`, so PWABuilder found no service worker at all.

**Fix**: Installed `vite-plugin-pwa@^1.3.0`. Every production build now generates:
- `dist/sw.js` — the service worker
- `dist/workbox-*.js` — the Workbox runtime
- `dist/manifest.webmanifest` — the enhanced Web App Manifest

### Strategy: generateSW

Workbox generates the entire service worker from `vite.config.ts`. No custom `sw.ts` to maintain — simpler and more reliable.

### Registration Flow

```
src/main.tsx
  └── import('virtual:pwa-register')
        └── registerSW({ onNeedRefresh, onOfflineReady })
              ├── onNeedRefresh(reloadFn) → dispatches 'pwa-update-available'
              └── onOfflineReady()        → dispatches 'pwa-offline-ready'

src/components/PWAUpdatePrompt.tsx
  └── Listens for both events → shows non-intrusive bottom toast
```

### registerType: 'prompt'

The SW uses `prompt` (not `autoUpdate`):
- New SW installs in background — does **not** take control immediately
- User sees a subtle "Update available" toast at bottom of screen
- Clicking "Refresh" triggers `skipWaiting` + page reload
- No forced mid-checkout reloads — user decides when to apply
- Old SW continues serving the app until the user acts

---

## Service Worker Architecture

### Generated Files

| File | Description |
|---|---|
| `dist/sw.js` | Main SW — Workbox runtime + precache manifest + route rules |
| `dist/workbox-*.js` | Workbox runtime (content-hashed for cache busting) |
| `dist/manifest.webmanifest` | Web App Manifest (generated from `vite.config.ts`) |

### Vercel Serving

Vercel's routing priority:
1. **Static files from `dist/`** are served **before** rewrites
2. `/sw.js` served from `dist/sw.js` with explicit no-cache headers
3. SPA catch-all `/(.*) → /index.html` only applies to paths with no static file match

**Headers configured for `/sw.js`** in `vercel.json`:
```
Content-Type: application/javascript; charset=utf-8
Cache-Control: no-cache, no-store, must-revalidate
Service-Worker-Allowed: /
```

Zero-cache on the service worker ensures new deployments propagate immediately without stale SW serving old content.

---

## Caching Strategy

### Never Cached — NetworkOnly

```
/api/*    — All API routes (auth, cart, orders, admin, checkout, products)
```

API responses must always be fresh. Stale API data causes incorrect stock counts, auth failures, and order corruption.

### Precache — Install Time

Built by Workbox from the Vite output:
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

Cloudinary URLs are content-addressed (transformations in the URL) so CacheFirst is safe.

---

## Offline Strategy

### App Shell

Precached `index.html` + all JS/CSS bundles form the app shell. Loads instantly from cache even with no network.

### Navigation Fallback

```js
navigateFallback: '/index.html',
navigateFallbackDenylist: [/^\/api\//, /^\/sw\.js$/],
```

All SPA routes are served from the cached shell. API calls within those routes fail gracefully — the UI handles error states.

### Hard Offline (uncached route, no network)

`offline.html` — a branded dark-background page shown when a user navigates to a route that was never cached.

### What Works Offline

- Browsing previously cached product images (Cloudinary CacheFirst)
- App shell / homepage skeleton
- Cart and wishlist (stored in localStorage)
- Any route previously visited (assets cached)

### What Requires Network

- Live product data (prices, stock levels)
- Server-side cart sync
- Checkout / order placement
- Firebase authentication

---

## Manifest Setup

Generated as `dist/manifest.webmanifest` from `vite.config.ts`.

### All Fields

| Field | Value |
|---|---|
| `id` | `/` |
| `name` | `Thunderbolt` |
| `short_name` | `Thunderbolt` |
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
| `shortcuts` | 4 shortcuts (Cart, Wishlist, Orders, Deals) |
| `screenshots` | 2 images (mobile narrow, desktop wide) |
| `share_target` | URL sharing into the app |
| `launch_handler` | `navigate-existing` |
| `icons` | 9 sizes (72–512px) + 1 maskable |

---

## App Capabilities

### Shortcuts

Long-press home screen icon (Android) or right-click taskbar icon (desktop):

| Shortcut | URL |
|---|---|
| My Cart | `/cart` |
| My Wishlist | `/wishlist` |
| My Orders | `/orders` |
| Deals | `/deals/under-999` |

### Share Target

Other apps can share URLs into Thunderbolt via the OS share sheet:
```json
{ "action": "/", "method": "GET", "params": { "title": "title", "text": "text", "url": "url" } }
```

### Launch Handler

Reuses the existing app window instead of opening a second tab:
```json
{ "client_mode": "navigate-existing" }
```

### Window Controls Overlay

`window-controls-overlay` is first in `display_override`. On desktop Chromium PWA installs, the title bar becomes part of the CSS drawing area.

### What Was Intentionally NOT Implemented

| Capability | Reason |
|---|---|
| File Handlers | No file format relevant to a denim store |
| Protocol Handlers | No custom URL protocol needed |
| Periodic Background Sync | Products update in real time via API |
| Push Notifications | Not implemented server-side yet |
| Tabbed Display | Experimental, unstable across browsers |
| Widgets | Windows 11 only — too narrow an audience |
| Edge Side Panel | Edge-only — very low share |
| IARC rating | Not required for ecommerce / Hobby plan |

---

## Update Lifecycle

```
User visits app → SW checks for new version in background
  → New version found → new SW downloads and installs
    → onNeedRefresh(reloadFn) fires
      → 'pwa-update-available' dispatched with reloadFn
        → PWAUpdatePrompt toast appears (bottom of screen)
          → User clicks "Refresh"
              → reloadFn() called → SW.skipWaiting() → clients.claim
                → Page reloads with new version
          → User dismisses
              → Old SW continues until next page load
```

### Stale Chunk Prevention

All JS/CSS filenames include a content hash (`index-CoGOINT0.js`). New deployments produce new hashes — old cached chunks remain valid for the old SW, new SW references new hashes. No stale chunk errors.

`cleanupOutdatedCaches: true` removes cache entries from old SW versions on activation.

---

## Icon Strategy

| File | Size | Purpose |
|---|---|---|
| `icon-72x72.png` | 72×72 | Android legacy |
| `icon-96x96.png` | 96×96 | Shortcut icons |
| `icon-128x128.png` | 128×128 | Chrome Web Store |
| `icon-144x144.png` | 144×144 | Windows tile |
| `icon-152x152.png` | 152×152 | Apple touch (iPad) |
| `icon-192x192.png` | 192×192 | Android home screen (`any`) |
| `icon-384x384.png` | 384×384 | High-DPI Android |
| `icon-512x512.png` | 512×512 | Play Store / splash (`any`) |
| `icon-512x512-maskable.png` | 512×512 | Android adaptive icon (`maskable`) |

The maskable icon has the lightning bolt centered within the 80% safe-zone so it renders correctly under all Android mask shapes (circle, squircle, teardrop).

---

## Splash Screen System

`src/components/SplashScreen.tsx` — renders once per browser session (controlled via `sessionStorage`).

**Sequence** (total ~2.4 s):
1. Lightning bolt scales + fades in (spring easing)
2. Amber glow pulses behind the bolt
3. "THUNDERBOLT" text expands with letter-spacing animation
4. "PREMIUM DENIM" tagline fades in
5. Amber sweep bar progresses across the bottom
6. Full screen fades out

**Performance**: GPU-composited transforms only — no layout thrash. Does not block React Suspense.

---

## Deployment (Vercel)

### Build

| Setting | Value |
|---|---|
| Build Command | `npm run build` |
| Output Directory | `dist/` (auto-detected by Vercel for Vite) |

### Routing

```
vercel.json rewrites (in order):
  1. /api/admin/analytics/* → /api/admin?subpath=*
  2. /api/orders/create|cancel|manage → /api/orders?subpath=*
  3. /api/* → Vercel serverless functions
  4. /(.*) → /index.html  (SPA fallback — static files evaluated first)

Static files served before rewrites:
  /sw.js           → dist/sw.js         (no-cache + Service-Worker-Allowed)
  /workbox-*.js    → dist/workbox-*.js  (no-cache)
  /icons/*         → dist/icons/*       (immutable 1-year cache)
  /screenshots/*   → dist/screenshots/* (1-day cache)
```

### Serverless Functions

11 API handlers in `api/`. Same files run as Express routes in dev and Vercel serverless functions in prod.

---

## TWA / Play Store Readiness

### Current Status: Ready for PWABuilder Packaging

The manifest satisfies all TWA requirements:
- `id: '/'` — stable app identity
- `display: 'standalone'` — required for TWA
- Maskable icon at 512×512
- `theme_color` + `background_color` for splash/status bar
- Valid service worker at root scope (`/`)

### Generating the APK with PWABuilder

1. Visit [PWABuilder.com](https://www.pwabuilder.com)
2. Enter production URL: `https://thunderboltjeans.vercel.app`
3. Package for stores → Android → Download `.aab`
4. Upload to Google Play Console

### Using Bubblewrap (CLI)

```bash
npm install -g @bubblewrap/cli
bubblewrap init --manifest https://thunderboltjeans.vercel.app/manifest.webmanifest
bubblewrap build
```

### Digital Asset Links (Required for TWA)

After generating your signing key fingerprint from PWABuilder/Bubblewrap, create `public/.well-known/assetlinks.json`:

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

Then add a header rule in `vercel.json` to serve it with `Content-Type: application/json`.

---

## Project Structure

### Frontend (`src/`)

```
src/
├── App.tsx                    — Root with providers
├── AppContent.tsx             — Router + SplashScreen + PWAUpdatePrompt
├── main.tsx                   — React root + service worker registration
├── vite-env.d.ts              — Vite + vite-plugin-pwa type references
├── context/
│   ├── AuthContext.tsx
│   ├── CartContext.tsx
│   └── WishlistContext.tsx
├── pages/
│   ├── Index.tsx, About.tsx, CategoryView.tsx, ProductView.tsx
│   ├── Cart.tsx, Wishlist.tsx, Checkout.tsx, Orders.tsx
│   ├── Admin.tsx, Profile.tsx
│   ├── BrandsPage.tsx, BrandView.tsx, DealsPage.tsx
│   └── NotFound.tsx
├── components/
│   ├── SplashScreen.tsx       — Cinematic branded intro
│   ├── PWAUpdatePrompt.tsx    — SW update / offline-ready toast
│   ├── Navbar.tsx, Footer.tsx
│   ├── HeroBanner.tsx, BrandsSection.tsx, LiveSaleSection.tsx
│   ├── CategoriesSection.tsx, PriceDisplay.tsx
│   ├── Analytics/             — Admin analytics dashboard
│   └── products/ProductGrid.tsx
├── lib/
│   ├── pricing.ts, cloudinary.ts, ordersCache.ts
│   ├── requireAuth.ts, modalController.ts
└── utils/
    └── printInvoice.ts
```

### Backend (`api/`)

| File | Routes |
|---|---|
| `api/products/index.js` | `GET/POST/PUT/DELETE /api/products` |
| `api/products/[id].js` | `GET /api/products/:id` |
| `api/orders/index.js` | `GET /api/orders`, `POST create`, `PUT cancel`, `PATCH/DELETE manage` |
| `api/users/index.js` | `POST /api/users/create`, profile + address sub-routes |
| `api/cart/index.js` | `GET/POST/DELETE /api/cart` |
| `api/wishlist/index.js` | `GET/POST/DELETE /api/wishlist` |
| `api/categories/index.js` | `GET/POST/PUT/DELETE /api/categories` |
| `api/address/index.js` | `GET/POST/PUT/DELETE /api/address` |
| `api/reviews/index.js` | `GET/POST/DELETE /api/reviews` |
| `api/admin.js` | `GET /api/admin/analytics` |
| `api/brands/index.js` | `GET/POST/PUT/DELETE /api/brands` |

### Public Assets (`public/`)

```
public/
├── favicon.svg, robots.txt, offline.html
├── icons/                — 9 PWA icons (72–512px) + maskable
├── screenshots/
│   ├── mobile.svg        — Portrait screenshot for manifest (540×960)
│   └── desktop.svg       — Landscape screenshot for manifest (1280×800)
└── banners/              — Hero banner images
```

---

## Database Schema

**MongoDB Atlas** — database: `thunderbold` (intentional)

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

## Pricing System

| Field | Visibility | Purpose |
|---|---|---|
| `price` | Public | Actual selling price |
| `mrp` | Public | Original / crossed-out price |
| `purchasePrice` | Admin only | Internal cost for profit calculations |

`src/lib/pricing.ts` → `computePrice(price, mrp)` derives discount % dynamically. `purchasePrice` is never included in public API responses.

---

## Analytics System

Single endpoint: `GET /api/admin/analytics` — all KPI metrics in one `Promise.all` across MongoDB aggregations.

**Profit calculation**: `(selling price − purchasePrice) × quantity` for delivered/completed orders only. Items without `purchasePrice` are excluded gracefully.

**Monthly charts**: Revenue and order volume for the last 12 months. Zero-activity months are filled automatically.

---

## Admin Panel

Route: `/admin` — restricted to `ADMIN_EMAILS` (hardcoded in `api/_lib/adminHelper.js`).

Tabs: Analytics, Orders, Products, Categories, Brands, Reviews.

No footer inside admin — `<Footer>` only renders on customer-facing pages.

---

## API Reference

All write endpoints require `Authorization: Bearer <firebase-id-token>`. Admin endpoints additionally check `isAdmin(email, db)`.

| Endpoint | Auth | Description |
|---|---|---|
| `GET /api/products` | Public | List products (purchasePrice excluded) |
| `POST /api/products` | Admin | Create product |
| `PUT /api/products` | Admin | Update product |
| `DELETE /api/products` | Admin | Delete product |
| `GET /api/products/:id` | Public | Product detail |
| `GET /api/orders` | User | User's orders |
| `POST /api/orders/create` | User | Place order |
| `PUT /api/orders/cancel` | User | Cancel order (restores stock) |
| `PATCH /api/orders/manage` | Admin | Update order status |
| `DELETE /api/orders/manage` | Admin | Delete order |
| `GET /api/cart` | User | Fetch cart |
| `POST /api/cart` | User | Add to cart |
| `DELETE /api/cart` | User | Remove from cart |
| `GET /api/wishlist` | User | Fetch wishlist |
| `POST /api/wishlist` | User | Add to wishlist |
| `DELETE /api/wishlist` | User | Remove from wishlist |
| `GET /api/admin/analytics` | Admin | Full analytics payload |
| `GET /api/brands` | Public | List brands |
| `GET /api/categories` | Public | List categories |

---

## PWABuilder Verification

### What PWABuilder Detects After This Fix

| Check | Status | Detail |
|---|---|---|
| Service Worker | Detected | `generateSW` strategy, Workbox 7 runtime |
| SW Logic | Present | Precache + 5 runtime caching rules |
| Offline Support | Present | `navigateFallback` + `offline.html` |
| Manifest Valid | Yes | All required fields populated |
| `id` field | Present | `/` |
| `display_override` | Present | WCO + standalone + minimal-ui |
| Shortcuts | 4 shortcuts | Cart, Wishlist, Orders, Deals |
| Screenshots | 2 images | Narrow (mobile) + Wide (desktop) |
| Share Target | Present | URL sharing via OS share sheet |
| Launch Handler | Present | `navigate-existing` |
| Maskable Icon | Present | 512×512 maskable |

### Chrome DevTools Verification Checklist

1. Application → Service Workers: SW is active and controlling the page
2. Application → Manifest: all fields parsed, no errors
3. Application → Storage → Cache Storage: precache entries visible
4. Network: `/api/*` requests show no SW intercept (NetworkOnly)
5. Network → Offline mode: `offline.html` served for uncached routes

---

## Edge Cases Handled

| Case | Handling |
|---|---|
| Old products with `purchasePrice` as MRP | `mrp: doc.mrp ?? doc.purchasePrice ?? null` — no migration |
| Products with no `purchasePrice` | Excluded from profit calculations |
| Out-of-stock sizes | Size buttons disabled; atomic stock check on order create |
| Order cancellation | Restores `sizeStock` per size + total `stock` |
| Mid-checkout SW update | `registerType: 'prompt'` — user decides when to reload |
| Stale JS chunks after deploy | Content-hash filenames + `cleanupOutdatedCaches: true` |
| API offline | `NetworkOnly` — no stale API data ever served |
| Navigation offline (uncached) | Served from precached `index.html` (SPA shell) |
| SW not supported | `'serviceWorker' in navigator` guard in `main.tsx` |
| PWA register import failure | try/catch in `main.tsx` — app works without SW |
| Duplicate app windows | `launch_handler: navigate-existing` prevents it |

---

## Troubleshooting

### Service Worker Not Detected by PWABuilder

- Must test the **production URL** (`thunderboltjeans.vercel.app`), not localhost
- SW is only generated by `npm run build` — dev mode has no SW
- Confirm `dist/sw.js` exists and `Content-Type` is `application/javascript` (not `text/html`)

### Install Prompt Not Appearing

- Must be served over HTTPS
- Chrome has an engagement heuristic (2+ visits, 30+ second sessions)
- Check DevTools → Application → Manifest for any parsing errors
- Confirm 192×192 (`any`) and 512×512 (`maskable`) icons exist

### Blank Screen After Deploy

- A stale SW may be serving an old `index.html` referencing deleted chunk hashes
- DevTools → Application → Service Workers → Unregister → hard refresh
- The `prompt` strategy prevents this in most cases since users get a "Refresh" button

### API Calls Failing Offline

- Expected — `NetworkOnly` ensures no stale API data
- The UI shows an error/empty state — not a crash

---

## Dependencies

| Package | Version | Purpose |
|---|---|---|
| `vite-plugin-pwa` | `^1.3.0` | Workbox SW generation + manifest injection + `virtual:pwa-register` |

No other new runtime dependencies added. All PWA functionality is build-time (Workbox) or native browser APIs.

---

*Thunderbolt — Premium Indian Denim. Built for the Bold.*
