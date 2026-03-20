import { motion } from 'framer-motion';

const Statement = () => (
  <section className="bg-void border-t border-b border-sb py-24 px-6 md:py-40 md:px-16 relative overflow-hidden text-center">
    {/* Giant ghost bolt */}
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none ghost-stroke-thin font-display" style={{ fontSize: 'clamp(18rem, 50vw, 60rem)', lineHeight: 1, opacity: 0.011 }}>
      ⚡
    </div>

    <motion.h2
      className="font-display text-tb-white relative z-10"
      style={{ fontSize: 'clamp(3rem, 8vw, 7rem)', lineHeight: 0.92 }}
      initial={{ opacity: 0, y: 36 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
    >
      CRAFTED WITH THE SPIRIT<br />OF ANCIENT MASTERS
    </motion.h2>

    <motion.p
      className="font-serif italic font-light text-sv-mid max-w-[580px] mx-auto relative z-10 mt-8"
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
