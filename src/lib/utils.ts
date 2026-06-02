import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface OrderMinimal {
  _id?: string;
  id?: string;
  orderNumber?: string;
}

export function formatOrderId(order?: OrderMinimal | null): string {
  if (!order) return '—';
  if (order.orderNumber) return order.orderNumber;
  const idStr = order._id || order.id || '';
  if (!idStr) return '—';
  return `TB-${idStr.slice(-6).toUpperCase()}`;
}
