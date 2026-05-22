import { useState } from 'react';
import { motion } from 'framer-motion';

interface LightningRatingProps {
  /** Current rating value (1–5). Use 0 to indicate "no selection". */
  value: number;
  /** Called when the user clicks a bolt. Omit (or pass `readonly`) to disable interaction. */
  onChange?: (rating: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_MAP = {
  sm: 'w-4 h-4',
  md: 'w-7 h-7',
  lg: 'w-10 h-10',
} as const;

const GAP_MAP = {
  sm: 'gap-1',
  md: 'gap-1.5',
  lg: 'gap-2',
} as const;

/**
 * Lightning-bolt rating control.
 * Empty bolts on rest, brass-filled on hover-preview / selection.
 * Hover lights up everything up-to and including the hovered bolt;
 * leaving the row reverts to the locked `value`.
 */
export default function LightningRating({
  value,
  onChange,
  readonly = false,
  size = 'md',
}: LightningRatingProps) {
  const [hover, setHover] = useState(0);
  const display = hover || value;
  const interactive = !readonly && typeof onChange === 'function';

  return (
    <div
      className={`flex items-center ${GAP_MAP[size]}`}
      onMouseLeave={() => interactive && setHover(0)}
      role={interactive ? 'radiogroup' : undefined}
      aria-label="Rating"
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const isFilled = n <= display;
        return (
          <motion.button
            key={n}
            type="button"
            disabled={!interactive}
            onMouseEnter={() => interactive && setHover(n)}
            onClick={() => interactive && onChange!(n)}
            whileTap={interactive ? { scale: 0.85 } : undefined}
            whileHover={interactive ? { scale: 1.1 } : undefined}
            transition={{ type: 'spring', stiffness: 400, damping: 18 }}
            className={`${interactive ? 'cursor-pointer' : 'cursor-default'} bg-transparent border-0 p-0 outline-none focus-visible:ring-2 focus-visible:ring-brass/60 rounded`}
            aria-label={`${n} bolt${n > 1 ? 's' : ''}`}
            aria-checked={interactive ? n === value : undefined}
            role={interactive ? 'radio' : undefined}
          >
            <BoltIcon
              filled={isFilled}
              className={`${SIZE_MAP[size]} transition-colors duration-150 ${
                isFilled ? 'text-brass' : 'text-white/25'
              }`}
            />
          </motion.button>
        );
      })}
    </div>
  );
}

function BoltIcon({ filled, className }: { filled: boolean; className?: string }) {
  // Lightning bolt path — same shape for both states; fill toggles the look.
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinejoin="round"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />
    </svg>
  );
}
