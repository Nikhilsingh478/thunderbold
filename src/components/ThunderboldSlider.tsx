import { useEffect, useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SlideData {
  imageUrl: string;
  heading: string;
  productId: string | null;
  productName: string | null;
  productImage: string | null;
}

const GRAIN_SVG =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.08'/></svg>`,
  );

const EASE = 'cubic-bezier(0.4,0,0.2,1)';
const DURATION = 650;

type Role = 'center' | 'left' | 'right' | 'back';

function getRole(i: number, active: number): Role {
  if (i === active) return 'center';
  if (i === (active + 3) % 4) return 'left';
  if (i === (active + 1) % 4) return 'right';
  return 'back';
}

function roleStyle(role: Role, isMobile: boolean): React.CSSProperties {
  const baseW = isMobile ? '72vw' : '26vw';
  const sideW = isMobile ? '48vw' : '18vw';
  const backW = isMobile ? '38vw' : '14vw';
  const liftBottom = isMobile ? '10%' : '0%';

  const common: React.CSSProperties = {
    position: 'absolute',
    bottom: liftBottom,
    aspectRatio: '0.6 / 1',
    transition: `transform ${DURATION}ms ${EASE}, filter ${DURATION}ms ${EASE}, opacity ${DURATION}ms ${EASE}, left ${DURATION}ms ${EASE}, width ${DURATION}ms ${EASE}`,
    transformOrigin: 'bottom center',
    willChange: 'transform, filter, opacity, left',
    pointerEvents: 'none',
  };

  switch (role) {
    case 'center':
      return { ...common, left: '50%', width: baseW, transform: 'translateX(-50%) translateY(0) scale(1)', filter: 'blur(0px)', opacity: 1, zIndex: 30 };
    case 'left':
      return { ...common, left: isMobile ? '4%' : '18%', width: sideW, transform: 'translateX(-50%) translateY(4%) scale(0.78)', filter: 'blur(1.5px)', opacity: isMobile ? 0.45 : 0.85, zIndex: 20 };
    case 'right':
      return { ...common, left: isMobile ? '96%' : '82%', width: sideW, transform: 'translateX(-50%) translateY(4%) scale(0.78)', filter: 'blur(1.5px)', opacity: isMobile ? 0.45 : 0.85, zIndex: 20 };
    default:
      return { ...common, left: '50%', width: backW, transform: 'translateX(-50%) translateY(8%) scale(0.55)', filter: 'blur(4px)', opacity: 0.25, zIndex: 10 };
  }
}

function SlideImagePlaceholder() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-white/[0.03] border border-white/[0.06]">
      <span className="font-condensed text-[0.6rem] tracking-[0.2em] uppercase text-white/20">No Image</span>
    </div>
  );
}

/**
 * ThunderboldSlider — dynamic editorial carousel.
 * Navigation: touch/pointer swipe (horizontal drag ≥ 50 px triggers advance).
 * Arrows removed — swipe only for native-app feel.
 */
export default function ThunderboldSlider() {
  const navigate = useNavigate();
  const [slides, setSlides] = useState<SlideData[] | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const animatingRef = useRef(false);

  // Pointer / swipe tracking
  const dragStartX = useRef(0);
  const dragDeltaX = useRef(0);
  const isDragging = useRef(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/slider')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!cancelled && Array.isArray(data?.slides)) {
          setSlides(data.slides);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const go = (dir: 'next' | 'prev') => {
    if (animatingRef.current) return;
    animatingRef.current = true;
    setActiveIndex(prev => dir === 'next' ? (prev + 1) % 4 : (prev + 3) % 4);
    window.setTimeout(() => { animatingRef.current = false; }, DURATION);
  };

  // Pointer event handlers — works for both mouse and touch via pointer events API
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // If the click is on an interactive element (button, link, or its children), ignore it for slider drag
    if ((e.target as HTMLElement).closest('button, a')) {
      return;
    }
    dragStartX.current = e.clientX;
    dragDeltaX.current = 0;
    isDragging.current = false;
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    const delta = e.clientX - dragStartX.current;
    dragDeltaX.current = delta;
    // Mark as drag once horizontal movement exceeds 8px
    if (Math.abs(delta) > 8) {
      isDragging.current = true;
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
    const delta = dragDeltaX.current;
    if (Math.abs(delta) > 50) {
      go(delta < 0 ? 'next' : 'prev');
    }
    // Reset dragging flag after click handlers have had a chance to check it
    requestAnimationFrame(() => { isDragging.current = false; });
  };

  if (slides !== null) {
    const hasContent = slides.some(s => s.imageUrl || s.heading);
    if (!hasContent) return null;
  }

  if (slides === null) return null;

  const active = slides[activeIndex];

  const handleCta = () => {
    if (isDragging.current) return;
    if (active.productId) navigate(`/product/${active.productId}`);
  };

  return (
    <section
      className="relative w-full overflow-hidden select-none"
      style={{ backgroundColor: 'transparent', fontFamily: "'Inter', sans-serif", touchAction: 'pan-y' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <style>{`
        @keyframes tb-heading-split-in {
          0%   { opacity: 0; transform: scale(1.35) translateY(-6%); filter: blur(20px); letter-spacing: 0.25em; }
          60%  { opacity: 1; filter: blur(0px); }
          100% { opacity: 1; transform: scale(1) translateY(0); filter: blur(0px); letter-spacing: -0.02em; }
        }
        .tb-heading-anim { animation: tb-heading-split-in 850ms cubic-bezier(0.22, 1, 0.36, 1) both; }
      `}</style>

      <div className="relative w-full" style={{ height: isMobile ? '65svh' : '100svh', minHeight: isMobile ? 400 : 560, overflow: 'hidden' }}>
        {/* Grain overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ zIndex: 50, opacity: 0.4, backgroundImage: `url("${GRAIN_SVG}")`, backgroundSize: '200px 200px', backgroundRepeat: 'repeat' }}
        />

        {/* Ghost heading */}
        <div
          className="absolute inset-x-0 flex items-center justify-center pointer-events-none select-none"
          style={{ zIndex: 2, top: isMobile ? '45%' : '14%', transform: isMobile ? 'translateY(-50%)' : 'none' }}
        >
          <h1
            key={`${activeIndex}`}
            className="tb-heading-anim"
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: isMobile ? 'clamp(48px, 16vw, 100px)' : 'clamp(90px, 18vw, 260px)',
              fontWeight: 900,
              color: 'white',
              lineHeight: 1,
              textTransform: 'uppercase',
              letterSpacing: '-0.02em',
              whiteSpace: 'nowrap',
              margin: 0,
            }}
          >
            {active.heading || '—'}
          </h1>
        </div>

        {/* Carousel images */}
        {slides.map((slide, i) => {
          const role = getRole(i, activeIndex);
          return (
            <div key={i} style={roleStyle(role, isMobile)}>
              {slide.imageUrl ? (
                <img
                  src={slide.imageUrl}
                  alt={slide.heading || `Slide ${i + 1}`}
                  draggable={false}
                  loading={i === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                  style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'bottom center', display: 'block', userSelect: 'none' }}
                />
              ) : (
                <SlideImagePlaceholder />
              )}
            </div>
          );
        })}

        {/* Bottom-left: label + swipe hint dots */}
        <div className="absolute left-4 sm:left-10 bottom-4 sm:bottom-20 max-w-[70%] sm:max-w-md" style={{ zIndex: 60 }}>
          <p className="mb-3 sm:mb-4 text-xs sm:text-[22px] uppercase" style={{ color: 'white', opacity: 0.95, letterSpacing: '0.08em', fontFamily: "'Bebas Neue', sans-serif" }}>
            THUNDER LOOKS
          </p>
          {/* Dot indicators */}
          <div className="flex items-center gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => {
                  if (animatingRef.current) return;
                  animatingRef.current = true;
                  setActiveIndex(i);
                  window.setTimeout(() => { animatingRef.current = false; }, DURATION);
                }}
                style={{
                  width: i === activeIndex ? 24 : 6,
                  height: 6,
                  borderRadius: 3,
                  background: i === activeIndex ? 'white' : 'rgba(255,255,255,0.3)',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  transition: `width ${DURATION}ms cubic-bezier(0.4,0,0.2,1), background ${DURATION}ms`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Bottom-right: CTA */}
        <button
          type="button"
          onClick={handleCta}
          disabled={!active.productId}
          className="absolute right-4 bottom-4 sm:bottom-20 sm:right-10 flex items-center gap-2 group disabled:opacity-40 disabled:cursor-default"
          style={{
            zIndex: 60,
            fontFamily: "'Anton', sans-serif",
            fontSize: 'clamp(18px, 4vw, 56px)',
            fontWeight: 400,
            color: '#ffffff',
            opacity: active.productId ? 1 : 0.4,
            letterSpacing: '-0.02em',
            lineHeight: 1,
            textTransform: 'uppercase',
            background: 'none',
            border: 'none',
            cursor: active.productId ? 'pointer' : 'default',
            padding: 0,
            transition: 'opacity 200ms',
          }}
        >
          SHOP THIS LOOK
          <ArrowRight className="w-4 h-4 sm:w-8 sm:h-8" strokeWidth={2.25} />
        </button>
      </div>
    </section>
  );
}
