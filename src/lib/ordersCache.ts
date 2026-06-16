import type { User } from 'firebase/auth';

interface Order {
  _id: string;
  userId: string;
  products: Array<{ name: string; quantity: number; size: string; price: number }>;
  totalAmount: number;
  status: string;
  createdAt: string;
}

interface CacheEntry {
  uid: string;
  orders: Order[];
  fetchedAt: number;
}

const FRESH_MS = 60_000; // Treat cache as fresh for 60s
let cache: CacheEntry | null = null;
let inFlight: Promise<Order[] | null> | null = null;

/**
 * Returns cached orders only if they belong to the given uid and are still fresh.
 */
export function getCachedOrders(uid: string | undefined): Order[] | null {
  if (!cache || !uid || cache.uid !== uid) return null;
  if (Date.now() - cache.fetchedAt > FRESH_MS) return null;
  return cache.orders;
}

/**
 * Returns cached orders for the uid regardless of freshness (for instant render).
 */
export function getStaleOrders(uid: string | undefined): Order[] | null {
  if (!cache || !uid || cache.uid !== uid) return null;
  return cache.orders;
}

export function setCachedOrders(uid: string, orders: Order[]): void {
  cache = { uid, orders, fetchedAt: Date.now() };
}

export function clearOrdersCache(): void {
  cache = null;
  inFlight = null;
}

/**
 * Fires the /api/orders fetch and caches the result. Deduplicates concurrent calls.
 * Safe to call repeatedly — returns the same in-flight promise if already running.
 * Silent on failure (this is a background optimisation, never a UX-critical path).
 */
export async function prefetchOrders(user: User | null): Promise<Order[] | null> {
  if (!user) return null;
  if (inFlight) return inFlight;

  const fresh = getCachedOrders(user.uid);
  if (fresh) return fresh;

  inFlight = (async () => {
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/orders', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return null;
      const data = await res.json();
      const orders: Order[] = data.orders || [];
      setCachedOrders(user.uid, orders);
      return orders;
    } catch {
      return null;
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}

/**
 * Schedules a prefetch during the browser's idle time so it never blocks
 * rendering or user interaction. Falls back to a delayed setTimeout if
 * requestIdleCallback isn't available (Safari).
 */
export function schedulePrefetchOrders(user: User | null): void {
  if (!user || typeof window === 'undefined') return;

  const fire = () => { void prefetchOrders(user); };

  const w = window as Window & {
    requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
  };

  if (typeof w.requestIdleCallback === 'function') {
    w.requestIdleCallback(fire, { timeout: 2000 });
  } else {
    setTimeout(fire, 800);
  }
}
