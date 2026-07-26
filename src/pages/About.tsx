import { useRef, useState, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import ScrollProgress from '../components/ScrollProgress';
import CustomCursor from '../components/CustomCursor';
import { useSEO } from '../hooks/useSEO';

// ─── Design tokens (from tailwind.config.ts) ─────────────────────────────────
// brass: #b8941a  |  brass-bright: #d4aa30  |  void: #070707  |  tb-white: #f0eeea
// sv-mid: #8c8c8c |  sv-dim: #383838

// ─── Animation Variants ───────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 48 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.9, ease: 'easeOut' as const } },
};

const slideLeft = {
  hidden: { opacity: 0, x: -56 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const slideRight = {
  hidden: { opacity: 0, x: 56 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const heroStagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.28 } },
};

const listStagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.13 } },
};

// ─── Shared hook ─────────────────────────────────────────────────────────────

function useInViewOnce(margin = '-80px') {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, {
    once: true,
    margin: margin as Parameters<typeof useInView>[1]['margin'],
  });
  return { ref, isInView };
}

// ─── Divider ─────────────────────────────────────────────────────────────────

function SectionDivider() {
  return <div className="w-full h-px bg-white/[0.055]" />;
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1 — THE STATEMENT (Hero)
// ─────────────────────────────────────────────────────────────────────────────

function HeroStatement() {
  return (
    <section
      className="relative min-h-screen flex flex-col justify-end overflow-hidden pb-20 md:pb-28 px-6 md:px-16 lg:px-24"
      style={{ paddingTop: 'calc(160px + var(--tb-banner-h, 0px))' }}
    >
      {/* Noise grain overlay — depth layer */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E\")",
          opacity: 0.035,
          zIndex: 0,
        }}
      />

      {/* Radial brass glow — bottom left */}
      <div
        aria-hidden
        className="absolute bottom-0 left-0 w-[60vw] h-[50vh] pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 0% 100%, rgba(184,148,26,0.07) 0%, transparent 65%)',
          zIndex: 0,
        }}
      />

      {/* Large decorative number — background depth */}
      <div
        aria-hidden
        className="absolute right-0 top-1/2 -translate-y-1/2 font-display text-right leading-none select-none pointer-events-none hidden lg:block"
        style={{
          fontSize: 'clamp(14rem, 22vw, 22rem)',
          color: 'transparent',
          WebkitTextStroke: '1px rgba(255,255,255,0.03)',
          userSelect: 'none',
        }}
      >
        TB
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-[1300px] w-full">
        <motion.div initial="hidden" animate="visible" variants={heroStagger}>
          {/* Pre-label */}
          <motion.p
            variants={fadeUp}
            className="font-condensed text-brass text-[0.6rem] tracking-[0.55em] uppercase font-bold mb-8 md:mb-10"
          >
            Thunderbold / Our Story
          </motion.p>

          {/* Line 1 — ghost outlined */}
          <motion.h1
            variants={fadeUp}
            className="font-display uppercase leading-[0.82] tracking-tighter select-none mb-3"
            style={{
              fontSize: 'clamp(2.6rem, 8.5vw, 9rem)',
              color: 'transparent',
              WebkitTextStroke: '1.5px rgba(240,238,234,0.9)',
            }}
          >
            WE DON&apos;T SELL FASHION.
          </motion.h1>

          {/* Line 2 — solid white */}
          <motion.h1
            variants={fadeUp}
            className="font-display text-tb-white uppercase leading-[0.82] tracking-tighter select-none mb-12 md:mb-16"
            style={{ fontSize: 'clamp(2.6rem, 8.5vw, 9rem)' }}
          >
            WE SELL WHAT ACTUALLY WORKS.
          </motion.h1>

          {/* Brass sentence + horizontal rule */}
          <motion.div variants={fadeUp} className="flex items-center gap-6 max-w-2xl">
            <div className="h-px w-10 bg-brass flex-shrink-0" />
            <p className="font-condensed text-brass text-sm md:text-base tracking-[0.14em] leading-relaxed">
              A curated marketplace for Indian streetwear that earns its place in your wardrobe.
            </p>
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom-right scroll cue */}
      <motion.div
        className="absolute bottom-10 right-6 md:right-16 flex items-center gap-2 z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.6 }}
      >
        <span className="font-condensed text-sv-mid text-[0.6rem] tracking-[0.4em] uppercase">
          Scroll
        </span>
        <div className="w-12 h-px bg-sv-mid" />
      </motion.div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2 — THE PROBLEM WE SOLVE
// ─────────────────────────────────────────────────────────────────────────────

const problems = [
  { n: '01', text: 'Too many options, zero curation' },
  { n: '02', text: 'Middlemen inflating prices by 3×' },
  { n: '03', text: 'Fast fashion pretending to be streetwear' },
  { n: '04', text: 'No accountability for fabric or fit' },
];

function ProblemSection() {
  const { ref: headRef, isInView: headInView } = useInViewOnce('-60px');
  const { ref: listRef, isInView: listInView } = useInViewOnce('-40px');
  const { ref: rightRef, isInView: rightInView } = useInViewOnce('-40px');

  return (
    <section className="py-28 md:py-36 px-6 md:px-16 lg:px-24 bg-void">
      <div className="max-w-[1300px] mx-auto">

        {/* Section label */}
        <p className="font-condensed text-sv-mid text-[0.6rem] tracking-[0.5em] uppercase font-bold mb-8">
          The Problem
        </p>

        {/* Headline */}
        <motion.h2
          ref={headRef}
          initial="hidden"
          animate={headInView ? 'visible' : 'hidden'}
          variants={fadeUp}
          className="font-display text-tb-white uppercase leading-[0.88] tracking-tight mb-20 md:mb-24"
          style={{ fontSize: 'clamp(2.2rem, 6vw, 6rem)' }}
        >
          Indian fashion has<br className="hidden md:block" /> a noise problem.
        </motion.h2>

        <div className="grid lg:grid-cols-[1fr_1fr] gap-16 lg:gap-28">
          {/* Left: Numbered problems */}
          <motion.div
            ref={listRef}
            initial="hidden"
            animate={listInView ? 'visible' : 'hidden'}
            variants={listStagger}
          >
            {problems.map((p) => (
              <motion.div
                key={p.n}
                variants={slideLeft}
                className="group flex items-start gap-7 py-7 border-b border-white/[0.055]"
              >
                <span
                  className="font-display text-brass leading-none flex-shrink-0 select-none transition-transform duration-300 group-hover:scale-110"
                  style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)' }}
                >
                  {p.n}
                </span>
                <div className="flex-1 pt-1">
                  <span className="font-condensed text-base md:text-lg text-tb-white uppercase tracking-wide leading-snug group-hover:text-brass transition-colors duration-300">
                    {p.text}
                  </span>
                </div>
                <div className="w-0 h-px bg-brass self-center group-hover:w-6 transition-all duration-500" />
              </motion.div>
            ))}
          </motion.div>

          {/* Right: Response statement */}
          <motion.div
            ref={rightRef}
            initial="hidden"
            animate={rightInView ? 'visible' : 'hidden'}
            variants={fadeIn}
            className="flex flex-col justify-center lg:pl-8"
          >
            {/* Large italic statement */}
            <p
              className="font-display text-tb-white uppercase leading-[0.9] mb-8 tracking-tight"
              style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)' }}
            >
              We exist to fix<br />exactly this.
            </p>

            {/* Thin brass rule */}
            <div className="w-14 h-px bg-brass mb-8" />

            <p className="font-condensed text-sv-mid text-base md:text-lg leading-relaxed">
              Every piece on Thunderbold passed through our hands before it reached yours. We
              inspect, reject, and curate — so you don&apos;t have to.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3 — THE PLATFORM (Marketplace process)
// ─────────────────────────────────────────────────────────────────────────────

const processSteps = [
  {
    n: '01',
    label: 'SOURCING',
    desc: 'We partner directly with Indian workshops and makers. No importers. No brand tax.',
  },
  {
    n: '02',
    label: 'INSPECTION',
    desc: 'Every batch is physically checked for fabric quality, stitching, and sizing accuracy before listing.',
  },
  {
    n: '03',
    label: 'CURATION',
    desc: 'Less than 10% of what we review makes it to the site. We reject more than we list.',
  },
  {
    n: '04',
    label: 'LISTING',
    desc: 'What you see has earned its place. No filler, no sponsored placement.',
  },
  {
    n: '05',
    label: 'YOUR WARDROBE',
    desc: 'Delivered. Worn. Kept.',
  },
];

function ProcessSection() {
  const { ref: headRef, isInView: headInView } = useInViewOnce('-60px');
  const { ref: timelineRef, isInView: timelineInView } = useInViewOnce('-40px');

  return (
    <section className="py-28 md:py-36 px-6 md:px-16 lg:px-24 bg-[#0a0a0a]">
      <div className="max-w-[1300px] mx-auto">

        {/* Label + headline */}
        <motion.div
          ref={headRef}
          initial="hidden"
          animate={headInView ? 'visible' : 'hidden'}
          variants={listStagger}
          className="mb-20 md:mb-28"
        >
          <motion.p
            variants={fadeUp}
            className="font-condensed text-brass text-[0.6rem] tracking-[0.5em] uppercase font-bold mb-6"
          >
            The Platform
          </motion.p>
          <motion.h2
            variants={fadeUp}
            className="font-display text-tb-white uppercase leading-[0.88] tracking-tight"
            style={{ fontSize: 'clamp(2.2rem, 6vw, 6rem)' }}
          >
            From workshop floor<br className="hidden md:block" /> to your door.
          </motion.h2>
        </motion.div>

        {/* Desktop horizontal timeline */}
        <div className="hidden md:block" ref={timelineRef}>
          {/* Animated brass line */}
          <div className="relative h-px mb-12">
            <div className="absolute inset-0 bg-white/[0.07]" />
            <motion.div
              className="absolute top-0 left-0 h-full bg-brass"
              initial={{ width: '0%' }}
              animate={timelineInView ? { width: '100%' } : { width: '0%' }}
              transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
            />
          </div>

          {/* Step cards */}
          <div className="flex gap-4 lg:gap-6">
            {processSteps.map((step, idx) => (
              <motion.div
                key={step.label}
                initial="hidden"
                animate={timelineInView ? 'visible' : 'hidden'}
                variants={fadeUp}
                transition={{ delay: 0.2 + idx * 0.15 }}
                className="flex-1 group"
              >
                {/* Dot */}
                <div className="w-2 h-2 rounded-full bg-brass mb-7 transition-transform duration-300 group-hover:scale-150" />
                {/* Step number */}
                <p className="font-display text-sv-dim text-xs tracking-widest mb-1">{step.n}</p>
                {/* Label */}
                <p className="font-condensed font-bold text-[0.65rem] tracking-[0.3em] uppercase text-brass mb-4">
                  {step.label}
                </p>
                <p className="font-condensed text-sv-mid text-sm leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Mobile vertical timeline */}
        <motion.div
          className="md:hidden"
          ref={timelineRef}
          initial="hidden"
          animate={timelineInView ? 'visible' : 'hidden'}
          variants={listStagger}
        >
          {processSteps.map((step, idx) => (
            <motion.div key={step.label} variants={slideLeft} className="flex gap-6">
              <div className="flex flex-col items-center flex-shrink-0 pt-1">
                <div className="w-2 h-2 rounded-full bg-brass" />
                {idx < processSteps.length - 1 && (
                  <div className="w-px flex-1 bg-white/[0.07] mt-2" style={{ minHeight: 48 }} />
                )}
              </div>
              <div className="pb-10">
                <p className="font-display text-sv-dim text-[0.6rem] tracking-widest mb-1">
                  {step.n}
                </p>
                <p className="font-condensed font-bold text-[0.65rem] tracking-[0.3em] uppercase text-brass mb-3">
                  {step.label}
                </p>
                <p className="font-condensed text-sv-mid text-sm leading-relaxed">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4 — THE NUMBERS
// ─────────────────────────────────────────────────────────────────────────────

interface StatDef {
  display: string;   // static display value (may include prefix/suffix + zero check)
  end: number;       // target number for counter (0 if stat is static)
  prefix: string;
  suffix: string;
  label: string;
  desc: string;
}

function CounterStat({ prefix, end, suffix, display, label, desc, inView }: StatDef & { inView: boolean }) {
  const [count, setCount] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (!inView || started.current) return;
    started.current = true;
    if (end === 0) return;
    const duration = 1800;
    const startTime = performance.now();
    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * end));
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [inView, end]);

  const rendered = end === 0 ? display : `${prefix}${count}${suffix}`;

  return (
    <div className="flex flex-col items-start">
      <span
        className="font-display text-brass leading-none select-none tabular-nums"
        style={{ fontSize: 'clamp(3rem, 7vw, 6rem)' }}
      >
        {rendered}
      </span>
      <p className="font-condensed font-bold text-[0.65rem] uppercase tracking-[0.28em] text-tb-white mt-5 mb-2">
        {label}
      </p>
      <p className="font-condensed text-sv-mid text-xs leading-relaxed max-w-[180px]">{desc}</p>
    </div>
  );
}

const stats: StatDef[] = [
  {
    display: '< 10%',
    end: 10,
    prefix: '< ',
    suffix: '%',
    label: 'Make it to listing',
    desc: 'Of sourced products pass our curation filter',
  },
  {
    display: '₹0',
    end: 0,
    prefix: '₹',
    suffix: '',
    label: 'Middleman markup',
    desc: 'We source direct — you pay for the product, not the chain',
  },
  {
    display: '100%',
    end: 100,
    prefix: '',
    suffix: '%',
    label: 'Physically inspected',
    desc: 'Every product in our catalog has passed human review',
  },
  {
    display: '48hr',
    end: 48,
    prefix: '',
    suffix: 'hr',
    label: 'Average dispatch',
    desc: 'After order confirmation, your item ships fast',
  },
];

function NumbersSection() {
  const { ref, isInView } = useInViewOnce('-40px');

  return (
    <section className="py-28 md:py-36 px-6 md:px-16 lg:px-24 bg-void">
      <div className="max-w-[1300px] mx-auto" ref={ref}>
        {/* Top section label */}
        <p className="font-condensed text-sv-mid text-[0.6rem] tracking-[0.5em] uppercase font-bold mb-16">
          By the numbers
        </p>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-16 gap-x-8 lg:gap-x-0">
          {stats.map((stat, idx) => (
            <div key={idx} className="relative">
              {/* Vertical brass separator — desktop only */}
              {idx > 0 && (
                <div className="hidden lg:block absolute left-0 top-0 h-full w-px bg-brass/[0.15]" />
              )}
              <div className="lg:px-10">
                <CounterStat {...stat} inView={isInView} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 5 — THE BRAND SIDE (Aesthetic conviction + pillars)
// ─────────────────────────────────────────────────────────────────────────────

interface PillarDef {
  word: string;
  desc: string;
}

function Pillar({ word, desc }: PillarDef) {
  const { ref, isInView } = useInViewOnce('-40px');
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={fadeUp}
      className="py-12 border-b border-white/[0.055] group"
    >
      <div className="flex flex-col md:flex-row md:items-baseline md:gap-12">
        {/* Giant pillar word */}
        <h3
          className="font-display uppercase leading-none select-none mb-4 md:mb-0 flex-shrink-0 cursor-default"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            fontSize: 'clamp(4rem, 10vw, 8.5rem)',
            color: hovered ? 'transparent' : '#f0eeea',
            WebkitTextStroke: hovered ? '2px #b8941a' : '0px transparent',
            transition: 'color 0.45s ease, -webkit-text-stroke 0.45s ease',
            willChange: 'color',
          }}
        >
          {word}
        </h3>

        {/* Separator rule — desktop */}
        <div className="hidden md:block w-px h-12 bg-white/[0.12] flex-shrink-0 self-center" />

        {/* Description */}
        <p className="font-condensed text-sv-mid text-base md:text-lg leading-relaxed max-w-xl">
          {desc}
        </p>
      </div>
    </motion.div>
  );
}

function BrandSection() {
  const { ref, isInView } = useInViewOnce('-60px');

  const pillars: PillarDef[] = [
    {
      word: 'COMFORT',
      desc: 'Fabric that works in 40°C Indian summers, not European runways.',
    },
    {
      word: 'LONGEVITY',
      desc: "We reject anything that won't survive 50 washes. Fast fashion doesn't belong here.",
    },
    {
      word: 'VALUE',
      desc: 'Direct sourcing means you pay for the product, not the brand tax.',
    },
  ];

  return (
    <section className="py-28 md:py-36 px-6 md:px-16 lg:px-24 bg-[#0a0a0a]">
      <div className="max-w-[1300px] mx-auto">

        {/* Section label */}
        <p className="font-condensed text-sv-mid text-[0.6rem] tracking-[0.5em] uppercase font-bold mb-8">
          The Brand
        </p>

        {/* Mixed headline */}
        <motion.div
          ref={ref}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={listStagger}
          className="mb-20"
        >
          <motion.h2
            variants={fadeUp}
            className="font-display text-tb-white uppercase leading-[0.85] tracking-tight"
            style={{ fontSize: 'clamp(2.8rem, 8vw, 8rem)' }}
          >
            STYLE THAT
          </motion.h2>
          <motion.h2
            variants={fadeUp}
            className="font-display uppercase leading-[0.85] tracking-tight mb-10"
            style={{
              fontSize: 'clamp(2.8rem, 8vw, 8rem)',
              color: 'transparent',
              WebkitTextStroke: '1.5px #b8941a',
            }}
          >
            EARNS ITS PLACE
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="font-condensed text-sv-mid text-base md:text-lg leading-relaxed max-w-2xl"
          >
            We don&apos;t chase trends. We look for pieces that work across contexts — campus, commute,
            casual Friday. Indian sizing. Indian weather. Indian life.
          </motion.p>
        </motion.div>

        {/* Philosophy pillars */}
        <div>
          {pillars.map((p) => (
            <Pillar key={p.word} {...p} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 6 — THE PEOPLE (Human element)
// ─────────────────────────────────────────────────────────────────────────────

function PeopleSection() {
  const { ref: textRef, isInView: textInView } = useInViewOnce('-60px');
  const { ref: quoteRef, isInView: quoteInView } = useInViewOnce('-60px');

  return (
    <section className="py-28 md:py-36 px-6 md:px-16 lg:px-24 bg-void">
      <div className="max-w-[1300px] mx-auto">

        {/* Founder text block */}
        <motion.div
          ref={textRef}
          initial="hidden"
          animate={textInView ? 'visible' : 'hidden'}
          variants={listStagger}
          className="grid lg:grid-cols-[1.2fr_1fr] gap-16 lg:gap-24 mb-24 md:mb-32"
        >
          <div>
            <motion.p
              variants={fadeUp}
              className="font-condensed text-brass text-[0.6rem] tracking-[0.5em] uppercase font-bold mb-8"
            >
              Built in Bhusawal
            </motion.p>

            <motion.h2
              variants={fadeUp}
              className="font-display text-tb-white uppercase leading-[0.88] tracking-tight mb-10"
              style={{ fontSize: 'clamp(2.4rem, 6.5vw, 6rem)' }}
            >
              Built in Bhusawal.
            </motion.h2>

            <motion.p
              variants={fadeUp}
              className="font-condensed text-sv-mid text-base md:text-lg leading-relaxed"
            >
              We&apos;re not a Mumbai startup with VC money and a fancy office. We&apos;re two people from
              Maharashtra who got tired of overpriced streetwear and decided to do something about
              it. Thunderbold started as a side project and became a conviction.
            </motion.p>
          </div>

          {/* Right — a tall decorative brass rule + stats */}
          <motion.div
            variants={fadeIn}
            className="flex flex-col justify-end gap-8 lg:border-l lg:border-white/[0.06] lg:pl-16"
          >
            <div>
              <p
                className="font-display text-brass leading-none mb-1"
                style={{ fontSize: 'clamp(3rem, 6vw, 5rem)' }}
              >
                Day 1
              </p>
              <p className="font-condensed text-sv-mid text-sm tracking-wide">
                We inspect every batch by hand
              </p>
            </div>
            <div className="w-full h-px bg-white/[0.06]" />
            <div>
              <p
                className="font-display text-brass leading-none mb-1"
                style={{ fontSize: 'clamp(3rem, 6vw, 5rem)' }}
              >
                Still
              </p>
              <p className="font-condensed text-sv-mid text-sm tracking-wide">
                No outside investment. No compromises.
              </p>
            </div>
          </motion.div>
        </motion.div>

        {/* Pull quote */}
        <motion.div
          ref={quoteRef}
          initial="hidden"
          animate={quoteInView ? 'visible' : 'hidden'}
          variants={slideRight}
          className="border-l-2 border-brass pl-8 md:pl-14"
        >
          <div
            className="font-display text-brass leading-[0.7] mb-3 select-none"
            style={{ fontSize: 'clamp(4rem, 10vw, 9rem)' }}
            aria-hidden
          >
            &ldquo;
          </div>
          <blockquote
            className="font-display text-tb-white italic uppercase leading-tight"
            style={{ fontSize: 'clamp(1.5rem, 3.8vw, 3.2rem)' }}
          >
            If it&apos;s on Thunderbold, we&apos;d wear it ourselves.
          </blockquote>
        </motion.div>

      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 7 — THE PROMISE (CTA)
// ─────────────────────────────────────────────────────────────────────────────

function PromiseCTA() {
  const { ref, isInView } = useInViewOnce('-60px');

  return (
    <section className="py-28 md:py-40 px-6 md:px-16 lg:px-24 bg-[#0a0a0a]">
      <div className="max-w-[1300px] mx-auto">
        <motion.div
          ref={ref}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={listStagger}
        >
          {/* Oversize promise headline */}
          <motion.h2
            variants={fadeUp}
            className="font-display text-tb-white uppercase leading-[0.88] tracking-tight"
            style={{ fontSize: 'clamp(2.4rem, 7.5vw, 8rem)' }}
          >
            No filler.
          </motion.h2>
          <motion.h2
            variants={fadeUp}
            className="font-display text-tb-white uppercase leading-[0.88] tracking-tight"
            style={{ fontSize: 'clamp(2.4rem, 7.5vw, 8rem)' }}
          >
            No middlemen.
          </motion.h2>
          <motion.h2
            variants={fadeUp}
            className="font-display uppercase leading-[0.88] tracking-tight mb-16 md:mb-20"
            style={{
              fontSize: 'clamp(2.4rem, 7.5vw, 8rem)',
              color: 'transparent',
              WebkitTextStroke: '1.5px #b8941a',
            }}
          >
            Just clothes that work.
          </motion.h2>

          <motion.div variants={fadeUp} className="flex flex-col items-start gap-8">
            {/* Brass fill-from-left CTA button */}
            <Link
              to="/"
              className="relative overflow-hidden group inline-flex items-center gap-3 border border-brass text-brass font-condensed font-bold text-sm tracking-[0.24em] uppercase px-10 py-5 transition-colors duration-300 hover:text-void"
              aria-label="Explore the Thunderbold catalog"
            >
              <span
                className="absolute inset-0 bg-brass scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"
              />
              <span className="relative z-10 flex items-center gap-3">
                Explore the Catalog
                <ArrowRight size={15} />
              </span>
            </Link>

            <p className="font-condensed text-sv-mid text-xs tracking-[0.1em] leading-relaxed max-w-md">
              Cash on delivery. Free returns on quality issues. Real people answering your questions.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Export
// ─────────────────────────────────────────────────────────────────────────────

export default function About() {
  useSEO({
    title: 'About Us — Thunderbold',
    description:
      "We're not a Mumbai startup. We're two people from Maharashtra building a curated marketplace for Indian streetwear — inspected, rejected, and kept only when it earns its place.",
  });

  return (
    <div className="noise-overlay min-h-screen bg-void">
      <CustomCursor />
      <ScrollProgress />
      <Navbar />
      <main>
        <HeroStatement />
        <SectionDivider />
        <ProblemSection />
        <SectionDivider />
        <ProcessSection />
        <SectionDivider />
        <NumbersSection />
        <SectionDivider />
        <BrandSection />
        <SectionDivider />
        <PeopleSection />
        <SectionDivider />
        <PromiseCTA />
      </main>
    </div>
  );
}
