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
  import('virtual:pwa-register').then(({ registerSW }) => {
    const updateSW = registerSW({
      onNeedRefresh() {
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
    });
  }).catch((err: unknown) => {
    console.warn('[PWA] Could not import pwa-register module:', err);
  });
}
