import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import useEmblaCarousel from 'embla-carousel-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CustomCursor from '@/components/CustomCursor';
import ScrollProgress from '@/components/ScrollProgress';
import { SIZES, PRODUCTS } from '@/data/products';

export default function ProductView() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  
  const product = PRODUCTS.find(p => p.id === productId);
  const IMAGES = product?.images || [];
  
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
    window.scrollTo(0, 0);
  }, [productId]);

  const handleOrder = () => {
    if (!selectedSize || !product) return;
    navigate('/checkout', {
      state: {
        productName: product.name,
        productImage: product.images[0],
        price: product.price,
        size: selectedSize,
        quantity,
        categoryName: product.categoryId,
        productUrl: window.location.href,
      },
    });
  };

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
                        src={img}
                        alt={`Product slide ${index + 1}`}
                        className="w-full h-full object-cover object-center scale-[1.01] transition-transform duration-[1.5s] ease-out group-hover:scale-[1.04]"
                        loading={index === 0 ? "eager" : "lazy"}
                        decoding="async"
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
                    <img src={img} alt={`Thumbnail ${index}`} className="w-full h-full object-cover object-center" loading="lazy" decoding="async" />
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
              <div className="font-condensed text-3xl tracking-widest text-tb-white mb-8">
                {product?.price || '₹ 2,499'}
              </div>
              
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
                  {SIZES.map(size => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`h-12 w-full md:w-14 md:h-14 flex items-center justify-center font-condensed text-sm tracking-wider uppercase border transition-all duration-300 ${
                        selectedSize === size
                          ? 'border-brass bg-brass/10 text-brass scale-[1.05] shadow-[0_0_15px_rgba(212,170,48,0.15)]'
                          : 'border-white text-tb-white hover:bg-white/5 hover:scale-[1.02]'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
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

              {/* Order CTA */}
              <button
                onClick={handleOrder}
                disabled={!selectedSize}
                className={`w-full py-5 font-condensed font-bold text-base tracking-[0.2em] uppercase transition-all duration-300 clip-bolt ${
                  selectedSize
                    ? 'bg-tb-white text-void hover:bg-white hover:scale-[1.01] shadow-[0_0_20px_rgba(255,255,255,0.1)]'
                    : 'bg-white/5 text-white/20 cursor-not-allowed'
                }`}
              >
                {selectedSize ? 'Order Now via WhatsApp' : 'Select a Size'}
              </button>
              
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
