import { useNavigate, Link } from 'react-router-dom';
import { optimizeCloudinaryUrl, IMG_SIZES, PLACEHOLDER } from '../lib/cloudinary';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, ShoppingBag, ArrowLeft, Trash2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import CustomCursor from '../components/CustomCursor';
import ScrollProgress from '../components/ScrollProgress';
import { useWishlist } from '../context/WishlistContext';

function formatPrice(price: number): string {
  return `₹${Math.round(price).toLocaleString('en-IN')}`;
}

export default function Wishlist() {
  const navigate = useNavigate();
  const { items, removeFromWishlist, clearWishlistData, loading, moveToCart } = useWishlist();

  const handleClearWishlist = async () => {
    if (window.confirm('Clear your entire wishlist?')) {
      await clearWishlistData();
    }
  };

  const totalValue = items.reduce(
    (sum, item) => sum + (typeof item.price === 'number' ? item.price : 0),
    0
  );

  if (loading) {
    return (
      <div className="noise-overlay min-h-screen flex flex-col bg-void">
        <CustomCursor />
        <ScrollProgress />
        <Navbar />
        <main className="flex-1 pt-[calc(110px+var(--tb-banner-h,0px))] pb-24 px-4 md:px-8 lg:px-16">
          <div className="max-w-[1240px] mx-auto">
            <div className="animate-pulse mb-6">
              <div className="h-7 bg-white/10 rounded w-32 mb-1" />
              <div className="h-4 bg-white/5 rounded w-20" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white/5 rounded-xl overflow-hidden">
                  <div className="aspect-[3/4] bg-white/10" />
                  <div className="p-3 space-y-2">
                    <div className="h-3 bg-white/10 rounded w-4/5" />
                    <div className="h-3 bg-white/10 rounded w-1/2" />
                    <div className="h-8 bg-white/10 rounded-lg mt-2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="noise-overlay min-h-screen flex flex-col bg-void">
      <CustomCursor />
      <ScrollProgress />
      <Navbar />

      <main className="flex-1 pt-[calc(110px+var(--tb-banner-h,0px))] pb-28 px-4 md:px-8 lg:px-16">
        <div className="max-w-[1240px] mx-auto">

          {/* ── Header ─────────────────────────────────────────── */}
          <div className="mb-6 md:mb-8">
            <div className="flex items-center justify-between">
              {/* Left: back + title */}
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={() => navigate(-1)}
                  aria-label="Go back"
                  className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 active:bg-white/15 transition-colors duration-150"
                >
                  <ArrowLeft size={16} className="text-tb-white" />
                </button>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h1 className="font-display text-2xl md:text-4xl tracking-[0.08em] text-tb-white uppercase leading-none">
                      Wishlist
                    </h1>
                    {items.length > 0 && (
                      <span className="shrink-0 inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-white/10 font-condensed text-[11px] text-sv-mid leading-none">
                        {items.length}
                      </span>
                    )}
                  </div>
                  {items.length > 0 && (
                    <p className="font-condensed text-[11px] tracking-[0.12em] text-sv-mid mt-0.5 hidden md:block">
                      {items.length} {items.length === 1 ? 'item' : 'items'} saved
                    </p>
                  )}
                </div>
              </div>

              {/* Right: clear */}
              {items.length > 0 && (
                <button
                  onClick={handleClearWishlist}
                  className="shrink-0 flex items-center gap-1.5 font-condensed text-xs tracking-[0.12em] uppercase text-sv-mid hover:text-red-400 active:text-red-400 transition-colors duration-150"
                >
                  <Trash2 size={13} />
                  <span className="hidden sm:inline">Clear All</span>
                </button>
              )}
            </div>
          </div>

          {/* ── Empty State ────────────────────────────────────── */}
          {items.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-24 text-center"
            >
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-5">
                <Heart size={32} className="text-white/25" />
              </div>
              <h2 className="font-display text-xl tracking-[0.08em] text-tb-white uppercase mb-2">
                Nothing saved yet
              </h2>
              <p className="font-condensed text-sm text-sv tracking-[0.06em] max-w-xs mb-7">
                Tap the heart on any product to save it here for later.
              </p>
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-7 py-3 bg-tb-white text-void font-condensed font-bold text-xs tracking-[0.22em] uppercase hover:bg-white transition-colors duration-200"
              >
                Browse Collection
              </Link>
            </motion.div>
          ) : (
            <>
              {/* ── Items Grid ───────────────────────────────── */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
                <AnimatePresence mode="popLayout">
                  {items.map((item, index) => (
                    <motion.div
                      key={item.productId}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.18 } }}
                      transition={{ delay: index * 0.04, duration: 0.22 }}
                      className="bg-[#0f0f0f] border border-white/[0.07] rounded-xl overflow-hidden flex flex-col"
                    >
                      {/* Image area — tappable → product page */}
                      <Link
                        to={`/product/${item.productId}`}
                        className="relative block aspect-[3/4] bg-[#0a0a0a] overflow-hidden group"
                        aria-label={`View ${item.name}`}
                      >
                        <img
                          src={optimizeCloudinaryUrl(item.image, IMG_SIZES.card)}
                          alt={item.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04] text-transparent"
                          loading="lazy"
                          decoding="async"
                          onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = PLACEHOLDER; }}
                        />

                        {/* Remove button — always visible */}
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            removeFromWishlist(item.productId);
                          }}
                          aria-label={`Remove ${item.name} from wishlist`}
                          className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full bg-black/70 backdrop-blur-sm text-white/60 hover:text-white hover:bg-black/90 active:bg-red-900/60 active:text-red-300 transition-all duration-150 z-10"
                        >
                          <X size={12} strokeWidth={2.5} />
                        </button>
                      </Link>

                      {/* Details */}
                      <div className="p-3 flex flex-col flex-1 gap-2">
                        <Link
                          to={`/product/${item.productId}`}
                          className="font-condensed text-[13px] leading-tight text-tb-white line-clamp-2 hover:text-white/80 transition-colors"
                        >
                          {item.name}
                        </Link>

                        <p className="font-condensed font-semibold text-sm text-tb-white">
                          {typeof item.price === 'number'
                            ? formatPrice(item.price)
                            : item.price}
                        </p>

                        {/* Add to Cart */}
                        <button
                          onClick={() => moveToCart(item.productId)}
                          className="mt-auto w-full py-2.5 bg-tb-white text-void font-condensed font-bold text-[11px] tracking-[0.18em] uppercase flex items-center justify-center gap-1.5 hover:bg-white active:bg-white/90 transition-colors duration-150 rounded-sm"
                        >
                          <ShoppingBag size={12} strokeWidth={2.5} />
                          Add to Cart
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* ── Footer strip ─────────────────────────────── */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="mt-8 md:mt-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 border-t border-white/[0.07] pt-6"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-condensed text-[11px] tracking-[0.12em] text-sv-mid uppercase">
                    Total saved value
                  </p>
                  <p className="font-condensed text-xl text-tb-white font-semibold">
                    {formatPrice(totalValue)}
                  </p>
                </div>

                <div className="flex gap-2 sm:shrink-0">
                  <Link
                    to="/"
                    className="flex-1 sm:flex-none py-3 px-5 text-center font-condensed text-xs tracking-[0.18em] uppercase text-sv-mid hover:text-tb-white border border-white/15 hover:border-white/30 transition-all duration-200 rounded-sm"
                  >
                    Keep Shopping
                  </Link>
                  <button
                    onClick={() => navigate('/cart')}
                    className="flex-1 sm:flex-none py-3 px-5 bg-tb-white text-void font-condensed font-bold text-xs tracking-[0.18em] uppercase hover:bg-white active:bg-white/90 transition-colors duration-150 rounded-sm"
                  >
                    View Cart
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </div>
      </main>

    </div>
  );
}
