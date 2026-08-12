import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { optimizeCloudinaryUrl, IMG_SIZES, PLACEHOLDER } from '../lib/cloudinary';
import { motion } from 'framer-motion';
import { X, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import Navbar from '../components/Navbar';
import CustomCursor from '../components/CustomCursor';
import ScrollProgress from '../components/ScrollProgress';
import { useCart } from '../context/CartContext';
import { toast } from 'sonner';

export default function Cart() {
  const navigate = useNavigate();
  const { items, removeFromCart, updateQuantity, clearCartData, getTotalPrice, getTotalItems, loading } = useCart();
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const handleQuantityChange = async (productId: string, size: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    await updateQuantity(productId, size, newQuantity);
  };

  const handleRemoveItem = async (productId: string, size: string) => {
    await removeFromCart(productId, size);
  };

  const handleClearCart = async () => {
    if (window.confirm('Are you sure you want to clear your entire cart?')) {
      await clearCartData();
    }
  };

  const handleCheckout = () => {
    if (items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }
    
    // Navigate to checkout with cart items
    navigate('/checkout', {
      state: {
        cartItems: items,
        totalAmount: getTotalPrice(),
      },
    });
  };

  if (loading) {
    return (
      <div className="noise-overlay min-h-screen flex flex-col bg-void">
        <CustomCursor />
        <ScrollProgress />
        <Navbar />
        
        <main className="flex-1 pt-[calc(110px+var(--tb-banner-h,0px))] pb-24 px-6 md:px-16">
          <div className="max-w-[1240px] mx-auto w-full">
            <div className="animate-pulse">
              <div className="h-8 bg-white/10 rounded w-1/4 mb-8"></div>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-4 p-4 bg-white/5 rounded-xl">
                    <div className="w-20 h-20 bg-white/10 rounded-lg"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-white/10 rounded w-3/4"></div>
                      <div className="h-4 bg-white/10 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
        
      </div>
    );
  }

  return (
    <div className="noise-overlay min-h-screen flex flex-col bg-void overflow-x-hidden">
      <CustomCursor />
      <ScrollProgress />
      <Navbar />

      {/* Mobile sticky checkout strip — sits above the bottom nav */}
      {items.length > 0 && (
        <div
          className="md:hidden fixed bottom-[52px] left-0 right-0 z-[75] flex items-center justify-between gap-4 px-5 py-3.5"
          style={{
            background: 'rgba(7,7,7,0.97)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderTop: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div className="leading-tight">
            <p className="text-sv-mid text-[11px] font-display uppercase tracking-[0.14em]">
              {getTotalItems()} {getTotalItems() !== 1 ? 'items' : 'item'}
            </p>
            <p className="text-brass font-display font-bold text-lg leading-none mt-0.5">
              ₹{typeof getTotalPrice() === 'number' ? getTotalPrice().toLocaleString('en-IN') : getTotalPrice()}
            </p>
          </div>
          <button
            onClick={handleCheckout}
            disabled={isCheckingOut}
            className="flex items-center gap-2 px-6 py-3 bg-tb-white text-void hover:bg-white font-display font-bold text-xs tracking-[0.18em] uppercase disabled:opacity-50 active:scale-95 transition-all rounded-sm shadow-md"
          >
            {isCheckingOut
              ? <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              : <>Checkout <ArrowRight size={14} /></>
            }
          </button>
        </div>
      )}

      <main className="flex-1 pt-[calc(110px+var(--tb-banner-h,0px))] pb-24 md:pb-24 px-5 md:px-16" style={{ paddingBottom: items.length > 0 ? 'calc(124px + env(safe-area-inset-bottom))' : undefined }}>
        <div className="max-w-[1240px] mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8 pb-5 border-b border-white/10">
            <h1 className="font-display font-normal text-3xl md:text-5xl tracking-[0.08em] text-tb-white uppercase flex items-center gap-3">
              Cart
              {items.length > 0 && (
                <span className="font-display text-sm md:text-lg font-medium text-sv-mid tracking-normal normal-case align-middle">
                  ({getTotalItems()})
                </span>
              )}
            </h1>
            {items.length > 0 && (
              <button
                onClick={handleClearCart}
                className="font-display text-xs text-sv-mid hover:text-red-400 font-medium transition-colors duration-200 uppercase tracking-[0.16em]"
              >
                Clear Cart
              </button>
            )}
          </div>

          {items.length === 0 ? (
            // Empty Cart State
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-24 bg-[#0a0a0a] border border-white/[0.08] rounded-md p-8 max-w-lg mx-auto"
            >
              <ShoppingBag className="w-16 h-16 text-sv-mid/40 mx-auto mb-6 stroke-1" />
              <h2 className="font-display text-2xl text-tb-white uppercase tracking-[0.08em] mb-3">Your cart is empty</h2>
              <p className="font-display text-sv-mid text-sm tracking-wide mb-8 max-w-md mx-auto leading-relaxed">
                Looks like you haven't added anything to your cart yet. Discover our latest denim & streetwear curations.
              </p>
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-tb-white text-void font-display font-bold text-xs tracking-[0.2em] uppercase hover:bg-white transition-colors duration-200 rounded-sm"
              >
                Start Shopping
                <ArrowRight size={16} />
              </Link>
            </motion.div>
          ) : (
            // Cart Items
            <div className="grid lg:grid-cols-3 gap-8 md:gap-10">
              {/* Cart Items List */}
              <div className="lg:col-span-2 space-y-4">
                {items.map((item, index) => (
                  <motion.div
                    key={`${item.productId}-${item.size}`}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.06 }}
                    className="p-4 sm:p-5 bg-[#0a0a0a] border border-white/[0.08] rounded-md w-full min-w-0 overflow-hidden"
                  >
                    {/* Top row: image + product details + remove button */}
                    <div className="flex gap-4 mb-4">
                      {/* Product Image */}
                      <div className="w-20 h-20 sm:w-24 sm:h-24 bg-[#070707] border border-white/10 rounded-sm overflow-hidden flex-shrink-0">
                        <img
                          src={optimizeCloudinaryUrl(item.image, IMG_SIZES.thumbnail)}
                          alt={item.name}
                          className="w-full h-full object-cover text-transparent"
                          loading="lazy"
                          decoding="async"
                          onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = PLACEHOLDER; }}
                        />
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <h3 className="font-display font-medium text-tb-white text-sm sm:text-base mb-1.5 leading-snug tracking-wide" style={{ wordBreak: 'break-word' }}>
                            {item.name}
                          </h3>
                          <p className="text-xs text-sv-mid font-display">Size: <span className="text-tb-white font-medium">{item.size}</span></p>
                        </div>
                        <p className="font-display font-semibold text-base text-brass mt-2">
                          {typeof item.price === 'number'
                            ? `₹${item.price.toLocaleString('en-IN')}`
                            : item.price
                          }
                        </p>
                      </div>

                      {/* Remove button — top right */}
                      <button
                        onClick={() => handleRemoveItem(item.productId, item.size)}
                        className="flex-shrink-0 p-1.5 text-sv-mid hover:text-red-400 transition-colors self-start"
                        aria-label="Remove item"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    {/* Bottom row: quantity stepper */}
                    <div className="flex items-center justify-between pt-3.5 border-t border-white/[0.06]">
                      <div className="flex items-center border border-white/15 rounded-sm bg-black/40">
                        <button
                          onClick={() => handleQuantityChange(item.productId, item.size, item.quantity - 1)}
                          className="p-2 hover:bg-white/10 text-sv-mid hover:text-white transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={13} />
                        </button>
                        <span className="w-9 text-center font-display font-medium text-tb-white text-xs select-none">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(item.productId, item.size, item.quantity + 1)}
                          className="p-2 hover:bg-white/10 text-sv-mid hover:text-white transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                      {/* Item subtotal */}
                      <p className="font-display font-medium text-sv-mid text-xs tracking-wide">
                        {item.quantity > 1 && typeof item.price === 'number'
                          ? `${item.quantity} × ₹${item.price.toLocaleString('en-IN')} = ₹${(item.price * item.quantity).toLocaleString('en-IN')}`
                          : ''}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[#0a0a0a] border border-white/[0.08] rounded-md p-6 sticky top-32"
                >
                  <h2 className="font-display font-medium text-xs tracking-[0.2em] text-tb-white uppercase mb-6 border-b border-white/10 pb-4">
                    Order Summary
                  </h2>
                  
                  <div className="space-y-4 mb-6">
                    <div className="flex items-baseline justify-between gap-3 text-xs sm:text-sm">
                      <span className="text-sv-mid font-display whitespace-nowrap">Subtotal ({getTotalItems()} {getTotalItems() !== 1 ? 'items' : 'item'})</span>
                      <span className="text-tb-white font-display font-semibold">
                        {typeof getTotalPrice() === 'number'
                          ? `₹${getTotalPrice().toLocaleString('en-IN')}`
                          : getTotalPrice()
                        }
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between gap-3 text-xs sm:text-sm">
                      <span className="text-sv-mid font-display">Shipping</span>
                      <span className="text-brass font-display font-semibold uppercase tracking-wider text-xs">Complimentary</span>
                    </div>

                    <div className="flex items-start justify-between gap-3 text-xs sm:text-sm">
                      <span className="text-sv-mid font-display whitespace-nowrap">Tax</span>
                      <span className="text-sv-mid font-display text-right text-xs">
                        Calculated at checkout
                      </span>
                    </div>

                    <div className="h-px bg-white/10 my-2" />

                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-tb-white font-display font-medium text-sm uppercase tracking-[0.12em]">Total</span>
                      <span className="text-brass font-display font-bold text-xl">
                        {typeof getTotalPrice() === 'number'
                          ? `₹${getTotalPrice().toLocaleString('en-IN')}`
                          : getTotalPrice()
                        }
                      </span>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleCheckout}
                    disabled={isCheckingOut}
                    className="w-full py-4 bg-tb-white text-void font-display font-bold text-xs tracking-[0.2em] uppercase hover:bg-white transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 rounded-sm"
                  >
                    {isCheckingOut ? (
                      <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                    ) : (
                      <>
                        Proceed to Checkout
                        <ArrowRight size={15} />
                      </>
                    )}
                  </button>
                  
                  <Link
                    to="/"
                    className="block w-full py-3 text-center font-display font-medium text-xs tracking-[0.14em] text-sv-mid hover:text-white uppercase transition-colors duration-200 mt-3"
                  >
                    Continue Shopping
                  </Link>
                </motion.div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
