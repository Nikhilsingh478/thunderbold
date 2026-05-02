export interface PriceInfo {
  sellingPrice: number;
  purchasePrice: number;
  discountPct: number;
  savings: number;
  hasDiscount: boolean;
}

/**
 * Computes price display info from selling price and optional purchase price.
 *
 * - sellingPrice  = what the customer actually pays (shown as the main price)
 * - purchasePrice = MRP / original price (shown as crossed-out, if higher)
 * - Discount % is derived from the two values — no hardcoding.
 */
export function computePrice(
  sellingPrice: number | string | undefined,
  purchasePrice?: number | string | undefined,
): PriceInfo {
  const selling = Math.round(
    typeof sellingPrice === 'string'
      ? parseFloat(sellingPrice.replace(/[^0-9.]/g, ''))
      : (sellingPrice ?? 0),
  );
  const purchase = Math.round(
    typeof purchasePrice === 'string'
      ? parseFloat(purchasePrice.replace(/[^0-9.]/g, ''))
      : (purchasePrice ?? 0),
  );

  if (!selling || selling <= 0) {
    return { sellingPrice: 0, purchasePrice: 0, discountPct: 0, savings: 0, hasDiscount: false };
  }

  const hasDiscount = purchase > selling;
  const savings = hasDiscount ? purchase - selling : 0;
  const discountPct = hasDiscount ? Math.round((savings / purchase) * 100) : 0;

  return {
    sellingPrice: selling,
    purchasePrice: hasDiscount ? purchase : selling,
    discountPct,
    savings,
    hasDiscount,
  };
}
