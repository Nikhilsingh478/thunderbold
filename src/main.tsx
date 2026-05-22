import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

if ('serviceWorker' in navigator) {
  import('virtual:pwa-register').then(({ registerSW }) => {
    registerSW({
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
