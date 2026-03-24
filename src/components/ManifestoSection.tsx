import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import jeansProduct from '@/assets/jeans.webp';

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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-0 items-center md:items-stretch">
        {/* Image — on top on mobile, right on desktop */}
        <motion.div {...reveal} className="relative overflow-hidden w-full h-[55vw] min-h-[260px] md:order-2 md:h-auto md:min-h-[580px]">
          <motion.img
            src={jeansProduct}
            alt="Thunderbolt deep navy indigo jeans"
            width="1024"
            height="842"
            className="w-full h-[115%] object-cover md:absolute md:inset-0 md:w-full md:h-full md:object-[center_top]"
            style={{
              y: imgY,
              willChange: 'transform',
              filter: 'brightness(0.82) contrast(1.1)',
            }}
            loading="lazy"
          />
          {/* Left-edge gradient for desktop blending */}
          <div
            className="hidden md:block absolute left-0 top-0 bottom-0 w-36 pointer-events-none"
            style={{ background: 'linear-gradient(90deg, #0c0c0c 0%, transparent 100%)' }}
          />
          {/* Bottom gradient fade */}
          <div
            className="absolute bottom-0 left-0 right-0 h-24 md:h-28 pointer-events-none"
            style={{ background: 'linear-gradient(0deg, #0c0c0c, transparent)' }}
          />
          {/* Floating badge */}
          <div className="absolute top-5 right-5 md:top-6 md:right-6 font-condensed font-semibold text-[0.58rem] tracking-[0.25em] uppercase text-brass px-3 py-1.5 md:py-1.5 border border-brass/30" style={{ background: 'rgba(7,7,7,0.8)' }}>
            Premium Denim
          </div>
        </motion.div>

        {/* Text — overlaps image on mobile */}
        <motion.div {...reveal} className="-mt-16 md:mt-0 relative z-10 md:order-1 md:pr-14 md:py-6" transition={{ ...reveal.transition, delay: 0.18 }}>
          <div className="font-condensed font-semibold uppercase text-sv-mid flex items-center gap-3 mb-6" style={{ fontSize: '0.66rem', letterSpacing: '0.38em' }}>
            <span className="w-4 h-px bg-brass-dim inline-block" />
            Our Manifesto
          </div>
          <h2 className="font-display text-tb-white uppercase" style={{ fontSize: 'clamp(2.8rem, 10vw, 5.2rem)', lineHeight: 0.92, letterSpacing: '0.02em' }}>
            FORGED<br />FOR THE<br /><span className="brass-text">BOLD</span>
          </h2>
          <div className="font-body font-light text-sv-mid max-w-[440px] md:max-w-[420px] mt-7 md:mt-6 space-y-4" style={{ fontSize: '1.04rem', lineHeight: 1.82 }}>
            <p>We build premium denim for those who expect more from their everyday wear. Thunderbolt jeans are engineered to handle daily use while maintaining a clean, modern look.</p>
            <p>Constructed with advanced stretch fabric, they move with you and retain their shape over time. The right balance of immediate fit and long-term durability.</p>
            <p>No shortcuts. No compromises. Just reliable, well-built jeans designed for work, travel, and everyday wear.</p>
          </div>

          {/* Quote card */}
          <div className="bg-surface border-l-2 border-brass/40 pl-5 md:pl-6 py-4 md:py-5 mt-8">
            <blockquote className="font-serif italic font-light text-tb-off mb-3" style={{ fontSize: 'clamp(1rem, 2vw, 1.22rem)', lineHeight: 1.62 }}>
              &ldquo;Engineered to handle daily wear while keeping a sharp, modern look.&rdquo;
            </blockquote>
            <cite className="font-condensed not-italic font-semibold text-[0.64rem] md:text-[0.66rem] tracking-[0.22em] uppercase text-brass block">
              — Premium Stretch Denim
            </cite>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ManifestoSection;
