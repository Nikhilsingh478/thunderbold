import { motion } from 'framer-motion';

const Legacy = () => (
  <section id="legacy" className="max-w-[1340px] mx-auto px-6 py-24 md:px-16 md:py-40 text-center">
    {/* Decorative divider */}
    <motion.div
      className="flex flex-col items-center mb-14"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
    >
      <span className="w-px h-16" style={{ background: 'linear-gradient(to bottom, transparent, #383838)' }} />
      <span className="font-display metal-text text-3xl my-4">⚡</span>
      <span className="w-px h-16" style={{ background: 'linear-gradient(to bottom, #383838, transparent)' }} />
    </motion.div>

    {/* Ghost outline H2 */}
    <motion.h2
      className="font-display ghost-stroke mb-10"
      style={{ fontSize: 'clamp(3.4rem, 8vw, 7rem)', lineHeight: 0.92 }}
      initial={{ opacity: 0, y: 36 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
    >
      LEAVE A MARK
    </motion.h2>

    <motion.p
      className="font-serif italic font-light text-sv-mid max-w-[620px] mx-auto mb-14"
      style={{ fontSize: 'clamp(1.1rem, 2.2vw, 1.44rem)', lineHeight: 1.72 }}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
    >
      Thunderbolt is more than a brand — it's a declaration. For those who push harder, reach further, and refuse to fade into the ordinary. This is your denim. This is your armor.
    </motion.p>

    <motion.div
      className="inline-block border border-sv-dim px-8 py-4 font-condensed font-bold text-xs tracking-[0.20em] uppercase text-sv-mid"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
    >
      ⚡ Built for the Bold
    </motion.div>
  </section>
);

export default Legacy;
