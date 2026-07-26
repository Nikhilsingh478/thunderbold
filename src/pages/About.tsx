import { useRef, useState, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Navbar from '../components/Navbar';
import ScrollProgress from '../components/ScrollProgress';
import CustomCursor from '../components/CustomCursor';
import { useSEO } from '../hooks/useSEO';

// ─── Animation Variants ────────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.8 } },
};

const slideLeft = {
  hidden: { opacity: 0, x: -40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const slideRight = {
  hidden: { opacity: 0, x: 40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const heroStagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.3 } },
};

const listStagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

function useInViewOnce(margin = '-100px') {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: margin as Parameters<typeof useInView>[1]['margin'] });
  return { ref, isInView };
}

// ─── Section 1: Statement Hero ─────────────────────────────────────────────────

function HeroStatement() {
  return (
    <section className="relative min-h-screen flex flex-col justify-center overflow-hidden pt-[calc(164px+var(--tb-banner-h))] pb-24 px-6 md:px-16">
      {/* Noise overlay for depth */}
      <div className="absolute inset-0 noise-overlay opacity-[0.04] pointer-events-none" />
      {/* Subtle brass glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 20% 50%, rgba(184,148,26,0.05) 0%, transparent 60%)' }}
      />

      <div className="max-w-[1200px] w-full">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={heroStagger}
        >
          {/* Line 1 — outlined ghost */}
          <motion.h1
            variants={fadeUp}
            className="font-display uppercase leading-[0.85] tracking-tight mb-4 select-none"
            style={{
              fontSize: 'clamp(2.2rem, 7.5vw, 7.5rem)',
              color: 'transparent',
              WebkitTextStroke: '1.5px #f0eeea',
            }}
          >
            WE DON&apos;T SELL FASHION.
          </motion.h1>

          {/* Line 2 — solid white */}
          <motion.h1
            variants={fadeUp}
            className="font-display text-tb-white uppercase leading-[0.85] tracking-tight mb-10 select-none"
            style={{ fontSize: 'clamp(2.2rem, 7.5vw, 7.5rem)' }}
          >
            WE SELL WHAT ACTUALLY WORKS.
          </motion.h1>

          {/* Brass subline */}
          <motion.p
            variants={fadeUp}
            className="font-condensed text-brass text-sm md:text-base tracking-[0.15em] max-w-lg"
          >
            A curated marketplace for Indian streetwear that earns its place in your wardrobe.
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Section 2: Problem We Solve ──────────────────────────────────────────────

const problems = [
  { n: '01', text: 'Too many options, zero curation' },
  { n: '02', text: 'Middlemen inflating prices by 3×' },
  { n: '03', text: 'Fast fashion pretending to be streetwear' },
  { n: '04', text: 'No accountability for fabric or fit' },
];

function ProblemSection() {
  const { ref: headRef, isInView: headInView } = useInViewOnce('-60px');
  const { ref: listRef, isInView: listInView } = useInViewOnce('-60px');
  const { ref: rightRef, isInView: rightInView } = useInViewOnce('-60px');

  return (
    <section className="py-24 md:py-32 px-6 md:px-16 border-t border-white/[0.06]">
      <div className="max-w-[1200px] mx-auto">

        {/* Headline */}
        <motion.h2
          ref={headRef}
          initial="hidden"
          animate={headInView ? 'visible' : 'hidden'}
          variants={fadeUp}
          className="font-display text-tb-white uppercase leading-tight mb-16 md:mb-20"
          style={{ fontSize: 'clamp(2rem, 5.5vw, 5rem)' }}
        >
          Indian fashion has<br className="hidden md:block" /> a noise problem.
        </motion.h2>

        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24">

          {/* Left: numbered list */}
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
                className="flex items-start gap-6 py-6 border-b border-white/[0.06] group"
              >
                <span
                  className="font-display text-brass leading-none flex-shrink-0 select-none"
                  style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}
                >
                  {p.n}
                </span>
                <span className="font-condensed text-base md:text-lg text-tb-white uppercase tracking-wide leading-snug pt-1 group-hover:text-brass transition-colors duration-300">
                  {p.text}
                </span>
              </motion.div>
            ))}
          </motion.div>

          {/* Right: statement */}
          <motion.div
            ref={rightRef}
            initial="hidden"
            animate={rightInView ? 'visible' : 'hidden'}
            variants={fadeIn}
            className="flex flex-col justify-center"
          >
            <p
              className="font-display text-tb-white uppercase leading-tight mb-8"
              style={{ fontSize: 'clamp(1.8rem, 3.5vw, 3rem)' }}
            >
              We exist to fix exactly this.
            </p>
            <p className="font-condensed text-sv-mid text-base md:text-lg leading-relaxed">
              Every piece on Thunderbold passed through our hands before it reached yours. We inspect, reject, and curate — so you don&apos;t have to.
            </p>
          </motion.div>

        </div>
      </div>
    </section>
  );
}

// ─── Section 3: Marketplace Process ───────────────────────────────────────────

const processSteps = [
  {
    label: 'SOURCING',
    desc: 'We partner directly with Indian workshops and makers. No importers. No brand tax.',
  },
  {
    label: 'INSPECTION',
    desc: 'Every batch is physically checked for fabric quality, stitching, and sizing accuracy before listing.',
  },
  {
    label: 'CURATION',
    desc: 'Less than 10% of what we review makes it to the site. We reject more than we list.',
  },
  {
    label: 'LISTING',
    desc: 'What you see has earned its place. No filler, no sponsored placement.',
  },
  {
    label: 'YOUR WARDROBE',
    desc: 'Delivered. Worn. Kept.',
  },
];

function ProcessSection() {
  const { ref, isInView } = useInViewOnce('-80px');

  return (
    <section className="py-24 md:py-32 px-6 md:px-16 bg-[#0b0b0b] border-t border-white/[0.06]">
      <div className="max-w-[1200px] mx-auto">

        {/* Label + headline */}
        <div className="mb-16 md:mb-20">
          <p className="font-condensed text-brass text-[0.65rem] tracking-[0.4em] uppercase font-bold mb-5">
            The Platform
          </p>
          <h2
            className="font-display text-tb-white uppercase leading-tight"
            style={{ fontSize: 'clamp(2rem, 5vw, 4.5rem)' }}
          >
            From workshop floor<br className="hidden md:block" /> to your door.
          </h2>
        </div>

        {/* Desktop horizontal timeline */}
        <div className="hidden md:block" ref={ref}>
          {/* Animated connecting line */}
          <div className="relative h-px mb-10">
            <div className="absolute inset-0 bg-white/[0.08]" />
            <motion.div
              className="absolute top-0 left-0 h-full bg-brass"
              initial={{ width: '0%' }}
              animate={isInView ? { width: '100%' } : { width: '0%' }}
              transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
            />
          </div>

          {/* Steps */}
          <div className="flex gap-6">
            {processSteps.map((step, idx) => (
              <motion.div
                key={step.label}
                initial="hidden"
                animate={isInView ? 'visible' : 'hidden'}
                variants={fadeUp}
                transition={{ delay: 0.15 + idx * 0.18 }}
                className="flex-1"
              >
                <div className="w-2 h-2 rounded-full bg-brass mb-6" />
                <p className="font-condensed font-bold text-[0.65rem] tracking-[0.28em] uppercase text-brass mb-3">
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
          ref={ref}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={listStagger}
        >
          {processSteps.map((step, idx) => (
            <motion.div
              key={step.label}
              variants={slideLeft}
              className="flex gap-5"
            >
              <div className="flex flex-col items-center flex-shrink-0 pt-1">
                <div className="w-2 h-2 rounded-full bg-brass flex-shrink-0" />
                {idx < processSteps.length - 1 && (
                  <div className="w-px flex-1 bg-white/[0.08] mt-2 mb-0" style={{ minHeight: '40px' }} />
                )}
              </div>
              <div className="pb-8">
                <p className="font-condensed font-bold text-[0.65rem] tracking-[0.28em] uppercase text-brass mb-2">
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

// ─── Section 4: The Numbers ────────────────────────────────────────────────────

interface StatDef {
  prefix: string;
  end: number;
  suffix: string;
  label: string;
  desc: string;
}

function CounterStat({ prefix, end, suffix, label, desc, inView }: StatDef & { inView: boolean }) {
  const [count, setCount] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (!inView || started.current) return;
    if (end === 0) { started.current = true; return; }
    started.current = true;
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

  return (
    <div className="flex flex-col items-start">
      <span
        className="font-display text-brass leading-none select-none tabular-nums"
        style={{ fontSize: 'clamp(3rem, 7vw, 5.5rem)' }}
      >
        {prefix}{end === 0 ? '0' : count}{suffix}
      </span>
      <p className="font-condensed font-bold text-xs uppercase tracking-[0.22em] text-tb-white mt-5 mb-2">
        {label}
      </p>
      <p className="font-condensed text-sv-mid text-xs leading-relaxed max-w-[170px]">{desc}</p>
    </div>
  );
}

const stats: StatDef[] = [
  { prefix: '< ', end: 10, suffix: '%',  label: 'Make it to listing',  desc: 'Of sourced products pass our curation filter' },
  { prefix: '₹',  end: 0,  suffix: '',   label: 'Middleman markup',    desc: 'We source direct — you pay for the product, not the chain' },
  { prefix: '',   end: 100, suffix: '%', label: 'Physically inspected', desc: 'Every product in our catalog has passed human review' },
  { prefix: '',   end: 48,  suffix: 'hr',label: 'Average dispatch',    desc: 'After order confirmation, your item ships fast' },
];

function NumbersSection() {
  const { ref, isInView } = useInViewOnce('-60px');

  return (
    <section className="py-24 md:py-32 px-6 md:px-16 border-t border-white/[0.06]" ref={ref}>
      <div className="max-w-[1200px] mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-14 gap-x-8 lg:gap-x-0">
          {stats.map((stat, idx) => (
            <div key={idx} className="relative">
              {/* Vertical brass separator — desktop only */}
              {idx > 0 && (
                <div className="hidden lg:block absolute left-0 top-0 h-full w-px bg-brass/[0.18]" />
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

// ─── Section 5: Brand Side ─────────────────────────────────────────────────────

interface PillarDef { word: string; desc: string }

function Pillar({ word, desc }: PillarDef) {
  const { ref, isInView } = useInViewOnce('-60px');
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={fadeUp}
      className="py-10 border-b border-white/[0.06]"
    >
      <h3
        className="font-display uppercase leading-none select-none mb-4 cursor-default"
        style={{
          fontSize: 'clamp(3.5rem, 9vw, 7rem)',
          color: hovered ? 'transparent' : '#f0eeea',
          WebkitTextStroke: hovered ? '2px #b8941a' : '0px transparent',
          transition: 'color 0.45s ease, -webkit-text-stroke 0.45s ease',
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {word}
      </h3>
      <p className="font-condensed text-sv-mid text-base leading-relaxed max-w-xl">{desc}</p>
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
    <section className="py-24 md:py-32 px-6 md:px-16 bg-[#0b0b0b] border-t border-white/[0.06]">
      <div className="max-w-[1200px] mx-auto">

        {/* Headline mix */}
        <motion.div
          ref={ref}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={listStagger}
          className="mb-16"
        >
          <motion.h2
            variants={fadeUp}
            className="font-display text-tb-white uppercase leading-[0.88]"
            style={{ fontSize: 'clamp(2.5rem, 7vw, 6.5rem)' }}
          >
            STYLE THAT
          </motion.h2>
          <motion.h2
            variants={fadeUp}
            className="font-display uppercase leading-[0.88] mb-10"
            style={{
              fontSize: 'clamp(2.5rem, 7vw, 6.5rem)',
              color: 'transparent',
              WebkitTextStroke: '1.5px #b8941a',
            }}
          >
            EARNS ITS PLACE
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="font-condensed text-sv-mid text-base md:text-lg leading-relaxed max-w-xl"
          >
            We don&apos;t chase trends. We look for pieces that work across contexts — campus, commute,
            casual Friday. Indian sizing. Indian weather. Indian life.
          </motion.p>
        </motion.div>

        {/* Pillars */}
        <div>
          {pillars.map((p) => (
            <Pillar key={p.word} {...p} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Section 6: The People ─────────────────────────────────────────────────────

function PeopleSection() {
  const { ref: textRef, isInView: textInView } = useInViewOnce('-60px');
  const { ref: quoteRef, isInView: quoteInView } = useInViewOnce('-60px');

  return (
    <section className="py-24 md:py-32 px-6 md:px-16 border-t border-white/[0.06]">
      <div className="max-w-[1200px] mx-auto">

        {/* Founder text */}
        <motion.div
          ref={textRef}
          initial="hidden"
          animate={textInView ? 'visible' : 'hidden'}
          variants={listStagger}
          className="grid lg:grid-cols-2 gap-16 lg:gap-24 mb-20"
        >
          <div>
            <motion.h2
              variants={fadeUp}
              className="font-display text-tb-white uppercase leading-tight mb-8"
              style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)' }}
            >
              Built in Bhusawal.
            </motion.h2>
            <motion.p
              variants={fadeUp}
              className="font-condensed text-sv-mid text-base md:text-lg leading-relaxed"
            >
              We&apos;re not a Mumbai startup with VC money and a fancy office. We&apos;re two people
              from Maharashtra who got tired of overpriced streetwear and decided to do something
              about it. Thunderbold started as a side project and became a conviction.
            </motion.p>
          </div>
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
            className="font-display text-brass leading-none mb-4 select-none"
            style={{ fontSize: 'clamp(4rem, 10vw, 8rem)', lineHeight: 0.75 }}
          >
            &ldquo;
          </div>
          <blockquote
            className="font-display text-tb-white italic uppercase leading-tight"
            style={{ fontSize: 'clamp(1.4rem, 3.5vw, 2.8rem)' }}
          >
            If it&apos;s on Thunderbold, we&apos;d wear it ourselves.
          </blockquote>
        </motion.div>

      </div>
    </section>
  );
}

// ─── Section 7: The Promise CTA ────────────────────────────────────────────────

function PromiseCTA() {
  const { ref, isInView } = useInViewOnce('-60px');

  return (
    <section className="py-24 md:py-36 px-6 md:px-16 bg-[#0b0b0b] border-t border-white/[0.06]">
      <div className="max-w-[1200px] mx-auto text-center">
        <motion.div
          ref={ref}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={listStagger}
        >
          <motion.h2
            variants={fadeUp}
            className="font-display text-tb-white uppercase leading-tight"
            style={{ fontSize: 'clamp(2.2rem, 6.5vw, 6rem)' }}
          >
            No filler. No middlemen.
          </motion.h2>
          <motion.h2
            variants={fadeUp}
            className="font-display text-tb-white uppercase leading-tight mb-14"
            style={{ fontSize: 'clamp(2.2rem, 6.5vw, 6rem)' }}
          >
            Just clothes that work.
          </motion.h2>

          <motion.div variants={fadeUp} className="flex flex-col items-center gap-6">
            {/* Brass button with fill-from-left hover */}
            <a
              href="/"
              className="relative overflow-hidden group inline-flex items-center gap-3 border border-brass text-brass font-condensed font-bold text-sm tracking-[0.22em] uppercase px-10 py-5 transition-colors duration-300 hover:text-void"
            >
              <span
                className="absolute inset-0 bg-brass origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"
                style={{ transformOrigin: 'left' }}
              />
              <span className="relative z-10 flex items-center gap-3">
                Explore the Catalog
                <ArrowRight size={16} />
              </span>
            </a>

            <p className="font-condensed text-sv-dim text-xs tracking-[0.1em] max-w-sm leading-relaxed">
              Cash on delivery. Free returns on quality issues. Real people answering your questions.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Main Export ───────────────────────────────────────────────────────────────

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
        <ProblemSection />
        <ProcessSection />
        <NumbersSection />
        <BrandSection />
        <PeopleSection />
        <PromiseCTA />
      </main>
    </div>
  );
}
