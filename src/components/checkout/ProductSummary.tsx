import type { CheckoutState } from '@/pages/Checkout';

interface Props {
  product: CheckoutState;
}

export default function ProductSummary({ product }: Props) {
  return (
    <div className="border border-white/[0.07] bg-surface overflow-hidden">
      {/* Image */}
      <div className="relative aspect-[4/5] overflow-hidden">
        <img
          src={product.productImage}
          alt={product.productName}
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent" />
      </div>

      {/* Details */}
      <div className="p-5 md:p-6 space-y-4">
        <div className="font-condensed font-semibold text-[0.6rem] tracking-[0.35em] uppercase text-brass">
          {product.categoryName}
        </div>
        <h3 className="font-display text-2xl tracking-[0.08em] metal-text uppercase leading-none">
          {product.productName}
        </h3>
        <div className="font-condensed text-xl tracking-widest text-tb-white">
          {product.price}
        </div>

        <div className="border-t border-white/[0.06] pt-4 space-y-2.5">
          <div className="flex justify-between font-condensed text-[0.78rem] tracking-[0.12em] uppercase">
            <span className="text-sv-mid">Size</span>
            <span className="text-tb-white font-semibold">{product.size}</span>
          </div>
          <div className="flex justify-between font-condensed text-[0.78rem] tracking-[0.12em] uppercase">
            <span className="text-sv-mid">Quantity</span>
            <span className="text-tb-white font-semibold">{product.quantity}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
