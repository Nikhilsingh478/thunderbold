import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import PromoSlide from './PromoSlide';
import { promoSlides } from './promoSlides';

const SWIPE_THRESHOLD = 50; // px — distance required to register a swipe

/**
 * Manual promo slider for the homepage.
 *
 * - No auto-advance (per spec). User-driven only.
 * - Supports keyboard arrows, on-screen arrows, and touch swipe.
 * - Single mounted slide at a time + AnimatePresence cross-fade (cheap).
 * - Slides themselves come from `promoSlides` config — fully data-driven.
 */
export default function PromoSlider() {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const total = promoSlides.length;

  const go = useCallback((delta: 1 | -1) => {
    setDirection(delta);
    setIndex((i) => (i + delta + total) % total);
  }, [total]);

  const goNext = useCallback(() => go(1), [go]);
  const goPrev = useCallback(() => go(-1), [go]);

  // Keyboard navigation when slider is focused
  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'ArrowLeft') goPrev();
    };
    node.addEventListener('keydown', handler);
    return () => node.removeEventListener('keydown', handler);
  }, [goNext, goPrev]);

  if (total === 0) return null;

  const current = promoSlides[index];
  const showArrows = total > 1;

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Promotional offers"
      className="px-3 sm:px-6 md:px-16 py-12 md:py-20"
    >
      <div className="max-w-[1400px] mx-auto">
        <div
          ref={containerRef}
          tabIndex={0}
          className="relative outline-none focus-visible:ring-2 focus-visible:ring-brass/50 rounded-sm"
        >
          {/* Slide stage — explicit aspect ratio prevents layout shift */}
          <div className="relative aspect-[16/9] sm:aspect-[21/9] w-full overflow-hidden rounded-sm">
            <AnimatePresence initial={false} mode="wait" custom={direction}>
              <motion.div
                key={current.id}
                custom={direction}
                initial={{ opacity: 0, x: direction * 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction * -40 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0"
                drag={total > 1 ? 'x' : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -SWIPE_THRESHOLD) goNext();
                  else if (info.offset.x > SWIPE_THRESHOLD) goPrev();
                }}
              >
                <PromoSlide slide={current} eager={index === 0} />
              </motion.div>
            </AnimatePresence>
          </div>

          {showArrows && (
            <>
              <button
                onClick={goPrev}
                aria-label="Previous slide"
                className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-10 items-center justify-center w-12 h-12 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 text-white/80 hover:text-brass hover:border-brass/40 transition-colors duration-200"
              >
                <ChevronLeft size={22} strokeWidth={1.6} />
              </button>
              <button
                onClick={goNext}
                aria-label="Next slide"
                className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-10 items-center justify-center w-12 h-12 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 text-white/80 hover:text-brass hover:border-brass/40 transition-colors duration-200"
              >
                <ChevronRight size={22} strokeWidth={1.6} />
              </button>
            </>
          )}
        </div>

        {/* Dot indicators */}
        {total > 1 && (
          <div className="mt-5 flex items-center justify-center gap-2">
            {promoSlides.map((slide, i) => {
              const active = i === index;
              return (
                <button
                  key={slide.id}
                  onClick={() => {
                    setDirection(i > index ? 1 : -1);
                    setIndex(i);
                  }}
                  aria-label={`Go to slide ${i + 1}: ${slide.title}`}
                  aria-current={active ? 'true' : 'false'}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    active ? 'w-8 bg-brass' : 'w-2 bg-white/25 hover:bg-white/50'
                  }`}
                />
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
