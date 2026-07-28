import { Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { optimizeCloudinaryUrl, IMG_SIZES } from '../../lib/cloudinary';
import { useWishlist } from '../../context/WishlistContext';
import PriceDisplay from '../PriceDisplay';

export interface GridProduct {
  _id: string;
  name: string;
  price: number;
  /** MRP / original price — shown crossed-out when higher than price. */
  mrp?: number;
  image?: string;
  images?: string[];
}

interface ProductGridProps {
  products: GridProduct[];
  loading?: boolean;
  /** Number of skeleton tiles to render while loading. Defaults to 8. */
  skeletonCount?: number;
  /** Empty-state UI shown when not loading and there are zero products. */
  emptyState?: React.ReactNode;
}

/**
 * Reusable product grid used by CategoryView, DealsPage, BrandView, etc.
 * Renders the canonical Thunderbold product card (image, wishlist heart,
 * name, PriceDisplay) with consistent animations and skeletons everywhere.
 *
 * Animations are CSS-only (@keyframes tbFadeInUp in index.css) — no Framer Motion
 * at the card level so weak-CPU devices don't pay JS animation overhead per image.
 */
export default function ProductGrid({
  products,
  loading = false,
  skeletonCount = 8,
  emptyState,
}: ProductGridProps) {
  const navigate = useNavigate();
  const { toggleWishlist, isInWishlist } = useWishlist();

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-10">
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <div key={i} className="flex flex-col">
            {/* aspect-[3/4] reserves exact space before content loads — prevents CLS */}
            <div className="aspect-[3/4] bg-white/5 rounded-sm animate-pulse" />
            <div className="mt-5 space-y-2">
              <div className="h-4 bg-white/5 rounded animate-pulse w-3/4" />
              <div className="h-3 bg-white/5 rounded animate-pulse w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <>
        {emptyState ?? (
          <div className="text-center py-24 font-condensed text-sm tracking-[0.18em] uppercase text-sv-mid">
            No products found.
          </div>
        )}
      </>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-10">
      {products.map((prod, i) => (
        <div
          key={prod._id}
          className="group cursor-pointer flex flex-col tb-card-appear"
          style={{ animationDelay: `${Math.min(i, 7) * 40}ms` }}
          onClick={() => navigate(`/product/${prod._id}`)}
        >
          {/* Container reserves 3:4 space before image loads — critical for CLS */}
          <div className="overflow-hidden bg-[#0c0c0c] aspect-[3/4] relative border border-white/5 group-hover:border-white/10 transition-colors duration-500 rounded-sm">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleWishlist({
                  productId: prod._id,
                  name: prod.name,
                  price: prod.price,
                  image: prod.images?.[0] || prod.image,
                });
              }}
              aria-label={isInWishlist(prod._id) ? 'Remove from wishlist' : 'Add to wishlist'}
              className="absolute top-3 right-3 z-10 p-2 bg-black/60 backdrop-blur-sm rounded-full text-white/60 hover:text-red-400 hover:bg-red-900/20 transition-all duration-200"
            >
              <Heart
                size={16}
                className={isInWishlist(prod._id) ? 'fill-current text-red-400' : ''}
              />
            </button>

            {/* Explicit width/height tell the browser to reserve pixel dimensions
                before the image downloads — combined with aspect-[3/4] this gives
                two CLS-prevention layers. object-cover fills without distortion.  */}
            <img
              src={optimizeCloudinaryUrl(prod.images?.[0] || prod.image, IMG_SIZES.card)}
              alt={prod.name}
              width={500}
              height={667}
              className="w-full h-full object-cover object-center scale-[1.02] group-hover:scale-[1.08] transition-transform duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)] grayscale-[0.1]"
              loading={i < 4 ? 'eager' : 'lazy'}
              decoding="async"
              onError={(e) => { (e.currentTarget as HTMLImageElement).onerror = null; (e.currentTarget as HTMLImageElement).src = '/placeholder.png'; }}
            />
          </div>
          <div className="mt-4 flex flex-col">
            <h3 className="font-condensed text-[0.95rem] sm:text-lg leading-tight sm:leading-snug tracking-[0.12em] uppercase text-tb-white group-hover:text-brass transition-colors duration-300 line-clamp-2 overflow-hidden">
              {prod.name}
            </h3>
            <div className="mt-1">
              <PriceDisplay price={prod.price} mrp={prod.mrp} size="sm" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
