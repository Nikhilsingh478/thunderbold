import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Suppress browser context menu on images — prevents "Save / Open image"
// sheet in Android WebView and mobile browsers, preserving native-app feel.
// Only suppresses on <img> targets; right-click on text/links still works.
document.addEventListener('contextmenu', (e) => {
  if (e.target instanceof HTMLImageElement) {
    e.preventDefault();
  }
}, { passive: false });

createRoot(document.getElementById("root")!).render(<App />);

if ('serviceWorker' in navigator) {
  // Clean up legacy or conflicting service workers registered previously
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const reg of registrations) {
      const scriptURL = reg.active?.scriptURL || reg.installing?.scriptURL || reg.waiting?.scriptURL || '';
      // Keep only our main Workbox SW (/sw.js). Remove others to prevent messaging conflicts.
      if (scriptURL && !scriptURL.endsWith('/sw.js')) {
        console.log('[PWA] Unregistering stale service worker:', scriptURL);
        reg.unregister().catch((e) => console.warn('[PWA] Failed to unregister sw:', e));
      }
    }
  }).catch((err) => console.warn('[PWA] Error fetching registrations:', err));

  import('virtual:pwa-register').then(({ registerSW }) => {
    const updateSW = registerSW({
      onNeedRefresh() {
        console.log('[PWA] Service worker update available - dispatching event');
        window.dispatchEvent(
          new CustomEvent('pwa-update-available', { detail: { updateSW } })
        );
      },
      onOfflineReady() {
        window.dispatchEvent(new CustomEvent('pwa-offline-ready'));
      },
      onRegisterError(error: unknown) {
        console.warn('[PWA] Service worker registration failed:', error);
      },
      onRegisteredSW(swUrl, r) {
        if (!r) return;

        console.log('[PWA] Service worker registered successfully. Setting up update checks.');

        // 1. Periodically check for service worker updates every 1 hour
        const swCheckInterval = 60 * 60 * 1000;
        setInterval(() => {
          if (navigator.onLine) {
            console.log('[PWA] Periodic service worker update check running...');
            r.update().catch(err => console.warn('[PWA] Periodic service worker update failed:', err));
          }
        }, swCheckInterval);

        // 2. Check for service worker updates when window/tab gains focus
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible' && navigator.onLine) {
            console.log('[PWA] Visibility change - checking for service worker update...');
            r.update().catch(err => console.warn('[PWA] Visibility service worker update failed:', err));
          }
        });

        // 3. Periodically check version.json and compare it with the hardcoded __APP_VERSION__
        const checkVersionJson = async () => {
          if (import.meta.env.DEV) return;
          if (('connection' in navigator) && !navigator.onLine) return;

          try {
            // Fetch version.json with a cache-busting timestamp to avoid intermediate caches
            const response = await fetch(`/version.json?t=${Date.now()}`, {
              cache: 'no-store',
              headers: {
                'cache-control': 'no-cache',
                'pragma': 'no-cache'
              }
            });
            if (response.ok) {
              const data = await response.json();
              if (data.version && data.version !== __APP_VERSION__) {
                console.log(`[Version] New build detected on server: ${data.version} (Local: ${__APP_VERSION__})`);
                console.log('[Version] Triggering service worker update immediately...');
                await r.update();
              }
            }
          } catch (e) {
            console.warn('[Version] Failed to perform version.json fetch check:', e);
          }
        };

        // Run the version.json check 5 seconds after startup to not block initial loading resources
        setTimeout(checkVersionJson, 5000);

        // Run the version.json check on visibility change (focus)
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            checkVersionJson();
          }
        });

        // Poll version.json every 5 minutes in the background
        const versionPollInterval = 5 * 60 * 1000;
        setInterval(checkVersionJson, versionPollInterval);
      }
    });
  }).catch((err: unknown) => {
    console.warn('[PWA] Could not import pwa-register module:', err);
  });
}
// PWA version test trigger comment

