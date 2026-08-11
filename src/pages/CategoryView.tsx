import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import CustomCursor from '../components/CustomCursor';
import ScrollProgress from '../components/ScrollProgress';
import ProductGrid, { GridProduct } from '../components/products/ProductGrid';
import { useSEO } from '../hooks/useSEO';
import { cachedFetch } from '../lib/apiCache';

export default function CategoryView() {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const [categoryProducts, setCategoryProducts] = useState<GridProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryName, setCategoryName] = useState('');

  useSEO({
    title: categoryName ? `${categoryName} Collection` : "Shop Category",
    description: categoryName ? `Explore the premium Thunderbold ${categoryName.toLowerCase()} collection. Style that works every day.` : "Explore premium denim, t-shirts, shirts, kurtas, and outfits at Thunderbold.",
  });

  useEffect(() => {
    if (!categoryId) return;
    window.scrollTo(0, 0);

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const [catData, prodData] = await Promise.all([
          cachedFetch<{ categories?: Array<{ _id: string; name: string }> }>('/api/categories'),
          cachedFetch<{ products?: Array<{ categoryId?: string } & GridProduct> }>('/api/products'),
        ]);
        if (!cancelled) {
          const cat = catData.categories?.find((c) => c._id === categoryId);
          if (cat) setCategoryName(cat.name);
          const filtered = (prodData.products || []).filter(
            (p) => String(p.categoryId) === String(categoryId),
          );
          setCategoryProducts(filtered);
        }
      } catch {
        if (!cancelled) setCategoryProducts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [categoryId]);

  return (
    <div className="noise-overlay min-h-screen flex flex-col bg-void">
      <CustomCursor />
      <ScrollProgress />
      <Navbar />

      <main className="flex-1 pt-[calc(110px+var(--tb-banner-h,0px))] pb-24 px-6 md:px-16">
        <div className="max-w-[1400px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-16"
          >
            <button
              onClick={() => navigate(-1)}
              className="font-condensed font-semibold text-xs tracking-[0.18em] uppercase text-sv-mid hover:text-brass transition-colors duration-200 mb-8 flex items-center gap-2"
            >
              ← Back to Categories
            </button>
            {categoryName ? (
              <h1 className="font-display text-5xl md:text-6xl tracking-[0.12em] metal-text uppercase">
                {categoryName}
              </h1>
            ) : (
              <div className="h-12 md:h-[3.75rem] w-56 md:w-80 bg-white/10 animate-pulse rounded" />
            )}
            <p className="font-serif font-light text-sv mt-4 text-base tracking-wide">
              Explore our premium {categoryName ? categoryName.toLowerCase() : 'curated'} collection.
            </p>
          </motion.div>

          <ProductGrid
            products={categoryProducts}
            loading={loading}
            skeletonCount={4}
          />
        </div>
      </main>

    </div>
  );
}
