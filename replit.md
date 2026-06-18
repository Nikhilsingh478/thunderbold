# Thunderbold — Complete Project Documentation

## Overview

Thunderbold is a production-grade premium fashion e-commerce storefront for a real retail brand. The platform is a full-stack Progressive Web App (PWA) built on React 18 + Vite (frontend), Node.js/Express (backend API), Firebase Authentication, and MongoDB Atlas. It supports end-to-end retail operations: product browsing by category/brand, cart management, wishlist, checkout with gift messaging, order tracking with server-side pagination, return/refund requests, customer reviews, push notifications, an Instagram-browser-compatible layout, and a full admin panel with hero banner management.

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

All secrets are stored in **Replit Secrets** (never committed to source). The server reads them via `process.env.*` at runtime.

| Variable | Used By | Purpose |
|---|---|---|
| `MONGO_URI` | Backend | MongoDB Atlas connection string (`mongodb+srv://...`) |
| `FIREBASE_SERVICE_ACCOUNT` | Backend | Firebase Admin SDK service account JSON (stringified) |
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
├── AppContent.tsx                 — BrowserRouter, SplashScreen, AnnouncementBar, ScrollToTop, PageLoader,
│                                    Login modal, route definitions
├── index.css                      — Global styles, Tailwind directives, --tb-banner-h CSS variable,
│                                    Instagram browser compatibility rules
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
│   ├── Orders.tsx                 — Customer order history: server-side pagination (10/page), statuses,
│   │                                cancel (pending only), request return (delivered only), review items
│   ├── Admin.tsx                  — Full admin panel (tabs: Analytics, Orders, Products,
│   │                                Categories, Brands, Reviews, Slider + Hero Banner, Notify, Returns)
│   ├── Profile.tsx                — User profile + saved addresses + account deletion
│   ├── BrandsPage.tsx             — All brands listing
│   ├── BrandView.tsx              — Products filtered by brandId
│   ├── DealsPage.tsx              — Denim-only deals filtered by price cap (≤₹999 or ≤₹699)
│   └── NotFound.tsx               — 404 page
│
├── components/
│   ├── ScrollToTop.tsx            — Smart scroll manager. Uses useNavigationType():
│   │                                • POP (back/forward button) → restores saved position from
│   │                                  sessionStorage keyed by location.key (double-RAF for DOM paint)
│   │                                • PUSH / REPLACE → scrolls to top instantly (behavior:'instant')
│   │                                Positions saved continuously via passive scroll listener.
│   │                                Mounted as first child inside <BrowserRouter> in AppContent.tsx.
│   ├── SplashScreen.tsx           — Cinematic branded intro (once per session via sessionStorage)
│   ├── AnnouncementBar.tsx        — Fixed marquee bar, id="tb-announcement-bar", z-[120], h-9 (36px),
│   │                                top: var(--tb-banner-h)
│   ├── Navbar.tsx                 — Fixed navbar, id="tb-navbar", z-[100], top: calc(36px + var(--tb-banner-h));
│   │                                auth skeleton (no flicker), mobile full-screen menu
│   ├── Footer.tsx                 — Customer pages only (not admin); policy modals
│   ├── HeroBanner.tsx             — Full-width hero image; fetches up to 3 URLs from /api/slider?type=hero;
│   │                                falls back to hardcoded defaults if API returns no images
│   ├── BrandsSection.tsx          — Horizontal logo marquee
│   ├── LiveSaleSection.tsx        — "Live Sale" highlighted product grid (section === 'live-sale')
│   ├── CategoriesSection.tsx      — Homepage composite section: Denim category cards, PromoBanner,
│   │                                ThunderboltSlider, T-Shirt category cards, Kurta product grid
│   │                                (Thunder Looks / outfits grid removed — ThunderboltSlider remains)
│   ├── ThunderboltSlider.tsx      — Editorial 3D coverflow outfit carousel (swipe-only, no arrows)
│   ├── PriceDisplay.tsx           — Unified price renderer: selling + strikethrough MRP + discount badge
│   ├── CustomCursor.tsx           — Custom cursor for desktop
│   ├── ScrollProgress.tsx         — Top scroll progress bar
│   ├── PWAUpdatePrompt.tsx        — Toast prompting user to reload when a new SW version is available
│   ├── ReturnRequestModal.tsx     — Customer return request form: reason picker + description + refund estimate
│   ├── ApkBanner.tsx              — UNUSED / dead component — APK download banner; exists but is not
│   │                                imported anywhere; --tb-banner-h is 0px to reflect this
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
| `api/orders/index.js` | `GET /api/orders` (paginated 10/page for customers; all for admin), `POST .../create`, `PUT .../cancel`, `PATCH/DELETE .../manage` |
| `api/returns/index.js` | `GET /api/returns` (user: own; admin: all), `POST` (create request), `PATCH?id=` (admin approve/reject) |
| `api/users/index.js` | `POST /api/users/create`, profile read/update, address sub-routes, FCM token registration, account deletion |
| `api/cart/index.js` | `GET/POST/DELETE /api/cart` |
| `api/wishlist/index.js` | `GET/POST/DELETE /api/wishlist` |
| `api/categories/index.js` | `GET/POST/PUT/DELETE /api/categories` |
| `api/address/index.js` | `GET/POST/PUT/DELETE /api/address` |
| `api/reviews/index.js` | `GET /api/reviews` (by product or mine=true), `POST` (create), `PUT?id=` (update), `DELETE?id=` |
| `api/admin.js` | `GET /api/admin/analytics` — KPIs + charts; also handles `GET/PUT /api/slider` (ThunderboltSlider + Hero Banner config) — merged here to stay within Vercel's 12-function cap |
| `api/brands/index.js` | `GET/POST/PUT/DELETE /api/brands` |
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
| `config` | Site-wide admin configuration — currently holds two documents: `_id: "slider"` (ThunderboltSlider 4-slot editorial config) and `_id: "hero-banner"` (homepage hero image URLs) |

> **Note:** A legacy `slider` collection may exist in Atlas from before the `config` collection consolidation. The application reads exclusively from `config` — the `slider` collection is no longer used.

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
  clientOrderId?,          // UUID idempotency key — prevents duplicate orders on network retry
  giftMessage?,            // Optional — HTML-stripped, max 300 chars, stored only when non-empty
  returnShippingCharges?,  // Set on return_approved — ₹ deducted from the approved refund
  returnRefundAmount?,     // Set on return_approved — final refund amount confirmed by admin
  adminNotes?,             // Set by admin on return_approved OR return_rejected — written to THIS
                           //   order doc (in addition to returns doc) so customer sees it directly
                           //   via GET /api/orders without a separate GET /api/returns call
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

### Config Documents (`config` collection)

#### ThunderboltSlider — `_id: "slider"`

```js
{
  _id: "slider",
  slides: [                // Always exactly 4 elements
    {
      imageUrl: string,    // Cloudinary or external URL for the editorial card image
      heading: string,     // Large ghost text e.g. "SHARP", "REBEL", "WILD", "NOIR"
      productId: string | null,    // Links to a product page via /product/:id
      productName: string | null,
      productImage: string | null
    }
    // × 4
  ],
  updatedAt: Date
}
```

#### Hero Banner — `_id: "hero-banner"`

```js
{
  _id: "hero-banner",
  images: [url1, url2, url3],  // Up to 3 full-width banner image URLs
  updatedAt: Date
}
```

`HeroBanner.tsx` fetches `GET /api/slider?type=hero` and renders whichever images are configured. If the array is empty or the API fails, the component falls back to hardcoded default images so the homepage is never blank.

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

## Orders — Server-Side Pagination

### Backend (`api/orders/index.js`)

Customers receive paginated results; admins always receive all orders (no pagination).

```
CUSTOMER_PAGE_SIZE = 10  (orders per page — constant)

GET /api/orders?page=N   (customer)
  → { orders: Order[], total: number, page: number, totalPages: number, limit: 10 }

GET /api/orders          (admin — no page param, or isAdmin === true)
  → { orders: Order[] }  (full list, no pagination wrapper)
```

Pipeline for customer fetch:
```
1. Filter by userId === email (customer's own orders only)
2. Sort by createdAt descending (newest first)
3. Count total matching documents (for totalPages calculation)
4. Skip (page - 1) × 10 documents
5. Limit to 10 documents
6. Return both results in a Promise.all (parallel execution)
```

`totalPages = Math.max(1, Math.ceil(total / CUSTOMER_PAGE_SIZE))`

### Frontend (`src/pages/Orders.tsx`)

The `Pagination` component renders when `totalPages > 1`:

- **Chevron buttons** — Previous / Next; disabled at boundaries
- **Page number boxes** — up to 7 page buttons before ellipsis logic kicks in
- **Ellipsis (`…`)** — shown when current page is far from the end
- **Status line** — "Page N of M · X orders" always visible

Page changes trigger a fresh `GET /api/orders?page=N` fetch; the order list re-renders with the new slice.

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
- **Approve**: Admin enters refund amount (defaults to `totalAmount − ₹50`), adds optional notes → `PATCH /api/returns?id=...` with `{ action: 'approve', refundAmount, adminNotes }`. Backend writes `adminNotes`, `returnShippingCharges`, and `returnRefundAmount` to the **order document** in addition to the return document.
- **Reject**: Admin adds notes → `PATCH /api/returns?id=...` with `{ action: 'reject', adminNotes }`. Backend writes `adminNotes` to the **order document** in addition to the return document.
- Both writes happen so customers see the admin note directly in `My Orders` (Orders.tsx renders it in a colour-matched banner) without needing a separate GET /api/returns call.

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
| Slider | SlidersHorizontal | Two sub-sections: (1) **Hero Banner** — 3 full-width image URL inputs with live preview + "Save Banner" button; (2) **ThunderboltSlider** — configure all 4 editorial carousel slides (image URL, heading text, linked outfit product) |
| Notify | Bell | Broadcast push notification to all subscribed users (title, body, optional image URL) |
| Returns | RotateCcw | Review pending return requests; approve with custom refund amount; reject with notes |

The admin panel has **no footer** — `Footer.tsx` is only rendered on customer-facing pages.

---

## Hero Banner System

`src/components/HeroBanner.tsx` + `GET /api/slider?type=hero`

### How It Works

1. `HeroBanner.tsx` calls `GET /api/slider?type=hero` on mount
2. The backend reads `config.findOne({ _id: "hero-banner" })` and returns `{ images: string[] }`
3. The component renders up to 3 full-width images from the array
4. **Fallback:** if the API returns no images (empty array, network error, or first-time load before any admin config), hardcoded default images are used so the homepage is never blank

### Admin Configuration

Admin Slider tab → Hero Banner section:
- 3 URL input fields (one per image slot)
- Live image preview per slot
- "Save Banner" button → `PUT /api/slider?type=hero` with `{ images: [url1, url2, url3] }`
- The config is persisted in the `config` collection under `_id: "hero-banner"`

### Storage

```js
// Stored in config collection
{ _id: "hero-banner", images: ["https://...", "https://...", "https://..."], updatedAt: Date }
```

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

---

## Push Notifications (FCM)

### How It Works

1. User opens the app in a browser that supports notifications
2. `src/context/AuthContext.tsx` requests notification permission after login
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

1. **`AnnouncementBar`** — `position: fixed`, `top: var(--tb-banner-h)` (= `0px`), `z-index: 120`, `height: 36px`, `id="tb-announcement-bar"` — animated marquee promotional text
2. **`Navbar`** — `position: fixed`, `top: calc(36px + var(--tb-banner-h))` (= `36px`), `z-index: 100`, `id="tb-navbar"`
3. **`HeroBanner`** — Full-width hero image(s), admin-configurable; falls back to defaults
4. **`BrandsSection`** — Horizontal auto-scrolling logo marquee
5. **`LiveSaleSection`** — Products with `section === 'live-sale'`
6. **`CategoriesSection`** — Composite section containing:
   - Denim Collection category cards (grid)
   - **`PromoBanner`** — Under ₹999 + Under ₹699 side-by-side deal banners
   - **`ThunderboltSlider`** — 3D coverflow editorial outfit carousel
   - T-Shirt Collection category cards (if any exist)
   - Kurta Collection product grid
   - ~~Thunder Looks / Outfits product grid~~ — **removed from homepage** (section `outfits` products still exist in the DB but are no longer displayed as a grid on the index page; the ThunderboltSlider and its "Shop This Look" links remain)
7. **`Footer`**

> **APK Banner:** The `ApkBanner.tsx` component exists in the codebase but is not mounted anywhere. There is no APK download banner currently rendered in the app. `--tb-banner-h` is set to `0px` to match this.

### Page Top-Padding Formula

All customer pages use `--tb-banner-h` in their padding so content always clears the stacked fixed bars:

```css
/* --tb-banner-h is 0px (no APK banner active), so these resolve to: */
pt-[calc(100px + var(--tb-banner-h))]   /* mobile  → 100px  */
pt-[calc(108px + var(--tb-banner-h))]   /* md+     → 108px  */
pt-[calc(164px + var(--tb-banner-h))]   /* pages with filter bars → 164px */
```

If the APK banner is ever re-enabled (mounted in AppContent.tsx), set `--tb-banner-h: 36px` in `:root` inside `index.css` and all paddings adjust automatically — no per-page edits needed.

---

## CSS Layout Variable: `--tb-banner-h`

Defined in `src/index.css` within `:root`:

```css
:root {
  --tb-banner-h: 0px;  /* Height of the APK download banner — 0px = banner not shown */
}
```

**Why it exists:** The layout was designed to accommodate an optional APK download banner (`ApkBanner.tsx`) that sits above the AnnouncementBar. All fixed-bar `top:` positions and all page `padding-top` values reference `--tb-banner-h` so changing this one variable re-stacks the entire header in every context.

**Current state:** `0px` — `ApkBanner.tsx` is not mounted.

**If APK banner is re-enabled:**
1. Import and render `<ApkBanner />` as the first child of `AppContent.tsx` (before `<AnnouncementBar />`)
2. Change `--tb-banner-h` in `index.css` from `0px` to `36px`
3. Ensure `ApkBanner.tsx` has `position: fixed; top: 0; height: 36px; z-index: 130` — it should already be correct

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

## Scroll Restoration System

### Problem

The browser's native scroll restoration (`history.scrollRestoration = 'auto'`) tries to remember and restore positions, but combined with React Router's SPA navigation and CSS `scroll-behavior: smooth`, this causes two problems:

1. **Back-button jank** — page animates visibly sliding down on mobile when the user navigates back.
2. **Wrong position** — the browser's guess for restored position is often inaccurate after a virtual DOM re-render because the page height may not be settled when the browser fires its restore.

### Solution (three-part)

#### 1. `src/main.tsx` — Disable native restoration (runs before React)

```js
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}
```

Tells every browser to stop saving and restoring scroll positions — the app takes full ownership.

#### 2. `src/components/ScrollToTop.tsx` — Navigation-type-aware scroll manager

Behaviour depends on how the user arrived at the current route, detected via `useNavigationType()`:

**PUSH / REPLACE** (forward navigation, programmatic `navigate()`):
```ts
window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
```
`behavior: 'instant'` explicitly overrides any CSS `scroll-behavior: smooth` — zero animation between pages.

**POP** (browser back or forward button):
```ts
// 1. Look up the saved Y position for this exact history entry
const saved = sessionStorage.getItem(`scroll:${location.key}`);
// 2. Wait two animation frames for the DOM to paint the restored page
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    window.scrollTo({ top: saved ? parseInt(saved, 10) : 0, behavior: 'instant' });
  });
});
```
The double-RAF ensures the page's layout has settled (images, sticky headers, etc.) before the scroll position is restored — prevents snapping to the wrong position mid-paint.

**Continuous position saving:**
A passive `scroll` event listener updates `sessionStorage` with the current Y position on every scroll. Key format: `scroll:<location.key>`. This means the position for every history entry is always current, regardless of how many times the user scrolls that page.

#### 3. `src/AppContent.tsx` — Mounting position

`<ScrollToTop />` is the first child inside `<BrowserRouter>` so it has router context and fires before any page component mounts.

**What is unaffected:** In-page smooth scrolls (`scrollIntoView` on size selectors in ProductView, `#live-sale` anchor in HeroBanner, address form in Checkout) use their own element-level scroll calls — entirely independent from route-level navigation.

---

## Instagram Browser Compatibility

### Background

Most Thunderbold traffic arrives via the Instagram bio link. Instagram's iOS in-app browser uses `WKWebView`, which has two known issues:

1. **`position: fixed` bug** — Fixed elements scroll with the page content instead of staying pinned to the viewport. This makes the navbar and announcement bar appear to "scroll away" with the content rather than staying fixed at the top.

2. **Dynamic viewport height** — Instagram's address bar collapses when scrolling, changing the actual visible viewport height. Elements using `100vh` can overflow behind the address bar.

### Detection

`src/main.tsx` — runs before `createRoot()` so the class is active on the very first paint:

```js
if (/Instagram/.test(navigator.userAgent)) {
  document.documentElement.classList.add('instagram-browser');
}
```

The `instagram-browser` class on `<html>` is the single selector all CSS fixes target.

### CSS Fixes (`src/index.css`)

```css
.instagram-browser #tb-announcement-bar,
.instagram-browser #tb-navbar {
  will-change: transform;
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
  -webkit-transform: translateZ(0);
  transform: translateZ(0);   /* promotes element to its own GPU compositing layer,
                                 which forces WKWebView to treat it as a true
                                 viewport overlay rather than a scrollable node */
}

@supports (height: 100dvh) {
  .instagram-browser .min-h-screen {
    min-height: 100dvh;   /* accounts for Instagram's collapsible address bar */
  }
}
```

### Target Elements

| Element | id | z-index |
|---|---|---|
| `AnnouncementBar` outer div | `tb-announcement-bar` | 120 |
| `Navbar` `motion.nav` | `tb-navbar` | 100 |

### Why `translateZ(0)` Works

`transform: translateZ(0)` is a zero-op 3D transform that promotes the element to its own GPU compositing layer. In WKWebView, elements on a dedicated compositing layer are handled by the OS compositor rather than the browser's software renderer — the compositor correctly pins the element to the viewport regardless of scroll position, bypassing the WKWebView position:fixed bug.

`will-change: transform` signals the intent ahead of time so the browser can pre-allocate the compositing layer before the first paint.

### Android

Instagram's Android browser uses a Chrome-based WebView where `position: fixed` works correctly. The CSS rules are harmless on Android — GPU compositing is always on for transform elements anyway.

---

## ThunderboltSlider (Outfit Carousel)

`src/components/ThunderboltSlider.tsx`

### Position

Inside `CategoriesSection.tsx`, between the `PromoBanner` and T-Shirt Collection. Bleeds edge-to-edge via negative margins (`-mx-6 md:-mx-16`).

### Data

`GET /api/slider` → `{ slides: SlideData[4] }`. Admin-managed via the Slider tab. If all 4 slots have neither `imageUrl` nor `heading`, the component renders nothing.

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
- **Function limit:** Vercel Hobby plan — 12 serverless functions max. The slider + hero banner config handler was merged into `api/admin.js` to avoid exceeding this limit.

### `vercel.json` Key Rewrites

```json
{ "source": "/api/orders/:sub(create|cancel|manage)", "destination": "/api/orders?subpath=:sub" },
{ "source": "/api/slider", "destination": "/api/admin?handler=slider" },
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
| `--tb-banner-h` undefined | Now defined as `0px` in `:root`; previously undefined, causing all calc() expressions to resolve to 0 silently |
| Instagram browser position:fixed | GPU compositing via `translateZ(0)` + `will-change: transform` on `#tb-announcement-bar` and `#tb-navbar`; `instagram-browser` class set by main.tsx before React mounts |
| Instagram browser viewport height | `@supports (height: 100dvh)` block switches `min-h-screen` to `100dvh` to account for collapsible address bar |
| Mobile back-button scroll restoration | `history.scrollRestoration = 'manual'` in `main.tsx` disables browser scroll management. `ScrollToTop.tsx` uses `useNavigationType()`: POP → restores saved `sessionStorage` position (keyed by `location.key`, double-RAF before restore); PUSH/REPLACE → `scrollTo({top:0,behavior:'instant'})`. Passive scroll listener saves positions continuously. |
| Orders pagination — page out of range | `page` clamped to `Math.max(1, ...)` on backend; Prev/Next buttons disabled at boundaries on frontend |
| Hero banner API failure | `HeroBanner.tsx` falls back to hardcoded default images — homepage never blank |
| Orders without `orderNumber` | `formatOrderId()` utility formats `_id` as fallback — always something human-readable to display |
| Duplicate order submissions | `clientOrderId` UUID idempotency key — safe retries |
| Stale FCM tokens | Invalid/expired tokens (FCM 404/410) auto-removed from DB on next broadcast |
| Return statuses in analytics | `return_approved` orders excluded from cancellation count; treated as delivered for revenue |
| ThunderboltSlider with no config | Component renders nothing if all 4 slides have empty `imageUrl` and `heading` |

---

## Admin Email Note

The admin email in code (`adminthunderbold@gmail.com`) uses "bold" — matching the brand name **Thunderbold**.

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
- `--tb-banner-h` is `0px` — `ApkBanner.tsx` is not mounted; change to `36px` only if the banner is re-enabled
- `history.scrollRestoration = 'manual'` must remain in `main.tsx` — removing it re-introduces the back-button scroll animation bug on mobile
- Instagram browser fixes rely on `id="tb-announcement-bar"` and `id="tb-navbar"` — do not remove these ids
