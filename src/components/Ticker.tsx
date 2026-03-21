import { motion } from 'framer-motion';

const items = [
  'Built for the Bold',
  'Original Denim Supply',
  '4-Way Stretch',
  'Strength in Every Stitch',
  'Your Armor for Every Challenge',
  'Feel the Power',
  'Embrace Comfort',
  'Be Bold',
  'Drawer Series No. 1',
];

const Ticker = () => (
  <div className="w-full bg-surface border-t border-b border-sb py-3 overflow-hidden">
    {/* Row 1 — left to right */}
    <motion.div
      className="flex whitespace-nowrap mb-1"
      animate={{ x: ['0%', '-50%'] }}
      transition={{ duration: 26, repeat: Infinity, ease: 'linear' }}
    >
      {[...items, ...items].map((text, i) => (
        <span key={`r1-${i}`} className="font-condensed font-semibold text-sv-mid uppercase text-[0.95rem] md:text-sm tracking-[0.18em] mx-5 flex-shrink-0">
          {text}
          <span className="ml-5 text-brass">⚡</span>
        </span>
      ))}
    </motion.div>
    {/* Row 2 — right to left */}
    <motion.div
      className="flex whitespace-nowrap"
      animate={{ x: ['-50%', '0%'] }}
      transition={{ duration: 32, repeat: Infinity, ease: 'linear' }}
    >
      {[...items, ...items].map((text, i) => (
        <span key={`r2-${i}`} className="font-condensed font-semibold text-sv-dim uppercase text-[0.72rem] tracking-[0.18em] mx-5 flex-shrink-0">
          {text}
          <span className="ml-5 text-sv-dim">·</span>
        </span>
      ))}
    </motion.div>
  </div>
);

export default Ticker;
