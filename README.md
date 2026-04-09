# Thunderbolt Brand World

A production-grade, cinematic e-commerce platform for premium denim. Built with a React + Vite frontend and an Express + MongoDB backend, Thunderbolt delivers a luxury shopping experience with full inventory management, user authentication, cart/wishlist persistence, and a powerful admin dashboard.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture](#architecture)
4. [Folder Structure](#folder-structure)
5. [Environment Variables & Secrets](#environment-variables--secrets)
6. [Getting Started](#getting-started)
7. [Frontend Deep Dive](#frontend-deep-dive)
8. [Backend Deep Dive](#backend-deep-dive)
9. [Inventory & Stock Management](#inventory--stock-management)
10. [Order Lifecycle](#order-lifecycle)
11. [Admin Panel Guide](#admin-panel-guide)
12. [Authentication Flow](#authentication-flow)
13. [Cart & Wishlist System](#cart--wishlist-system)
14. [Database Schema](#database-schema)
15. [Deployment](#deployment)
16. [Known Behaviors & Decisions](#known-behaviors--decisions)

---

## Project Overview

**Thunderbolt Brand World** is an end-to-end e-commerce solution specializing in premium denim apparel. The platform is designed around a "cinematic" brand experience — with smooth Framer Motion animations, a striking dark aesthetic, custom cursors, and cinematic typography — while maintaining a robust backend that handles real-world commerce requirements:

- Live product catalog backed by MongoDB
- Firebase-powered user authentication
- Hybrid cart/wishlist system (localStorage for instant UX + MongoDB for cross-device persistence)
- Real-time inventory tracking with automatic stock decrements on purchase and stock restoration on cancellation
- Full admin dashboard for product, category, and order management
- Mobile-first responsive design

---

## Technology Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 18.x | UI framework |
| Vite | 5.x | Build tool & dev server |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 3.x | Utility-first styling |
| Framer Motion | 12.x | Page & element animations |
| React Router DOM | 6.x | Client-side routing |
| TanStack Query | 5.x | Server state management |
| Embla Carousel | 8.x | Product image slider |
| shadcn/ui + Radix UI | — | Accessible UI primitives |
| Lucide React | — | Icon library |
| React Hook Form + Zod | — | Form validation |
| Firebase SDK | 10.x | Authentication |
| Sonner | — | Toast notifications |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Node.js | — | Runtime |
| Express | 5.x | Local dev API server |
| MongoDB Driver | 6.x | Database access |
| JSON Web Token | 9.x | Token decoding for auth |
| dotenv | — | Environment variable loading |

### Services
| Service | Purpose |
|---|---|
| Firebase Authentication | User sign-up, sign-in, token issuance |
| MongoDB Atlas | Cloud database for products, orders, cart, wishlist, users, categories, addresses |

---

## Architecture

```
┌───────────────────────────────────────────────────────────────────┐
│                        Browser (User)                             │
│  React App (Vite, port 5000)                                      │
│  ├─ Pages → Components → Context (Auth / Cart / Wishlist)        │
│  └─ /api/* requests → proxied to Express                         │
└──────────────────────────┬────────────────────────────────────────┘
                           │ HTTP proxy (/api/*)
                           ▼
┌───────────────────────────────────────────────────────────────────┐
│          Express API Server (server.js, port 3001)                │
│  Dynamically imports serverless-style handlers from /api/**       │
│  └─ Each handler connects to MongoDB Atlas via getDb()           │
└──────────────────────────┬────────────────────────────────────────┘
                           │ MongoDB Driver
                           ▼
┌───────────────────────────────────────────────────────────────────┐
│                     MongoDB Atlas                                  │
│  Collections: products, orders, cart, wishlist, users,            │
│               categories, addresses                               │
└───────────────────────────────────────────────────────────────────┘
```

**Development dual-server setup:**
- `npm run dev` runs both the Express API server (port 3001) and the Vite dev server (port 5000) concurrently.
- Vite proxies all `/api/*` requests to `http://localhost:3001`, so the frontend never needs to know the API port.
- **Deployment target:** Vercel (serverless functions per `vercel.json`). The local Express server is only used for development.

---

## Folder Structure

```
thunderbolt-brand-world/
│
├── api/                          # Backend serverless-style API handlers
│   ├── _lib/                     # Shared backend utilities
│   │   ├── mongodb.js            # DB connection singleton (getDb)
│   │   ├── response.js           # Standardized response helpers
│   │   └── validation.js        # Input validation helpers
│   ├── address/
│   │   └── index.js              # GET / POST user delivery addresses
│   ├── cart/
│   │   └── index.js              # GET / POST / DELETE cart items (per user)
│   ├── categories/
│   │   └── index.js              # GET all / POST / DELETE categories
│   ├── orders/
│   │   ├── create.js             # POST create order + validate & decrement stock
│   │   ├── cancel.js             # PUT cancel order + restore stock
│   │   ├── manage.js             # PATCH update status / DELETE order (admin)
│   │   └── index.js              # GET orders (user or admin)
│   ├── products/
│   │   ├── index.js              # GET all / POST / PUT / DELETE products
│   │   └── [id].js               # GET single product by ID
│   ├── users/
│   │   └── index.js              # POST create/sync user profile
│   └── wishlist/
│       └── index.js              # GET / POST / DELETE wishlist items
│
├── src/                          # Frontend React application
│   ├── components/               # Reusable UI components
│   │   ├── ui/                   # shadcn/ui generated components
│   │   ├── authHeroSection.tsx   # Hero banner shown when logged in
│   │   ├── CategoriesSection.tsx # Homepage categories grid
│   │   ├── checkoutNavbar.tsx    # Minimal navbar for checkout flow
│   │   ├── CustomCursor.tsx      # Branded cursor overlay
│   │   ├── Footer.tsx
│   │   ├── HangTagSection.tsx    # Product "hang tag" UI element
│   │   ├── ManifestoSection.tsx  # Brand manifesto section
│   │   ├── Navbar.tsx            # Main site navigation
│   │   ├── Numbers.tsx           # Animated statistics section
│   │   ├── Pillars.tsx           # Brand pillars section
│   │   ├── ScrollProgress.tsx    # Scroll progress indicator bar
│   │   ├── SearchOverlay.tsx     # Full-screen search overlay
│   │   ├── Statement.tsx         # Bold brand statement section
│   │   ├── Ticker.tsx            # Marquee text ticker
│   │   ├── TraitsSection.tsx     # Brand traits display
│   │   └── checkout/
│   │       └── ProductSummary.tsx # Order summary in checkout
│   │
│   ├── context/                  # React Context providers (global state)
│   │   ├── AuthContext.tsx       # Firebase auth state, user object
│   │   ├── CartContext.tsx       # Cart state, add/remove/clear, API sync
│   │   └── WishlistContext.tsx   # Wishlist state, toggle, API sync
│   │
│   ├── lib/                      # Utility modules
│   │   ├── firebase.ts           # Firebase app & auth initialization
│   │   ├── modalController.ts    # Imperative modal open/close helpers
│   │   ├── products.ts           # Product fetch helpers, TypeScript interfaces
│   │   ├── requireAuth.ts        # HOF: redirect to login if not authenticated
│   │   ├── storage.ts            # localStorage helpers
│   │   └── utils.ts              # General utilities (cn, etc.)
│   │
│   ├── pages/                    # Route-level page components
│   │   ├── About.tsx             # Brand story / about page
│   │   ├── Admin.tsx             # Admin dashboard (orders / products / categories)
│   │   ├── Cart.tsx              # Shopping cart page
│   │   ├── CategoryView.tsx      # Products filtered by category
│   │   ├── Checkout.tsx          # Multi-step checkout flow
│   │   ├── Index.tsx             # Homepage
│   │   ├── NotFound.tsx          # 404 page
│   │   ├── Orders.tsx            # User order history
│   │   ├── ProductView.tsx       # Single product detail page
│   │   ├── Profile.tsx           # User profile & address management
│   │   └── Wishlist.tsx          # Saved wishlist items
│   │
│   ├── App.tsx                   # Root component, route definitions
│   ├── main.tsx                  # React DOM entry point
│   └── index.css                 # Global CSS, Tailwind directives, custom fonts
│
├── server.js                     # Local Express dev server (wraps API handlers)
├── vite.config.ts                # Vite config: port 5000, /api proxy, path aliases
├── tailwind.config.ts            # Tailwind theme: custom colors, fonts, animations
├── tsconfig.json                 # TypeScript config
├── vercel.json                   # Vercel deployment rewrites & function config
└── package.json                  # Scripts and dependencies
```

---

## Environment Variables & Secrets

All secrets are stored as environment variables. **Never commit these to source control.**

### Required Variables

| Variable | Where Used | Description |
|---|---|---|
| `MONGO_URI` | Backend (`api/_lib/mongodb.js`) | MongoDB Atlas connection string |
| `VITE_FIREBASE_API_KEY` | Frontend (`src/lib/firebase.ts`) | Firebase project API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Frontend | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Frontend | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Frontend | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Frontend | Firebase messaging sender |
| `VITE_FIREBASE_APP_ID` | Frontend | Firebase app ID |
| `ADMIN_EMAIL` | Backend (`api/orders/cancel.js`, `api/orders/manage.js`) | Email address with admin privileges |

> **Note:** Frontend variables must be prefixed with `VITE_` to be exposed to the browser by Vite.

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm 9+
- A MongoDB Atlas cluster with connection string
- A Firebase project with Email/Password authentication enabled

### Installation

```bash
# 1. Clone the repository
git clone <repo-url>
cd thunderbolt-brand-world

# 2. Install all dependencies
npm install

# 3. Set up environment variables
#    Add all required variables listed above to your environment

# 4. Start the development servers (runs both Express API + Vite frontend)
npm run dev
```

The app will be available at `http://localhost:5000`.

### Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start both API server and Vite frontend concurrently |
| `npm run dev:client` | Start only the Vite frontend (port 5000) |
| `npm run server` | Start only the Express API server (port 3001) |
| `npm run build` | Production build |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |
| `npm run test` | Run Vitest test suite once |
| `npm run test:watch` | Run Vitest in watch mode |

---

## Frontend Deep Dive

### Pages

#### `Index.tsx` — Homepage
The landing page assembles all cinematic sections: hero animation, brand manifesto, categories grid, traits, hang tag, numbers/stats, pillars, and a brass CTA button. It pulls live category data from the API to populate the categories grid.

#### `ProductView.tsx` — Product Detail
The most feature-rich page. Includes:
- **Embla Carousel** image slider with touch support, desktop navigation arrows, and dot indicators
- **Size selector** (28, 30, 32, 34, 36)
- **Quantity selector** with min/max clamping
- **Real-time stock status display:**
  - No badge shown when stock is not set or above 3 (product is freely available)
  - Pulsing **amber badge: "Only X left"** when stock is 1, 2, or 3
  - **Red badge: "Out of Stock"** when stock is 0; Add to Cart and Order Now buttons are fully disabled
- **Add to Cart / Wishlist** buttons — disabled when out of stock
- **Order Now** CTA — disabled when out of stock or no size selected
- Product specs section (Fit, Material, Shipping info)

#### `CategoryView.tsx` — Category Product Grid
Displays all products belonging to a given category, fetched from the API and filtered client-side by `categoryId`.

#### `Cart.tsx` — Shopping Cart
Shows all items currently in the cart (synced from CartContext, persisted in MongoDB). Allows quantity changes, item removal, and navigates to checkout.

#### `Checkout.tsx` — Checkout Flow
Multi-step checkout: address selection/entry → payment method → order confirmation. On submission, calls `POST /api/orders/create` which validates stock, creates the order, and decrements inventory atomically.

#### `Orders.tsx` — Order History
Lists all orders for the current user. Each order shows status, items, total, and a cancel button (if cancellable — not already cancelled or delivered). Cancellation calls `PUT /api/orders/cancel`, which restores stock for all items in the order.

#### `Admin.tsx` — Admin Dashboard
Protected route — only accessible by the configured `ADMIN_EMAIL`. Three tabs:

- **Orders:** View all orders across all users. Displays order ID, customer email, items (with size and quantity), ship-to address, total, date, and a status dropdown. Admin can change status or delete orders.
- **Products:** Product card grid. Each card shows the image, category name, product name, price, and a **color-coded live stock badge**:
  - Green: more than 3 units in stock
  - Amber: 1–3 units (low stock warning)
  - Red: 0 units (out of stock)
  - Edit and Delete actions on every card.
- **Categories:** Category grid with image, name, and delete button. Add new categories with name + image URL.

#### `Profile.tsx` — User Profile
Shows user info (Firebase account data) and saved delivery addresses. Allows adding, editing, and deleting addresses stored in MongoDB.

#### `Wishlist.tsx` — Saved Items
Displays all products saved to the wishlist. Items can be moved to cart or removed.

#### `About.tsx` — Brand Story
Static brand storytelling page with parallax sections and typography.

#### `NotFound.tsx` — 404
Minimal 404 page with a return-to-home link.

---

### Components

#### `Navbar.tsx`
Sticky top navigation with the Thunderbolt logo, category links, search icon (opens `SearchOverlay`), wishlist icon, cart icon with item count badge, and a Login/avatar button. Collapses gracefully on mobile.

#### `SearchOverlay.tsx`
Full-screen search modal. Fetches all products and filters client-side by name as the user types. Displays matching results with images, names, and prices.

#### `CustomCursor.tsx`
Replaces the default browser cursor with a branded animated circle on desktop. Tracks mouse position and scales on hover over interactive elements.

#### `ScrollProgress.tsx`
A thin brass-colored progress bar at the top of the viewport that fills as the user scrolls down the page.

#### `CategoriesSection.tsx`
Animated grid of category cards fetched from the API. Each card links to its `CategoryView`. Uses Framer Motion stagger animations on scroll.

#### `Footer.tsx`
Site-wide footer with brand links, social links, and legal text.

#### `checkout/ProductSummary.tsx`
Order summary panel used within the checkout flow. Shows product image, name, size, quantity, and price.

#### UI Components (`components/ui/`)
All standard shadcn/ui components: Button, Card, Dialog, Drawer, Input, Select, Tooltip, Toast (Sonner), Badge, etc. These are Radix UI primitives styled with Tailwind.

---

### Context (Global State)

#### `AuthContext.tsx`
Wraps the entire app. Listens to Firebase `onAuthStateChanged` and exposes:
- `user` — the Firebase `User` object (or `null`)
- `signIn(email, password)` — email/password sign-in
- `signUp(email, password)` — new account creation
- `signOut()` — logs out and clears local state
- `loading` — boolean while the auth state is being determined

#### `CartContext.tsx`
Manages the shopping cart. Strategy:
1. On mount, loads cart from `localStorage` immediately for a zero-latency display.
2. If the user is authenticated, syncs with `GET /api/cart` to fetch the server-persisted cart.
3. All mutations (add, remove, update quantity, clear) update both `localStorage` and the API.
4. Exposes: `cartItems`, `addToCart`, `removeFromCart`, `updateQuantity`, `clearCart`, `isInCart`, `getItemQuantity`, `cartCount`, `cartTotal`.

#### `WishlistContext.tsx`
Manages the wishlist with the same hybrid local + API strategy as CartContext.
Exposes: `wishlistItems`, `toggleWishlist`, `isInWishlist`, `wishlistCount`.

---

### Lib Utilities

#### `firebase.ts`
Initializes the Firebase app and exports the `auth` instance using `VITE_FIREBASE_*` environment variables.

#### `products.ts`
Contains the `Product` TypeScript interface and API fetch helpers:
- `fetchProducts()` — fetch all products
- `fetchProductById(id)` — fetch one product by ID
- `fetchProductsByCategory(categoryId)` — client-side filter by category
- `getCategories()` — extract unique category IDs from the products list

#### `requireAuth.ts`
A higher-order function that wraps any action handler. If the user is not logged in, it redirects them to the login page (or opens a sign-in modal) instead of executing the action. Used on Add to Cart and Order Now.

#### `storage.ts`
Thin wrappers around `localStorage.getItem` / `setItem` with JSON parsing/serialization and error handling.

#### `utils.ts`
Exports `cn(...)` — a utility that merges Tailwind class names using `clsx` + `tailwind-merge`.

---

## Backend Deep Dive

### API Routes

All routes are mounted by `server.js` and follow the `/api/` prefix. In production (Vercel), each file in `/api/` becomes a serverless function.

#### Products — `/api/products`

| Method | Auth | Description |
|---|---|---|
| `GET /api/products` | None | Returns all products sorted by `createdAt` descending |
| `POST /api/products` | Admin | Create a new product |
| `PUT /api/products?id=<id>` | Admin | Update an existing product (name, price, images, stock, etc.) |
| `DELETE /api/products?id=<id>` | Admin | Delete a product permanently |

**Product document shape:**
```json
{
  "_id": "ObjectId",
  "name": "Thunderbolt Slim Fit",
  "price": 2499,
  "image": "https://...",
  "images": ["https://...", "https://..."],
  "description": "Premium 98% cotton denim...",
  "categoryId": "ObjectId",
  "stock": 50,
  "createdAt": "ISODate",
  "updatedAt": "ISODate"
}
```

#### Orders — `/api/orders/create`, `/api/orders/cancel`, `/api/orders/manage`, `/api/orders`

| Method & Route | Auth | Description |
|---|---|---|
| `POST /api/orders/create` | User | Place an order. Validates stock, creates order document, decrements product stock |
| `PUT /api/orders/cancel` | User or Admin | Cancel an order (if not delivered). Restores product stock for all items |
| `PATCH /api/orders/manage?id=<id>` | Admin | Update order status |
| `DELETE /api/orders/manage?id=<id>` | Admin | Permanently delete an order |
| `GET /api/orders` | User or Admin | Admin gets all orders; user gets only their own |

#### Cart — `/api/cart`

| Method | Auth | Description |
|---|---|---|
| `GET /api/cart` | User | Fetch the current user's cart |
| `POST /api/cart` | User | Add/update a cart item |
| `DELETE /api/cart` | User | Remove an item or clear the entire cart |

#### Wishlist — `/api/wishlist`

| Method | Auth | Description |
|---|---|---|
| `GET /api/wishlist` | User | Fetch the current user's wishlist |
| `POST /api/wishlist` | User | Add an item to wishlist |
| `DELETE /api/wishlist` | User | Remove an item from wishlist |

#### Categories — `/api/categories`

| Method | Auth | Description |
|---|---|---|
| `GET /api/categories` | None | Returns all categories |
| `POST /api/categories` | Admin | Create a new category |
| `DELETE /api/categories/:id` | Admin | Delete a category |

#### Users — `/api/users`

| Method | Auth | Description |
|---|---|---|
| `POST /api/users` | User | Create or sync a user profile in MongoDB after Firebase registration |

#### Address — `/api/address`

| Method | Auth | Description |
|---|---|---|
| `GET /api/address` | User | Fetch saved delivery addresses |
| `POST /api/address` | User | Add or update a delivery address |
| `DELETE /api/address` | User | Delete a delivery address |

---

### Shared Lib (`api/_lib/`)

#### `mongodb.js`
Manages a singleton MongoDB client connection. The `getDb()` function:
1. Reuses an existing connection if available (important for serverless warm starts)
2. Creates a new `MongoClient` connection using `process.env.MONGO_URI`
3. Returns the database instance

#### `response.js`
Helper functions for consistent JSON responses with proper status codes and CORS headers.

#### `validation.js`
Input validation utilities shared across handlers.

---

## Inventory & Stock Management

This is one of the most critical systems in the platform. Here is how stock flows through the entire lifecycle:

### Stock Field
Every product document in MongoDB has a `stock` field (Number, defaults to 0). The admin sets this manually via the product create/edit forms in the Admin Panel.

### Stock Display — User Side (`ProductView.tsx`)
The product page reads the `stock` field from the API response and shows:

| Stock Value | Display |
|---|---|
| Not set / null | Nothing shown (no badge) |
| > 3 | Nothing shown (product is available, no urgency) |
| 1, 2, or 3 | Pulsing amber badge: **"Only X left"** |
| 0 | Red badge: **"Out of Stock"**; Add to Cart and Order Now buttons are disabled |

### Stock Display — Admin Side (`Admin.tsx` → Products Tab)
Every product card shows a color-coded stock badge next to the price:

| Stock Value | Badge Color | Badge Text |
|---|---|---|
| > 3 | Green | "X in stock" |
| 1–3 | Amber | "X in stock" (low stock warning) |
| 0 | Red | "Out of stock" |

### Stock Decrement — On Order Creation (`api/orders/create.js`)
When a user places an order:
1. Before creating the order document, the API fetches each product from MongoDB.
2. It checks `availableStock >= requestedQuantity` for every item in the order.
3. If any item fails the check, the entire order is **rejected** with a descriptive error message (e.g., `"Only 2 unit(s) of 'Thunderbolt Slim Fit' are available"`, or `"'Thunderbolt Slim Fit' is out of stock"`).
4. If all items pass, the order document is inserted into MongoDB.
5. The API then iterates through each ordered item and performs an atomic `$inc: { stock: -quantity }` update on the corresponding product document.

This approach ensures stock can never go below zero and handles concurrent orders gracefully through MongoDB's atomic update operations.

### Stock Restore — On Order Cancellation (`api/orders/cancel.js`)
When an order is cancelled (by user or admin):
1. The order document's status is updated to `'cancelled'`.
2. The API iterates through every product in the order and performs an atomic `$inc: { stock: +quantity }` update, returning all units to available inventory.
3. Cancellation is blocked if the order is already `'cancelled'` or `'delivered'`.

### Manual Stock Adjustment
The admin can manually override the stock value at any time using the Edit Product modal in the Admin Panel. This is useful for:
- Initial stock setup when adding new products
- Manual inventory reconciliation after audits
- Adjusting for returns not processed through the system

---

## Order Lifecycle

```
User adds items to cart
        ↓
User proceeds to checkout
        ↓
Checkout validates address + payment method
        ↓
POST /api/orders/create
        ↓
API validates stock availability for all items
        ↓ (insufficient stock) → Error returned to user, order not created
        ↓ (stock OK)
Order document created in MongoDB (status: "pending")
        ↓
Product stock atomically decremented for each item
        ↓
User sees order confirmation
        ↓
Admin updates status: pending → confirmed → shipped → delivered
        ↓
     (if user/admin cancels before delivery)
PUT /api/orders/cancel
        ↓
Order status set to "cancelled"
        ↓
Product stock atomically restored for each item
```

### Order Status Flow

| Status | Meaning | Can Be Cancelled? |
|---|---|---|
| `pending` | Order placed, awaiting confirmation | Yes |
| `confirmed` | Admin has confirmed the order | Yes |
| `shipped` | Order dispatched | Yes |
| `delivered` | Order delivered to customer | No |
| `cancelled` | Order cancelled, stock restored | No (already cancelled) |

---

## Admin Panel Guide

Access the admin panel at `/admin`. You must be signed in with the email configured in `ADMIN_EMAIL`.

### Orders Tab
- View all orders from all customers
- See full item breakdown (name, size, quantity, price) per order
- Click **View Address** to see shipping details in a modal
- Use the **status dropdown** to move an order through the pipeline (pending → confirmed → shipped → delivered)
- Click the **trash icon** to permanently delete an order (with a confirmation modal)

### Products Tab
- View all products in a responsive card grid
- Each card displays: image, category name, product name, price, and a **live color-coded stock badge** showing exact stock count
- Click **Edit** to open the product modal pre-filled with current data — update name, category, price, stock, images, description
- Click **Delete** to permanently remove a product (with a browser confirmation)
- Click **Add Product** to open an empty product creation modal
  - Multiple images can be added (first image is the main display image)
  - Each image URL field shows a live preview thumbnail

### Categories Tab
- View all categories with their images
- Click **Add Category** to create a new one (name + image URL)
- Click **Delete** to remove a category

---

## Authentication Flow

1. User clicks **Login** in the Navbar.
2. Firebase Email/Password authentication handles sign-in/sign-up.
3. On success, Firebase sets a session and `AuthContext` updates `user` with the Firebase User object.
4. On first sign-up, a `POST /api/users` call syncs the user profile to MongoDB.
5. For protected API calls (cart, orders, wishlist, etc.), the frontend calls `user.getIdToken()` to get a fresh Firebase ID token and sends it as `Authorization: Bearer <token>`.
6. Backend handlers decode the token using `jwt.decode()` to extract the user's email, which is used as the `userId` in MongoDB documents.
7. Admin authorization compares the decoded email against the `ADMIN_EMAIL` environment variable.

---

## Cart & Wishlist System

Both systems use a **hybrid persistence** strategy:

### LocalStorage (Instant)
- Cart/wishlist items are immediately stored in `localStorage` on every mutation.
- On page load, the local data is shown instantly — no loading spinner needed for the user.

### MongoDB (Cross-Device Persistence)
- When the user is authenticated, their cart/wishlist is also stored per-user in MongoDB.
- On initial load, if the user is logged in, the MongoDB version is fetched and used as the source of truth.
- Mutations are sent to the API in the background.

### Unauthenticated Users
- Cart and wishlist work fully in localStorage for guest users.
- Prompts to sign in appear when attempting protected actions (placing an order).

---

## Database Schema

### `products` Collection
```json
{
  "_id": "ObjectId",
  "name": "string (required)",
  "price": "number (required)",
  "image": "string (first image, backward-compat)",
  "images": ["string"],
  "description": "string",
  "categoryId": "ObjectId string (required)",
  "stock": "number (default: 0)",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### `orders` Collection
```json
{
  "_id": "ObjectId",
  "userId": "string (user email)",
  "products": [
    {
      "productId": "string",
      "name": "string",
      "price": "number",
      "image": "string",
      "size": "string",
      "quantity": "number"
    }
  ],
  "address": {
    "fullName": "string",
    "phone": "string",
    "addressLine1": "string",
    "city": "string",
    "pincode": "string"
  },
  "paymentMethod": "string",
  "status": "pending | confirmed | shipped | delivered | cancelled",
  "totalAmount": "number",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### `categories` Collection
```json
{
  "_id": "ObjectId",
  "name": "string",
  "image": "string",
  "createdAt": "Date"
}
```

### `cart` Collection
```json
{
  "_id": "ObjectId",
  "userId": "string (user email)",
  "items": [
    {
      "productId": "string",
      "name": "string",
      "price": "number",
      "image": "string",
      "size": "string",
      "quantity": "number"
    }
  ],
  "updatedAt": "Date"
}
```

### `wishlist` Collection
```json
{
  "_id": "ObjectId",
  "userId": "string (user email)",
  "items": [
    {
      "productId": "string",
      "name": "string",
      "price": "number",
      "image": "string"
    }
  ],
  "updatedAt": "Date"
}
```

### `addresses` Collection
```json
{
  "_id": "ObjectId",
  "userId": "string (user email)",
  "fullName": "string",
  "phone": "string",
  "addressLine1": "string",
  "city": "string",
  "pincode": "string",
  "isDefault": "boolean"
}
```

### `users` Collection
```json
{
  "_id": "ObjectId",
  "email": "string",
  "displayName": "string",
  "createdAt": "Date",
  "lastLoginAt": "Date"
}
```

---

## Deployment

### Vercel (Recommended)
This project is configured for **Vercel** deployment via `vercel.json`.

- URL rewrites route all `/api/*` requests to the corresponding serverless function in the `/api/` directory.
- All other requests serve the React SPA (`dist/index.html`).
- Set all environment variables in **Vercel Project Settings → Environment Variables**.
- Build command: `npm run build`
- Output directory: `dist`

### Replit
The project is fully compatible with Replit hosting:
- The `Start application` workflow runs `npm run dev`, starting both servers.
- For production on Replit, use Replit Deployments which builds and serves the production bundle.
- Port 5000 is exposed externally; the Vite proxy handles API routing internally.

---

## Known Behaviors & Decisions

### Firebase Token Decoding (Not Verification)
The backend uses `jwt.decode()` (not `jwt.verify()`) to read Firebase ID tokens. This works because Firebase has already issued and signed the token. For stricter security, consider verifying against Firebase's public keys using the Firebase Admin SDK.

### Stock is a Single Total — Not Per-Size
The current stock model stores a single total `stock` count per product, not broken down by size. All sizes share the same inventory pool. A future enhancement could add per-size stock tracking.

### Admin Email Fallback
The admin email in `cancel.js` falls back to a hardcoded string if `ADMIN_EMAIL` is not set. Always configure this environment variable in production.

### Cart Merge on Sign-In
When a guest user signs in, the server cart takes precedence over the guest localStorage cart. Guest-session items are not automatically merged. This is a known limitation.

### Price Display Currency
Prices are stored as plain numbers in MongoDB. The UI displays a `¥` prefix. Update the currency symbol in price display components if targeting a different market.

### Images Field and Backward Compatibility
Products store both an `images` array (multi-image support) and a single `image` string (the first image, for backward compatibility with older cart/wishlist records that only stored one image URL).
