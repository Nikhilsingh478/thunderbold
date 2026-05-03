import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CustomCursor from '../components/CustomCursor';
import ScrollProgress from '../components/ScrollProgress';

interface Brand {
  _id: string;
  name: string;
}

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
};

function BrandSkeleton() {
  return (
    <div className="h-20 bg-white/[0.03] border border-white/8 rounded-xl animate-pulse" />
  );
}

export default function BrandsPage() {
  const navigate = useNavigate();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/brands')
      .then(r => r.json())
      .then(d => setBrands(d.brands || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="noise-overlay min-h-screen flex flex-col bg-void">
      <CustomCursor />
      <ScrollProgress />
      <Navbar />

      <main className="flex-1 pt-[108px] md:pt-[116px] pb-24 px-6 md:px-16">
        <div className="max-w-[800px] mx-auto">
          <motion.button
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            onClick={() => navigate('/')}
            className="flex items-center gap-2 font-condensed text-xs tracking-[0.18em] uppercase text-sv-mid hover:text-brass transition-colors duration-200 mb-10 md:mb-14"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </motion.button>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="mb-14 md:mb-20 text-center"
          >
            <div className="font-condensed font-semibold text-[0.64rem] md:text-[0.68rem] tracking-[0.36em] md:tracking-[0.40em] uppercase text-brass mb-5 flex items-center justify-center gap-3">
              <span className="w-5 h-px bg-brass-dim inline-block" />
              Collections
              <span className="w-5 h-px bg-brass-dim inline-block" />
            </div>
            <h1 className="font-display text-4xl md:text-6xl tracking-[0.12em] metal-text uppercase leading-none">
              All Brands
            </h1>
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
              className="mx-auto mt-5 h-px w-16 bg-gradient-to-r from-transparent via-brass/60 to-transparent origin-center"
            />
          </motion.div>

          {/* Brand List */}
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <BrandSkeleton key={i} />)}
            </div>
          ) : brands.length === 0 ? (
            <div className="text-center py-24">
              <p className="font-condensed text-sv-mid text-sm tracking-[0.2em] uppercase">
                No brands added yet.
              </p>
            </div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="space-y-3"
            >
              {brands.map((brand) => (
                <motion.button
                  key={brand._id}
                  variants={itemVariants}
                  onClick={() => navigate(`/brand/${brand._id}`)}
                  className="group w-full flex items-center justify-between px-6 md:px-8 py-5 md:py-6 bg-white/[0.03] border border-white/[0.08] rounded-xl hover:border-brass/40 hover:bg-brass/[0.04] transition-all duration-300 text-left"
                >
                  <div className="flex items-center gap-4">
                    {/* Brand initial circle */}
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-brass/10 border border-brass/20 flex items-center justify-center shrink-0 group-hover:bg-brass/20 transition-colors duration-300">
                      <span className="font-display text-base md:text-lg text-brass tracking-widest uppercase">
                        {brand.name.charAt(0)}
                      </span>
                    </div>
                    <h2 className="font-display text-lg md:text-2xl tracking-[0.12em] text-tb-white uppercase group-hover:text-brass transition-colors duration-300">
                      {brand.name}
                    </h2>
                  </div>
                  <ArrowRight
                    className="w-4 h-4 text-sv-mid group-hover:text-brass group-hover:translate-x-1 transition-all duration-300 shrink-0"
                  />
                </motion.button>
              ))}
            </motion.div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
