import { motion } from 'framer-motion';

const reveal = {
  initial: { opacity: 0, y: 36 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' } as const,
  transition: { duration: 0.85, ease: [0.16, 1, 0.3, 1] as const },
};

const traits = [
  { n: '01', name: '4-Way Stretch Fabric', desc: 'Move in every direction without resistance. Built for the full range of your life.' },
  { n: '02', name: 'Reinforced Waistband', desc: 'Structured support that holds its shape through anything you put it through.' },
  { n: '03', name: 'Tucked Belt Loops', desc: 'Durability built into the architecture — reinforced where it matters most.' },
  { n: '04', name: 'Precision Hardware', desc: 'Gunmetal finish. Brass construction. Every piece of hardware chosen for permanence.' },
  { n: '05', name: 'Artisan Leather Patch', desc: 'High-quality suede branding — the quiet mark of those who know the difference.' },
];

const TraitsSection = () => (
  <section id="craft" className="bg-surface border-t border-b border-sb py-24 px-6 md:py-28 md:px-16">
    <div className="max-w-[1340px] mx-auto">
      <motion.div {...reveal}>
        <div className="font-condensed font-semibold uppercase text-sv-mid flex items-center gap-3 mb-6" style={{ fontSize: '0.66rem', letterSpacing: '0.38em' }}>
          <span className="w-4 h-px bg-brass-dim inline-block" />
          The Details
        </div>
        <h2 className="font-display text-tb-white mb-6" style={{ fontSize: 'clamp(2.8rem, 10vw, 5rem)', lineHeight: 0.92 }}>
          EVERY<br />DETAIL IS<br />YOUR <span className="brass-text">ARMOR</span>
        </h2>
        <p className="font-body font-light text-sv-mid max-w-[520px] mb-12" style={{ fontSize: '1rem', lineHeight: 1.78 }}>
          Where others cut corners, Thunderbolt doubles down. Each pair carries the hallmarks of obsessive craft — built for those who demand more.
        </p>
      </motion.div>

      <div>
        {traits.map((t, i) => (
          <motion.div
            key={t.n}
            className="flex items-start gap-5 py-5 relative group"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.038)' }}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: i * 0.1 }}
            whileHover={{ paddingLeft: 10 }}
          >
            {/* Brass accent on left edge */}
            <span className="absolute left-0 top-0 bottom-0 w-px bg-brass/0 group-hover:bg-brass/40 transition-colors duration-300" />

            <span className="font-display text-[1rem] text-brass/40 min-w-[28px] mt-0.5 flex-shrink-0">{t.n}</span>
            <div>
              <span className="font-condensed font-bold text-[1rem] tracking-[0.08em] uppercase text-tb-white block mb-1">{t.name}</span>
              <span className="font-body font-light text-[0.87rem] leading-[1.65] text-sv-mid block">{t.desc}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default TraitsSection;
