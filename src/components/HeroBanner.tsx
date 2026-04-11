import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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

const INTERVAL = 3000;

export default function HeroBanner() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [direction, setDirection] = useState(1);

  const go = useCallback((index: number, dir: number) => {
    setDirection(dir);
    setCurrent(index);
  }, []);

  const next = useCallback(() => {
    go((current + 1) % slides.length, 1);
  }, [current, go]);

  const prev = useCallback(() => {
    go((current - 1 + slides.length) % slides.length, -1);
  }, [current, go]);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(next, INTERVAL);
    return () => clearInterval(id);
  }, [paused, next]);

  const handleClick = (href: string | null) => {
    if (!href) return;
    const el = document.getElementById(href.replace('#', ''));
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const variants = {
    enter: (dir: number) => ({ opacity: 0, x: dir * 40 }),
    center: { opacity: 1, x: 0 },
    exit: (dir: number) => ({ opacity: 0, x: dir * -40 }),
  };

  return (
    <div
      className="relative overflow-hidden mx-3 rounded-sm border border-white/15 md:mx-0 md:rounded-none md:border-0 select-none group/banner"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Slides */}
      <div className="relative w-full h-[150px] md:h-auto md:max-h-[260px]">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={current}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.42, ease: [0.32, 0, 0.67, 0] }}
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

        {/* Height placeholder */}
        <img
          src={slides[0].src}
          alt=""
          aria-hidden
          className="w-full block object-cover object-center h-[150px] md:h-auto md:max-h-[260px] invisible"
          loading="eager"
        />
      </div>

      {/* Side gradients */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(90deg, rgba(7,7,7,0.40) 0%, transparent 28%, transparent 72%, rgba(7,7,7,0.40) 100%)',
        }}
      />

      {/* Prev arrow */}
      <button
        onClick={(e) => { e.stopPropagation(); prev(); }}
        aria-label="Previous slide"
        className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-20 w-7 h-7 md:w-9 md:h-9 rounded-full bg-black/40 border border-white/10 flex items-center justify-center opacity-0 group-hover/banner:opacity-100 hover:bg-black/70 hover:border-white/25 active:scale-95 transition-all duration-200 focus:outline-none"
      >
        <ChevronLeft className="w-4 h-4 text-white/80" strokeWidth={2} />
      </button>

      {/* Next arrow */}
      <button
        onClick={(e) => { e.stopPropagation(); next(); }}
        aria-label="Next slide"
        className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-20 w-7 h-7 md:w-9 md:h-9 rounded-full bg-black/40 border border-white/10 flex items-center justify-center opacity-0 group-hover/banner:opacity-100 hover:bg-black/70 hover:border-white/25 active:scale-95 transition-all duration-200 focus:outline-none"
      >
        <ChevronRight className="w-4 h-4 text-white/80" strokeWidth={2} />
      </button>

      {/* Dot indicators */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => go(i, i > current ? 1 : -1)}
            aria-label={`Go to slide ${i + 1}`}
            className={`rounded-full transition-all duration-300 focus:outline-none ${
              i === current
                ? 'w-5 h-[3px] bg-white'
                : 'w-[3px] h-[3px] bg-white/40 hover:bg-white/70'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
