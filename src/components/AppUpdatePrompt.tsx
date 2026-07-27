import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap } from 'lucide-react';

export default function AppUpdatePrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [playStoreUrl, setPlayStoreUrl] = useState('https://play.google.com/store/apps/details?id=shop.thunderbold.twa');

  useEffect(() => {
    // If the user has already interacted with the update prompt in this session, don't show it again
    if (sessionStorage.getItem('tb_update_dismissed') === 'true') {
      return;
    }

    // Detect if running inside the Android TWA app wrapper.
    // Note: Version 3 was compiled without utm_source=twa in the Start URL,
    // so we also check display-mode: standalone as a reliable TWA/PWA signal.
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
                      || window.matchMedia('(display-mode: fullscreen)').matches;
    const isAndroidTWA = document.referrer.startsWith('android-app://') 
                      || window.location.search.includes('utm_source=twa')
                      || localStorage.getItem('tb_is_twa') === 'true'
                      || isStandalone;

    if (isAndroidTWA) {
      localStorage.setItem('tb_is_twa', 'true');
      
      // Parse the native app version code from the URL parameters (if present)
      const params = new URLSearchParams(window.location.search);
      const appVersion = params.get('app_version');
      if (appVersion) {
        localStorage.setItem('tb_native_app_version', appVersion);
      }

      // Read current local version code. Default to 5 (since Version 5 was previously built)
      const currentVersion = parseInt(localStorage.getItem('tb_native_app_version') || '5', 10);

      // Fetch the latest version code — bypass service worker cache entirely
      fetch('/app-version.json', { cache: 'no-store' })
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
    sessionStorage.setItem('tb_update_dismissed', 'true'); // Hide for the rest of this session
    setShowPrompt(false); // Hide prompt immediately once the user clicks update
  };

  const handleDismiss = () => {
    sessionStorage.setItem('tb_update_dismissed', 'true'); // Hide for the rest of this session
    setShowPrompt(false);
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleDismiss}
            className="absolute inset-0 bg-black/75 backdrop-blur-md"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-sm overflow-hidden rounded-2xl border border-white/10 bg-[#0c0c0c] p-6 shadow-2xl flex flex-col items-center text-center"
          >
            {/* Top Accent Icon with Glow */}
            <div className="relative mb-5 flex items-center justify-center">
              <div className="absolute inset-0 scale-150 rounded-full bg-brass/10 blur-xl" />
              <div className="w-12 h-12 rounded-full border border-brass/35 bg-brass/10 flex items-center justify-center z-10">
                <Zap className="w-6 h-6 text-brass animate-pulse" />
              </div>
            </div>

            {/* Typography */}
            <h3 className="font-display text-xl tracking-[0.12em] uppercase text-white mb-2">
              New Update Available
            </h3>
            <p className="font-condensed text-xs tracking-wide text-zinc-400 max-w-[280px] leading-relaxed mb-6">
              A newer, faster version of the Thunderbold app is available on the Google Play Store. Update now to enjoy the latest collections and speed optimizations.
            </p>

            {/* Buttons */}
            <div className="w-full flex flex-col gap-2.5">
              <button
                onClick={handleUpdate}
                className="w-full py-3 rounded-xl font-condensed text-xs tracking-[0.16em] uppercase font-bold text-black bg-brass hover:bg-yellow-400 active:scale-[0.98] transition-all duration-200 shadow-[0_4px_20px_rgba(212,170,48,0.2)]"
              >
                Update Now
              </button>
              <button
                onClick={handleDismiss}
                className="w-full py-2.5 rounded-xl font-condensed text-xs tracking-[0.16em] uppercase font-semibold text-zinc-500 hover:text-zinc-300 transition-colors duration-200"
              >
                Maybe Later
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
