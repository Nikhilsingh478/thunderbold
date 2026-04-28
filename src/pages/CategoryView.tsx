import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CustomCursor from '../components/CustomCursor';
import ScrollProgress from '../components/ScrollProgress';
import ProductGrid, { GridProduct } from '../components/products/ProductGrid';

export default function CategoryView() {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const [categoryProducts, setCategoryProducts] = useState<GridProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryName, setCategoryName] = useState('');

  useEffect(() => {
    if (!categoryId) return;
    window.scrollTo(0, 0);

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const [catRes, prodRes] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/products'),
        ]);
        if (!cancelled && catRes.ok) {
          const catData = await catRes.json();
          const cat = catData.categories?.find((c: { _id: string; name: string }) => c._id === categoryId);
          if (cat) setCategoryName(cat.name);
        }
        if (!cancelled && prodRes.ok) {
          const prodData = await prodRes.json();
          const filtered = (prodData.products || []).filter(
            (p: { categoryId?: string }) => String(p.categoryId) === String(categoryId),
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

      <main className="flex-1 pt-[164px] pb-24 px-6 md:px-16">
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
            <h1 className="font-display text-5xl md:text-6xl tracking-[0.12em] metal-text uppercase">
              {categoryName}
            </h1>
            <p className="font-serif font-light text-sv mt-4 text-base tracking-wide">
              Explore our premium {categoryName.toLowerCase()} collection.
            </p>
          </motion.div>

          <ProductGrid
            products={categoryProducts}
            loading={loading}
            skeletonCount={4}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}
