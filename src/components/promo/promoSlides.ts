/**
 * Static configuration for the homepage promo slider.
 *
 * Slides are intentionally hard-coded — they map 1:1 to the price-cap
 * deal pages registered in AppContent. Adding a new slide here is the
 * only place you need to edit to extend the slider.
 */
export interface PromoSlide {
  /** Stable identifier — also used as React key. */
  id: string;
  /** Accessible label / alt text for the slide image. */
  title: string;
  /** Path under /public — text is baked into the image, not overlaid. */
  image: string;
  /** Internal SPA route to navigate to when the slide is clicked. */
  route: string;
}

export const promoSlides: PromoSlide[] = [
  {
    id: 'under-999',
    title: 'Jeans Under ₹999',
    image: '/banners/under-999.webp',
    route: '/deals/under-999',
  },
  {
    id: 'under-699',
    title: 'Jeans Under ₹699',
    image: '/banners/under-699.webp',
    route: '/deals/under-699',
  },
];
