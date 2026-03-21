import { motion } from 'framer-motion';

const Legacy = () => (
  <section id="legacy" className="bg-bg py-36 px-6 md:py-44 md:px-16 text-center max-w-[1340px] mx-auto">
    {/* Decorative brass divider */}
    <motion.div
      className="flex items-center justify-center gap-4 md:gap-5 mb-14 md:mb-16"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
    >
      <span className="w-12 md:max-w-[160px] md:w-full h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(184,148,26,0.4))' }} />
      <motion.span
        className="brass-text font-display text-2xl md:text-[1.5rem]"
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        ⚡
      </motion.span>
      <span className="w-12 md:max-w-[160px] md:w-full h-px" style={{ background: 'linear-gradient(90deg, rgba(184,148,26,0.4), transparent)' }} />
    </motion.div>

    {/* Ghost outline H2 */}
    <motion.h2
      className="font-display"
      style={{ fontSize: 'clamp(4rem, 16vw, 10.5rem)', lineHeight: 0.88, color: 'transparent', WebkitTextStroke: '1px rgba(184,148,26,0.28)' }}
      initial={{ opacity: 0, y: 36 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
    >
      LEAVE<br />A MARK
    </motion.h2>

    {/* Body */}
    <motion.p
      className="font-serif italic font-light text-sv-mid max-w-[620px] md:max-w-[580px] mx-auto mb-14"
      style={{ fontSize: 'clamp(1.1rem, 2.2vw, 1.42rem)', lineHeight: 1.72, marginTop: '44px' }}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1], delay: 0.12 }}
    >
      Thunderbolt is more than a brand — it's a declaration. For those who push harder, reach further, and refuse to fade into the ordinary. This is your denim. This is your armor.
    </motion.p>

    {/* Badge CTA */}
    <motion.div
      className="inline-flex items-center gap-4 font-condensed font-semibold text-[0.72rem] tracking-[0.18em] md:tracking-[0.28em] uppercase text-sv px-8 md:px-12 py-4 md:py-5"
      style={{ border: '1px solid rgba(184,148,26,0.25)' }}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1], delay: 0.24 }}
      whileHover={{ borderColor: 'rgba(184,148,26,0.6)', color: '#d4aa30' }}
    >
      <span className="brass-text">⚡</span> Built for the Bold
    </motion.div>

    {/* Below badge */}
    <motion.p
      className="hidden md:block font-condensed text-[0.6rem] tracking-[0.42em] uppercase mt-14"
      style={{ color: 'rgba(56,56,56,0.45)' }}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 1, delay: 0.4 }}
    >
      DRAWER SERIES NO. 1 · ORIGINAL DENIM SUPPLY
    </motion.p>
  </section>
);

export default Legacy;
