import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PromoSlide from './PromoSlide';
import { promoSlides } from './promoSlides';

const SWIPE_THRESHOLD = 40; // px — distance required to register a swipe
const SWIPE_VELOCITY = 300; // px/s — flick velocity that also triggers a slide

/**
 * Manual promo slider for the homepage.
 *
 * - No auto-advance (per spec). User-driven only.
 * - Swipe (touch + mouse drag) and keyboard arrows; no on-screen arrows.
 * - The banner images are already capsule-shaped with transparent
 *   backgrounds, so the slider itself has no card/border/background —
 *   the image sits directly on the page.
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

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Promotional offers"
      className="px-2 sm:px-4 md:px-6 py-8 md:py-12"
    >
      <div
        ref={containerRef}
        tabIndex={0}
        className="relative mx-auto max-w-[1700px] outline-none focus-visible:ring-2 focus-visible:ring-brass/50 rounded-full"
      >
        {/* Slide stage — explicit aspect ratio prevents layout shift */}
        <div className="relative aspect-[1944/809] w-full">
          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={current.id}
              custom={direction}
              initial={{ opacity: 0, x: direction * 80 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -80 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0"
              drag={total > 1 ? 'x' : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.6}
              dragMomentum={false}
              onDragEnd={(_, info) => {
                const swipedLeft =
                  info.offset.x < -SWIPE_THRESHOLD || info.velocity.x < -SWIPE_VELOCITY;
                const swipedRight =
                  info.offset.x > SWIPE_THRESHOLD || info.velocity.x > SWIPE_VELOCITY;
                if (swipedLeft) goNext();
                else if (swipedRight) goPrev();
              }}
            >
              <PromoSlide slide={current} eager={index === 0} />
            </motion.div>
          </AnimatePresence>
        </div>
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
    </section>
  );
}
