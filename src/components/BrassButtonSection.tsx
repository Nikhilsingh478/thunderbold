import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import brassButton from '@/assets/brass-button.png';

const reveal = {
  initial: { opacity: 0, y: 36 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' } as const,
  transition: { duration: 0.85, ease: [0.16, 1, 0.3, 1] as const },
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
    <section ref={ref} className="min-h-[100svh] relative overflow-hidden flex items-center justify-center" style={{ background: '#0d1520' }}>
      {/* Image — fills entire section */}
      <motion.div className="absolute inset-0" style={{ scale, opacity: imgOpacity }}>
        <img
          src={brassButton}
          alt="Thunderbolt brass button — Original Denim Supply"
          className="w-full h-full object-cover"
          style={{ filter: 'brightness(0.65) saturate(1.2) contrast(1.1)' }}
          loading="lazy"
        />
      </motion.div>

      {/* Vignette */}
      <div className="absolute inset-0 img-vignette pointer-events-none" />
      {/* Top/bottom fades */}
      <div className="absolute inset-x-0 top-0 h-32 pointer-events-none" style={{ background: 'linear-gradient(180deg, #0d1520, transparent)' }} />
      <div className="absolute inset-x-0 bottom-0 h-32 pointer-events-none" style={{ background: 'linear-gradient(0deg, #0d1520, transparent)' }} />

      {/* Content */}
      <div className="relative z-10 text-center px-6">
        {/* Label */}
        <motion.div
          {...reveal}
          className="font-condensed font-semibold text-[0.64rem] tracking-[0.36em] uppercase text-brass/70 flex items-center justify-center gap-3 mb-8"
        >
          <span className="w-5 h-px bg-brass-dim inline-block" />
          Hardware · Original Denim Supply
          <span className="w-5 h-px bg-brass-dim inline-block" />
        </motion.div>

        {/* Giant headline */}
        <motion.h2
          {...reveal}
          className="font-display text-tb-white"
          style={{ fontSize: 'clamp(3.5rem, 16vw, 12rem)', lineHeight: 0.88 }}
          transition={{ ...reveal.transition, delay: 0.12 }}
        >
          <span className="block">EVERY</span>
          <span className="block">
            <span className="brass-text">DETAIL</span>
          </span>
          <span className="block">MATTERS</span>
        </motion.h2>

        {/* Sub-copy */}
        <motion.p
          {...reveal}
          className="font-serif italic font-light text-tb-off/70 mt-6 max-w-[400px] mx-auto"
          style={{ fontSize: 'clamp(0.95rem, 2vw, 1.2rem)', lineHeight: 1.72 }}
          transition={{ ...reveal.transition, delay: 0.24 }}
        >
          Precision hardware. Forged for those who notice the difference.
        </motion.p>

        {/* Bottom arc text */}
        <motion.div
          {...reveal}
          className="font-condensed font-semibold text-[0.6rem] tracking-[0.32em] uppercase text-brass-dim/60 mt-10"
          transition={{ ...reveal.transition, delay: 0.36 }}
        >
          THUNDERBOLT · ORIGINAL DENIM SUPPLY · EST. 2024
        </motion.div>
      </div>
    </section>
  );
};

export default BrassButtonSection;
