import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { optimizeCloudinaryUrl, IMG_SIZES } from '../lib/cloudinary';
import { motion } from 'framer-motion';
import { X, Heart, ShoppingBag, ArrowRight } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CustomCursor from '../components/CustomCursor';
import ScrollProgress from '../components/ScrollProgress';
import { useWishlist } from '../context/WishlistContext';
import { toast } from 'sonner';

export default function Wishlist() {
  const navigate = useNavigate();
  const { items, removeFromWishlist, clearWishlistData, loading } = useWishlist();

  const handleRemoveItem = async (productId: string) => {
    await removeFromWishlist(productId);
  };

  const handleClearWishlist = async () => {
    if (window.confirm('Are you sure you want to clear your entire wishlist?')) {
      await clearWishlistData();
    }
  };

  const handleMoveToCart = (productId: string) => {
    // This will be handled by the event system in WishlistContext
    const event = new CustomEvent('add-to-cart-from-wishlist', {
      detail: {
        productId: productId,
        // Other details will be handled by the context
      }
    });
    window.dispatchEvent(event);
  };

  if (loading) {
    return (
      <div className="noise-overlay min-h-screen flex flex-col bg-void">
        <CustomCursor />
        <ScrollProgress />
        <Navbar />
        
        <main className="flex-1 pt-[164px] pb-24 px-6 md:px-16">
          <div className="max-w-[1240px] mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-white/10 rounded w-1/4 mb-8"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-white/5 rounded-xl p-4">
                    <div className="w-full h-48 bg-white/10 rounded-lg mb-4"></div>
                    <div className="h-4 bg-white/10 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-white/10 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
        
        <Footer />
      </div>
    );
  }

  return (
    <div className="noise-overlay min-h-screen flex flex-col bg-void">
      <CustomCursor />
      <ScrollProgress />
      <Navbar />

      <main className="flex-1 pt-[164px] pb-24 px-6 md:px-16">
        <div className="max-w-[1240px] mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="font-condensed font-semibold text-xs tracking-[0.18em] uppercase text-sv-mid hover:text-white transition-colors duration-200 flex items-center gap-2 group"
              >
                <span className="transition-transform duration-300 group-hover:-translate-x-1">Continue Shopping</span>
              </button>
              <div className="h-4 w-px bg-white/20"></div>
              <h1 className="font-display text-4xl md:text-5xl tracking-[0.1em] text-tb-white uppercase">
                My Wishlist
              </h1>
            </div>
            
            {items.length > 0 && (
              <button
                onClick={handleClearWishlist}
                className="font-condensed text-sm text-sv-mid hover:text-red-400 transition-colors duration-200"
              >
                Clear Wishlist
              </button>
            )}
          </div>

          {items.length === 0 ? (
            // Empty Wishlist State
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20"
            >
              <Heart className="w-24 h-24 text-white/20 mx-auto mb-6" />
              <h2 className="font-display text-2xl text-tb-white mb-4">Your wishlist is empty</h2>
              <p className="font-condensed text-sv text-sm tracking-[0.10em] mb-8 max-w-md mx-auto">
                Start adding items you love to your wishlist. They'll be waiting for you here!
              </p>
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-6 py-3 bg-tb-white text-void font-condensed font-bold text-sm tracking-[0.2em] uppercase hover:bg-white transition-colors duration-200"
              >
                Start Shopping
                <ArrowRight size={16} />
              </Link>
            </motion.div>
          ) : (
            // Wishlist Items Grid
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((item, index) => (
                <motion.div
                  key={item.productId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/5 border border-white/10 rounded-xl overflow-hidden group"
                >
                  {/* Product Image */}
                  <div className="relative aspect-[4/5] bg-[#0c0c0c] overflow-hidden">
                    <img
                      src={optimizeCloudinaryUrl(item.image, IMG_SIZES.card)}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                      decoding="async"
                      onError={(e) => { e.currentTarget.src = '/placeholder.png'; }}
                    />
                    
                    {/* Remove Button */}
                    <button
                      onClick={() => handleRemoveItem(item.productId)}
                      className="absolute top-4 right-4 p-2 bg-black/80 backdrop-blur-sm rounded-full text-white/60 hover:text-red-400 hover:bg-red-900/20 transition-all duration-200"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* Product Details */}
                  <div className="p-6">
                    <h3 className="font-condensed font-semibold text-tb-white mb-2 line-clamp-2">
                      {item.name}
                    </h3>
                    
                    <div className="flex items-center justify-between mb-4">
                      <p className="font-condensed text-lg text-tb-white">
                        {typeof item.price === 'number' 
                          ? `¥${item.price.toFixed(2)}`
                          : item.price
                        }
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleMoveToCart(item.productId)}
                        className="flex-1 py-3 bg-tb-white text-void font-condensed font-bold text-sm tracking-[0.2em] uppercase hover:bg-white transition-all duration-200 flex items-center justify-center gap-2"
                      >
                        <ShoppingBag size={16} />
                        Add to Cart
                      </button>
                      
                      <Link
                        to={`/product/${item.productId}`}
                        className="py-3 px-4 bg-white/10 text-tb-white font-condensed font-bold text-sm tracking-[0.2em] uppercase hover:bg-white/20 transition-all duration-200"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Wishlist Summary */}
          {items.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-12 p-6 bg-black/50 border border-white/10 rounded-xl"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display text-xl tracking-[0.1em] text-tb-white uppercase mb-2">
                    Wishlist Summary
                  </h3>
                  <p className="font-condensed text-sm text-sv-mid">
                    {items.length} {items.length === 1 ? 'item' : 'items'} saved
                  </p>
                </div>
                
                <div className="text-right">
                  <p className="font-condensed text-sm text-sv-mid mb-1">Total Value</p>
                  <p className="font-condensed text-2xl text-tb-white">
                    {typeof items.reduce((total, item) => total + (typeof item.price === 'number' ? item.price : 0), 0) === 'number'
                      ? `¥${items.reduce((total, item) => total + (typeof item.price === 'number' ? item.price : 0), 0).toFixed(2)}`
                      : 'Calculate at checkout'
                    }
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4 mt-6">
                <Link
                  to="/"
                  className="flex-1 py-3 text-center font-condensed text-sm text-sv-mid hover:text-tb-white transition-colors duration-200 border border-white/20 rounded-lg"
                >
                  Continue Shopping
                </Link>
                
                <button
                  onClick={() => navigate('/cart')}
                  className="flex-1 py-3 bg-tb-white text-void font-condensed font-bold text-sm tracking-[0.2em] uppercase hover:bg-white transition-all duration-200 rounded-lg"
                >
                  View Cart ({items.length})
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
