import { motion, useScroll, useTransform } from 'framer-motion';

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};
const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] } },
};

const Hero = () => {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 600], [0, 160]);

  return (
    <section className="min-h-screen relative flex items-center justify-center overflow-hidden">
      {/* Background layers */}
      <div className="absolute inset-0 bg-bg" />
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 60% 70% at 50% 44%, rgba(160,160,160,0.032), transparent)' }}
      />
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 100% 50% at 50% 100%, rgba(0,0,0,0.9), transparent)' }}
      />
      <div className="absolute inset-0 denim-texture" />

      {/* Giant ghost bolt */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none ghost-stroke-thin font-display"
        style={{ fontSize: 'clamp(22rem, 60vw, 70rem)', lineHeight: 0.85 }}
        animate={{ opacity: [1, 0.5, 1] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
      >
        ⚡
      </motion.div>

      {/* Hero content */}
      <motion.div
        className="relative z-10 text-center px-6"
        style={{ y, willChange: 'transform' }}
        variants={container}
        initial="hidden"
        animate="show"
      >
        {/* Eyebrow */}
        <motion.div
          variants={item}
          className="font-condensed font-semibold text-sv-mid uppercase flex items-center justify-center gap-4 mb-10"
          style={{ fontSize: '0.68rem', letterSpacing: '0.40em' }}
        >
          <span className="w-[26px] h-px bg-sv-dim inline-block" />
          Drawer Series No. 1 · Premium Denim
          <span className="w-[26px] h-px bg-sv-dim inline-block" />
        </motion.div>

        {/* H1 */}
        <motion.h1
          variants={item}
          className="font-display text-tb-white"
          style={{ fontSize: 'clamp(5rem, 18vw, 17rem)', lineHeight: 0.88 }}
        >
          <span className="block">THUNDER</span>
          <span className="metal-text">⚡</span>
          <span className="block">BOLT</span>
        </motion.h1>

        {/* Vertical rule */}
        <motion.div
          variants={item}
          className="w-px h-14 mx-auto my-9"
          style={{ background: 'linear-gradient(to bottom, #383838, transparent)' }}
        />

        {/* Sub-heading */}
        <motion.p
          variants={item}
          className="font-serif italic font-light text-sv-mid max-w-[500px] mx-auto text-center"
          style={{ fontSize: 'clamp(1rem, 2vw, 1.3rem)', lineHeight: 1.72 }}
        >
          Crafted with the spirit of ancient masters — denim that embodies strength, resilience, and ultimate comfort.
        </motion.p>

        {/* CTA Row */}
        <motion.div variants={item} className="flex items-center justify-center gap-6 mt-10 flex-wrap">
          <motion.a
            href="#manifesto"
            className="font-condensed font-bold text-xs tracking-[0.18em] uppercase text-void bg-tb-white px-8 py-4 inline-block"
            style={{ clipPath: 'polygon(10px 0%, 100% 0%, calc(100% - 10px) 100%, 0% 100%)' }}
            whileHover={{ y: -2, backgroundColor: '#ffffff' }}
            transition={{ duration: 0.18 }}
          >
            Discover the Brand
          </motion.a>
          <a
            href="#craft"
            className="font-condensed font-semibold text-xs tracking-[0.18em] uppercase text-sv-mid hover:text-sv-bright transition-colors duration-200"
          >
            Our Craft →
          </a>
        </motion.div>
      </motion.div>

      {/* Scroll hint */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        <div className="w-px h-8" style={{ background: 'linear-gradient(to bottom, #383838, transparent)' }} />
        <span className="font-condensed text-sv-dim uppercase text-[0.58rem] tracking-[0.30em]">Scroll</span>
      </div>
    </section>
  );
};

export default Hero;
