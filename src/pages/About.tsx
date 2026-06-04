import { useRef, useState } from 'react';
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'framer-motion';
import { ArrowRight, Eye, ShieldCheck, Layers, Compass } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ScrollProgress from '../components/ScrollProgress';
import CustomCursor from '../components/CustomCursor';

// 3D Tilt Card component for Brand Philosophy
function InteractiveCard({ title, desc, number }: { title: string; desc: string; number: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useSpring(0, { stiffness: 120, damping: 25 });
  const y = useSpring(0, { stiffness: 120, damping: 25 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left - width / 2;
    const mouseY = e.clientY - rect.top - height / 2;
    
    // Smooth tilt feedback
    x.set((mouseY / (height / 2)) * -12);
    y.set((mouseX / (width / 2)) * 12);
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
      className="relative bg-white/[0.01] border border-white/5 rounded-2xl p-8 md:p-10 transition-all duration-500 hover:bg-white/[0.03] hover:border-brass/35 flex flex-col gap-6 select-none group"
    >
      <div 
        style={{ transform: 'translateZ(30px)' }} 
        className="font-display text-5xl text-brass/10 group-hover:text-brass/30 transition-colors duration-500"
      >
        {number}
      </div>
      <div style={{ transform: 'translateZ(40px)' }} className="space-y-3">
        <h3 className="font-condensed font-bold text-lg md:text-xl uppercase tracking-wider text-white group-hover:text-brass transition-colors duration-300">
          {title}
        </h3>
        <p className="font-body font-light text-sm md:text-base text-sv-mid leading-relaxed">
          {desc}
        </p>
      </div>
      {/* Subtle hover glow */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-transparent via-brass/[0.02] to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </motion.div>
  );
}

// Parallax Hero Section with high-contrast text reveals
function PageHero() {
  const containerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start start', 'end start'] });
  const yBg = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const yText = useTransform(scrollYProgress, [0, 1], ['0%', '15%']);
  const opacityText = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section
      ref={containerRef}
      className="relative min-h-[100svh] flex flex-col items-center justify-center overflow-hidden bg-void pt-[calc(110px+var(--tb-banner-h))] md:pt-[calc(140px+var(--tb-banner-h))] pb-16"
    >
      {/* Background Weave texture with smooth dark overlay */}
      <motion.div style={{ y: yBg }} className="absolute inset-0 w-full h-[120%] pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/75 via-[#080808]/90 to-[#0a0a0a] z-10" />
        <div 
          className="absolute inset-0 opacity-[0.12] mix-blend-overlay z-[5]"
          style={{
            backgroundImage: "url('/about_raw_weave.png')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(circle at 50% 50%, rgba(184,130,15,0.05) 0%, transparent 70%)',
            zIndex: 6,
          }}
        />
      </motion.div>

      <motion.div
        style={{ y: yText, opacity: opacityText }}
        className="relative z-20 text-center px-6 max-w-5xl flex flex-col items-center"
      >
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center gap-3 mb-6"
        >
          <span className="w-8 h-px bg-brass/30" />
          <span className="font-condensed text-[0.62rem] md:text-[0.68rem] tracking-[0.45em] uppercase text-brass font-bold">
            Curated Streetwear &middot; Everyday Essentials
          </span>
          <span className="w-8 h-px bg-brass/30" />
        </motion.div>

        {/* Title */}
        <h1 className="font-display uppercase leading-[0.8] text-center mb-6 tracking-wide select-none text-white" style={{ fontSize: 'clamp(3rem, 13vw, 9.5rem)' }}>
          THUNDER⚡BOLD
        </h1>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="font-body font-light text-sv-mid max-w-[660px] text-center mb-10 leading-relaxed text-base md:text-lg"
        >
          Premium denim, oversized streetwear, daily tees, kurtas, and apparel essentials &mdash; carefully handpicked for style, comfort, and value.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <a
            href="/#categories"
            className="inline-flex items-center justify-center px-8 py-4 border border-white/10 bg-white/[0.02] hover:bg-brass hover:text-void hover:border-brass rounded-lg font-condensed text-xs font-bold uppercase tracking-[0.2em] transition-all duration-300 shadow-md hover:shadow-brass/10"
          >
            Explore Collections
          </a>
        </motion.div>
      </motion.div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-void to-transparent pointer-events-none z-20" />
    </section>
  );
}

// Editorial Manifesto Section: Curation Over Production
function CurationManifesto() {
  return (
    <section className="relative px-6 py-24 md:py-32 bg-void border-b border-white/5">
      <div className="max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
          {/* Left Column: Pinned Core Statement */}
          <div className="lg:col-span-5 lg:sticky lg:top-28 h-fit space-y-6">
            <div className="font-condensed font-semibold text-[0.64rem] tracking-[0.38em] uppercase text-brass flex items-center gap-3">
              <span className="w-5 h-px bg-brass-dim" />
              The Platform
            </div>
            <h2 className="font-display text-white uppercase text-4xl md:text-6xl leading-[0.95] tracking-wide">
              WE DON&apos;T MAKE THE CLOTHES.<br />
              WE <span className="brass-text">CURATE</span> THEM.
            </h2>
            <div className="w-16 h-1 bg-brass/30 rounded" />
          </div>

          {/* Right Column: In-depth Brand Narrative */}
          <div className="lg:col-span-7 space-y-8 text-sv-mid font-body font-light text-base md:text-lg leading-relaxed">
            <p className="text-white font-medium text-lg md:text-xl leading-relaxed">
              In a world flooded with cheap, mass-produced fast fashion, finding clothing that actually looks good, fits comfortably, and doesn&apos;t break the bank has become a chore.
            </p>
            <p>
              Thunderbold is a modern curated fashion platform. We search, inspect, filter, and compile collections of denim, streetwear, and everyday essentials so you don&apos;t have to scroll through endless pages of filler.
            </p>
            <p>
              We operate as a selective marketplace. Our team travels, reviews samples, and partners with makers to handpick individual products that meet our aesthetic guidelines and comfort standards. If a fabric is too stiff, a cut is off, or the pricing doesn&apos;t make sense &mdash; it never enters our catalog.
            </p>
            <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-6 border-t border-white/10">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-lg bg-brass/10 border border-brass/20 flex items-center justify-center text-brass shrink-0">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-condensed font-bold text-sm tracking-wider uppercase text-white mb-1">Selective Sourcing</h4>
                  <p className="font-body text-xs text-sv-dim leading-relaxed">We source individual pieces, not catalog dumps, based on texture, wash, and style.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-lg bg-brass/10 border border-brass/20 flex items-center justify-center text-brass shrink-0">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-condensed font-bold text-sm tracking-wider uppercase text-white mb-1">Zero Filler Pages</h4>
                  <p className="font-body text-xs text-sv-dim leading-relaxed">Every item in our store is selected for a reason. No algorithms, just curation.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Curation Lab / Interactive Quality Inspection Desk
interface SpecItem {
  id: string;
  title: string;
  image: string;
  subtitle: string;
  location: string;
  intro: string;
  specs: string[];
}

function CurationLab() {
  const [activeSpec, setActiveSpec] = useState<string>('workshop');

  const items: SpecItem[] = [
    {
      id: 'workshop',
      title: 'The Curation Hub',
      image: '/about_workshop.png',
      subtitle: 'SELECTION STUDIO',
      location: 'BHUSAWAL, MH',
      intro: 'Our core operations team works from this workspace. We inspect fabric rolls, review stitch templates, and coordinate sample test cycles.',
      specs: [
        'Sample validation: 100% of collections pre-tested',
        'Cuts approved: straight fit, baggy fit, dropped-shoulder',
        'Curation rate: under 5% of garments sourced are accepted'
      ]
    },
    {
      id: 'rivet',
      title: 'Construction & Hardware',
      image: '/about_rivet_detail.png',
      subtitle: 'HARDWARE LOG',
      location: 'LAB SPECS',
      intro: 'Clothing is built to be worn. We test copper rivets, verify zipper slides, and ensure structural seams are double-reinforced.',
      specs: [
        'Reinforcements: copper rivets at high stress points',
        'Zippers: smooth-glide metal teeth (tested for 5000+ cycles)',
        'Stitching: heavy-duty thread count, high-density edge overlocks'
      ]
    },
    {
      id: 'weave',
      title: 'Textile Integrity',
      image: '/about_raw_weave.png',
      subtitle: 'FABRIC INDEX',
      location: 'TEXTILE LAB',
      intro: 'We prioritize natural cottons and premium indigo dyes. Every denim fabric weight is verified and pre-shrunk to retain its shape after washes.',
      specs: [
        'Fabric weight: 12.5oz to 14.5oz premium raw denim weave',
        'T-Shirt grade: 220-260 GSM combed compact cotton',
        'Treatment: pre-washed and tumble pre-shrunk for size stability'
      ]
    }
  ];

  const currentItem = items.find(item => item.id === activeSpec) || items[0];

  return (
    <section className="relative py-24 md:py-32 bg-[#090909] border-b border-white/5 overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-6">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-6">
          <div className="space-y-4">
            <div className="font-condensed font-semibold text-[0.64rem] tracking-[0.38em] uppercase text-brass flex items-center gap-3">
              <span className="w-5 h-px bg-brass-dim" />
              Inspection Lab
            </div>
            <h2 className="font-display text-white uppercase text-4xl md:text-6xl leading-none">
              THE <span className="brass-text">CURATION</span> REPORT
            </h2>
          </div>
          {/* Switch tabs */}
          <div className="flex bg-white/[0.02] border border-white/10 rounded-lg p-1.5 shrink-0 self-stretch md:self-auto overflow-x-auto">
            {items.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveSpec(item.id)}
                className={`px-4 py-2 font-condensed font-semibold text-[0.68rem] tracking-wider uppercase rounded transition-all duration-300 ${activeSpec === item.id ? 'bg-brass text-void font-bold' : 'text-sv-mid hover:text-white'}`}
              >
                {item.id === 'workshop' ? 'Studio' : item.id === 'rivet' ? 'Hardware' : 'Fabrics'}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Left: Interactive Image Panel */}
          <div className="lg:col-span-6 relative aspect-[4/3] sm:aspect-[16/10] lg:aspect-[4/3] rounded-2xl overflow-hidden border border-white/10 group">
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-15 pointer-events-none" />
            
            <AnimatePresence mode="wait">
              <motion.img
                key={currentItem.id}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                src={currentItem.image}
                alt={currentItem.title}
                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500"
              />
            </AnimatePresence>

            <div className="absolute bottom-6 left-6 z-20 flex flex-col">
              <span className="font-condensed text-[0.55rem] tracking-[0.16em] uppercase text-brass font-bold">{currentItem.subtitle}</span>
              <span className="font-condensed text-sm tracking-[0.12em] uppercase text-white font-bold">{currentItem.location}</span>
            </div>
            
            <div className="absolute top-6 right-6 z-20 w-8 h-8 rounded-full bg-void/80 border border-white/15 flex items-center justify-center text-brass backdrop-blur-md">
              <Eye className="w-4 h-4" />
            </div>
          </div>

          {/* Right: Technical Spec Sheet */}
          <div className="lg:col-span-6 space-y-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentItem.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <span className="font-mono text-xs text-brass uppercase font-bold tracking-widest">// SPECIFICATION LOG</span>
                  <h3 className="font-display text-2xl md:text-3xl text-white uppercase tracking-wide">{currentItem.title}</h3>
                </div>

                <p className="font-body font-light text-sv-mid text-sm sm:text-base leading-relaxed">
                  {currentItem.intro}
                </p>

                {/* Specs List */}
                <div className="space-y-3.5 pt-4 border-t border-white/5">
                  {currentItem.specs.map((spec, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <span className="text-brass text-sm pt-0.5">⚡</span>
                      <p className="font-condensed font-bold text-xs sm:text-sm tracking-wider uppercase text-white">
                        {spec}
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

        </div>

      </div>
    </section>
  );
}

// Brand Philosophy
function PhilosophySection() {
  const pillars = [
    {
      n: '01',
      title: 'Aesthetic Focus',
      desc: "Streetwear cuts, clean washes, and comfortable fits that integrate naturally into your wardrobe."
    },
    {
      n: '02',
      title: 'Stitch & Fabric Testing',
      desc: "Every collection is run through wear tests, wash cycles, and seam checks before we list a single unit."
    },
    {
      n: '03',
      title: 'Honest Pricing',
      desc: "Sourcing direct and selling on a curated platform means skipping retail markup, label hype, and filler costs."
    }
  ];

  return (
    <section className="max-w-[1200px] mx-auto px-6 py-24 md:py-32 bg-void">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        {/* Left header */}
        <div className="lg:col-span-4 space-y-6">
          <div className="font-condensed font-semibold text-[0.64rem] tracking-[0.38em] uppercase text-brass flex items-center gap-3">
            <span className="w-5 h-px bg-brass-dim" />
            Core Values
          </div>
          <h2 className="font-display text-white uppercase text-3xl md:text-5xl leading-none">
            STYLE SHOULD FEEL <span className="brass-text">NATURAL</span>
          </h2>
          <p className="font-body font-light text-sv-mid text-sm sm:text-base leading-relaxed">
            Fashion shouldn&apos;t be about wearing the loudest design or paying massive brand markups. It&apos;s about confident cuts, comfortable fabrics, and building a rotation of items you actually look forward to wearing.
          </p>
        </div>

        {/* Right card grid */}
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-5">
          {pillars.map((p, i) => (
            <motion.div
              key={p.n}
              initial={{ opacity: 0, y: 20 }}
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
    { label: 'Oversized Fits', desc: 'Dropped shoulders, boxy profiles.' },
    { label: 'Curated Denim', desc: 'Baggy and straight washes, copper rivets.' },
    { label: 'Smart Combos', desc: 'Pre-matched outfits to save styling effort.' },
    { label: 'Everyday Comfort', desc: 'Combed cotton blends engineered for wear.' }
  ];

  const values = [
    'Direct coordination with workshops',
    'Careful, manual fabric selection',
    'Thorough hardware checks (zippers/rivets)',
    'Hassle-free sizing exchanges',
    'Honest, transparent pricing models'
  ];

  return (
    <section className="relative border-t border-white/5 py-24 px-6 md:py-32 bg-[#090909]">
      <div className="max-w-[1200px] mx-auto space-y-20">
        
        {/* Style Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center">
          <div className="lg:col-span-6 space-y-6">
            <div className="font-condensed font-semibold text-[0.64rem] tracking-[0.38em] uppercase text-brass flex items-center gap-3">
              <span className="w-5 h-px bg-brass-dim" />
              Collections
            </div>
            <h3 className="font-display text-white uppercase text-3xl md:text-5xl leading-none">
              TAILORED FOR DAILY LIFE
            </h3>
            <p className="font-body font-light text-sv-mid text-sm sm:text-base leading-relaxed">
              We look for styles that adapt to college, travel, weekends, or casual workspace environments. Thunderbold pieces are selected to look relaxed but feel premium.
            </p>
          </div>

          <div className="lg:col-span-6 grid grid-cols-2 gap-4">
            {experiences.map((exp, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.08 }}
                className="p-5 bg-white/[0.01] border border-white/5 rounded-xl hover:border-brass/25 transition-colors duration-300"
              >
                <h4 className="font-condensed font-bold text-sm text-brass uppercase tracking-wider mb-1">{exp.label}</h4>
                <p className="font-body text-xs text-sv-dim">{exp.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Sourcing Promise */}
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
                  className="flex items-center gap-4 py-2.5 border-b border-white/5"
                >
                  <span className="text-brass font-bold font-mono text-sm">0{idx + 1}</span>
                  <span className="font-condensed text-xs sm:text-sm font-bold uppercase tracking-wider text-white">{v}</span>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-6 space-y-6">
            <div className="font-condensed font-semibold text-[0.64rem] tracking-[0.38em] uppercase text-brass flex items-center gap-3">
              <span className="w-5 h-px bg-brass-dim" />
              Sourcing Promise
            </div>
            <h3 className="font-display text-white uppercase text-3xl md:text-5xl leading-none">
              QUALITY CHECKS, <span className="brass-text">NO EXCUSES</span>
            </h3>
            <p className="font-body font-light text-sv-mid text-sm sm:text-base leading-relaxed">
              We check every seam, thread count, zipper slide, and wash weight. When we buy directly and skip the middlemen, we invest that value straight back into premium fabrics and quality checks. No shortcuts, just transparent apparel curation.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}

// Interactive Collection CTA
function ExploreCTA() {
  return (
    <section className="relative py-24 md:py-36 bg-[#080808]">
      <div 
        className="absolute right-0 bottom-0 top-0 w-1/3 opacity-[0.03] pointer-events-none mix-blend-screen bg-cover bg-no-repeat bg-right-bottom"
        style={{ backgroundImage: "url('/about_rivet_detail.png')" }}
      />
      
      <div className="max-w-[1200px] mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          <div>
            <div className="font-condensed font-semibold text-[0.64rem] tracking-[0.38em] uppercase text-brass flex items-center gap-3 mb-6">
              <span className="w-5 h-px bg-brass-dim" />
              Shop Now
            </div>
            <h2 className="font-display text-white uppercase text-4xl md:text-6xl leading-[0.95] mb-6">
              SKIP THE FILLER.<br />
              EXPLORE THE <span className="brass-text">CATALOG</span>.
            </h2>
            <p className="font-body font-light text-sv-mid text-sm sm:text-base leading-relaxed max-w-md">
              Browse our curated denim, street tees, and outfit combos. Selected for everyday wearability, priced with honesty.
            </p>
          </div>

          <div className="flex flex-col gap-4 max-w-md w-full">
            <a
              href="/#categories"
              className="flex items-center justify-between px-6 py-5 border border-white/10 rounded-xl bg-white/[0.01] hover:border-brass/45 hover:bg-brass/[0.03] transition-all duration-300 group"
            >
              <span className="font-condensed text-[0.85rem] tracking-[0.16em] uppercase text-white/70 group-hover:text-white transition-colors duration-200">
                Shop Denim
              </span>
              <ArrowRight className="w-4 h-4 text-brass/50 group-hover:text-brass group-hover:translate-x-1.5 transition-all duration-300" />
            </a>

            <a
              href="/#categories"
              className="flex items-center justify-between px-6 py-5 border border-white/10 rounded-xl bg-white/[0.01] hover:border-brass/45 hover:bg-brass/[0.03] transition-all duration-300 group"
            >
              <span className="font-condensed text-[0.85rem] tracking-[0.16em] uppercase text-white/70 group-hover:text-white transition-colors duration-200">
                Explore T-Shirts
              </span>
              <ArrowRight className="w-4 h-4 text-brass/50 group-hover:text-brass group-hover:translate-x-1.5 transition-all duration-300" />
            </a>

            <a
              href="/#categories"
              className="flex items-center justify-between px-6 py-5 border border-white/10 rounded-xl bg-white/[0.01] hover:border-brass/45 hover:bg-brass/[0.03] transition-all duration-300 group"
            >
              <span className="font-condensed text-[0.85rem] tracking-[0.16em] uppercase text-white/70 group-hover:text-white transition-colors duration-200">
                Browse Outfits
              </span>
              <ArrowRight className="w-4 h-4 text-brass/50 group-hover:text-brass group-hover:translate-x-1.5 transition-all duration-300" />
            </a>
          </div>
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
        <CurationManifesto />
        <CurationLab />
        <PhilosophySection />
        <ExperienceValue />
        <ExploreCTA />
      </main>
      <Footer />
    </div>
  );
}
