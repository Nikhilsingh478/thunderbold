import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { optimizeCloudinaryUrl, IMG_SIZES } from '../lib/cloudinary';
import { Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { fetchProducts, Product } from '../lib/products';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export default function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => inputRef.current?.focus(), 100);
      loadProducts();
    } else {
      document.body.style.overflow = '';
      setTimeout(() => setQuery(''), 300);
    }
  }, [isOpen]);

  const loadProducts = async () => {
    if (allProducts.length > 0) return; // Already loaded
    try {
      setLoading(true);
      const productsData = await fetchProducts();
      setAllProducts(productsData.products);
    } catch (error) {
      console.error('Failed to load products for search:', error);
      setAllProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) { setResults([]); return; }
    const filtered = allProducts.filter((product) =>
      (product.name ?? '').toLowerCase().includes(q) ||
      (product.description ?? '').toLowerCase().includes(q) ||
      (product.category ?? '').toLowerCase().includes(q)
    );
    setResults(filtered);
  }, [debouncedQuery, allProducts]);

  const handleSelect = useCallback((id: string) => {
    onClose();
    navigate(`/product/${id}`);
  }, [onClose, navigate]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[200] bg-[#070707]/98 backdrop-blur-2xl flex flex-col items-center pt-24 md:pt-32 px-6 md:px-16 overflow-y-auto"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 md:top-8 md:right-12 p-2 text-white/50 hover:text-white transition-colors focus:outline-none"
          >
            <X size={32} strokeWidth={1} />
          </button>

          {/* Search Input */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-[800px] relative mb-12 md:mb-16"
          >
            <Search className="absolute left-0 top-1/2 -translate-y-[60%] text-white/30" size={28} strokeWidth={1.5} />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="SEARCH THE COLLECTION..."
              className="w-full bg-transparent border-b border-white/20 text-2xl md:text-5xl lg:text-6xl font-display text-white placeholder-white/50 pb-4 pt-2 pl-12 md:pl-16 outline-none focus:border-brass transition-colors uppercase"
            />
          </motion.div>

          {/* Loading state */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-7 w-7 border-2 border-white/10 border-t-white/60" />
            </div>
          )}

          {/* Results Grid */}
          {!loading && query.trim().length > 0 && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="w-full max-w-[1200px] grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8 pb-32"
            >
              {results.length > 0 ? (
                results.map((prod, i) => (
                  <motion.div
                    key={prod._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => handleSelect(prod._id)}
                    className="group cursor-pointer flex flex-col"
                  >
                    <div className="overflow-hidden bg-[#0c0c0c] aspect-[3/4] relative border border-white/5 group-hover:border-white/20 transition-colors duration-500 rounded-sm">
                      <img
                        src={optimizeCloudinaryUrl(prod.image || '/placeholder.png', IMG_SIZES.card)}
                        alt={prod.name}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 group-hover:scale-[1.05] transition-transform duration-700 ease-[0.16,1,0.3,1]"
                        onError={(e) => { e.currentTarget.src = '/placeholder.png'; }}
                      />
                    </div>
                    <div className="mt-4">
                      <h3 className="font-condensed text-sm md:text-base tracking-[0.1em] text-tb-white group-hover:text-brass uppercase transition-colors">
                        {prod.name}
                      </h3>
                      <p className="font-condensed text-xs md:text-sm tracking-widest text-sv-mid mt-1">
                        {prod.price}
                      </p>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full text-center py-20 font-condensed text-sv tracking-[0.12em] text-base md:text-lg uppercase">
                  No products found for "{query}".
                </div>
              )}
            </motion.div>
          )}

          {/* Idle state */}
          {!loading && query.trim().length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-center font-condensed tracking-[0.2em] text-sm text-white/70 uppercase"
            >
              Type anything (e.g. Bootcut, Straight, Denim)
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
