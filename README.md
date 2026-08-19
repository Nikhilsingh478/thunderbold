# Thunderbold — Production-Grade Premium Fashion E-Commerce PWA & Native Android App

A full-stack, installable Progressive Web App (PWA) and native Capacitor Android application for a curated Indian streetwear brand. React 18 + Vite frontend, Express/MongoDB backend, Firebase Auth, Firebase Cloud Messaging (FCM), Capacitor 8 native bridge, and a Workbox service worker.

> **Brand:** Thunderbold · **Market:** India · **Domain:** thunderbold.shop · **Android App ID:** shop.thunderbold.app · **Payment:** Cash on Delivery only

---

## Table of Contents

1. [Tech Stack](#1-tech-stack)
2. [Architecture Overview](#2-architecture-overview)
3. [Environment Setup](#3-environment-setup)
4. [Running & Building the App](#4-running--building-the-app)
5. [Capacitor Native Android App](#5-capacitor-native-android-app)
6. [Project Structure](#6-project-structure)
7. [Frontend Architecture](#7-frontend-architecture)
8. [Backend Architecture](#8-backend-architecture)
9. [Authentication System](#9-authentication-system)
10. [API Reference](#10-api-reference)
11. [Order Management System](#11-order-management-system)
12. [Gift Card & Gifting System](#12-gift-card--gifting-system)
13. [Returns System](#13-returns-system)
14. [Cart & Wishlist](#14-cart--wishlist)
15. [Review System](#15-review-system)
16. [Admin Panel & Analytics](#16-admin-panel--analytics)
17. [Push Notifications (Native & Web FCM)](#17-push-notifications-native--web-fcm)
18. [Performance Architecture & Caching](#18-performance-architecture--caching)
19. [Security Model & Audit Fixes](#19-security-model--audit-fixes)
20. [PWA Architecture & Self-Hosting](#20-pwa-architecture--self-hosting)
21. [App Update Lifecycle](#21-app-update-lifecycle)
22. [Database Schema & Indexing](#22-database-schema--indexing)
23. [Pricing System](#23-pricing-system)
24. [Troubleshooting & FAQ](#24-troubleshooting--faq)

---

## 1. Tech Stack

| Layer | Technology | Version (package.json) |
|---|---|---|
| Frontend | React, TypeScript, Vite, Tailwind CSS | react ^18.3.1, typescript ^5.9.3, vite ^5.4.21, tailwindcss ^3.4.19 |
| Native Runtime | Capacitor Android Runtime & CLI | @capacitor/core ^8.5.0, @capacitor/android ^8.5.0, @capacitor/cli ^8.5.0 |
| Native Plugins | Push, Haptics, App, StatusBar, Splash, Auth | @capacitor/push-notifications ^8.1.2, @capacitor/haptics ^8.0.2, @capacitor/app ^8.1.1, @capacitor/status-bar ^8.0.3, @capacitor/splash-screen ^8.0.2, @capacitor-firebase/authentication 6.3.1 |
| Routing | React Router DOM | react-router-dom 6.30.4 |
| Server State | TanStack Query | @tanstack/react-query 5.101.0 |
| Animations | Framer Motion, GSAP | framer-motion 12.40.0, gsap 3.15.0 |
| Charts | Recharts | recharts 2.15.4 |
| Carousel | Embla Carousel | embla-carousel-react 8.6.0 |
| Icons | Lucide React | lucide-react 0.462.0 |
| Toasts | Sonner | sonner 1.7.4 |
| UI Primitives | Radix UI + shadcn/ui patterns | @radix-ui/* packages |
| Forms & Validation | React Hook Form + Zod | react-hook-form 7.79.0, zod 3.25.76 |
| Authentication | Firebase Auth (Google OAuth + Email/Password + Native) | firebase 10.14.1, @capacitor-firebase/authentication 6.3.1 |
| Push Notifications | Firebase Cloud Messaging (FCM) | firebase 10.14.1, firebase-admin 13.10.0 |
| Database | MongoDB Atlas (Native Node.js Driver) | mongodb 6.21.0 |
| Backend — dev | Node.js + Express 5 (`server.js`, port 3001) | express 5.2.1 |
| Backend — prod | Vercel Serverless Functions (`api/*.js`) | @vercel/node ^5.7.5 |
| Media CDN | Cloudinary (f_auto, q_auto, width resizing) | — |
| PWA | vite-plugin-pwa + Workbox `generateSW` | vite-plugin-pwa ^1.3.0, workbox-* 7.4.1 |

---

## 2. Architecture Overview

Thunderbold operates seamlessly across Web browsers, PWAs, and Native Android devices using a unified backend API.

```
┌──────────────────────────────────────────────────────────────────┐
│                         Clients                                  │
│                                                                  │
│  ┌───────────────────────────┐      ┌─────────────────────────┐  │
│  │   Web / PWA Browser       │      │   Capacitor Android     │  │
│  │   React 18 SPA            │      │   Native WebView        │  │
│  │   firebaseMessaging.ts    │      │   nativePushNotifications│  │
│  └─────────────┬─────────────┘      └────────────┬────────────┘  │
└────────────────│─────────────────────────────────│───────────────┘
                 │ relative /api/*                 │ apiUrl() → https://www.thunderbold.shop
┌────────────────▼─────────────────────────────────▼───────────────┐
│                    Thunderbold API Layer                         │
│   Serverless (Vercel) / Express 5 (Local Server.js :3001)        │
│   ├── verifyFirebaseToken() authentication                        │
│   ├── MongoDB Atlas singleton pool (thunderbold DB)              │
│   ├── FCM Admin SDK (sendToUser & sendMulticast)                 │
│   └── Shared api/_lib/ utilities & CORS handlers                 │
└──────────────────────────────────────────────────────────────────┘
```

---

## 3. Environment Setup

Copy `.env.example` to `.env` for local execution.

| Variable | Used By | Required | Description |
|---|---|---|---|
| `MONGO_URI` | `api/_lib/mongodb.js` | **Yes** | MongoDB Atlas connection string |
| `FIREBASE_SERVICE_ACCOUNT` | `api/_lib/firebaseAdmin.js` | **Yes** | Stringified Firebase service account JSON |
| `VITE_FIREBASE_VAPID_KEY` | `src/lib/firebaseMessaging.ts` | **Yes** | FCM Web Push VAPID public key |
| `VITE_FIREBASE_API_KEY` | `src/lib/firebase.ts` | **Yes** | Firebase client API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | `src/lib/firebase.ts` | **Yes** | Firebase Auth domain |
| `VITE_FIREBASE_PROJECT_ID` | `src/lib/firebase.ts` | **Yes** | Firebase Project ID (`thunderbolt-auth`) |
| `VITE_FIREBASE_STORAGE_BUCKET` | `src/lib/firebase.ts` | **Yes** | Firebase Storage Bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `src/lib/firebase.ts` | **Yes** | Firebase Messaging Sender ID |
| `VITE_FIREBASE_APP_ID` | `src/lib/firebase.ts` | **Yes** | Firebase App ID |

---

## 4. Running & Building the App

```bash
# Development
npm run dev        # Starts server.js (3001) + Vite dev client (5000) concurrently
npm run dev:client # Starts Vite dev server only
npm run server     # Starts Express backend only (port 3001)

# Web & Production Build
npm run build      # Vite production build -> dist/
npm run preview    # Preview production bundle locally

# Capacitor Android Commands
npm run cap:sync   # Builds web bundle & syncs to android/ project
npm run cap:open   # Opens android/ directory in Android Studio
npm run cap:build  # Builds web, syncs Android, and compiles Android APK
```

---

## 5. Capacitor Native Android App

Thunderbold is fully packaged as a native Android application using Capacitor 8 (`appId: shop.thunderbold.app`).

### Key Native Integrations
- **API Routing (`src/lib/apiBase.ts`):** On native Android, the WebView runs at `https://localhost`. `apiUrl('/api/path')` dynamically prepends `https://www.thunderbold.shop` for native requests so API calls hit production correctly.
- **Native Push Notifications (`src/lib/nativePushNotifications.ts`):** Native FCM registration with `@capacitor/push-notifications`, background intent filters, and haptic feedback via `@capacitor/haptics`.
- **Native Google Sign-In (`@capacitor-firebase/authentication`):** Seamless native Google Credential Manager login bypassing web popup blocks.
- **Native Splash & Status Bar:** Configured via `capacitor.config.ts` with custom splash hide timing in `App.tsx` post-mount to prevent blank screen flashes.

---

## 6. Project Structure

```
thunderbold/
├── android/                          # Native Android Studio project (Capacitor)
│   ├── app/src/main/AndroidManifest.xml
│   ├── app/src/main/res/drawable/ic_stat_notification.xml # White monochrome status bar icon
│   └── app/build.gradle
├── api/                              # Backend Serverless & Dev Handlers
│   ├── _lib/
│   │   ├── mongodb.js                # Singleton connection & 20 index bootstrap
│   │   ├── firebaseAdmin.js          # verifyFirebaseToken() + getAdminMessaging()
│   │   ├── fcm.js                    # sendToUser() & sendMulticast() FCM engines
│   │   ├── cors.js                   # Strict CORS headers helper
│   │   ├── rateLimit.js              # IP rate limiter
│   │   └── validator.js              # Order, address, phone & pincode validators
│   ├── admin.js, cart/index.js, orders/index.js, products/index.js, ...
├── src/
│   ├── components/                   # UI components, AppUpdatePrompt, GiftCardPicker, etc.
│   ├── context/                      # AuthContext, CartContext, WishlistContext, NotificationsContext
│   ├── lib/
│   │   ├── apiBase.ts                # Native vs Web API URL resolver
│   │   ├── nativePushNotifications.ts# Native FCM & Haptics bridge
│   │   ├── queryClient.ts            # Shared TanStack query client
│   │   ├── cloudinary.ts             # Cloudinary image URL optimizer
│   │   └── printInvoice.ts           # XSS-escaped invoice generator
│   ├── pages/                        # App route views
│   ├── index.css                     # Global styles & self-hosted @font-face rules
├── public/
│   ├── fonts/                        # Self-hosted Bebas Neue, Barlow Condensed, Inter, Barlow
│   ├── gift-cards/                   # Gift card selection assets (1-5)
│   ├── loader_assets/
│   └── app-version.json              # App update version manifest
├── capacitor.config.ts               # Capacitor app configuration
├── vercel.json                       # Vercel rewrites, CSP & security headers
├── server.js                         # Local Express dev server
```

---

## 7. Frontend Architecture

### Provider Tree
```tsx
<AuthProvider>
  <NotificationsProvider>
    <CartProvider>
      <WishlistProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <AppContent />
          </TooltipProvider>
        </QueryClientProvider>
      </WishlistProvider>
    </CartProvider>
  </NotificationsProvider>
</AuthProvider>
```

### State Management & Caching
- **Server State:** Managed via **TanStack Query** (`@tanstack/react-query`). Orders use `staleTime: 30000`, user profile uses `staleTime: 60000`. Caches automatically invalidate on order placement, cancellation, or return request.
- **Client State:** Cart and Wishlist use React Context backed by `localStorage` (guest) and synced with MongoDB (authenticated).

---

## 8. Backend Architecture

- **Development (`server.js`):** Express 5 running on port 3001. Proxied by Vite on port 5000.
- **Production (Vercel):** 12 consolidated serverless functions in `api/`.
- **Database Connection:** Single MongoDB pool with `minPoolSize: 2`, `maxPoolSize: 10`, and cached `global.mongo` client for warm-start reuse.

---

## 9. Authentication System

- **Methods:** Native Google Sign-In (Capacitor), Web Google OAuth popup/redirect, Email & Password.
- **Token Verification:** Server endpoints cryptographically verify Firebase ID tokens using `verifyFirebaseToken()` from `firebase-admin`.
- **Admin Verification:** Endpoint `/api/users/me/admin-status` and server helper `isAdmin()` check MongoDB `role: "admin"` and secure allowlist.

---

## 10. API Reference

All protected endpoints require `Authorization: Bearer <firebase-id-token>`.

- `GET /api/products` — Product catalogue (`?section=`, `?maxPrice=`)
- `POST /api/orders/create` — Create order (server-side price validation, atomic stock decrement)
- `GET /api/orders` — User/Admin order history
- `PUT /api/orders/cancel` — Cancel pending order & restore stock
- `PATCH /api/orders/manage?id=:id` — Admin order status update
- `POST /api/returns` — Submit return request (requires delivered order & UPI ID)
- `POST /api/users/fcm-token` — Register FCM token & deviceId
- `GET /api/users/me/admin-status` — Fetch authenticated user admin status

---

## 11. Order Management System

### Order Lifecycle
```
pending → confirmed → packed → shipped → delivered
   │
   └──► cancelled (restores stock)

delivered → return_requested → return_approved → refund_issued
                         └─► return_rejected
```

- **Stock Integrity:** Atomic stock decrement using `$gte` guards. Outfit products atomically decrement topwear and bottomwear stock simultaneously.

---

## 12. Gift Card & Gifting System

Customers can turn any order into a gift during checkout:
- **Gift Card Selection:** Pick from 5 custom gift cards (`public/gift-cards/`).
- **Delivery Date:** Select preferred gift delivery date.
- **Schema Fields:** Orders store `giftCardId` (1-5) and `giftDeliveryDate`.
- **Admin View:** Dedicated gift indicators and card thumbnails in Admin order management.

---

## 13. Returns System

- Gated to `delivered` orders.
- One return per order. Requires valid UPI ID (`localpart@provider`) for COD refund processing.
- Admin approval automatically calculates refund amounts and restores item stock.

---

## 14. Review System

- Delivery-Gated: Users can only review products from `delivered` orders.
- One active review per product per user. Soft-deleted via `isDeleted: true`.

---

## 15. Admin Panel & Analytics

Located at `/admin` (admin role required).
- Real-time analytics charts (Recharts) covering Revenue, Profit, Top Selling Items, Low Stock Alerts.
- Order Management, Return Processing, Product Catalogue Editor, Category & Brand Manager, FCM Broadcast Tool.

---

## 16. Push Notifications (Native & Web FCM)

Thunderbold uses a dual Web & Native FCM push architecture:

1. **Native FCM:** Handled by Capacitor `PushNotifications` plugin + `FirebaseMessagingService` background service.
2. **Web FCM:** Handled by `firebaseMessaging.ts` and Workbox service worker.
3. **Payload Specs:** `priority: 'high'`, `ttl: 86400000` (24h offline delivery), channel `thunderbold_orders`.
4. **Notification Icon:** White monochrome vector lightning bolt (`@drawable/ic_stat_notification.xml`) on status bar.
5. **Vibration:** Haptic vibration on foreground receive; Android channel vibration pattern `[0, 250, 150, 250]` for background/killed state.

---

## 17. Performance Architecture & Caching

- **Font Self-Hosting:** Fonts (`Bebas Neue`, `Barlow Condensed`, `Inter`, `Barlow`) hosted locally in `public/fonts/` with `@font-face` rules in `src/index.css`. Eliminates CORS and render blocking.
- **TanStack Query Caching:** Stale-while-revalidate strategy for orders and profile.
- **Cloudinary Optimization:** `f_auto`, `q_auto`, responsive widths (200, 500, 1000, 1200), `aspect-ratio` containers to prevent CLS.
- **Workbox SW Caching:** Asset precaching with Workbox `generateSW`.

---

## 18. Security Model & Audit Fixes

- **XSS Prevention:** HTML escaping (`esc()`) on user input in printable invoices (`printInvoice.ts`).
- **Server Price Integrity:** Order creation validates product prices against database values; client-submitted totals cannot be manipulated.
- **Token Verification:** Cryptographic token verification via `verifyFirebaseToken()`.
- **Admin Isolation:** `ADMIN_EMAILS` removed from frontend bundle; verified via `/api/users/me/admin-status`.
- **CORS & CSP:** Strict allowed origin checks via `api/_lib/cors.js` and Content Security Policy headers in `vercel.json`.
- **PII Storage:** Address form data stored in `sessionStorage` instead of `localStorage`.

---

## 19. PWA Architecture & Self-Hosting

- Installable manifest (`manifest.webmanifest`) with shortcuts, screenshots, and theme `#080808`.
- Auto-updating service worker (`sw.js`) with version polling via `public/version.json`.

---

## 20. App Update Lifecycle

The `AppUpdatePrompt` component detects new app builds:
- Capacitor Native: Retrieves build version via `@capacitor/app` (`App.getInfo()`).
- TWA / Web: Parses `app_version` query parameters.
- Compares against `public/app-version.json` and prompts user to update when outdated.

---

## 21. Database Schema & Indexing

MongoDB Atlas database `thunderbold` has 10 active collections and **20 bootstrapped indexes** (`api/_lib/mongodb.js`):

### Complete Index List
1. `orders`: `{ userId: 1 }`
2. `orders`: `{ createdAt: -1 }`
3. `orders`: `{ clientOrderId: 1 }` (sparse, unique)
4. `orders`: `{ orderNumber: 1 }` (background: true, sparse: true)
5. `orders`: `{ status: 1 }` (background: true)
6. `orders`: `{ userId: 1, createdAt: -1 }` (background: true)
7. `products`: `{ categoryId: 1 }`
8. `products`: `{ section: 1, createdAt: -1 }` (background: true)
9. `products`: `{ stock: 1 }` (background: true)
10. `cart`: `{ userId: 1 }` (unique)
11. `wishlist`: `{ userId: 1 }` (unique)
12. `reviews`: `{ productId: 1, isDeleted: 1, createdAt: -1 }`
13. `reviews`: `{ userId: 1, isDeleted: 1 }`
14. `reviews`: `{ userId: 1, productId: 1 }`
15. `users`: `{ uid: 1 }` (background: true)
16. `users`: `{ email: 1 }` (background: true)
17. `returns`: `{ orderId: 1 }` (background: true)
18. `returns`: `{ userId: 1 }` (background: true)
19. `returns`: `{ status: 1, createdAt: -1 }` (background: true)
20. `brands`: `{ name: 1 }` (background: true)

---

## 22. Pricing System

- `price`: Selling price
- `mrp`: Original crossed-out price
- `purchasePrice`: Admin-only internal cost for profit calculations

---

## 23. Troubleshooting & FAQ

### Push Notifications Not Arriving?
- Ensure `google-services.json` is present in `android/app/`.
- Verify `VITE_FIREBASE_VAPID_KEY` is set for Web FCM.
- Test native push via `/api/notifications/test-send`.

### Native Build Failures?
- Run `npm run cap:sync` to ensure dist/ assets and native plugin configurations are in sync.

---

## Copyright

Copyright © 2026 Thunderbold Private Limited. All rights reserved.

> Last updated: August 20, 2026
