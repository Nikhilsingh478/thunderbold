import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { optimizeCloudinaryUrl, IMG_SIZES } from '../../lib/cloudinary';
import { useWishlist } from '../../context/WishlistContext';
import PriceDisplay from '../PriceDisplay';

export interface GridProduct {
  _id: string;
  name: string;
  price: number;
  purchasePrice?: number;
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
 * Reusable product grid used by CategoryView and DealsPage.
 * Renders the canonical Thunderbolt product card (image, wishlist heart,
 * name, PriceDisplay) with the same animations and skeletons everywhere.
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
        <motion.div
          key={prod._id}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: Math.min(i, 8) * 0.05 }}
          className="group cursor-pointer flex flex-col"
          onClick={() => navigate(`/product/${prod._id}`)}
        >
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

            <motion.img
              src={optimizeCloudinaryUrl(prod.images?.[0] || prod.image, IMG_SIZES.card)}
              alt={prod.name}
              className="w-full h-full object-cover object-center scale-[1.02] group-hover:scale-[1.08] transition-transform duration-[0.8s] ease-[0.16,1,0.3,1] grayscale-[0.1]"
              loading={i < 4 ? 'eager' : 'lazy'}
              decoding="async"
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/placeholder.png'; }}
            />
          </div>
          <div className="mt-5 flex flex-col">
            <h3 className="font-condensed text-lg tracking-[0.15em] uppercase text-tb-white group-hover:text-brass transition-colors duration-300">
              {prod.name}
            </h3>
            <div className="mt-1">
              <PriceDisplay price={prod.price} purchasePrice={prod.purchasePrice} size="sm" />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
