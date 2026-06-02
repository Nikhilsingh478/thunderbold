import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Instagram, Mail, ArrowRight } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ScrollProgress from '../components/ScrollProgress';
import CustomCursor from '../components/CustomCursor';

const reveal = {
  initial: { opacity: 0, y: 32 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-72px' } as const,
  transition: { duration: 0.85, ease: [0.16, 1, 0.3, 1] as const },
};

const staggerReveal = (delay: number) => ({
  ...reveal,
  transition: { ...reveal.transition, delay },
});

const categories = [
  {
    label: 'Denim',
    desc: 'Bootcut, Straight, Monk, Baggy & Distressed',
    icon: '⟡',
  },
  {
    label: 'T-Shirts',
    desc: 'Oversized, graphic & everyday fits',
    icon: '⊞',
  },
  {
    label: 'Shirts',
    desc: 'Casual, linen & structured styles',
    icon: '⊟',
  },
  {
    label: 'Kurtas',
    desc: 'Modern Indian silhouettes for every occasion',
    icon: '◈',
  },
];

const pillars = [
  {
    n: '01',
    title: 'Curated',
    desc: "Every piece is handpicked — not bulk-listed. We carry what we'd actually wear ourselves.",
  },
  {
    n: '02',
    title: 'Honest',
    desc: 'No inflated pricing, no fake hype. What you see is what you get, at a price that makes sense.',
  },
  {
    n: '03',
    title: 'Everyday',
    desc: "Fashion that works on the street, at work, and everywhere in between — not just for the gram.",
  },
];

function PageHero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '22%']);
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section
      ref={ref}
      className="relative min-h-[100svh] flex flex-col items-center justify-center overflow-hidden"
      style={{ background: '#0a0a0a' }}
    >
      {/* Subtle radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 70% 55% at 50% 40%, rgba(184,130,15,0.055) 0%, transparent 70%)',
        }}
      />

      <motion.div
        style={{ y, opacity }}
        className="relative z-10 text-center px-6 flex flex-col items-center"
      >
        {/* Eyebrow */}
        <motion.div {...staggerReveal(0)} className="flex items-center gap-3 mb-8">
          <span className="w-8 h-px bg-brass/50" />
          <span className="font-condensed text-[0.62rem] tracking-[0.42em] uppercase text-brass">
            Est. 2024 · India
          </span>
          <span className="w-8 h-px bg-brass/50" />
        </motion.div>

        {/* Main headline — three lines animated in */}
        {['CURATED', 'FOR THE', 'EVERYDAY'].map((word, i) => (
          <div key={word} className="overflow-hidden mb-1">
            <motion.h1
              initial={{ y: '110%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 1, delay: 0.15 + i * 0.11, ease: [0.16, 1, 0.3, 1] }}
              className={`font-display uppercase leading-[0.88] text-center ${i === 2 ? 'brass-text' : 'text-tb-white'}`}
              style={{ fontSize: 'clamp(4rem, 16vw, 13rem)', letterSpacing: '0.02em' }}
            >
              {word}
            </motion.h1>
          </div>
        ))}

        {/* Subtext */}
        <motion.p
          {...staggerReveal(0.7)}
          className="font-body font-light text-sv-mid mt-9 max-w-[460px] text-center"
          style={{ fontSize: '1.05rem', lineHeight: 1.82 }}
        >
          Thunderbold is a curated fashion store for modern India. Handpicked denim,
          streetwear, and everyday essentials — honest pricing, no compromise on style.
        </motion.p>

        {/* Scroll hint */}
        <motion.div {...staggerReveal(0.95)} className="mt-12 flex flex-col items-center gap-3">
          <span className="font-condensed text-[0.6rem] tracking-[0.3em] uppercase text-sv-dim">
            Our Story
          </span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            className="text-brass/50"
          >
            <svg width="16" height="24" viewBox="0 0 16 24" fill="none">
              <path
                d="M8 0v20M1 13l7 7 7-7"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Bottom gradient fade */}
      <div
        className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none"
        style={{ background: 'linear-gradient(0deg, #0a0a0a 0%, transparent 100%)' }}
      />
    </section>
  );
}

function StorySection() {
  return (
    <section className="max-w-[1100px] mx-auto px-6 py-28 md:px-16 md:py-40">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-24 items-center">

        {/* Left — headline */}
        <motion.div {...reveal}>
          <div className="font-condensed font-semibold text-[0.64rem] tracking-[0.38em] uppercase text-brass flex items-center gap-3 mb-7">
            <span className="w-4 h-px bg-brass-dim" />
            About Us
          </div>
          <h2
            className="font-display text-tb-white uppercase"
            style={{ fontSize: 'clamp(3rem, 9vw, 6rem)', lineHeight: 0.9, letterSpacing: '0.02em' }}
          >
            STYLE<br />THAT<br /><span className="brass-text">MAKES</span><br />SENSE.
          </h2>
        </motion.div>

        {/* Right — honest copy */}
        <motion.div {...staggerReveal(0.18)} className="space-y-5">
          <p
            className="font-body font-light text-sv-mid"
            style={{ fontSize: '1.06rem', lineHeight: 1.86 }}
          >
            We built Thunderbold because fashion felt either too expensive or too cheap
            to trust. There had to be a middle ground — pieces that look premium, fit well,
            and don't ask you to overpay for a label.
          </p>
          <p
            className="font-body font-light text-sv-mid"
            style={{ fontSize: '1.06rem', lineHeight: 1.86 }}
          >
            We're a curated fashion destination. Every item in our collection is handpicked
            for quality, fit, and everyday wearability. Denim, streetwear, shirts, and
            kurtas — all under one roof, all honestly priced.
          </p>
          <p
            className="font-body font-light text-sv-mid"
            style={{ fontSize: '1.06rem', lineHeight: 1.86 }}
          >
            No factories, no hype cycles. Just a store that takes its curation seriously.
          </p>

          <div className="pt-4 flex items-center gap-4">
            <div className="h-px flex-1 bg-white/[0.06]" />
            <span className="font-condensed text-[0.62rem] tracking-[0.3em] uppercase text-sv-dim">
              Bhusawal, India
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function CategoriesSection() {
  return (
    <section
      className="border-t border-b border-sb py-24 px-6 md:py-32 md:px-16"
      style={{ background: 'linear-gradient(180deg, #0d0d0d 0%, #0a0a0a 100%)' }}
    >
      <div className="max-w-[1100px] mx-auto">

        <motion.div {...reveal} className="mb-14 md:mb-16 text-center">
          <div className="font-condensed font-semibold text-[0.64rem] tracking-[0.38em] uppercase text-brass flex items-center justify-center gap-3 mb-6">
            <span className="w-4 h-px bg-brass-dim" />
            What We Carry
            <span className="w-4 h-px bg-brass-dim" />
          </div>
          <h2
            className="font-display text-tb-white uppercase"
            style={{ fontSize: 'clamp(2.8rem, 9vw, 5.5rem)', lineHeight: 0.92, letterSpacing: '0.02em' }}
          >
            THE <span className="brass-text">COLLECTION</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-px" style={{ background: 'rgba(255,255,255,0.05)' }}>
          {categories.map((cat, i) => (
            <motion.div
              key={cat.label}
              className="bg-bg p-7 md:p-8 group hover:bg-surface transition-colors duration-300 flex flex-col gap-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: i * 0.08 }}
            >
              <span className="font-display text-2xl text-brass group-hover:scale-110 transition-transform duration-300 inline-block">
                {cat.icon}
              </span>
              <div>
                <span className="font-condensed font-bold text-[1rem] tracking-[0.1em] uppercase text-tb-white block mb-1.5">
                  {cat.label}
                </span>
                <span className="font-body font-light text-[0.82rem] leading-relaxed text-sv-mid block">
                  {cat.desc}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PhilosophySection() {
  return (
    <section className="max-w-[1100px] mx-auto px-6 py-28 md:px-16 md:py-40">

      <motion.div {...reveal} className="mb-16 md:mb-20">
        <div className="font-condensed font-semibold text-[0.64rem] tracking-[0.38em] uppercase text-brass flex items-center gap-3 mb-6">
          <span className="w-4 h-px bg-brass-dim" />
          Our Philosophy
        </div>
        <h2
          className="font-display text-tb-white uppercase max-w-[600px]"
          style={{ fontSize: 'clamp(2.8rem, 8vw, 5rem)', lineHeight: 0.9, letterSpacing: '0.02em' }}
        >
          THREE THINGS <span className="brass-text">WE</span>{' '}
          NEVER COMPROMISE ON.
        </h2>
      </motion.div>

      <div className="space-y-0">
        {pillars.map((p, i) => (
          <motion.div
            key={p.n}
            className="flex items-start gap-6 md:gap-10 py-8 md:py-10 group relative"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1], delay: i * 0.1 }}
          >
            <span className="absolute left-0 top-0 bottom-0 w-px bg-brass/0 group-hover:bg-brass/50 transition-colors duration-300" />
            <span className="font-display text-[1rem] text-brass/35 min-w-[32px] mt-1 flex-shrink-0">{p.n}</span>
            <div className="flex-1 md:grid md:grid-cols-3 md:gap-10 md:items-center">
              <span className="font-condensed font-bold text-[1.05rem] tracking-[0.08em] uppercase text-tb-white block mb-2 md:mb-0">
                {p.title}
              </span>
              <p
                className="font-body font-light text-sv-mid md:col-span-2"
                style={{ fontSize: '1.02rem', lineHeight: 1.82 }}
              >
                {p.desc}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function ConnectSection() {
  return (
    <section
      className="border-t border-sb py-24 px-6 md:py-32 md:px-16"
      style={{ background: 'linear-gradient(180deg, #0a0a0a 0%, #090909 100%)' }}
    >
      <div className="max-w-[1100px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-center">

          {/* Left */}
          <motion.div {...reveal}>
            <div className="font-condensed font-semibold text-[0.64rem] tracking-[0.38em] uppercase text-brass flex items-center gap-3 mb-6">
              <span className="w-4 h-px bg-brass-dim" />
              Stay Connected
            </div>
            <h2
              className="font-display text-tb-white uppercase mb-6"
              style={{ fontSize: 'clamp(2.6rem, 8vw, 4.8rem)', lineHeight: 0.92, letterSpacing: '0.02em' }}
            >
              FIND US<br />ON THE<br /><span className="brass-text">GRAM.</span>
            </h2>
            <p className="font-body font-light text-sv-mid max-w-[380px]" style={{ fontSize: '1rem', lineHeight: 1.82 }}>
              New arrivals, curated looks, and drop updates. Follow{' '}
              <strong className="text-white font-normal">@thunderbold.shop</strong> on
              Instagram to stay ahead.
            </p>
          </motion.div>

          {/* Right — CTA cards */}
          <motion.div {...staggerReveal(0.2)} className="space-y-4">
            <a
              href="https://www.instagram.com/thunderbold.shop?igsh=MXM5dnFvMW45Z2Fh"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-6 py-5 border border-white/[0.1] bg-white/[0.02] hover:border-brass/40 hover:bg-brass/[0.04] transition-all duration-300 group"
            >
              <div className="flex items-center gap-4">
                <Instagram className="w-4 h-4 text-brass" />
                <span className="font-condensed text-[0.8rem] tracking-[0.14em] uppercase text-white/70 group-hover:text-white transition-colors duration-200">
                  @thunderbold.shop
                </span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-brass/50 group-hover:text-brass group-hover:translate-x-1 transition-all duration-300" />
            </a>

            <a
              href="mailto:support@thunderbolddenim.com"
              className="flex items-center justify-between px-6 py-5 border border-white/[0.1] bg-white/[0.02] hover:border-brass/40 hover:bg-brass/[0.04] transition-all duration-300 group"
            >
              <div className="flex items-center gap-4">
                <Mail className="w-4 h-4 text-brass" />
                <span className="font-condensed text-[0.8rem] tracking-[0.14em] uppercase text-white/70 group-hover:text-white transition-colors duration-200">
                  support@thunderbolddenim.com
                </span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-brass/50 group-hover:text-brass group-hover:translate-x-1 transition-all duration-300" />
            </a>

            <div className="pt-2">
              <p className="font-condensed text-[0.62rem] tracking-[0.2em] uppercase text-sv-dim">
                Bhusawal – 425201, Maharashtra, India
              </p>
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
        <CategoriesSection />
        <PhilosophySection />
        <ConnectSection />
      </main>
      <Footer />
    </div>
  );
}
