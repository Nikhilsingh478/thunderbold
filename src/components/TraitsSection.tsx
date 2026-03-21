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
  { n: '04', name: 'Precision Hardware', desc: 'Gunmetal finish. Brass construction. Every piece chosen for permanence.' },
  { n: '05', name: 'Artisan Leather Patch', desc: 'High-quality suede branding — the quiet mark of those who know the difference.' },
];

const TraitsSection = () => (
  <section id="craft" className="bg-surface border-t border-b border-sb py-24 px-6 md:py-36 md:px-16">
    <div className="max-w-[1340px] mx-auto">
      {/* Desktop: 2-column grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 md:gap-20 md:items-start">
        {/* LEFT — Visual Card (desktop only) */}
        <div className="hidden md:block relative overflow-hidden" style={{ aspectRatio: '4/5', border: '1px solid rgba(255,255,255,0.07)', background: 'linear-gradient(155deg, #181818 0%, #0f0f0f 60%, #0b0b0b 100%)' }}>
          {/* Denim texture */}
          <div className="absolute inset-0 denim-texture pointer-events-none" />

          {/* Floating ghost bolt */}
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-display pointer-events-none select-none"
            style={{ fontSize: '20rem', color: 'transparent', WebkitTextStroke: '1px rgba(255,255,255,0.028)' }}
            animate={{ y: [0, -20, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          >
            ⚡
          </motion.div>

          {/* Center content */}
          <div className="relative z-10 flex flex-col items-center justify-center h-full gap-3">
            <span className="font-display metal-text tracking-[0.14em]" style={{ fontSize: 'clamp(1.8rem, 4vw, 3.2rem)' }}>
              THUNDER<span className="brass-text">⚡</span>BOLT
            </span>
            <span className="font-condensed text-[0.58rem] tracking-[0.34em] uppercase text-sv-dim">
              Built for the Bold
            </span>
          </div>

          {/* Chips */}
          <div className="absolute top-5 left-5 font-condensed font-semibold text-[0.56rem] tracking-[0.20em] uppercase text-sv-mid px-3 py-1.5" style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(10,10,10,0.8)' }}>
            Thunderbolt Premium
          </div>
          <div className="absolute top-5 right-5 font-condensed font-semibold text-[0.56rem] tracking-[0.20em] uppercase text-sv px-3 py-1.5" style={{ border: '1px solid #383838', background: 'rgba(10,10,10,0.8)' }}>
            Series No. 1
          </div>
          <div className="absolute bottom-5 right-5 font-condensed font-semibold text-[0.56rem] tracking-[0.20em] uppercase text-sv-mid px-3 py-1.5" style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(10,10,10,0.8)' }}>
            Drawer Edition
          </div>
        </div>

        {/* RIGHT — Traits */}
        <div>
          <motion.div {...reveal}>
            <div className="font-condensed font-semibold uppercase text-sv-mid flex items-center gap-3 mb-6" style={{ fontSize: '0.66rem', letterSpacing: '0.38em' }}>
              <span className="w-4 h-px bg-brass-dim inline-block" />
              The Details
            </div>
            <h2 className="font-display text-tb-white mb-6 md:mb-5" style={{ fontSize: 'clamp(2.8rem, 10vw, 4.8rem)', lineHeight: 0.92 }}>
              EVERY<br />DETAIL IS<br />YOUR <span className="brass-text">ARMOR</span>
            </h2>
            <p className="font-body font-light text-sv-mid max-w-[520px] md:max-w-[440px] mb-12 md:mb-10" style={{ fontSize: '1.05rem', lineHeight: 1.82 }}>
              Where others cut corners, Thunderbolt doubles down. Each pair carries the hallmarks of obsessive craft — built for those who demand more.
            </p>
          </motion.div>

          <div>
            {traits.map((t, i) => (
              <motion.div
                key={t.n}
                className="flex items-start gap-5 md:gap-6 py-5 md:py-6 relative group"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: i * 0.1 }}
                whileHover={{ paddingLeft: 12 }}
              >
                {/* Brass accent on left edge */}
                <span className="absolute left-0 top-0 bottom-0 w-px bg-brass/0 group-hover:bg-brass/55 transition-colors duration-300" />

                <span className="font-display text-[1rem] text-brass/40 min-w-[28px] mt-0.5 md:mt-1 flex-shrink-0">{t.n}</span>
                <div>
                  <span className="font-condensed font-bold text-[1rem] tracking-[0.08em] uppercase text-tb-white block mb-1">{t.name}</span>
                  <span className="font-body font-light text-[0.87rem] leading-[1.65] md:leading-[1.67] text-sv-mid block">{t.desc}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default TraitsSection;
