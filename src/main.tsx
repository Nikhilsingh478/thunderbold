import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

/**
 * Service Worker Registration
 *
 * Uses vite-plugin-pwa's `virtual:pwa-register` helper.
 * Strategy: 'prompt' — the new SW installs but does NOT take control
 * immediately. We dispatch a custom event so the app can show a
 * non-intrusive "Update available" toast and let the user decide when
 * to refresh. This prevents forced reloads mid-checkout.
 *
 * In development mode (devOptions.enabled: false) the import resolves
 * to a no-op, so this code is completely inert during local dev.
 */
if ('serviceWorker' in navigator) {
  import('virtual:pwa-register').then(({ registerSW }) => {
    registerSW({
      /**
       * Called when a new SW version has been downloaded and is waiting.
       * The `reloadSW` function, when called, will tell the waiting SW to
       * skip waiting and take control, then reloads the page.
       */
      onNeedRefresh(reloadSW: () => void) {
        window.dispatchEvent(
          new CustomEvent<() => void>('pwa-update-available', { detail: reloadSW }),
        );
      },

      /**
       * Called when the app is fully cached for offline use.
       * Shows a brief confirmation toast — auto-dismissed after 4 s.
       */
      onOfflineReady() {
        window.dispatchEvent(new CustomEvent('pwa-offline-ready'));
      },

      /**
       * Registration errors are non-fatal — the app still works,
       * just without offline caching. Log for debugging only.
       */
      onRegisterError(error: unknown) {
        console.warn('[PWA] Service worker registration failed:', error);
      },
    });
  }).catch((err: unknown) => {
    console.warn('[PWA] Could not import pwa-register module:', err);
  });
}
