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
      registerType: 'autoUpdate',
      injectRegister: 'auto',

      // Only enable service worker in production builds.
      // In dev mode it interferes with Vite HMR and the API proxy.
      devOptions: {
        enabled: false,
      },

      // Files in /public to include in the precache manifest
      includeAssets: [
        'favicon.svg',
        'robots.txt',
        'offline.html',
        'icons/*.png',
      ],

      manifest: {
        name: 'Thunderbolt',
        short_name: 'Thunderbolt',
        description: 'Premium Indian Denim — Built for the Bold',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait-primary',
        theme_color: '#0a0a0a',
        background_color: '#0a0a0a',
        lang: 'en-IN',
        categories: ['shopping'],
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
      },

      workbox: {
        // Precache JS/CSS/HTML/fonts/small images.
        // Large images (banners, hang-tags, etc.) are excluded here and
        // served via runtimeCaching CacheFirst instead.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        // Exclude any webp larger than 2 MB from precache —
        // they'll be picked up by runtimeCaching CacheFirst.
        globIgnores: ['**/hangtag*.webp', '**/banners/**'],

        // SPA: serve index.html for all navigation requests...
        navigateFallback: '/index.html',
        // ...except API routes — those must always hit the network
        navigateFallbackDenylist: [/^\/api\//],

        runtimeCaching: [
          {
            // ── CRITICAL: Never cache any API response ──────────────────────
            // This covers authenticated routes (cart, orders, admin, checkout,
            // wishlist) and public routes (products, brands, categories).
            // Stale API data causes incorrect stock counts, auth failures, etc.
            urlPattern: /^\/api\/.*/i,
            handler: 'NetworkOnly',
          },
          {
            // Google Fonts CSS — fast CDN, stale-while-revalidate is safe
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'tb-google-fonts-css',
              expiration: { maxEntries: 8, maxAgeSeconds: 60 * 60 * 24 * 7 },
            },
          },
          {
            // Google Fonts binary files — immutable, 1-year cache
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
            // Cloudinary product images — cache for 30 days
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
            // Local static images (banners, icons, placeholders)
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
