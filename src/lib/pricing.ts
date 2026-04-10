const DISCOUNT = 0.4;

export interface PriceInfo {
  finalPrice: number;
  originalPrice: number;
  discountPct: number;
  savings: number;
  hasDiscount: boolean;
}

export function computePrice(price: number | string | undefined): PriceInfo {
  const finalPrice = Math.round(
    typeof price === 'string' ? parseFloat(price.replace(/[^0-9.]/g, '')) : (price ?? 0)
  );

  if (!finalPrice || finalPrice <= 0) {
    return { finalPrice: 0, originalPrice: 0, discountPct: 0, savings: 0, hasDiscount: false };
  }

  const originalPrice = Math.round(finalPrice / (1 - DISCOUNT));
  const savings = originalPrice - finalPrice;

  return { finalPrice, originalPrice, discountPct: Math.round(DISCOUNT * 100), savings, hasDiscount: true };
}
