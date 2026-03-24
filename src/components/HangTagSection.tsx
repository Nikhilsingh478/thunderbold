import { motion } from 'framer-motion';
import hangTag from '@/assets/hangtag.webp';

const reveal = {
  initial: { opacity: 0, y: 36 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' } as const,
  transition: { duration: 0.85, ease: [0.16, 1, 0.3, 1] as const },
};

const advantages = [
  { icon: '⟺', title: '4-Way Stretch', desc: 'Fabric that stretches and recovers easily. Moves freely throughout the day.' },
  { icon: '⌇', title: 'Reinforced Build', desc: 'Extra strength applied to joints and stress points. Prevents tearing at the seams.' },
  { icon: '⊟', title: 'Heavy-Duty Stitching', desc: 'Precision-stitched using high-strength threads. Holds the jeans together securely.' },
  { icon: '⊞', title: 'Structured Waistband', desc: 'Designed to sit comfortably without stretching out. Keeps a consistent fit over time.' },
  { icon: '◈', title: 'Durable Hardware', desc: "Industrial-grade metal buttons and smooth zippers. Reliable hardware that lasts." },
];

const HangTagSection = () => (
  <section id="details" className="bg-bg pt-8 pb-24 px-6 md:pt-16 md:pb-28 md:px-16 relative overflow-hidden">
    <div className="max-w-[1340px] mx-auto">
      {/* Mobile: stacked layout / Desktop: 2-column grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 md:gap-20 md:items-center">
        {/* LEFT — Hanging tag + tagline */}
        <motion.div className="flex flex-col items-center mb-16 md:mb-0 md:justify-center">
          {/* Floating tag wrapper - Full viewport width on mobile */}
          <motion.div
            className="w-[100vw] -mx-6 md:mx-0 md:w-[280px] md:max-w-[280px] flex justify-center"
            initial={{ opacity: 0, scale: 0.9, y: 50, filter: 'blur(4px)' }}
            whileInView={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <img
              src={hangTag}
              alt="Thunderbolt Advantage hang tag"
              width="668"
              height="1536"
              className="w-full drop-shadow-2xl"
              style={{ filter: 'brightness(1.08) contrast(1.1)' }}
              loading="lazy"
            />
          </motion.div>
          {/* Tagline below tag */}
          <motion.div 
            {...reveal} 
            transition={{ ...reveal.transition, delay: 0.3 }}
            className="mt-8 text-center font-condensed font-semibold text-[0.66rem] tracking-[0.35em] uppercase"
          >
            <span className="text-brass">PREMIUM STRETCH.</span>{' '}
            <span className="text-sv-mid">EVERYDAY RELIABILITY.</span>
          </motion.div>
        </motion.div>

        {/* RIGHT — Header + Advantage Grid */}
        <div>
          {/* Header */}
          <motion.div {...reveal} className="text-center md:text-left mb-12 md:mb-8">
            <div className="font-condensed font-semibold uppercase text-sv-mid flex items-center justify-center md:justify-start gap-3 mb-6" style={{ fontSize: '0.66rem', letterSpacing: '0.38em' }}>
              <span className="w-4 h-px bg-brass-dim inline-block" />
              The Thunderbolt Advantage
              <span className="w-4 h-px bg-brass-dim inline-block md:hidden" />
            </div>
            <h2 className="font-display text-tb-white" style={{ fontSize: 'clamp(2.8rem, 10vw, 5.2rem)', lineHeight: 0.92 }}>
              <span className="brass-text">BUILT</span><br />DIFFERENT
            </h2>
          </motion.div>

          {/* Advantage grid — 2x3 */}
          <div className="grid grid-cols-2 gap-px max-w-[600px] md:max-w-none" style={{ background: 'rgba(255,255,255,0.04)' }}>
            {advantages.map((a, i) => (
              <motion.div
                key={a.title}
                className="bg-bg p-5 hover:bg-surface transition-colors duration-300"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: i * 0.08 }}
              >
                <span className="font-display text-2xl md:text-xl text-brass block mb-2">{a.icon}</span>
                <span className="font-condensed font-bold text-[0.9rem] md:text-[0.88rem] tracking-[0.07em] uppercase text-tb-white block mb-1">{a.title}</span>
                <span className="font-body font-light text-[0.8rem] md:text-[0.78rem] text-sv-mid block">{a.desc}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom tagline — mobile only (desktop tagline is under tag) */}
      <motion.p
        {...reveal}
        className="font-condensed font-bold text-[0.76rem] tracking-[0.22em] uppercase text-brass/60 text-center mt-12 md:hidden"
        transition={{ ...reveal.transition, delay: 0.3 }}
      >
        PREMIUM STRETCH. <span className="text-brass/40">·</span> EVERYDAY RELIABILITY.
      </motion.p>
    </div>
  </section>
);

export default HangTagSection;
