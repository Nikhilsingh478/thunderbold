import { motion } from 'framer-motion';

const MESSAGE = "Delivery at your doorstep within 45 minutes.";
const SEPARATOR = "✦";
const REPEAT = 8;

const AnnouncementBar = () => {
  const items = Array.from({ length: REPEAT }, (_, i) => (
    <span key={i} className="flex items-center gap-5 flex-shrink-0">
      <span className="font-condensed font-semibold text-[0.65rem] md:text-[0.68rem] tracking-[0.22em] uppercase text-white/90 whitespace-nowrap">
        {MESSAGE}
      </span>
      <span className="text-[#c9a84c] text-[0.55rem] flex-shrink-0">{SEPARATOR}</span>
    </span>
  ));

  return (
    <div
      className="fixed top-0 left-0 w-full z-[120] h-9 flex items-center overflow-hidden"
      style={{ background: 'linear-gradient(90deg, #0a0a0a 0%, #111008 50%, #0a0a0a 100%)' }}
    >
      <div
        className="absolute bottom-0 left-0 w-full h-px"
        style={{ background: 'linear-gradient(90deg, transparent, #c9a84c44, #c9a84c88, #c9a84c44, transparent)' }}
      />

      <div className="relative flex w-full overflow-hidden">
        <motion.div
          className="flex items-center gap-5"
          animate={{ x: ['0%', '-50%'] }}
          transition={{
            duration: 45,
            ease: 'linear',
            repeat: Infinity,
          }}
          style={{ willChange: 'transform' }}
        >
          {items}
          {items}
        </motion.div>
      </div>
    </div>
  );
};

export default AnnouncementBar;
