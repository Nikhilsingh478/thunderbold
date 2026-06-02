import { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { Instagram, Mail, ArrowRight } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ScrollProgress from '../components/ScrollProgress';
import CustomCursor from '../components/CustomCursor';

// 3D Tilt Card component for Brand Philosophy/Pillars
function InteractiveCard({ title, desc, number }: { title: string; desc: string; number: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useSpring(0, { stiffness: 100, damping: 20 });
  const y = useSpring(0, { stiffness: 100, damping: 20 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left - width / 2;
    const mouseY = e.clientY - rect.top - height / 2;
    
    // Limit rotation to 10 degrees max for premium feedback feel
    x.set((mouseY / (height / 2)) * -10);
    y.set((mouseX / (width / 2)) * 10);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX: x, rotateY: y, transformStyle: 'preserve-3d' }}
      className="relative bg-white/[0.02] border border-white/10 rounded-2xl p-8 md:p-10 transition-colors duration-500 hover:bg-white/[0.04] hover:border-brass/30 flex flex-col gap-6 select-none group"
    >
      <div 
        style={{ transform: 'translateZ(30px)' }} 
        className="font-display text-4xl text-brass/20 group-hover:text-brass/40 transition-colors duration-500"
      >
        {number}
      </div>
      <div style={{ transform: 'translateZ(40px)' }}>
        <h3 className="font-condensed font-bold text-lg md:text-xl uppercase tracking-wider text-tb-white mb-3">
          {title}
        </h3>
        <p className="font-body font-light text-sm md:text-base text-sv-mid leading-relaxed">
          {desc}
        </p>
      </div>
      {/* Subtle hover glare effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-transparent via-white/[0.02] to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </motion.div>
  );
}

// Parallax Hero Section
function PageHero() {
  const containerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start start', 'end start'] });
  const yBg = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const yText = useTransform(scrollYProgress, [0, 1], ['0%', '15%']);
  const opacityText = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  // Split headline for letter reveal animations
  const headlineWords = "RAW. CURATED. HONEST.".split(" ");

  return (
    <section
      ref={containerRef}
      className="relative min-h-[100svh] flex flex-col items-center justify-center overflow-hidden bg-void"
    >
      {/* Parallax Indigo Fabric Background */}
      <motion.div
        style={{ y: yBg }}
        className="absolute inset-0 w-full h-[120%] pointer-events-none"
      >
        <div className="absolute inset-0 bg-[#060606]/85 z-10" />
        <div 
          className="absolute inset-0 opacity-15 mix-blend-overlay z-[5]"
          style={{
            backgroundImage: "url('/about_raw_weave.png')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(circle at 50% 50%, rgba(184,130,15,0.06) 0%, transparent 80%)',
            zIndex: 6,
          }}
        />
      </motion.div>

      <motion.div
        style={{ y: yText, opacity: opacityText }}
        className="relative z-20 text-center px-6 max-w-4xl flex flex-col items-center"
      >
        {/* Eyebrow */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center gap-3 mb-8"
        >
          <span className="w-8 h-px bg-brass/40" />
          <span className="font-condensed text-[0.62rem] md:text-[0.68rem] tracking-[0.42em] uppercase text-brass font-bold">
            Est. 2024 · Curation & Craft
          </span>
          <span className="w-8 h-px bg-brass/40" />
        </motion.div>

        {/* Headline with word-by-word reveal */}
        <h1 className="font-display uppercase leading-[0.85] text-center mb-6 tracking-wide select-none">
          {headlineWords.map((word, wIdx) => (
            <span key={wIdx} className="inline-block overflow-hidden mx-2 py-1">
              <motion.span
                initial={{ y: '110%' }}
                animate={{ y: 0 }}
                transition={{
                  duration: 0.95,
                  delay: wIdx * 0.15,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className={`inline-block ${wIdx === 1 ? 'metal-text' : 'text-tb-white'}`}
                style={{ fontSize: 'clamp(2.8rem, 10vw, 8rem)' }}
              >
                {word}
              </motion.span>
            </span>
          ))}
        </h1>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="font-body font-light text-sv-mid max-w-[500px] text-center"
          style={{ fontSize: '1rem', lineHeight: 1.8 }}
        >
          Thunderbolt Denim breaks the boundaries of commercial fast-fashion. We curate raw, heavy-duty textiles and custom fits for those who value authentic character over mass production.
        </motion.p>

        {/* Scroll indicator */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 1 }}
          className="mt-14 flex flex-col items-center gap-2 cursor-pointer"
          onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
        >
          <span className="font-condensed text-[0.58rem] tracking-[0.25em] uppercase text-sv-dim">
            Discover the Craft
          </span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="text-brass/40 hover:text-brass transition-colors"
          >
            <svg width="12" height="18" viewBox="0 0 12 18" fill="none">
              <path
                d="M6 0v14M1 9l5 5 5-5"
                stroke="currentColor"
                strokeWidth="1.25"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Fade overlay on bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-void to-transparent pointer-events-none z-20" />
    </section>
  );
}

// Brand Narrative Section
function StorySection() {
  return (
    <section className="relative max-w-[1200px] mx-auto px-6 py-24 md:px-16 md:py-36 bg-void">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center">
        
        {/* Left Column: Interactive Image Frame */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-5 relative group"
        >
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-brass/25 to-brass-dim/5 opacity-40 blur group-hover:opacity-75 transition duration-1000 group-hover:duration-200" />
          <div className="relative overflow-hidden aspect-[4/5] rounded-xl border border-white/10 bg-[#0d0d0d]">
            <motion.img 
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              src="/about_workshop.png" 
              alt="Denim Atelier Workshop"
              className="w-full h-full object-cover opacity-85 group-hover:opacity-100 transition-opacity duration-500"
            />
          </div>
          <div className="absolute bottom-4 right-4 bg-[#121212]/90 border border-white/10 rounded px-4 py-2 text-right backdrop-blur-md">
            <span className="font-condensed text-[0.55rem] tracking-[0.16em] uppercase text-sv-dim block">ATELIER LOCATION</span>
            <span className="font-condensed text-[0.75rem] tracking-[0.12em] uppercase text-brass font-bold">BHUSAWAL, MH, IND</span>
          </div>
        </motion.div>

        {/* Right Column: Editorial Text */}
        <motion.div 
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
          className="lg:col-span-7 space-y-6 md:space-y-8"
        >
          <div className="font-condensed font-semibold text-[0.64rem] tracking-[0.38em] uppercase text-brass flex items-center gap-3">
            <span className="w-5 h-px bg-brass-dim" />
            Our Heritage
          </div>
          <h2 className="font-display text-tb-white uppercase text-4xl md:text-6xl leading-[0.9] tracking-wide">
            DESIGN THAT <span className="brass-text">SPEAKS</span> IN RAW TEXTURES.
          </h2>
          <div className="space-y-5 text-sv-mid font-body font-light text-base md:text-lg leading-relaxed">
            <p>
              We established Thunderbolt Denim because the modern fashion landscape felt flat. Heavy-duty construction, raw material integrity, and deliberate details were being sacrificed for rapid production cycles.
            </p>
            <p>
              We reject the hype. We choose slow, curated drops where every garment is treated with singular importance. Our signature fits are built to age gracefully, acquiring unique creases and markings that reflect your path.
            </p>
            <p className="border-l-2 border-brass/50 pl-4 py-1 text-tb-white font-condensed uppercase tracking-wider text-sm">
              "We don't manufacture denim to fit templates. We design garments to fit lifestyles."
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// Collection Showcase Section
function CollectionShowcase() {
  const collectionItems = [
    {
      label: 'Denim Essentials',
      desc: 'Japanese selvedge, bootcut, straight, monk & relaxed baggy cuts.',
      img: '/about_rivet_detail.png',
      tag: 'CORE'
    },
    {
      label: 'Graphic Tees',
      desc: 'Heavyweight oversized cotton tees featuring custom streetwear artwork.',
      img: '/about_workshop.png',
      tag: 'STREET'
    },
    {
      label: 'Denim Shirts',
      desc: 'Structured utility shirts, raw washes, and light linen summer overshirts.',
      img: '/about_raw_weave.png',
      tag: 'FIT'
    },
    {
      label: 'Modern Kurtas',
      desc: 'Contemporary traditional silhouettes blending Indian heritage and streetwear styles.',
      img: '/about_workshop.png',
      tag: 'ETHNIC'
    }
  ];

  return (
    <section className="relative border-t border-b border-white/5 py-24 px-6 md:py-36 md:px-16 bg-[#090909]">
      <div className="max-w-[1200px] mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mb-16 md:mb-24 text-center"
        >
          <div className="font-condensed font-semibold text-[0.64rem] tracking-[0.38em] uppercase text-brass flex items-center justify-center gap-3 mb-6">
            <span className="w-5 h-px bg-brass-dim" />
            Curated Lines
            <span className="w-5 h-px bg-brass-dim" />
          </div>
          <h2 className="font-display text-tb-white uppercase text-4xl md:text-7xl leading-none">
            THE <span className="brass-text">COLLECTIONS</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {collectionItems.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-65px' }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: i * 0.1 }}
              className="relative overflow-hidden aspect-[3/4.2] rounded-xl border border-white/10 group cursor-pointer"
            >
              {/* Overlay */}
              <div className="absolute inset-0 bg-black/60 z-10 group-hover:bg-black/50 transition-colors duration-500" />
              <img
                src={item.img}
                alt={item.label}
                className="absolute inset-0 w-full h-full object-cover opacity-45 group-hover:scale-105 group-hover:opacity-60 transition-all duration-700 ease-out"
                onError={(e) => {
                  e.currentTarget.src = '/about_raw_weave.png';
                }}
              />

              {/* Tag */}
              <span className="absolute top-5 left-5 z-20 font-condensed font-bold text-[0.58rem] tracking-[0.16em] uppercase px-2 py-0.5 border border-brass/50 bg-void/85 text-brass rounded">
                {item.tag}
              </span>

              {/* Content */}
              <div className="absolute inset-x-5 bottom-6 z-20 flex flex-col justify-end">
                <h3 className="font-condensed font-bold text-lg md:text-xl uppercase tracking-wider text-tb-white mb-2 group-hover:text-brass transition-colors duration-300">
                  {item.label}
                </h3>
                <p className="font-body font-light text-xs text-sv-mid leading-relaxed opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-2 transition-all duration-500">
                  {item.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Brand Philosophy Section
function PhilosophySection() {
  const pillars = [
    {
      n: '01',
      title: 'Curated Selection',
      desc: "Every single piece in our vault is individually chosen and wear-tested. We do not bulk-source. If it doesn't align with our aesthetic codes, we do not stock it."
    },
    {
      n: '02',
      title: 'Honest Value',
      desc: "We stand against artificial markups and label hype. Our margins are clean, raw, and transparent, delivering industrial-grade materials at realistic prices."
    },
    {
      n: '03',
      title: 'Everyday Resilience',
      desc: "We build for street culture, hard labor, and functional motion. Our garments combine heavy-weight fibers with comfortable fits to support your daily grind."
    }
  ];

  return (
    <section className="max-w-[1200px] mx-auto px-6 py-24 md:px-16 md:py-36 bg-void">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="mb-16 md:mb-24"
      >
        <div className="font-condensed font-semibold text-[0.64rem] tracking-[0.38em] uppercase text-brass flex items-center gap-3 mb-6">
          <span className="w-5 h-px bg-brass-dim" />
          Our Philosophy
        </div>
        <h2 className="font-display text-tb-white uppercase text-4xl md:text-6xl max-w-xl leading-none">
          THE THREE <span className="brass-text">PILLARS</span> WE BUILD ON.
        </h2>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {pillars.map((p, i) => (
          <motion.div
            key={p.n}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: i * 0.1 }}
          >
            <InteractiveCard title={p.title} desc={p.desc} number={p.n} />
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// Social / Connect Section
function ConnectSection() {
  return (
    <section className="relative border-t border-white/5 py-24 px-6 md:py-36 md:px-16 bg-[#080808]">
      {/* Background rivet image watermark */}
      <div 
        className="absolute right-0 bottom-0 top-0 w-1/3 opacity-5 pointer-events-none mix-blend-screen bg-cover bg-no-repeat bg-right-bottom"
        style={{ backgroundImage: "url('/about_rivet_detail.png')" }}
      />
      
      <div className="max-w-[1200px] mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Left */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div className="font-condensed font-semibold text-[0.64rem] tracking-[0.38em] uppercase text-brass flex items-center gap-3 mb-6">
              <span className="w-5 h-px bg-brass-dim" />
              Stay Connected
            </div>
            <h2 className="font-display text-tb-white uppercase text-4xl md:text-7xl leading-[0.95] mb-6">
              JOIN THE <span className="brass-text">CULTURE.</span>
            </h2>
            <p className="font-body font-light text-sv-mid text-base md:text-lg leading-relaxed max-w-md">
              Get behind-the-scenes access to looms, indigo dye baths, and product drops. Check our daily styling editorials on social.
            </p>
          </motion.div>

          {/* Right */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="space-y-4 max-w-lg"
          >
            <a
              href="https://www.instagram.com/thunderbold.shop?igsh=MXM5dnFvMW45Z2Fh"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-6 py-6 border border-white/10 rounded-xl bg-white/[0.01] hover:border-brass/40 hover:bg-brass/[0.04] transition-all duration-300 group"
            >
              <div className="flex items-center gap-4">
                <svg className="w-5 h-5 text-brass" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
                <span className="font-condensed text-[0.85rem] tracking-[0.16em] uppercase text-white/70 group-hover:text-white transition-colors duration-200">
                  @thunderbold.shop
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-brass/50 group-hover:text-brass group-hover:translate-x-1.5 transition-all duration-300" />
            </a>

            <a
              href="mailto:support@thunderbolddenim.com"
              className="flex items-center justify-between px-6 py-6 border border-white/10 rounded-xl bg-white/[0.01] hover:border-brass/40 hover:bg-brass/[0.04] transition-all duration-300 group"
            >
              <div className="flex items-center gap-4">
                <svg className="w-5 h-5 text-brass" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                <span className="font-condensed text-[0.85rem] tracking-[0.16em] uppercase text-white/70 group-hover:text-white transition-colors duration-200">
                  support@thunderbolddenim.com
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-brass/50 group-hover:text-brass group-hover:translate-x-1.5 transition-all duration-300" />
            </a>

            <div className="pt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-sv-dim font-condensed text-[0.62rem] tracking-[0.18em] uppercase">
              <span>Bhusawal – 425201, Maharashtra, India</span>
              <span className="text-brass">Est. 2024</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default function About() {
  return (
    <div className="noise-overlay min-h-screen bg-void">
      <CustomCursor />
      <ScrollProgress />
      <Navbar />
      <main>
        <PageHero />
        <StorySection />
        <CollectionShowcase />
        <PhilosophySection />
        <ConnectSection />
      </main>
      <Footer />
    </div>
  );
}
