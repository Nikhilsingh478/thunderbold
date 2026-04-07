import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import brassButton from '../assets/brass_button.webp';

const reveal = {
  initial: { opacity: 0, y: 36 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' } as const,
  // Increased base delay so the image is visible for a significant time first
  transition: { duration: 0.85, ease: [0.16, 1, 0.3, 1] as const, delay: 1.2 },
};

const BrassButtonSection = () => {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [1.1, 1.0, 1.15]);
  const imgOpacity = useTransform(scrollYProgress, [0, 0.15, 0.85, 1], [0, 1, 1, 0]);

  return (
    <section ref={ref} className="min-h-[100svh] md:min-h-[100vh] relative overflow-hidden flex items-end justify-center" style={{ background: '#0d1520' }}>
      {/* Image — fills entire section with 100% brightness initially */}
      <motion.div className="absolute inset-0" style={{ scale, opacity: imgOpacity }}>
        <img
          src={brassButton}
          alt="Thunderbolt brass button — Original Denim Supply"
          width="1920"
          height="1080"
          className="w-full h-full object-cover object-center"
          style={{ filter: 'saturate(1.2) contrast(1.1)' }}
          loading="lazy"
        />
      </motion.div>

      {/* Dynamic dark overlay that animates in to darken the image for text readability */}
      <motion.div
        className="absolute inset-0 bg-[#0d1520]"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 0.72 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 1.1 }}
      />

      {/* Top/bottom fades */}
      <div className="absolute inset-x-0 top-0 h-32 pointer-events-none z-0" style={{ background: 'linear-gradient(180deg, rgba(13,21,32,0.8), transparent)' }} />
      <div className="absolute inset-x-0 bottom-0 h-48 pointer-events-none z-0" style={{ background: 'linear-gradient(0deg, #0d1520, transparent)' }} />

      {/* Content — align bottom */}
      <div className="relative z-10 flex flex-col items-center justify-end min-h-[100svh] md:min-h-[100vh] text-center px-6 md:px-8 pb-16 md:pb-24 pt-32 w-full">
        {/* Label */}
        <motion.div
          {...reveal}
          className="font-condensed font-semibold text-[0.62rem] md:text-[0.66rem] tracking-[0.36em] md:tracking-[0.42em] uppercase text-brass flex items-center justify-center gap-4 md:gap-5 mb-8 md:mb-10 w-full"
        >
          <span className="w-8 md:w-10 h-px bg-brass/40" />
          Hardware · Original Denim Supply
          <span className="w-8 md:w-10 h-px bg-brass/40" />
        </motion.div>

        {/* Giant headline */}
        <motion.h2
          {...reveal}
          className="font-display mb-6 md:mb-7"
          style={{ fontSize: 'clamp(4.5rem, 16vw, 11rem)', lineHeight: 0.88 }}
          transition={{ ...reveal.transition, delay: 1.4 }}
        >
          <span className="block brass-text">EVERY</span>
          <span className="block text-tb-white drop-shadow-lg">DETAIL</span>
          <span className="block brass-text">MATTERS</span>
        </motion.h2>

        {/* Sub-copy */}
        <motion.p
          {...reveal}
          className="font-serif font-light text-sv max-w-[500px] md:max-w-[600px] mx-auto mb-10"
          style={{ fontSize: 'clamp(1rem, 2vw, 1.22rem)', lineHeight: 1.7 }}
          transition={{ ...reveal.transition, delay: 1.6 }}
        >
          A great pair of jeans comes down to how it is built. We combine strong materials with precise construction to ensure your denim lasts longer.
        </motion.p>
        
        {/* Feature Grid */}
        <motion.div
           {...reveal}
           className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 text-left max-w-[800px] mx-auto px-4"
           transition={{ ...reveal.transition, delay: 1.8 }}
        >
          <div>
            <span className="block font-condensed font-bold text-tb-white tracking-widest uppercase mb-1">Reinforced Construction</span>
            <span className="block font-body text-sm text-sv-mid">Heavy-duty stitching on high-stress seams.</span>
          </div>
          <div>
            <span className="block font-condensed font-bold text-tb-white tracking-widest uppercase mb-1">Durable Hardware</span>
            <span className="block font-body text-sm text-sv-mid">Custom metal rivets and strong zippers.</span>
          </div>
          <div>
            <span className="block font-condensed font-bold text-tb-white tracking-widest uppercase mb-1">Premium Materials</span>
            <span className="block font-body text-sm text-sv-mid">Stretch denim that retains its shape over time.</span>
          </div>
          <div>
            <span className="block font-condensed font-bold text-tb-white tracking-widest uppercase mb-1">Clean Finishing</span>
            <span className="block font-body text-sm text-sv-mid">Smooth interior seams for a comfortable feel.</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default BrassButtonSection;
