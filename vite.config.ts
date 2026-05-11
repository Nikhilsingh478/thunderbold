import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(() => ({
  build: {
    sourcemap: false,
    rollupOptions: {
      external: ['lucide-react/dist/esm/icons/wallet-minimal.js.map'],
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5000,
    allowedHosts: true,
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
      /**
       * generateSW — Workbox fully generates the service worker.
       * Simpler and more reliable than injectManifest for this use case.
       */
      strategies: 'generateSW',
      registerType: 'prompt',   // Prompt strategy: we control when to update (no forced reload)
      injectRegister: null,     // We register manually in main.tsx via virtual:pwa-register

      /**
       * Service worker only in production.
       * In dev mode it conflicts with Vite HMR and the API proxy.
       */
      devOptions: {
        enabled: false,
      },

      /**
       * Files in /public to include in the precache manifest.
       * Only lightweight assets — product images are handled via runtimeCaching.
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
        name: 'Thunderbolt',
        short_name: 'Thunderbolt',
        description: 'Premium Indian Denim — Built for the Bold',
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
        theme_color: '#0a0a0a',
        background_color: '#0a0a0a',

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
            label: 'Thunderbolt — Premium Denim Storefront',
          },
          {
            src: '/screenshots/desktop.png',
            sizes: '1280x800',
            type: 'image/png',
            form_factor: 'wide',
            label: 'Thunderbolt — Product Collection',
          },
        ],

        /**
         * Share target — allows other apps to share URLs / product links
         * into Thunderbolt via the OS share sheet.
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
            id: 'app.vercel.thunderbold.twa',
            fingerprints: [
              {
                type: 'sha256_cert',
                value: 'CE:03:95:CB:D2:48:45:60:23:C4:8A:91:0D:30:CC:04:2B:B4:1E:26:FD:D2:DB:7A:60:30:0B:85:5D:68:D3:04',
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

      workbox: {
        /**
         * Precache JS/CSS/HTML/fonts and small raster assets.
         * Large media files (banners, product images) are served via runtimeCaching.
         */
        globPatterns: ['**/*.{js,css,html,ico,svg,woff,woff2}'],
        globIgnores: [
          '**/banners/**',
          '**/screenshots/**',
          // Exclude large icon sizes from precache — runtimeCaching handles them
        ],

        /**
         * SPA navigation fallback — serve index.html for all navigation requests
         * except API calls (those must always go to the network).
         */
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [
          /^\/api\//,    // Never intercept API requests
          /^\/sw\.js$/,  // Don't intercept the service worker itself
        ],

        /**
         * Clean up outdated caches from old SW versions on activation.
         * Prevents stale data after deployments.
         */
        cleanupOutdatedCaches: true,

        /**
         * Skip waiting — newly installed SW activates immediately after install.
         * Combined with 'prompt' registerType, users see an update prompt
         * and can choose when to apply it (non-disruptive for checkout flows).
         */
        skipWaiting: false,
        clientsClaim: false,

        runtimeCaching: [
          {
            /**
             * CRITICAL — Never cache any API response.
             * Auth, cart, orders, admin, checkout must always hit the network.
             * Stale API data causes incorrect stock counts and auth failures.
             */
            urlPattern: /^\/api\/.*/i,
            handler: 'NetworkOnly',
          },
          {
            /**
             * Google Fonts CSS — safe to serve stale while revalidating in background.
             */
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'tb-google-fonts-css',
              expiration: { maxEntries: 8, maxAgeSeconds: 60 * 60 * 24 * 7 },
            },
          },
          {
            /**
             * Google Fonts binary files — immutable, safe to cache for 1 year.
             */
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'tb-google-fonts-files',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            /**
             * Cloudinary product images — content-addressed URLs, safe to cache
             * for 30 days with a 120-entry LRU cap.
             */
            urlPattern: /^https:\/\/res\.cloudinary\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'tb-cloudinary-images',
              expiration: {
                maxEntries: 120,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            /**
             * Local static images (banners, icons, placeholders).
             * 30-day CacheFirst with a 60-entry limit.
             */
            urlPattern: /\.(?:png|jpg|jpeg|webp|svg|gif|ico)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'tb-static-images',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
