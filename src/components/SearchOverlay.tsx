import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PRODUCTS, Product } from '@/data/products';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      document.body.style.overflow = '';
      setTimeout(() => setQuery(''), 300); // clear after animation
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    if (query.trim().length > 0) {
      const lowerQuery = query.toLowerCase();
      const filtered = PRODUCTS.filter(p => 
        p.name.toLowerCase().includes(lowerQuery) || 
        p.description.toLowerCase().includes(lowerQuery) ||
        p.categoryId.toLowerCase().includes(lowerQuery)
      );
      setResults(filtered);
    } else {
      setResults([]);
    }
  }, [query]);

  const handleSelect = (id: string) => {
    onClose();
    navigate(`/product/${id}`);
  };

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

          {/* Search Input Container */}
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

          {/* Results Grid */}
          {query.trim().length > 0 && (
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="w-full max-w-[1200px] grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8 pb-32"
            >
              {results.length > 0 ? (
                results.map((prod, i) => (
                  <motion.div
                    key={prod.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => handleSelect(prod.id)}
                    className="group cursor-pointer flex flex-col"
                  >
                    <div className="overflow-hidden bg-[#0c0c0c] aspect-[3/4] relative border border-white/5 group-hover:border-white/20 transition-colors duration-500 rounded-sm">
                       <img
                         src={prod.images[0]}
                         alt={prod.name}
                         className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 group-hover:scale-[1.05] transition-transform duration-700 ease-[0.16,1,0.3,1]"
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
                <div className="col-span-full text-center py-20 font-serif italic text-sv-mid text-lg md:text-xl">
                  No products found for "{query}".
                </div>
              )}
            </motion.div>
          )}

          {/* Fallback idle state */}
          {query.trim().length === 0 && (
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
