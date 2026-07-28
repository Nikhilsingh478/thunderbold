import type { SyntheticEvent } from 'react';

export const CLOUD_NAME = 'djptdutak';
export const CLOUD_NAME_2 = 'dyyjowb8g';

/**
 * Checks if a path segment right after /upload/ consists of Cloudinary transformation parameters.
 */
function isTransformationSegment(segment: string): boolean {
  if (!segment) return false;
  const knownPrefixes = ['f_', 'q_', 'w_', 'h_', 'c_', 'g_', 'dpr_', 'ar_', 'b_', 'r_', 'e_', 'o_', 'fl_'];
  const tokens = segment.split(',');
  return tokens.length > 0 && tokens.every(t => knownPrefixes.some(p => t.startsWith(p)));
}

/**
 * Transforms a raw Cloudinary URL into an optimised one safely.
 * - f_auto  → best format for browser (WebP / AVIF)
 * - q_auto  → automatic quality compression
 * - w_<n>   → resize to requested width
 * - h_<n>,c_fill → optional: crop to exact height (for fixed-ratio cards)
 *
 * Preserves all folder names, version numbers, and file paths accurately.
 */
export function optimizeCloudinaryUrl(
  url: string | null | undefined,
  width: number = 800,
  height?: number,
): string {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return '/placeholder.png';
  }

  let cleanUrl = url.trim();

  // Upgrade insecure HTTP Cloudinary URLs to HTTPS
  if (cleanUrl.startsWith('http://res.cloudinary.com')) {
    cleanUrl = cleanUrl.replace('http://', 'https://');
  }

  // Non-Cloudinary URLs are returned unchanged
  if (!cleanUrl.includes('res.cloudinary.com')) {
    return cleanUrl;
  }

  const params = height
    ? `f_auto,q_auto,w_${width},h_${height},c_fill`
    : `f_auto,q_auto,w_${width}`;

  try {
    const uploadIndex = cleanUrl.indexOf('/upload/');
    if (uploadIndex === -1) return cleanUrl;

    const afterUpload = cleanUrl.substring(uploadIndex + 8);
    const parts = afterUpload.split('/');

    // If existing segment contains old transformations (e.g. c_scale,w_400 or f_auto,q_auto)
    // replace ONLY that transformation segment without removing folder names or version tags
    if (parts.length > 0 && isTransformationSegment(parts[0])) {
      const rest = parts.slice(1).join('/');
      return `${cleanUrl.substring(0, uploadIndex)}/upload/${params}/${rest}`;
    }

    // Standard case: inject params right after /upload/
    return `${cleanUrl.substring(0, uploadIndex)}/upload/${params}/${afterUpload}`;
  } catch {
    return cleanUrl;
  }
}


/**
 * Safe image error handler to prevent infinite loops and alt text flickering.
 * 1. Sets target.onerror = null immediately to break loop if fallback image fails.
 * 2. Attempts raw un-transformed Cloudinary URL fallback if optimization caused error.
 * 3. Falls back to /placeholder.png.
 */
export function handleImageError(
  e: SyntheticEvent<HTMLImageElement, Event>,
  fallbackUrl: string = '/placeholder.png'
): void {
  const target = e.currentTarget;
  target.onerror = null; // CRITICAL: Stop loop & alt text flicker immediately

  const currentSrc = target.src || '';
  
  // If current URL was an optimized Cloudinary URL, attempt the original raw URL first
  if (currentSrc.includes('/upload/f_auto,q_auto')) {
    const rawUrl = currentSrc.replace(/\/upload\/f_auto,q_auto[^/]*\//, '/upload/');
    if (rawUrl !== currentSrc) {
      target.src = rawUrl;
      return;
    }
  }

  target.src = fallbackUrl;
}

/**
 * Builds a Cloudinary URL from a public ID and optional cloud name.
 */
export function buildCloudinaryUrl(
  publicId: string,
  cloudName: string = CLOUD_NAME,
  width: number = 800,
): string {
  return `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto,w_${width}/${publicId}`;
}

export const IMG_SIZES = {
  thumbnail: 200,
  card: 500,
  detail: 1000,
  hero: 1200,
} as const;

