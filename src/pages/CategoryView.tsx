import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CustomCursor from '../components/CustomCursor';
import ScrollProgress from '../components/ScrollProgress';
import { fetchProductsByCategory, getCategories } from '../lib/products';
import { useWishlist } from '../context/WishlistContext';

export default function CategoryView() {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [categoryProducts, setCategoryProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState({});
  
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        if (response.ok) {
          const data = await response.json();
          const categoryMap = {};
          data.categories.forEach(cat => {
            categoryMap[cat._id] = cat.name;
          });
          setCategories(categoryMap);
        }
      } catch (error) {
        console.error('Failed to load categories:', error);
      }
    };
    
    loadCategories();
  }, []);

  // Get category name from categories map or fallback
  const categoryName = categories[categoryId] || 'Unknown Category';

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        console.log('=== CATEGORY FILTER DEBUG ===');
        console.log('CATEGORY ID FROM URL:', categoryId);
        const products = await fetchProductsByCategory(categoryId || '');
        console.log('FILTERED PRODUCTS COUNT:', products.length);
        console.log('FILTERED PRODUCTS:', products.map(p => ({
          name: p.name,
          categoryId: p.categoryId,
          match: String(p.categoryId) === String(categoryId)
        })));
        setCategoryProducts(products);
      } catch (error) {
        console.error('Failed to load products:', error);
        setCategoryProducts([]);
      } finally {
        setLoading(false);
      }
    };

    if (categoryId) {
      loadProducts();
    }
    window.scrollTo(0, 0);
  }, [categoryId]);

  const handleWishlistClick = (e: React.MouseEvent, product: any) => {
    e.stopPropagation(); // Prevent navigation to product page
    
    toggleWishlist({
      productId: product._id,
      name: product.name,
      price: product.price,
      image: product.image,
    });
  };

  return (
    <div className="noise-overlay min-h-screen flex flex-col bg-void">
      <CustomCursor />
      <ScrollProgress />
      <Navbar />

      <main className="flex-1 pt-32 pb-24 px-6 md:px-16">
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
            <p className="font-serif italic font-light text-sv-mid mt-4 text-lg">
              Explore our premium {categoryName.toLowerCase()} collection.
            </p>
          </motion.div>

          {/* Product Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-10">
            {categoryProducts.map((prod, i) => (
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
                    src={prod.images?.[0] || prod.image}
                    alt={prod.name}
                    className="w-full h-full object-cover object-center scale-[1.02] group-hover:scale-[1.08] transition-transform duration-[0.8s] ease-[0.16,1,0.3,1] grayscale-[0.1]"
                    loading={i < 4 ? "eager" : "lazy"}
                    decoding="async"
                  />
                </div>
                <div className="mt-5 flex flex-col">
                  <h3 className="font-condensed text-lg tracking-[0.15em] uppercase text-tb-white group-hover:text-brass transition-colors duration-300">
                    {prod.name}
                  </h3>
                  <div className="flex justify-between items-center mt-1">
                    <span className="font-condensed text-sm tracking-wider text-tb-white">
                      ¥{prod.price}
                    </span>
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
