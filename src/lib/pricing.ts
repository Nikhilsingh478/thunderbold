export interface PriceInfo {
  sellingPrice: number;
  /** MRP / original price — shown crossed-out when higher than sellingPrice. */
  mrp: number;
  discountPct: number;
  savings: number;
  hasDiscount: boolean;
}

/**
 * Computes price display info from selling price and optional MRP.
 *
 * - sellingPrice = what the customer actually pays (shown as the main price)
 * - mrp          = MRP / original price (shown crossed-out when higher than sellingPrice)
 * - Discount %   is derived dynamically — no hardcoding.
 */
export function computePrice(
  sellingPrice: number | string | undefined,
  mrp?: number | string | undefined,
): PriceInfo {
  const selling = Math.round(
    typeof sellingPrice === 'string'
      ? parseFloat(sellingPrice.replace(/[^0-9.]/g, ''))
      : (sellingPrice ?? 0),
  );
  const original = Math.round(
    typeof mrp === 'string'
      ? parseFloat(mrp.replace(/[^0-9.]/g, ''))
      : (mrp ?? 0),
  );

  if (!selling || selling <= 0) {
    return { sellingPrice: 0, mrp: 0, discountPct: 0, savings: 0, hasDiscount: false };
  }

  const hasDiscount = original > selling;
  const savings = hasDiscount ? original - selling : 0;
  const discountPct = hasDiscount ? Math.round((savings / original) * 100) : 0;

  return {
    sellingPrice: selling,
    mrp: hasDiscount ? original : selling,
    discountPct,
    savings,
    hasDiscount,
  };
}
