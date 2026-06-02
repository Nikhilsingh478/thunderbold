import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, RefreshCw, X, Zap } from 'lucide-react';

type PromptType = 'offline-ready' | 'update-available' | null;

export default function PWAUpdatePrompt() {
  const [type, setType] = useState<PromptType>(null);
  const updateSWRef = useRef<((reloadPage?: boolean) => Promise<void>) | null>(null);

  useEffect(() => {
    // Offline-ready notification
    const onOffline = () => {
      setType('offline-ready');
      setTimeout(() => setType(null), 4000);
    };
    window.addEventListener('pwa-offline-ready', onOffline);

    // Update-available notification (dispatched from main.tsx)
    const onUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.updateSW) updateSWRef.current = detail.updateSW;
      setType('update-available');
    };
    window.addEventListener('pwa-update-available', onUpdate);

    // Fallback: listen for SW controller change (fires when new SW activates)
    let refreshing = false;
    const onControllerChange = () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    };
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);
    }

    return () => {
      window.removeEventListener('pwa-offline-ready', onOffline);
      window.removeEventListener('pwa-update-available', onUpdate);
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
      }
    };
  }, []);

  const handleRefresh = async () => {
    if (updateSWRef.current) {
      await updateSWRef.current(true);
    } else {
      window.location.reload();
    }
    setType(null);
  };

  const config = {
    'offline-ready': {
      icon: <WifiOff className="w-4 h-4 text-green-400" />,
      iconBg: 'rgba(74,222,128,0.10)',
      title: 'Ready for Offline',
      body: 'App cached and available offline.',
      action: null,
    },
    'update-available': {
      icon: <Zap className="w-4 h-4 text-brass" />,
      iconBg: 'rgba(212,170,48,0.10)',
      title: 'Update Available',
      body: 'A new version of Thunderbold is ready.',
      action: { label: 'Refresh', onClick: handleRefresh },
    },
  };

  const active = type ? config[type] : null;

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.97 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9000] w-[calc(100vw-2rem)] max-w-sm"
          role="alert"
        >
          <div
            className="rounded-xl px-4 py-3 flex items-center gap-3 shadow-2xl"
            style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.10)' }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: active.iconBg }}
            >
              {active.icon}
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-condensed text-xs font-bold tracking-[0.1em] uppercase text-white">
                {active.title}
              </p>
              <p className="font-condensed text-[0.63rem] mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                {active.body}
              </p>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              {active.action && (
                <button
                  onClick={active.action.onClick}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg font-condensed text-[0.65rem] tracking-[0.12em] uppercase font-bold text-black bg-brass hover:bg-yellow-400 transition-colors duration-200"
                >
                  <RefreshCw className="w-3 h-3" />
                  {active.action.label}
                </button>
              )}
              <button
                onClick={() => setType(null)}
                className="p-1 flex-shrink-0 ml-1"
                style={{ color: 'rgba(255,255,255,0.35)' }}
                aria-label="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
