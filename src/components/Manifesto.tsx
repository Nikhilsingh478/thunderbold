import { motion } from 'framer-motion';

const reveal = {
  initial: { opacity: 0, y: 36 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.85, ease: [0.16, 1, 0.3, 1] as const },
};

const Manifesto = () => (
  <section id="manifesto" className="max-w-[1340px] mx-auto px-6 py-20 md:px-16 md:py-36">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-14 md:gap-24 items-center">
      {/* Left */}
      <motion.div {...reveal}>
        <div className="font-condensed font-semibold uppercase text-sv-mid flex items-center gap-3 mb-6" style={{ fontSize: '0.66rem', letterSpacing: '0.38em' }}>
          <span className="w-4 h-px bg-sv-dim inline-block" />
          Our Manifesto
        </div>
        <h2 className="font-display text-tb-white" style={{ fontSize: 'clamp(3.4rem, 7vw, 6rem)', lineHeight: 0.92 }}>
          FORGED<br />FOR THE<br /><span className="metal-text">BOLD</span> ONES
        </h2>
        <p className="font-body font-light text-sv-mid max-w-[440px] mt-7" style={{ fontSize: '1.04rem', lineHeight: 1.82 }}>
          Thunderbolt was born from a singular conviction — that what you wear should be as unbreakable as your will. Every pair is a testament to mastery: the kind forged by time, discipline, and an obsession with the exceptional. We don't make jeans. We make armor.
        </p>
      </motion.div>

      {/* Right — Quote card */}
      <motion.div {...reveal} transition={{ ...reveal.transition, delay: 0.18 }}>
        <div className="bg-surface border border-sb border-l-2 border-l-sv-dim relative overflow-hidden p-8 md:p-12">
          {/* Giant quote mark */}
          <span className="absolute top-[-16px] left-[14px] font-serif leading-none text-sv-dim pointer-events-none select-none" style={{ fontSize: '11rem', opacity: 0.1 }}>
            &ldquo;
          </span>
          {/* Corner trim */}
          <span className="absolute bottom-0 right-0 w-11 h-11 border-t border-l border-sb translate-x-px translate-y-px" />

          <blockquote className="font-serif italic font-light text-tb-off relative z-10 mb-6" style={{ fontSize: 'clamp(1.15rem, 2.2vw, 1.48rem)', lineHeight: 1.62 }}>
            &ldquo;This isn't just jeans; it's your armor for life's every challenge.&rdquo;
          </blockquote>
          <cite className="font-condensed not-italic font-semibold uppercase text-sv-mid" style={{ fontSize: '0.66rem', letterSpacing: '0.24em' }}>
            — Thunderbolt · Built for the Bold
          </cite>
        </div>
      </motion.div>
    </div>
  </section>
);

export default Manifesto;
