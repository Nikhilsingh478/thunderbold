export const CLOUD_NAME = 'djptdutak';
export const CLOUD_NAME_2 = 'dyyjowb8g';

export const PLACEHOLDER = 'data:image/svg+xml,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">' +
  '<rect width="400" height="400" fill="#111111"/>' +
  '<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#333333" font-size="14" font-family="sans-serif">No Image</text>' +
  '</svg>'
);

/**
 * Transforms a raw Cloudinary URL into an optimised one.
 * - f_auto  → best format for browser (WebP / AVIF)
 * - q_auto  → automatic quality compression
 * - w_<n>   → resize to requested width
 * - h_<n>,c_fill → optional: crop to exact height (for fixed-ratio cards)
 *
 * Non-Cloudinary URLs are returned unchanged so the function is safe
 * to call on any image source (local paths, external CDNs, etc.).
 *
 * URLs already transformed by this function (identified by the f_auto,q_auto,w_
 * prefix) are returned as-is to prevent double transformation.
 */
export function optimizeCloudinaryUrl(
  url: string | null | undefined,
  width: number = 800,
  height?: number,
): string {
  if (!url || url === '/placeholder.png') return PLACEHOLDER;
  if (!url.includes('res.cloudinary.com')) return url;
  // Already transformed by this function — skip to avoid duplicating params
  if (url.includes('/upload/f_auto,q_auto,w_')) return url;

  const params = height
    ? `f_auto,q_auto,w_${width},h_${height},c_fill`
    : `f_auto,q_auto,w_${width}`;

  return url.replace('/upload/', `/upload/${params}/`);
}

/**
 * Builds a Cloudinary URL from a public ID and optional cloud name.
 * Defaults to CLOUD_NAME (djptdutak). Pass CLOUD_NAME_2 for the second account.
 */
export function buildCloudinaryUrl(
  publicId: string,
  cloudName: string = CLOUD_NAME,
  width: number = 800,
): string {
  return `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto,w_${width}/${publicId}`;
}

/**
 * Convenience sizes — use these names in the UI for consistency.
 *
 *  thumbnail  → admin previews, cart items, checkout summary (80–200 px)
 *  card       → product / category cards                     (400–500 px)
 *  detail     → product detail page hero                     (1000 px)
 *  hero       → full-width banner images                     (1200 px)
 */
export const IMG_SIZES = {
  thumbnail: 200,
  card: 500,
  detail: 1000,
  hero: 1200,
} as const;
