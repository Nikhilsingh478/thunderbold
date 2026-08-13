import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';

export default function AppUpdatePrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [playStoreUrl, setPlayStoreUrl] = useState(
    'https://play.google.com/store/apps/details?id=shop.thunderbold.app'
  );
  const [currentVersionCode, setCurrentVersionCode] = useState(0);

  useEffect(() => {
    // 1. Session check: if already shown this session, skip
    if (sessionStorage.getItem('update_prompt_shown_this_session') === 'true') {
      return;
    }

    let timerId: ReturnType<typeof setTimeout> | null = null;

    const checkAppVersion = async () => {
      let versionNum = 0;

      // 2a. Native Capacitor platform version check
      if (Capacitor.isNativePlatform()) {
        try {
          const info = await App.getInfo();
          versionNum = parseInt(info.build || '0', 10);
        } catch {
          versionNum = 0;
        }
      }

      // 2b. URL params fallback for TWA / Web
      if (!versionNum || isNaN(versionNum) || versionNum <= 0) {
        const params = new URLSearchParams(window.location.search);
        const rawVersion = params.get('app_version');
        versionNum = parseInt(rawVersion || '0', 10);
      }

      // If 0, NaN, or not present → web browser visit. Do NOT show prompt.
      if (!versionNum || isNaN(versionNum) || versionNum <= 0) {
        return;
      }

      setCurrentVersionCode(versionNum);

      // 3. Clear stale dismiss state if stored dismissed version < current app version
      let dismissedFor = localStorage.getItem('thunderbold_update_dismissed_for');
      if (dismissedFor && parseInt(dismissedFor, 10) < versionNum) {
        localStorage.removeItem('thunderbold_update_dismissed_for');
        dismissedFor = null;
      }

      // 4. Fetch /app-version.json with cache busting
      try {
        const r = await fetch(`/app-version.json?t=${Date.now()}`, { cache: 'no-store' });
        if (!r.ok) throw new Error('Failed to fetch app-version.json');
        const data = await r.json();

        const latestVersionCode = parseInt(data.latestVersionCode, 10);
        if (data.playStoreUrl) {
          setPlayStoreUrl(data.playStoreUrl);
        }

        const currentDismissedFor = localStorage.getItem('thunderbold_update_dismissed_for');
        const alreadyDismissed = currentDismissedFor === String(versionNum);

        const shouldShow =
          versionNum > 0 &&
          !isNaN(latestVersionCode) &&
          latestVersionCode > versionNum &&
          !alreadyDismissed;

        if (import.meta.env.DEV) {
          console.log('[AppUpdatePrompt]', {
            currentVersionCode: versionNum,
            latestVersionCode,
            dismissedFor: currentDismissedFor,
            shouldShow,
          });
        }

        if (shouldShow) {
          sessionStorage.setItem('update_prompt_shown_this_session', 'true');
          timerId = setTimeout(() => {
            setShowPrompt(true);
          }, 3000);
        }
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error('[AppUpdatePrompt] Fetch error:', err);
        }
      }
    };

    checkAppVersion();

    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, []);

  const handleUpdate = () => {
    if (currentVersionCode > 0) {
      localStorage.setItem('thunderbold_update_dismissed_for', String(currentVersionCode));
    }
    window.open(playStoreUrl, '_blank');
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    if (currentVersionCode > 0) {
      localStorage.setItem('thunderbold_update_dismissed_for', String(currentVersionCode));
    }
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

