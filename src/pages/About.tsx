import { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ScrollProgress from '../components/ScrollProgress';
import CustomCursor from '../components/CustomCursor';

// 3D Tilt Card component for Brand Philosophy
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
      className="relative bg-white/[0.02] border border-white/10 rounded-2xl p-8 md:p-10 transition-all duration-500 hover:bg-white/[0.04] hover:border-brass/35 flex flex-col gap-6 select-none group"
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

// Parallax Hero Section (with corrected spacing for PWA navbar)
function PageHero() {
  const containerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start start', 'end start'] });
  const yBg = useTransform(scrollYProgress, [0, 1], ['0%', '35%']);
  const yText = useTransform(scrollYProgress, [0, 1], ['0%', '15%']);
  const opacityText = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section
      ref={containerRef}
      className="relative min-h-[100svh] flex flex-col items-center justify-center overflow-hidden bg-void pt-[calc(110px+var(--tb-banner-h))] md:pt-[calc(140px+var(--tb-banner-h))] pb-16"
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
          className="flex items-center gap-3 mb-6"
        >
          <span className="w-8 h-px bg-brass/40" />
          <span className="font-condensed text-[0.62rem] md:text-[0.68rem] tracking-[0.42em] uppercase text-brass font-bold">
            Curated Fashion · Built for Everyday Style
          </span>
          <span className="w-8 h-px bg-brass/40" />
        </motion.div>

        {/* Headline with word-by-word reveal */}
        <h1 className="font-display uppercase leading-[0.85] text-center mb-6 tracking-wide select-none text-tb-white" style={{ fontSize: 'clamp(3rem, 12vw, 9rem)' }}>
          THUNDER⚡BOLD
        </h1>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="font-body font-light text-sv-mid max-w-[620px] text-center mb-10"
          style={{ fontSize: '1rem', lineHeight: 1.8 }}
        >
          Premium denim, streetwear, t-shirts, kurtas, and everyday essentials — carefully selected for people who want style, comfort, and value without overpaying.
        </motion.p>

        {/* Action button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <a
            href="/#categories"
            className="inline-flex items-center justify-center px-8 py-3.5 border border-white/20 bg-white/5 hover:bg-brass hover:text-void hover:border-brass rounded-lg font-condensed text-[0.7rem] font-bold uppercase tracking-[0.2em] transition-all duration-300 shadow-lg"
          >
            Explore Collections
          </a>
        </motion.div>
      </motion.div>

      {/* Fade overlay on bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-void to-transparent pointer-events-none z-20" />
    </section>
  );
}

// Who We Are Section
function WhoWeAre() {
  const points = [
    { title: 'Comfort', desc: 'Relaxed cuts & soft-washed textiles.' },
    { title: 'Quality', desc: 'Tested fabrics that sustain daily cycles.' },
    { title: 'Affordability', desc: 'Fair, honest pricing without label hype.' },
    { title: 'Modern Style', desc: 'Contemporary cuts tailored for current aesthetics.' }
  ];

  return (
    <section className="relative max-w-[1200px] mx-auto px-6 py-24 md:px-16 md:py-32 bg-void">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center">
        
        {/* Left Column: Image frame representing curation workspace */}
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
              alt="Thunderbold Curation Studio"
              className="w-full h-full object-cover opacity-85 group-hover:opacity-100 transition-opacity duration-500"
            />
          </div>
          <div className="absolute bottom-4 right-4 bg-[#121212]/90 border border-white/10 rounded px-4 py-2 text-right backdrop-blur-md">
            <span className="font-condensed text-[0.55rem] tracking-[0.16em] uppercase text-sv-dim block">SELECTION PORTAL</span>
            <span className="font-condensed text-[0.75rem] tracking-[0.12em] uppercase text-brass font-bold">BHUSAWAL, IND</span>
          </div>
        </motion.div>

        {/* Right Column: Narrative */}
        <motion.div 
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
          className="lg:col-span-7 space-y-6 md:space-y-8"
        >
          <div className="font-condensed font-semibold text-[0.64rem] tracking-[0.38em] uppercase text-brass flex items-center gap-3">
            <span className="w-5 h-px bg-brass-dim" />
            Who We Are
          </div>
          <h2 className="font-display text-tb-white uppercase text-3xl md:text-5xl leading-[1.0] tracking-wide">
            BUILT FOR PEOPLE WHO <span className="brass-text">LOVE</span> GOOD STYLE.
          </h2>
          <div className="space-y-6 text-sv-mid font-body font-light text-base md:text-lg leading-relaxed">
            <p>
              Thunderbold is a modern fashion and streetwear destination focused on bringing together stylish, wearable, and value-driven collections in one place. We operate as a curated marketplace—sourcing and selecting products that balance quality with affordability.
            </p>
            <p>
              We believe great fashion should feel accessible, wearable, and effortless — whether you're dressing for daily wear, college, travel, weekends, or going out.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
            {points.map((pt, idx) => (
              <div key={idx} className="flex gap-2">
                <span className="text-brass font-bold">⚡</span>
                <div>
                  <h4 className="font-condensed font-bold text-[0.8rem] tracking-wider uppercase text-tb-white">{pt.title}</h4>
                  <p className="font-body text-xs text-sv-dim">{pt.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// Our Approach Section
function OurApproach() {
  const highlights = [
    'Everyday usability',
    'Clean fits',
    'Wearable colors',
    'Modern silhouettes',
    'Value for money',
    'Comfort-first styling'
  ];

  return (
    <section className="relative border-t border-white/5 py-20 px-6 md:py-28 md:px-16 bg-[#090909]">
      <div className="max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="space-y-6"
          >
            <div className="font-condensed font-semibold text-[0.64rem] tracking-[0.38em] uppercase text-brass flex items-center gap-3">
              <span className="w-5 h-px bg-brass-dim" />
              Our Approach
            </div>
            <h2 className="font-display text-tb-white uppercase text-3xl md:text-5xl leading-none">
              CURATED WITH <span className="brass-text">INTENTION</span>
            </h2>
            <p className="font-body font-light text-sv-mid text-base md:text-lg leading-relaxed">
              We don't believe in flooding people with endless random products. Every collection on Thunderbold is selected with focus. The goal is simple: help people discover fashion that actually feels good to wear every day.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="grid grid-cols-2 gap-4"
          >
            {highlights.map((h, idx) => (
              <div key={idx} className="p-5 bg-white/[0.01] border border-white/5 rounded-xl hover:border-brass/25 transition-all duration-300">
                <span className="text-[0.64rem] text-brass font-condensed tracking-widest uppercase block mb-1">FOCUS 0{idx + 1}</span>
                <span className="font-condensed text-sm font-bold uppercase tracking-wider text-tb-white">{h}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// What We Offer (Our Collections)
function CollectionShowcase() {
  const collectionItems = [
    {
      label: 'Denim & Jeans',
      desc: 'Baggy fits, straight fits, relaxed silhouettes, and everyday denim styles designed for comfort and versatility.',
      img: '/about_rivet_detail.png',
      tag: 'CORE'
    },
    {
      label: 'Oversized & Everyday T-Shirts',
      desc: 'Modern fits and clean essentials made for daily wear and street-inspired styling.',
      img: '/about_workshop.png',
      tag: 'STREET'
    },
    {
      label: 'Kurtas & Ethnic Wear',
      desc: 'Traditional styles with simple modern appeal for casual occasions and festive wear.',
      img: '/about_workshop.png',
      tag: 'ETHNIC'
    },
    {
      label: 'Curated Combos & Deals',
      desc: 'Affordable fashion bundles and value-focused collections designed to offer more without compromising style.',
      img: '/about_raw_weave.png',
      tag: 'BUNDLES'
    }
  ];

  return (
    <section className="relative border-t border-b border-white/5 py-24 px-6 md:py-32 md:px-16 bg-[#070707]">
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
            What We Offer
            <span className="w-5 h-px bg-brass-dim" />
          </div>
          <h2 className="font-display text-tb-white uppercase text-4xl md:text-7xl leading-none">
            OUR <span className="brass-text">COLLECTIONS</span>
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
              <div className="absolute inset-0 bg-black/65 z-10 group-hover:bg-black/55 transition-colors duration-500" />
              <img
                src={item.img}
                alt={item.label}
                className="absolute inset-0 w-full h-full object-cover opacity-45 group-hover:scale-105 group-hover:opacity-65 transition-all duration-700 ease-out"
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

// Brand Philosophy & Experience
function PhilosophySection() {
  const pillars = [
    {
      n: '01',
      title: 'Wearable & Practical',
      desc: "Focuses on wearable fashion, practical styles, and pieces that naturally become a reliable part of your everyday life."
    },
    {
      n: '02',
      title: 'Comfort & Fits',
      desc: "Carefully selected comfortable fits and relaxed silhouettes that deliver ease-of-wear throughout the entire day."
    },
    {
      n: '03',
      title: 'Affordable Premium',
      desc: "Bringing together modern aesthetics and clean fits that provide an affordable premium feel without overcomplicating things."
    }
  ];

  return (
    <section className="max-w-[1200px] mx-auto px-6 py-24 md:px-16 md:py-32 bg-void">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        {/* Left header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="lg:col-span-4 space-y-6"
        >
          <div className="font-condensed font-semibold text-[0.64rem] tracking-[0.38em] uppercase text-brass flex items-center gap-3">
            <span className="w-5 h-px bg-brass-dim" />
            Brand Philosophy
          </div>
          <h2 className="font-display text-tb-white uppercase text-3xl md:text-5xl leading-none">
            STYLE SHOULD FEEL <span className="brass-text">NATURAL</span>
          </h2>
          <p className="font-body font-light text-sv-mid text-sm leading-relaxed">
            Fashion isn't about wearing the loudest thing in the room. It's about confidence, comfort, and finding pieces that naturally become part of your everyday life.
          </p>
        </motion.div>

        {/* Right card grid */}
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-5">
          {pillars.map((p, i) => (
            <motion.div
              key={p.n}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: i * 0.08 }}
            >
              <InteractiveCard title={p.title} desc={p.desc} number={p.n} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Experience & Value Proposition Combined Section
function ExperienceValue() {
  const experiences = [
    { label: 'Streetwear Influence', desc: 'Casual, contemporary street designs.' },
    { label: 'Clean Silhouettes', desc: 'Minimalist profiles and simple alignments.' },
    { label: 'Relaxed Fits', desc: 'Comfort-oriented fits that let you move.' },
    { label: 'Everyday Comfort', desc: 'Soft fabric touch tailored for daily runs.' }
  ];

  const values = [
    'Good fabric feel',
    'Reliable fits',
    'Wearable styling',
    'Practical comfort',
    'Accessible pricing'
  ];

  return (
    <section className="relative border-t border-white/5 py-24 px-6 md:py-32 md:px-16 bg-[#090909]">
      <div className="max-w-[1200px] mx-auto space-y-20">
        
        {/* Experience visual copy */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-6 space-y-6"
          >
            <div className="font-condensed font-semibold text-[0.64rem] tracking-[0.38em] uppercase text-brass flex items-center gap-3">
              <span className="w-5 h-px bg-brass-dim" />
              Designed for wear
            </div>
            <h3 className="font-display text-tb-white uppercase text-3xl md:text-5xl leading-none">
              DESIGNED FOR MODERN EVERYDAY WEAR
            </h3>
            <p className="font-body font-light text-sv-mid text-base leading-relaxed">
              From casual outings to everyday routines, Thunderbold collections are selected to work across different styles and occasions without feeling overcomplicated.
            </p>
          </motion.div>

          <div className="lg:col-span-6 grid grid-cols-2 gap-4">
            {experiences.map((exp, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.08 }}
                className="p-5 bg-white/[0.01] border border-white/5 rounded-xl"
              >
                <h4 className="font-condensed font-bold text-sm text-brass uppercase tracking-wider mb-1">{exp.label}</h4>
                <p className="font-body text-xs text-sv-dim">{exp.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Value proposition */}
        <div className="pt-16 border-t border-white/5 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center">
          <div className="lg:col-span-6 order-last lg:order-first">
            <div className="flex flex-col gap-3.5">
              {values.map((v, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, x: -15 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.08 }}
                  className="flex items-center gap-4 py-2 border-b border-white/5"
                >
                  <span className="text-brass font-bold font-mono">0{idx + 1}</span>
                  <span className="font-condensed text-sm font-bold uppercase tracking-wider text-white">{v}</span>
                </motion.div>
              ))}
            </div>
          </div>

          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-6 space-y-6"
          >
            <div className="font-condensed font-semibold text-[0.64rem] tracking-[0.38em] uppercase text-brass flex items-center gap-3">
              <span className="w-5 h-px bg-brass-dim" />
              Value Proposition
            </div>
            <h3 className="font-display text-tb-white uppercase text-3xl md:text-5xl leading-none">
              QUALITY WITHOUT <span className="brass-text">OVERCOMPLICATING</span> THINGS
            </h3>
            <p className="font-body font-light text-sv-mid text-base leading-relaxed">
              We focus on bringing together products that deliver good fabric feel, reliable fits, wearable styling, and accessible pricing. No unnecessary hype. No unrealistic claims. Just fashion people can genuinely enjoy wearing.
            </p>
          </motion.div>
        </div>

      </div>
    </section>
  );
}

// Community & Future Section
function CommunityFuture() {
  return (
    <section className="max-w-[900px] mx-auto px-6 py-24 md:py-32 text-center bg-void">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="space-y-6"
      >
        <div className="font-condensed font-semibold text-[0.64rem] tracking-[0.38em] uppercase text-brass flex items-center justify-center gap-3">
          <span className="w-5 h-px bg-brass-dim" />
          Community
          <span className="w-5 h-px bg-brass-dim" />
        </div>
        <h2 className="font-display text-tb-white uppercase text-4xl md:text-6xl leading-none">
          GROWING WITH THE <span className="brass-text">COMMUNITY</span>
        </h2>
        <div className="font-body font-light text-sv-mid text-base md:text-lg leading-relaxed max-w-2xl mx-auto space-y-4">
          <p>
            Thunderbold is continuously evolving. As the brand grows, we aim to expand our collections, improve the shopping experience, and gradually build stronger identity-driven fashion collections around the community that supports us.
          </p>
          <p className="font-condensed font-bold uppercase tracking-[0.2em] text-brass text-sm pt-2">
            This is only the beginning.
          </p>
        </div>
      </motion.div>
    </section>
  );
}

// Explore CTA Section
function ExploreCTA() {
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
              Explore Collections
            </div>
            <h2 className="font-display text-tb-white uppercase text-4xl md:text-6xl leading-[0.95] mb-6">
              EXPLORE THE <span className="brass-text">COLLECTION</span>
            </h2>
            <p className="font-body font-light text-sv-mid text-base md:text-lg leading-relaxed max-w-md">
              Discover curated fashion built around comfort, style, and everyday wearability.
            </p>
          </motion.div>

          {/* Right */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="flex flex-col gap-4 max-w-md w-full"
          >
            <a
              href="/#categories"
              className="flex items-center justify-between px-6 py-5 border border-white/10 rounded-xl bg-white/[0.01] hover:border-brass/40 hover:bg-brass/[0.04] transition-all duration-300 group"
            >
              <span className="font-condensed text-[0.85rem] tracking-[0.16em] uppercase text-white/70 group-hover:text-white transition-colors duration-200">
                Shop Denim
              </span>
              <ArrowRight className="w-4 h-4 text-brass/50 group-hover:text-brass group-hover:translate-x-1.5 transition-all duration-300" />
            </a>

            <a
              href="/#categories"
              className="flex items-center justify-between px-6 py-5 border border-white/10 rounded-xl bg-white/[0.01] hover:border-brass/40 hover:bg-brass/[0.04] transition-all duration-300 group"
            >
              <span className="font-condensed text-[0.85rem] tracking-[0.16em] uppercase text-white/70 group-hover:text-white transition-colors duration-200">
                Explore T-Shirts
              </span>
              <ArrowRight className="w-4 h-4 text-brass/50 group-hover:text-brass group-hover:translate-x-1.5 transition-all duration-300" />
            </a>

            <a
              href="/#categories"
              className="flex items-center justify-between px-6 py-5 border border-white/10 rounded-xl bg-white/[0.01] hover:border-brass/40 hover:bg-brass/[0.04] transition-all duration-300 group"
            >
              <span className="font-condensed text-[0.85rem] tracking-[0.16em] uppercase text-white/70 group-hover:text-white transition-colors duration-200">
                Browse Collections
              </span>
              <ArrowRight className="w-4 h-4 text-brass/50 group-hover:text-brass group-hover:translate-x-1.5 transition-all duration-300" />
            </a>

            <div className="pt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-sv-dim font-condensed text-[0.62rem] tracking-[0.18em] uppercase">
              <span>Affordable Premium Fashion for Everyday Wear.</span>
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
        <WhoWeAre />
        <OurApproach />
        <CollectionShowcase />
        <PhilosophySection />
        <ExperienceValue />
        <CommunityFuture />
        <ExploreCTA />
      </main>
      <Footer />
    </div>
  );
}
