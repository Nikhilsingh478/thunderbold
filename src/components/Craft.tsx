import { motion } from 'framer-motion';

const traits = [
  { n: '01', name: '4-Way Stretch Fabric', desc: 'Move freely in every direction. Engineered flex means no restriction — whether sprinting, seated, or scaling.' },
  { n: '02', name: 'Reinforced Waistband', desc: 'Structured, supportive, built to hold its shape through everything life demands of it.' },
  { n: '03', name: 'Tucked Belt Loops', desc: 'Durability woven into the architecture itself — reinforced for the long haul, not an afterthought.' },
  { n: '04', name: 'Precision Hardware', desc: 'Gunmetal finish, brass-core construction. Hardware that signals serious intent — and backs it up.' },
  { n: '05', name: 'Artisan Leather Patch', desc: 'High-quality suede branding — a quiet mark of distinction worn by those who know the difference.' },
];

const reveal = {
  initial: { opacity: 0, y: 36 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.85, ease: [0.16, 1, 0.3, 1] as const },
};

const Craft = () => (
  <section id="craft" className="max-w-[1340px] mx-auto px-6 py-20 md:px-16 md:py-36">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-14 md:gap-28 items-center">
      {/* Left — Visual Card (hidden on mobile) */}
      <motion.div {...reveal} className="hidden md:block">
        <div
          className="relative border border-sv-dim overflow-hidden bg-surface denim-texture"
          style={{ aspectRatio: '4/5', background: 'linear-gradient(155deg, #181818, #0f0f0f, #0b0b0b)' }}
        >
          {/* Floating ghost bolt */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center pointer-events-none select-none ghost-stroke-thin font-display"
            style={{ fontSize: '18rem', lineHeight: 1 }}
            animate={{ y: [0, -18, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          >
            ⚡
          </motion.div>

          {/* Centered branding */}
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
            <span className="font-display text-tb-white tracking-[0.18em]" style={{ fontSize: 'clamp(1.6rem, 3vw, 2.4rem)' }}>
              THUNDER<span className="metal-text">⚡</span>BOLT
            </span>
            <span className="font-condensed font-semibold uppercase text-sv-mid mt-2" style={{ fontSize: '0.58rem', letterSpacing: '0.30em' }}>
              Built for the Bold
            </span>
          </div>

          {/* Chip labels */}
          <span className="absolute top-4 left-4 font-condensed font-semibold uppercase text-sv-mid border border-sb px-3 py-2 bg-[rgba(10,10,10,0.8)]" style={{ fontSize: '0.58rem', letterSpacing: '0.20em' }}>
            Thunderbolt Premium
          </span>
          <span className="absolute top-4 right-4 font-condensed font-semibold uppercase text-sv border border-sv-dim px-3 py-2 bg-[rgba(10,10,10,0.8)]" style={{ fontSize: '0.58rem', letterSpacing: '0.20em' }}>
            Series No. 1
          </span>
          <span className="absolute bottom-4 right-4 font-condensed font-semibold uppercase text-sv-mid border border-sb px-3 py-2 bg-[rgba(10,10,10,0.8)]" style={{ fontSize: '0.58rem', letterSpacing: '0.20em' }}>
            Drawer Edition
          </span>
        </div>
      </motion.div>

      {/* Right — Trait list */}
      <div>
        <motion.div {...reveal}>
          <div className="font-condensed font-semibold uppercase text-sv-mid flex items-center gap-3 mb-6" style={{ fontSize: '0.66rem', letterSpacing: '0.38em' }}>
            <span className="w-4 h-px bg-sv-dim inline-block" />
            The Details
          </div>
          <h2 className="font-display text-tb-white" style={{ fontSize: 'clamp(3.4rem, 7vw, 6rem)', lineHeight: 0.92 }}>
            EVERY<br />DETAIL IS<br />YOUR <span className="metal-text">ARMOR</span>
          </h2>
          <p className="font-body font-light text-sv-mid max-w-[440px] mt-7 mb-10" style={{ fontSize: '1.04rem', lineHeight: 1.82 }}>
            Where others cut corners, Thunderbolt doubles down. Each pair carries the hallmarks of obsessive craft — built for those who demand more from what they wear.
          </p>
        </motion.div>

        {traits.map((t, i) => (
          <motion.div
            key={t.n}
            className="flex items-start gap-5 py-5 border-b border-[rgba(255,255,255,0.038)] cursor-default"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: i * 0.08 }}
            whileHover={{ paddingLeft: 10 }}
          >
            <span className="font-display text-sv-dim flex-shrink-0 min-w-[26px] mt-0.5" style={{ fontSize: '1.05rem' }}>{t.n}</span>
            <div>
              <h4 className="font-condensed font-bold uppercase text-tb-white mb-1" style={{ fontSize: '1rem', letterSpacing: '0.08em' }}>{t.name}</h4>
              <p className="font-body font-light text-sv-mid" style={{ fontSize: '0.87rem', lineHeight: 1.65 }}>{t.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default Craft;
