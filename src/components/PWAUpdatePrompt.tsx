import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, WifiOff, X } from 'lucide-react';

type PromptType = 'update' | 'offline-ready' | null;

/**
 * PWAUpdatePrompt — non-intrusive toast for PWA lifecycle events.
 *
 * Listens for two custom events dispatched by main.tsx:
 *  - 'pwa-update-available'  → show "Update available" prompt
 *  - 'pwa-offline-ready'     → show "Ready for offline use" confirmation
 *
 * The user can choose when to apply an update (no forced mid-checkout reloads).
 * The offline-ready notice auto-dismisses after 4 seconds.
 */
export default function PWAUpdatePrompt() {
  const [type, setType] = useState<PromptType>(null);
  const [updateFn, setUpdateFn] = useState<(() => void) | null>(null);

  useEffect(() => {
    const onUpdate = (e: Event) => {
      const fn = (e as CustomEvent<() => void>).detail;
      setUpdateFn(() => fn);
      setType('update');
    };

    const onOffline = () => {
      setType('offline-ready');
      // Auto-dismiss offline-ready notice
      setTimeout(() => setType(null), 4000);
    };

    window.addEventListener('pwa-update-available', onUpdate);
    window.addEventListener('pwa-offline-ready', onOffline);
    return () => {
      window.removeEventListener('pwa-update-available', onUpdate);
      window.removeEventListener('pwa-offline-ready', onOffline);
    };
  }, []);

  const handleUpdate = () => {
    updateFn?.();
    setType(null);
  };

  const handleDismiss = () => setType(null);

  if (!type) return null;

  return (
    <AnimatePresence>
      {type && (
        <motion.div
          key={type}
          initial={{ opacity: 0, y: 80, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 60, scale: 0.96 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9000] w-[calc(100vw-2rem)] max-w-sm"
          role="alert"
          aria-live="polite"
        >
          <div className="bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3.5 shadow-2xl flex items-center gap-3">
            <div className="shrink-0 w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
              {type === 'update'
                ? <RefreshCw className="w-4 h-4 text-brass" />
                : <WifiOff className="w-4 h-4 text-green-400" />
              }
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-condensed text-xs font-semibold tracking-[0.1em] uppercase text-tb-white">
                {type === 'update' ? 'Update Available' : 'Ready for Offline'}
              </p>
              <p className="font-condensed text-[0.65rem] text-sv-mid tracking-wide mt-0.5">
                {type === 'update'
                  ? 'A new version of the app is ready.'
                  : 'App is cached and ready to use offline.'}
              </p>
            </div>

            {type === 'update' && (
              <button
                onClick={handleUpdate}
                className="shrink-0 font-condensed text-[0.62rem] font-bold tracking-[0.14em] uppercase px-3 py-1.5 bg-white text-black rounded-lg hover:bg-white/90 transition-colors"
              >
                Refresh
              </button>
            )}

            <button
              onClick={handleDismiss}
              aria-label="Dismiss"
              className="shrink-0 p-1 text-sv-mid hover:text-tb-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
