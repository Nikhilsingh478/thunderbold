import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircle, ChevronLeft } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CustomCursor from '../components/CustomCursor';
import ScrollProgress from '../components/ScrollProgress';
import ProductGrid, { GridProduct } from '../components/products/ProductGrid';

/**
 * Configuration map for the deals routes.
 * Adding a new tier (e.g. /deals/under-1499) is a one-line edit here —
 * the page, the API call, and the heading all derive from this config.
 */
const DEAL_CONFIG: Record<string, { maxPrice: number; heading: string; subheading: string }> = {
  'under-999': {
    maxPrice: 999,
    heading: 'Jeans Under ₹999',
    subheading: 'Premium denim at a price that strikes hard.',
  },
  'under-699': {
    maxPrice: 699,
    heading: 'Jeans Under ₹699',
    subheading: 'Lightning value. Every pair built to last.',
  },
};

export default function DealsPage() {
  const { dealKey } = useParams<{ dealKey: string }>();
  const config = dealKey ? DEAL_CONFIG[dealKey] : undefined;

  const [products, setProducts] = useState<GridProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Always run hooks in the same order — guard the fetch by config presence.
  useEffect(() => {
    if (!config) return;
    let cancelled = false;
    window.scrollTo(0, 0);

    setLoading(true);
    setError(null);

    fetch(`/api/products?maxPrice=${config.maxPrice}`)
      .then(async (r) => {
        if (!r.ok) throw new Error(`Request failed (${r.status})`);
        return r.json();
      })
      .then((data) => {
        if (cancelled) return;
        setProducts(Array.isArray(data?.products) ? data.products : []);
      })
      .catch((e) => {
        if (cancelled) return;
        console.error('DealsPage fetch failed:', e);
        setError("Couldn't load deals right now. Please try again.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [config]);

  const emptyState = useMemo(() => (
    <div className="text-center py-24">
      <p className="font-condensed text-sm tracking-[0.18em] uppercase text-sv-mid">
        No products in this deal yet.
      </p>
      <Link
        to="/"
        className="inline-block mt-6 font-condensed text-xs tracking-[0.18em] uppercase text-brass hover:text-brass-bright transition-colors"
      >
        ← Back to Home
      </Link>
    </div>
  ), []);

  if (!config) return <Navigate to="/" replace />;

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
            <Link
              to="/"
              className="font-condensed font-semibold text-xs tracking-[0.18em] uppercase text-sv-mid hover:text-brass transition-colors duration-200 mb-8 inline-flex items-center gap-2"
            >
              <ChevronLeft size={14} strokeWidth={2} />
              Back to Home
            </Link>
            <h1 className="font-display text-5xl md:text-6xl tracking-[0.12em] metal-text uppercase">
              {config.heading}
            </h1>
            <p className="font-serif font-light text-sv mt-4 text-base tracking-wide">
              {config.subheading}
            </p>
          </motion.div>

          {error ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <AlertCircle className="w-10 h-10 text-red-400/70 mb-4" strokeWidth={1.4} />
              <p className="font-condensed text-sm tracking-[0.18em] uppercase text-sv-mid mb-6">
                {error}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="font-condensed text-xs tracking-[0.18em] uppercase px-5 py-2.5 border border-white/20 text-tb-white hover:border-brass/40 hover:text-brass transition-colors duration-200"
              >
                Try Again
              </button>
            </div>
          ) : (
            <ProductGrid
              products={products}
              loading={loading}
              emptyState={emptyState}
            />
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
