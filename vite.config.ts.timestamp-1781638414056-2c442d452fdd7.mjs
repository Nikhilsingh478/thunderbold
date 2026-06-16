// vite.config.ts
import { defineConfig } from "file:///home/runner/workspace/node_modules/vite/dist/node/index.js";
import react from "file:///home/runner/workspace/node_modules/@vitejs/plugin-react-swc/index.js";
import path from "path";
import { VitePWA } from "file:///home/runner/workspace/node_modules/vite-plugin-pwa/dist/index.js";
import fs from "fs";
var __vite_injected_original_dirname = "/home/runner/workspace";
var buildVersion = (/* @__PURE__ */ new Date()).getTime().toString();
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
var vite_config_default = defineConfig(() => ({
  define: {
    __APP_VERSION__: JSON.stringify(buildVersion)
  },
  build: {
    sourcemap: false,
    rollupOptions: {
      external: ["lucide-react/dist/esm/icons/wallet-minimal.js.map"]
    }
  },
  server: {
    host: "0.0.0.0",
    port: 5e3,
    allowedHosts: true,
    hmr: {
      overlay: false
    },
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
        secure: false
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
      strategies: "generateSW",
      registerType: "autoUpdate",
      // Auto-activate new SW immediately — prevents stale cache black screens
      injectRegister: null,
      // We register manually in main.tsx via virtual:pwa-register
      /**
       * Service worker only in production.
       * In dev mode it conflicts with Vite HMR and the API proxy.
       */
      devOptions: {
        enabled: false
      },
      /**
       * Files in /public to include in the precache manifest.
       * Only lightweight assets — product images are handled via runtimeCaching.
       */
      includeAssets: [
        "favicon.svg",
        "robots.txt",
        "offline.html",
        "icons/*.png"
      ],
      manifest: {
        /**
         * App identity — required for PWABuilder and Play Store TWA.
         * `id` must be stable across deployments.
         */
        id: "/",
        name: "Thunderbold",
        short_name: "Thunderbold",
        description: "Curated streetwear & fashion \u2014 handpicked denim, t-shirts, shirts and kurtas for modern India.",
        start_url: "/",
        scope: "/",
        /**
         * Display hierarchy:
         * 1. window-controls-overlay — desktop installed, title-bar-area API
         * 2. standalone — mobile / desktop installed (no browser chrome)
         * 3. minimal-ui — fallback (back/refresh bar visible)
         */
        display: "standalone",
        display_override: ["window-controls-overlay", "standalone", "minimal-ui"],
        orientation: "portrait-primary",
        theme_color: "#0a0a0a",
        background_color: "#0a0a0a",
        lang: "en-IN",
        dir: "ltr",
        categories: ["shopping"],
        /**
         * App shortcuts — appear on long-press of the home screen icon
         * (Android) or right-click in taskbar (desktop).
         */
        shortcuts: [
          {
            name: "My Cart",
            short_name: "Cart",
            description: "View your shopping cart",
            url: "/cart",
            icons: [{ src: "/icons/icon-96x96.png", sizes: "96x96", type: "image/png" }]
          },
          {
            name: "My Wishlist",
            short_name: "Wishlist",
            description: "View your saved items",
            url: "/wishlist",
            icons: [{ src: "/icons/icon-96x96.png", sizes: "96x96", type: "image/png" }]
          },
          {
            name: "My Orders",
            short_name: "Orders",
            description: "Track your orders",
            url: "/orders",
            icons: [{ src: "/icons/icon-96x96.png", sizes: "96x96", type: "image/png" }]
          },
          {
            name: "Deals",
            short_name: "Deals",
            description: "Shop denim under \u20B9999",
            url: "/deals/under-999",
            icons: [{ src: "/icons/icon-96x96.png", sizes: "96x96", type: "image/png" }]
          }
        ],
        /**
         * Screenshots — shown in browser install dialogs and PWABuilder.
         * narrow = mobile portrait, wide = desktop/tablet landscape.
         */
        screenshots: [
          {
            src: "/screenshots/mobile.png",
            sizes: "540x960",
            type: "image/png",
            form_factor: "narrow",
            label: "Thunderbold \u2014 Curated Fashion Storefront"
          },
          {
            src: "/screenshots/desktop.png",
            sizes: "1280x800",
            type: "image/png",
            form_factor: "wide",
            label: "Thunderbold \u2014 Product Collection"
          }
        ],
        /**
         * Share target — allows other apps to share URLs / product links
         * into Thunderbold via the OS share sheet.
         * When triggered, the app opens at /?share_url=... (handled in Index.tsx).
         */
        share_target: {
          action: "/",
          method: "GET",
          params: {
            title: "title",
            text: "text",
            url: "url"
          }
        },
        /**
         * Launch handler — reuse the existing app window when launched again
         * instead of opening a second tab. Critical for installed PWA feel.
         */
        launch_handler: {
          client_mode: "navigate-existing"
        },
        prefer_related_applications: false,
        related_applications: [
          {
            relation: ["delegate_permission/common.handle_all_urls"],
            platform: "play",
            id: "shop.thunderbold.www.twa",
            fingerprints: [
              {
                type: "sha256_cert",
                value: "45:BD:08:98:06:70:41:FE:B4:C7:E9:32:B0:B7:E1:74:5F:1B:9C:60:0E:B5:24:47:B4:E7:CA:52:C4:06:93:30"
              },
              {
                type: "sha256_cert",
                value: "BC:FF:96:C4:C3:4D:A1:F6:26:BC:90:C1:39:6C:4E:C5:CD:96:69:02:82:3C:89:21:32:FD:11:C2:A3:A8:F7:84"
              },
              {
                type: "sha256_cert",
                value: "56:6E:56:0A:50:9A:44:C8:70:C5:1C:25:66:5A:5A:C4:2D:AF:FF:B5:58:DC:D1:F5:68:73:F5:05:5D:D2:58:16"
              },
              {
                type: "sha256_cert",
                value: "F5:7E:39:EB:A4:6D:68:1E:24:8F:A7:9A:F8:C7:EE:FD:C1:FC:B2:81:7D:22:8A:E4:BB:23:17:0B:3A:39:4B:1E"
              }
            ]
          },
          {
            relation: ["delegate_permission/common.handle_all_urls"],
            platform: "play",
            id: "shop.thunderbold.twa",
            fingerprints: [
              {
                type: "sha256_cert",
                value: "45:BD:08:98:06:70:41:FE:B4:C7:E9:32:B0:B7:E1:74:5F:1B:9C:60:0E:B5:24:47:B4:E7:CA:52:C4:06:93:30"
              },
              {
                type: "sha256_cert",
                value: "BC:FF:96:C4:C3:4D:A1:F6:26:BC:90:C1:39:6C:4E:C5:CD:96:69:02:82:3C:89:21:32:FD:11:C2:A3:A8:F7:84"
              },
              {
                type: "sha256_cert",
                value: "56:6E:56:0A:50:9A:44:C8:70:C5:1C:25:66:5A:5A:C4:2D:AF:FF:B5:58:DC:D1:F5:68:73:F5:05:5D:D2:58:16"
              },
              {
                type: "sha256_cert",
                value: "F5:7E:39:EB:A4:6D:68:1E:24:8F:A7:9A:F8:C7:EE:FD:C1:FC:B2:81:7D:22:8A:E4:BB:23:17:0B:3A:39:4B:1E"
              }
            ]
          }
        ],
        icons: [
          { src: "/icons/icon-72x72.png", sizes: "72x72", type: "image/png" },
          { src: "/icons/icon-96x96.png", sizes: "96x96", type: "image/png" },
          { src: "/icons/icon-128x128.png", sizes: "128x128", type: "image/png" },
          { src: "/icons/icon-144x144.png", sizes: "144x144", type: "image/png" },
          { src: "/icons/icon-152x152.png", sizes: "152x152", type: "image/png" },
          { src: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "/icons/icon-384x384.png", sizes: "384x384", type: "image/png" },
          { src: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "/icons/icon-512x512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
        ]
      },
      workbox: {
        /**
         * Precache JS/CSS/HTML/fonts and small raster assets.
         * Large media files (banners, product images) are served via runtimeCaching.
         */
        globPatterns: ["**/*.{js,css,html,ico,svg,woff,woff2}"],
        globIgnores: [
          "**/banners/**",
          "**/screenshots/**"
          // Exclude large icon sizes from precache — runtimeCaching handles them
        ],
        /**
         * SPA navigation fallback — serve index.html for all navigation requests
         * except API calls (those must always go to the network).
         */
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [
          /^\/api\//,
          // Never intercept API requests
          /^\/sw\.js$/
          // Don't intercept the service worker itself
        ],
        /**
         * Clean up outdated caches from old SW versions on activation.
         * Prevents stale data after deployments.
         */
        cleanupOutdatedCaches: true,
        /**
         * In 'prompt' mode, do not auto skip waiting but do claim clients upon activation.
         * The prompt component triggers activation, and clientsClaim ensures it immediately
         * takes control of all pages to trigger page reloads reliably.
         */
        skipWaiting: true,
        clientsClaim: true,
        importScripts: ["/firebase-messaging-sw-part.js"],
        runtimeCaching: [
          {
            /**
             * CRITICAL — Never cache any API response.
             * Auth, cart, orders, admin, checkout must always hit the network.
             * Stale API data causes incorrect stock counts and auth failures.
             */
            urlPattern: /^\/api\/.*/i,
            handler: "NetworkOnly"
          },
          {
            /**
             * Google Fonts CSS — safe to serve stale while revalidating in background.
             */
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "tb-google-fonts-css",
              expiration: { maxEntries: 8, maxAgeSeconds: 60 * 60 * 24 * 7 }
            }
          },
          {
            /**
             * Google Fonts binary files — immutable, safe to cache for 1 year.
             */
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "tb-google-fonts-files",
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            /**
             * Cloudinary product images — content-addressed URLs, safe to cache
             * for 30 days with a 120-entry LRU cap.
             */
            urlPattern: /^https:\/\/res\.cloudinary\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "tb-cloudinary-images",
              expiration: {
                maxEntries: 120,
                maxAgeSeconds: 60 * 60 * 24 * 30
              },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            /**
             * Local static images (banners, icons, placeholders).
             * 30-day CacheFirst with a 60-entry limit.
             */
            urlPattern: /\.(?:png|jpg|jpeg|webp|svg|gif|ico)$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "tb-static-images",
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 30
              },
              cacheableResponse: { statuses: [0, 200] }
            }
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9ydW5uZXIvd29ya3NwYWNlXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9ydW5uZXIvd29ya3NwYWNlL3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3J1bm5lci93b3Jrc3BhY2Uvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2NcIjtcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgeyBWaXRlUFdBIH0gZnJvbSBcInZpdGUtcGx1Z2luLXB3YVwiO1xuaW1wb3J0IGZzIGZyb20gXCJmc1wiO1xuXG4vLyBHZW5lcmF0ZSBhIGJ1aWxkLXRpbWUgdmVyc2lvbiB0aW1lc3RhbXBcbmNvbnN0IGJ1aWxkVmVyc2lvbiA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpLnRvU3RyaW5nKCk7XG5cbi8vIFdyaXRlIHZlcnNpb24uanNvbiBpbW1lZGlhdGVseSBvbiBjb25maWcgZXZhbHVhdGlvblxudHJ5IHtcbiAgY29uc3QgcHVibGljRGlyID0gcGF0aC5yZXNvbHZlKHByb2Nlc3MuY3dkKCksIFwicHVibGljXCIpO1xuICBpZiAoIWZzLmV4aXN0c1N5bmMocHVibGljRGlyKSkge1xuICAgIGZzLm1rZGlyU3luYyhwdWJsaWNEaXIsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICB9XG4gIGZzLndyaXRlRmlsZVN5bmMoXG4gICAgcGF0aC5yZXNvbHZlKHB1YmxpY0RpciwgXCJ2ZXJzaW9uLmpzb25cIiksXG4gICAgSlNPTi5zdHJpbmdpZnkoeyB2ZXJzaW9uOiBidWlsZFZlcnNpb24gfSwgbnVsbCwgMilcbiAgKTtcbiAgY29uc29sZS5sb2coYFtWZXJzaW9uXSBTdWNjZXNzZnVsbHkgd3JvdGUgdmVyc2lvbi5qc29uIHRvIHB1YmxpYy8gd2l0aCB2ZXJzaW9uICR7YnVpbGRWZXJzaW9ufWApO1xufSBjYXRjaCAoZXJyKSB7XG4gIGNvbnNvbGUuZXJyb3IoXCJbVmVyc2lvbl0gRmFpbGVkIHRvIHdyaXRlIHZlcnNpb24uanNvbjpcIiwgZXJyKTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCgpID0+ICh7XG4gIGRlZmluZToge1xuICAgIF9fQVBQX1ZFUlNJT05fXzogSlNPTi5zdHJpbmdpZnkoYnVpbGRWZXJzaW9uKSxcbiAgfSxcbiAgYnVpbGQ6IHtcbiAgICBzb3VyY2VtYXA6IGZhbHNlLFxuICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgIGV4dGVybmFsOiBbJ2x1Y2lkZS1yZWFjdC9kaXN0L2VzbS9pY29ucy93YWxsZXQtbWluaW1hbC5qcy5tYXAnXSxcbiAgICB9LFxuICB9LFxuICBzZXJ2ZXI6IHtcbiAgICBob3N0OiBcIjAuMC4wLjBcIixcbiAgICBwb3J0OiA1MDAwLFxuICAgIGFsbG93ZWRIb3N0czogdHJ1ZSBhcyBjb25zdCxcbiAgICBobXI6IHtcbiAgICAgIG92ZXJsYXk6IGZhbHNlLFxuICAgIH0sXG4gICAgcHJveHk6IHtcbiAgICAgICcvYXBpJzoge1xuICAgICAgICB0YXJnZXQ6ICdodHRwOi8vbG9jYWxob3N0OjMwMDEnLFxuICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXG4gICAgICAgIHNlY3VyZTogZmFsc2UsXG4gICAgICB9XG4gICAgfVxuICB9LFxuICBwbHVnaW5zOiBbXG4gICAgcmVhY3QoKSxcbiAgICBWaXRlUFdBKHtcbiAgICAgIC8qKlxuICAgICAgICogZ2VuZXJhdGVTVyBcdTIwMTQgV29ya2JveCBmdWxseSBnZW5lcmF0ZXMgdGhlIHNlcnZpY2Ugd29ya2VyLlxuICAgICAgICogU2ltcGxlciBhbmQgbW9yZSByZWxpYWJsZSB0aGFuIGluamVjdE1hbmlmZXN0IGZvciB0aGlzIHVzZSBjYXNlLlxuICAgICAgICovXG4gICAgICBzdHJhdGVnaWVzOiAnZ2VuZXJhdGVTVycsXG4gICAgICByZWdpc3RlclR5cGU6ICdhdXRvVXBkYXRlJywgLy8gQXV0by1hY3RpdmF0ZSBuZXcgU1cgaW1tZWRpYXRlbHkgXHUyMDE0IHByZXZlbnRzIHN0YWxlIGNhY2hlIGJsYWNrIHNjcmVlbnNcbiAgICAgIGluamVjdFJlZ2lzdGVyOiBudWxsLCAgICAgIC8vIFdlIHJlZ2lzdGVyIG1hbnVhbGx5IGluIG1haW4udHN4IHZpYSB2aXJ0dWFsOnB3YS1yZWdpc3RlclxuXG4gICAgICAvKipcbiAgICAgICAqIFNlcnZpY2Ugd29ya2VyIG9ubHkgaW4gcHJvZHVjdGlvbi5cbiAgICAgICAqIEluIGRldiBtb2RlIGl0IGNvbmZsaWN0cyB3aXRoIFZpdGUgSE1SIGFuZCB0aGUgQVBJIHByb3h5LlxuICAgICAgICovXG4gICAgICBkZXZPcHRpb25zOiB7XG4gICAgICAgIGVuYWJsZWQ6IGZhbHNlLFxuICAgICAgfSxcblxuICAgICAgLyoqXG4gICAgICAgKiBGaWxlcyBpbiAvcHVibGljIHRvIGluY2x1ZGUgaW4gdGhlIHByZWNhY2hlIG1hbmlmZXN0LlxuICAgICAgICogT25seSBsaWdodHdlaWdodCBhc3NldHMgXHUyMDE0IHByb2R1Y3QgaW1hZ2VzIGFyZSBoYW5kbGVkIHZpYSBydW50aW1lQ2FjaGluZy5cbiAgICAgICAqL1xuICAgICAgaW5jbHVkZUFzc2V0czogW1xuICAgICAgICAnZmF2aWNvbi5zdmcnLFxuICAgICAgICAncm9ib3RzLnR4dCcsXG4gICAgICAgICdvZmZsaW5lLmh0bWwnLFxuICAgICAgICAnaWNvbnMvKi5wbmcnLFxuICAgICAgXSxcblxuICAgICAgbWFuaWZlc3Q6IHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEFwcCBpZGVudGl0eSBcdTIwMTQgcmVxdWlyZWQgZm9yIFBXQUJ1aWxkZXIgYW5kIFBsYXkgU3RvcmUgVFdBLlxuICAgICAgICAgKiBgaWRgIG11c3QgYmUgc3RhYmxlIGFjcm9zcyBkZXBsb3ltZW50cy5cbiAgICAgICAgICovXG4gICAgICAgIGlkOiAnLycsXG4gICAgICAgIG5hbWU6ICdUaHVuZGVyYm9sZCcsXG4gICAgICAgIHNob3J0X25hbWU6ICdUaHVuZGVyYm9sZCcsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnQ3VyYXRlZCBzdHJlZXR3ZWFyICYgZmFzaGlvbiBcdTIwMTQgaGFuZHBpY2tlZCBkZW5pbSwgdC1zaGlydHMsIHNoaXJ0cyBhbmQga3VydGFzIGZvciBtb2Rlcm4gSW5kaWEuJyxcbiAgICAgICAgc3RhcnRfdXJsOiAnLycsXG4gICAgICAgIHNjb3BlOiAnLycsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIERpc3BsYXkgaGllcmFyY2h5OlxuICAgICAgICAgKiAxLiB3aW5kb3ctY29udHJvbHMtb3ZlcmxheSBcdTIwMTQgZGVza3RvcCBpbnN0YWxsZWQsIHRpdGxlLWJhci1hcmVhIEFQSVxuICAgICAgICAgKiAyLiBzdGFuZGFsb25lIFx1MjAxNCBtb2JpbGUgLyBkZXNrdG9wIGluc3RhbGxlZCAobm8gYnJvd3NlciBjaHJvbWUpXG4gICAgICAgICAqIDMuIG1pbmltYWwtdWkgXHUyMDE0IGZhbGxiYWNrIChiYWNrL3JlZnJlc2ggYmFyIHZpc2libGUpXG4gICAgICAgICAqL1xuICAgICAgICBkaXNwbGF5OiAnc3RhbmRhbG9uZScsXG4gICAgICAgIGRpc3BsYXlfb3ZlcnJpZGU6IFsnd2luZG93LWNvbnRyb2xzLW92ZXJsYXknLCAnc3RhbmRhbG9uZScsICdtaW5pbWFsLXVpJ10sXG5cbiAgICAgICAgb3JpZW50YXRpb246ICdwb3J0cmFpdC1wcmltYXJ5JyxcbiAgICAgICAgdGhlbWVfY29sb3I6ICcjMGEwYTBhJyxcbiAgICAgICAgYmFja2dyb3VuZF9jb2xvcjogJyMwYTBhMGEnLFxuXG4gICAgICAgIGxhbmc6ICdlbi1JTicsXG4gICAgICAgIGRpcjogJ2x0cicsXG4gICAgICAgIGNhdGVnb3JpZXM6IFsnc2hvcHBpbmcnXSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQXBwIHNob3J0Y3V0cyBcdTIwMTQgYXBwZWFyIG9uIGxvbmctcHJlc3Mgb2YgdGhlIGhvbWUgc2NyZWVuIGljb25cbiAgICAgICAgICogKEFuZHJvaWQpIG9yIHJpZ2h0LWNsaWNrIGluIHRhc2tiYXIgKGRlc2t0b3ApLlxuICAgICAgICAgKi9cbiAgICAgICAgc2hvcnRjdXRzOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgbmFtZTogJ015IENhcnQnLFxuICAgICAgICAgICAgc2hvcnRfbmFtZTogJ0NhcnQnLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdWaWV3IHlvdXIgc2hvcHBpbmcgY2FydCcsXG4gICAgICAgICAgICB1cmw6ICcvY2FydCcsXG4gICAgICAgICAgICBpY29uczogW3sgc3JjOiAnL2ljb25zL2ljb24tOTZ4OTYucG5nJywgc2l6ZXM6ICc5Nng5NicsIHR5cGU6ICdpbWFnZS9wbmcnIH1dLFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgbmFtZTogJ015IFdpc2hsaXN0JyxcbiAgICAgICAgICAgIHNob3J0X25hbWU6ICdXaXNobGlzdCcsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1ZpZXcgeW91ciBzYXZlZCBpdGVtcycsXG4gICAgICAgICAgICB1cmw6ICcvd2lzaGxpc3QnLFxuICAgICAgICAgICAgaWNvbnM6IFt7IHNyYzogJy9pY29ucy9pY29uLTk2eDk2LnBuZycsIHNpemVzOiAnOTZ4OTYnLCB0eXBlOiAnaW1hZ2UvcG5nJyB9XSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIG5hbWU6ICdNeSBPcmRlcnMnLFxuICAgICAgICAgICAgc2hvcnRfbmFtZTogJ09yZGVycycsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1RyYWNrIHlvdXIgb3JkZXJzJyxcbiAgICAgICAgICAgIHVybDogJy9vcmRlcnMnLFxuICAgICAgICAgICAgaWNvbnM6IFt7IHNyYzogJy9pY29ucy9pY29uLTk2eDk2LnBuZycsIHNpemVzOiAnOTZ4OTYnLCB0eXBlOiAnaW1hZ2UvcG5nJyB9XSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIG5hbWU6ICdEZWFscycsXG4gICAgICAgICAgICBzaG9ydF9uYW1lOiAnRGVhbHMnLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdTaG9wIGRlbmltIHVuZGVyIFx1MjBCOTk5OScsXG4gICAgICAgICAgICB1cmw6ICcvZGVhbHMvdW5kZXItOTk5JyxcbiAgICAgICAgICAgIGljb25zOiBbeyBzcmM6ICcvaWNvbnMvaWNvbi05Nng5Ni5wbmcnLCBzaXplczogJzk2eDk2JywgdHlwZTogJ2ltYWdlL3BuZycgfV0sXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogU2NyZWVuc2hvdHMgXHUyMDE0IHNob3duIGluIGJyb3dzZXIgaW5zdGFsbCBkaWFsb2dzIGFuZCBQV0FCdWlsZGVyLlxuICAgICAgICAgKiBuYXJyb3cgPSBtb2JpbGUgcG9ydHJhaXQsIHdpZGUgPSBkZXNrdG9wL3RhYmxldCBsYW5kc2NhcGUuXG4gICAgICAgICAqL1xuICAgICAgICBzY3JlZW5zaG90czogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIHNyYzogJy9zY3JlZW5zaG90cy9tb2JpbGUucG5nJyxcbiAgICAgICAgICAgIHNpemVzOiAnNTQweDk2MCcsXG4gICAgICAgICAgICB0eXBlOiAnaW1hZ2UvcG5nJyxcbiAgICAgICAgICAgIGZvcm1fZmFjdG9yOiAnbmFycm93JyxcbiAgICAgICAgICAgIGxhYmVsOiAnVGh1bmRlcmJvbGQgXHUyMDE0IEN1cmF0ZWQgRmFzaGlvbiBTdG9yZWZyb250JyxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIHNyYzogJy9zY3JlZW5zaG90cy9kZXNrdG9wLnBuZycsXG4gICAgICAgICAgICBzaXplczogJzEyODB4ODAwJyxcbiAgICAgICAgICAgIHR5cGU6ICdpbWFnZS9wbmcnLFxuICAgICAgICAgICAgZm9ybV9mYWN0b3I6ICd3aWRlJyxcbiAgICAgICAgICAgIGxhYmVsOiAnVGh1bmRlcmJvbGQgXHUyMDE0IFByb2R1Y3QgQ29sbGVjdGlvbicsXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogU2hhcmUgdGFyZ2V0IFx1MjAxNCBhbGxvd3Mgb3RoZXIgYXBwcyB0byBzaGFyZSBVUkxzIC8gcHJvZHVjdCBsaW5rc1xuICAgICAgICAgKiBpbnRvIFRodW5kZXJib2xkIHZpYSB0aGUgT1Mgc2hhcmUgc2hlZXQuXG4gICAgICAgICAqIFdoZW4gdHJpZ2dlcmVkLCB0aGUgYXBwIG9wZW5zIGF0IC8/c2hhcmVfdXJsPS4uLiAoaGFuZGxlZCBpbiBJbmRleC50c3gpLlxuICAgICAgICAgKi9cbiAgICAgICAgc2hhcmVfdGFyZ2V0OiB7XG4gICAgICAgICAgYWN0aW9uOiAnLycsXG4gICAgICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgICAgICBwYXJhbXM6IHtcbiAgICAgICAgICAgIHRpdGxlOiAndGl0bGUnLFxuICAgICAgICAgICAgdGV4dDogJ3RleHQnLFxuICAgICAgICAgICAgdXJsOiAndXJsJyxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBMYXVuY2ggaGFuZGxlciBcdTIwMTQgcmV1c2UgdGhlIGV4aXN0aW5nIGFwcCB3aW5kb3cgd2hlbiBsYXVuY2hlZCBhZ2FpblxuICAgICAgICAgKiBpbnN0ZWFkIG9mIG9wZW5pbmcgYSBzZWNvbmQgdGFiLiBDcml0aWNhbCBmb3IgaW5zdGFsbGVkIFBXQSBmZWVsLlxuICAgICAgICAgKi9cbiAgICAgICAgbGF1bmNoX2hhbmRsZXI6IHtcbiAgICAgICAgICBjbGllbnRfbW9kZTogJ25hdmlnYXRlLWV4aXN0aW5nJyxcbiAgICAgICAgfSxcblxuICAgICAgICBwcmVmZXJfcmVsYXRlZF9hcHBsaWNhdGlvbnM6IGZhbHNlLFxuICAgICAgICByZWxhdGVkX2FwcGxpY2F0aW9uczogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIHJlbGF0aW9uOiBbJ2RlbGVnYXRlX3Blcm1pc3Npb24vY29tbW9uLmhhbmRsZV9hbGxfdXJscyddLFxuICAgICAgICAgICAgcGxhdGZvcm06ICdwbGF5JyxcbiAgICAgICAgICAgIGlkOiAnc2hvcC50aHVuZGVyYm9sZC53d3cudHdhJyxcbiAgICAgICAgICAgIGZpbmdlcnByaW50czogW1xuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdHlwZTogJ3NoYTI1Nl9jZXJ0JyxcbiAgICAgICAgICAgICAgICB2YWx1ZTogJzQ1OkJEOjA4Ojk4OjA2OjcwOjQxOkZFOkI0OkM3OkU5OjMyOkIwOkI3OkUxOjc0OjVGOjFCOjlDOjYwOjBFOkI1OjI0OjQ3OkI0OkU3OkNBOjUyOkM0OjA2OjkzOjMwJyxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHR5cGU6ICdzaGEyNTZfY2VydCcsXG4gICAgICAgICAgICAgICAgdmFsdWU6ICdCQzpGRjo5NjpDNDpDMzo0RDpBMTpGNjoyNjpCQzo5MDpDMTozOTo2Qzo0RTpDNTpDRDo5Njo2OTowMjo4MjozQzo4OToyMTozMjpGRDoxMTpDMjpBMzpBODpGNzo4NCcsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB0eXBlOiAnc2hhMjU2X2NlcnQnLFxuICAgICAgICAgICAgICAgIHZhbHVlOiAnNTY6NkU6NTY6MEE6NTA6OUE6NDQ6Qzg6NzA6QzU6MUM6MjU6NjY6NUE6NUE6QzQ6MkQ6QUY6RkY6QjU6NTg6REM6RDE6RjU6Njg6NzM6RjU6MDU6NUQ6RDI6NTg6MTYnLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdHlwZTogJ3NoYTI1Nl9jZXJ0JyxcbiAgICAgICAgICAgICAgICB2YWx1ZTogJ0Y1OjdFOjM5OkVCOkE0OjZEOjY4OjFFOjI0OjhGOkE3OjlBOkY4OkM3OkVFOkZEOkMxOkZDOkIyOjgxOjdEOjIyOjhBOkU0OkJCOjIzOjE3OjBCOjNBOjM5OjRCOjFFJyxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICByZWxhdGlvbjogWydkZWxlZ2F0ZV9wZXJtaXNzaW9uL2NvbW1vbi5oYW5kbGVfYWxsX3VybHMnXSxcbiAgICAgICAgICAgIHBsYXRmb3JtOiAncGxheScsXG4gICAgICAgICAgICBpZDogJ3Nob3AudGh1bmRlcmJvbGQudHdhJyxcbiAgICAgICAgICAgIGZpbmdlcnByaW50czogW1xuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdHlwZTogJ3NoYTI1Nl9jZXJ0JyxcbiAgICAgICAgICAgICAgICB2YWx1ZTogJzQ1OkJEOjA4Ojk4OjA2OjcwOjQxOkZFOkI0OkM3OkU5OjMyOkIwOkI3OkUxOjc0OjVGOjFCOjlDOjYwOjBFOkI1OjI0OjQ3OkI0OkU3OkNBOjUyOkM0OjA2OjkzOjMwJyxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHR5cGU6ICdzaGEyNTZfY2VydCcsXG4gICAgICAgICAgICAgICAgdmFsdWU6ICdCQzpGRjo5NjpDNDpDMzo0RDpBMTpGNjoyNjpCQzo5MDpDMTozOTo2Qzo0RTpDNTpDRDo5Njo2OTowMjo4MjozQzo4OToyMTozMjpGRDoxMTpDMjpBMzpBODpGNzo4NCcsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB0eXBlOiAnc2hhMjU2X2NlcnQnLFxuICAgICAgICAgICAgICAgIHZhbHVlOiAnNTY6NkU6NTY6MEE6NTA6OUE6NDQ6Qzg6NzA6QzU6MUM6MjU6NjY6NUE6NUE6QzQ6MkQ6QUY6RkY6QjU6NTg6REM6RDE6RjU6Njg6NzM6RjU6MDU6NUQ6RDI6NTg6MTYnLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdHlwZTogJ3NoYTI1Nl9jZXJ0JyxcbiAgICAgICAgICAgICAgICB2YWx1ZTogJ0Y1OjdFOjM5OkVCOkE0OjZEOjY4OjFFOjI0OjhGOkE3OjlBOkY4OkM3OkVFOkZEOkMxOkZDOkIyOjgxOjdEOjIyOjhBOkU0OkJCOjIzOjE3OjBCOjNBOjM5OjRCOjFFJyxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcblxuICAgICAgICBpY29uczogW1xuICAgICAgICAgIHsgc3JjOiAnL2ljb25zL2ljb24tNzJ4NzIucG5nJywgICAgICAgICAgICBzaXplczogJzcyeDcyJywgICB0eXBlOiAnaW1hZ2UvcG5nJyB9LFxuICAgICAgICAgIHsgc3JjOiAnL2ljb25zL2ljb24tOTZ4OTYucG5nJywgICAgICAgICAgICBzaXplczogJzk2eDk2JywgICB0eXBlOiAnaW1hZ2UvcG5nJyB9LFxuICAgICAgICAgIHsgc3JjOiAnL2ljb25zL2ljb24tMTI4eDEyOC5wbmcnLCAgICAgICAgICBzaXplczogJzEyOHgxMjgnLCB0eXBlOiAnaW1hZ2UvcG5nJyB9LFxuICAgICAgICAgIHsgc3JjOiAnL2ljb25zL2ljb24tMTQ0eDE0NC5wbmcnLCAgICAgICAgICBzaXplczogJzE0NHgxNDQnLCB0eXBlOiAnaW1hZ2UvcG5nJyB9LFxuICAgICAgICAgIHsgc3JjOiAnL2ljb25zL2ljb24tMTUyeDE1Mi5wbmcnLCAgICAgICAgICBzaXplczogJzE1MngxNTInLCB0eXBlOiAnaW1hZ2UvcG5nJyB9LFxuICAgICAgICAgIHsgc3JjOiAnL2ljb25zL2ljb24tMTkyeDE5Mi5wbmcnLCAgICAgICAgICBzaXplczogJzE5MngxOTInLCB0eXBlOiAnaW1hZ2UvcG5nJywgcHVycG9zZTogJ2FueScgfSxcbiAgICAgICAgICB7IHNyYzogJy9pY29ucy9pY29uLTM4NHgzODQucG5nJywgICAgICAgICAgc2l6ZXM6ICczODR4Mzg0JywgdHlwZTogJ2ltYWdlL3BuZycgfSxcbiAgICAgICAgICB7IHNyYzogJy9pY29ucy9pY29uLTUxMng1MTIucG5nJywgICAgICAgICAgc2l6ZXM6ICc1MTJ4NTEyJywgdHlwZTogJ2ltYWdlL3BuZycsIHB1cnBvc2U6ICdhbnknIH0sXG4gICAgICAgICAgeyBzcmM6ICcvaWNvbnMvaWNvbi01MTJ4NTEyLW1hc2thYmxlLnBuZycsIHNpemVzOiAnNTEyeDUxMicsIHR5cGU6ICdpbWFnZS9wbmcnLCBwdXJwb3NlOiAnbWFza2FibGUnIH0sXG4gICAgICAgIF0sXG4gICAgICB9IGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+LFxuXG4gICAgICB3b3JrYm94OiB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBQcmVjYWNoZSBKUy9DU1MvSFRNTC9mb250cyBhbmQgc21hbGwgcmFzdGVyIGFzc2V0cy5cbiAgICAgICAgICogTGFyZ2UgbWVkaWEgZmlsZXMgKGJhbm5lcnMsIHByb2R1Y3QgaW1hZ2VzKSBhcmUgc2VydmVkIHZpYSBydW50aW1lQ2FjaGluZy5cbiAgICAgICAgICovXG4gICAgICAgIGdsb2JQYXR0ZXJuczogWycqKi8qLntqcyxjc3MsaHRtbCxpY28sc3ZnLHdvZmYsd29mZjJ9J10sXG4gICAgICAgIGdsb2JJZ25vcmVzOiBbXG4gICAgICAgICAgJyoqL2Jhbm5lcnMvKionLFxuICAgICAgICAgICcqKi9zY3JlZW5zaG90cy8qKicsXG4gICAgICAgICAgLy8gRXhjbHVkZSBsYXJnZSBpY29uIHNpemVzIGZyb20gcHJlY2FjaGUgXHUyMDE0IHJ1bnRpbWVDYWNoaW5nIGhhbmRsZXMgdGhlbVxuICAgICAgICBdLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTUEEgbmF2aWdhdGlvbiBmYWxsYmFjayBcdTIwMTQgc2VydmUgaW5kZXguaHRtbCBmb3IgYWxsIG5hdmlnYXRpb24gcmVxdWVzdHNcbiAgICAgICAgICogZXhjZXB0IEFQSSBjYWxscyAodGhvc2UgbXVzdCBhbHdheXMgZ28gdG8gdGhlIG5ldHdvcmspLlxuICAgICAgICAgKi9cbiAgICAgICAgbmF2aWdhdGVGYWxsYmFjazogJy9pbmRleC5odG1sJyxcbiAgICAgICAgbmF2aWdhdGVGYWxsYmFja0RlbnlsaXN0OiBbXG4gICAgICAgICAgL15cXC9hcGlcXC8vLCAgICAvLyBOZXZlciBpbnRlcmNlcHQgQVBJIHJlcXVlc3RzXG4gICAgICAgICAgL15cXC9zd1xcLmpzJC8sICAvLyBEb24ndCBpbnRlcmNlcHQgdGhlIHNlcnZpY2Ugd29ya2VyIGl0c2VsZlxuICAgICAgICBdLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDbGVhbiB1cCBvdXRkYXRlZCBjYWNoZXMgZnJvbSBvbGQgU1cgdmVyc2lvbnMgb24gYWN0aXZhdGlvbi5cbiAgICAgICAgICogUHJldmVudHMgc3RhbGUgZGF0YSBhZnRlciBkZXBsb3ltZW50cy5cbiAgICAgICAgICovXG4gICAgICAgIGNsZWFudXBPdXRkYXRlZENhY2hlczogdHJ1ZSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogSW4gJ3Byb21wdCcgbW9kZSwgZG8gbm90IGF1dG8gc2tpcCB3YWl0aW5nIGJ1dCBkbyBjbGFpbSBjbGllbnRzIHVwb24gYWN0aXZhdGlvbi5cbiAgICAgICAgICogVGhlIHByb21wdCBjb21wb25lbnQgdHJpZ2dlcnMgYWN0aXZhdGlvbiwgYW5kIGNsaWVudHNDbGFpbSBlbnN1cmVzIGl0IGltbWVkaWF0ZWx5XG4gICAgICAgICAqIHRha2VzIGNvbnRyb2wgb2YgYWxsIHBhZ2VzIHRvIHRyaWdnZXIgcGFnZSByZWxvYWRzIHJlbGlhYmx5LlxuICAgICAgICAgKi9cbiAgICAgICAgc2tpcFdhaXRpbmc6IHRydWUsXG4gICAgICAgIGNsaWVudHNDbGFpbTogdHJ1ZSxcblxuICAgICAgICBpbXBvcnRTY3JpcHRzOiBbJy9maXJlYmFzZS1tZXNzYWdpbmctc3ctcGFydC5qcyddLFxuXG4gICAgICAgIHJ1bnRpbWVDYWNoaW5nOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBDUklUSUNBTCBcdTIwMTQgTmV2ZXIgY2FjaGUgYW55IEFQSSByZXNwb25zZS5cbiAgICAgICAgICAgICAqIEF1dGgsIGNhcnQsIG9yZGVycywgYWRtaW4sIGNoZWNrb3V0IG11c3QgYWx3YXlzIGhpdCB0aGUgbmV0d29yay5cbiAgICAgICAgICAgICAqIFN0YWxlIEFQSSBkYXRhIGNhdXNlcyBpbmNvcnJlY3Qgc3RvY2sgY291bnRzIGFuZCBhdXRoIGZhaWx1cmVzLlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICB1cmxQYXR0ZXJuOiAvXlxcL2FwaVxcLy4qL2ksXG4gICAgICAgICAgICBoYW5kbGVyOiAnTmV0d29ya09ubHknLFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBHb29nbGUgRm9udHMgQ1NTIFx1MjAxNCBzYWZlIHRvIHNlcnZlIHN0YWxlIHdoaWxlIHJldmFsaWRhdGluZyBpbiBiYWNrZ3JvdW5kLlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICB1cmxQYXR0ZXJuOiAvXmh0dHBzOlxcL1xcL2ZvbnRzXFwuZ29vZ2xlYXBpc1xcLmNvbVxcLy4qL2ksXG4gICAgICAgICAgICBoYW5kbGVyOiAnU3RhbGVXaGlsZVJldmFsaWRhdGUnLFxuICAgICAgICAgICAgb3B0aW9uczoge1xuICAgICAgICAgICAgICBjYWNoZU5hbWU6ICd0Yi1nb29nbGUtZm9udHMtY3NzJyxcbiAgICAgICAgICAgICAgZXhwaXJhdGlvbjogeyBtYXhFbnRyaWVzOiA4LCBtYXhBZ2VTZWNvbmRzOiA2MCAqIDYwICogMjQgKiA3IH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBHb29nbGUgRm9udHMgYmluYXJ5IGZpbGVzIFx1MjAxNCBpbW11dGFibGUsIHNhZmUgdG8gY2FjaGUgZm9yIDEgeWVhci5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgdXJsUGF0dGVybjogL15odHRwczpcXC9cXC9mb250c1xcLmdzdGF0aWNcXC5jb21cXC8uKi9pLFxuICAgICAgICAgICAgaGFuZGxlcjogJ0NhY2hlRmlyc3QnLFxuICAgICAgICAgICAgb3B0aW9uczoge1xuICAgICAgICAgICAgICBjYWNoZU5hbWU6ICd0Yi1nb29nbGUtZm9udHMtZmlsZXMnLFxuICAgICAgICAgICAgICBleHBpcmF0aW9uOiB7XG4gICAgICAgICAgICAgICAgbWF4RW50cmllczogMzAsXG4gICAgICAgICAgICAgICAgbWF4QWdlU2Vjb25kczogNjAgKiA2MCAqIDI0ICogMzY1LFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBjYWNoZWFibGVSZXNwb25zZTogeyBzdGF0dXNlczogWzAsIDIwMF0gfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIENsb3VkaW5hcnkgcHJvZHVjdCBpbWFnZXMgXHUyMDE0IGNvbnRlbnQtYWRkcmVzc2VkIFVSTHMsIHNhZmUgdG8gY2FjaGVcbiAgICAgICAgICAgICAqIGZvciAzMCBkYXlzIHdpdGggYSAxMjAtZW50cnkgTFJVIGNhcC5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgdXJsUGF0dGVybjogL15odHRwczpcXC9cXC9yZXNcXC5jbG91ZGluYXJ5XFwuY29tXFwvLiovaSxcbiAgICAgICAgICAgIGhhbmRsZXI6ICdDYWNoZUZpcnN0JyxcbiAgICAgICAgICAgIG9wdGlvbnM6IHtcbiAgICAgICAgICAgICAgY2FjaGVOYW1lOiAndGItY2xvdWRpbmFyeS1pbWFnZXMnLFxuICAgICAgICAgICAgICBleHBpcmF0aW9uOiB7XG4gICAgICAgICAgICAgICAgbWF4RW50cmllczogMTIwLFxuICAgICAgICAgICAgICAgIG1heEFnZVNlY29uZHM6IDYwICogNjAgKiAyNCAqIDMwLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBjYWNoZWFibGVSZXNwb25zZTogeyBzdGF0dXNlczogWzAsIDIwMF0gfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIExvY2FsIHN0YXRpYyBpbWFnZXMgKGJhbm5lcnMsIGljb25zLCBwbGFjZWhvbGRlcnMpLlxuICAgICAgICAgICAgICogMzAtZGF5IENhY2hlRmlyc3Qgd2l0aCBhIDYwLWVudHJ5IGxpbWl0LlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICB1cmxQYXR0ZXJuOiAvXFwuKD86cG5nfGpwZ3xqcGVnfHdlYnB8c3ZnfGdpZnxpY28pJC9pLFxuICAgICAgICAgICAgaGFuZGxlcjogJ0NhY2hlRmlyc3QnLFxuICAgICAgICAgICAgb3B0aW9uczoge1xuICAgICAgICAgICAgICBjYWNoZU5hbWU6ICd0Yi1zdGF0aWMtaW1hZ2VzJyxcbiAgICAgICAgICAgICAgZXhwaXJhdGlvbjoge1xuICAgICAgICAgICAgICAgIG1heEVudHJpZXM6IDYwLFxuICAgICAgICAgICAgICAgIG1heEFnZVNlY29uZHM6IDYwICogNjAgKiAyNCAqIDMwLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBjYWNoZWFibGVSZXNwb25zZTogeyBzdGF0dXNlczogWzAsIDIwMF0gfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgIH0sXG4gICAgfSksXG4gIF0sXG4gIHJlc29sdmU6IHtcbiAgICBhbGlhczoge1xuICAgICAgXCJAXCI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi9zcmNcIiksXG4gICAgfSxcbiAgfSxcbn0p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
