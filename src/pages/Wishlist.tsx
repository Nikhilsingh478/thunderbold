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
          <div className="mb-6 md:mb-8 border-b border-white/10 pb-4">
            <div className="flex items-center justify-between">
              {/* Left: back + title */}
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={() => navigate(-1)}
                  aria-label="Go back"
                  className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-all duration-150"
                >
                  <ArrowLeft size={18} className="text-white" />
                </button>

                <div className="min-w-0">
                  <div className="flex items-center gap-2.5">
                    <h1 className="font-display font-bold text-2xl md:text-4xl tracking-[0.08em] text-white uppercase leading-none">
                      Wishlist
                    </h1>
                    {items.length > 0 && (
                      <span className="shrink-0 inline-flex items-center justify-center h-6 min-w-6 px-2 rounded-full bg-white/15 font-display font-semibold text-xs text-zinc-200 leading-none">
                        {items.length}
                      </span>
                    )}
                  </div>
                  {items.length > 0 && (
                    <p className="font-display text-xs tracking-wide text-zinc-300 mt-1 hidden md:block">
                      {items.length} {items.length === 1 ? 'item' : 'items'} saved in your wishlist
                    </p>
                  )}
                </div>
              </div>

              {/* Right: clear */}
              {items.length > 0 && (
                <button
                  onClick={handleClearWishlist}
                  className="shrink-0 flex items-center gap-1.5 font-display text-xs font-semibold tracking-wider uppercase text-zinc-300 hover:text-red-400 active:text-red-400 transition-colors duration-150"
                >
                  <Trash2 size={14} />
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
              className="flex flex-col items-center justify-center py-20 bg-[#0f0f0f] border border-white/10 rounded-2xl p-8 max-w-lg mx-auto text-center"
            >
              <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mb-5">
                <Heart size={36} className="text-brass" />
              </div>
              <h2 className="font-display font-bold text-2xl tracking-[0.06em] text-white uppercase mb-3">
                Nothing saved yet
              </h2>
              <p className="font-display text-sm text-zinc-300 tracking-wide max-w-xs mb-8 leading-relaxed">
                Tap the heart on any product to save it here for later.
              </p>
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-brass text-black font-display font-bold text-xs tracking-[0.16em] uppercase hover:bg-yellow-400 transition-colors duration-200 rounded-xl shadow-lg"
              >
                Browse Collection
              </Link>
            </motion.div>
          ) : (
            <>
              {/* ── Items Grid ───────────────────────────────── */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 md:gap-6">
                <AnimatePresence mode="popLayout">
                  {items.map((item, index) => (
                    <motion.div
                      key={item.productId}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.18 } }}
                      transition={{ delay: index * 0.04, duration: 0.22 }}
                      className="bg-[#0f0f0f] border border-white/15 rounded-2xl overflow-hidden flex flex-col shadow-md hover:border-white/25 transition-colors duration-300"
                    >
                      {/* Image area — tappable → product page */}
                      <Link
                        to={`/product/${item.productId}`}
                        className="relative block aspect-[3/4] bg-[#0c0c0c] overflow-hidden group"
                        aria-label={`View ${item.name}`}
                      >
                        <img
                          src={optimizeCloudinaryUrl(item.image, IMG_SIZES.card)}
                          alt={item.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.05] text-transparent"
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
                          className="absolute top-2.5 right-2.5 w-8 h-8 flex items-center justify-center rounded-full bg-black/75 backdrop-blur-md text-zinc-300 hover:text-white hover:bg-black/90 active:bg-red-900/80 active:text-white transition-all duration-150 z-10 border border-white/15"
                        >
                          <X size={14} strokeWidth={2.5} />
                        </button>
                      </Link>

                      {/* Details */}
                      <div className="p-3.5 flex flex-col flex-1 gap-2.5">
                        <Link
                          to={`/product/${item.productId}`}
                          className="font-display font-medium text-sm leading-snug text-white line-clamp-2 hover:text-brass transition-colors"
                        >
                          {item.name}
                        </Link>

                        <p className="font-display font-bold text-base text-brass">
                          {typeof item.price === 'number'
                            ? formatPrice(item.price)
                            : item.price}
                        </p>

                        {/* Add to Cart */}
                        <button
                          onClick={() => moveToCart(item.productId)}
                          className="mt-auto w-full py-2.5 bg-brass text-black font-display font-bold text-xs tracking-[0.14em] uppercase flex items-center justify-center gap-1.5 hover:bg-yellow-400 active:scale-95 transition-all duration-150 rounded-xl shadow-md"
                        >
                          <ShoppingBag size={14} strokeWidth={2.5} />
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
                className="mt-8 md:mt-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 border-t border-white/15 pt-6 bg-[#0f0f0f] p-5 rounded-2xl border"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-display text-xs tracking-wider text-zinc-300 uppercase">
                    Total saved value
                  </p>
                  <p className="font-display text-2xl text-brass font-bold mt-0.5">
                    {formatPrice(totalValue)}
                  </p>
                </div>

                <div className="flex gap-3 sm:shrink-0">
                  <Link
                    to="/"
                    className="flex-1 sm:flex-none py-3 px-5 text-center font-display font-semibold text-xs tracking-[0.14em] uppercase text-zinc-200 hover:text-white border border-white/20 hover:border-white/40 transition-all duration-200 rounded-xl"
                  >
                    Keep Shopping
                  </Link>
                  <button
                    onClick={() => navigate('/cart')}
                    className="flex-1 sm:flex-none py-3 px-6 bg-brass text-black font-display font-bold text-xs tracking-[0.14em] uppercase hover:bg-yellow-400 active:scale-95 transition-all duration-150 rounded-xl shadow-lg"
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
