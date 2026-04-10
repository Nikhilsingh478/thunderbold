import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { optimizeCloudinaryUrl, IMG_SIZES } from '../lib/cloudinary';
import { motion } from 'framer-motion';
import { X, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
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
        
        <main className="flex-1 pt-32 pb-24 px-6 md:px-16">
          <div className="max-w-[1240px] mx-auto">
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
        
        <Footer />
      </div>
    );
  }

  return (
    <div className="noise-overlay min-h-screen flex flex-col bg-void">
      <CustomCursor />
      <ScrollProgress />
      <Navbar />

      <main className="flex-1 pt-32 pb-24 px-6 md:px-16">
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
                Shopping Cart
              </h1>
            </div>
            
            {items.length > 0 && (
              <button
                onClick={handleClearCart}
                className="font-condensed text-sm text-sv-mid hover:text-red-400 transition-colors duration-200"
              >
                Clear Cart
              </button>
            )}
          </div>

          {items.length === 0 ? (
            // Empty Cart State
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20"
            >
              <ShoppingBag className="w-24 h-24 text-white/20 mx-auto mb-6" />
              <h2 className="font-display text-2xl text-tb-white mb-4">Your cart is empty</h2>
              <p className="font-serif text-white/60 mb-8 max-w-md mx-auto">
                Looks like you haven't added anything to your cart yet. Start shopping to fill it up!
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
            // Cart Items
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Cart Items List */}
              <div className="lg:col-span-2 space-y-4">
                {items.map((item, index) => (
                  <motion.div
                    key={`${item.productId}-${item.size}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex gap-4 p-4 bg-white/5 border border-white/10 rounded-xl"
                  >
                    {/* Product Image */}
                    <div className="w-20 h-20 bg-[#0c0c0c] rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={optimizeCloudinaryUrl(item.image, IMG_SIZES.thumbnail)}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        decoding="async"
                        onError={(e) => { e.currentTarget.src = '/placeholder.png'; }}
                      />
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-condensed font-semibold text-tb-white mb-1 truncate">
                        {item.name}
                      </h3>
                      <p className="text-sm text-sv-mid mb-2">Size: {item.size}</p>
                      <p className="font-condensed text-lg text-tb-white">
                        {typeof item.price === 'number' 
                          ? `¥${item.price.toFixed(2)}`
                          : item.price
                        }
                      </p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex items-center border border-white/20 rounded-lg">
                        <button
                          onClick={() => handleQuantityChange(item.productId, item.size, item.quantity - 1)}
                          className="p-2 hover:bg-white/10 transition-colors"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="w-12 text-center font-condensed text-tb-white">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(item.productId, item.size, item.quantity + 1)}
                          className="p-2 hover:bg-white/10 transition-colors"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                      
                      <button
                        onClick={() => handleRemoveItem(item.productId, item.size)}
                        className="p-2 text-sv-mid hover:text-red-400 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-black/50 border border-white/10 rounded-xl p-6 sticky top-32"
                >
                  <h2 className="font-display text-xl tracking-[0.1em] text-tb-white uppercase mb-6">
                    Order Summary
                  </h2>
                  
                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-sv-mid">Subtotal ({getTotalItems()} items)</span>
                      <span className="text-tb-white font-condensed">
                        {typeof getTotalPrice() === 'number' 
                          ? `¥${getTotalPrice().toFixed(2)}`
                          : getTotalPrice()
                        }
                      </span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-sv-mid">Shipping</span>
                      <span className="text-tb-white font-condensed">Free</span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-sv-mid">Tax</span>
                      <span className="text-tb-white font-condensed">Calculated at checkout</span>
                    </div>
                    
                    <div className="h-px bg-white/20 my-4"></div>
                    
                    <div className="flex justify-between text-lg font-bold">
                      <span className="text-tb-white">Total</span>
                      <span className="text-tb-white font-condensed">
                        {typeof getTotalPrice() === 'number' 
                          ? `¥${getTotalPrice().toFixed(2)}`
                          : getTotalPrice()
                        }
                      </span>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleCheckout}
                    disabled={isCheckingOut}
                    className="w-full py-4 bg-tb-white text-void font-condensed font-bold text-sm tracking-[0.2em] uppercase hover:bg-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isCheckingOut ? (
                      <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                    ) : (
                      <>
                        Proceed to Checkout
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                  
                  <Link
                    to="/"
                    className="block w-full py-3 text-center font-condensed text-sm text-sv-mid hover:text-tb-white transition-colors duration-200 mt-4"
                  >
                    Continue Shopping
                  </Link>
                </motion.div>
              </div>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
