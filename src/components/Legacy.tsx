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

    {/* Final Product Details Grid */}
    <motion.div
      className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 mb-28 text-left"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
    >
      <div>
        <span className="font-display brass-text text-2xl block mb-2">01</span>
        <span className="font-condensed font-bold uppercase text-tb-white tracking-widest block mb-1">Contoured Waistband</span>
        <span className="font-body text-sm text-sv-mid">Sits securely on the waist without folding or sagging.</span>
      </div>
      <div>
        <span className="font-display brass-text text-2xl block mb-2">02</span>
        <span className="font-condensed font-bold uppercase text-tb-white tracking-widest block mb-1">Reinforced Belt Loops</span>
        <span className="font-body text-sm text-sv-mid">Double-stitched loops that handle constant pulling and daily wear.</span>
      </div>
      <div>
        <span className="font-display brass-text text-2xl block mb-2">03</span>
        <span className="font-condensed font-bold uppercase text-tb-white tracking-widest block mb-1">Heavy-Duty Hardware</span>
        <span className="font-body text-sm text-sv-mid">Solid metal buttons and smooth, scratch-resistant rivets built for the long haul.</span>
      </div>
    </motion.div>

    {/* Solid readable H2 with unique blur-scale animation */}
    <motion.h2
      className="font-display uppercase"
      style={{ fontSize: 'clamp(3rem, 11vw, 8.5rem)', lineHeight: 0.88 }}
      initial={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
      whileInView={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
    >
      <span className="text-tb-white">EXPERIENCE</span><br />
      <span className="brass-text">THE BUILD</span>
    </motion.h2>

    {/* Body */}
    <motion.div
      className="font-body font-light text-sv-mid max-w-[620px] md:max-w-[580px] mx-auto mb-14 space-y-4"
      style={{ fontSize: 'clamp(1.1rem, 2.2vw, 1.2rem)', lineHeight: 1.72, marginTop: '44px' }}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1], delay: 0.12 }}
    >
      <p>Interested in exploring the collection or becoming a retail partner?</p>
      <p>Get in touch with our team directly.</p>
    </motion.div>

    {/* CTA Buttons */}
    <motion.div
      className="flex flex-col md:flex-row items-center justify-center gap-4"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1], delay: 0.24 }}
    >
      <a 
        href="https://wa.me/919561172681" 
        target="_blank" 
        rel="noopener noreferrer"
        className="inline-flex items-center gap-4 font-condensed font-semibold text-[0.72rem] tracking-[0.18em] uppercase text-void bg-brass px-8 md:px-12 py-4 md:py-5 hover:bg-brass-bright transition-colors cursor-pointer w-full md:w-auto justify-center"
      >
        Connect on WhatsApp
      </a>
      <a 
        href="https://wa.me/919561172681?text=Hi%2C%20I%E2%80%99m%20interested%20in%20partnering%20with%20Thunderbolt.%20Can%20you%20share%20details%20about%20retail%20collaboration%3F" 
        target="_blank" 
        rel="noopener noreferrer"
        className="inline-flex items-center gap-4 font-condensed font-semibold text-[0.72rem] tracking-[0.18em] uppercase text-tb-white px-8 md:px-12 py-4 md:py-5 hover:border-brass/60 hover:text-brass-bright transition-colors cursor-pointer w-full md:w-auto justify-center" 
        style={{ border: '1px solid rgba(184,148,26,0.25)' }}
      >
        Partner With Us
      </a>
    </motion.div>

  </section>
);

export default Legacy;
