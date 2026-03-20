import { motion } from 'framer-motion';

const metrics = [
  { val: '4', label: 'Way Stretch', sub: 'Unrestricted movement in every direction, all day long' },
  { val: '360°', label: 'Comfort', sub: 'Designed to move with you — from morning to midnight' },
  { val: '∞', label: 'Durability', sub: 'Built to outlast every challenge life throws your way' },
  { val: '01', label: 'Standard', sub: 'One benchmark — premium denim, uncompromised' },
];

const delays = [0.08, 0.18, 0.30, 0.42];

const Numbers = () => (
  <section className="bg-surface border-b border-sb py-20 px-6 md:py-28 md:px-16">
    <div className="max-w-[1340px] mx-auto">
      <div className="font-condensed font-semibold uppercase text-sv-mid flex items-center gap-3 mb-6" style={{ fontSize: '0.66rem', letterSpacing: '0.38em' }}>
        <span className="w-4 h-px bg-sv-dim inline-block" />
        Precision by Design
      </div>
      <h2 className="font-display text-tb-white mb-16" style={{ fontSize: 'clamp(3.4rem, 7vw, 6rem)', lineHeight: 0.92 }}>
        THE NUMBERS
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-sb">
        {metrics.map((m, i) => (
          <motion.div
            key={m.label}
            className="p-9 md:p-12 text-center group relative overflow-hidden hover:bg-s2 transition-colors duration-300"
            initial={{ opacity: 0, y: 36 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1], delay: delays[i] }}
          >
            <span className="absolute top-0 left-0 right-0 h-px bg-sv-dim scale-x-0 group-hover:scale-x-100 transition-transform duration-[450ms] origin-center" />
            <span className="font-display metal-text block mb-3" style={{ fontSize: '3.8rem', lineHeight: 1 }}>{m.val}</span>
            <span className="font-condensed font-bold uppercase text-tb-white block mb-2" style={{ fontSize: '0.82rem', letterSpacing: '0.16em' }}>{m.label}</span>
            <span className="font-body font-light text-sv-mid block" style={{ fontSize: '0.82rem', lineHeight: 1.55 }}>{m.sub}</span>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default Numbers;
