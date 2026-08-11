import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { optimizeCloudinaryUrl, IMG_SIZES, PLACEHOLDER } from '../lib/cloudinary';
import PromoBanner from './promo/PromoBanner';
import ProductGrid, { type GridProduct } from './products/ProductGrid';
import ThunderboldSlider from './ThunderboldSlider';

const SKELETON_COUNT = 3;

interface Category {
  _id: string;
  name: string;
  image?: string;
  section?: string;
}

interface ProductTile extends GridProduct {
  section?: string;
}

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
    <div
      className="group cursor-pointer flex flex-col relative tb-card-appear"
      style={{ animationDelay: `${Math.min(index, 7) * 50}ms` }}
      onClick={() => navigate(`/category/${cat._id}`)}
    >
      <div className="overflow-hidden bg-[#0c0c0c] aspect-[3/4] relative border border-white/5 group-hover:border-white/10 transition-colors duration-500 rounded-sm">
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="absolute inset-0 bg-brass-bright/5 opacity-0 group-hover:opacity-100 blur-2xl transition-opacity duration-500 z-0 pointer-events-none" />
        <div className="w-full h-full bg-[#0c0c0c] flex items-center justify-center">
          <img
            src={optimizeCloudinaryUrl(cat.image, IMG_SIZES.card)}
            alt={cat.name}
            width={500}
            height={667}
            className="w-full h-full object-cover text-transparent"
            loading={index === 0 ? 'eager' : 'lazy'}
            fetchPriority={index === 0 ? 'high' : 'low'}
            decoding={index === 0 ? 'sync' : 'async'}
            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = PLACEHOLDER; }}
          />
        </div>
      </div>
      <div className="mt-3 md:mt-6 flex flex-col items-center justify-center">
        <h3 className="font-condensed text-xl md:text-2xl tracking-[0.2em] uppercase text-tb-white group-hover:text-brass transition-colors duration-300">
          {cat.name}
        </h3>
        <div className="w-0 h-px bg-brass mt-3 group-hover:w-8 transition-all duration-500 ease-in-out" />
      </div>
    </div>
  );
}

interface CollectionSectionProps {
  heading: string;
  subtitle?: string;
  categories: Category[];
  loading: boolean;
  navigate: ReturnType<typeof useNavigate>;
  className?: string;
}

function CollectionSection({ heading, subtitle, categories, loading, navigate, className = '' }: CollectionSectionProps) {
  return (
    <div className={className}>
      <div className="mb-12 md:mb-20 text-center tb-heading-reveal">
        <h2 className="font-display text-4xl md:text-6xl tracking-[0.12em] metal-text uppercase">
          {heading}
        </h2>
        {subtitle && (
          <p className="font-condensed text-sv text-sm md:text-base tracking-[0.12em] mt-4">
            {subtitle}
          </p>
        )}
      </div>

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

export default function CategoriesSection() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<ProductTile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    import('../lib/apiCache').then(({ cachedFetch }) =>
      Promise.all([
        cachedFetch<{ categories?: Category[] }>('/api/categories'),
        cachedFetch<{ products?: { section?: string }[] }>('/api/products'),
      ])
    ).then(([catData, prodData]) => {
      if (cancelled) return;
      setCategories(catData.categories || []);
      const freshProds = (prodData.products || []).filter(
        (p: { section?: string }) => p.section === 'kurta'
      );
      setProducts(freshProds as ProductTile[]);
    }).catch(() => {}).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  const denimCategories = useMemo(
    () => categories.filter(c => !c.section || c.section === 'denim'),
    [categories]
  );
  const tshirtCategories = useMemo(
    () => categories.filter(c => c.section === 'tshirts'),
    [categories]
  );
  const kurtaProducts = useMemo(
    () => products.filter(p => p.section === 'kurta'),
    [products]
  );

  const showTshirts = loading || tshirtCategories.length > 0;
  const showKurta = true;

  return (
    <section className="min-h-screen pt-12 md:pt-20 pb-24 px-6 md:px-16" id="categories">
      <div className="max-w-[1000px] mx-auto">

        {/* ── Denim Collection ─────────────────────────────────────── */}
        <div className="mb-12 md:mb-20 text-center tb-heading-reveal">
          <h1 className="font-display text-4xl md:text-6xl tracking-[0.12em] metal-text uppercase">
            The Denim Collection
          </h1>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3 md:gap-x-12 md:gap-y-8 lg:gap-x-16 mx-auto">
          {loading
            ? Array.from({ length: SKELETON_COUNT }).map((_, i) => <CategorySkeleton key={i} />)
            : denimCategories.map((cat, index) => (
                <CategoryCard key={cat._id} cat={cat} index={index} navigate={navigate} />
              ))
          }
        </div>

        {/* ── Promo Banner (between Denim and T-Shirts) ────────────── */}
        <div className="mt-8 md:mt-12 -mx-6 md:-mx-16">
          <PromoBanner />
        </div>

        {/* ── Outfit Slider ────────────────────────────────────────── */}
        <div className="-mx-6 md:-mx-16 mt-0">
          <div className="text-center pt-4 md:pt-14 pb-3 md:pb-8 px-6 md:px-16 tb-heading-reveal">
            <h2 className="font-display text-3xl md:text-5xl tracking-[0.12em] uppercase metal-text">
              #Outfits of the Week
            </h2>
          </div>
          <ThunderboldSlider />
        </div>

        {/* ── T-Shirt Collection ───────────────────────────────────── */}
        {showTshirts && (
          <CollectionSection
            heading="The T-Shirt Collection"
            subtitle="Premium cuts. Everyday essentials."
            categories={tshirtCategories}
            loading={loading}
            navigate={navigate}
            className="mt-12 md:mt-20"
          />
        )}

        {/* ── Kurta Collection ─────────────────────────────────────── */}
        {showKurta && (
          <div className="mt-12 md:mt-20" id="kurta-products">
            <div className="mb-12 md:mb-16 text-center tb-heading-reveal">
              <h2 className="font-display text-4xl md:text-6xl tracking-[0.12em] metal-text uppercase">
                The Kurta Collection
              </h2>
              <p className="font-display text-sv text-sm md:text-base tracking-[0.08em] mt-4">
                Crafted tradition. Contemporary style.
              </p>
            </div>

            {/* Always use ProductGrid so the skeleton→content transition stays stable.
                Pass a min-h emptyState so the section never collapses to near-zero
                height when no kurta products exist — that collapse was CLS 0.835.  */}
            <ProductGrid
              products={kurtaProducts}
              loading={loading}
              skeletonCount={4}
              emptyState={
                <div className="min-h-[280px] flex flex-col items-center justify-center py-16 border border-white/[0.06] rounded-sm">
                  <p className="font-display text-sm uppercase tracking-[0.18em] text-sv-mid font-medium">
                    Coming Soon
                  </p>
                  <p className="font-display text-xs tracking-[0.1em] text-sv-dim mt-2">
                    New arrivals being added
                  </p>
                </div>
              }
            />
          </div>
        )}


      </div>
    </section>
  );
}
