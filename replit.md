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

## Deployment
- Build: `npm run build` (Vite output to `dist/`)
- The `.replit` deployment config targets autoscale with `node ./dist/index.cjs`
