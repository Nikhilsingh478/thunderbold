import { motion } from 'framer-motion';
import hangTag from '@/assets/hang-tag.png';

const reveal = {
  initial: { opacity: 0, y: 36 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' } as const,
  transition: { duration: 0.85, ease: [0.16, 1, 0.3, 1] as const },
};

const advantages = [
  { icon: '⟺', title: '4-Way Stretch', desc: 'Freedom in every direction' },
  { icon: '◎', title: 'Hidden Rivets', desc: 'Clean lines, hidden strength' },
  { icon: '◈', title: 'Premium Hardware', desc: 'Brass & gunmetal precision' },
  { icon: '⊟', title: 'Chain Stitched', desc: 'Waistband built to last' },
  { icon: '⊞', title: 'Selvedge Detail', desc: 'Artisan edge finishing' },
  { icon: '⌇', title: 'Reinforced Build', desc: 'Engineered for endurance' },
];

const HangTagSection = () => (
  <section id="details" className="bg-bg py-24 px-6 md:py-36 md:px-16 relative overflow-hidden">
    <div className="max-w-[1340px] mx-auto">
      {/* Hanging tag visual */}
      <motion.div {...reveal} className="flex flex-col items-center mb-16">
        {/* Cord */}
        <div className="w-px h-16 bg-sv-dim" />
        {/* Sway tag */}
        <motion.div
          className="w-[200px] lg:w-[260px]"
          animate={{ rotate: [-1.5, 1.5, -1.5] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          style={{ transformOrigin: 'top center' }}
        >
          <img
            src={hangTag}
            alt="Thunderbolt Advantage hang tag"
            className="w-full drop-shadow-2xl"
            style={{ filter: 'brightness(1.05) contrast(1.08)' }}
            loading="lazy"
          />
        </motion.div>
      </motion.div>

      {/* Header */}
      <motion.div {...reveal} className="text-center mb-12">
        <div className="font-condensed font-semibold uppercase text-sv-mid flex items-center justify-center gap-3 mb-6" style={{ fontSize: '0.66rem', letterSpacing: '0.38em' }}>
          <span className="w-4 h-px bg-brass-dim inline-block" />
          The Thunderbolt Advantage
          <span className="w-4 h-px bg-brass-dim inline-block" />
        </div>
        <h2 className="font-display text-tb-white" style={{ fontSize: 'clamp(2.8rem, 10vw, 5rem)', lineHeight: 0.92 }}>
          <span className="brass-text">BUILT</span><br />DIFFERENT
        </h2>
      </motion.div>

      {/* Advantage grid — 2x3 */}
      <div className="grid grid-cols-2 gap-px max-w-[600px] mx-auto" style={{ background: 'rgba(255,255,255,0.04)' }}>
        {advantages.map((a, i) => (
          <motion.div
            key={a.title}
            className="bg-bg p-5 hover:bg-surface transition-colors duration-300"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: i * 0.08 }}
          >
            <span className="font-display text-2xl text-brass block mb-2">{a.icon}</span>
            <span className="font-condensed font-bold text-[0.9rem] tracking-[0.07em] uppercase text-tb-white block mb-1">{a.title}</span>
            <span className="font-body font-light text-[0.8rem] text-sv-mid block">{a.desc}</span>
          </motion.div>
        ))}
      </div>

      {/* Bottom tagline */}
      <motion.p
        {...reveal}
        className="font-condensed font-bold text-[0.76rem] tracking-[0.22em] uppercase text-brass/60 text-center mt-12"
        transition={{ ...reveal.transition, delay: 0.3 }}
      >
        FEEL THE POWER. <span className="text-brass/40">·</span> EMBRACE COMFORT. <span className="text-brass/40">·</span> BE BOLD.
      </motion.p>
    </div>
  </section>
);

export default HangTagSection;
