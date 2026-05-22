import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  format?: 'currency' | 'number';
  /** Order in the grid — used to stagger the entrance animation. */
  index?: number;
}

const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});
const numberFormatter = new Intl.NumberFormat('en-IN');

function format(n: number, mode: 'currency' | 'number') {
  if (!Number.isFinite(n)) return mode === 'currency' ? '₹0' : '0';
  return mode === 'currency' ? inrFormatter.format(Math.round(n)) : numberFormatter.format(Math.round(n));
}

/** Subtle count-up — matches the spec ("animated number count (subtle)"). */
function useCountUp(target: number, duration = 700) {
  const [value, setValue] = useState(0);
  const startRef = useRef<number | null>(null);
  const fromRef = useRef(0);

  useEffect(() => {
    if (typeof window === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setValue(target);
      return;
    }
    fromRef.current = value;
    startRef.current = null;
    let raf = 0;

    const tick = (ts: number) => {
      if (startRef.current === null) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const t = Math.min(1, elapsed / duration);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(fromRef.current + (target - fromRef.current) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration]);

  return value;
}

export default function StatsCard({ label, value, icon: Icon, format: mode = 'number', index = 0 }: StatsCardProps) {
  const animated = useCountUp(value);
  return (
    <motion.div
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.03, ease: [0.16, 1, 0.3, 1] }}
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5 md:p-6 transition-colors duration-300 hover:border-brass/40"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="font-condensed text-[11px] sm:text-xs uppercase tracking-[0.2em] text-sv-mid">
          {label}
        </p>
        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/30 text-brass">
          <Icon className="h-4 w-4" strokeWidth={1.75} />
        </div>
      </div>
      <p className="mt-3 sm:mt-5 font-display text-2xl sm:text-3xl md:text-4xl tracking-[0.04em] text-tb-white tabular-nums leading-none break-all">
        {format(animated, mode)}
      </p>
      {/* Soft brass underline accent */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-brass/40 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
    </motion.div>
  );
}
