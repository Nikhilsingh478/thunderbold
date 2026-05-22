import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const DISPLAY_MS = 2000;

function BoltSVG({ size = 52, color = 'white' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M13.2 2.5L4.8 13.2C4.6 13.5 4.8 14 5.2 14H11L9.8 21.2C9.7 21.8 10.5 22.1 10.9 21.6L19.2 10.8C19.4 10.5 19.2 10 18.8 10H13L14.2 2.8C14.3 2.2 13.6 1.9 13.2 2.5Z"
        fill={color}
      />
    </svg>
  );
}

/**
 * SplashScreen — cinematic branded intro shown once per browser session.
 *
 * Shows on first page load only (sessionStorage flag prevents repeat).
 * Renders above everything (z-[9999]) and fades out after DISPLAY_MS.
 * Does not block or delay route rendering — it overlays the app.
 */
export default function SplashScreen() {
  const [visible, setVisible] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return !sessionStorage.getItem('tb_splash_shown');
  });

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => {
      setVisible(false);
      sessionStorage.setItem('tb_splash_shown', 'true');
    }, DISPLAY_MS);
    return () => clearTimeout(timer);
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="splash"
          role="presentation"
          aria-hidden="true"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.65, ease: [0.4, 0, 0.2, 1] }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden select-none"
          style={{ backgroundColor: '#0a0a0a' }}
        >
          {/* Ambient radial glow — centred behind content */}
          <motion.div
            aria-hidden
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[28rem] h-[28rem] rounded-full pointer-events-none"
            style={{
              background:
                'radial-gradient(circle at center, rgba(217,119,6,0.07) 0%, transparent 68%)',
            }}
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.1, ease: 'easeOut' }}
          />

          {/* Lightning bolt icon with amber glow pulse */}
          <motion.div
            className="relative mb-6"
            initial={{ opacity: 0, scale: 0.5, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Blurred glow layer behind the bolt */}
            <motion.div
              aria-hidden
              className="absolute inset-0 blur-2xl pointer-events-none"
              animate={{ opacity: [0.35, 0.75, 0.35] }}
              transition={{ duration: 2.0, repeat: Infinity, ease: 'easeInOut' }}
            >
              <BoltSVG size={52} color="#d97706" />
            </motion.div>
            {/* Crisp white bolt on top */}
            <BoltSVG size={52} color="white" />
          </motion.div>

          {/* Brand name — expands letter-spacing on entry */}
          <motion.p
            className="font-display text-[1.3rem] text-white uppercase"
            style={{ letterSpacing: '0.45em' }}
            initial={{ opacity: 0, letterSpacing: '0.55em' }}
            animate={{ opacity: 1, letterSpacing: '0.32em' }}
            transition={{ delay: 0.18, duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
          >
            THUNDERBOLT
          </motion.p>

          {/* Tagline */}
          <motion.p
            className="font-condensed text-[0.57rem] text-white/22 uppercase mt-2"
            style={{ letterSpacing: '0.5em' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            PREMIUM DENIM
          </motion.p>

          {/* Progress sweep bar — full-width amber gradient at bottom */}
          <motion.div
            aria-hidden
            className="absolute bottom-0 left-0 h-[1.5px] pointer-events-none"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, #d97706 40%, #d97706 60%, transparent 100%)',
            }}
            initial={{ width: '0%', opacity: 0 }}
            animate={{ width: '100%', opacity: [0, 1, 1, 0.5] }}
            transition={{ delay: 0.3, duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
