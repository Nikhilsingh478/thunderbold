const CLOUD_NAME = 'djptdutak';

/**
 * Transforms a raw Cloudinary URL into an optimised one.
 * - Adds f_auto  → best format for the browser (WebP / AVIF)
 * - Adds q_auto  → automatic quality (Cloudinary picks the sweet-spot)
 * - Adds w_<n>   → resize to requested width
 *
 * Non-Cloudinary URLs are returned unchanged so the function is safe
 * to call on any image source (local paths, external CDNs, etc.).
 *
 * Already-optimised URLs (containing /upload/f_auto) are also returned
 * unchanged to prevent double transformation.
 */
export function optimizeCloudinaryUrl(
  url: string | null | undefined,
  width: number = 800,
): string {
  if (!url) return '/placeholder.png';
  if (!url.includes('res.cloudinary.com')) return url;
  if (url.includes('/upload/f_auto')) return url;  // already optimised

  return url.replace('/upload/', `/upload/f_auto,q_auto,w_${width}/`);
}

/**
 * Convenience sizes — use these names in the UI for consistency.
 *
 *  thumbnail  → admin previews, cart items, checkout summary (80–200 px)
 *  card       → product / category cards                     (400–500 px)
 *  detail     → product detail page hero                     (1000 px)
 */
export const IMG_SIZES = {
  thumbnail: 200,
  card: 500,
  detail: 1000,
} as const;
