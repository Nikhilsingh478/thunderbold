import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

/**
 * Homepage brands section — displayed above the Special Offer (LiveSale) section.
 * Full-width clickable banner with zero horizontal padding, routes to /brands.
 */
export default function BrandsSection() {
  const navigate = useNavigate();

  return (
    <section className="pt-10 md:pt-20 pb-2">
      {/* Clickable brand banner — full bleed, no side padding */}
      <motion.button
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        onClick={() => navigate('/brands')}
        aria-label="Browse all brands"
        className="group w-full block overflow-hidden border-y border-amber-700/30 hover:border-amber-500/60 transition-all duration-500 relative"
      >
        {/* Gradient background */}
        <div className="relative h-[56px] md:h-[240px] bg-gradient-to-br from-[#2a2006] via-[#1e1804] to-[#0d0b02] flex items-center justify-center overflow-hidden">

          {/* Animated grain overlay */}
          <div className="absolute inset-0 opacity-[0.06] bg-noise pointer-events-none" />

          {/* Strong radial glow — centre */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[700px] h-[240px] bg-amber-500/25 blur-[90px] rounded-full group-hover:bg-amber-400/35 transition-colors duration-700" />
          </div>

          {/* Secondary warm accent glow */}
          <div className="absolute left-1/4 top-1/2 -translate-y-1/2 w-[300px] h-[160px] bg-yellow-600/20 blur-[60px] rounded-full pointer-events-none" />
          <div className="absolute right-1/4 top-1/2 -translate-y-1/2 w-[300px] h-[160px] bg-orange-700/15 blur-[60px] rounded-full pointer-events-none" />

          {/* Thin gold top and bottom lines */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />

          {/* Decorative large letter initials */}
          <div className="absolute inset-0 flex items-center justify-center select-none pointer-events-none">
            <span className="font-display text-[12rem] md:text-[18rem] leading-none tracking-tight text-white/[0.025] uppercase">
              TB
            </span>
          </div>

          <div className="relative z-10 flex flex-col items-center gap-4 md:gap-5 px-4 text-center">
            {/* Mobile: compact single-line */}
            <div className="flex md:hidden items-center gap-3">
              <div className="h-px w-5 bg-brass/50" />
              <span className="font-condensed text-[0.65rem] text-brass uppercase tracking-[0.32em]">
                Discover Our Brands
              </span>
              <ArrowRight className="w-3 h-3 text-brass group-hover:translate-x-0.5 transition-transform duration-300" />
              <div className="h-px w-5 bg-brass/50" />
            </div>

            {/* Desktop: full layout */}
            <p className="hidden md:block font-condensed font-semibold text-[0.74rem] tracking-[0.42em] uppercase text-brass">
              Thunderbolt Curated
            </p>
            <h3 className="hidden md:block font-display text-2xl md:text-4xl tracking-[0.14em] metal-text uppercase leading-none">
              Discover Our Brands
            </h3>
            <div className="hidden md:flex items-center gap-3 mt-1">
              <div className="h-px w-6 bg-brass/50" />
              <p className="font-condensed text-xs text-sv tracking-[0.18em] uppercase">
                Browse all collections
              </p>
              <div className="h-px w-6 bg-brass/50" />
            </div>
            <div className="hidden md:flex items-center gap-2 mt-1 px-5 py-2.5 border border-brass/40 rounded-full group-hover:bg-brass/10 group-hover:border-brass/70 transition-all duration-300">
              <span className="font-condensed text-xs text-brass uppercase tracking-[0.2em]">
                View All Brands
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-brass group-hover:translate-x-1 transition-transform duration-300" />
            </div>
          </div>
        </div>
      </motion.button>
    </section>
  );
}
