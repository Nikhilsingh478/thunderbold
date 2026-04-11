import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const slides = [
  {
    src: '/banner.webp',
    alt: 'Get an extra 40% off — Live Now',
    href: null,
  },
  {
    src: '/banner2.webp',
    alt: 'Buy Three Jeans at Only ₹1199 — Limited Offer',
    href: '#live-sale',
  },
];

export default function HeroBanner() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => {
    setCurrent(c => (c + 1) % slides.length);
  }, []);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(next, 4500);
    return () => clearInterval(id);
  }, [paused, next]);

  const handleClick = (href: string | null) => {
    if (!href) return;
    const el = document.getElementById(href.replace('#', ''));
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div
      className="relative overflow-hidden mx-3 rounded-sm border border-white/15 md:mx-0 md:rounded-none md:border-0 select-none"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Slides */}
      <div className="relative w-full h-[150px] md:h-auto md:max-h-[260px]">
        <AnimatePresence initial={false}>
          <motion.div
            key={current}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className={`absolute inset-0 w-full h-full ${slides[current].href ? 'cursor-pointer' : ''}`}
            onClick={() => handleClick(slides[current].href)}
          >
            <img
              src={slides[current].src}
              alt={slides[current].alt}
              className="w-full h-full object-cover object-center"
              loading={current === 0 ? 'eager' : 'lazy'}
              decoding="async"
            />
          </motion.div>
        </AnimatePresence>

        {/* Placeholder to maintain height before image loads */}
        <img
          src={slides[0].src}
          alt=""
          aria-hidden
          className="w-full block object-cover object-center h-[150px] md:h-auto md:max-h-[260px] invisible"
          loading="eager"
        />
      </div>

      {/* Side gradient overlays */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(90deg, rgba(7,7,7,0.35) 0%, transparent 30%, transparent 70%, rgba(7,7,7,0.35) 100%)',
        }}
      />

      {/* Dot indicators */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`rounded-full transition-all duration-400 focus:outline-none ${
              i === current
                ? 'w-5 h-[3px] bg-white'
                : 'w-[3px] h-[3px] bg-white/40 hover:bg-white/60'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
