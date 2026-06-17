import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Disable browser's built-in scroll restoration so we fully control where
// the page lands on every navigation (forward, back, or refresh).
// Without this, the browser tries to restore the old scroll position and —
// combined with CSS scroll-behavior:smooth — animates there visibly on mobile.
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}

// ── Instagram in-app browser detection ──────────────────────────────────────
// Instagram's iOS WKWebView has a known bug where position:fixed elements
// scroll with page content instead of staying pinned. We detect this early
// (before React mounts) so the CSS class is active on the very first paint.
if (/Instagram/.test(navigator.userAgent)) {
  document.documentElement.classList.add('instagram-browser');
}

document.addEventListener('contextmenu', (e) => {
  if (e.target instanceof HTMLImageElement) {
    e.preventDefault();
  }
}, { passive: false });

createRoot(document.getElementById("root")!).render(<App />);

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const reg of registrations) {
      const scriptURL = reg.active?.scriptURL || reg.installing?.scriptURL || reg.waiting?.scriptURL || '';
      if (scriptURL && !scriptURL.endsWith('/sw.js')) {
        console.log('[PWA] Unregistering stale service worker:', scriptURL);
        reg.unregister().catch((e) => console.warn('[PWA] Failed to unregister sw:', e));
      }
    }
  }).catch((err) => console.warn('[PWA] Error fetching registrations:', err));

  import('virtual:pwa-register').then(({ registerSW }) => {
    const updateSW = registerSW({
      onNeedRefresh() {
        console.log('[PWA] New content available — auto-reloading...');
        updateSW(true);
      },
      onOfflineReady() {
        console.log('[PWA] App ready to work offline.');
      },
      onRegisterError(error: unknown) {
        console.warn('[PWA] Service worker registration failed:', error);
      },
      onRegisteredSW(swUrl, r) {
        if (!r) return;
        console.log('[PWA] Service worker registered.');

        // 1. Periodic SW update check every 1 hour
        setInterval(() => {
          if (navigator.onLine) {
            r.update().catch(() => {});
          }
        }, 60 * 60 * 1000);

        // 2. SW + version check on tab focus (single consolidated listener)
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible' && navigator.onLine) {
            r.update().catch(() => {});
            checkVersionJson(r);
          }
        });

        // 3. Version.json check — once on startup, then every 60 s
        const checkVersionJson = async (reg: typeof r) => {
          if (import.meta.env.DEV) return;
          if (!navigator.onLine) return;
          try {
            const response = await fetch(`/version.json?t=${Date.now()}`, {
              cache: 'no-store',
              headers: { 'cache-control': 'no-cache', 'pragma': 'no-cache' },
            });
            if (response.ok) {
              const data = await response.json();
              if (data.version && data.version !== __APP_VERSION__) {
                console.log(`[Version] New build: ${data.version} (local: ${__APP_VERSION__})`);
                await reg.update();
              }
            }
          } catch {
            // silently fail — version check is best-effort
          }
        };

        checkVersionJson(r);
        setInterval(() => checkVersionJson(r), 60_000);
      }
    });
  }).catch((err: unknown) => {
    console.warn('[PWA] Could not import pwa-register module:', err);
  });
}
