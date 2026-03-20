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
    body: 'Gunmetal hardware. Brass accents. Artisan-grade suede branding. The difference between good and exceptional lives in the details most will never see — but you will feel.',
  },
];

const Pillars = () => (
  <section id="details" className="bg-surface border-t border-b border-sb py-20 px-6 md:py-28 md:px-16 relative overflow-hidden">
    {/* Watermark */}
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
      <span className="font-display ghost-stroke uppercase" style={{ fontSize: 'clamp(5rem, 14vw, 14rem)', opacity: 0.15, lineHeight: 1 }}>
        THUNDERBOLT
      </span>
    </div>

    <div className="relative z-10 max-w-[1340px] mx-auto">
      <div className="font-condensed font-semibold uppercase text-sv-mid flex items-center gap-3 mb-6" style={{ fontSize: '0.66rem', letterSpacing: '0.38em' }}>
        <span className="w-4 h-px bg-sv-dim inline-block" />
        Our Pillars
      </div>
      <h2 className="font-display text-tb-white mb-16" style={{ fontSize: 'clamp(3.4rem, 7vw, 6rem)', lineHeight: 0.92 }}>
        WHAT WE<br />STAND FOR
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 md:divide-x divide-sb">
        {pillars.map((p, i) => (
          <motion.div
            key={p.n}
            className="relative overflow-hidden p-10 md:p-14 group hover:bg-s2 transition-colors duration-300"
            initial={{ opacity: 0, y: 36 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1], delay: i * 0.12 }}
          >
            {/* Bottom shimmer */}
            <span className="absolute bottom-0 left-0 right-0 h-px bg-sv-dim scale-x-0 group-hover:scale-x-100 transition-transform duration-[450ms] origin-center" />
            <span className="font-display text-sv-dim leading-none mb-6 block" style={{ fontSize: '5rem', opacity: 0.3 }}>{p.n}</span>
            <h3 className="font-condensed font-bold uppercase text-tb-white mb-4" style={{ fontSize: '1.38rem', letterSpacing: '0.07em' }}>{p.title}</h3>
            <p className="font-body font-light text-sv-mid" style={{ fontSize: '0.92rem', lineHeight: 1.72 }}>{p.body}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default Pillars;
