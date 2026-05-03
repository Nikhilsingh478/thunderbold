import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { optimizeCloudinaryUrl, IMG_SIZES } from '../lib/cloudinary';
import PromoBanner from './promo/PromoBanner';

const SKELETON_COUNT = 3;
const KURTA_SECTION_ID = 'kurta-products';

interface Category {
  _id: string;
  name: string;
  image?: string;
  section?: string;
}

interface ProductTile {
  _id: string;
  name: string;
  image?: string;
  images?: string[];
  price: number;
  purchasePrice?: number;
}

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
};

function CategorySkeleton() {
  return (
    <div className="flex flex-col">
      <div className="overflow-hidden bg-[#0c0c0c] aspect-[3/4] rounded-sm border border-white/5">
        <div className="w-full h-full bg-white/[0.04] animate-pulse" />
      </div>
      <div className="mt-4 flex flex-col items-center gap-2">
        <div className="h-4 w-24 bg-white/[0.06] rounded animate-pulse" />
      </div>
    </div>
  );
}

function CategoryCard({ cat, index, navigate }: { cat: Category; index: number; navigate: ReturnType<typeof useNavigate> }) {
  return (
    <motion.div
      variants={itemVariants}
      initial="hidden"
      animate="show"
      transition={{ delay: index * 0.06 }}
      onClick={() => navigate(`/category/${cat._id}`)}
      className="group cursor-pointer flex flex-col relative"
    >
      <div className="overflow-hidden bg-[#0c0c0c] aspect-[3/4] relative border border-white/5 group-hover:border-white/10 transition-colors duration-500 rounded-sm">
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="absolute inset-0 bg-brass-bright/5 opacity-0 group-hover:opacity-100 blur-2xl transition-opacity duration-500 z-0 pointer-events-none" />
        <div className="w-full h-full bg-gradient-to-br from-brass/20 to-brass/10 flex items-center justify-center">
          <img
            src={optimizeCloudinaryUrl(cat.image || '/placeholder.png', IMG_SIZES.card)}
            alt={cat.name}
            className="w-full h-full object-cover"
            loading={index < 2 ? 'eager' : 'lazy'}
            decoding="async"
            onError={(e) => { e.currentTarget.src = '/placeholder.png'; }}
          />
        </div>
      </div>
      <div className="mt-3 md:mt-6 flex flex-col items-center justify-center">
        <h3 className="font-condensed text-xl md:text-2xl tracking-[0.2em] uppercase text-tb-white group-hover:text-brass transition-colors duration-300">
          {cat.name}
        </h3>
        <div className="w-0 h-px bg-brass mt-3 group-hover:w-8 transition-all duration-500 ease-in-out" />
      </div>
    </motion.div>
  );
}

interface CollectionSectionProps {
  eyebrow: string;
  heading: string;
  subtitle?: string;
  categories: Category[];
  loading: boolean;
  navigate: ReturnType<typeof useNavigate>;
  className?: string;
}

function CollectionSection({ eyebrow, heading, subtitle, categories, loading, navigate, className = '' }: CollectionSectionProps) {
  return (
    <div className={className}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="mb-12 md:mb-20 text-center"
      >
        <div className="font-condensed font-semibold text-[0.64rem] md:text-[0.68rem] tracking-[0.36em] md:tracking-[0.40em] uppercase text-brass mb-6 flex items-center justify-center gap-3">
          <span className="w-5 h-px bg-brass-dim inline-block" />
          {eyebrow}
          <span className="w-5 h-px bg-brass-dim inline-block" />
        </div>
        <h2 className="font-display text-4xl md:text-6xl tracking-[0.12em] metal-text uppercase">
          {heading}
        </h2>
        {subtitle && (
          <p className="font-condensed text-sv text-sm md:text-base tracking-[0.12em] mt-4">
            {subtitle}
          </p>
        )}
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3 md:gap-x-12 md:gap-y-8 lg:gap-x-16 mx-auto">
        {loading
          ? Array.from({ length: SKELETON_COUNT }).map((_, i) => <CategorySkeleton key={i} />)
          : categories.map((cat, index) => (
              <CategoryCard key={cat._id} cat={cat} index={index} navigate={navigate} />
            ))
        }
      </div>
    </div>
  );
}

function ProductSection({
  eyebrow,
  heading,
  subtitle,
  products,
  loading,
  navigate,
  className = '',
}: {
  eyebrow: string;
  heading: string;
  subtitle?: string;
  products: ProductTile[];
  loading: boolean;
  navigate: ReturnType<typeof useNavigate>;
  className?: string;
}) {
  return (
    <div className={className} id={KURTA_SECTION_ID}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="mb-12 md:mb-20 text-center"
      >
        <div className="font-condensed font-semibold text-[0.64rem] md:text-[0.68rem] tracking-[0.36em] md:tracking-[0.40em] uppercase text-brass mb-6 flex items-center justify-center gap-3">
          <span className="w-5 h-px bg-brass-dim inline-block" />
          {eyebrow}
          <span className="w-5 h-px bg-brass-dim inline-block" />
        </div>
        <h2 className="font-display text-4xl md:text-6xl tracking-[0.12em] metal-text uppercase">
          {heading}
        </h2>
        {subtitle && (
          <p className="font-condensed text-sv text-sm md:text-base tracking-[0.12em] mt-4">
            {subtitle}
          </p>
        )}
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3 md:gap-x-12 md:gap-y-8 lg:gap-x-16 mx-auto">
          {Array.from({ length: SKELETON_COUNT }).map((_, i) => <CategorySkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3 md:gap-x-12 md:gap-y-8 lg:gap-x-16 mx-auto">
          {products.map((product, index) => {
            const image = product.images?.[0] || product.image || '/placeholder.png';
            return (
              <motion.div
                key={product._id}
                variants={itemVariants}
                initial="hidden"
                animate="show"
                transition={{ delay: index * 0.06 }}
                onClick={() => navigate(`/product/${product._id}`)}
                className="group cursor-pointer flex flex-col relative"
              >
                <div className="overflow-hidden bg-[#0c0c0c] aspect-[3/4] relative border border-white/5 group-hover:border-white/10 transition-colors duration-500 rounded-sm">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="absolute inset-0 bg-brass-bright/5 opacity-0 group-hover:opacity-100 blur-2xl transition-opacity duration-500 z-0 pointer-events-none" />
                  <div className="w-full h-full bg-gradient-to-br from-brass/20 to-brass/10 flex items-center justify-center">
                    <img
                      src={optimizeCloudinaryUrl(image, IMG_SIZES.card)}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      loading={index < 2 ? 'eager' : 'lazy'}
                      decoding="async"
                      onError={(e) => { e.currentTarget.src = '/placeholder.png'; }}
                    />
                  </div>
                </div>
                <div className="mt-3 md:mt-6 flex flex-col items-center justify-center">
                  <h3 className="font-condensed text-xl md:text-2xl tracking-[0.2em] uppercase text-tb-white group-hover:text-brass transition-colors duration-300">
                    {product.name}
                  </h3>
                  <div className="font-condensed text-xs tracking-[0.18em] text-sv-mid mt-2">
                    ₹{Math.round(product.price).toLocaleString('en-IN')}
                  </div>
                  <div className="w-0 h-px bg-brass mt-3 group-hover:w-8 transition-all duration-500 ease-in-out" />
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function CategoriesSection() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<ProductTile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [catRes, prodRes] = await Promise.all([fetch('/api/categories'), fetch('/api/products')]);
        if (catRes.ok) {
          const data = await catRes.json();
          setCategories(data.categories || []);
        }
        if (prodRes.ok) {
          const data = await prodRes.json();
          setProducts((data.products || []).filter((p: { section?: string }) => p.section === 'kurta'));
        }
      } catch {
        // silently fail — skeleton stays until categories load
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Categories without a `section` value default to Denim Collection.
  const denimCategories = useMemo(
    () => categories.filter(c => !c.section || c.section === 'denim'),
    [categories]
  );
  const tshirtCategories = useMemo(
    () => categories.filter(c => c.section === 'tshirts'),
    [categories]
  );
  const kurtaCategories = useMemo(
    () => categories.filter(c => c.section === 'kurta'),
    [categories]
  );

  const showTshirts = loading || tshirtCategories.length > 0;
  const showKurta = loading || products.length > 0;

  return (
    <section className="min-h-screen pt-12 md:pt-20 pb-24 px-6 md:px-16" id="categories">
      <div className="max-w-[1000px] mx-auto">

        {/* ── Denim Collection ─────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-12 md:mb-20 text-center"
        >
          <div className="font-condensed font-semibold text-[0.64rem] md:text-[0.68rem] tracking-[0.36em] md:tracking-[0.40em] uppercase text-brass mb-6 flex items-center justify-center gap-3">
            <span className="w-5 h-px bg-brass-dim inline-block" />
            Shop By Fit
            <span className="w-5 h-px bg-brass-dim inline-block" />
          </div>
          <h1 className="font-display text-4xl md:text-6xl tracking-[0.12em] metal-text uppercase">
            The Denim Collection
          </h1>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3 md:gap-x-12 md:gap-y-8 lg:gap-x-16 mx-auto">
          {loading
            ? Array.from({ length: SKELETON_COUNT }).map((_, i) => <CategorySkeleton key={i} />)
            : denimCategories.map((cat, index) => (
                <CategoryCard key={cat._id} cat={cat} index={index} navigate={navigate} />
              ))
          }
        </div>

        {/* ── Promo Banner (between Denim and T-Shirts) ────────────── */}
        <div className="mt-0 -mx-6 md:-mx-16">
          <PromoBanner />
        </div>

        {/* ── T-Shirt Collection ───────────────────────────────────── */}
        {showTshirts && (
          <CollectionSection
            eyebrow="New Category"
            heading="The T-Shirt Collection"
            subtitle="Premium cuts. Everyday essentials."
            categories={tshirtCategories}
            loading={loading}
            navigate={navigate}
            className="mt-20 md:mt-28"
          />
        )}

        {/* ── Kurta Collection ─────────────────────────────────────── */}
        {showKurta && (
          <ProductSection
            eyebrow="New Arrival"
            heading="The Kurta Collection"
            subtitle="Crafted tradition. Contemporary style."
            products={products}
            loading={loading}
            navigate={navigate}
            className="mt-20 md:mt-28"
          />
        )}

      </div>
    </section>
  );
}
