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
import PriceDisplay from '../components/PriceDisplay';
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
  const [descExpanded, setDescExpanded] = useState(false);

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

      <main className="flex-1 pt-[110px] md:pt-[164px] pb-24 px-6 md:px-16">
        <div className="max-w-[1240px] mx-auto">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="font-condensed font-semibold text-xs tracking-[0.18em] uppercase text-sv-mid hover:text-white transition-colors duration-200 mb-4 md:mb-10 flex items-center gap-2 group"
          >
            <span className="transition-transform duration-300 group-hover:-translate-x-1">←</span> Back to Collection
          </button>

          <div className="flex flex-col md:flex-row gap-4 md:gap-12 lg:gap-24">
            {/* Left: Image Slider */}
            <div className="w-full md:w-1/2 flex flex-col">
              <div 
                className="overflow-hidden bg-[#0c0c0c] border border-white/5 relative aspect-[3/4] w-full max-w-[500px] mx-auto group" 
                ref={emblaRef}
              >
                <div className="flex h-full touch-pan-y">
                  {IMAGES.map((img, index) => (
                    <div className="flex-[0_0_100%] min-w-0 relative h-full" key={index}>
                      <img
                        src={optimizeCloudinaryUrl(img, IMG_SIZES.detail)}
                        alt={`Product slide ${index + 1}`}
                        className="w-full h-full object-cover object-center"
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
              className="w-full md:w-1/2 flex flex-col justify-center py-0 md:py-8"
            >
              <div className="font-condensed font-semibold text-[0.68rem] tracking-[0.40em] uppercase text-brass mb-4">
                Premium Collection
              </div>
              <h1 className="font-display text-2xl sm:text-4xl md:text-6xl lg:text-7xl tracking-[0.08em] sm:tracking-[0.1em] metal-text uppercase mb-3 sm:mb-4 leading-tight sm:leading-none">
                {product?.name || 'Thunderbolt Jeans'}
              </h1>
              <div className="mb-4">
                {product?.price
                  ? <PriceDisplay price={product.price} size="lg" showSavings />
                  : <span className="font-condensed text-3xl tracking-widest text-tb-white">₹ 2,499</span>
                }
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

              {product?.description && (
                <div className="mb-10 max-w-[90%]">
                  <p
                    className={`font-serif font-light text-tb-off text-[0.78rem] leading-relaxed tracking-wide transition-all duration-300 ${
                      !descExpanded ? 'line-clamp-4' : ''
                    }`}
                  >
                    {product.description}
                  </p>
                  {product.description.length > 200 && (
                    <button
                      onClick={() => setDescExpanded(v => !v)}
                      className="mt-2 font-condensed text-[0.7rem] tracking-[0.18em] uppercase text-brass hover:text-brass-bright transition-colors duration-200 flex items-center gap-1.5"
                    >
                      {descExpanded ? (
                        <>
                          Show Less
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="transition-transform duration-200">
                            <path d="M2 8L6 4L10 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </>
                      ) : (
                        <>
                          Read More
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="transition-transform duration-200">
                            <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}

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

              {/* Product Highlights */}
              {(() => {
                const h = product?.highlights;
                const fields = [
                  { label: 'Color', value: h?.color },
                  { label: 'Length', value: h?.length },
                  { label: 'Prints & Pattern', value: h?.printsPattern },
                  { label: 'Waist Rise', value: h?.waistRise },
                  { label: 'Shade', value: h?.shade },
                  { label: '(Length) In Inches', value: h?.lengthInches },
                ];
                const hasAny = h && fields.some(f => f.value?.trim());
                if (!hasAny) return null;
                return (
                  <div className="mb-10 lg:mb-12">
                    <div className="flex items-center gap-2.5 mb-4">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-brass shrink-0"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 0 2-2h2a2 2 0 0 0 2 2"/></svg>
                      <span className="font-condensed text-[0.72rem] tracking-[0.22em] uppercase text-brass">Product Highlights</span>
                    </div>
                    <div className="border border-white/[0.08] rounded-sm overflow-hidden">
                      <div className="grid grid-cols-2">
                        {fields.filter(f => f.value?.trim()).map((f, i, arr) => (
                          <div
                            key={f.label}
                            className={`px-4 py-3.5 flex flex-col gap-1 ${
                              i % 2 === 0 ? 'border-r border-white/[0.06]' : ''
                            } ${
                              i < arr.length - (arr.length % 2 === 0 ? 2 : 1) ? 'border-b border-white/[0.06]' : ''
                            } bg-white/[0.015]`}
                          >
                            <span className="font-condensed text-[0.6rem] tracking-[0.18em] uppercase text-sv-mid">{f.label}</span>
                            <span className="font-condensed text-sm tracking-[0.08em] text-tb-white font-medium">{f.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Action Buttons */}
              <div className="flex flex-col gap-4 mb-8 lg:mb-10">
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

              {/* Trust Badges */}
              <div className="mb-10 lg:mb-12 flex flex-col gap-3 border border-white/[0.07] rounded-sm px-5 py-4 bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-brass/10 border border-brass/25 flex items-center justify-center shrink-0">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-brass"><path d="M17 9V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2m2 4h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2z"/></svg>
                  </div>
                  <span className="font-condensed text-[0.72rem] tracking-[0.16em] uppercase text-tb-off">Cash on Delivery Available</span>
                </div>
                <div className="h-px bg-white/[0.06]" />
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-brass/10 border border-brass/25 flex items-center justify-center shrink-0">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-brass"><path d="M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/></svg>
                  </div>
                  <span className="font-condensed text-[0.72rem] tracking-[0.16em] uppercase text-tb-off">1 Day Assured Refund</span>
                </div>
                <div className="h-px bg-white/[0.06]" />
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-brass/10 border border-brass/25 flex items-center justify-center shrink-0">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-brass"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 0 0 4.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 0 1-15.357-2m15.357 2H15"/></svg>
                  </div>
                  <span className="font-condensed text-[0.72rem] tracking-[0.16em] uppercase text-tb-off">Easy Exchange and Returns</span>
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
