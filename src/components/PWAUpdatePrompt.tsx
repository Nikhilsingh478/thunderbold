import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, X } from 'lucide-react';

export default function PWAUpdatePrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onOffline = () => {
      setShow(true);
      setTimeout(() => setShow(false), 4000);
    };
    window.addEventListener('pwa-offline-ready', onOffline);
    return () => window.removeEventListener('pwa-offline-ready', onOffline);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.97 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9000] w-[calc(100vw-2rem)] max-w-xs"
          role="alert"
        >
          <div
            className="rounded-xl px-4 py-3 flex items-center gap-3 shadow-2xl"
            style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(74,222,128,0.1)' }}>
              <WifiOff className="w-4 h-4 text-green-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-condensed text-xs font-bold tracking-[0.1em] uppercase text-white">
                Ready for Offline
              </p>
              <p className="font-condensed text-[0.63rem] mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
                App cached and ready to use offline.
              </p>
            </div>
            <button onClick={() => setShow(false)} className="p-1 flex-shrink-0"
              style={{ color: 'rgba(255,255,255,0.35)' }}>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
