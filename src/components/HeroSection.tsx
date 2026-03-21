import { motion, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion';
import { useEffect } from 'react';
import packagingBox from '@/assets/packaging-box.png';
import mobileHero from '@/assets/mobile_hero.webp';

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

  // Mouse Parallax logic
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springConfig = { damping: 30, stiffness: 100, mass: 1.5 };
  const smoothMouseX = useSpring(mouseX, springConfig);
  const smoothMouseY = useSpring(mouseY, springConfig);

  const parallaxX = useTransform(smoothMouseX, [-1, 1], [-15, 15]);
  const parallaxY = useTransform(smoothMouseY, [-1, 1], [-15, 15]);
  const parallaxXBg = useTransform(smoothMouseX, [-1, 1], [10, -10]);
  const parallaxYBg = useTransform(smoothMouseY, [-1, 1], [10, -10]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      if (innerWidth < 768) return; // Disable on mobile devices
      
      const x = (e.clientX / innerWidth) * 2 - 1;
      const y = (e.clientY / innerHeight) * 2 - 1;
      mouseX.set(x);
      mouseY.set(y);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <section className="min-h-[100svh] relative overflow-hidden flex items-end">
      {/* Background — packaging image */}
      <motion.div
        className="absolute inset-0 scale-[1.05]"
        style={{ y: bgY, willChange: 'transform' }}
      >
        <motion.div
          className="absolute inset-0"
          style={{ x: parallaxXBg, y: parallaxYBg }}
        >
          <motion.img
            src={packagingBox}
            alt="Thunderbolt premium drawer-box packaging (Desktop)"
            className="hidden md:block w-full h-full object-cover object-center md:brightness-[0.8] md:contrast-[1.12]"
            style={{ minHeight: '115%' }}
            initial={{ scale: 1.08, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.8, ease: [0.25, 0.46, 0.45, 0.94] }}
            loading="eager"
          />
          <motion.img
            src={mobileHero}
            alt="Thunderbolt premium drawer-box packaging (Mobile)"
            className="block md:hidden w-full h-full object-cover object-center"
            style={{ minHeight: '115%' }}
            initial={{ scale: 1.08, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.8, ease: [0.25, 0.46, 0.45, 0.94] }}
            loading="eager"
          />
        </motion.div>
      </motion.div>

      {/* Vignette layers */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(0deg, rgba(7,7,7,1) 0%, rgba(7,7,7,0.35) 30%, transparent 60%)' }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(180deg, rgba(7,7,7,0.2) 0%, transparent 40%)' }}
      />

      {/* Content */}
      <motion.div
        className="relative z-10 pb-12 px-6 w-full md:absolute md:bottom-0 md:left-0 md:pb-20 md:pl-16 md:pr-8 md:max-w-none flex flex-col justify-end"
        style={{ y: contentY, willChange: 'transform' }}
        variants={container}
        initial="hidden"
        animate="show"
      >
        <motion.div style={{ x: parallaxX, y: parallaxY }} className="w-full">
          {/* Series badge */}
          <motion.div
            variants={item}
            className="font-condensed font-semibold text-[0.64rem] md:text-[0.68rem] tracking-[0.36em] md:tracking-[0.40em] uppercase text-brass mb-6 flex items-center gap-3 md:gap-4 md:justify-start"
          >
            <span className="w-5 h-px bg-brass-dim inline-block" />
            Drawer Series No. 1
          </motion.div>

          {/* H1 SVG Animation */}
          <motion.div
            variants={item}
            className="mb-6 pointer-events-none w-full max-w-[1200px]"
          >
            <svg viewBox="0 0 850 160" className="w-[140%] -ml-[5%] md:w-full md:ml-0 h-auto drop-shadow-2xl">
              <text x="0" y="130" fontSize="140" className="font-display thunderbolt-text" textAnchor="start">
                THUNDERBOLT
              </text>
            </svg>
          </motion.div>

          {/* Tagline */}
          <motion.p
            variants={item}
            className="font-serif italic font-light text-sv-mid mt-4 md:mt-6 max-w-[420px] md:max-w-[400px] md:text-left"
            style={{ fontSize: 'clamp(1rem, 2.2vw, 1.18rem)', lineHeight: 1.72 }}
          >
            Crafted with the spirit of ancient masters.
          </motion.p>

          {/* CTA Row */}
          <motion.div variants={item} className="flex items-center gap-6 mt-8 flex-wrap md:justify-start">
            <motion.a
              href="#manifesto"
              className="font-condensed font-bold text-xs tracking-[0.18em] uppercase text-void bg-tb-white px-8 py-4 inline-block"
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
      </motion.div>

      {/* Scroll hint */}
      <motion.div
        className="absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
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
