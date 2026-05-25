# Thunderbolt — Project Documentation

## Overview

Thunderbolt is a production-grade premium denim e-commerce storefront built for a real retail brand. It features a full-stack architecture with a React 18 + Vite frontend, Node.js/Express API backend, Firebase Authentication, and MongoDB Atlas database. The platform supports product browsing, cart, wishlist, checkout with optional gift messaging, order management, brand pages, deals pages, and a full admin panel with analytics, slider management, and order printing.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite 5, Tailwind CSS, shadcn/ui |
| Routing | React Router v6 |
| State / Data | TanStack Query (React Query) |
| Animations | Framer Motion |
| Charts | Recharts |
| Authentication | Firebase Authentication (email/password + Google) |
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
│   ├── AuthContext.tsx        — Firebase auth state; exposes user, loading, login, logout
│   ├── CartContext.tsx        — Cart state (localStorage synced)
│   └── WishlistContext.tsx    — Wishlist state
├── pages/
│   ├── Index.tsx              — Homepage
│   ├── About.tsx
│   ├── CategoryView.tsx       — Category product listing with discount badges
│   ├── ProductView.tsx        — Product detail page (image, sizes, description, pricing)
│   ├── Cart.tsx
│   ├── Wishlist.tsx
│   ├── Checkout.tsx           — Checkout with address form + optional gift message
│   ├── Orders.tsx             — Customer order history with cancel support
│   ├── Admin.tsx              — Full admin panel (multi-admin)
│   ├── Profile.tsx
│   ├── BrandsPage.tsx         — All brands listing
│   ├── BrandView.tsx          — Brand-filtered product listing
│   ├── DealsPage.tsx          — Denim-only price-filtered deals
│   └── NotFound.tsx
├── components/
│   ├── SplashScreen.tsx       — Cinematic branded intro (once per session via sessionStorage)
│   ├── AnnouncementBar.tsx    — Fixed marquee bar at top of every page (z-[120], h-9/36px)
│   ├── Navbar.tsx             — Fixed navbar with stable auth skeleton (no flicker)
│   ├── Footer.tsx             — Customer-facing pages only (not admin)
│   ├── HeroBanner.tsx         — Hero image/sale banner below navbar
│   ├── BrandsSection.tsx      — Horizontal logo marquee
│   ├── LiveSaleSection.tsx    — "Live Sale" highlighted products
│   ├── CategoriesSection.tsx  — Full category listing + promo banners + ThunderboltSlider
│   ├── ThunderboltSlider.tsx  — Editorial outfit carousel (swipe-only, no arrows)
│   ├── PriceDisplay.tsx       — Unified price renderer (selling + MRP strikethrough + badge)
│   ├── promo/
│   │   ├── PromoBanner.tsx    — Side-by-side static promo banner (Under ₹999 + Under ₹699)
│   │   └── promoSlides.ts     — Promo slide configuration (image paths + routes)
│   ├── checkout/
│   │   ├── AddressForm.tsx    — Validated delivery address form
│   │   ├── ProductSummary.tsx — Order item + total summary panel
│   │   └── OrderConfirmation.tsx — Post-order success modal
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
    └── printInvoice.ts        — Packing slip print utility (gift message aware)
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
| `api/slider/index.js` | `GET /api/slider` (public), `POST /api/slider` (admin-only) |

### Shared Backend Helpers (`api/_lib/`)

| File | Purpose |
|---|---|
| `mongodb.js` | Cached MongoClient — `getDb()` returns the `thunderbold` database |
| `firebaseAdmin.js` | `verifyFirebaseToken(idToken)` — decodes and validates Firebase JWT |
| `adminHelper.js` | `isAdmin(email, db)` — checks `ADMIN_EMAILS` array (3 admins) |
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
| `orders` | Customer orders (includes optional `giftMessage` field) |
| `users` | User profiles |
| `cart` | Per-user cart items |
| `wishlist` | Per-user wishlisted products |
| `categories` | Category records |
| `brands` | Brand name records |
| `addresses` | Saved delivery addresses |
| `reviews` | Per-product customer reviews |
| `slider` | ThunderboltSlider editorial config (4 slides, admin-managed) |

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
  section,         // 'live-sale' | 'denim' | 'tshirts' | 'kurta' | 'outfits'
  sizeStock: { '28':n, '30':n, '32':n, '34':n, '36':n },  // Per-size inventory (jeans)
                                                            // or { 'S':n, 'M':n, 'L':n, 'XL':n, 'XXL':n } (apparel)
  stock,           // Computed total (sum of sizeStock values)
  highlights?,     // { color, length, printsPattern, waistRise, shade, lengthInches }
  createdAt,
  updatedAt?
}
```

---

## Order Data Model

```js
{
  _id,
  userId,          // Customer email (from Firebase token)
  products: [
    {
      productId,
      name,
      price,         // Selling price at time of order
      size,
      quantity,
      image,
      topwearSize?,  // Outfit products only
      bottomwearSize?
    }
  ],
  address: {
    fullName, phone, addressLine1, addressLine2,
    city, state, pincode, landmark
  },
  paymentMethod,   // 'COD'
  status,          // 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
  totalAmount,     // Server-calculated: sum(price × quantity)
  createdAt,
  clientOrderId?,  // UUID for idempotency (prevents duplicate orders on retry)
  giftMessage?     // Optional — set only when customer provides one (max 300 chars, HTML-stripped)
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

## Homepage Layout

The homepage renders components in this exact order:

1. **`AnnouncementBar`** — fixed top, z-[120], height 36px, animated marquee text
2. **APK Banner** — fixed top, z-[99999], height 36px (hidden in standalone/PWA/WebView mode)
3. **`Navbar`** — fixed below banners via `top: calc(36px + var(--tb-banner-h))`, z-[100]
4. **`HeroBanner`** — full-width sale/hero image below navbar
5. **`BrandsSection`** — horizontal logo marquee
6. **`LiveSaleSection`** — featured "Live Sale" products
7. **`CategoriesSection`** — large composite section containing:
   - Denim Collection fit categories (grid)
   - **`PromoBanner`** — side-by-side Under ₹999 and Under ₹699 deal banners
   - **`ThunderboltSlider`** — editorial outfit carousel (swipe-only)
   - T-Shirt Collection categories (grid, if any exist)
   - Kurta Collection product grid
   - Thunder Looks / Outfits product grid
8. **`Footer`**

### Page Top-Padding Formula

All pages use a top-padding formula that accounts for the stacked fixed bars:

```css
pt-[calc(100px + var(--tb-banner-h))]     /* mobile */
pt-[calc(108px + var(--tb-banner-h))]     /* desktop (md+) */
```

`--tb-banner-h` is a CSS custom property:
- `36px` in browser (APK banner is visible)
- `0px` in standalone/PWA/fullscreen mode (banner is hidden)

This means headers and content always clear the bars correctly in both web and installed-app contexts.

---

## Navbar Architecture

`src/components/Navbar.tsx`

### Layout

```
[THUNDERBOLT logo]   [Search bar]  [Categories] [About Us]  [Wishlist] [Cart]  [Auth]
```

On mobile, the search bar moves below the navbar as a full-width tap target (`MobileSearchBar` in `Index.tsx`).

### Auth Loading (no flicker design)

The navbar reads `loading` from `useAuth()` (the Firebase `onAuthStateChanged` resolution state). While `loading` is `true`:

- A **skeleton placeholder** (`w-8 h-8 rounded-full bg-white/[0.06] animate-pulse`) renders in place of the profile icon or login button — both on desktop and mobile.
- The skeleton has **identical dimensions** to the profile avatar circle, so there is zero layout shift when the real auth state resolves.
- The mobile fullscreen menu suppresses auth-dependent links (`Profile`, `Orders`, `Logout`, `Login`) while loading, preventing a momentary flash of the wrong state.

**Root cause of the old flicker:** `loading` was never read from `useAuth()`. The navbar always rendered the Login button first (because `user` starts as `null`), then re-rendered to the Profile icon 1–2 seconds later once Firebase resolved — causing a visible layout jump.

### Scroll behaviour

After scrolling 50px, the navbar transitions to `bg-[#070707]/90 backdrop-blur-md border-b border-white/5`.

### Mobile full-screen menu

Opens via a clip-path circle animation anchored to the hamburger button position. Closes on route change.

---

## Announcement Bar

`src/components/AnnouncementBar.tsx`

- Fixed to `top-0`, `z-[120]`, height `h-9` (36px)
- Contains animated CSS marquee with promotional text
- Always visible across all pages (rendered in `AppContent.tsx`)
- Hidden in standalone/PWA display mode via `--tb-banner-h: 0px` CSS variable

---

## ThunderboltSlider (Outfit Carousel)

`src/components/ThunderboltSlider.tsx`

### Position
Rendered inside `CategoriesSection.tsx`, directly between the `PromoBanner` (Under ₹999 / Under ₹699) and the T-Shirt Collection section. It bleeds edge-to-edge using negative margins (`-mx-6 md:-mx-16`).

### Data Source
Fetches `GET /api/slider` on mount. Returns `{ slides: SlideData[] }` with 4 slots. If all 4 slides have neither `imageUrl` nor `heading`, the component returns `null` and renders nothing.

### Slide Data Shape
```ts
interface SlideData {
  imageUrl: string;
  heading: string;        // e.g. "SHARP", "REBEL", "WILD", "NOIR"
  productId: string | null;
  productName: string | null;
  productImage: string | null;
}
```

### Navigation — Swipe Only (no arrows)

Navigation is swipe/drag only, using the **Pointer Events API** (`onPointerDown`, `onPointerMove`, `onPointerUp`, `onPointerCancel`). This works identically for mouse drag and touch swipe.

Implementation details:
- `dragStartX` ref stores the X position on pointer down
- `dragDeltaX` ref tracks accumulated horizontal delta on move
- `isDragging` ref is set to `true` once `|delta| > 8px` — prevents accidental click firing during swipe
- On pointer up: if `|delta| > 50px`, advance the carousel in the swipe direction (`delta < 0` → next, `delta > 0` → prev)
- `setPointerCapture` is called on the container so the gesture is tracked even when the pointer moves outside the element
- `touch-action: pan-y` on the container preserves native vertical scrolling while capturing horizontal swipes
- `select-none` prevents text selection during drag

### Visual Layout
- 4-slot 3D coverflow: center card is full-size and sharp; flanking cards are scaled down and blurred; the back card is very small and nearly transparent
- A large "ghost heading" (`Bebas Neue`, up to 380px) renders behind the cards with a cinematic blur-in animation on slide change
- Film grain overlay (`opacity: 0.4`) adds editorial texture
- Bottom-left: "THUNDER LOOKS" label + **dot indicators** (active dot widens to 24px)
- Bottom-right: "SHOP THIS LOOK →" CTA button (navigates to the active slide's product page; disabled if no product linked; click is suppressed if a swipe was in progress)

### Admin Management
The Slider tab in `/admin` lets admins configure all 4 slides: image URL, heading text, and linked product (dropdown of products with `section === 'outfits'`).

---

## Promo Banners

`src/components/promo/PromoBanner.tsx` and `src/components/promo/promoSlides.ts`

Two static side-by-side banners inside `CategoriesSection`, positioned between the Denim Collection and the ThunderboltSlider.

| Banner | Image | Route |
|---|---|---|
| Under ₹999 | `/banners/under-999.webp` | `/deals/under-999` |
| Under ₹699 | `/under699new.webp` | `/deals/under-699` |

To swap a banner image: copy the new image to `public/` and update the corresponding `image` field in `promoSlides.ts`.

---

## Gift / Order Message Feature

An optional free-text field that customers can fill at checkout. Designed to support gift orders or special instructions.

### Checkout UI (`src/pages/Checkout.tsx`)

- A full-width card section rendered **below** the two-column address + summary grid
- Heading: "Gift / Order Message" with an "Optional" label in subdued text
- Textarea: 3 rows, placeholder "Write a message for the recipient (optional)"
- Character counter: `{current}/{300}` shown bottom-right; turns red at the limit
- Max length enforced client-side at 300 characters (`.slice(0, 300)` on every keystroke)
- The message is stored in local `giftMessage` state in `Checkout.tsx`
- **Does not block checkout** — empty message is treated as no message
- When submitting: if `giftMessage.trim()` is non-empty, it is added to `orderData.giftMessage` before the API call; otherwise the field is omitted entirely from the payload

### Backend Storage (`api/orders/index.js`)

`giftMessage` is extracted from the request body alongside `products`, `address`, `paymentMethod`, and `clientOrderId`.

Sanitization pipeline:
```js
const sanitizedGiftMessage = typeof giftMessage === "string"
  ? giftMessage.replace(/<[^>]*>/g, "").trim().slice(0, 300)
  : "";
```
1. Type-checks for string (ignores non-string payloads silently)
2. Strips all HTML tags (XSS prevention)
3. Trims leading/trailing whitespace
4. Hard-caps at 300 characters

The sanitized message is stored on the order document only when non-empty:
```js
...(sanitizedGiftMessage ? { giftMessage: sanitizedGiftMessage } : {})
```
Orders without a gift message have no `giftMessage` field at all — no empty strings in the database.

**Backward compatible:** All existing orders without `giftMessage` continue to work normally everywhere.

### Admin Panel View (`src/pages/Admin.tsx`)

The "View Address" modal (opened via the address icon on any order row) now includes a **Gift / Order Message section** at the bottom of the modal, separated by a divider:

- Section label: "GIFT / ORDER MESSAGE" in amber/brass color
- Message text renders in a lightly bordered box with `whitespace-pre-wrap` to preserve line breaks
- The entire section is conditionally rendered — **only appears** when `order.giftMessage` is truthy
- Orders without a message show no change to the modal layout

### Invoice / Packing Slip (`src/utils/printInvoice.ts`)

The `PrintableOrder` interface now includes `giftMessage?: string`.

In the generated HTML packing slip:
- A styled amber-bordered box (background `#fffbeb`, border `#fde68a`) renders between the order meta grid and the items table
- Heading: "GIFT / ORDER MESSAGE" (uppercase, amber label)
- Message body preserves whitespace with `white-space: pre-wrap`
- The entire block is **conditionally generated** — if `order.giftMessage` is falsy, the block is an empty string and the layout is unchanged
- Existing packing slips printed for old orders (no `giftMessage`) are completely unaffected

---

## Mobile UX

### Zoom Disabled

`index.html` viewport meta tag:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0,
  maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
```

This prevents:
- Pinch-to-zoom
- Double-tap zoom

`viewport-fit=cover` is preserved for edge-to-edge display on notched/Dynamic Island phones.

### Native App Feel

- `touch-action: pan-y` on the ThunderboltSlider allows vertical scrolling while intercepting horizontal swipes
- Pointer Events API used for swipe (not TouchEvents) — unified handling across mouse and touch without `preventDefault` hacks
- Splash screen runs once per session (`sessionStorage` guard) — does not re-run on navigation
- Announcement bar and APK banner automatically collapse to zero height when running in standalone PWA / WebView mode via CSS `--tb-banner-h` custom property

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

## Deals / Promo Filtering

The deals pages (`/deals/under-999`, `/deals/under-699`) filter products by **both price cap AND denim section**:

```
GET /api/products?maxPrice=999&section=denim
GET /api/products?maxPrice=699&section=denim
```

This ensures only denim/jeans products appear — no kurtas or t-shirts — regardless of price. Newly added denim products automatically appear on the correct deals page without any manual configuration.

---

## Admin Panel

Route: `/admin` — restricted to emails listed in `ADMIN_EMAILS`. Requires a valid Firebase ID token. All three admin accounts share the same MongoDB database — fully centralized.

### Admin Accounts

Hardcoded in both `api/_lib/adminHelper.js` (backend) and `src/pages/Admin.tsx` (frontend guard):

```js
const ADMIN_EMAILS = [
  "adminthunderbolt@gmail.com",
  "neelsingh45940s@gmail.com",
  "thepavanartt@gmail.com",
];
```

To add a new admin, update the array in both files.

### Tabs

| Tab | Description |
|---|---|
| Analytics | KPI cards (revenue, orders, profit), monthly charts, top products, stock alerts, recent orders |
| Orders | View all orders, update status, view delivery address + gift message, print packing slip, delete |
| Products | Create/edit/delete products. Form includes: name, section, category, brand, MRP, selling price, purchase price/cost (admin-only), size stock, images, description, highlights |
| Categories | Create/edit/delete categories |
| Brands | Create/edit/delete brand names |
| Reviews | Per-product review listing with admin delete |
| Slider | Configure all 4 ThunderboltSlider slides (image URL, heading, linked outfit product) |

The admin panel has **no footer** — the storefront footer only renders on customer-facing pages.

---

## Order Print / Packing Slip

`src/utils/printInvoice.ts` — `printInvoice(order: PrintableOrder)` opens a new browser window with a professionally formatted HTML packing slip and automatically triggers `window.print()`.

### PrintableOrder Interface

```ts
interface PrintableOrder {
  _id: string;
  userId?: string;
  products: OrderItem[];
  address?: OrderAddress;
  paymentMethod?: string;
  status?: string;
  totalAmount?: number;
  createdAt?: string;
  giftMessage?: string;   // Optional — only present if customer added a message
}
```

### Packing Slip Contents (in document order)

1. **Header** — THUNDERBOLT brand name (amber accent) + "Packing Slip" title + short order ID
2. **Meta grid** (2 columns):
   - Left: Order ID, date, payment method, status badge (color-coded)
   - Right: Ship-to address block + phone number
3. **Gift Message box** _(conditional — only rendered when `giftMessage` is present)_
   - Amber-bordered box (`#fffbeb` background, `#fde68a` border)
   - "GIFT / ORDER MESSAGE" label in amber
   - Message body with `white-space: pre-wrap`
4. **Items table** — product name, size, quantity, unit price, line total
5. **Summary box** — subtotal, shipping (Free), total
6. **Footer** — "Thank you" message + customer name + print timestamp

The print button (printer icon) appears next to the delete button on every order row in the admin Orders tab — both mobile cards and desktop table.

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

Products use a `sizeStock` map:
- Jeans/denim: keys `['28','30','32','34','36']`
- Apparel (t-shirts, kurtas, outfits): keys `['S','M','L','XL','XXL']`

The flat `stock` field is the computed total across all sizes.

- **Ordering**: Pre-flight stock check with atomic decrement + compensation rollback (prevents oversells even under concurrent orders)
- **Cancellation**: Restores `sizeStock` per size (if available) and total `stock`

---

## Checkout Flow

1. User arrives at `/checkout` from Cart ("Checkout" button) or ProductView ("Buy Now")
2. Saved address auto-loaded from localStorage, then overridden by profile default address if available
3. Address form validates: full name, 10-digit Indian mobile, address, city, state, 6-digit pincode
4. Optional gift message textarea (below the address + summary grid)
5. "Place Order" button submits to `POST /api/orders/create` with:
   - Validated address
   - Cart items (productId, name, price, size, quantity, image)
   - `paymentMethod: 'COD'`
   - `clientOrderId` UUID (idempotency key)
   - `giftMessage` (only if non-empty)
6. Retry wrapper: up to 3 attempts on network failure (exponential backoff)
7. On success: cart is cleared (if cart checkout), `OrderConfirmation` modal shown, redirects to `/orders`

---

## Deployment

### Local / Replit (development)

```bash
npm run dev        # Concurrently: node server.js (3001) + vite (5000)
```

Vite proxies `/api/*` → Express.

### Vercel (production)

- **Build command**: `npm run build` (Vite output to `dist/`)
- **Functions**: 12 serverless functions (at the Hobby plan limit)
- **`vercel.json` rewrites**: Sub-route consolidated handlers use `?subpath=` query param (Vercel) vs URL path remainder (Express)

The same handler files run unchanged in both environments.

---

## API Security Notes

- All write endpoints require a valid Firebase ID token (`Authorization: Bearer <token>`)
- Admin endpoints additionally check `isAdmin(email, db)` against `ADMIN_EMAILS`
- `purchasePrice` (internal cost) is **never included** in public `GET /api/products` responses — only returned to authenticated admins
- Rate limiting applied to all write endpoints via `api/_lib/rateLimit.js`
- Gift message is HTML-stripped server-side before storage

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
| Orders without `giftMessage` | No field in DB — admin modal and packing slip show nothing (no empty sections) |
| Swipe vs click on ThunderboltSlider | `isDragging` ref checked in CTA handler — swipes never accidentally trigger navigation |
| Auth loading state in navbar | Skeleton placeholder rendered while Firebase resolves — zero layout shift |
| PWA / standalone display mode | `--tb-banner-h: 0px` collapses APK banner space; announcement bar hidden |
| Duplicate order submissions | `clientOrderId` UUID idempotency key + DB unique index prevents double-orders on retry |

---

## User Preferences

- No emojis in code or comments unless user explicitly requests
- No Footer inside Admin panel
- Admin emails are hardcoded in `api/_lib/adminHelper.js` and `src/pages/Admin.tsx`
- Database name is `thunderbold` (not `thunderbolt`) — this is intentional
- Pricing: `mrp` = crossed-out display price; `purchasePrice` = internal cost (admin-only)
- All data endpoints must fail explicitly with `500 Database unavailable` when MongoDB is unavailable — no silent fallbacks
- Currency symbol is ₹ (Indian Rupee) everywhere — not ¥ or $
