import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, X, RefreshCw } from 'lucide-react';

export default function AppUpdatePrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [playStoreUrl, setPlayStoreUrl] = useState('https://play.google.com/store/apps/details?id=shop.thunderbold.twa');

  useEffect(() => {
    // Detect if running inside the Android TWA app wrapper
    const isAndroidTWA = document.referrer.startsWith('android-app://') 
                      || window.location.search.includes('utm_source=twa')
                      || localStorage.getItem('tb_is_twa') === 'true';

    if (isAndroidTWA) {
      localStorage.setItem('tb_is_twa', 'true');
      
      // Parse the native app version code from the URL parameters (if present)
      const params = new URLSearchParams(window.location.search);
      const appVersion = params.get('app_version');
      if (appVersion) {
        localStorage.setItem('tb_native_app_version', appVersion);
      }

      // Read current local version code. Default to 2 (since the previous version was 2)
      const currentVersion = parseInt(localStorage.getItem('tb_native_app_version') || '2', 10);

      // Fetch the latest version code from the server
      fetch('/app-version.json')
        .then((r) => r.json())
        .then((data) => {
          const latestVersion = parseInt(data.latestVersionCode, 10);
          if (latestVersion && currentVersion < latestVersion) {
            if (data.playStoreUrl) {
              setPlayStoreUrl(data.playStoreUrl);
            }
            setShowPrompt(true);
          }
        })
        .catch((err) => {
          console.error('Failed to check app version:', err);
        });
    }
  }, []);

  const handleUpdate = () => {
    window.open(playStoreUrl, '_blank');
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <div className="fixed bottom-20 left-0 right-0 z-[9000] flex justify-center pointer-events-none px-4">
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-auto w-full max-w-sm"
            role="alert"
          >
            <div
              className="rounded-xl px-4 py-3 flex items-center gap-3 shadow-2xl"
              style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.10)' }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(212,170,48,0.10)' }}
              >
                <Zap className="w-4 h-4 text-brass" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-condensed text-xs font-bold tracking-[0.1em] uppercase text-white">
                  App Update Available
                </p>
                <p className="font-condensed text-[0.63rem] mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  A new version of the Thunderbold app is available on the Play Store.
                </p>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={handleUpdate}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg font-condensed text-[0.65rem] tracking-[0.12em] uppercase font-bold text-black bg-brass hover:bg-yellow-400 transition-colors duration-200"
                >
                  <RefreshCw className="w-3 h-3 animate-spin-slow" />
                  Update
                </button>
                <button
                  onClick={() => setShowPrompt(false)}
                  className="p-1 flex-shrink-0 ml-1"
                  style={{ color: 'rgba(255,255,255,0.35)' }}
                  aria-label="Dismiss"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
