import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export default function BrandsSection() {
  const navigate = useNavigate();

  return (
    <section className="pt-10 md:pt-20 pb-2">
      <motion.button
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        onClick={() => navigate('/brands')}
        aria-label="Browse all brands"
        className="group w-full block overflow-hidden transition-all duration-500 relative"
        style={{ border: '1px solid rgba(184,130,15,0.5)' }}
      >
        <div
          className="relative h-[56px] md:h-[240px] flex items-center justify-center overflow-hidden"
          style={{ background: 'linear-gradient(90deg, #b8820f, #e8b93a 50%, #b8820f)' }}
        >
          {/* Shine overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.18) 0%, transparent 55%)' }}
          />

          {/* Hover brighten */}
          <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-500 pointer-events-none" />

          {/* Decorative large letter initials */}
          <div className="absolute inset-0 flex items-center justify-center select-none pointer-events-none">
            <span className="font-display text-[12rem] md:text-[18rem] leading-none tracking-tight uppercase"
              style={{ color: 'rgba(0,0,0,0.07)' }}>
              TB
            </span>
          </div>

          <div className="relative z-10 flex flex-col items-center gap-4 md:gap-5 px-4 text-center">
            {/* Mobile: compact single-line */}
            <div className="flex md:hidden items-center gap-3">
              <div className="h-px w-5" style={{ background: 'rgba(0,0,0,0.3)' }} />
              <span className="font-condensed text-[0.65rem] uppercase tracking-[0.32em]"
                style={{ color: 'rgba(0,0,0,0.72)' }}>
                Discover Our Brands
              </span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform duration-300"
                style={{ color: 'rgba(0,0,0,0.6)' }} />
              <div className="h-px w-5" style={{ background: 'rgba(0,0,0,0.3)' }} />
            </div>

            {/* Desktop: full layout */}
            <p className="hidden md:block font-condensed font-semibold text-[0.74rem] tracking-[0.42em] uppercase"
              style={{ color: 'rgba(0,0,0,0.55)' }}>
              Thunderbold Curated
            </p>
            <h3 className="hidden md:block font-display text-2xl md:text-4xl tracking-[0.14em] uppercase leading-none"
              style={{ color: 'rgba(0,0,0,0.82)' }}>
              Discover Our Brands
            </h3>
            <div className="hidden md:flex items-center gap-3 mt-1">
              <div className="h-px w-6" style={{ background: 'rgba(0,0,0,0.25)' }} />
              <p className="font-condensed text-xs tracking-[0.18em] uppercase"
                style={{ color: 'rgba(0,0,0,0.55)' }}>
                Browse all collections
              </p>
              <div className="h-px w-6" style={{ background: 'rgba(0,0,0,0.25)' }} />
            </div>
            <div
              className="hidden md:flex items-center gap-2 mt-1 px-5 py-2.5 rounded-full transition-all duration-300"
              style={{ border: '1px solid rgba(0,0,0,0.3)', background: 'rgba(0,0,0,0.08)' }}
            >
              <span className="font-condensed text-xs uppercase tracking-[0.2em]"
                style={{ color: 'rgba(0,0,0,0.72)' }}>
                View All Brands
              </span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-300"
                style={{ color: 'rgba(0,0,0,0.6)' }} />
            </div>
          </div>
        </div>
      </motion.button>
    </section>
  );
}
