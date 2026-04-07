import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { CATEGORY_IMAGES } from '@/data/products';

const categories = [
  { id: 'bootcut', name: 'Bootcut' },
  { id: 'straight', name: 'Straight Fit' },
  { id: 'momfit', name: 'Mom Fit' },
  { id: 'baggy', name: 'Baggy' },
  { id: 'trousers', name: 'Trousers' },
  { id: 'distressed', name: 'Distressed' },
];

const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
};

export default function CategoriesSection() {
  const navigate = useNavigate();

  return (
    <section className="min-h-screen pt-32 pb-24 px-6 md:px-16" id="categories">
      <div className="max-w-[1000px] mx-auto">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
           className="mb-12 md:mb-20 text-center"
        >
          <div className="font-condensed font-semibold text-[0.64rem] md:text-[0.68rem] tracking-[0.36em] md:tracking-[0.40em] uppercase text-brass mb-6 flex items-center justify-center gap-3">
            <span className="w-5 h-px bg-brass-dim inline-block" />
            Shop By Fit
            <span className="w-5 h-px bg-brass-dim inline-block" />
          </div>
          <h1 className="font-display text-4xl md:text-6xl tracking-[0.12em] metal-text uppercase">
            The Denim Collection
          </h1>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3 md:gap-x-12 md:gap-y-8 lg:gap-x-16 mx-auto"
        >
          {categories.map((cat, index) => (
            <motion.div
              key={cat.id}
              variants={itemVariants}
              onClick={() => navigate(`/category/${cat.id}`)}
              className="group cursor-pointer flex flex-col relative"
            >
              {/* Image Container */}
              <div className="overflow-hidden bg-[#0c0c0c] aspect-[3/4] relative border border-white/5 group-hover:border-white/10 transition-colors duration-500 rounded-sm">
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                {/* Glow effect */}
                <div className="absolute inset-0 bg-brass-bright/5 opacity-0 group-hover:opacity-100 blur-2xl transition-opacity duration-500 z-0 pointer-events-none" />

                <motion.img
                  src={CATEGORY_IMAGES[cat.id]}
                  alt={cat.name}
                  className="w-full h-full object-cover object-center scale-[1.01] group-hover:scale-[1.08] transition-transform duration-[0.85s] ease-[0.16,1,0.3,1] z-0 relative grayscale-[0.2]"
                  loading={index < 3 ? "eager" : "lazy"}
                  decoding="async"
                />
              </div>

              {/* Text Context */}
              <div className="mt-3 md:mt-6 flex flex-col items-center justify-center">
                <h3 className="font-condensed text-xl md:text-2xl tracking-[0.2em] uppercase text-tb-white group-hover:text-brass transition-colors duration-300">
                  {cat.name}
                </h3>
                <div className="w-0 h-px bg-brass mt-3 group-hover:w-8 transition-all duration-500 ease-in-out" />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
