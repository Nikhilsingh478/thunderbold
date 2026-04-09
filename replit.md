# Thunderbolt — Replit Project

## Overview
A full-stack e-commerce storefront called **Thunderbolt** (denim/apparel). Built with React + Vite on the frontend and a Node.js/Express API backend. Uses Firebase for authentication and MongoDB for product/order/user data.

## Architecture

- **Frontend**: React 18, Vite (port 5000), Tailwind CSS, shadcn/ui, React Router v6, TanStack Query, Framer Motion
- **Backend**: Node.js/Express server (`server.js`) running on port 3001, proxied through Vite `/api` prefix
- **Auth**: Firebase Authentication (email/password)
- **Database**: MongoDB Atlas (products, orders, users)
- **API handlers**: Located in `/api/` directory (products, orders, users)

## Key Files
- `src/App.tsx` — Root component with providers (Auth, Cart, Wishlist, QueryClient)
- `src/AppContent.tsx` — Router, modal management, delayed login prompt
- `src/context/` — AuthContext, CartContext, WishlistContext
- `src/pages/` — Index, About, CategoryView, ProductView, Cart, Wishlist, Checkout, Orders, Admin, Profile, NotFound
- `src/components/` — UI components (shadcn/ui base + custom: Navbar, Footer, HeroSection, etc.)
- `server.js` — Express API server, routes to `/api/` handlers
- `api/` — Serverless-style route handlers for products, orders, users (create, profile, addresses)
- `vite.config.ts` — Vite config (port 5000, proxy to backend on 3001)

## Running the App
The app is started with `npm run dev` which concurrently runs:
- `node server.js` (Express API on port 3001)
- `vite` (frontend dev server on port 5000)

## Environment Variables Required
Set these as Replit secrets:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `MONGO_URI` — MongoDB Atlas connection string

## Size-Based Stock System
Products use a `sizeStock` map (`Record<string, number>`) with keys `['28','30','32','34','36']`. The flat `stock` field is kept as the computed total (sum of all sizeStock values).

- **Admin (`src/pages/Admin.tsx`)**: `SizeStockInput` component allows setting per-size stock for each product. Product cards show per-size breakdown grid. `SIZES` constant is the single source of truth.
- **Store (`src/pages/ProductView.tsx`)**: Size buttons are disabled + strikethrough + "OOS" label when `sizeStock[size] === 0`. Action buttons use `effectiveOutOfStock` (total OOS OR selected size OOS).
- **Backend (`api/products/index.js`)**: POST/PUT accept `sizeStock`, compute total `stock` with `normaliseSizeStock` + `computeTotalStock` helpers. GET projects `sizeStock`.
- **Orders (`api/orders/create.js`)**: Pre-flight stock check uses `sizeStock[size]` when available. Atomic decrement/rollback is size-aware.
- **Cancel (`api/orders/cancel.js`)**: Stock restore fetches product to check sizeStock presence before restoring per-size + total.
- **Backward compat**: Products without `sizeStock` fall back to flat `stock` throughout.

## Deployment
- Build: `npm run build` (Vite output to `dist/`)
- The `.replit` deployment config targets autoscale with `node ./dist/index.cjs`
