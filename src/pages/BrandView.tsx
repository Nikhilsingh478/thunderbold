import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CustomCursor from '../components/CustomCursor';
import ScrollProgress from '../components/ScrollProgress';
import ProductGrid, { type GridProduct } from '../components/products/ProductGrid';

interface Brand {
  _id: string;
  name: string;
  logoUrl?: string;
}

interface RawProduct extends GridProduct {
  brandId?: string;
  section?: string;
}

export default function BrandView() {
  const { brandId } = useParams<{ brandId: string }>();
  const navigate = useNavigate();

  const [brand, setBrand] = useState<Brand | null>(null);
  const [products, setProducts] = useState<GridProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [brandNotFound, setBrandNotFound] = useState(false);

  useEffect(() => {
    if (!brandId) return;

    const load = async () => {
      setLoading(true);
      try {
        const [brandsRes, productsRes] = await Promise.all([
          fetch('/api/brands'),
          fetch('/api/products'),
        ]);

        if (brandsRes.ok) {
          const bd = await brandsRes.json();
          const found = (bd.brands || []).find((b: Brand) => b._id === brandId);
          if (found) {
            setBrand(found);
          } else {
            setBrandNotFound(true);
          }
        }

        if (productsRes.ok) {
          const pd = await productsRes.json();
          const filtered = (pd.products || []).filter(
            (p: RawProduct) => p.brandId === brandId
          );
          setProducts(filtered);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [brandId]);

  if (!loading && brandNotFound) {
    return (
      <div className="noise-overlay min-h-screen flex flex-col bg-void">
        <CustomCursor />
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="font-condensed text-sv-mid text-sm tracking-[0.2em] uppercase mb-6">Brand not found</p>
            <button
              onClick={() => navigate('/brands')}
              className="font-condensed text-xs tracking-[0.18em] uppercase text-brass hover:text-brass-bright transition-colors"
            >
              ← View all brands
            </button>
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

      <main className="flex-1 pt-[108px] md:pt-[116px] pb-24 px-6 md:px-16">
        <div className="max-w-[1000px] mx-auto">

          {/* Back navigation */}
          <motion.button
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            onClick={() => navigate('/brands')}
            className="flex items-center gap-2 font-condensed text-xs tracking-[0.18em] uppercase text-sv-mid hover:text-brass transition-colors duration-200 mb-10 md:mb-14"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            All Brands
          </motion.button>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="mb-12 md:mb-20 text-center"
          >
            {brand?.logoUrl ? (
              <div className="mx-auto mb-5 w-20 h-20 rounded-full overflow-hidden border border-brass/20 bg-brass/10">
                <img src={brand.logoUrl} alt={brand.name} className="w-full h-full object-cover" />
              </div>
            ) : null}
            <div className="font-condensed font-semibold text-[0.64rem] md:text-[0.68rem] tracking-[0.36em] md:tracking-[0.40em] uppercase text-brass mb-5 flex items-center justify-center gap-3">
              <span className="w-5 h-px bg-brass-dim inline-block" />
              Brand Collection
              <span className="w-5 h-px bg-brass-dim inline-block" />
            </div>
            <h1 className="font-display text-4xl md:text-6xl tracking-[0.12em] metal-text uppercase leading-none">
              {loading ? (
                <span className="block w-48 h-10 bg-white/5 animate-pulse rounded mx-auto" />
              ) : (
                brand?.name ?? 'Brand'
              )}
            </h1>
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
              className="mx-auto mt-5 h-px w-16 bg-gradient-to-r from-transparent via-brass/60 to-transparent origin-center"
            />
          </motion.div>

          {/* Product Grid */}
          <ProductGrid
            products={products}
            loading={loading}
            skeletonCount={8}
            emptyState={
              <div className="text-center py-24">
                <p className="font-condensed text-sv-mid text-sm tracking-[0.2em] uppercase">
                  No products available for this brand yet.
                </p>
              </div>
            }
          />

        </div>
      </main>

      <Footer />
    </div>
  );
}
