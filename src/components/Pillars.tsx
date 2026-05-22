import { motion } from 'framer-motion';

const pillars = [
  {
    n: '01',
    title: 'Comfort & Movement',
    body: 'Stretch denim that naturally adapts to your body. Moves freely throughout the day.',
  },
  {
    n: '02',
    title: 'Engineered Durability',
    body: 'Built to withstand daily wear with reinforced seams. Made to last, wash after wash.',
  },
  {
    n: '03',
    title: 'Precision Finish',
    body: 'Careful attention to stitching and hardware. Quality you notice from day one.',
  },
];

const Pillars = () => (
  <section className="bg-surface border-t border-b border-sb py-24 px-6 md:py-28 md:px-0 relative overflow-hidden">
    {/* Watermark removed as requested */}

    <div className="max-w-[1340px] mx-auto relative z-10 md:px-16">
      <div className="font-condensed font-semibold uppercase text-sv-mid flex items-center gap-3 mb-6 md:mb-14" style={{ fontSize: '0.66rem', letterSpacing: '0.38em' }}>
        <span className="w-4 h-px bg-brass-dim inline-block" />
        The Three Pillars
      </div>
      <h2 className="font-display text-tb-white mb-16" style={{ fontSize: 'clamp(2.8rem, 10vw, 5.5rem)', lineHeight: 0.92 }}>
        WHAT WE<br /><span className="metal-text">STAND</span> <span className="brass-text">FOR</span>
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-px mt-14" style={{ background: 'rgba(255,255,255,0.065)' }}>
        {pillars.map((p, i) => (
          <motion.div
            key={p.n}
            className="relative overflow-hidden bg-surface p-10 md:p-12 group hover:bg-s2 transition-colors duration-300"
            initial={{ opacity: 0, y: 36 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1], delay: i * 0.12 }}
          >
            {/* Bottom shimmer on hover */}
            <span
              className="absolute bottom-0 left-0 right-0 h-px scale-x-0 group-hover:scale-x-100 transition-transform duration-[450ms] origin-center"
              style={{ background: 'linear-gradient(90deg, transparent, #b8941a, transparent)' }}
            />

            <span className="font-display text-[5rem] md:text-[5.5rem] leading-none text-brass opacity-60 group-hover:opacity-100 transition-opacity duration-300 block mb-6 md:mb-8">
              {p.n}
            </span>

            {/* Brass accent line */}
            <div className="w-8 md:w-10 h-px bg-brass mb-4 md:mb-5" />

            <span className="font-condensed font-bold text-[1.3rem] md:text-[1.4rem] tracking-[0.07em] uppercase text-tb-white block mb-3 md:mb-4">
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
