import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../hooks/useNotifications';

/**
 * Premium slide-up notification permission prompt.
 * Shown 3 seconds after login for first-time users who haven't been prompted before.
 * Mounted once in AppContent — persists across route changes.
 */
export default function NotificationPermissionPrompt() {
  const { user } = useAuth();
  const { shouldPrompt, setShouldPrompt, triggerPrompt, registerToken } = useNotifications();

  useEffect(() => {
    if (!user) return;
    const timer = setTimeout(() => {
      triggerPrompt();
    }, 3000);
    return () => clearTimeout(timer);
  }, [user, triggerPrompt]);

  const handleEnable = async () => {
    setShouldPrompt(false);
    await registerToken();
  };

  const handleDismiss = () => {
    setShouldPrompt(false);
  };

  return (
    <AnimatePresence>
      {shouldPrompt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <motion.div
            key="notif-prompt"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            className="w-full max-w-sm bg-[#141414] border border-white/10 rounded-2xl p-5 shadow-2xl"
          >
            <div className="flex items-start gap-4">
              <div className="shrink-0 w-10 h-10 rounded-xl bg-brass/10 border border-brass/20 flex items-center justify-center">
                <Bell className="w-5 h-5 text-brass" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-display text-sm tracking-[0.06em] text-tb-white uppercase leading-tight mb-1">
                  Stay updated on your orders
                </p>
                <p className="font-condensed text-xs text-sv-mid leading-relaxed">
                  Get instant notifications when your order is confirmed, packed, and on its way.
                </p>
              </div>

              <button
                onClick={handleDismiss}
                className="shrink-0 p-1 rounded-full text-sv-mid hover:text-tb-white transition-colors"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={handleDismiss}
                className="flex-1 py-2.5 text-xs font-condensed font-semibold uppercase tracking-[0.12em] text-sv-mid bg-white/[0.05] border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
              >
                Not now
              </button>
              <button
                onClick={handleEnable}
                className="flex-1 py-2.5 text-xs font-condensed font-bold uppercase tracking-[0.12em] text-void bg-tb-white rounded-lg hover:bg-white transition-colors"
              >
                Enable
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
