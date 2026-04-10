import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { optimizeCloudinaryUrl, IMG_SIZES } from '../lib/cloudinary';
import { motion } from 'framer-motion';
import useEmblaCarousel from 'embla-carousel-react';
import { Heart, ShoppingCart } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CustomCursor from '../components/CustomCursor';
import ScrollProgress from '../components/ScrollProgress';
import { fetchProductById } from '../lib/products';
import { requireAuth } from '../lib/requireAuth';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

const SIZES = ['28', '30', '32', '34', '36'];

export default function ProductView() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart, isInCart, getItemQuantity } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isTogglingWishlist, setIsTogglingWishlist] = useState(false);
  const [isOrdering, setIsOrdering] = useState(false);
  
  const IMAGES: string[] = product?.images?.length
    ? product.images
    : product?.image
      ? [product.image]
      : [];
  
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'center' });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi, setSelectedIndex]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
  }, [emblaApi, onSelect]);

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        if (productId) {
          const productData = await fetchProductById(productId);
          setProduct(productData);
        }
      } catch (error) {
        console.error('Failed to load product:', error);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
    window.scrollTo(0, 0);
  }, [productId]);

  const handleOrder = requireAuth(() => {
    if (!selectedSize || !product || isOrdering) return;
    setIsOrdering(true);
    navigate('/checkout', {
      state: {
        productName: product.name,
        productImage: product.images?.[0] || product.image || '/placeholder.png',
        price: product.price,
        size: selectedSize,
        quantity,
        productUrl: window.location.href,
      },
    });
    setTimeout(() => setIsOrdering(false), 1500);
  }, user);

  const handleAddToCart = async () => {
    if (!selectedSize || !product || isAddingToCart) return;
    setIsAddingToCart(true);
    try {
      await addToCart({
        productId: product._id,
        name: product.name,
        price: typeof product.price === 'string' ? parseFloat(product.price.replace(/[^0-9.]/g, '')) : product.price,
        image: product.images?.[0] || product.image || '/placeholder.png',
        size: selectedSize,
      }, quantity);
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleAddToWishlist = async () => {
    if (!product || isTogglingWishlist) return;
    setIsTogglingWishlist(true);
    try {
      await toggleWishlist({
        productId: product._id,
        name: product.name,
        price: typeof product.price === 'string' ? parseFloat(product.price.replace(/[^0-9.]/g, '')) : product.price,
        image: product.images?.[0] || product.image || '/placeholder.png',
      });
    } catch (error) {
      console.error('Error toggling wishlist:', error);
    } finally {
      setIsTogglingWishlist(false);
    }
  };

  const isInCartWithSize = selectedSize && product ? isInCart(product._id, selectedSize) : false;
  const itemQuantity = selectedSize && product ? getItemQuantity(product._id, selectedSize) : 0;

  const stock = typeof product?.stock === 'number' ? product.stock : null;
  const isOutOfStock = stock !== null && stock <= 0;
  const isLowStock = stock !== null && stock > 0 && stock <= 5;

  // Per-size availability using sizeStock (when present)
  const isSizeOos = (size: string): boolean => {
    if (!product?.sizeStock) return false;
    return (product.sizeStock[size] ?? 0) <= 0;
  };
  const selectedSizeOos = selectedSize ? isSizeOos(selectedSize) : false;
  // Effective OOS: total stock gone OR selected size is gone
  const effectiveOutOfStock = isOutOfStock || selectedSizeOos;

  return (
    <div className="noise-overlay min-h-screen flex flex-col bg-void">
      <CustomCursor />
      <ScrollProgress />
      <Navbar />

      <main className="flex-1 pt-32 pb-24 px-6 md:px-16">
        <div className="max-w-[1240px] mx-auto">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="font-condensed font-semibold text-xs tracking-[0.18em] uppercase text-sv-mid hover:text-white transition-colors duration-200 mb-10 flex items-center gap-2 group"
          >
            <span className="transition-transform duration-300 group-hover:-translate-x-1">←</span> Back to Collection
          </button>

          <div className="flex flex-col md:flex-row gap-12 lg:gap-24">
            {/* Left: Image Slider */}
            <div className="w-full md:w-1/2 flex flex-col">
              <div 
                className="overflow-hidden bg-[#0c0c0c] border border-white/5 relative aspect-[4/5] md:aspect-auto md:h-[55vh] lg:h-[60vh] w-full max-w-[500px] mx-auto group" 
                ref={emblaRef}
              >
                <div className="flex h-full touch-pan-y">
                  {IMAGES.map((img, index) => (
                    <div className="flex-[0_0_100%] min-w-0 relative h-full" key={index}>
                      <img
                        src={optimizeCloudinaryUrl(img, IMG_SIZES.detail)}
                        alt={`Product slide ${index + 1}`}
                        className="w-full h-full object-cover object-center scale-[1.01] transition-transform duration-[1.5s] ease-out group-hover:scale-[1.04]"
                        loading={index === 0 ? "eager" : "lazy"}
                        decoding="async"
                        onError={(e) => { e.currentTarget.src = '/placeholder.png'; }}
                      />
                    </div>
                  ))}
                </div>
                
                {/* Navigation Buttons - visible on hover */}
                <button
                  onClick={scrollPrev}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-black/20 hover:bg-black/60 rounded-full text-white backdrop-blur-xl transition-all duration-300 border border-white/10 z-[20] opacity-0 group-hover:opacity-100 hidden md:flex"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M15 18l-6-6 6-6"/></svg>
                </button>
                <button
                  onClick={scrollNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-black/20 hover:bg-black/60 rounded-full text-white backdrop-blur-xl transition-all duration-300 border border-white/10 z-[20] opacity-0 group-hover:opacity-100 hidden md:flex"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 18l6-6-6-6"/></svg>
                </button>

                {/* Mobile indicators */}
                <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2 z-10 md:hidden">
                  {IMAGES.map((_, i) => (
                    <div
                      key={i}
                      className={`h-1 transition-all duration-300 rounded-full ${i === selectedIndex ? 'w-6 bg-brass-bright' : 'w-2 bg-white/40'}`}
                    />
                  ))}
                </div>
              </div>
              
              {/* Desktop Thumbnails */}
              <div className="hidden md:flex gap-4 mt-6">
                {IMAGES.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => emblaApi?.scrollTo(index)}
                    className={`relative w-24 aspect-[4/5] overflow-hidden border transition-all duration-300 ${
                      index === selectedIndex 
                        ? 'border-brass scale-105 shadow-[0_0_15px_rgba(212,170,48,0.2)]' 
                        : 'border-white/10 opacity-50 hover:opacity-100 hover:border-white/30'
                    }`}
                  >
                    <img src={optimizeCloudinaryUrl(img, IMG_SIZES.thumbnail)} alt={`Thumbnail ${index}`} className="w-full h-full object-cover object-center" loading="lazy" decoding="async" onError={(e) => { e.currentTarget.src = '/placeholder.png'; }} />
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Product Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="w-full md:w-1/2 flex flex-col justify-center py-4 md:py-8"
            >
              <div className="font-condensed font-semibold text-[0.68rem] tracking-[0.40em] uppercase text-brass mb-4">
                Premium Collection
              </div>
              <h1 className="font-display text-5xl md:text-6xl lg:text-7xl tracking-[0.1em] metal-text uppercase mb-4 leading-none">
                {product?.name || 'Thunderbolt Jeans'}
              </h1>
              <div className="font-condensed text-3xl tracking-widest text-tb-white mb-4">
                {product?.price || '₹ 2,499'}
              </div>

              {/* Stock status badge */}
              {product && (
                <div className="mb-8">
                  {isOutOfStock && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 font-condensed text-xs uppercase tracking-widest">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />
                      Out of Stock
                    </span>
                  )}
                  {isLowStock && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 font-condensed text-xs uppercase tracking-widest">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse inline-block" />
                      Only {stock} left
                    </span>
                  )}
                </div>
              )}

              <p className="font-serif italic font-light text-white/90 text-xl mb-10 leading-snug max-w-[90%]">
                {product?.description}
              </p>

              {/* Size Selector */}
              <div className="mb-10">
                <div className="font-condensed text-xs tracking-[0.2em] uppercase text-tb-white mb-5 flex items-center justify-between">
                  <span>Select Size</span>
                  <button className="text-sv-mid hover:text-brass transition-colors underline underline-offset-4 decoration-white/20">Size Guide</button>
                </div>
                <div className="grid grid-cols-5 gap-2 sm:gap-4 md:flex md:flex-wrap">
                  {SIZES.map(size => {
                    const oos = isSizeOos(size);
                    return (
                      <button
                        key={size}
                        onClick={() => !oos && setSelectedSize(size)}
                        disabled={oos}
                        title={oos ? `Size ${size} — out of stock` : `Size ${size}`}
                        className={`h-12 w-full md:w-14 md:h-14 flex flex-col items-center justify-center font-condensed text-sm tracking-wider uppercase border transition-all duration-300 relative ${
                          oos
                            ? 'border-white/15 text-white/20 cursor-not-allowed bg-white/[0.02]'
                            : selectedSize === size
                              ? 'border-brass bg-brass/10 text-brass scale-[1.05] shadow-[0_0_15px_rgba(212,170,48,0.15)]'
                              : 'border-white text-tb-white hover:bg-white/5 hover:scale-[1.02]'
                        }`}
                      >
                        <span className={oos ? 'line-through decoration-white/30' : ''}>{size}</span>
                        {oos && <span className="text-[9px] tracking-wider text-white/25 leading-none mt-0.5">OOS</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quantity Selector */}
              <div className="mb-10 lg:mb-12">
                <div className="font-condensed text-xs tracking-[0.2em] uppercase text-tb-white mb-5">
                  Quantity
                </div>
                <div className="flex items-center w-[140px] h-12 border border-white/10 text-tb-white font-condensed text-lg">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="flex-1 h-full flex items-center justify-center hover:bg-white/5 transition-colors border-r border-white/10"
                  >
                    -
                  </button>
                  <div className="flex-[1.5] h-full flex items-center justify-center">
                    {quantity}
                  </div>
                  <button 
                    onClick={() => setQuantity(quantity + 1)}
                    className="flex-1 h-full flex items-center justify-center hover:bg-white/5 transition-colors border-l border-white/10"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-4 mb-10 lg:mb-12">
                {/* Cart and Wishlist Buttons */}
                <div className="flex gap-4">
                  <button
                    onClick={handleAddToCart}
                    disabled={!selectedSize || effectiveOutOfStock || isAddingToCart}
                    className={`flex-1 py-4 font-condensed font-bold text-base tracking-[0.2em] uppercase transition-all duration-300 flex items-center justify-center gap-2 ${
                      selectedSize && !effectiveOutOfStock && !isAddingToCart
                        ? 'bg-tb-white text-void hover:bg-white hover:scale-[1.01] shadow-[0_0_20px_rgba(255,255,255,0.1)]'
                        : 'bg-white/5 text-white/20 cursor-not-allowed'
                    }`}
                  >
                    <ShoppingCart size={20} />
                    {isAddingToCart ? 'Adding...' : effectiveOutOfStock ? 'Out of Stock' : isInCartWithSize ? `In Cart (${itemQuantity})` : 'Add to Cart'}
                  </button>

                  <button
                    onClick={handleAddToWishlist}
                    disabled={!product || isTogglingWishlist}
                    className={`p-4 font-condensed font-bold text-base tracking-[0.2em] uppercase transition-all duration-300 flex items-center justify-center ${
                      isTogglingWishlist
                        ? 'bg-white/5 text-white/30 cursor-not-allowed'
                        : product && isInWishlist(product._id)
                          ? 'bg-brass text-void hover:bg-yellow-400'
                          : 'bg-white/5 text-white hover:bg-white/10'
                    }`}
                  >
                    <Heart size={20} className={!isTogglingWishlist && product && isInWishlist(product._id) ? 'fill-current' : ''} />
                  </button>
                </div>

                {/* Order CTA */}
                <button
                  onClick={handleOrder}
                  disabled={!selectedSize || effectiveOutOfStock || isOrdering}
                  className={`w-full py-5 font-condensed font-bold text-base tracking-[0.2em] uppercase transition-all duration-300 clip-bolt ${
                    selectedSize && !effectiveOutOfStock && !isOrdering
                      ? 'bg-tb-white text-void hover:bg-white hover:scale-[1.01] shadow-[0_0_20px_rgba(255,255,255,0.1)]'
                      : 'bg-white/5 text-white/20 cursor-not-allowed'
                  }`}
                >
                  {isOrdering ? 'Processing...' : effectiveOutOfStock ? 'Out of Stock' : selectedSize ? 'Order Now' : 'Select a Size'}
                </button>
              </div>
              
              {/* Extra product details */}
              <div className="mt-16 flex flex-col gap-5 border-t border-white/10 pt-10">
                 <div className="flex justify-between items-center text-sm font-condensed text-sv-mid tracking-widest uppercase">
                   <span>Fit</span>
                   <span className="text-tb-white">Standard / Comfortable</span>
                 </div>
                 <div className="flex justify-between items-center text-sm font-condensed text-sv-mid tracking-widest uppercase">
                   <span>Material</span>
                   <span className="text-tb-white">98% Cotton, 2% Elastane</span>
                 </div>
                 <div className="flex justify-between items-center text-sm font-condensed text-sv-mid tracking-widest uppercase">
                   <span>Shipping</span>
                   <span className="text-tb-white">Free All Over India / Cash on Delivery</span>
                 </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
