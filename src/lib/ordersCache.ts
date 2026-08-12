import type { User } from 'firebase/auth';
import { queryClient } from './queryClient';

interface OrderProduct {
  productId?: string;
  name: string;
  quantity: number;
  size: string;
  price: number;
  image?: string;
}

interface Order {
  _id: string;
  userId: string;
  products: OrderProduct[];
  totalAmount: number;
  status: string;
  createdAt: string;
}

interface OrdersApiResponse {
  orders: Order[];
  count: number;
  total: number;
  page: number;
  totalPages: number;
  limit: number;
}

let inFlight: Promise<OrdersApiResponse | null> | null = null;

/**
 * Returns cached orders for page 1 if available in TanStack Query cache.
 */
export function getCachedOrders(uid: string | undefined): OrdersApiResponse | null {
  if (!uid) return null;
  return queryClient.getQueryData<OrdersApiResponse>(['orders', 1]) ?? null;
}

/**
 * Returns cached orders regardless of freshness for instant render.
 */
export function getStaleOrders(uid: string | undefined): OrdersApiResponse | null {
  if (!uid) return null;
  return queryClient.getQueryData<OrdersApiResponse>(['orders', 1]) ?? null;
}

export function setCachedOrders(uid: string, data: OrdersApiResponse): void {
  queryClient.setQueryData(['orders', 1], data);
}

export function clearOrdersCache(): void {
  queryClient.removeQueries({ queryKey: ['orders'] });
  queryClient.removeQueries({ queryKey: ['profile'] });
  inFlight = null;
}

/**
 * Fires the /api/orders fetch and caches the result under queryKey ['orders', 1].
 * Deduplicates concurrent calls.
 */
export async function prefetchOrders(user: User | null): Promise<OrdersApiResponse | null> {
  if (!user) return null;
  if (inFlight) return inFlight;

  const cached = getCachedOrders(user.uid);
  if (cached) return cached;

  inFlight = (async () => {
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/orders?page=1', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return null;
      const data: OrdersApiResponse = await res.json();
      setCachedOrders(user.uid, data);
      return data;
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
 * rendering or user interaction.
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
