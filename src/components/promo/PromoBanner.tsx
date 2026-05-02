import { Link } from 'react-router-dom';
import { promoSlides } from './promoSlides';

/**
 * Static side-by-side promo banner — replaces the old slider.
 * Both images are shown at once, compact, with no auto-advance or controls.
 */
export default function PromoBanner() {
  if (promoSlides.length === 0) return null;

  return (
    <section aria-label="Promotional offers" className="px-4 md:px-8 py-6 md:py-8">
      <div className="max-w-[1000px] mx-auto">
        <div className="grid grid-cols-2 gap-3 md:gap-5">
          {promoSlides.map((slide) => (
            <Link
              key={slide.id}
              to={slide.route}
              aria-label={slide.title}
              className="block overflow-hidden rounded-sm group"
            >
              <img
                src={slide.image}
                alt={slide.title}
                className="w-full h-full object-contain object-center select-none transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                loading="lazy"
                decoding="async"
                draggable={false}
              />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
