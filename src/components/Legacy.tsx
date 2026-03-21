import { motion } from 'framer-motion';

const Legacy = () => (
  <section id="legacy" className="bg-bg py-36 px-6 md:py-44 md:px-16 text-center max-w-[1340px] mx-auto">
    {/* Decorative brass divider */}
    <motion.div
      className="flex items-center justify-center gap-4 mb-14"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
    >
      <span className="w-12 h-px" style={{ background: 'linear-gradient(90deg, transparent, #7a6210)' }} />
      <motion.span
        className="brass-text font-display text-2xl"
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        ⚡
      </motion.span>
      <span className="w-12 h-px" style={{ background: 'linear-gradient(90deg, #7a6210, transparent)' }} />
    </motion.div>

    {/* Ghost outline H2 */}
    <motion.h2
      className="font-display ghost-stroke-brass"
      style={{ fontSize: 'clamp(4rem, 16vw, 12rem)', lineHeight: 0.88 }}
      initial={{ opacity: 0, y: 36 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
    >
      LEAVE<br />A MARK
    </motion.h2>

    {/* Body */}
    <motion.p
      className="font-serif italic font-light text-sv-mid max-w-[620px] mx-auto mb-14"
      style={{ fontSize: 'clamp(1.1rem, 2.2vw, 1.44rem)', lineHeight: 1.72 }}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1], delay: 0.12 }}
    >
      Thunderbolt is more than a brand — it's a declaration. For those who push harder, reach further, and refuse to fade into the ordinary. This is your denim. This is your armor.
    </motion.p>

    {/* Badge CTA */}
    <motion.div
      className="inline-block font-condensed font-bold text-[0.72rem] tracking-[0.18em] uppercase text-brass border border-brass/30 px-8 py-4"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1], delay: 0.24 }}
    >
      ⚡ Built for the Bold
    </motion.div>
  </section>
);

export default Legacy;
