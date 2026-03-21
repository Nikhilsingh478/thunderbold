import { motion } from 'framer-motion';

const metrics = [
  { val: '4', label: 'Way Stretch', sub: 'Move freely in every direction, all day' },
  { val: '360°', label: 'Comfort', sub: 'From morning to midnight without compromise' },
  { val: '∞', label: 'Durability', sub: 'Outlasts every challenge you face' },
  { val: '01', label: 'Standard', sub: 'One benchmark — uncompromised premium denim' },
];

const Numbers = () => (
  <section className="bg-surface border-b border-sb py-24 px-6 md:py-28 md:px-16">
    <div className="max-w-[1340px] mx-auto">
      {/* Header — desktop: flex row with right text */}
      <div className="md:flex md:items-end md:justify-between">
        <div>
          <div className="font-condensed font-semibold uppercase text-sv-mid flex items-center gap-3 mb-6" style={{ fontSize: '0.66rem', letterSpacing: '0.38em' }}>
            <span className="w-4 h-px bg-brass-dim inline-block" />
            Precision by Design
          </div>
          <h2 className="font-display text-tb-white mb-16 md:mb-0" style={{ fontSize: 'clamp(2.8rem, 10vw, 5rem)', lineHeight: 0.92 }}>
            THE NUMBERS
          </h2>
        </div>
        <span className="hidden md:block font-condensed font-semibold text-[0.62rem] tracking-[0.32em] uppercase text-sv-dim mb-1">
          Premium · Uncompromised · Built for the Bold
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-px mt-14" style={{ background: 'rgba(255,255,255,0.065)' }}>
        {metrics.map((m, i) => (
          <motion.div
            key={m.label}
            className="bg-surface p-8 md:p-14 text-center group relative overflow-hidden hover:bg-s2 transition-colors duration-300"
            initial={{ opacity: 0, y: 36 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1], delay: i * 0.12 }}
          >
            {/* Top accent line on hover */}
            <span
              className="absolute top-0 left-0 right-0 h-px scale-x-0 group-hover:scale-x-100 transition-transform duration-[400ms] origin-center"
              style={{ background: 'linear-gradient(90deg, transparent, #b8941a, transparent)' }}
            />
            <span className="font-display brass-text block mb-2 md:mb-3" style={{ fontSize: 'clamp(3rem, 8vw, 4rem)', lineHeight: 1 }}>{m.val}</span>
            <span className="font-condensed font-bold uppercase text-tb-white block mb-1.5 md:mb-2 text-[0.82rem] md:text-[0.84rem]" style={{ letterSpacing: '0.16em' }}>{m.label}</span>
            <span className="font-body font-light text-sv-mid block text-[0.8rem] md:text-[0.82rem]" style={{ lineHeight: 1.55 }}>{m.sub}</span>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default Numbers;
