/**
 * Lightweight module-level API cache with in-flight request deduplication.
 *
 * - Prevents the same URL from being fetched multiple times simultaneously
 *   (e.g. /api/products called by both LiveSaleSection and CategoriesSection on mount).
 * - Stores responses for TTL_MS (60 s) so navigating back to the homepage
 *   doesn't re-hit the serverless functions.
 * - Thread-safe for the single-threaded JS event loop.
 */

import { apiUrl } from './apiBase';

const TTL_MS = 60_000;

interface CacheEntry<T> {
  data: T;
  ts: number;
}

const cache = new Map<string, CacheEntry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();

export async function cachedFetch<T = unknown>(url: string): Promise<T> {
  const fullUrl = apiUrl(url);
  const now = Date.now();
  const hit = cache.get(fullUrl);
  if (hit && now - hit.ts < TTL_MS) {
    return hit.data as T;
  }

  const existing = inflight.get(fullUrl);
  if (existing) return existing as Promise<T>;

  const promise = fetch(fullUrl)
    .then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json() as Promise<T>;
    })
    .then((data) => {
      cache.set(fullUrl, { data, ts: Date.now() });
      inflight.delete(fullUrl);
      return data;
    })
    .catch((err) => {
      inflight.delete(fullUrl);
      throw err;
    });

  inflight.set(fullUrl, promise);
  return promise as Promise<T>;
}

export function invalidateCache(url?: string) {
  if (url) {
    cache.delete(url);
  } else {
    cache.clear();
  }
}
