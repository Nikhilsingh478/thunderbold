import { Link } from 'react-router-dom';
import type { PromoSlide as PromoSlideType } from './promoSlides';

interface PromoSlideProps {
  slide: PromoSlideType;
  /** First slide should load eagerly to avoid CLS; rest lazily. */
  eager?: boolean;
}

/**
 * Single promo slide tile. Pure presentation: an aspect-ratio-locked
 * full-bleed image wrapped in a link. All overlay text is baked into
 * the image asset itself — nothing is dynamically rendered on top.
 */
export default function PromoSlide({ slide, eager = false }: PromoSlideProps) {
  return (
    <Link
      to={slide.route}
      aria-label={slide.title}
      className="group relative block w-full overflow-hidden rounded-2xl md:rounded-3xl border border-white/5 hover:border-brass/40 transition-colors duration-500 cursor-pointer"
      draggable={false}
    >
      <div className="aspect-[1944/809] w-full bg-[#0a0a0a]">
        <img
          src={slide.image}
          alt={slide.title}
          className="w-full h-full object-contain object-center transition-transform duration-[0.8s] ease-[0.16,1,0.3,1] group-hover:scale-[1.03]"
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          draggable={false}
        />
      </div>
      {/* Subtle vignette + brass-on-hover glow ring */}
      <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/0 group-hover:ring-brass/30 transition-[box-shadow,ring] duration-500" />
    </Link>
  );
}
