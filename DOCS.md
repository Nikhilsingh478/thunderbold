# Thunderbold — Master Technical Documentation

> Production-grade e-commerce PWA & Capacitor Native Android App for curated Indian streetwear & fashion.
> Stack: React 18 + Vite · Capacitor 8 · Express 5 · MongoDB Atlas · Firebase Auth · Cloudinary · Workbox PWA

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Repository Structure](#2-repository-structure)
3. [Environment & Secrets](#3-environment--secrets)
4. [Capacitor Native Android App](#4-capacitor-native-android-app)
5. [Frontend Architecture](#5-frontend-architecture)
6. [Backend Architecture](#6-backend-architecture)
7. [Authentication System](#7-authentication-system)
8. [Data Layer — API Reference](#8-data-layer--api-reference)
9. [Order Management System](#9-order-management-system)
10. [Gift Card & Gifting Functionality](#10-gift-card--gifting-functionality)
11. [Returns System](#11-returns-system)
12. [Cart & Wishlist](#12-cart--wishlist)
13. [Review System](#13-review-system)
14. [Admin Panel & Analytics](#14-admin-panel--analytics)
15. [Push Notifications (Native & Web FCM)](#15-push-notifications-native--web-fcm)
16. [Performance Architecture & TanStack Query](#16-performance-architecture--tanstack-query)
17. [Security Model & Audit Fixes](#17-security-model--audit-fixes)
18. [PWA Architecture & Font Self-Hosting](#18-pwa-architecture--font-self-hosting)
19. [App Update Lifecycle](#19-app-update-lifecycle)
20. [Deployment](#20-deployment)
21. [Future Roadmap](#21-future-roadmap)

---

## 1. Project Overview

**Thunderbold** is a mobile-first Progressive Web App and native Android application (`shop.thunderbold.app`) for a curated Indian fashion brand selling denim, shirts, t-shirts, kurtas, and outfits.

### Key Attributes
- **Brand:** Thunderbold
- **Domain:** thunderbold.shop
- **App ID:** shop.thunderbold.app
- **Target Market:** India (INR pricing, 6-digit pincodes, 10-digit phones)
- **Payment Model:** Cash on Delivery (COD) only
- **Product Sections:** denim · shirts · t-shirts · kurta · outfits · live-sale

---

## 2. Repository Structure

```
thunderbold/
├── android/                          # Native Android Studio project (Capacitor 8)
│   ├── app/src/main/AndroidManifest.xml
│   ├── app/src/main/res/drawable/ic_stat_notification.xml # White monochrome vector icon
│   └── app/build.gradle
├── api/                              # 12 Vercel serverless handlers
│   ├── _lib/                         # mongodb, firebaseAdmin, fcm, adminHelper, cors, rateLimit, response, validator
│   ├── admin.js, cart/index.js, orders/index.js, products/index.js, ...
├── src/
│   ├── App.tsx                       # Provider tree (Auth → Notifications → Cart → Wishlist → TanStack Query)
│   ├── AppContent.tsx                # BrowserRouter + routes + Suspense
│   ├── main.tsx                      # Entry point + PWA registration
│   ├── context/                      # AuthContext, CartContext, WishlistContext, NotificationsContext
│   ├── pages/                        # Route pages
│   ├── components/                   # UI components, AppUpdatePrompt, GiftCardPicker, etc.
│   └── lib/                          # apiBase.ts, nativePushNotifications.ts, queryClient.ts, cloudinary.ts, ...
├── public/
│   ├── fonts/                        # Self-hosted fonts (Bebas Neue, Barlow Condensed, Inter, Barlow)
│   ├── gift-cards/                   # Gift card assets (1-5)
│   └── app-version.json              # Version manifest
├── capacitor.config.ts               # Capacitor app configuration
├── vercel.json                       # Vercel rewrites & security headers
├── server.js                         # Dev Express server
```

---

## 3. Environment & Secrets

| Variable | Used By | Required | Description |
|---|---|---|---|
| `MONGO_URI` | `api/_lib/mongodb.js` | **Yes** | MongoDB Atlas connection string |
| `FIREBASE_SERVICE_ACCOUNT` | `api/_lib/firebaseAdmin.js` | **Yes** | Stringified service account JSON |
| `VITE_FIREBASE_VAPID_KEY` | `src/lib/firebaseMessaging.ts` | **Yes** | FCM Web Push VAPID key |
| `VITE_FIREBASE_API_KEY` | `src/lib/firebase.ts` | **Yes** | Firebase API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | `src/lib/firebase.ts` | **Yes** | Firebase Auth domain |
| `VITE_FIREBASE_PROJECT_ID` | `src/lib/firebase.ts` | **Yes** | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | `src/lib/firebase.ts` | **Yes** | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `src/lib/firebase.ts` | **Yes** | Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID` | `src/lib/firebase.ts` | **Yes** | Firebase app ID |

---

## 4. Capacitor Native Android App

Thunderbold includes a native Android application package powered by Capacitor 8.

### Key Configurations
- **App ID:** `shop.thunderbold.app`
- **Config File:** `capacitor.config.ts`
  - `CapacitorHttp`: Enabled (bypasses Android WebView cross-origin header stripping)
  - `SplashScreen`: Configured with `#080808` background matching theme
  - `StatusBar`: Dark style with `#080808` overlay
- **API Base Resolver (`src/lib/apiBase.ts`):** On native Android (`https://localhost`), `apiUrl('/api/*')` redirects request target URLs to `https://www.thunderbold.shop/api/*`.
- **Native Google Auth (`@capacitor-firebase/authentication`):** Provides native Android Credential Manager Google Sign-In.

---

## 5. Frontend Architecture

### 5.1 Provider Tree
```
AuthProvider
  NotificationsProvider
    CartProvider
      WishlistProvider
        QueryClientProvider (TanStack Query, shared queryClient)
          TooltipProvider
            AppContent
```

### 5.2 Routing & Lazy Loading
- Eager Pages: `Index`, `About`, `CategoryView`, `BrandsPage`, `BrandView`, `NotFound`
- Lazy Pages: `ProductView`, `Cart`, `Checkout`, `Orders`, `Wishlist`, `Profile`, `Admin`, `DealsPage`, `Policies`

---

## 6. Backend Architecture

- **Handlers:** 12 consolidated serverless function files in `api/` complying with Vercel Hobby limits.
- **MongoDB Pool:** Cached client singleton with `maxPoolSize: 10` and `minPoolSize: 2`.
- **Database Indexes:** 20 indexes across 7 active collections automatically bootstrapped in `ensureIndexes()`.

---

## 7. Authentication System

- **Verification:** Endpoint calls utilize `verifyFirebaseToken()` for cryptographic signature and revocation checks.
- **Admin Verification:** Endpoint `/api/users/me/admin-status` provides secure admin role checks against MongoDB and allowlist without exposing emails in the web bundle.

---

## 8. Data Layer — API Reference

All protected routes expect `Authorization: Bearer <firebase-id-token>`.

- `GET /api/products` — Full catalogue (`?section=`, `?maxPrice=`)
- `POST /api/orders/create` — Validates pricing server-side, decrements stock atomically
- `PUT /api/orders/cancel` — Cancels order & restores stock
- `PATCH /api/orders/manage?id=:id` — Admin order status update
- `POST /api/returns` — Submits return request (delivered orders only)
- `POST /api/users/fcm-token` — Registers native or web FCM token
- `GET /api/users/me/admin-status` — Verifies current user's admin privilege

---

## 9. Order Management System

### Order Status Flow
```
pending ──► confirmed ──► packed ──► shipped ──► delivered
   │
   └──► cancelled (stock restored)

delivered ──► return_requested ──► return_approved ──► refund_issued
                            └─► return_rejected
```

---

## 10. Gift Card & Gifting Functionality

- **Gifting Toggle:** Option during checkout to send order as a gift.
- **Gift Card Picker:** Select from 5 custom gift cards (`public/gift-cards/`).
- **Delivery Date:** Select target delivery date.
- **Data Persistence:** Stored as `giftCardId` and `giftDeliveryDate` on the order document.
- **Admin View:** Displays gift badge, selected card thumbnail, message, and delivery date.

---

## 11. Returns System

- Gated to `delivered` orders. One return per order.
- Requires valid UPI ID for COD refund processing.
- Approving return restores product stock and updates order refund details.

---

## 12. Cart & Wishlist

- Guest items stored in `localStorage`.
- Synchronized to MongoDB upon authentication.
- Atomic POST replaces entire `items[]` array.

---

## 13. Review System

- Gated to delivered orders containing the target `productId`.
- Soft deleted via `isDeleted: true`.

---

## 14. Admin Panel & Analytics

Located at `/admin`.
- Dashboards built with Recharts for Revenue, Profit, Order Velocity, Low Stock.
- Full controls for Orders, Returns, Products, Categories, Brands, Reviews, Slider, Notifications.

---

## 15. Push Notifications (Native & Web FCM)

### Architecture
```
Browser / PWA                       Native Android App
 └─► Web FCM                         └─► Native FCM (Capacitor)
      └─► firebaseMessaging.ts            └─► nativePushNotifications.ts
           └─► Workbox SW                      └─► FirebaseMessagingService
                 │                                   │
                 └───────────────┬───────────────────┘
                                 │
                   POST /api/users/fcm-token
                                 │
                         MongoDB users collection
                                 │
                      api/_lib/fcm.js Engine
```

### Token Registration & Execution
1. Native app attaches listeners before calling `PushNotifications.register()`.
2. Token stored in `localStorage` (`thunderbold_native_fcm_token`).
3. `NotificationsContext` posts token via `CapacitorHttp` to bypass WebView header stripping.
4. Token deduplicated in `users.fcmTokens` array by `deviceId`.
5. Background/killed notifications processed by Google Play Services even if app is closed for months.
6. Payload Specs: `priority: 'high'`, `ttl: 86400000` (24h), channel `thunderbold_orders`, status bar icon `@drawable/ic_stat_notification.xml` (white monochrome lightning bolt).

---

## 16. Performance Architecture & TanStack Query

### TanStack Query Integration
- Replaced custom `useEffect` fetch loops with TanStack Query.
- `orders` query uses `staleTime: 30000`, `profile` query uses `staleTime: 60000`.
- Cache prefetching aligned with `ordersCache.ts`.
- `placeholderData` prevents UI pagination flickers.

### Cloudinary Optimization
- Client-side URL transformations (`f_auto`, `q_auto`, width resize).
- LCP image on HeroBanner uses `fetchPriority="high"` and `loading="eager"`.
- `aspect-ratio` containers eliminate cumulative layout shift (CLS).

---

## 17. Security Model & Audit Fixes

- **XSS Escaping:** Invoice generator (`printInvoice.ts`) applies `esc()` to all user fields.
- **Server Price Validation:** Price calculations in `POST /api/orders/create` use verified database prices.
- **JWT Cryptographic Verification:** All endpoints use `verifyFirebaseToken()`.
- **Admin Status API:** Endpoint `/api/users/me/admin-status` provides admin verification without exposing emails.
- **Strict CORS & CSP:** Shared helper `api/_lib/cors.js` and Content Security Policy headers in `vercel.json`.
- **Session PII Storage:** Checkout address data stored in `sessionStorage`.

---

## 18. PWA Architecture & Font Self-Hosting

- **Font Self-Hosting:** Google Fonts CDN replaced with self-hosted files in `public/fonts/` (`Bebas Neue`, `Barlow Condensed`, `Inter`, `Barlow`). `@font-face` rules in `src/index.css` eliminate external network requests.
- **Service Worker:** Managed via Workbox `generateSW`. Automatically updates precached assets.

---

## 19. App Update Lifecycle

Component `AppUpdatePrompt` checks for new versions:
- Capacitor Native: Retrieves version via `@capacitor/app` (`App.getInfo()`).
- Web / TWA: Reads `app_version` query parameter.
- Fetches `/app-version.json` and prompts modal on new releases.

---

## 20. Deployment

- Frontend & Serverless Functions deployed on Vercel.
- Native Android compiled via Android Studio or `npm run cap:build`.

---

## 21. Future Roadmap

| Feature | Status | Notes |
|---|---|---|
| Payment Gateway Integration | Planned | Razorpay / PhonePe COD alternative |
| Distributed Rate Limiting | Planned | Redis-backed rate limiting across serverless instances |
| Single Product Endpoint | Planned | Dedicated `GET /api/products/:id` |

> *Native Android App, Push Notifications, Returns System, Reviews, Admin Analytics, Security Fixes, TanStack Query, and Gift Cards are fully implemented.*

---

*Thunderbold — Premium Indian Fashion. Built for the Bold.*

> Last updated: August 20, 2026
