import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, ShieldAlert } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import { isStandaloneApp } from '../context/NotificationsContext';
import { toast } from 'sonner';

/**
 * Premium in-app notification permission prompt.
 * Only triggers inside the installed mobile app (TWA / standalone display mode).
 * Never shown on standard website browsers.
 */
export default function NotificationPermissionPrompt() {
  const { shouldPrompt, setShouldPrompt, triggerPrompt, registerToken } = useNotifications();
  const [showDeniedGuide, setShowDeniedGuide] = useState(false);

  useEffect(() => {
    // Only schedule prompt if running inside the installed app
    if (!isStandaloneApp()) return;
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    // Trigger prompt 2.5 seconds after app startup if permission not yet granted
    const timer = setTimeout(() => {
      triggerPrompt();
    }, 2500);

    return () => clearTimeout(timer);
  }, [triggerPrompt]);

  const handleEnable = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setShouldPrompt(false);
      return;
    }

    // Case 1: Permission is already denied in device/browser settings
    if (Notification.permission === 'denied') {
      setShowDeniedGuide(true);
      return;
    }

    // Case 2: Permission is 'default' -> Request native browser/system permission
    try {
      const result = await Notification.requestPermission();

      if (result === 'granted') {
        setShouldPrompt(false);
        toast.success('Order & status notifications enabled! ⚡', {
          description: 'You will receive real-time updates on your purchases.',
        });
        // Register token if user is signed in
        await registerToken();
      } else if (result === 'denied') {
        setShowDeniedGuide(true);
      } else {
        // User closed or dismissed native prompt without choosing
        setShouldPrompt(false);
      }
    } catch (err) {
      console.error('[Notifications] Failed to request permission:', err);
      setShouldPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShouldPrompt(false);
    setShowDeniedGuide(false);
    try {
      localStorage.setItem('tb_notif_prompt_dismissed', Date.now().toString());
    } catch {}
  };

  // Only render if running inside the standalone app AND shouldPrompt is active
  if (!isStandaloneApp() || !shouldPrompt) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-[200] flex items-center justify-center p-4">
        <motion.div
          key="notif-prompt-modal"
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 15 }}
          transition={{ type: 'spring', stiffness: 380, damping: 28 }}
          className="w-full max-w-sm bg-[#121212] border border-white/10 rounded-2xl p-6 shadow-2xl overflow-hidden relative"
        >
          {/* Subtle Ambient Accent Glow */}
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-brass/10 rounded-full blur-2xl pointer-events-none" />

          {/* Close Icon */}
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 p-1.5 rounded-full text-sv-mid hover:text-tb-white hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          {!showDeniedGuide ? (
            /* Standard Permission Request View */
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center mb-4 text-brass shadow-inner">
                <Bell className="w-7 h-7 animate-pulse" />
              </div>

              <h3 className="font-display text-lg tracking-[0.06em] text-tb-white uppercase leading-tight mb-2">
                Enable App Notifications
              </h3>
              <p className="font-condensed text-xs text-sv-mid leading-relaxed mb-6 px-1">
                Stay updated on your orders in real time. Get instant status alerts when your denim is confirmed, packed, and out for delivery.
              </p>

              <div className="flex flex-col gap-2.5 w-full">
                <button
                  onClick={handleEnable}
                  className="w-full py-3 text-xs font-condensed font-bold uppercase tracking-[0.14em] text-void bg-tb-white rounded-xl hover:bg-white active:scale-[0.98] transition-all shadow-lg"
                >
                  Enable Notifications
                </button>
                <button
                  onClick={handleDismiss}
                  className="w-full py-2.5 text-xs font-condensed font-medium uppercase tracking-[0.12em] text-sv-mid hover:text-tb-white transition-colors"
                >
                  Not Now
                </button>
              </div>
            </div>
          ) : (
            /* Denied Instructions View */
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4 text-amber-400">
                <ShieldAlert className="w-7 h-7" />
              </div>

              <h3 className="font-display text-lg tracking-[0.06em] text-tb-white uppercase leading-tight mb-2">
                Notifications Blocked
              </h3>
              <p className="font-condensed text-xs text-sv-mid leading-relaxed mb-4">
                Notifications are currently disabled for Thunderbold in your device settings.
              </p>

              <div className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-3.5 text-left mb-5 font-condensed text-xs text-sv-bright space-y-1.5">
                <div className="font-bold text-tb-white mb-1">To enable notifications:</div>
                <div className="flex items-start gap-2">
                  <span className="text-brass">1.</span> Open phone <strong className="text-tb-white">Settings</strong>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-brass">2.</span> Go to <strong className="text-tb-white">Apps & Notifications</strong>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-brass">3.</span> Select <strong className="text-tb-white">Thunderbold</strong> → <strong className="text-tb-white">Notifications</strong>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-brass">4.</span> Toggle <strong className="text-amber-400">Allow Notifications ON</strong>
                </div>
              </div>

              <button
                onClick={handleDismiss}
                className="w-full py-3 text-xs font-condensed font-bold uppercase tracking-[0.14em] text-void bg-tb-white rounded-xl hover:bg-white transition-colors"
              >
                Got It
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

