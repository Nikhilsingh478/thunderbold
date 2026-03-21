import { motion } from 'framer-motion';

const pillars = [
  {
    n: '01',
    title: 'Freedom of Movement',
    body: 'Engineered with 4-way stretch technology, Thunderbolt moves with you from the first hour to the last. No restriction. No compromise. All day, every direction.',
  },
  {
    n: '02',
    title: 'Unmatched Durability',
    body: 'Every seam, every loop, every decision is built to outlast the ordinary. Reinforced construction made for the relentless demands of a life without limits.',
  },
  {
    n: '03',
    title: 'Refined Finish',
    body: 'Gunmetal hardware. Brass accents. Artisan-grade suede branding. The difference between good and exceptional lives in the details most will never see.',
  },
];

const delays = [0.08, 0.20, 0.32];

const Pillars = () => (
  <section className="bg-surface border-t border-b border-sb py-24 px-6 md:py-28 md:px-16 relative overflow-hidden">
    {/* Watermark */}
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
      <span className="font-display whitespace-nowrap" style={{ fontSize: '20vw', color: 'rgba(255,255,255,0.016)', letterSpacing: '0.05em' }}>
        THUNDERBOLT
      </span>
    </div>

    <div className="max-w-[1340px] mx-auto relative z-10">
      <div className="font-condensed font-semibold uppercase text-sv-mid flex items-center gap-3 mb-6" style={{ fontSize: '0.66rem', letterSpacing: '0.38em' }}>
        <span className="w-4 h-px bg-brass-dim inline-block" />
        The Three Pillars
      </div>
      <h2 className="font-display text-tb-white mb-16" style={{ fontSize: 'clamp(2.8rem, 10vw, 5rem)', lineHeight: 0.92 }}>
        WHAT WE<br /><span className="metal-text">STAND</span> <span className="brass-text">FOR</span>
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3">
        {pillars.map((p, i) => (
          <motion.div
            key={p.n}
            className="relative overflow-hidden bg-surface p-10 md:p-14 group hover:bg-s2 transition-colors duration-300"
            initial={{ opacity: 0, y: 36 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1], delay: delays[i] }}
          >
            {/* Bottom shimmer on hover */}
            <span
              className="absolute bottom-0 left-0 right-0 h-px scale-x-0 group-hover:scale-x-100 transition-transform duration-[450ms] origin-center"
              style={{ background: 'linear-gradient(90deg, transparent, #b8941a, transparent)' }}
            />

            {/* Divider on mobile between cards */}
            {i > 0 && <span className="absolute top-0 left-6 right-6 h-px bg-brass/30 md:hidden" />}
            {/* Vertical divider on desktop */}
            {i > 0 && <span className="absolute top-10 bottom-10 left-0 w-px bg-sb hidden md:block" />}

            <span className="font-display text-[5rem] leading-none text-sv-dim opacity-25 group-hover:opacity-[0.45] transition-opacity duration-300 block mb-6">
              {p.n}
            </span>

            {/* Brass accent line */}
            <div className="w-8 h-px bg-brass/50 mb-4" />

            <span className="font-condensed font-bold text-[1.3rem] tracking-[0.07em] uppercase text-tb-white block mb-3">
              {p.title}
            </span>
            <span className="font-body font-light text-[0.93rem] leading-[1.78] text-sv-mid block">
              {p.body}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default Pillars;
