# Thunderbolt — Premium Denim E-Commerce Platform

> A cinematic, production-grade full-stack e-commerce storefront for a premium denim brand. React 18 + Vite frontend · Node.js/Express API · MongoDB Atlas · Firebase Authentication · Cloudinary image CDN.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [System Architecture](#3-system-architecture)
4. [Repository Structure](#4-repository-structure)
5. [Environment Variables & Secrets](#5-environment-variables--secrets)
6. [Getting Started](#6-getting-started)
7. [Scripts Reference](#7-scripts-reference)
8. [Frontend Deep Dive](#8-frontend-deep-dive)
    - [Routing](#routing)
    - [Pages](#pages)
    - [Components](#components)
    - [Context Providers](#context-providers)
    - [Lib Utilities](#lib-utilities)
9. [Backend Deep Dive](#9-backend-deep-dive)
    - [Express Server](#express-server)
    - [API Reference](#api-reference)
    - [Shared Backend Lib](#shared-backend-lib)
10. [Database Schema](#10-database-schema)
11. [Size-Based Stock System](#11-size-based-stock-system)
12. [Order Lifecycle](#12-order-lifecycle)
13. [Cloudinary Image Optimization](#13-cloudinary-image-optimization)
14. [Admin Panel](#14-admin-panel)
15. [Authentication & Security](#15-authentication--security)
16. [Cart & Wishlist System](#16-cart--wishlist-system)
17. [Deployment](#17-deployment)
18. [Known Behaviors & Design Decisions](#18-known-behaviors--design-decisions)
19. [Recent Frontend Updates](#19-recent-frontend-updates)

---

## 1. Project Overview

**Thunderbolt** is an end-to-end e-commerce platform for a premium denim brand. It is built around a "cinematic" brand experience — smooth Framer Motion animations, a striking dark aesthetic, custom cursors, and condensed serif typography — while maintaining a robust, production-ready backend.

### Core Capabilities

| Domain | What it does |
|---|---|
| **Catalog** | Live product catalog backed by MongoDB; products belong to categories; multiple images per product via Cloudinary CDN |
| **Stock** | Per-size stock tracking (`sizeStock` map) for waist sizes 28/30/32/34/36; size buttons auto-disable on OOS; atomic decrement/rollback on checkout |
| **Auth** | Firebase email/password authentication; server-side token verification via Firebase Admin SDK |
| **Cart** | localStorage-first (zero latency); background DB sync; quantity management; size-aware items |
| **Wishlist** | Guest mode (localStorage); authenticated mode (MongoDB); toggle from any product card |
| **Checkout** | Address capture; duplicate-order guard; atomic multi-item stock decrement with compensation rollback |
| **Orders** | Full order history per user; admin sees all; status workflow; cancel with stock restoration |
| **Admin** | Full CRUD for products (with per-size stock editor), categories, and orders; no separate dashboard app needed |
| **Images** | Cloudinary CDN with auto-format (WebP/AVIF), auto-quality, and responsive widths applied at render time |

---

## 2. Technology Stack

### Frontend

| Package | Version | Role |
|---|---|---|
| `react` | 18.3 | UI framework |
| `typescript` | 5.9 | Type safety |
| `vite` | 5.4 | Dev server (port 5000) + bundler |
| `tailwindcss` | 3.4 | Utility-first CSS |
| `framer-motion` | 12 | Animations, page transitions, stagger effects |
| `react-router-dom` | 6.30 | Client-side routing (SPA) |
| `@tanstack/react-query` | 5 | Server-state caching |
| `embla-carousel-react` | 8 | Product image carousel |
| `@radix-ui/*` + `shadcn/ui` | various | Accessible component primitives |
| `lucide-react` | 0.462 | Icon library |
| `react-hook-form` | 7.72 | Form state management |
| `zod` | 3.25 | Runtime schema validation |
| `firebase` | 10.14 | Firebase client SDK (auth) |
| `sonner` | 1.7 | Toast notifications |
| `clsx` + `tailwind-merge` | — | Conditional class merging (`cn()`) |
| `date-fns` | 3.6 | Date formatting |

### Backend

| Package | Version | Role |
|---|---|---|
| `express` | 5.2 | HTTP server (port 3001) |
| `mongodb` | 6.21 | MongoDB native driver |
| `firebase-admin` | 13.7 | Server-side Firebase token verification |
| `jsonwebtoken` | 9.0 | JWT decode (dev fallback when Firebase Admin is unconfigured) |
| `helmet` | 8.1 | HTTP security headers |
| `dotenv` | 17.4 | Environment variable loading |

### External Services

| Service | Purpose |
|---|---|
| **MongoDB Atlas** | Primary database — products, orders, users, cart, wishlist, categories, addresses |
| **Firebase Authentication** | Email/password auth; issues Firebase ID tokens |
| **Cloudinary** | Image CDN; cloud name `djptdutak`; auto-format (WebP/AVIF) + responsive resizing |

---

## 3. System Architecture

```
Browser
  │
  ├─ Vite Dev Server (:5000) ──proxy /api/*──► Express (:3001)
  │       │                                        │
  │   React SPA                              server.js
  │   ├── React Router                             │
  │   ├── AuthContext      ◄── Firebase client     │
  │   ├── CartContext           SDK (auth only)    │
  │   └── WishlistContext                    api/_lib/
  │                                          ├── mongodb.js       (connection pool)
  │                                          ├── firebaseAdmin.js (token verify)
  │                                          └── adminHelper.js   (role check)
  │                                                │
  │                                          MongoDB Atlas
  │                                          Firebase Admin SDK
  │
  └── Cloudinary CDN (image URLs transformed at render time — no proxy needed)
```

### Request Flow — Authenticated Admin Action

```
1. Browser sends:
      Authorization: Bearer <firebase-id-token>

2. Express handler calls verifyFirebaseToken(token):
      ├── IF FIREBASE_SERVICE_ACCOUNT is set:
      │     adminAuth.verifyIdToken(token, true)   ← cryptographically verified
      └── ELSE (dev fallback):
            jwt.decode(token)                      ← claims only, no sig check

3. isAdmin(email, db):
      ├── Query: db.collection('users').findOne({ email })
      │     → return true if user.role === 'admin'
      └── Fallback: email === process.env.ADMIN_EMAIL

4. Handler executes or returns 401/403
```

### Vite Proxy

`vite.config.ts` proxies all `/api/*` requests to `http://localhost:3001`:

```ts
server: {
  port: 5000,
  proxy: {
    '/api': { target: 'http://localhost:3001', changeOrigin: true }
  }
}
```

This means the frontend uses relative URLs (`/api/products`) in all environments. No hardcoded ports in React code.

---

## 4. Repository Structure

```
thunderbolt/
│
├── server.js                          # Express entry — dynamically imports all /api/* handlers
├── vite.config.ts                     # Vite: port 5000, /api proxy → 3001, path aliases
├── tailwind.config.ts                 # Custom theme: brass, void, tb-white, sv-mid colors
├── tsconfig.json / tsconfig.app.json  # TypeScript configuration
├── package.json                       # All dependencies and npm scripts
├── vercel.json                        # Vercel rewrites + cron job (pings /api/products every 5 min)
│
├── api/                               # Backend route handlers (serverless-compatible)
│   ├── _lib/
│   │   ├── mongodb.js                 # Singleton MongoClient — getDb() connection pool
│   │   ├── firebaseAdmin.js           # Firebase Admin init + verifyFirebaseToken()
│   │   └── adminHelper.js             # isAdmin(email, db) — DB role + env fallback
│   │
│   ├── products/
│   │   ├── index.js                   # GET all / POST / PUT ?id= / DELETE ?id=
│   │   └── [id].js                    # GET single product (legacy route)
│   │
│   ├── orders/
│   │   ├── index.js                   # GET all orders (admin) or user orders
│   │   ├── create.js                  # POST — atomic size-aware stock decrement + rollback
│   │   ├── cancel.js                  # PUT — order cancel + stock restoration
│   │   └── manage.js                  # PATCH ?id= (status update) / DELETE ?id= (admin only)
│   │
│   ├── users/
│   │   └── index.js                   # POST create/sync user; sets role: "user"
│   │
│   ├── categories/
│   │   └── index.js                   # GET / POST / DELETE /:id
│   │
│   ├── cart/
│   │   └── index.js                   # GET / POST cart (DB sync target)
│   │
│   ├── wishlist/
│   │   └── index.js                   # GET / POST wishlist (authenticated users)
│   │
│   └── address/
│       └── index.js                   # GET / POST / DELETE delivery addresses
│
└── src/                               # React + TypeScript frontend
    │
    ├── main.tsx                       # ReactDOM.createRoot entry point
    ├── App.tsx                        # Provider tree: QueryClient → Auth → Cart → Wishlist
    ├── AppContent.tsx                 # Router, routes, modal manager, delayed login prompt
    ├── index.css                      # Tailwind directives, custom fonts, global resets
    │
    ├── lib/
    │   ├── cloudinary.ts              # optimizeCloudinaryUrl() + IMG_SIZES constants
    │   ├── firebase.ts                # Firebase app init (client SDK, VITE_* env vars)
    │   ├── products.ts                # fetchProducts(), Product interface, retry wrapper
    │   ├── storage.ts                 # localStorage get/set with JSON parsing + error guard
    │   ├── utils.ts                   # cn() — clsx + tailwind-merge
    │   ├── modalController.ts         # Imperative modal open/close (non-context approach)
    │   └── requireAuth.ts             # Auth guard HOF: redirects to login if unauthenticated
    │
    ├── context/
    │   ├── AuthContext.tsx            # Firebase onAuthStateChanged; login/logout/register
    │   ├── CartContext.tsx            # localStorage-first cart; background DB sync
    │   └── WishlistContext.tsx        # Guest localStorage / authenticated DB wishlist
    │
    ├── pages/
    │   ├── Index.tsx                  # Home: hero + categories + manifesto + stats + CTA
    │   ├── About.tsx                  # Brand story — parallax sections + typography
    │   ├── CategoryView.tsx           # Product grid filtered by categoryId
    │   ├── ProductView.tsx            # Detail: Embla slider + size selector + OOS handling
    │   ├── Cart.tsx                   # Cart: quantity management + subtotal + checkout link
    │   ├── Wishlist.tsx               # Saved items; move-to-cart action
    │   ├── Checkout.tsx               # Address form + order summary + place order
    │   ├── Orders.tsx                 # Order history + cancel flow
    │   ├── Admin.tsx                  # Admin panel: orders / products / categories tabs
    │   ├── Profile.tsx                # Address book (view / add / delete)
    │   └── NotFound.tsx               # 404 fallback
    │
    └── components/
        ├── Navbar.tsx                 # Sticky nav: logo, links, search, wishlist, cart count
        ├── Footer.tsx                 # Site-wide footer
        ├── CustomCursor.tsx           # Branded animated cursor (desktop only)
        ├── ScrollProgress.tsx         # Brass progress bar at viewport top
        ├── HeroSection.tsx            # Animated homepage hero
        ├── CategoriesSection.tsx      # Framer Motion stagger grid of category cards
        ├── SearchOverlay.tsx          # Full-screen live product search
        ├── HangTagSection.tsx         # Product detail visual element
        ├── BrassButtonSection.tsx     # Brand CTA section
        ├── ManifestoSection.tsx       # Brand manifesto copy
        ├── Numbers.tsx                # Animated brand statistics
        ├── Legacy.tsx                 # Brand heritage section
        ├── Pillars.tsx                # Brand pillars section
        ├── TraitsSection.tsx          # Product traits grid
        ├── Statement.tsx              # Bold brand statement typography
        ├── Ticker.tsx                 # Scrolling marquee text
        ├── auth/
        │   └── LoginModal.tsx         # Firebase email/password sign-in + sign-up modal
        ├── checkout/
        │   ├── AddressForm.tsx        # Shipping address capture form with validation
        │   ├── ProductSummary.tsx     # Line-item order summary (Cloudinary-optimized images)
        │   └── OrderConfirmation.tsx  # Post-order confirmation screen
        └── ui/                        # shadcn/ui primitives (Button, Input, Select, Dialog…)
```

---

## 5. Environment Variables & Secrets

**Never commit secrets to source control.** Set these as Replit Secrets or in a `.env` file.

### Required Secrets

| Variable | Where Used | Description |
|---|---|---|
| `MONGO_URI` | `api/_lib/mongodb.js` | Full MongoDB Atlas connection string. Example: `mongodb+srv://user:pass@cluster.mongodb.net/thunderbolt?retryWrites=true&w=majority` |
| `FIREBASE_SERVICE_ACCOUNT` | `api/_lib/firebaseAdmin.js` | Complete Firebase service account JSON as a **single-line string**. Obtain from Firebase Console → Project Settings → Service Accounts → Generate new private key. Without this, the server falls back to `jwt.decode` — acceptable for local development only. |

### Optional / Defaults

| Variable | Default | Description |
|---|---|---|
| `ADMIN_EMAIL` | `nikhilwebworks@gmail.com` | Email address with unconditional admin access. The DB role check (`users.role === "admin"`) takes priority. Set this to protect against default email exposure. |

### Firebase Client Config

The Firebase client-side config object is embedded directly in `src/lib/firebase.ts`. These values are **intentionally public** — Firebase enforces security through Authentication rules and database rules, not by hiding client config. If you need to switch Firebase projects, update that file directly.

---

## 6. Getting Started

### Prerequisites

- Node.js 20+
- npm 10+
- MongoDB Atlas cluster (free tier M0 is sufficient)
- Firebase project with **Email/Password** sign-in method enabled

### Installation

```bash
# 1. Clone the repository
git clone <repo-url>
cd thunderbolt

# 2. Install all dependencies
npm install

# 3. Set secrets (Replit Secrets, or create .env)
#    MONGO_URI=<your atlas URI>
#    FIREBASE_SERVICE_ACCOUNT=<your JSON, single line>
#    ADMIN_EMAIL=<your admin email>

# 4. Start development servers
npm run dev
```


Open `http://localhost:5000`. The Vite dev server proxies all `/api/*` calls to Express on port 3001.

### First-Run Database Setup

MongoDB collections are created lazily — they are auto-created when the first document is inserted. There are no migration scripts to run. However, for a clean start:

1. Create an admin user by registering in the app with your `ADMIN_EMAIL`
2. In your MongoDB Atlas console, find that user document and set `role: "admin"` manually, or rely on the `ADMIN_EMAIL` fallback
3. Use the Admin panel to create categories and products

---

## 7. Scripts Reference

| Script | Command | What it runs |
|---|---|---|
| `dev` | `npm run server & npm run dev:client` | Both servers concurrently |
| `dev:client` | `vite` | Vite frontend on port 5000 only |
| `server` | `node server.js` | Express API on port 3001 only |
| `build` | `vite build` | Production build → `dist/` |
| `build:dev` | `vite build --mode development` | Build with source maps, no minification |
| `lint` | `eslint .` | ESLint across the whole project |
| `preview` | `vite preview` | Serve the production build locally |
| `test` | `vitest run` | Run test suite once |
| `test:watch` | `vitest` | Run tests in watch mode |

---

## 8. Frontend Deep Dive

### Routing

Routes are defined in `src/AppContent.tsx` using React Router v6:

| Path | Page | Auth Required |
|---|---|---|
| `/` | Index (Home) | No |
| `/about` | About | No |
| `/category/:id` | CategoryView | No |
| `/product/:id` | ProductView | No |
| `/cart` | Cart | No |
| `/wishlist` | Wishlist | No |
| `/checkout` | Checkout | Yes |
| `/orders` | Orders | Yes |
| `/profile` | Profile | Yes |
| `/admin` | Admin | Admin email only |
| `*` | NotFound | No |

### Pages

#### `Index.tsx` — Home
Assembles all cinematic brand sections in order: `HeroSection`, `CategoriesSection`, `ManifestoSection`, `TraitsSection`, `HangTagSection`, `Numbers`, `Pillars`, `Legacy`, `Statement`, `BrassButtonSection`. Category data is fetched live from `/api/categories` to populate the grid.

#### `ProductView.tsx` — Product Detail

The most feature-rich page. Key behaviors:

**Responsive layout** — single-column stack on mobile (image slider on top, details beneath), two-column row from `md` upward. Top padding adapts to the navbar height (`pt-[110px] md:pt-[164px]`); the gap between the slider and the details column is tightened on mobile (`gap-7 md:gap-12 lg:gap-24`) to remove dead space, and the details column drops its mobile vertical padding (`py-0 md:py-8`) so the "Premium Collection" eyebrow sits close to the image.

**Image carousel** — `embla-carousel-react` with touch swipe, prev/next navigation arrows, and a thumbnail strip below the main image. Thumbnails highlight the active slide. Mobile shows compact slide-indicator dots overlaid on the slider instead of the full thumbnail strip. All images are Cloudinary-optimized: hero at 1000px, thumbnails at 200px.

**Title typography** — `font-display` heading scales `text-2xl sm:text-4xl md:text-6xl lg:text-7xl` with tighter tracking on mobile (`tracking-[0.08em] sm:tracking-[0.1em]`) and `leading-tight` on small screens to keep the title compact on phones while preserving the bold cinematic display size on desktop.

**Description** — collapsible (`line-clamp-4` until expanded) with a small "Read More / Show Less" toggle. Sized at `0.78rem` with `leading-snug` so it stays readable but reads as supporting copy, not a hero block. Toggle only renders when the description exceeds ~200 characters.

**Size selector** — 5 buttons for sizes `['28', '30', '32', '34', '36']`. Each button checks `sizeStock[size]`. When stock is 0:
- Button is `disabled`
- Text has `line-through` class
- A small `"OOS"` sub-label renders below the size
- Button has a muted red border and text color

**Stock display logic:**
```
product.stock === 0 or product.sizeStock[selectedSize] === 0
  → "Out of Stock" badge (red); all action buttons disabled

0 < product.stock <= 3 AND sizeStock[selectedSize] > 0
  → "Only X left" badge (amber, pulsing animation)

product.stock > 3
  → No badge shown
```

**`effectiveOutOfStock`** — a derived boolean combining global OOS (total stock = 0) and per-size OOS (selected size stock = 0). All action buttons (`Add to Cart`, `Order Now`) check this flag, not just the raw `stock` field.

**Add to Cart / Order Now** — both have an `isLoading` flag that disables the button and shows a spinner during the async operation, preventing double-submission.

**Action ordering** — the visual stack is now: description → size selector → quantity → product highlights → action buttons (`Add to Cart` + wishlist heart, then full-width `Order Now`) → **trust badges** (`Cash on Delivery Available`, `1 Day Assured Refund`, `Easy Exchange and Returns`). The trust badges intentionally sit *after* the primary CTAs so the buy actions stay above the fold on mobile and the badges read as reassurance immediately following the purchase decision.

#### `CategoryView.tsx` — Category Grid

Fetches all products then filters by `product.categoryId === params.id`. Renders a responsive grid with a wishlist-toggle heart on each card. Product images are Cloudinary-optimized at 500px (card size).

#### `Cart.tsx` — Shopping Cart

Reads from `CartContext`. Shows item image (200px), name, size, quantity stepper (+ / − with min=1 guard), subtotal per item, remove button, and cart total. Links to `/checkout`. DB sync is fire-and-forget.

#### `Checkout.tsx` — Checkout Flow

Three-phase flow:
1. **Address** — shows saved addresses with a radio selector + "Add New Address" option (inline form)
2. **Summary** — `ProductSummary` component lists all cart items with Cloudinary images
3. **Confirmation** — calls `POST /api/orders/create`, clears cart on success, shows order ID

Includes idempotency key (`clientOrderId = uuid`) to prevent duplicate orders on network retry.

#### `Orders.tsx` — Order History

Fetches `GET /api/orders` (user-scoped by the backend). Shows status badge, items (name + size + qty), total, date, and a **Cancel** button for non-final statuses. Cancel calls `PUT /api/orders/cancel` which restores stock for all items atomically.

#### `Admin.tsx` — Admin Dashboard

Three tabs: **Orders**, **Products**, **Categories**. See [Admin Panel](#14-admin-panel) for full details.

#### `Profile.tsx` — Address Book

Lists saved addresses from `GET /api/address`. Supports add and delete via API calls.

#### `Wishlist.tsx` — Saved Items

Reads from `WishlistContext`. Shows product image (500px), name, price, and two actions: **Add to Cart** (via `CartContext.addToCart`) and **Remove** (via `WishlistContext.toggleWishlist`).

---

### Components

#### `Navbar.tsx`
Sticky top navigation. Contains: Thunderbolt wordmark, category nav links, `SearchOverlay` trigger, wishlist icon with item-count badge (red), cart icon with item-count badge (red), and a login/avatar button. Collapses to a hamburger on mobile. Uses `CartContext` and `WishlistContext` for live counts.

#### `Footer.tsx`
Site-wide footer with a fully responsive layout split between mobile and desktop:

- **Mobile** (`< sm`): brand block (logo, tagline, social icons, secure-checkout badge) followed by four collapsible accordions — `Quick Links`, `Support`, `Policies`, `Contact`. Accordions are closed by default; opening one animates the `+` icon to a `×` (45° rotation) and expands the panel via Framer Motion `AnimatePresence` (height + opacity).
- **Desktop / tablet** (`sm+`): a balanced **12-column grid** — brand col-span-4, then `Quick Links`, `Support`, `Policies`, `Contact` each col-span-2. Splitting Support and Policies into their own columns avoids the lopsided "tall middle column" the older 4-column layout produced.
- **Socials**: Instagram (lucide icon) and WhatsApp (inline SVG, since lucide-react ships no WhatsApp glyph). Both render inside circular bordered buttons; WhatsApp deep-links to `https://wa.me/919561172681`, matching the contact phone.
- **Policies modal**: clicking any item in `PoliciesList` opens a shared modal (`activePolicy` state) that lazy-renders the relevant policy content.
- All sections share the same typography (`font-condensed`, brass accent labels) and underlying `BrandBlock`, `QuickLinksList`, `SupportList`, `PoliciesList`, `ContactBlock` building blocks — used by both mobile and desktop without duplication.

#### `SearchOverlay.tsx`
Full-screen overlay triggered from the Navbar. Fetches all products once on open and filters client-side as the user types. Results show Cloudinary-optimized product images (500px), product name, price, and click-to-navigate.

#### `CategoriesSection.tsx`
Fetches categories from `/api/categories`. Renders an animated grid using Framer Motion `staggerChildren` on scroll entry. Images are Cloudinary-optimized at 500px. Each card navigates to `/category/:id`. The legacy "On the Horizon / Coming Soon" teaser strip that previously sat below the grid has been retired from the storefront — the markup remains commented in the source for easy reinstatement, but the section no longer renders. The `coming-soon` value is still a valid `section` on the backend so admin-tagged categories continue to work.

#### `CustomCursor.tsx`
Replaces the default browser cursor on desktop with a branded circular overlay. Tracks `mousemove` and scales on hover. Hidden on mobile (touch devices detected via `pointer: coarse`).

#### `HeroBanner.tsx`
Auto-advancing image slider (3 s interval) with prev/next arrow buttons, dot-indicator navigation, and touch swipe support. Framer Motion handles the crossfade transition between slides. Currently displays two slides:
- Slide 1: "Get an Extra 40% Off — Live Now"
- Slide 2: "Buy Three Jeans at Only ₹1299 — Limited Offer" (links to the Live Sale section)

#### `ScrollProgress.tsx`
Thin progress bar at the top of the viewport. Reads `window.scrollY / (document.body.scrollHeight - window.innerHeight)` on scroll and fills proportionally in the brand brass color.

#### `checkout/ProductSummary.tsx`
Renders order line items in the checkout summary panel. Shows Cloudinary-optimized product image (200px thumbnail), product name, selected size, quantity, and line total.

---

### Context Providers

The provider hierarchy in `App.tsx`:

```
<QueryClientProvider>
  <AuthProvider>
    <CartProvider>
      <WishlistProvider>
        <AppContent />  ← router lives here
      </WishlistProvider>
    </CartProvider>
  </AuthProvider>
</QueryClientProvider>
```

#### `AuthContext`

Wraps Firebase `onAuthStateChanged`. Exposes:

| Export | Type | Description |
|---|---|---|
| `user` | `User \| null` | The raw Firebase `User` object. Access `user.getIdToken()` for API auth headers. |
| `loading` | `boolean` | `true` while the initial auth state is being determined |
| `login(email, password)` | `async` | Firebase `signInWithEmailAndPassword` |
| `register(email, password)` | `async` | Firebase `createUserWithEmailAndPassword`, then calls `POST /api/users/create` |
| `logout()` | `async` | Firebase `signOut` + clears local cart/wishlist state |

#### `CartContext`

Strategy: **localStorage-first, DB second.**

| Export | Type | Description |
|---|---|---|
| `items` | `CartItem[]` | Current cart items |
| `addToCart(item)` | `fn` | Adds or increments item; writes localStorage; background DB sync |
| `removeFromCart(productId, size)` | `fn` | Removes specific item+size combination |
| `updateQuantity(productId, size, qty)` | `fn` | Sets exact quantity |
| `clearCart()` | `fn` | Empties cart entirely (used post-checkout) |
| `isInCart(productId, size)` | `boolean` | Check membership |
| `getItemQuantity(productId, size)` | `number` | Get quantity for a specific size |
| `totalItems` | `number` | Sum of all quantities |
| `totalPrice` | `number` | Sum of all (price × quantity) |

`CartItem` shape:
```ts
{
  productId: string;
  name: string;
  price: number;
  quantity: number;
  size: string;       // e.g. "32"
  image: string;      // raw Cloudinary URL (optimized at render time)
}
```

localStorage key: `thunderbolt_cart`

#### `WishlistContext`

Strategy: **localStorage for guests, DB for authenticated users.** On login, the localStorage wishlist is merged into the DB.

| Export | Type | Description |
|---|---|---|
| `items` | `WishlistItem[]` | Current wishlist |
| `toggleWishlist(item)` | `fn` | Add if not present; remove if present |
| `isInWishlist(productId)` | `boolean` | Membership check |
| `totalItems` | `number` | Total count |

`WishlistItem` shape:
```ts
{
  productId: string;
  name: string;
  price: number;
  image: string;
}
```

localStorage key: `thunderbolt_wishlist`

---

### Lib Utilities

#### `src/lib/cloudinary.ts`

See [Section 13](#13-cloudinary-image-optimization) for full documentation.

#### `src/lib/products.ts`

Exports the `Product` TypeScript interface and fetch helpers:

```ts
interface Product {
  _id: string;
  name: string;
  price: number;
  image: string;
  images?: string[];
  description?: string;
  categoryId?: string;
  stock: number;
  sizeStock?: Record<string, number>;
  createdAt?: string;
}
```

`fetchProducts()` calls `GET /api/products` with an exponential-backoff retry wrapper (3 attempts, 300ms → 600ms → 1200ms delays).

#### `src/lib/utils.ts`

```ts
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
export function cn(...inputs) { return twMerge(clsx(inputs)); }
```

The standard shadcn/ui class merge utility. Used universally across all components.

#### `src/lib/requireAuth.ts`

A higher-order function that wraps any async action. If the user is not authenticated, it opens the `LoginModal` instead of executing the action. Used on `addToCart` and `orderNow` triggers.

---

## 9. Backend Deep Dive

### Express Server (`server.js`)

`server.js` creates an Express app, applies `helmet` for security headers, parses JSON bodies, then dynamically routes each `/api/*` path to the corresponding file in the `api/` directory. This mirrors the Vercel serverless function convention, making the codebase deploy-ready without modification.

```js
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' }, contentSecurityPolicy: false }));
app.use(express.json());

// Dynamic routing: /api/orders/create → api/orders/create.js
app.all('/api/*path', async (req, res) => {
  const modulePath = `./api/${req.params.path.join('/')}.js`;
  const handler = (await import(modulePath)).default;
  return handler(req, res);
});
```

### API Reference

#### `GET /api/products`

Public. Returns all products sorted by `createdAt` descending.

Response:
```json
{
  "products": [ { "_id": "...", "name": "...", "sizeStock": { "28": 5, "30": 10 }, "stock": 33 } ],
  "count": 25,
  "source": "database"
}
```

#### `POST /api/products` — Admin

Creates a product. Body must include `name`, `price`, and `images[]`. `categoryId` is required for all sections **except** `live-sale` — when `section === "live-sale"`, `categoryId` is optional and stored as an empty string. Optional: `description`, `sizeStock`, `section` (defaults to `"denim"`).

`sizeStock` is normalised on the server:
```js
function normaliseSizeStock(raw) {
  const out = {};
  for (const size of SIZES) {
    out[size] = Math.max(0, parseInt(raw?.[size] ?? 0, 10)) || 0;
  }
  return out;
}
```
Then `stock = Object.values(sizeStock).reduce((a, b) => a + b, 0)`.

#### `PUT /api/products?id=<id>` — Admin

Updates an existing product. All fields optional. `sizeStock` and `stock` follow the same normalisation. Uses `$set` to avoid clobbering unmodified fields.

#### `DELETE /api/products?id=<id>` — Admin

Hard-deletes the product document. No soft-delete; no cascade on orders (historical orders keep their product names as strings).

#### `GET /api/categories`

Public. Returns all categories.

```json
{ "categories": [ { "_id": "...", "name": "Slim Fit", "image": "https://..." } ], "count": 4 }
```

#### `POST /api/categories` — Admin

Body: `{ "name": "...", "image": "...", "section": "denim" | "tshirts" | "coming-soon" }`. The `section` field determines which storefront section the category belongs to. Defaults to `"denim"` if omitted. The `live-sale` section is intentionally excluded — Live Sale products don't use categories. Inserts and returns the new document.

#### `DELETE /api/categories/:id` — Admin

Deletes a category by MongoDB ObjectId. Uses `new ObjectId(id)` — plain string comparison would silently fail.

#### `POST /api/orders/create` — Authenticated User

Full order placement with atomic stock decrement:

```
Body: {
  products: [{ productId, name, quantity, size, price, image }],
  totalAmount,
  address: { fullName, phone, addressLine1, city, pincode },
  paymentMethod: "COD",
  clientOrderId: "<uuid v4>"
}
```

Flow:
1. Verify Firebase token → extract `userId` (email)
2. **Idempotency check**: if `clientOrderId` exists in orders collection → return existing order (200, not 201)
3. **Pre-flight stock check**: for each item, read current `sizeStock[size]` (or `stock` for legacy products). Return 400 with the first OOS item name if insufficient.
4. **Insert order** document with `status: "pending"`
5. **Atomic decrement loop**: for each item:
   - If product has `sizeStock`: `$inc: { "sizeStock.SIZE": -qty, stock: -qty }` with filter `{ "sizeStock.SIZE": { $gte: qty } }`
   - Otherwise: `$inc: { stock: -qty }` with filter `{ stock: { $gte: qty } }`
   - If `modifiedCount === 0` → concurrent buyer grabbed the last unit → break and enter rollback
6. **Rollback** (on race condition): for each successfully-decremented item, apply the inverse `$inc`. Delete the inserted order. Return 409.
7. On success: return 201 with full order document.

#### `PUT /api/orders/cancel` — Authenticated User or Admin

```
Body: { orderId: "<ObjectId>" }
```

Fetches the order, verifies ownership (or admin). For each item in the order:
- Fetches current product
- If product has `sizeStock` and item has a `size` field: `$inc: { "sizeStock.SIZE": +qty, stock: +qty }`
- Otherwise: `$inc: { stock: +qty }`

Sets `order.status = "cancelled"`.

#### `PATCH /api/orders/manage?id=<orderId>` — Admin

Updates an order's status. The order ID is passed as a query parameter (not in the body) to avoid Vercel dynamic-route resolution issues.

```
Body: { "status": "pending" | "confirmed" | "shipped" | "delivered" }
```

Valid statuses: `pending`, `confirmed`, `shipped`, `delivered`. Returns 404 if the order is not found.

#### `DELETE /api/orders/manage?id=<orderId>` — Admin

Permanently removes the order document from the database. The order ID is passed as a query parameter. Returns 404 if not found. Both PATCH and DELETE are handled by the same `api/orders/manage.js` handler, distinguished by HTTP method.

#### `GET /api/orders` — User or Admin

Admin (identified by `isAdmin()`) gets all orders sorted by `createdAt` descending. Regular users get only orders where `userId === user.email`.

#### `GET /api/cart` + `POST /api/cart`

`GET` returns the user's cart document. `POST` upserts the entire `items` array (replaces, not appends). Keyed by `userId` (email).

#### `GET /api/wishlist` + `POST /api/wishlist`

Same pattern as cart. `POST` replaces the full `items` array.

#### `GET /api/address` + `POST /api/address` + `DELETE /api/address`

Addresses are stored as an array on the user document. `POST` appends to the array. `DELETE` removes by index.

---

### Shared Backend Lib

#### `api/_lib/mongodb.js`

Singleton connection pool:
```js
let cachedDb = null;

export async function getDb() {
  if (cachedDb) return cachedDb;
  const client = new MongoClient(process.env.MONGO_URI);
  await client.connect();
  cachedDb = client.db('thunderbolt');
  return cachedDb;
}
```

This reuses the TCP connection across requests, which is critical both for serverless cold starts and to prevent connection exhaustion.

#### `api/_lib/firebaseAdmin.js`

Lazy-initialises the Firebase Admin SDK on first call:

```js
function init() {
  if (adminAuth || initError) return;
  const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!serviceAccountEnv) {
    initError = 'FIREBASE_SERVICE_ACCOUNT not set — using jwt.decode fallback';
    return;
  }
  initializeApp({ credential: cert(JSON.parse(serviceAccountEnv)) });
  adminAuth = getAuth();
}
```

`verifyFirebaseToken(token)`:
- With Admin SDK: `adminAuth.verifyIdToken(token, true)` — checks cryptographic signature + expiry + Firebase project binding
- Without Admin SDK (dev only): `jwt.decode(token)` — reads claims with no signature check

#### `api/_lib/adminHelper.js`

```js
export async function isAdmin(email, db) {
  if (!email) return false;
  const user = await db.collection('users').findOne({ email }, { projection: { role: 1 } });
  if (user?.role === 'admin') return true;
  return email === (process.env.ADMIN_EMAIL || 'nikhilwebworks@gmail.com');
}
```

Two-layer check: DB role first (correct for multi-admin setups), env var fallback (for bootstrapping).

---

## 10. Database Schema

Database name: **`thunderbolt`**

### `products`

```js
{
  _id: ObjectId,
  name: String,                         // required
  price: Number,                        // in smallest currency unit (paise or cents)
  image: String,                        // first image URL — kept for backward compatibility
  images: [String],                     // all image URLs
  description: String,
  categoryId: String,                   // ObjectId as string (ref to categories._id); empty string for live-sale products
  section: String,                      // "denim" | "live-sale" | "tshirts" | "coming-soon"; defaults to "denim"
  stock: Number,                        // total = sum(sizeStock values), auto-computed
  sizeStock: {                          // per-size availability map
    "28": Number,
    "30": Number,
    "32": Number,
    "34": Number,
    "36": Number,
  },
  createdAt: Date,
  updatedAt: Date,                      // set on every PUT
}
```

### `orders`

```js
{
  _id: ObjectId,
  userId: String,                       // Firebase email
  clientOrderId: String,                // UUID — unique index for idempotency
  products: [{
    productId: String,                  // ObjectId as string
    name: String,                       // snapshot at order time
    quantity: Number,
    size: String,                       // e.g. "32"
    price: Number,
    image: String,
  }],
  totalAmount: Number,
  status: String,                       // "pending" | "confirmed" | "shipped" | "delivered" | "cancelled"
  address: {
    fullName: String,
    phone: String,
    addressLine1: String,
    city: String,
    pincode: String,
  },
  paymentMethod: String,                // "COD"
  createdAt: Date,
}
```

Indexes: `{ clientOrderId: 1 }` — **unique** (enforces idempotency).

### `users`

```js
{
  _id: ObjectId,
  email: String,                        // unique index
  uid: String,                          // Firebase UID
  role: String,                         // "user" | "admin"
  addresses: [{
    fullName: String,
    phone: String,
    addressLine1: String,
    city: String,
    pincode: String,
  }],
  createdAt: Date,
}
```

### `categories`

```js
{
  _id: ObjectId,
  name: String,
  image: String,                        // Cloudinary URL
  section: String,                      // "denim" | "tshirts" | "coming-soon"; defaults to "denim" for legacy docs
  createdAt: Date,
}
```

### `cart`

```js
{
  _id: ObjectId,
  userId: String,                       // Firebase email — unique index
  items: [{
    productId: String,
    name: String,
    price: Number,
    quantity: Number,
    size: String,
    image: String,
  }],
  updatedAt: Date,
}
```

### `wishlist`

```js
{
  _id: ObjectId,
  userId: String,                       // Firebase email — unique index
  items: [{
    productId: String,
    name: String,
    price: Number,
    image: String,
  }],
  updatedAt: Date,
}
```

---

## 11. Size-Based Stock System

### Overview

Products track stock at two levels simultaneously:

| Field | Type | Meaning |
|---|---|---|
| `sizeStock` | `Record<string, number>` | Units available per individual size |
| `stock` | `number` | Total units across all sizes (always = Σ sizeStock values) |

The two fields are always kept in sync — `stock` is never set directly by the admin; it is always computed.

### Available Sizes

```ts
const SIZES = ['28', '30', '32', '34', '36'] as const;
```

This constant is defined in both `src/pages/Admin.tsx` (for the form) and `src/pages/ProductView.tsx` (for the size buttons). Changing available sizes only requires updating these two constants.

### Admin: `SizeStockInput` Component

The admin product form includes a dedicated `SizeStockInput` component that renders a 5-column responsive grid:

- Each column shows the size label (red when qty = 0) and a number input (red border when qty = 0)
- A running total is displayed below the grid
- On form submit, `sizeStock` values are parsed to integers and clamped to ≥ 0

### Backend Normalisation

On every `POST` and `PUT` to `/api/products`:

```js
function normaliseSizeStock(raw) {
  const out = {};
  for (const size of ['28', '30', '32', '34', '36']) {
    out[size] = Math.max(0, parseInt(raw?.[size] ?? 0, 10)) || 0;
  }
  return out;
}

function computeTotalStock(sizeStock) {
  return Object.values(sizeStock).reduce((a, b) => a + b, 0);
}
```

This ensures all 5 sizes always exist in the stored document and that no negative values are stored.

### Product Page: OOS Size Buttons

```ts
const isSizeOos = (size: string): boolean => {
  if (!product?.sizeStock) return false;
  return (product.sizeStock[size] ?? 0) <= 0;
};

// Combined OOS: total stock 0 OR selected size stock 0
const effectiveOutOfStock = isOutOfStock || (selectedSize ? isSizeOos(selectedSize) : false);
```

When `isSizeOos(size)` is `true`, the size button renders:
```tsx
<button disabled className="opacity-50 border-red-900/50 text-gray-500 cursor-not-allowed">
  <span className="line-through">{size}</span>
  <span className="text-[9px] text-red-400 block">OOS</span>
</button>
```

### Backward Compatibility

Products without `sizeStock` (imported from legacy data) are handled everywhere:

- `ProductView`: `if (!product.sizeStock)` skips per-size OOS checks
- `orders/create.js`: falls back to `product.stock` when no `sizeStock` key exists
- `orders/cancel.js`: re-fetches the product to check `sizeStock` presence before restore

---

## 12. Order Lifecycle

```
User clicks "Order Now" or "Place Order" from Checkout
         │
         ▼
POST /api/orders/create
  │
  ├── [1] Token verification (Firebase Admin SDK or jwt.decode)
  │
  ├── [2] Idempotency check
  │       Query: { clientOrderId: req.body.clientOrderId }
  │       If found → return 200 with existing order (no new stock decrement)
  │
  ├── [3] Pre-flight stock validation
  │       For each item:
  │         read sizeStock[item.size] (or stock for legacy)
  │         if available < item.quantity → return 400 "X is out of stock"
  │
  ├── [4] Insert order document (status: "pending")
  │
  ├── [5] Atomic decrement loop
  │       For each item:
  │         $inc { "sizeStock.SIZE": -qty, stock: -qty }
  │         filter { "sizeStock.SIZE": { $gte: qty } }
  │         if modifiedCount === 0 → race condition → break
  │
  └── [6] Race condition detected?
          YES → rollback all decrements → deleteOne(order) → return 409
          NO  → return 201 with order document


Admin changes status → PATCH /api/orders/manage?id=<orderId>
  status flow: pending → confirmed → shipped → delivered

Admin deletes order → DELETE /api/orders/manage?id=<orderId>
  permanently removes order document — no stock restoration


User cancels → PUT /api/orders/cancel
  For each item in order:
    re-fetch product → check sizeStock presence
    $inc { "sizeStock.SIZE": +qty, stock: +qty }
  order.status = "cancelled"
```

---

## 13. Cloudinary Image Optimization

### The Problem Solved

Without optimization, a product hero image uploaded at 4000×6000px and 8MB would be served at full resolution to every visitor on every device. With Cloudinary's transformation API, the server delivers the right format and size for every context automatically.

### Utility: `src/lib/cloudinary.ts`

```ts
const CLOUD_NAME = 'djptdutak';

export function optimizeCloudinaryUrl(
  url: string | null | undefined,
  width: number = 800,
): string {
  if (!url) return '/placeholder.png';
  if (!url.includes('res.cloudinary.com')) return url;      // pass-through for non-Cloudinary
  if (url.includes('/upload/f_auto')) return url;           // idempotent — already optimised

  return url.replace('/upload/', `/upload/f_auto,q_auto,w_${width}/`);
}

export const IMG_SIZES = {
  thumbnail: 200,   // cart items, checkout summary, admin URL previews
  card:      500,   // product cards, category cards, search results, wishlist
  detail:    1000,  // product detail page hero slider
} as const;
```

**Transformations explained:**

| Transformation | Effect |
|---|---|
| `f_auto` | Cloudinary auto-negotiates the best format: **AVIF** (Chrome 85+, Firefox 86+), **WebP** (all modern browsers), **JPEG** (legacy fallback). Typically saves 30–70% vs. original JPEG. |
| `q_auto` | Cloudinary's perceptual quality engine picks the lowest quality that looks visually identical to the source. Saves 20–40% additional. |
| `w_<n>` | Resize to N pixels wide; height scales proportionally to maintain aspect ratio. |

**Example URL transformation:**
```
Raw:
https://res.cloudinary.com/djptdutak/image/upload/v1234/products/abc.jpg

Optimized (card size):
https://res.cloudinary.com/djptdutak/image/upload/f_auto,q_auto,w_500/v1234/products/abc.jpg
```

### Applied Locations

| Component | Context | IMG_SIZE |
|---|---|---|
| `ProductView.tsx` | Hero carousel slides | `detail` (1000px) |
| `ProductView.tsx` | Thumbnail strip | `thumbnail` (200px) |
| `CategoryView.tsx` | Product cards | `card` (500px) |
| `CategoriesSection.tsx` | Category cards | `card` (500px) |
| `SearchOverlay.tsx` | Search result thumbnails | `card` (500px) |
| `Wishlist.tsx` | Wishlist product cards | `card` (500px) |
| `Cart.tsx` | Cart line item images | `thumbnail` (200px) |
| `checkout/ProductSummary.tsx` | Order summary images | `thumbnail` (200px) |
| `Admin.tsx` — URL input preview | Paste preview | `thumbnail` (200px) |
| `Admin.tsx` — Products tab | Product card grid | `card` (500px) |
| `Admin.tsx` — Categories tab | Category card grid | `card` (500px) |

### Safety Properties

- **Non-Cloudinary URLs** (local paths `/placeholder.png`, external CDNs): returned unchanged — zero risk
- **Already-optimised URLs** (containing `/upload/f_auto`): returned unchanged — no double-transformation
- **Null/undefined**: returns `/placeholder.png` — no runtime errors
- **Admin workflow**: raw URLs are stored in MongoDB as-is; transformation is a pure render-time concern

---

## 14. Admin Panel

The admin panel at `/admin` is the operations center for the store. Access is restricted to the configured admin email.

### Client-Side Guard

In `Admin.tsx`:
```tsx
if (!user || user.email !== ADMIN_EMAIL) {
  return <Navigate to="/" />;
}
```

### Server-Side Guard

Every admin API call:
1. Verifies the Firebase ID token
2. Calls `isAdmin(email, db)` — DB role check + env fallback
3. Returns 403 if not admin

### Orders Tab

A full table (desktop) / card list (mobile) with columns: Order ID (truncated), Customer email, Items (name + size + quantity + price), Ship To, Total, Date, Status, Update, Delete.

- **View Address button**: opens a modal showing the full delivery address including Full Name, Phone Number, Address, City, Pincode, Payment Method, and Customer Email
- **Status dropdown**: admin can change to `pending | confirmed | shipped | delivered`; calls `PATCH /api/orders/manage?id=...`
- **Delete button** (red trash icon): clicking shows a confirmation popup with the order ID and customer email; confirming calls `DELETE /api/orders/manage?id=...` and removes the order from the list instantly

### Products Tab

Responsive card grid. Each card shows:
- Cloudinary-optimized product image (500px)
- Category name (looked up from loaded categories; shows "Uncategorized" for Live Sale products)
- Product name + price
- **Stock badge**:
  - 🟢 Green: > 5 units
  - 🟡 Amber: 1–5 units
  - 🔴 Red: 0 units
- **Per-size breakdown**: 5 small cells showing each size and its stock count (red background when 0)
- **Edit** → opens pre-populated modal (all fields including `sizeStock`)
- **Delete** → confirmation dialog → `DELETE /api/products?id=...`

**Add/Edit Product Modal** fields:
- Name, Section (dropdown: Live Sale / Denim Collection / T-Shirts / Coming Soon), Price, Description
- **Category** — dropdown populated from categories. **Hidden entirely when section is "Live Sale"** — Live Sale products are section-only, no category needed
- Image URLs (dynamic array: add/remove URL rows; each row shows a 200px preview thumbnail)
- `SizeStockInput` — 5-column grid for per-size quantities

### Categories Tab

Grid of category cards. Each shows:
- Cloudinary-optimized category image (500px)
- Category name
- **Section label** — shows which section the category belongs to (e.g. "Denim Collection"). Legacy categories without a stored section display as "Denim Collection" by default
- **Delete** button (with confirmation)

**Add Category** form: Name, Image URL, and **Section** dropdown (Denim Collection / T-Shirts Section / Coming Soon). Live Sale is intentionally excluded from this dropdown — Live Sale is a product-level section, not a category-based one. Changes are immediately reflected in the grid on success.

---

## 15. Authentication & Security

### Firebase Client Auth Flow

```
User submits login form
  → signInWithEmailAndPassword(auth, email, password)
  → Firebase returns User object
  → onAuthStateChanged fires with the User
  → user.getIdToken() → short-lived ID token (valid 1 hour)
  → token sent in Authorization: Bearer <token> for all API calls
```

### Server Token Verification

| Condition | Mode | Security |
|---|---|---|
| `FIREBASE_SERVICE_ACCOUNT` set | Full verification | Checks RSA signature, expiry, Firebase project ID, token revocation |
| Not set | jwt.decode fallback | Claims read without signature verification — **never use in production** |

In production, always set `FIREBASE_SERVICE_ACCOUNT`. The server logs a warning to stdout if it starts without it.

### HTTP Security Headers (Helmet)

Applied to all Express responses:
- `X-Frame-Options: DENY` — prevents clickjacking
- `X-Content-Type-Options: nosniff` — prevents MIME sniffing
- `Strict-Transport-Security` — enforces HTTPS
- `X-XSS-Protection` — legacy XSS filter for older browsers
- `Referrer-Policy: no-referrer` — prevents referrer leakage
- `Cross-Origin-Resource-Policy: cross-origin` — allows Cloudinary image requests

`Content-Security-Policy` is **disabled** (`contentSecurityPolicy: false`) because the app loads dynamic Cloudinary image URLs that are not statically known.

### Duplicate Order Prevention

MongoDB unique index on `orders.clientOrderId`:
```js
await db.collection('orders').createIndex({ clientOrderId: 1 }, { unique: true });
```

If the same UUID is submitted twice (network timeout + retry, or rapid double-click), the second `insertOne` throws `E11000 Duplicate Key`. The handler catches this and returns the original order — no double charge, no double stock decrement.

### Admin Authorization — Two Layers

```
Layer 1: Firebase ID token verification (cryptographic)
Layer 2: isAdmin(email, db)
  → users.role === "admin" in MongoDB
  → OR email === ADMIN_EMAIL env var
```

Setting `role: "admin"` in the database enables a proper multi-admin setup without changing any code.

---

## 16. Cart & Wishlist System

### Cart Architecture

```
User action (Add to Cart)
        │
        ├── Immediate: update CartContext state (React re-render)
        ├── Immediate: write to localStorage
        └── Background: POST /api/cart (fire-and-forget, never blocks UI)

App load
        │
        ├── Synchronous: read localStorage → populate CartContext (instant)
        └── If logged in: GET /api/cart → merge with localStorage (server wins for conflicts)
```

This design means:
- Cart is **never empty on hydration** (localStorage loads before any network call)
- Cart **persists across devices** when logged in (DB sync)
- Cart **survives page refreshes** when logged out (localStorage)
- **Offline-tolerant**: cart works without network; sync catches up when back online

### Wishlist Architecture

```
Guest user:
  All operations → localStorage only

Authenticated user:
  On login → read localStorage → POST /api/wishlist (merge to DB) → clear localStorage
  All operations → DB via API + update WishlistContext state

On logout:
  WishlistContext clears to empty (localStorage version also cleared)
```

---

## 17. Deployment

### Build

```bash
npm run build
# → dist/ (Vite output: JS bundles, assets, index.html)
```

### Replit Deployment

The `.replit` config targets autoscale deployment. The Express server serves both the API and the static build from `dist/`.

### Vercel Deployment

`vercel.json` rewrites all routes to the serverless function handlers in `api/`. The Vite build output goes to the `dist/` directory which Vercel serves as static assets.

#### Cron Job — Keep-Warm

A Vercel Cron Job is configured in `vercel.json` to prevent serverless cold starts:

```json
"crons": [
  {
    "path": "/api/products",
    "schedule": "*/5 * * * *"
  }
]
```

This sends a `GET` request to `/api/products` every 5 minutes, keeping the MongoDB connection pool alive and the function warm. No new API file is needed — it reuses the existing products handler. Note: Vercel Cron Jobs require a Pro plan or higher for sub-hourly schedules in production.

### Production Checklist

```
□ MONGO_URI secret set (Atlas URI with correct DB name)
□ FIREBASE_SERVICE_ACCOUNT secret set (full JSON, single line)
□ ADMIN_EMAIL secret set (or admin user has role: "admin" in DB)
□ Firebase project → Authentication → Email/Password enabled
□ MongoDB Atlas → Network Access → allow deployment IP (or 0.0.0.0/0 for serverless)
□ MongoDB Atlas → Database Access → user has readWrite on thunderbolt DB
□ Cloudinary account active under cloud name djptdutak
```

---

## 18. Known Behaviors & Design Decisions

| Behavior | Rationale |
|---|---|
| Firebase client config is hardcoded | Firebase client configs are publicly safe by design; security is enforced by Firebase rules, not by hiding the config |
| `FIREBASE_SERVICE_ACCOUNT` falls back to `jwt.decode` | Allows local development without the full Firebase Admin setup. The fallback logs a warning on startup so developers know it is in use |
| Cart uses localStorage-first | Provides zero-latency UI — cart renders immediately on page load without waiting for a network round-trip |
| `stock` field is kept alongside `sizeStock` | Backward compatibility with products that predate the size-stock system; also enables quick total-stock queries without summing the map |
| `clientOrderId` UUID for idempotency | Prevents duplicate orders from network retries or double-clicks without requiring distributed locks |
| Admin does not cascade-delete products → orders | Historical orders preserve a point-in-time snapshot of product names and prices. Deleting a product does not invalidate order history |
| Admin deleting an order does NOT restore stock | Order delete is an administrative cleanup action (e.g. test orders, spam). It is distinct from user-cancel which explicitly restores stock. If stock must be restored, cancel the order first, then delete it |
| Live Sale products have no category | `categoryId` is stored as an empty string for `section === "live-sale"` products. This is intentional — Live Sale is a time-limited promotional slot, not a permanent category |
| Category `section` defaults to `"denim"` for legacy docs | Categories created before the section field was introduced have no `section` field in MongoDB. All display logic treats a missing/null section as `"denim"` |
| Cloudinary transformations at render time | Raw URLs are stored; transformation is a pure display concern. Changing image sizes site-wide requires only updating `IMG_SIZES` constants |
| Tailwind `duration-[0.8s]` / `ease-[...]` warnings | Tailwind 3 produces ambiguity warnings for arbitrary animation values. These are harmless and expected — the CSS is generated correctly |
| `Content-Security-Policy` is disabled | Dynamic Cloudinary image URLs cannot be whitelisted statically. A production hardening step would be to set `img-src 'self' res.cloudinary.com` |

---

## 19. Recent Frontend Updates

A running log of meaningful UI / UX changes shipped to the storefront. Backend, schema, and deployment behavior described above are unchanged unless explicitly noted here.

### Footer overhaul (`src/components/Footer.tsx`)
- Mobile now uses an accordion pattern (Quick Links, Support, Policies, Contact) — closed by default, animated open/close via Framer Motion `AnimatePresence`, with the `+` icon rotating 45° to a `×`.
- Desktop / tablet was rebalanced to a **12-column grid**: brand `col-span-4` and four equal `col-span-2` link columns. This replaces the older 4-column layout where Support and Policies stacked into the same column and made the third column visibly taller than the others.
- Added a **WhatsApp** social button next to Instagram in the brand block. lucide-react has no WhatsApp glyph, so it ships as an inline SVG matching the circular bordered style of the existing Instagram button. Deep-links to `https://wa.me/919561172681`.

### Storefront cleanup (`src/components/CategoriesSection.tsx`)
- The "On the Horizon / Coming Soon" teaser block beneath the categories grid was retired from the storefront. The JSX is preserved as a block comment for easy reinstatement; the `coming-soon` value remains a valid `section` for admin-tagged categories on the backend.

### Product detail mobile polish (`src/pages/ProductView.tsx`)
- **Compact mobile heading**: the product title now scales `text-2xl sm:text-4xl md:text-6xl lg:text-7xl` with tighter tracking and `leading-tight` on small screens.
- **Tightened mobile spacing**:
  - `<main>` top padding now `pt-[110px] md:pt-[164px]` (matches the smaller mobile navbar).
  - Back-to-Collection button uses `mb-7 md:mb-10`.
  - Slider ↔ details column gap is `gap-7 md:gap-12 lg:gap-24`.
  - Details column drops mobile vertical padding (`py-0 md:py-8`) so the "Premium Collection" eyebrow sits close to the slider.
- **Description**: reduced to `text-[0.78rem]` with `leading-snug` so it reads as supporting copy rather than a hero block.
- **Trust badges relocated**: the `Cash on Delivery Available` / `1 Day Assured Refund` / `Easy Exchange and Returns` block was moved from above the action buttons to *below* the `Order Now` button. This keeps the primary CTAs above the fold on mobile and surfaces the reassurance copy immediately after the purchase decision.

---

*Thunderbolt — Crafted for speed, designed for premium.*
