import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { optimizeCloudinaryUrl, IMG_SIZES } from '../lib/cloudinary';

interface Product {
  _id: string;
  name: string;
  price: number;
  image?: string;
  images?: string[];
  stock?: number;
  section?: string;
}

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
};

function ProductCardSkeleton() {
  return (
    <div className="flex flex-col">
      <div className="overflow-hidden bg-[#0c0c0c] aspect-[3/4] rounded-sm border border-white/5">
        <div className="w-full h-full bg-white/[0.04] animate-pulse" />
      </div>
      <div className="mt-3 flex flex-col gap-2">
        <div className="h-3.5 w-3/4 bg-white/[0.06] rounded animate-pulse" />
        <div className="h-3 w-1/3 bg-white/[0.04] rounded animate-pulse" />
      </div>
    </div>
  );
}

export default function LiveSaleSection() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/products');
        if (res.ok) {
          const data = await res.json();
          const saleProducts = (data.products || []).filter(
            (p: Product) => p.section === 'live-sale'
          );
          setProducts(saleProducts);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Don't render if no products and not loading
  if (!loading && products.length === 0) return null;

  return (
    <section
      id="live-sale"
      className="pt-12 md:pt-20 pb-0 px-6 md:px-16 scroll-mt-24"
    >
      <div className="max-w-[1000px] mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-10 md:mb-16 text-center"
        >
          <div className="font-condensed font-semibold text-[0.64rem] md:text-[0.68rem] tracking-[0.36em] md:tracking-[0.40em] uppercase text-brass mb-6 flex items-center justify-center gap-3">
            <span className="w-5 h-px bg-brass-dim inline-block" />
            <Zap className="w-3.5 h-3.5 text-brass inline-block" strokeWidth={2.5} />
            Live Sale
            <Zap className="w-3.5 h-3.5 text-brass inline-block" strokeWidth={2.5} />
            <span className="w-5 h-px bg-brass-dim inline-block" />
          </div>
          <h2 className="font-display text-4xl md:text-6xl tracking-[0.12em] metal-text uppercase">
            Sale Is Live
          </h2>
          <p className="font-condensed text-sv-mid text-sm md:text-base tracking-[0.10em] mt-4">
            Buy Three Jeans at Only ₹1199 — Limited Time Only
          </p>
        </motion.div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3 md:gap-x-12 md:gap-y-8 lg:gap-x-16">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : products.map((product, index) => {
                const img = product.images?.[0] || product.image || '/placeholder.png';
                const isOutOfStock = typeof product.stock === 'number' && product.stock === 0;

                return (
                  <motion.div
                    key={product._id}
                    variants={itemVariants}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ delay: index * 0.06 }}
                    onClick={() => navigate(`/product/${product._id}`)}
                    className="group cursor-pointer flex flex-col relative"
                  >
                    <div className="overflow-hidden bg-[#0c0c0c] aspect-[3/4] relative border border-white/5 group-hover:border-white/10 transition-colors duration-500 rounded-sm">
                      {/* Sale badge */}
                      <div className="absolute top-2.5 left-2.5 z-20 flex flex-col gap-1.5">
                        <span className="font-condensed text-[0.58rem] tracking-[0.14em] uppercase px-2 py-0.5 bg-brass text-void font-bold rounded-sm">
                          Sale
                        </span>
                        {isOutOfStock && (
                          <span className="font-condensed text-[0.55rem] tracking-[0.12em] uppercase px-2 py-0.5 bg-red-500/90 text-white font-bold rounded-sm">
                            Sold Out
                          </span>
                        )}
                      </div>

                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <img
                        src={optimizeCloudinaryUrl(img, IMG_SIZES.card)}
                        alt={product.name}
                        className={`w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700 ease-[0.16,1,0.3,1] ${isOutOfStock ? 'opacity-60 grayscale-[0.4]' : ''}`}
                        loading={index < 2 ? 'eager' : 'lazy'}
                        decoding="async"
                        onError={(e) => { e.currentTarget.src = '/placeholder.png'; }}
                      />
                    </div>
                    <div className="mt-3 md:mt-5 flex flex-col">
                      <h3 className="font-condensed text-sm md:text-base tracking-[0.1em] uppercase text-tb-white group-hover:text-brass transition-colors duration-300 line-clamp-2 leading-snug">
                        {product.name}
                      </h3>
                      <p className="font-condensed text-xs md:text-sm tracking-widest text-brass mt-1 font-semibold">
                        ₹{product.price.toLocaleString('en-IN')}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
        </div>
      </div>
    </section>
  );
}
