import { Link } from 'react-router-dom';
import type { PromoSlide as PromoSlideType } from './promoSlides';

interface PromoSlideProps {
  slide: PromoSlideType;
  /** First slide should load eagerly to avoid CLS; rest lazily. */
  eager?: boolean;
}

/**
 * Single promo slide. The banner image is already a self-contained
 * capsule (transparent background, baked-in text and frame), so this
 * component is a bare clickable image — no card, no border, no ring.
 */
export default function PromoSlide({ slide, eager = false }: PromoSlideProps) {
  return (
    <Link
      to={slide.route}
      aria-label={slide.title}
      className="block w-full h-full cursor-pointer"
      draggable={false}
    >
      <img
        src={slide.image}
        alt={slide.title}
        className="w-full h-full object-contain object-center select-none transition-transform duration-[0.6s] ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.02]"
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        draggable={false}
      />
    </Link>
  );
}
