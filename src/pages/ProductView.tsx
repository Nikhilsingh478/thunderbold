import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useCallback, useRef } from 'react';
import { optimizeCloudinaryUrl, IMG_SIZES } from '../lib/cloudinary';
import { motion, AnimatePresence } from 'framer-motion';
import useEmblaCarousel from 'embla-carousel-react';
import { Heart, Share2, ShoppingCart, X } from 'lucide-react';
import { toast } from 'sonner';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CustomCursor from '../components/CustomCursor';
import ScrollProgress from '../components/ScrollProgress';
import PriceDisplay from '../components/PriceDisplay';
import ProductReviewsSection from '../components/reviews/ProductReviewsSection';
import { fetchProductById } from '../lib/products';
import { requireAuth } from '../lib/requireAuth';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

const JEANS_SIZES = ['28', '30', '32', '34', '36'];
const APPAREL_SIZES = ['S', 'M', 'L', 'XL', 'XXL'];
// Canonical order: jeans first, then apparel — used to sort sizeStock keys
const SIZE_ORDER = [...JEANS_SIZES, ...APPAREL_SIZES];

/** Derives the ordered size list from the product's actual sizeStock keys */
function getSizesFromProduct(sizeStock?: Record<string, number>): string[] {
  if (!sizeStock) return JEANS_SIZES;
  const keys = Object.keys(sizeStock);
  const ordered = SIZE_ORDER.filter(s => keys.includes(s));
  return ordered.length > 0 ? ordered : JEANS_SIZES;
}

export default function ProductView() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart, isInCart, getItemQuantity } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedTopwearSize, setSelectedTopwearSize] = useState<string | null>(null);
  const [selectedBottomwearSize, setSelectedBottomwearSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isTogglingWishlist, setIsTogglingWishlist] = useState(false);
  const [isOrdering, setIsOrdering] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareMessage, setShareMessage] = useState('');

  // Interactive zoom, size error validation, size guide and sticky mobile buy bar states
  const [lightboxZoom, setLightboxZoom] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const [showStickyBar, setShowStickyBar] = useState(false);
  const actionsRef = useRef<HTMLDivElement>(null);
  const sizeSelectorRef = useRef<HTMLDivElement>(null);
  const [sizeError, setSizeError] = useState(false);
  const [showSizeGuide, setShowSizeGuide] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (!actionsRef.current) return;
      const rect = actionsRef.current.getBoundingClientRect();
      // Show sticky bar only on mobile screens when the main buy/cart buttons are scrolled out of view
      setShowStickyBar(window.innerWidth < 768 && rect.bottom < 0);
    };
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  const validateSizeSelection = (): boolean => {
    const isOutfitProduct = !!(product?.topwear && product?.bottomwear);
    if (isOutfitProduct) {
      if (!selectedTopwearSize || !selectedBottomwearSize) {
        setSizeError(true);
        toast.error('Please select both Topwear and Bottomwear sizes.');
        sizeSelectorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return false;
      }
    } else {
      if (!selectedSize) {
        setSizeError(true);
        toast.error('Please select a size first.');
        sizeSelectorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return false;
      }
    }
    setSizeError(false);
    return true;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLImageElement>) => {
    if (window.innerWidth < 768) return; // ignore on mobile
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    const img = e.currentTarget;
    img.style.transformOrigin = `${x}% ${y}%`;
    img.style.transform = 'scale(2.2)';
    img.style.transition = 'transform 0.1s ease-out, transform-origin 0.05s ease-out';
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLImageElement>) => {
    if (window.innerWidth < 768) return;
    const img = e.currentTarget;
    img.style.transform = 'scale(2.2)';
    img.style.transition = 'transform 0.1s ease-out, transform-origin 0.05s ease-out';
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLImageElement>) => {
    if (window.innerWidth < 768) return;
    const img = e.currentTarget;
    img.style.transformOrigin = 'center center';
    img.style.transform = 'scale(1)';
    img.style.transition = 'transform 0.25s ease-out';
  };

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
    if (!product || isOrdering) return;
    if (!validateSizeSelection()) return;
    setIsOrdering(true);
    const isOutfitProduct = !!(product.topwear && product.bottomwear);
    const effectiveSize = isOutfitProduct
      ? `${selectedTopwearSize} / ${selectedBottomwearSize}`
      : selectedSize;
    navigate('/checkout', {
      state: {
        productName: product.name,
        productImage: product.images?.[0] || product.image || '/placeholder.png',
        price: product.price,
        size: effectiveSize,
        ...(isOutfitProduct ? { topwearSize: selectedTopwearSize, bottomwearSize: selectedBottomwearSize } : {}),
        quantity,
        productUrl: window.location.href,
      },
    });
    setTimeout(() => setIsOrdering(false), 1500);
  }, user);

  const handleAddToCart = async () => {
    if (!product || isAddingToCart) return;
    if (!validateSizeSelection()) return;
    setIsAddingToCart(true);
    const isOutfitProduct = !!(product.topwear && product.bottomwear);
    try {
      const effectiveSize = isOutfitProduct
        ? `${selectedTopwearSize} / ${selectedBottomwearSize}`
        : selectedSize!;
      await addToCart({
        productId: product._id,
        name: product.name,
        price: typeof product.price === 'string' ? parseFloat(product.price.replace(/[^0-9.]/g, '')) : product.price,
        image: product.images?.[0] || product.image || '/placeholder.png',
        size: effectiveSize,
        ...(isOutfitProduct ? { topwearSize: selectedTopwearSize!, bottomwearSize: selectedBottomwearSize! } : {}),
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

  const handleShareProduct = async () => {
    if (!product || isSharing) return;
    const shareUrl = window.location.href;
    const title = product.name || 'Thunderbold product';
    const text = `Check out ${title}`;
    setIsSharing(true);
    setShareMessage('');
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url: shareUrl });
        setShareMessage('Shared');
        return;
      }
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        setShareMessage('Link copied');
        return;
      }
      const input = document.createElement('input');
      input.value = shareUrl;
      input.setAttribute('readonly', 'true');
      input.style.position = 'absolute';
      input.style.left = '-9999px';
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setShareMessage('Link copied');
    } catch {
      setShareMessage('Share unavailable');
    } finally {
      setTimeout(() => setShareMessage(''), 2200);
      setIsSharing(false);
    }
  };

  const isOutfit = !!(product?.topwear && product?.bottomwear);

  const effectiveCartSize = isOutfit && selectedTopwearSize && selectedBottomwearSize
    ? `${selectedTopwearSize} / ${selectedBottomwearSize}`
    : selectedSize;
  const isInCartWithSize = effectiveCartSize && product ? isInCart(product._id, effectiveCartSize) : false;
  const itemQuantity = effectiveCartSize && product ? getItemQuantity(product._id, effectiveCartSize) : 0;

  const stock = typeof product?.stock === 'number' ? product.stock : null;
  const isOutOfStock = stock !== null && stock <= 0;
  const isLowStock = stock !== null && stock > 0 && stock <= 5;

  // Per-size availability using sizeStock (when present)
  const isSizeOos = (size: string): boolean => {
    if (!product?.sizeStock) return false;
    return (product.sizeStock[size] ?? 0) <= 0;
  };
  const isTopwearOos = (size: string): boolean => (product?.topwear?.sizeStock?.[size] ?? 0) <= 0;
  const isBottomwearOos = (size: string): boolean => (product?.bottomwear?.sizeStock?.[size] ?? 0) <= 0;
  const selectedSizeOos = !isOutfit && selectedSize ? isSizeOos(selectedSize) : false;
  // Effective OOS: total stock gone OR selected size is gone
  const effectiveOutOfStock = isOutOfStock || selectedSizeOos;

  if (loading) {
    return <ProductViewSkeleton onBack={() => navigate(-1)} />;
  }

  return (
    <div className="noise-overlay min-h-screen flex flex-col bg-void">
      <CustomCursor />
      <ScrollProgress />
      <Navbar />

      <main className="flex-1 pt-[calc(110px+var(--tb-banner-h))] md:pt-[calc(164px+var(--tb-banner-h))] pb-12 md:pb-24 px-6 md:px-16">
        <div className="max-w-[1240px] mx-auto">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="font-condensed font-semibold text-xs tracking-[0.18em] uppercase text-sv-mid hover:text-white transition-colors duration-200 mb-7 md:mb-10 flex items-center gap-2 group"
          >
            <span className="transition-transform duration-300 group-hover:-translate-x-1">←</span> Back to Collection
          </button>

          <div className="flex flex-col md:flex-row gap-7 md:gap-12 lg:gap-24">
            {/* Left: Premium Product Media Gallery */}
            <div className="w-full md:w-1/2 flex flex-col-reverse md:flex-row gap-5 items-start">
              {/* Desktop Vertical Thumbnails (Amazon/Flipkart-style) */}
              <div className="hidden md:flex flex-col gap-3 shrink-0 max-h-[520px] overflow-y-auto pr-1.5 select-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {IMAGES.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => emblaApi?.scrollTo(index)}
                    onMouseEnter={() => emblaApi?.scrollTo(index)} // hover-to-change for premium experience
                    className={`relative w-20 aspect-[3/4] overflow-hidden border transition-all duration-300 rounded ${
                      index === selectedIndex 
                        ? 'border-brass scale-105 shadow-[0_0_15px_rgba(212,170,48,0.25)]' 
                        : 'border-white/15 opacity-60 hover:opacity-100 hover:border-white/30 bg-white/[0.02]'
                    }`}
                  >
                    <img 
                      src={optimizeCloudinaryUrl(img, IMG_SIZES.thumbnail)} 
                      alt={`Thumbnail ${index + 1}`} 
                      className="w-full h-full object-cover object-center" 
                      loading="lazy" 
                      decoding="async" 
                      onError={(e) => { e.currentTarget.src = '/placeholder.png'; }} 
                    />
                  </button>
                ))}
              </div>

              {/* Main Swipable Viewport with Inline Zoom & Lightbox Click */}
              <div 
                className="overflow-hidden bg-[#0c0c0c] border border-white/5 relative aspect-[3/4] w-full max-w-[500px] mx-auto group rounded-sm flex-1" 
                ref={emblaRef}
              >
                <div className="flex h-full touch-pan-y">
                  {IMAGES.map((img, index) => (
                    <div className="flex-[0_0_100%] min-w-0 relative h-full" key={index}>
                      <img
                        src={optimizeCloudinaryUrl(img, IMG_SIZES.detail)}
                        alt={`Product slide ${index + 1}`}
                        className="w-full h-full object-cover object-center cursor-zoom-in transition-transform duration-100 ease-out origin-center"
                        onMouseMove={handleMouseMove}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                        onClick={() => {
                          setLightboxIndex(index);
                          setLightboxZoom(false);
                          setShowLightbox(true);
                        }}
                        loading={index === 0 ? "eager" : "lazy"}
                        decoding="async"
                        onError={(e) => { e.currentTarget.src = '/placeholder.png'; }}
                      />
                    </div>
                  ))}
                </div>
                
                {/* Navigation Buttons - visible on hover */}
                <button
                  onClick={(e) => { e.stopPropagation(); scrollPrev(); }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-black/40 hover:bg-black/80 rounded-full text-white backdrop-blur-xl transition-all duration-300 border border-white/10 z-[20] opacity-0 group-hover:opacity-100 hidden md:flex"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M15 18l-6-6 6-6"/></svg>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); scrollNext(); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-black/40 hover:bg-black/80 rounded-full text-white backdrop-blur-xl transition-all duration-300 border border-white/10 z-[20] opacity-0 group-hover:opacity-100 hidden md:flex"
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
                {product?.name || 'Thunderbold Jeans'}
              </h1>
              <div className="mb-4">
                {product?.price
                  ? <PriceDisplay price={product.price} mrp={product.mrp ?? product.purchasePrice} size="lg" showSavings />
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
                    className={`font-serif font-light text-tb-off text-[0.78rem] leading-snug tracking-wide transition-all duration-300 ${
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

              {/* Size Selector — dual for outfits, single for regular */}
              <div 
                ref={sizeSelectorRef}
                className={`mb-10 p-4 rounded-xl border transition-all duration-300 ${
                  sizeError ? 'border-red-500/30 bg-red-500/5' : 'border-transparent'
                }`}
              >
                {isOutfit ? (
                  <div className="space-y-6">
                    <div>
                      <div className="font-condensed text-xs tracking-[0.2em] uppercase text-brass mb-3 flex items-center justify-between">
                        <span>Topwear Size <span className="text-sv-mid normal-case tracking-normal">(Shirt / T-Shirt)</span></span>
                        {sizeError && !selectedTopwearSize && <span className="text-[10px] font-semibold text-red-400 tracking-normal normal-case">Select a top size</span>}
                      </div>
                      <div className="flex flex-row flex-nowrap gap-2 md:flex-wrap">
                        {getSizesFromProduct(product?.topwear?.sizeStock).map(size => {
                          const oos = isTopwearOos(size);
                          return (
                            <button
                              key={size}
                              type="button"
                              onClick={() => { setSizeError(false); !oos && setSelectedTopwearSize(size); }}
                              disabled={oos}
                              title={oos ? `Size ${size} — out of stock` : `Size ${size}`}
                              className={`h-12 flex-1 md:flex-initial md:w-14 flex flex-col items-center justify-center font-condensed text-sm tracking-wider uppercase border transition-all duration-300 relative ${
                                oos
                                  ? 'border-white/15 text-white/20 cursor-not-allowed bg-white/[0.02]'
                                  : selectedTopwearSize === size
                                    ? 'border-brass bg-brass/10 text-brass scale-[1.05] shadow-[0_0_15px_rgba(212,170,48,0.15)]'
                                    : 'border-white/20 text-tb-white hover:bg-white/5 hover:scale-[1.02]'
                              }`}
                            >
                              <span className={oos ? 'line-through decoration-white/30' : ''}>{size}</span>
                              {oos && <span className="text-[9px] tracking-wider text-white/25 leading-none mt-0.5">OOS</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <div className="font-condensed text-xs tracking-[0.2em] uppercase text-brass mb-3 flex items-center justify-between">
                        <span>Bottomwear Size <span className="text-sv-mid normal-case tracking-normal">(Jeans)</span></span>
                        {sizeError && !selectedBottomwearSize && <span className="text-[10px] font-semibold text-red-400 tracking-normal normal-case">Select a bottom size</span>}
                      </div>
                      <div className="flex flex-row flex-nowrap gap-2 md:flex-wrap">
                        {getSizesFromProduct(product?.bottomwear?.sizeStock).map(size => {
                          const oos = isBottomwearOos(size);
                          return (
                            <button
                              key={size}
                              type="button"
                              onClick={() => { setSizeError(false); !oos && setSelectedBottomwearSize(size); }}
                              disabled={oos}
                              title={oos ? `Size ${size} — out of stock` : `Size ${size}`}
                              className={`h-12 flex-1 md:flex-initial md:w-14 flex flex-col items-center justify-center font-condensed text-sm tracking-wider uppercase border transition-all duration-300 relative ${
                                oos
                                  ? 'border-white/15 text-white/20 cursor-not-allowed bg-white/[0.02]'
                                  : selectedBottomwearSize === size
                                    ? 'border-brass bg-brass/10 text-brass scale-[1.05] shadow-[0_0_15px_rgba(212,170,48,0.15)]'
                                    : 'border-white/20 text-tb-white hover:bg-white/5 hover:scale-[1.02]'
                              }`}
                            >
                              <span className={oos ? 'line-through decoration-white/30' : ''}>{size}</span>
                              {oos && <span className="text-[9px] tracking-wider text-white/25 leading-none mt-0.5">OOS</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="font-condensed text-xs tracking-[0.2em] uppercase text-tb-white mb-5 flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        Select Size
                        {sizeError && <span className="text-[10px] font-semibold text-red-400 tracking-normal normal-case ml-2">Please select a size</span>}
                      </span>
                      <button 
                        type="button"
                        onClick={() => setShowSizeGuide(true)}
                        className="text-brass hover:text-brass-bright transition-colors underline underline-offset-4 decoration-brass/30 text-xs tracking-[0.08em] uppercase"
                      >
                        Size Guide
                      </button>
                    </div>
                    <div className="flex flex-row flex-nowrap gap-2 md:flex-wrap">
                      {getSizesFromProduct(product?.sizeStock).map(size => {
                        const oos = isSizeOos(size);
                        return (
                          <button
                            key={size}
                            type="button"
                            onClick={() => { setSizeError(false); !oos && setSelectedSize(size); }}
                            disabled={oos}
                            title={oos ? `Size ${size} — out of stock` : `Size ${size}`}
                            className={`h-12 flex-1 md:flex-initial md:w-14 md:h-14 flex flex-col items-center justify-center font-condensed text-sm tracking-wider uppercase border transition-all duration-300 relative ${
                              oos
                                ? 'border-white/15 text-white/20 cursor-not-allowed bg-white/[0.02]'
                                : selectedSize === size
                                  ? 'border-brass bg-brass/10 text-brass scale-[1.05] shadow-[0_0_15px_rgba(212,170,48,0.15)]'
                                  : 'border-white/20 text-tb-white hover:bg-white/5 hover:scale-[1.02]'
                            }`}
                          >
                            <span className={oos ? 'line-through decoration-white/30' : ''}>{size}</span>
                            {oos && <span className="text-[9px] tracking-wider text-white/25 leading-none mt-0.5">OOS</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Quantity Selector */}
              <div className="mb-10 lg:mb-12">
                <div className="font-condensed text-xs tracking-[0.2em] uppercase text-tb-white mb-5">
                  Quantity
                </div>
                <div className="flex items-center w-[140px] h-12 border border-white/10 text-tb-white font-condensed text-lg">
                  <button 
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="flex-1 h-full flex items-center justify-center hover:bg-white/5 transition-colors border-r border-white/10"
                  >
                    -
                  </button>
                  <div className="flex-[1.5] h-full flex items-center justify-center">
                    {quantity}
                  </div>
                  <button 
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="flex-1 h-full flex items-center justify-center hover:bg-white/5 transition-colors border-l border-white/10"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Conversion Optimized Checkout Dashboard */}
              <div className="flex flex-col gap-4 mb-10" ref={actionsRef}>
                {/* 1. Primary CTA: Express checkout buy button */}
                <button
                  type="button"
                  onClick={handleOrder}
                  disabled={effectiveOutOfStock || isOrdering}
                  className={`w-full py-5 font-condensed font-bold text-base tracking-[0.2em] uppercase transition-all duration-300 clip-bolt ${
                    effectiveOutOfStock || isOrdering
                      ? 'bg-white/5 text-white/25 cursor-not-allowed'
                      : 'bg-brass text-void hover:bg-brass-bright hover:scale-[1.015] shadow-[0_4px_30px_rgba(212,170,48,0.25)]'
                  }`}
                >
                  {isOrdering ? 'Processing...' : effectiveOutOfStock ? 'Out of Stock' : 'Order Now (Buy 1-Click)'}
                </button>

                {/* 2. Secondary CTAs: Add to Cart and Wishlist side-by-side */}
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={effectiveOutOfStock || isAddingToCart}
                    className={`flex-1 py-4 font-condensed font-bold text-sm tracking-[0.18em] uppercase transition-all duration-300 flex items-center justify-center gap-2 border ${
                      effectiveOutOfStock || isAddingToCart
                        ? 'border-white/5 bg-white/5 text-white/25 cursor-not-allowed'
                        : 'border-white/15 hover:border-white/30 text-white hover:bg-white/[0.04] bg-white/[0.01]'
                    }`}
                  >
                    <ShoppingCart size={16} />
                    {isAddingToCart ? 'Adding...' : isInCartWithSize ? `In Cart (${itemQuantity})` : 'Add to Cart'}
                  </button>

                  <button
                    type="button"
                    onClick={handleAddToWishlist}
                    disabled={!product || isTogglingWishlist}
                    className={`px-5 py-4 border transition-all duration-300 flex items-center justify-center rounded-sm ${
                      isTogglingWishlist
                        ? 'border-white/5 bg-white/5 text-white/25 cursor-not-allowed'
                        : product && isInWishlist(product._id)
                          ? 'border-brass bg-brass/10 text-brass hover:bg-brass/25'
                          : 'border-white/15 text-white hover:border-white/30 hover:bg-white/[0.04]'
                    }`}
                  >
                    <Heart size={18} className={!isTogglingWishlist && product && isInWishlist(product._id) ? 'fill-current' : ''} />
                  </button>
                </div>

                {/* Shipping & COD Assurance tag */}
                <p className="text-center font-condensed text-[0.65rem] tracking-[0.14em] uppercase text-sv-mid flex items-center justify-center gap-1.5 opacity-80 mt-1">
                  <span>⚡ FREE SHIPPING</span>
                  <span className="text-white/25">•</span>
                  <span>📦 CASH ON DELIVERY AVAILABLE</span>
                </p>

                {/* 3. Muted CTA: Share Product */}
                <button
                  type="button"
                  onClick={handleShareProduct}
                  disabled={!product || isSharing}
                  className="w-full py-3 font-condensed font-semibold text-xs tracking-[0.18em] uppercase transition-all duration-300 flex items-center justify-center gap-2 border border-white/5 text-white/45 hover:text-white hover:border-white/20 bg-white/[0.005]"
                >
                  <Share2 size={14} />
                  {isSharing ? 'Sharing...' : 'Share Product'}
                </button>
                {shareMessage && (
                  <p className="text-center font-condensed text-[0.7rem] tracking-[0.18em] uppercase text-brass">
                    {shareMessage}
                  </p>
                )}
              </div>

              {/* Product Highlights — outfit: per piece; regular: root highlights */}
              {isOutfit ? (
                <>
                  {[
                    { sectionLabel: 'Topwear Highlights', h: product?.topwear?.highlights },
                    { sectionLabel: 'Bottomwear Highlights', h: product?.bottomwear?.highlights },
                  ].map(({ sectionLabel, h }) => {
                    if (!h) return null;
                    const fields = [
                      { label: 'Color', value: h?.color },
                      { label: 'Length', value: h?.length },
                      { label: 'Prints & Pattern', value: h?.printsPattern },
                      { label: 'Waist Rise', value: h?.waistRise },
                      { label: 'Shade', value: h?.shade },
                      { label: '(Length) In Inches', value: h?.lengthInches },
                    ];
                    const hasAny = fields.some(f => f.value?.trim());
                    if (!hasAny) return null;
                    return (
                      <div key={sectionLabel} className="mb-6 lg:mb-8">
                        <div className="flex items-center gap-2.5 mb-4">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-brass shrink-0"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 0 2-2h2a2 2 0 0 0 2 2"/></svg>
                          <span className="font-condensed text-[0.72rem] tracking-[0.22em] uppercase text-brass">{sectionLabel}</span>
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
                  })}
                </>
              ) : (
                (() => {
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
                })()
              )}

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

      {product?._id && (
        <ProductReviewsSection
          productId={String(product._id)}
          productName={product.name}
          productImage={product.images?.[0] || product.image}
        />
      )}

      {/* Mobile Sticky Action Bar */}
      <AnimatePresence>
        {showStickyBar && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-0 left-0 right-0 z-[100] bg-[#0d0d0d]/95 backdrop-blur-lg border-t border-white/[0.08] px-4 py-3 flex items-center justify-between md:hidden gap-3 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]"
          >
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={optimizeCloudinaryUrl(IMAGES[0] || '/placeholder.png', IMG_SIZES.thumbnail)}
                alt={product?.name}
                className="w-9 h-12 object-cover rounded border border-white/10"
              />
              <div className="min-w-0">
                <p className="font-condensed font-bold text-xs text-white truncate uppercase tracking-wide">
                  {product?.name}
                </p>
                <p className="font-condensed text-brass text-sm font-bold mt-0.5">
                  ₹{product?.price?.toLocaleString('en-IN')}
                </p>
              </div>
            </div>
            
            <button
              type="button"
              onClick={handleOrder}
              disabled={effectiveOutOfStock || isOrdering}
              className="px-5 py-2.5 bg-brass text-void font-condensed font-bold text-xs tracking-wider uppercase flex-shrink-0 transition-transform duration-200 active:scale-95"
            >
              {isOrdering ? '...' : effectiveOutOfStock ? 'OOS' : 'BUY NOW'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Size Guide Drawer Modal */}
      <AnimatePresence>
        {showSizeGuide && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowSizeGuide(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-[#121212] border border-white/10 rounded-xl p-6 md:p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-display text-lg tracking-[0.12em] uppercase text-white">Size Chart</h3>
                <button
                  type="button"
                  onClick={() => setShowSizeGuide(false)}
                  className="p-2 text-sv-mid hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Jeans Table */}
                <div>
                  <p className="font-condensed text-xs text-brass uppercase tracking-wider mb-2.5">Bottomwear / Jeans (Inches)</p>
                  <div className="border border-white/10 rounded overflow-hidden">
                    <table className="w-full text-left font-condensed text-xs text-white/80">
                      <thead className="bg-white/5 border-b border-white/10">
                        <tr>
                          <th className="px-3 py-2">Size</th>
                          <th className="px-3 py-2">Waist</th>
                          <th className="px-3 py-2">Inseam</th>
                          <th className="px-3 py-2">Hip</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.06]">
                        {[['28', '28"', '30"', '36"'], ['30', '30"', '30"', '38"'], ['32', '32"', '32"', '40"'], ['34', '34"', '32"', '42"'], ['36', '36"', '32"', '44"']].map(([sz, waist, inseam, hip]) => (
                          <tr key={sz} className="hover:bg-white/[0.02] transition-colors">
                            <td className="px-3 py-2 text-brass font-bold">{sz}</td>
                            <td className="px-3 py-2">{waist}</td>
                            <td className="px-3 py-2">{inseam}</td>
                            <td className="px-3 py-2">{hip}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Shirts / T-shirts Table */}
                <div>
                  <p className="font-condensed text-xs text-brass uppercase tracking-wider mb-2.5">Topwear / T-Shirts & Shirts (Inches)</p>
                  <div className="border border-white/10 rounded overflow-hidden">
                    <table className="w-full text-left font-condensed text-xs text-white/80">
                      <thead className="bg-white/5 border-b border-white/10">
                        <tr>
                          <th className="px-3 py-2">Size</th>
                          <th className="px-3 py-2">Chest</th>
                          <th className="px-3 py-2">Shoulder</th>
                          <th className="px-3 py-2">Length</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.06]">
                        {[['S', '36" - 38"', '17.5"', '27.5"'], ['M', '38" - 40"', '18.0"', '28.5"'], ['L', '40" - 42"', '18.5"', '29.5"'], ['XL', '42" - 44"', '19.0"', '30.5"'], ['XXL', '44" - 46"', '19.5"', '31.5"']].map(([sz, chest, shoulder, len]) => (
                          <tr key={sz} className="hover:bg-white/[0.02] transition-colors">
                            <td className="px-3 py-2 text-brass font-bold">{sz}</td>
                            <td className="px-3 py-2">{chest}</td>
                            <td className="px-3 py-2">{shoulder}</td>
                            <td className="px-3 py-2">{len}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Advanced Lightbox Modal for Immersive Review */}
      <AnimatePresence>
        {showLightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 md:p-8 select-none"
            onClick={() => {
              setLightboxZoom(false);
              setShowLightbox(false);
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between w-full z-10">
              <span className="font-condensed text-xs tracking-[0.2em] uppercase text-white/60">
                {lightboxIndex + 1} / {IMAGES.length} — {product?.name}
              </span>
              <button
                onClick={() => {
                  setLightboxZoom(false);
                  setShowLightbox(false);
                }}
                className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Main Image Viewport */}
            <div 
              className="flex-1 flex items-center justify-center relative w-full max-h-[70vh] my-auto overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Left Arrow */}
              {IMAGES.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxZoom(false);
                    setLightboxIndex(prev => (prev + IMAGES.length - 1) % IMAGES.length);
                  }}
                  className="absolute left-2 md:left-6 w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-white backdrop-blur-xl transition-all z-[20]"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M15 18l-6-6 6-6"/></svg>
                </button>
              )}

              {/* Zoomable Container Wrapper */}
              <div
                className={`w-full h-full flex transition-all duration-300 ${
                  lightboxZoom ? 'overflow-auto items-start justify-start' : 'items-center justify-center overflow-hidden'
                }`}
                onClick={(e) => {
                  if (lightboxZoom) {
                    e.stopPropagation();
                    setLightboxZoom(false);
                  } else {
                    setShowLightbox(false);
                  }
                }}
              >
                <motion.img
                  key={lightboxIndex}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  src={optimizeCloudinaryUrl(IMAGES[lightboxIndex], IMG_SIZES.detail)}
                  alt={`Enlarged product image ${lightboxIndex + 1}`}
                  className={`transition-all duration-300 ${
                    lightboxZoom
                      ? 'w-[200vw] h-[200vh] max-w-none max-h-none object-contain cursor-zoom-out block'
                      : 'max-w-full max-h-full object-contain cursor-zoom-in'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxZoom(!lightboxZoom);
                  }}
                />
              </div>

              {/* Right Arrow */}
              {IMAGES.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxZoom(false);
                    setLightboxIndex(prev => (prev + 1) % IMAGES.length);
                  }}
                  className="absolute right-2 md:right-6 w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-white backdrop-blur-xl transition-all z-[20]"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 18l6-6-6-6"/></svg>
                </button>
              )}
            </div>

            {/* Bottom Thumbnails */}
            {IMAGES.length > 1 && (
              <div className="w-full flex justify-center gap-3 overflow-x-auto py-4 z-10 no-scrollbar" onClick={(e) => e.stopPropagation()}>
                {IMAGES.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setLightboxZoom(false);
                      setLightboxIndex(idx);
                    }}
                    className={`w-14 aspect-[3/4] overflow-hidden border transition-all duration-300 rounded shrink-0 ${
                      idx === lightboxIndex
                        ? 'border-brass scale-105 shadow-[0_0_12px_rgba(212,170,48,0.25)]'
                        : 'border-white/10 opacity-50 hover:opacity-100 bg-white/[0.02]'
                    }`}
                  >
                    <img src={optimizeCloudinaryUrl(img, IMG_SIZES.thumbnail)} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Skeleton — mirrors the real layout 1:1 so there's zero pop-in
   when the actual product data arrives.
   ───────────────────────────────────────────────────────────────── */
function ProductViewSkeleton({ onBack }: { onBack: () => void }) {
  const block = 'bg-white/[0.05] rounded-sm';
  const pulse = 'animate-pulse';

  return (
    <div className="noise-overlay min-h-screen flex flex-col bg-void">
      <CustomCursor />
      <ScrollProgress />
      <Navbar />

      <main className="flex-1 pt-[calc(110px+var(--tb-banner-h))] md:pt-[calc(164px+var(--tb-banner-h))] pb-24 px-6 md:px-16">
        <div className="max-w-[1240px] mx-auto">
          {/* Back Button (real, fully functional) */}
          <button
            onClick={onBack}
            className="font-condensed font-semibold text-xs tracking-[0.18em] uppercase text-sv-mid hover:text-white transition-colors duration-200 mb-7 md:mb-10 flex items-center gap-2 group"
          >
            <span className="transition-transform duration-300 group-hover:-translate-x-1">←</span> Back to Collection
          </button>

          <div className={`flex flex-col md:flex-row gap-7 md:gap-12 lg:gap-24 ${pulse}`}>
            {/* Left: Image Slider Skeleton */}
            <div className="w-full md:w-1/2 flex flex-col">
              <div className={`${block} aspect-[3/4] w-full max-w-[500px] mx-auto`} />

              {/* Desktop thumbnails */}
              <div className="hidden md:flex gap-4 mt-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className={`${block} w-24 aspect-[4/5]`} />
                ))}
              </div>

              {/* Mobile dot indicators */}
              <div className="flex md:hidden justify-center gap-2 mt-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 rounded-full ${i === 0 ? 'w-6 bg-white/20' : 'w-2 bg-white/10'}`}
                  />
                ))}
              </div>
            </div>

            {/* Right: Product Details Skeleton */}
            <div className="w-full md:w-1/2 flex flex-col py-0 md:py-8">
              {/* "Premium Collection" eyebrow */}
              <div className={`${block} h-3 w-40 mb-5`} />

              {/* Title — 2 lines, mobile-compact then desktop-large */}
              <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-5">
                <div className={`${block} h-7 sm:h-10 md:h-14 lg:h-16 w-4/5`} />
                <div className={`${block} h-7 sm:h-10 md:h-14 lg:h-16 w-3/5`} />
              </div>

              {/* Price */}
              <div className={`${block} h-8 w-32 mb-8`} />

              {/* Description — 4 short lines */}
              <div className="mb-10 max-w-[90%] space-y-2">
                <div className={`${block} h-3 w-full`} />
                <div className={`${block} h-3 w-[95%]`} />
                <div className={`${block} h-3 w-[88%]`} />
                <div className={`${block} h-3 w-[60%]`} />
              </div>

              {/* Size Selector */}
              <div className="mb-10">
                <div className="flex items-center justify-between mb-5">
                  <div className={`${block} h-3 w-24`} />
                  <div className={`${block} h-3 w-20`} />
                </div>
                <div className="grid grid-cols-5 gap-2 sm:gap-4 md:flex md:flex-wrap">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className={`${block} h-12 w-full md:w-14 md:h-14`} />
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div className="mb-10 lg:mb-12">
                <div className={`${block} h-3 w-20 mb-5`} />
                <div className={`${block} h-12 w-[140px]`} />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-4 mb-8 lg:mb-10">
                <div className="flex gap-4">
                  <div className={`${block} h-[52px] flex-1`} />
                  <div className={`${block} h-[52px] w-[52px]`} />
                </div>
                <div className={`${block} h-[60px] w-full`} />
              </div>

              {/* Trust Badges */}
              <div className="mb-10 lg:mb-12 flex flex-col gap-3 border border-white/[0.07] rounded-sm px-5 py-4 bg-white/[0.02]">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i}>
                    <div className="flex items-center gap-3">
                      <div className={`${block} w-7 h-7 rounded-full`} />
                      <div className={`${block} h-3 flex-1 max-w-[220px]`} />
                    </div>
                    {i < 2 && <div className="h-px bg-white/[0.06] mt-3" />}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
