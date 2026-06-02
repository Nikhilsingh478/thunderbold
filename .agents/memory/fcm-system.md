---
name: FCM push notification system
description: Architecture and constraints for the FCM push notification system added to Thunderbold
---

## Architecture

- SW companion: `public/firebase-messaging-sw-part.js` injected via `workbox.importScripts` in vite.config.ts. Uses Firebase 10 compat CDN scripts inside SW context (no ESM imports in SW).
- Frontend messaging: `src/lib/firebaseMessaging.ts` — `initMessaging()` + `requestAndRegisterToken()`. Uses `import.meta.env.VITE_FIREBASE_VAPID_KEY`.
- Hook: `src/hooks/useNotifications.ts` — `triggerPrompt()` called 3s after login. `localStorage.notifPromptShown` prevents repeat prompts.
- Prompt UI: `src/components/NotificationPermissionPrompt.tsx` — slide-up card, mounted in AppContent.tsx.
- Backend helper: `api/_lib/fcm.js` — `sendToUser(db, userId, payload)` + `sendMulticast(messaging, tokens, payload)`. Never throws.
- Backend admin: `api/_lib/firebaseAdmin.js` exports `getAdminMessaging()`.
- Broadcast: `api/notifications/index.js` handles `POST /api/notifications/broadcast` — admin-only.
- Token storage: `fcmTokens: string[]` in users MongoDB collection. Routes: POST/DELETE `/api/users/fcm-token`.
- Order events: `api/orders/index.js` fires sendToUser on create (order received) and PATCH (confirmed/shipped/delivered/cancelled).

## Required env var

`VITE_FIREBASE_VAPID_KEY` — must be added by user to Replit Secrets. Without it, token registration silently skips. Get from Firebase Console → Project Settings → Cloud Messaging → Web Push certificates.

**Why:** VAPID key authenticates the push subscription; without it `getToken()` will fail silently per our try/catch safety wrapper.

## Key constraint

All FCM sends are fire-and-forget (no await at call site, errors swallowed). Never block order creation or status updates on notification failures.
