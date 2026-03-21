import { motion } from 'framer-motion';

const Statement = () => (
  <section className="bg-void border-t border-b border-sb py-32 px-6 md:py-44 md:px-16 relative overflow-hidden text-center">
    {/* Denim blue glow */}
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(26,37,64,0.15), transparent)' }}
    />
    {/* Desktop: stronger denim glow */}
    <div
      className="absolute inset-0 pointer-events-none hidden md:block"
      style={{ background: 'radial-gradient(ellipse 55% 60% at 50% 50%, rgba(26,37,64,0.38), transparent 70%)' }}
    />

    {/* Ghost bolt */}
    <motion.div
      className="absolute inset-0 flex items-center justify-center pointer-events-none select-none ghost-stroke-thin font-display"
      style={{ fontSize: 'clamp(18rem, 50vw, 58rem)', lineHeight: 1, opacity: 0.015 }}
      animate={{ opacity: [0.015, 0.006, 0.015] }}
      transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
    >
      ⚡
    </motion.div>

    <motion.h2
      className="font-display text-tb-white relative z-10"
      style={{ fontSize: 'clamp(2.8rem, 10vw, 7.5rem)', lineHeight: 0.88 }}
      initial={{ opacity: 0, y: 36 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
    >
      <span className="md:metal-text">CRAFTED WITH</span><br />THE SPIRIT OF<br /><span className="md:brass-text">ANCIENT MASTERS</span>
    </motion.h2>

    <motion.p
      className="font-serif italic font-light text-sv-mid max-w-[580px] md:max-w-[440px] mx-auto relative z-10 mt-8 md:mt-6"
      style={{ fontSize: 'clamp(1rem, 2vw, 1.28rem)', lineHeight: 1.72 }}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
    >
      Thunderbolt denim embodies strength, resilience, and ultimate comfort.
    </motion.p>
  </section>
);

export default Statement;
