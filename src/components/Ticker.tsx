import { motion } from 'framer-motion';

const items = [
  'Built for the Bold',
  'Strength in Every Stitch',
  'Engineered for Life',
  'Your Armor for Every Challenge',
  'Premium Denim. Uncompromised.',
  'Drawer Series No. 1',
];

const Ticker = () => (
  <div className="w-full bg-surface border-t border-b border-sb py-3 overflow-hidden">
    <motion.div
      className="flex whitespace-nowrap"
      animate={{ x: ['0%', '-50%'] }}
      transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
    >
      {[...items, ...items].map((text, i) => (
        <span key={i} className="font-condensed font-semibold text-sv-mid uppercase text-xs md:text-sm tracking-[0.18em] mx-6 flex-shrink-0">
          {text}
          <span className="ml-6 text-sv-dim">·</span>
        </span>
      ))}
    </motion.div>
  </div>
);

export default Ticker;
