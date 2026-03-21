import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import jeansProduct from '@/assets/jeans-product.png';

const reveal = {
  initial: { opacity: 0, y: 36 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' } as const,
  transition: { duration: 0.85, ease: [0.16, 1, 0.3, 1] as const },
};

const ManifestoSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });
  const imgY = useTransform(scrollYProgress, [0, 1], ['-8%', '8%']);

  return (
    <section id="manifesto" ref={sectionRef} className="max-w-[1340px] mx-auto px-6 py-24 md:px-16 md:py-36">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-24 items-center">
        {/* Image — on top on mobile */}
        <motion.div {...reveal} className="relative overflow-hidden w-full h-[55vw] min-h-[260px] md:order-2 md:h-[600px]">
          <motion.img
            src={jeansProduct}
            alt="Thunderbolt deep navy indigo jeans"
            className="w-full h-[115%] object-cover"
            style={{
              y: imgY,
              willChange: 'transform',
              filter: 'brightness(0.85) contrast(1.1)',
            }}
            loading="lazy"
          />
          {/* Bottom gradient fade */}
          <div
            className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
            style={{ background: 'linear-gradient(0deg, #0c0c0c, transparent)' }}
          />
          {/* Floating badge */}
          <div className="absolute top-5 right-5 font-condensed font-semibold text-[0.58rem] tracking-[0.20em] uppercase text-brass px-3 py-2 border border-brass/30" style={{ background: 'rgba(10,10,10,0.8)' }}>
            Premium Denim
          </div>
        </motion.div>

        {/* Text — overlaps image on mobile */}
        <motion.div {...reveal} className="-mt-16 md:mt-0 relative z-10 md:order-1" transition={{ ...reveal.transition, delay: 0.18 }}>
          <div className="font-condensed font-semibold uppercase text-sv-mid flex items-center gap-3 mb-6" style={{ fontSize: '0.66rem', letterSpacing: '0.38em' }}>
            <span className="w-4 h-px bg-brass-dim inline-block" />
            Our Manifesto
          </div>
          <h2 className="font-display text-tb-white" style={{ fontSize: 'clamp(2.8rem, 10vw, 5rem)', lineHeight: 0.92 }}>
            FORGED<br />FOR THE<br /><span className="brass-text">BOLD ONES</span>
          </h2>
          <p className="font-body font-light text-sv-mid max-w-[440px] mt-7" style={{ fontSize: '1.04rem', lineHeight: 1.82 }}>
            Thunderbolt was born from a singular conviction — that what you wear should be as unbreakable as your will. Every pair is a testament to mastery: the kind forged by time, discipline, and an obsession with the exceptional. We don't make jeans. We make armor.
          </p>

          {/* Quote card */}
          <div className="bg-surface border-l-2 border-brass/40 pl-5 py-4 mt-8">
            <blockquote className="font-serif italic font-light text-tb-off mb-3" style={{ fontSize: '1.1rem', lineHeight: 1.62 }}>
              &ldquo;This isn't just jeans; it's your armor for life's every challenge.&rdquo;
            </blockquote>
            <cite className="font-condensed not-italic font-semibold text-[0.64rem] tracking-[0.22em] uppercase text-brass block">
              — Thunderbolt · Built for the Bold
            </cite>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ManifestoSection;
