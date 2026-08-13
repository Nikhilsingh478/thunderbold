import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";
import fs from "fs";
import { execSync } from "child_process";

// Use short git SHA as build version — more useful for debugging than a
// timestamp and reveals less about deployment cadence. Falls back to
// unix timestamp if git is unavailable (e.g. in some CI environments).
const buildVersion = (() => {
  try {
    return execSync("git rev-parse --short HEAD").toString().trim();
  } catch {
    return Date.now().toString();
  }
})();

// Write version.json immediately on config evaluation
try {
  const publicDir = path.resolve(process.cwd(), "public");
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  fs.writeFileSync(
    path.resolve(publicDir, "version.json"),
    JSON.stringify({ version: buildVersion }, null, 2)
  );
  console.log(`[Version] Successfully wrote version.json to public/ with version ${buildVersion}`);
} catch (err) {
  console.error("[Version] Failed to write version.json:", err);
}

export default defineConfig(() => ({
  define: {
    __APP_VERSION__: JSON.stringify(buildVersion),
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor':   ['react', 'react-dom', 'react-router-dom'],
          'firebase': ['firebase/app', 'firebase/auth'],
          'motion':   ['framer-motion'],
        },
      },
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    host: "0.0.0.0",
    port: 5000,
    allowedHosts: true as const,
    hmr: {
      overlay: false,
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  plugins: [
    react(),
    VitePWA({
      selfDestroying: true,
      /**
       * generateSW — Workbox fully generates the service worker.
       * Simpler and more reliable than injectManifest for this use case.
       */
      strategies: 'generateSW',
      registerType: 'autoUpdate', // Auto-activate new SW immediately — prevents stale cache black screens
      injectRegister: null,      // We register manually in main.tsx via virtual:pwa-register

      filename: 'sw.js',
      /**
       * Service worker only in production.
       * In dev mode it conflicts with Vite HMR and the API proxy.
       */
      devOptions: {
        enabled: false,
      },

      /**
       * Files in /public to include in the precache manifest.
       * Only lightweight assets — product images load directly via Cloudinary CDN.
       */
      includeAssets: [
        'favicon.svg',
        'robots.txt',
        'offline.html',
        'icons/*.png',
      ],

      manifest: {
        /**
         * App identity — required for PWABuilder and Play Store TWA.
         * `id` must be stable across deployments.
         */
        id: '/',
        name: 'Thunderbold',
        short_name: 'Thunderbold',
        description: 'Curated streetwear & fashion — handpicked denim, t-shirts, shirts and kurtas for modern India.',
        start_url: '/',
        scope: '/',

        /**
         * Display hierarchy:
         * 1. window-controls-overlay — desktop installed, title-bar-area API
         * 2. standalone — mobile / desktop installed (no browser chrome)
         * 3. minimal-ui — fallback (back/refresh bar visible)
         */
        display: 'standalone',
        display_override: ['window-controls-overlay', 'standalone', 'minimal-ui'],

        orientation: 'portrait-primary',
        theme_color: '#080808',
        background_color: '#080808',

        lang: 'en-IN',
        dir: 'ltr',
        categories: ['shopping'],

        /**
         * App shortcuts — appear on long-press of the home screen icon
         * (Android) or right-click in taskbar (desktop).
         */
        shortcuts: [
          {
            name: 'My Cart',
            short_name: 'Cart',
            description: 'View your shopping cart',
            url: '/cart',
            icons: [{ src: '/icons/icon-96x96.png', sizes: '96x96', type: 'image/png' }],
          },
          {
            name: 'My Wishlist',
            short_name: 'Wishlist',
            description: 'View your saved items',
            url: '/wishlist',
            icons: [{ src: '/icons/icon-96x96.png', sizes: '96x96', type: 'image/png' }],
          },
          {
            name: 'My Orders',
            short_name: 'Orders',
            description: 'Track your orders',
            url: '/orders',
            icons: [{ src: '/icons/icon-96x96.png', sizes: '96x96', type: 'image/png' }],
          },
          {
            name: 'Deals',
            short_name: 'Deals',
            description: 'Shop denim under ₹999',
            url: '/deals/under-999',
            icons: [{ src: '/icons/icon-96x96.png', sizes: '96x96', type: 'image/png' }],
          },
        ],

        /**
         * Screenshots — shown in browser install dialogs and PWABuilder.
         * narrow = mobile portrait, wide = desktop/tablet landscape.
         */
        screenshots: [
          {
            src: '/screenshots/mobile.png',
            sizes: '540x960',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'Thunderbold — Curated Fashion Storefront',
          },
          {
            src: '/screenshots/desktop.png',
            sizes: '1280x800',
            type: 'image/png',
            form_factor: 'wide',
            label: 'Thunderbold — Product Collection',
          },
        ],

        /**
         * Share target — allows other apps to share URLs / product links
         * into Thunderbold via the OS share sheet.
         * When triggered, the app opens at /?share_url=... (handled in Index.tsx).
         */
        share_target: {
          action: '/',
          method: 'GET',
          params: {
            title: 'title',
            text: 'text',
            url: 'url',
          },
        },

        /**
         * Launch handler — reuse the existing app window when launched again
         * instead of opening a second tab. Critical for installed PWA feel.
         */
        launch_handler: {
          client_mode: 'navigate-existing',
        },

        prefer_related_applications: false,
        related_applications: [
          {
            relation: ['delegate_permission/common.handle_all_urls'],
            platform: 'play',
            id: 'shop.thunderbold.www.twa',
            fingerprints: [
              {
                type: 'sha256_cert',
                value: '45:BD:08:98:06:70:41:FE:B4:C7:E9:32:B0:B7:E1:74:5F:1B:9C:60:0E:B5:24:47:B4:E7:CA:52:C4:06:93:30',
              },
              {
                type: 'sha256_cert',
                value: 'BC:FF:96:C4:C3:4D:A1:F6:26:BC:90:C1:39:6C:4E:C5:CD:96:69:02:82:3C:89:21:32:FD:11:C2:A3:A8:F7:84',
              },
              {
                type: 'sha256_cert',
                value: '56:6E:56:0A:50:9A:44:C8:70:C5:1C:25:66:5A:5A:C4:2D:AF:FF:B5:58:DC:D1:F5:68:73:F5:05:5D:D2:58:16',
              },
              {
                type: 'sha256_cert',
                value: 'F5:7E:39:EB:A4:6D:68:1E:24:8F:A7:9A:F8:C7:EE:FD:C1:FC:B2:81:7D:22:8A:E4:BB:23:17:0B:3A:39:4B:1E',
              },
            ],
          },
          {
            relation: ['delegate_permission/common.handle_all_urls'],
            platform: 'play',
            id: 'shop.thunderbold.twa',
            fingerprints: [
              {
                type: 'sha256_cert',
                value: '45:BD:08:98:06:70:41:FE:B4:C7:E9:32:B0:B7:E1:74:5F:1B:9C:60:0E:B5:24:47:B4:E7:CA:52:C4:06:93:30',
              },
              {
                type: 'sha256_cert',
                value: 'BC:FF:96:C4:C3:4D:A1:F6:26:BC:90:C1:39:6C:4E:C5:CD:96:69:02:82:3C:89:21:32:FD:11:C2:A3:A8:F7:84',
              },
              {
                type: 'sha256_cert',
                value: '56:6E:56:0A:50:9A:44:C8:70:C5:1C:25:66:5A:5A:C4:2D:AF:FF:B5:58:DC:D1:F5:68:73:F5:05:5D:D2:58:16',
              },
              {
                type: 'sha256_cert',
                value: 'F5:7E:39:EB:A4:6D:68:1E:24:8F:A7:9A:F8:C7:EE:FD:C1:FC:B2:81:7D:22:8A:E4:BB:23:17:0B:3A:39:4B:1E',
              },
            ],
          },
        ],

        icons: [
          { src: '/icons/icon-72x72.png',            sizes: '72x72',   type: 'image/png' },
          { src: '/icons/icon-96x96.png',            sizes: '96x96',   type: 'image/png' },
          { src: '/icons/icon-128x128.png',          sizes: '128x128', type: 'image/png' },
          { src: '/icons/icon-144x144.png',          sizes: '144x144', type: 'image/png' },
          { src: '/icons/icon-152x152.png',          sizes: '152x152', type: 'image/png' },
          { src: '/icons/icon-192x192.png',          sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-384x384.png',          sizes: '384x384', type: 'image/png' },
          { src: '/icons/icon-512x512.png',          sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512x512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      } as Record<string, unknown>,
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
