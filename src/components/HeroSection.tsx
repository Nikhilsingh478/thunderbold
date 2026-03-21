import { motion, useScroll, useTransform } from 'framer-motion';
import packagingBox from '@/assets/packaging-box.png';

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.14, delayChildren: 0.35 } },
};
const item = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
};

const HeroSection = () => {
  const { scrollY } = useScroll();
  const bgY = useTransform(scrollY, [0, 800], [0, 200]);
  const contentY = useTransform(scrollY, [0, 600], [0, 120]);

  return (
    <section className="min-h-[100svh] relative overflow-hidden flex items-end">
      {/* Background — packaging image */}
      <motion.div
        className="absolute inset-0"
        style={{ y: bgY, willChange: 'transform' }}
      >
        <motion.img
          src={packagingBox}
          alt="Thunderbolt premium drawer-box packaging"
          className="w-full h-full object-cover"
          style={{ minHeight: '115%' }}
          initial={{ scale: 1.08 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.8, ease: [0.25, 0.46, 0.45, 0.94] }}
          loading="eager"
        />
      </motion.div>

      {/* Vignette layers */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(0deg, rgba(7,7,7,1) 0%, rgba(7,7,7,0.7) 30%, transparent 60%)' }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(180deg, rgba(7,7,7,0.5) 0%, transparent 40%)' }}
      />

      {/* Content */}
      <motion.div
        className="relative z-10 pb-12 px-6 md:pb-20 md:px-14 w-full"
        style={{ y: contentY, willChange: 'transform' }}
        variants={container}
        initial="hidden"
        animate="show"
      >
        {/* Series badge */}
        <motion.div
          variants={item}
          className="font-condensed font-semibold text-[0.64rem] tracking-[0.36em] uppercase text-brass mb-6 flex items-center gap-3"
        >
          <span className="w-5 h-px bg-brass-dim inline-block" />
          Drawer Series No. 1
        </motion.div>

        {/* H1 */}
        <motion.h1
          variants={item}
          className="font-display text-tb-white"
          style={{ fontSize: 'clamp(5.5rem, 22vw, 16rem)', lineHeight: 0.88 }}
        >
          <span className="block">THUNDER</span>
          <span className="brass-text block" style={{ fontSize: '0.28em', lineHeight: 2.4, letterSpacing: '0.22em' }}>
            ⚡ ORIGINAL DENIM SUPPLY ⚡
          </span>
          <span className="block">BOLT</span>
        </motion.h1>

        {/* Tagline */}
        <motion.p
          variants={item}
          className="font-serif italic font-light text-sv-mid mt-6 max-w-[420px]"
          style={{ fontSize: 'clamp(1rem, 2.2vw, 1.28rem)', lineHeight: 1.72 }}
        >
          Crafted with the spirit of ancient masters.
        </motion.p>

        {/* CTA Row */}
        <motion.div variants={item} className="flex items-center gap-6 mt-8 flex-wrap">
          <motion.a
            href="#manifesto"
            className="clip-bolt font-condensed font-bold text-xs tracking-[0.18em] uppercase text-void bg-tb-white px-8 py-4 inline-block"
            whileHover={{ y: -2, backgroundColor: '#ffffff' }}
            transition={{ duration: 0.18 }}
          >
            Discover the Brand
          </motion.a>
          <a
            href="#craft"
            className="font-condensed font-semibold text-xs tracking-[0.18em] uppercase text-sv-mid hover:text-brass-bright transition-colors duration-200"
          >
            Our Craft →
          </a>
        </motion.div>
      </motion.div>

      {/* Scroll hint */}
      <motion.div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        animate={{ opacity: [0.4, 0.9, 0.4] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      >
        <div className="w-px h-8" style={{ background: 'linear-gradient(to bottom, #7a6210, transparent)' }} />
        <span className="font-condensed text-brass-dim uppercase text-[0.58rem] tracking-[0.30em]">Scroll</span>
      </motion.div>
    </section>
  );
};

export default HeroSection;
