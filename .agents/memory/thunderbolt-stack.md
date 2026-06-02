---
name: Thunderbolt stack
description: Core tech stack, ports, secrets required, and key architectural facts for Thunderbolt Denim
---

# Thunderbolt Stack

**Frontend:** React + Vite, Tailwind, Framer Motion, TanStack Query — port 5000
**Backend:** Express server — port 3001, proxied via /api in vite.config

**Required secrets (app returns 500s without them):**
- MONGO_URI — MongoDB Atlas connection string
- VITE_FIREBASE_API_KEY, AUTH_DOMAIN, PROJECT_ID, STORAGE_BUCKET, MESSAGING_SENDER_ID, APP_ID

**Tailwind tokens:** `brass` = #d4a32c, `void` = deep black bg, `tb-white`, `sv-dim`, `surface`
**Typography:** `font-display` = Bebas Neue, `font-condensed` = condensed sans, `font-body` = body

**Key design tokens:**
- `metal-text` = metallic text gradient utility
- `brass-text` = brass colored text
- `noise-overlay` = subtle texture overlay on all pages

**PWA:** registerType: 'autoUpdate', manual SW registration in main.tsx via virtual:pwa-register
- onNeedRefresh dispatches 'pwa-update-available' CustomEvent with updateSW in detail
- PWAUpdatePrompt handles both 'pwa-offline-ready' and 'pwa-update-available' events

**Why:** This is the production e-commerce app. All 500s in dev are expected due to missing secrets.
