import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { optimizeCloudinaryUrl, IMG_SIZES } from '../lib/cloudinary';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CustomCursor from '../components/CustomCursor';
import ScrollProgress from '../components/ScrollProgress';
import { useWishlist } from '../context/WishlistContext';
import PriceDisplay from '../components/PriceDisplay';

export default function CategoryView() {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [categoryProducts, setCategoryProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryName, setCategoryName] = useState('');

  useEffect(() => {
    if (!categoryId) return;
    window.scrollTo(0, 0);

    const load = async () => {
      setLoading(true);
      try {
        const [catRes, prodRes] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/products'),
        ]);
        if (catRes.ok) {
          const catData = await catRes.json();
          const cat = catData.categories?.find(c => c._id === categoryId);
          if (cat) setCategoryName(cat.name);
        }
        if (prodRes.ok) {
          const prodData = await prodRes.json();
          const filtered = (prodData.products || []).filter(
            (p: any) => String(p.categoryId) === String(categoryId)
          );
          setCategoryProducts(filtered);
        }
      } catch {
        setCategoryProducts([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [categoryId]);

  const handleWishlistClick = useCallback((e: React.MouseEvent, product: any) => {
    e.stopPropagation();
    toggleWishlist({
      productId: product._id,
      name: product.name,
      price: product.price,
      image: product.images?.[0] || product.image,
    });
  }, [toggleWishlist]);

  return (
    <div className="noise-overlay min-h-screen flex flex-col bg-void">
      <CustomCursor />
      <ScrollProgress />
      <Navbar />

      <main className="flex-1 pt-[164px] pb-24 px-6 md:px-16">
        <div className="max-w-[1400px] mx-auto">
          {/* Header */}
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

          {/* Product Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-10">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex flex-col">
                    <div className="aspect-[3/4] bg-white/5 rounded-sm animate-pulse" />
                    <div className="mt-5 space-y-2">
                      <div className="h-4 bg-white/5 rounded animate-pulse w-3/4" />
                      <div className="h-3 bg-white/5 rounded animate-pulse w-1/4" />
                    </div>
                  </div>
                ))
              : categoryProducts.map((prod, i) => (
              <motion.div
                key={prod._id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: i * 0.05 }}
                className="group cursor-pointer flex flex-col"
                onClick={() => navigate(`/product/${prod._id}`)}
              >
                <div className="overflow-hidden bg-[#0c0c0c] aspect-[3/4] relative border border-white/5 group-hover:border-white/10 transition-colors duration-500 rounded-sm">
                  {/* Wishlist Icon */}
                  <button
                    onClick={(e) => handleWishlistClick(e, prod)}
                    className="absolute top-3 right-3 z-10 p-2 bg-black/60 backdrop-blur-sm rounded-full text-white/60 hover:text-red-400 hover:bg-red-900/20 transition-all duration-200"
                  >
                    <Heart 
                      size={16} 
                      className={isInWishlist(prod._id) ? 'fill-current text-red-400' : ''}
                    />
                  </button>
                  
                  <motion.img
                    src={optimizeCloudinaryUrl(prod.images?.[0] || prod.image, IMG_SIZES.card)}
                    alt={prod.name}
                    className="w-full h-full object-cover object-center scale-[1.02] group-hover:scale-[1.08] transition-transform duration-[0.8s] ease-[0.16,1,0.3,1] grayscale-[0.1]"
                    loading={i < 4 ? "eager" : "lazy"}
                    decoding="async"
                    onError={(e) => { e.currentTarget.src = '/placeholder.png'; }}
                  />
                </div>
                <div className="mt-5 flex flex-col">
                  <h3 className="font-condensed text-lg tracking-[0.15em] uppercase text-tb-white group-hover:text-brass transition-colors duration-300">
                    {prod.name}
                  </h3>
                  <div className="mt-1">
                    <PriceDisplay price={prod.price} size="sm" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
