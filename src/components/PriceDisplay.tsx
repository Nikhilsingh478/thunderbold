import { computePrice } from '../lib/pricing';

interface PriceDisplayProps {
  price: number | string | undefined;
  /** MRP / original price — shown crossed-out when higher than price. */
  mrp?: number | string | undefined;
  size?: 'sm' | 'md' | 'lg';
  showSavings?: boolean;
}

export default function PriceDisplay({ price, mrp, size = 'md', showSavings = false }: PriceDisplayProps) {
  const { sellingPrice, mrp: origPrice, discountPct, savings, hasDiscount } = computePrice(price, mrp);

  if (!sellingPrice) return null;

  const finalSize = size === 'lg' ? 'text-3xl md:text-4xl' : size === 'sm' ? 'text-base' : 'text-xl';
  const origSize = size === 'lg' ? 'text-base' : 'text-xs';

  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`font-condensed font-bold tracking-wide text-tb-white ${finalSize}`}>
          ₹{sellingPrice.toLocaleString('en-IN')}
        </span>
        {hasDiscount && (
          <>
            <span className={`font-condensed text-white/35 line-through tracking-wide ${origSize}`}>
              ₹{origPrice.toLocaleString('en-IN')}
            </span>
            <span className="text-[0.6rem] font-condensed font-bold tracking-wider px-1.5 py-0.5 rounded bg-red-600 text-white uppercase">
              {discountPct}% off
            </span>
          </>
        )}
      </div>
      {hasDiscount && showSavings && (
        <span className="font-condensed text-[0.68rem] tracking-wider text-green-400">
          You save ₹{savings.toLocaleString('en-IN')}
        </span>
      )}
    </div>
  );
}
