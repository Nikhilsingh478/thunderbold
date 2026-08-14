import { Capacitor } from '@capacitor/core';

/**
 * On native Capacitor (Android), the WebView serves local bundle files
 * from https://localhost — there is no backend there.
 * All API calls must go to the real production backend at thunderbold.shop.
 *
 * On web (browser), relative /api/* paths work fine because Vercel/Express
 * serves the API on the same origin.
 */
const isNativeEnvironment = (): boolean => {
  if (typeof window === 'undefined') return false;
  if (Capacitor.isNativePlatform()) return true;
  const h = window.location.hostname;
  const p = window.location.protocol;
  return h === 'localhost' || h === '127.0.0.1' || p === 'capacitor:' || p === 'ionic:';
};

export const API_BASE = isNativeEnvironment()
  ? 'https://thunderbold.shop'
  : '';

/**
 * Prepend the correct base URL to any /api/* path.
 *
 * Usage:
 *   fetch(apiUrl('/api/orders'))
 *   fetch(apiUrl(`/api/products?page=${page}`))
 */
export const apiUrl = (path: string): string => {
  if (!path) return path;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${API_BASE}${path}`;
};
