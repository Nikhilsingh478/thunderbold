# Thunderbold — Complete Project Documentation

## Overview

Thunderbold is a production-grade premium fashion e-commerce storefront for a real retail brand. The platform is a full-stack Progressive Web App (PWA) built on React 18 + Vite (frontend), Node.js/Express (backend API), Firebase Authentication, and MongoDB Atlas. It supports end-to-end retail operations: product browsing by category/brand, cart management, wishlist, checkout with gift messaging, order tracking, return/refund requests, customer reviews, push notifications, and a full admin panel.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite 5, Tailwind CSS, shadcn/ui |
| Routing | React Router v6 |
| Server State | TanStack Query (React Query) |
| Animations | Framer Motion |
| Charts | Recharts |
| Authentication | Firebase Authentication (email/password + Google OAuth) |
| Database | MongoDB Atlas |
| Backend | Node.js + Express (dev), Vercel Serverless Functions (prod) |
| PWA | vite-plugin-pwa v1.x + Workbox `generateSW` strategy |
| Push Notifications | Firebase Cloud Messaging (FCM) |
| Icons | Lucide React |
| Image CDN | Cloudinary |
| Build | Vite (frontend) |

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                         Browser                              │
│   React 18 SPA (Vite dev server — port 5000)                │
│   • React Router v6  — client-side routing                  │
│   • TanStack Query   — server state + caching               │
│   • Framer Motion    — animations                           │
│   • Firebase Auth SDK — client-side session management      │
│   • Firebase FCM SDK  — push notification subscription      │
│   • Workbox SW        — offline cache + PWA install         │
└───────────────────────────┬──────────────────────────────────┘
                            │  /api/*  (Vite proxy in dev)
┌───────────────────────────▼──────────────────────────────────┐
│                 Express API (port 3001)                       │
│   api/*.js — same files run on Vercel as serverless fns     │
│   • Firebase Admin SDK — token verification                 │
│   • MongoDB Atlas (getDb() cached client)                   │
│   • isAdmin() — email-based admin guard                     │
│   • isRateLimited() — in-memory rate limiter                │
└──────────────────────────────────────────────────────────────┘
```

### Running Locally

```bash
npm run dev
```

This runs two concurrent processes:
- `node server.js` — Express API on port 3001
- `vite` — Frontend on port 5000, proxying `/api/*` to Express

---

## Environment Variables

All secrets are stored in **Replit Secrets** (never committed to source). The server reads them via `process.env.*` at runtime. The Replit platform makes secret *names* visible to the agent for planning purposes — the actual values are never accessible and remain encrypted.

| Variable | Used By | Purpose |
|---|---|---|
| `MONGO_URI` | Backend | MongoDB Atlas connection string (`mongodb+srv://...`) |
| `VITE_FIREBASE_API_KEY` | Frontend + Backend | Firebase project API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Frontend | Firebase Auth domain (`project.firebaseapp.com`) |
| `VITE_FIREBASE_PROJECT_ID` | Frontend + Backend | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Frontend | Firebase Storage bucket URL |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Frontend | FCM sender ID |
| `VITE_FIREBASE_APP_ID` | Frontend | Firebase App ID |
| `VITE_FIREBASE_VAPID_KEY` | Frontend | FCM VAPID public key — required to register push subscription tokens |

**Without `MONGO_URI`:** All database endpoints return `500 Database unavailable` explicitly — no silent fallbacks by design.

**Without `VITE_FIREBASE_VAPID_KEY`:** The app works fully but push notification subscription silently skips token registration.

---

## Project Structure

### Frontend (`src/`)

```
src/
├── App.tsx                        — Root: wraps AuthProvider, CartProvider, WishlistProvider, QueryClientProvider
├── AppContent.tsx                 — Router, SplashScreen, PageLoader, Login modal, AnnouncementBar
├── index.css                      — Global styles, Tailwind directives, custom CSS variables
│
├── context/
│   ├── AuthContext.tsx            — Firebase onAuthStateChanged; exposes user, loading, login, logout
│   ├── CartContext.tsx            — Cart state (persisted to localStorage)
│   └── WishlistContext.tsx        — Wishlist state (localStorage)
│
├── pages/
│   ├── Index.tsx                  — Homepage: Hero, BrandsSection, LiveSaleSection, CategoriesSection, Footer
│   ├── About.tsx                  — Brand story page
│   ├── CategoryView.tsx           — Category product grid with discount badges
│   ├── ProductView.tsx            — Product detail: images, sizes, description, MRP/price, add to cart/wishlist
│   ├── Cart.tsx                   — Cart page
│   ├── Wishlist.tsx               — Wishlist page
│   ├── Checkout.tsx               — Checkout: address form + order summary + optional gift message
│   ├── Orders.tsx                 — Customer order history: statuses, cancel (pending only),
│   │                                request return (delivered only), review delivered items
│   ├── Admin.tsx                  — Full admin panel (tabs: Analytics, Orders, Products,
│   │                                Categories, Brands, Reviews, Slider, Notify, Returns)
│   ├── Profile.tsx                — User profile + saved addresses + account deletion
│   ├── BrandsPage.tsx             — All brands listing
│   ├── BrandView.tsx              — Products filtered by brandId
│   ├── DealsPage.tsx              — Denim-only deals filtered by price cap (≤₹999 or ≤₹699)
│   └── NotFound.tsx               — 404 page
│
├── components/
│   ├── SplashScreen.tsx           — Cinematic branded intro (once per session via sessionStorage)
│   ├── AnnouncementBar.tsx        — Fixed marquee bar, top-0, z-[120], h-9 (36px)
│   ├── Navbar.tsx                 — Fixed navbar, auth skeleton (no flicker), mobile full-screen menu
│   ├── Footer.tsx                 — Customer pages only (not admin); policy modals
│   ├── HeroBanner.tsx             — Full-width hero/sale image
│   ├── BrandsSection.tsx          — Horizontal logo marquee
│   ├── LiveSaleSection.tsx        — "Live Sale" highlighted product grid
│   ├── CategoriesSection.tsx      — Master homepage section: categories, PromoBanner, ThunderboltSlider
│   ├── ThunderboltSlider.tsx      — Editorial 3D coverflow outfit carousel (swipe-only, no arrows)
│   ├── PriceDisplay.tsx           — Unified price renderer: selling + strikethrough MRP + discount badge
│   ├── CustomCursor.tsx           — Custom cursor for desktop
│   ├── ScrollProgress.tsx         — Top scroll progress bar
│   ├── PWAUpdatePrompt.tsx        — Toast prompting user to reload when a new SW version is available
│   ├── ReturnRequestModal.tsx     — Customer return request form: reason picker + description + refund estimate
│   │
│   ├── promo/
│   │   ├── PromoBanner.tsx        — Side-by-side static deal banners (Under ₹999, Under ₹699)
│   │   └── promoSlides.ts         — Image paths + routes for promo banners
│   │
│   ├── checkout/
│   │   ├── AddressForm.tsx        — Validated delivery address form
│   │   ├── ProductSummary.tsx     — Order items + total summary panel
│   │   └── OrderConfirmation.tsx  — Post-order success modal
│   │
│   ├── reviews/
│   │   ├── ReviewModal.tsx        — Submit/edit/delete product reviews (delivered orders only)
│   │   └── LightningRating.tsx    — Lightning-bolt star rating widget
│   │
│   └── Analytics/
│       ├── AnalyticsTab.tsx       — Admin analytics dashboard wrapper
│       ├── StatsCard.tsx          — KPI metric tile
│       ├── RevenueChart.tsx       — Monthly revenue area chart (Recharts)
│       ├── OrdersChart.tsx        — Monthly orders bar chart (Recharts)
│       ├── TopProducts.tsx        — Best-selling products list
│       ├── StockAlerts.tsx        — Low-stock product alerts
│       ├── RecentOrders.tsx       — Recent orders mini-table
│       └── types.ts               — Shared TypeScript interfaces for analytics
│
├── lib/
│   ├── pricing.ts                 — computePrice(sellingPrice, mrp) → PriceInfo
│   ├── cloudinary.ts              — Cloudinary URL optimisation helpers + IMG_SIZES presets
│   ├── ordersCache.ts             — Deduped fetch + in-memory cache keyed by user UID
│   ├── requireAuth.ts             — Defer actions until Firebase auth resolves
│   ├── modalController.ts         — Event bus for opening the login modal from anywhere
│   ├── policyContent.ts           — Policy text data (privacy, terms, returns & cancellation)
│   └── utils.ts                   — formatOrderId() + shared utilities
│
└── utils/
    └── printInvoice.ts            — Browser-print packing slip generator (gift message aware)
```

### Backend (`api/`)

Each file is a Vercel Serverless Function. The same files are mounted as Express routes in `server.js` for local development. No code duplication.

| File | HTTP Methods & Routes |
|---|---|
| `api/products/index.js` | `GET /api/products` (list + filter), `POST` (create), `PUT` (update), `DELETE` |
| `api/products/[id].js` | `GET /api/products/:id` (single product detail) |
| `api/orders/index.js` | `GET /api/orders` (user or all-admin), `POST .../create`, `PUT .../cancel`, `PATCH/DELETE .../manage` |
| `api/returns/index.js` | `GET /api/returns` (user: own; admin: all), `POST` (create request), `PATCH?id=` (admin approve/reject) |
| `api/users/index.js` | `POST /api/users/create`, profile read/update, address sub-routes, FCM token registration, account deletion |
| `api/cart/index.js` | `GET/POST/DELETE /api/cart` |
| `api/wishlist/index.js` | `GET/POST/DELETE /api/wishlist` |
| `api/categories/index.js` | `GET/POST/PUT/DELETE /api/categories` |
| `api/address/index.js` | `GET/POST/PUT/DELETE /api/address` |
| `api/reviews/index.js` | `GET /api/reviews` (by product or mine=true), `POST` (create), `PUT?id=` (update), `DELETE?id=` |
| `api/admin.js` | `GET /api/admin/analytics` — all KPIs + charts in one payload |
| `api/brands/index.js` | `GET/POST/PUT/DELETE /api/brands` |
| `api/slider/index.js` | `GET /api/slider` (public), `POST /api/slider` (admin-only) |
| `api/notifications/index.js` | `POST .../broadcast` (admin), `POST .../test-send` (admin) |

### Shared Backend Helpers (`api/_lib/`)

| File | Purpose |
|---|---|
| `mongodb.js` | `getDb()` — cached `MongoClient`, returns the `thunderbold` database |
| `firebaseAdmin.js` | `verifyFirebaseToken(idToken)` — decodes and validates Firebase JWT |
| `adminHelper.js` | `isAdmin(email, db)` — checks DB role first, falls back to hardcoded `ADMIN_EMAILS` array |
| `rateLimit.js` | `isRateLimited(req)` — in-memory sliding-window rate limiter for write endpoints |
| `validator.js` | Input validation utilities |
| `response.js` | Standard JSON response helpers |

---

## Database

**MongoDB Atlas** — database name: `thunderbold` (intentional — not a typo)

### Collections

| Collection | Description |
|---|---|
| `products` | Full product catalog with size stock, images, pricing, and highlights |
| `orders` | Customer orders — all statuses including return lifecycle |
| `returns` | Return requests — one per order, linked by `orderId` |
| `users` | User profiles, saved addresses, FCM tokens |
| `cart` | Per-user cart items (synced with backend) |
| `wishlist` | Per-user wishlisted products |
| `categories` | Category records (name, image, section) |
| `brands` | Brand records (name, logoUrl) |
| `addresses` | Saved delivery addresses per user |
| `reviews` | Per-product customer reviews (rating + comment) |
| `slider` | ThunderboltSlider editorial config — always 4 slots, admin-managed |

---

## Data Models

### Product

```js
{
  _id,
  name,
  price,           // Selling price — what the customer pays at checkout
  mrp?,            // MRP / original price — shown crossed-out (indicates discount)
  purchasePrice?,  // Internal cost — admin-only, never sent to customers, used for profit analytics
  brandId?,        // Optional — references brands._id
  image,           // Primary display image (Cloudinary URL)
  images[],        // All product images (first = primary)
  description,
  categoryId,
  section,         // 'live-sale' | 'denim' | 'tshirts' | 'kurta' | 'outfits'
  sizeStock: {
    // Jeans/denim:
    '28': n, '30': n, '32': n, '34': n, '36': n
    // OR apparel (tshirts, kurta, outfits):
    'S': n, 'M': n, 'L': n, 'XL': n, 'XXL': n
  },
  stock,           // Computed total — sum of all sizeStock values
  highlights?: {   // Optional metadata shown on product page
    color, length, printsPattern, waistRise, shade, lengthInches
  },
  // Outfit products only — separate topwear + bottomwear:
  topwear?: { sizeStock, stock, highlights },
  bottomwear?: { sizeStock, stock, highlights },
  createdAt,
  updatedAt?
}
```

### Order

```js
{
  _id,
  userId,          // Customer email (from Firebase token — used as owner key)
  orderNumber?,    // Human-readable ID e.g. "TB-001234" (auto-generated)
  products: [
    {
      productId,
      name,
      price,         // Selling price at time of order (snapshot — not live product price)
      size,
      quantity,
      image,
      topwearSize?,  // Outfit products only
      bottomwearSize?
    }
  ],
  address: {
    fullName, phone, addressLine1, addressLine2?,
    city, state, pincode, landmark?
  },
  paymentMethod,   // 'COD' (Cash on Delivery — only method currently)
  status,          // See Order Status Flow below
  totalAmount,     // Server-calculated: sum(price × quantity) — never trusted from client
  createdAt,
  updatedAt?,
  clientOrderId?,  // UUID idempotency key — prevents duplicate orders on network retry
  giftMessage?     // Optional — HTML-stripped, max 300 chars, stored only when non-empty
}
```

### Return Request

```js
{
  _id,
  orderId,               // String ID linking to the orders collection
  orderNumber?,          // Human-readable order number (copied from order)
  userId,                // Customer email — must match the order owner
  products[],            // Snapshot of order.products at time of request
  totalAmount,           // Snapshot of order.totalAmount
  shippingCharges,       // ₹50 — deducted from every approved refund
  suggestedRefundAmount, // totalAmount − shippingCharges (pre-calculated, admin can override)
  reason,                // 'defective' | 'wrong_item' | 'size_issue' | 'not_as_described' | 'other'
  description,           // Customer's explanation — HTML-stripped, 10–500 chars
  status,                // 'pending' | 'approved' | 'rejected'
  refundAmount?,         // Set by admin on approval — may differ from suggestedRefundAmount
  adminNotes?,           // Optional admin message (shown to customer indirectly)
  createdAt,
  updatedAt
}
```

---

## Order Status Flow

```
[Customer places order]
         │
         ▼
      pending  ◄── Customer CAN cancel here (Cancel button visible in My Orders)
         │
         │  [Admin confirms via call]
         ▼
     confirmed  ◄── Customer CANNOT cancel anymore
         │
         │  [Packed for dispatch]
         ▼
       packed
         │
         │  [Dispatched]
         ▼
      shipped
         │
         │  [Delivered to customer]
         ▼
     delivered  ◄── Customer CAN request a return here
         │
         │  [Customer submits ReturnRequestModal]
         ▼
  return_requested  ◄── Admin reviews in Returns tab
         │
    ┌────┴────┐
    ▼         ▼
return_    return_
approved   rejected
```

**Additional terminal state:** `cancelled` (reachable only from `pending` by customer, or from non-delivered states by admin)

### Policy Details

| Scenario | Rule |
|---|---|
| Cancel when `pending` | Allowed — stock restored per size, `status → cancelled` |
| Cancel when `confirmed` or beyond | Blocked for customers — error message with support phone number |
| Admin cancel | Allowed for any status except `delivered`, `return_*` |
| Return request | Only when `status === 'delivered'` AND no prior return exists for this order |
| One return per order | Enforced: duplicate POST returns `409 Conflict` |
| Refund amount | `totalAmount − ₹50 shipping charges` — admin can override when approving |
| 3 delivery attempts | If undeliverable after 3 attempts, package returns to us — customer is not charged |

---

## Cancellation — Technical Detail

**Backend (`api/orders/index.js` → `handleCancel`):**

```
1. Verify Firebase token → extract email
2. Fetch order by ID
3. Check ownership (userId === email) OR isAdmin
4. If status === 'cancelled' → 400 Already cancelled
5. If not admin AND status !== 'pending' → 400 with status-specific message
6. If admin AND status in [delivered, return_*] → 400 blocked
7. Update status → 'cancelled'
8. Restore sizeStock per ordered size + total stock
```

**Frontend (`src/pages/Orders.tsx`):** Cancel button only renders when `order.status === 'pending'`.

---

## Return / Refund System — Technical Detail

### Customer Flow

1. Order has `status === 'delivered'` → "Return" button appears (amber, with RotateCcw icon)
2. Button opens `ReturnRequestModal`:
   - **Reason picker** — 5 options: Defective Product, Wrong Item Delivered, Size Issue, Not As Described, Other
   - **Description textarea** — 10–500 characters, HTML-stripped server-side
   - **Refund estimate** — displays `totalAmount − ₹50` before submitting
3. On submit → `POST /api/returns` with `{ orderId, reason, description }`
4. Backend creates return document, updates `order.status → 'return_requested'`
5. UI optimistically updates order status — "Return" button disappears, replaced by amber "Return Pending" badge + info banner

### Admin Flow (`Admin.tsx` → Returns tab)

- Lists all return requests, newest first
- Pending count badge shown next to "Returns" tab label
- Each card shows: order reference, customer email, reason, full description, order total, product list, suggested refund amount
- **Approve**: Admin enters refund amount (defaults to `totalAmount − ₹50`), adds optional notes → `PATCH /api/returns?id=...` with `{ action: 'approve', refundAmount, adminNotes }`
- **Reject**: Admin adds notes → `PATCH /api/returns?id=...` with `{ action: 'reject', adminNotes }`
- On either action: return status updated, corresponding order status updated (`return_approved` or `return_rejected`)

### Return Request API (`api/returns/index.js`)

| Method | Auth | Action |
|---|---|---|
| `GET /api/returns` | Required | Customer: own returns; Admin: all returns |
| `POST /api/returns` | Required | Create return (delivered orders only, one per order) |
| `PATCH /api/returns?id=` | Admin only | Approve (with refundAmount) or reject (with notes) |

---

## Pricing System

Three fields serve entirely different purposes:

| Field | Who Sees It | Purpose |
|---|---|---|
| `price` | Everyone (customers + admin) | Actual selling price — what the customer pays |
| `mrp` | Everyone (customers + admin) | Original/RRP — shown crossed-out to communicate savings |
| `purchasePrice` | Admin only, never in public API | Internal cost — used only for profit analytics |

### `computePrice()` (`src/lib/pricing.ts`)

```ts
computePrice(price, mrp) → {
  sellingPrice,   // cleaned selling price
  mrp,            // original price
  discountPct,    // derived dynamically: Math.round((1 - selling/mrp) * 100)
  savings,        // mrp - sellingPrice
  hasDiscount     // true when mrp > sellingPrice
}
```

`src/components/PriceDisplay.tsx` uses this to render: selling price + optional strikethrough MRP + "X% OFF" badge. Used on every product card and the product detail page.

### Backward Compatibility

Old products that stored MRP in `purchasePrice` before the field split are handled by the API:

```js
mrp: doc.mrp ?? doc.purchasePrice ?? null
```

No data migration was ever needed.

---

## Admin Panel

Route: `/admin` — hard-guarded both frontend (ADMIN_EMAILS check in `Admin.tsx`) and backend (`isAdmin()` on every write endpoint).

### Admin Emails

Hardcoded in two places — must be kept in sync:
- `api/_lib/adminHelper.js`
- `src/pages/Admin.tsx`

```js
const ADMIN_EMAILS = [
  "adminthunderbold@gmail.com",
  "neelsingh45940s@gmail.com",
  "thepavanartt@gmail.com",
];
```

To add an admin: update both files.

### Tabs

| Tab | Icon | Description |
|---|---|---|
| Analytics | BarChart3 | Revenue, profit, order KPI cards; monthly revenue + orders charts; top products; stock alerts; recent orders |
| Orders | Users | All orders table; status update dropdown; view delivery address + gift message modal; print packing slip; delete order |
| Products | Package | Create/edit/delete products. Form: name, section, category, brand, MRP, selling price, cost/purchase price (admin-only), per-size stock, up to N images, description, highlights |
| Categories | Folder | Create/edit/delete categories (name, image URL, section) |
| Brands | Tag | Create/edit/delete brand names + logo URLs |
| Reviews | MessageSquare | Per-product review listing with admin delete |
| Slider | SlidersHorizontal | Configure all 4 ThunderboltSlider slides (image URL, heading text, linked outfit product) |
| Notify | Bell | Broadcast push notification to all subscribed users (title, body, optional image URL) |
| Returns | RotateCcw | Review pending return requests; approve with custom refund amount; reject with notes |

The admin panel has **no footer** — `Footer.tsx` is only rendered on customer-facing pages.

---

## Analytics System

### Endpoint

`GET /api/admin/analytics` — single payload via `Promise.all` across multiple MongoDB aggregation pipelines.

### KPI Cards

| Metric | Definition |
|---|---|
| Total Revenue | Sum of `totalAmount` for all non-cancelled orders in the selected date range |
| Net Revenue | Same, but lifetime (all time) |
| Total Orders | Count of all orders in the selected date range |
| Avg Order Value | Total Revenue ÷ Total Orders |
| Period Profit | Sum of (selling price − purchasePrice) × quantity for delivered orders in range |
| Net Profit (All Time) | Same profit calculation, lifetime, all delivered/completed orders |

### Profit Calculation Pipeline

Only `delivered` and `completed` orders count toward profit. Items without a `purchasePrice` are excluded gracefully.

```
orders (status: delivered or completed)
  → $unwind products[]
  → $lookup → products collection (get purchasePrice per productId)
  → $filter (exclude items where purchasePrice is null/missing)
  → $group: sum((item.price - product.purchasePrice) × item.quantity)
```

### Monthly Charts

Revenue and order volume for the last 12 months. Months with zero activity are always filled in so the chart always shows a complete 12-month window without gaps.

---

## PWA (Progressive Web App)

### Implementation

- `vite-plugin-pwa` v1.x with `generateSW` strategy
- Workbox handles asset precaching and runtime caching
- `public/manifest.webmanifest` — full Web App Manifest with:
  - `id`, `name`, `short_name`, `description`
  - `display_override: ['standalone', 'minimal-ui']`
  - `theme_color`, `background_color`
  - App shortcuts (Shop, Orders, Cart)
  - Share target (`/share-target`)
  - Launch handler (`client-mode`)
  - Screenshots for install prompt
- `public/sw.js` — generated service worker (Workbox)
- `public/offline.html` — offline fallback page

### Update Prompt

`src/components/PWAUpdatePrompt.tsx` — listens for `onNeedRefresh` from Workbox. When a new service worker is waiting, shows a toast: "Update available" with a "Reload" button that calls `updateServiceWorker(true)`.

### Display Mode Detection

A CSS custom property `--tb-banner-h` adapts the layout for PWA mode:

```css
/* Browser: APK download banner is visible */
--tb-banner-h: 36px;

/* Standalone / PWA / fullscreen: banner is hidden */
@media (display-mode: standalone), (display-mode: fullscreen) {
  --tb-banner-h: 0px;
}
```

All page top-padding uses `calc(base + var(--tb-banner-h))` so content always clears the stacked fixed bars correctly in both contexts.

---

## Push Notifications (FCM)

### How It Works

1. User opens the app in a browser that supports notifications
2. `src/context/AuthContext.tsx` (or equivalent) requests notification permission after login
3. Firebase `getToken(messaging, { vapidKey })` registers a device token — requires `VITE_FIREBASE_VAPID_KEY`
4. Token is sent to `POST /api/users/fcm-token` and stored in the user's `users` document in MongoDB
5. Admin visits **Notify** tab in the admin panel → enters title, body, optional banner image URL → clicks "Send to All Subscribers"
6. `POST /api/notifications/broadcast` fetches all FCM tokens from MongoDB → calls Firebase Admin `sendEachForMulticast()` → fire-and-forget per token
7. Failed/stale tokens (404/410 errors from FCM) are removed from the database automatically

### Vercel.json Rewrites

```json
{ "source": "/api/notifications/broadcast", "destination": "/api/notifications?subpath=broadcast" },
{ "source": "/api/notifications/test-send",  "destination": "/api/notifications?subpath=test-send" }
```

---

## Homepage Layout

Components render in this exact order:

1. **`AnnouncementBar`** — `position: fixed`, `top: 0`, `z-index: 120`, `height: 36px` — animated marquee promotional text
2. **APK Banner** — `position: fixed`, `z-index: 99999`, `height: 36px` — "Download our app" strip; hidden in standalone/PWA/WebView via `display-mode` media query
3. **`Navbar`** — `position: fixed`, `top: calc(36px + var(--tb-banner-h))`, `z-index: 100`
4. **`HeroBanner`** — Full-width hero or sale image (first visible element below fixed bars)
5. **`BrandsSection`** — Horizontal auto-scrolling logo marquee
6. **`LiveSaleSection`** — Products with `section === 'live-sale'`
7. **`CategoriesSection`** — Composite section containing:
   - Denim Collection category cards (grid)
   - **`PromoBanner`** — Under ₹999 + Under ₹699 side-by-side deal banners
   - **`ThunderboltSlider`** — 3D coverflow editorial outfit carousel
   - T-Shirt Collection category cards (if any exist)
   - Kurta Collection product grid
   - Thunder Looks / Outfits product grid
8. **`Footer`**

### Page Top-Padding Formula

```css
/* All customer pages */
pt-[calc(100px + var(--tb-banner-h))]   /* mobile */
pt-[calc(108px + var(--tb-banner-h))]   /* md+ */
```

---

## Navbar Architecture

### Layout

```
[THUNDERBOLD ⚡] │ [Search input (desktop)] │ Categories │ About Us │ Wishlist │ Cart │ [Auth]
```

On mobile, the search bar moves below the navbar as a full-width tap target (`MobileSearchBar` rendered in `Index.tsx`).

### Auth Loading (zero-flicker design)

While Firebase `onAuthStateChanged` is resolving (`loading === true`):
- A skeleton placeholder (`w-8 h-8 rounded-full bg-white/[0.06] animate-pulse`) renders in place of both the profile avatar and login button
- The mobile full-screen menu suppresses auth-dependent items (`Profile`, `Orders`, `Logout`, `Login`) until resolved
- No layout shift — the skeleton has identical dimensions to the profile avatar

### Scroll Behaviour

After scrolling 50px: transitions to `bg-[#070707]/90 backdrop-blur-md border-b border-white/5`.

### Mobile Full-Screen Menu

Opens via a clip-path circle animation anchored to the hamburger button. Closes automatically on route change.

---

## ThunderboltSlider (Outfit Carousel)

`src/components/ThunderboltSlider.tsx`

### Position

Inside `CategoriesSection.tsx`, between the `PromoBanner` and T-Shirt Collection. Bleeds edge-to-edge via negative margins (`-mx-6 md:-mx-16`).

### Data

`GET /api/slider` → `{ slides: SlideData[4] }`. Admin-managed. If all 4 slots have neither `imageUrl` nor `heading`, the component renders nothing.

### Slide Shape

```ts
interface SlideData {
  imageUrl: string;
  heading: string;        // e.g. "SHARP", "REBEL", "WILD", "NOIR"
  productId: string | null;
  productName: string | null;
  productImage: string | null;
}
```

### Swipe Navigation (Pointer Events API)

- `onPointerDown` — records `dragStartX`
- `onPointerMove` — accumulates `dragDeltaX`; sets `isDragging = true` once `|delta| > 8px`
- `onPointerUp` — if `|delta| > 50px`: advance slide in swipe direction; if `isDragging`, suppress link click
- `setPointerCapture` on the container — gesture tracked even if pointer leaves the element
- `touch-action: pan-y` — native vertical scrolling preserved; horizontal intercepted

### Visual Design

- 4-slot 3D coverflow: active card full-size + sharp; adjacent cards scaled + blurred; far card tiny + near-transparent
- Large ghost heading (Bebas Neue, up to 380px) behind cards with cinematic blur-in on slide change
- Film grain overlay (`opacity: 0.4`) for editorial texture
- Bottom-left: "THUNDER LOOKS" label + dot indicators (active dot expands to 24px width)
- Bottom-right: "SHOP THIS LOOK →" CTA — links to active slide's product page; click suppressed if a swipe occurred

---

## Gift / Order Message

### Checkout UI

- Full-width card below the address + summary grid
- Textarea: 3 rows, 300 character max with live counter (counter turns red at limit)
- Non-blocking — empty message is silently omitted from the order payload

### Backend Sanitization

```js
const sanitizedGiftMessage = typeof giftMessage === "string"
  ? giftMessage.replace(/<[^>]*>/g, "").trim().slice(0, 300)
  : "";
// Stored only when non-empty — no empty strings in DB
...(sanitizedGiftMessage ? { giftMessage: sanitizedGiftMessage } : {})
```

### Admin View

"View Address" modal on any order row includes a `giftMessage` section (amber label, `whitespace-pre-wrap` box) — conditionally rendered only when the field exists.

### Packing Slip

`printInvoice.ts` renders an amber-bordered box with the message between the order meta grid and the items table — only when `giftMessage` is present.

---

## Order Print / Packing Slip

`src/utils/printInvoice.ts` — opens a new browser window with a complete HTML packing slip and triggers `window.print()`.

### Document Contents (in order)

1. **Header** — Brand name (amber) + "Packing Slip" + short order ID
2. **Meta grid** (2-column): Order ID, date, payment method, status badge | Ship-to address + phone
3. **Gift Message box** (conditional) — amber-bordered, `white-space: pre-wrap`
4. **Items table** — product name, size, quantity, unit price, line total
5. **Summary box** — subtotal, shipping (Free), order total
6. **Footer** — "Thank you" + customer name + print timestamp

---

## Customer Reviews

`api/reviews/index.js` + `src/components/reviews/ReviewModal.tsx`

- Only available for items in **delivered** orders — enforced both frontend (button only shown) and backend (order status check on POST)
- One review per (user, product) pair — upsert on duplicate
- Rating: 1–5 rendered as lightning bolts via `LightningRating.tsx`
- Admin can delete any review from the Reviews tab

---

## Deals / Promo Filtering

```
/deals/under-999  →  GET /api/products?maxPrice=999&section=denim
/deals/under-699  →  GET /api/products?maxPrice=699&section=denim
```

Both price cap AND section filter applied — ensures only denim/jeans appear regardless of category pricing.

---

## Brand System

1. Admin creates brand records in the Brands tab (name + logo URL)
2. Products optionally reference a `brandId` (set in product form dropdown)
3. `BrandsSection` on homepage: auto-scrolling logo marquee
4. `/brands` — all brands grid → `/brand/:brandId` — products filtered by brand

---

## Size-Based Stock System

- **Jeans/denim:** `sizeStock` keys `['28','30','32','34','36']`
- **Apparel (t-shirts, kurtas, outfits):** `sizeStock` keys `['S','M','L','XL','XXL']`
- `stock` field = computed total (sum of all size values)

### Atomic Stock Operations

- **Order creation:** Pre-flight check + atomic `$inc` decrement per size. If any size is out of stock, the order is rejected cleanly.
- **Cancellation:** `$inc` restores per-size quantity and total stock.
- Concurrent orders cannot oversell — MongoDB atomic operations guarantee this.

---

## Checkout Flow

1. User arrives at `/checkout` from Cart ("Checkout") or ProductView ("Buy Now")
2. Saved address auto-loaded from localStorage, then profile default address overrides if available
3. Address form validation:
   - Full name (required)
   - Phone: 10-digit Indian mobile format
   - Address line 1 (required)
   - City, state (required)
   - Pincode: exactly 6 digits
4. Optional gift message (below the 2-column grid)
5. "Place Order" submits to `POST /api/orders/create` with:
   - Validated address
   - Cart items snapshot (productId, name, price, size, quantity, image)
   - `paymentMethod: 'COD'`
   - `clientOrderId` UUID — idempotency key
   - `giftMessage` (omitted if empty)
6. Server calculates `totalAmount` independently — never trusts client-sent total
7. Retry wrapper: up to 3 attempts on network failure with exponential backoff
8. Success: cart cleared (if cart checkout), `OrderConfirmation` modal shown, redirect to `/orders`

---

## Splash Screen

`src/components/SplashScreen.tsx` — plays once per browser session (`sessionStorage` guard).

- Full-screen `#0a0a0a` background
- Lightning bolt icon: scale + opacity spring animation
- Amber radial glow behind the bolt
- "THUNDERBOLD" brand text: letter-spacing expand animation
- "PREMIUM DENIM" tagline: fade in
- Amber sweep bar: progress across bottom
- Smooth fade-out after ~2 seconds
- Overlays the app — does not block routing, React Suspense, or data fetching

---

## Policy System

`src/lib/policyContent.ts` — single source of truth for all policy text. Changes here automatically propagate to:
- `Footer.tsx` — "Returns & Cancellation", "Privacy Policy", "Terms & Conditions" buttons open in-app modals
- Any dedicated policy page

### Policy Data Shape

```ts
interface PolicyData {
  id: 'privacy' | 'terms' | 'returns';
  title: string;
  subtitle: string;
  sections: Array<{
    heading: string;
    text: string;
    list?: string[];
    highlight?: boolean;  // Renders with brass background tint
  }>;
}
```

---

## Deployment

### Local / Replit (Development)

```bash
npm run dev
# Concurrently:
#   node server.js       — Express API on :3001
#   vite                 — Frontend on :5000, /api/* proxied to Express
```

### Vercel (Production)

- **Build command:** `npm run build` → output to `dist/`
- **Serverless functions:** Files in `api/` become functions automatically
- **Sub-route pattern:** Sub-paths (e.g. `/api/orders/create`) are routed via `vercel.json` rewrites using `?subpath=create` — the handler switches on `req.query.subpath` (Vercel) or URL path (Express). Same code, zero duplication.
- **Function limit:** Vercel Hobby plan — 12 serverless functions max

### `vercel.json` Key Rewrites

```json
{ "source": "/api/orders/:sub(create|cancel|manage)", "destination": "/api/orders?subpath=:sub" },
{ "source": "/api/returns", "destination": "/api/returns" },
{ "source": "/api/notifications/broadcast", "destination": "/api/notifications?subpath=broadcast" },
{ "source": "/api/(.*)", "destination": "/api/$1" },
{ "source": "/(.*)", "destination": "/index.html" }
```

---

## Security

| Layer | Mechanism |
|---|---|
| All write endpoints | Firebase ID token in `Authorization: Bearer` header — verified server-side |
| Admin endpoints | `isAdmin(email, db)` check on top of token verification |
| `purchasePrice` | Stripped from all public `GET /api/products` responses — only returned to admins |
| Gift messages | HTML-stripped server-side before storage (`/<[^>]*>/g`) |
| Return descriptions | Same HTML-strip + 500-char cap before storage |
| Rate limiting | `api/_lib/rateLimit.js` — in-memory sliding window on all write endpoints |
| Duplicate orders | `clientOrderId` UUID + DB unique check — safe to retry on network failure |
| Admin emails | Hardcoded in two places — never in DB alone (DB role checked first, hardcoded as fallback) |

---

## Edge Cases Handled

| Case | Handling |
|---|---|
| Old products with `purchasePrice` as MRP (before field split) | API normalises: `mrp: doc.mrp ?? doc.purchasePrice ?? null` — no migration needed |
| Products with no `purchasePrice` | Excluded from profit calculations gracefully — no errors or zero-padding |
| Out-of-stock sizes | Size buttons disabled on ProductView; atomic stock check on order create |
| Order cancellation stock restore | `$inc` per ordered size + total — exact undo |
| Cancel when not pending | Backend returns status-specific human-readable error; cancel button hidden in UI |
| Return when not delivered | Backend returns 400; "Return" button only shown for `delivered` |
| Duplicate return per order | Backend returns 409 Conflict with existing return ID |
| Missing `brandId` on products | Optional — backwards compatible, unbranded products still work everywhere |
| Deals page mixed sections | `?section=denim` filter — only denim regardless of price |
| Orders without `giftMessage` | No field in DB — admin modal and packing slip show nothing, no empty sections |
| Swipe vs click on ThunderboltSlider | `isDragging` ref checked in CTA handler — swipes never accidentally trigger navigation |
| Auth loading state | Navbar skeleton + menu suppression while Firebase resolves — zero layout shift |
| PWA / standalone display mode | `--tb-banner-h: 0px` collapses APK banner space; navbar top recalculated |
| Duplicate order submissions | `clientOrderId` UUID idempotency key — safe retries |
| Stale FCM tokens | Invalid/expired tokens (FCM 404/410) auto-removed from DB on next broadcast |
| Return statuses in analytics | `return_approved` orders excluded from cancellation count; treated as delivered for revenue |

---

## Admin Email Note

The admin email in code (`adminthunderbold@gmail.com`) uses "bold" — matching the brand name **Thunderbold**. The APK download link in the banner points to `/Thunderbolt.apk` (with a "t") — this is a deliberate legacy filename, not a bug.

---

## User Preferences

- No emojis in code or comments unless explicitly requested
- No Footer component inside the Admin panel
- Database name is `thunderbold` (not `thunderbolt`) — intentional
- `mrp` = crossed-out customer-facing price; `purchasePrice` = internal cost (admin-only, never public)
- All data endpoints must explicitly return `500 Database unavailable` when MongoDB is unreachable — no silent fallbacks
- Currency symbol is always ₹ (Indian Rupee)
- Cancel button only appears for `pending` orders
- Return button only appears for `delivered` orders
- Shipping deduction on refunds is ₹50 (hardcoded as `SHIPPING_CHARGES` in `api/returns/index.js`)
