import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { optimizeCloudinaryUrl, IMG_SIZES } from '../lib/cloudinary';

interface Slide {
  src: string;
  alt: string;
  href: string | null;
}

const INTERVAL = 3000;
const SWIPE_THRESHOLD = 40;

let cachedSlides: Slide[] | null = null;

export default function HeroBanner() {
  const [slides, setSlides] = useState<Slide[]>(cachedSlides || []);
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [direction, setDirection] = useState(1);
  const [loading, setLoading] = useState(!cachedSlides);
  const touchStartX = useRef<number | null>(null);

  // Fetch admin-configured banner images only — no fallback defaults
  useEffect(() => {
    let cancelled = false;
    fetch('/api/slider?type=hero')
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (cancelled) return;
        if (Array.isArray(data?.images)) {
          const mapped = data.images.map((src: string, i: number) => ({
            src: optimizeCloudinaryUrl(src, IMG_SIZES.hero),
            alt: `Banner ${i + 1}`,
            href: null,
          }));
          setSlides(mapped);
          cachedSlides = mapped;
          setCurrent(0);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const go = useCallback((index: number, dir: number) => {
    setDirection(dir);
    setCurrent(index);
  }, []);

  const next = useCallback(() => {
    go((current + 1) % slides.length, 1);
  }, [current, slides.length, go]);

  const prev = useCallback(() => {
    go((current - 1 + slides.length) % slides.length, -1);
  }, [current, slides.length, go]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    setPaused(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(delta) >= SWIPE_THRESHOLD) {
      delta > 0 ? next() : prev();
    }
    touchStartX.current = null;
    setPaused(false);
  };

  // Auto-advance only when there's more than 1 slide
  useEffect(() => {
    if (paused || slides.length <= 1) return;
    const id = setInterval(next, INTERVAL);
    return () => clearInterval(id);
  }, [paused, slides.length, next]);

  const handleClick = (href: string | null) => {
    if (!href) return;
    const el = document.getElementById(href.replace('#', ''));
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Show a loading skeleton only on first mount while fetching configured slides.
  // Matches the exact shape and size of the hero slider to prevent layout shifts.
  if (loading && slides.length === 0) {
    return (
      <div className="mx-3 rounded-sm border border-white/15 md:mx-0 md:rounded-none md:border-0 bg-white/[0.02] animate-pulse h-[150px] sm:h-[180px] md:h-[260px]" />
    );
  }

  // No admin banners configured — render nothing
  if (slides.length === 0) return null;

  const variants = {
    enter:  (dir: number) => ({ opacity: 0, x: dir * 40 }),
    center: { opacity: 1, x: 0 },
    exit:   (dir: number) => ({ opacity: 0, x: dir * -40 }),
  };

  const multiSlide = slides.length > 1;

  return (
    <div
      className="relative overflow-hidden mx-3 rounded-sm border border-white/15 md:mx-0 md:rounded-none md:border-0 select-none group/banner"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Slides */}
      <div className="relative w-full h-[150px] md:h-auto md:max-h-[260px]">
        <AnimatePresence initial={false} custom={direction} mode="sync">
          <motion.div
            key={current}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.42, ease: [0.32, 0, 0.67, 0] }}
            className={`absolute inset-0 w-full h-full ${slides[current]?.href ? 'cursor-pointer' : ''}`}
            onClick={() => handleClick(slides[current]?.href ?? null)}
          >
            <img
              src={slides[current]?.src}
              alt={slides[current]?.alt}
              className="w-full h-full object-cover object-center"
              loading={current === 0 ? 'eager' : 'lazy'}
              decoding="async"
            />
          </motion.div>
        </AnimatePresence>

        {/* Height placeholder — keeps layout stable while slides transition */}
        <img
          src={slides[0]?.src}
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

      {/* Prev / Next arrows — only when multiple slides */}
      {multiSlide && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            aria-label="Previous slide"
            className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-20 w-7 h-7 md:w-9 md:h-9 rounded-full bg-black/40 border border-white/10 flex items-center justify-center opacity-0 group-hover/banner:opacity-100 hover:bg-black/70 hover:border-white/25 active:scale-95 transition-all duration-200 focus:outline-none"
          >
            <ChevronLeft className="w-4 h-4 text-white/80" strokeWidth={2} />
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            aria-label="Next slide"
            className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-20 w-7 h-7 md:w-9 md:h-9 rounded-full bg-black/40 border border-white/10 flex items-center justify-center opacity-0 group-hover/banner:opacity-100 hover:bg-black/70 hover:border-white/25 active:scale-95 transition-all duration-200 focus:outline-none"
          >
            <ChevronRight className="w-4 h-4 text-white/80" strokeWidth={2} />
          </button>
        </>
      )}

      {/* Dot indicators — only when multiple slides */}
      {multiSlide && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => go(i, i > current ? 1 : -1)}
              aria-label={`Go to slide ${i + 1}`}
              className="focus:outline-none"
              style={{
                width: 20,
                height: 3,
                borderRadius: 999,
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                background: 'white',
                opacity: i === current ? 1 : 0.35,
                transform: `scaleX(${i === current ? 1 : 0.15})`,
                transformOrigin: 'center',
                transition: 'transform 300ms ease, opacity 300ms ease',
                willChange: 'transform, opacity',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
