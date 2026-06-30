import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export default function BrandsSection() {
  const navigate = useNavigate();

  return (
    <section className="px-3 md:px-0 pt-10 md:pt-20 pb-2">
      <motion.button
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        onClick={() => navigate('/brands')}
        aria-label="Browse all brands"
        className="group w-full block overflow-hidden rounded-xl border border-white/[0.08] hover:border-brass/35 bg-[#080808] transition-all duration-500 relative"
      >
        <div className="relative h-[130px] md:h-[250px] flex items-center justify-center overflow-hidden">
          {/* Radial gold background glow */}
          <div
            className="absolute inset-0 pointer-events-none opacity-40 group-hover:opacity-65 transition-opacity duration-700"
            style={{
              background: 'radial-gradient(circle at center, rgba(184,130,15,0.18) 0%, transparent 65%)',
            }}
          />

          {/* Premium background grid lines */}
          <div className="absolute inset-0 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity duration-500 pointer-events-none bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:24px_24px]" />

          {/* Large background decorative initials */}
          <div className="absolute inset-0 flex items-center justify-center select-none pointer-events-none">
            <span
              className="font-display text-[9rem] md:text-[15rem] leading-none tracking-[0.05em] uppercase transition-all duration-700 select-none"
              style={{
                color: 'rgba(255,255,255,0.01)',
                WebkitTextStroke: '1px rgba(255,255,255,0.015)',
              }}
            >
              BRANDS
            </span>
          </div>

          <div className="relative z-10 w-full">
            {/* Mobile View */}
            <div className="flex md:hidden flex-col items-center justify-center gap-2.5 px-6 h-full">
              <span className="font-condensed text-[9px] uppercase tracking-[0.35em] text-brass font-bold">
                Curated Houses
              </span>
              <h3 className="font-display text-xl tracking-[0.16em] uppercase text-tb-white leading-none">
                DISCOVER OUR <span className="brass-text font-bold">BRANDS</span>
              </h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="font-condensed text-[10px] uppercase tracking-[0.2em] text-white/65 group-hover:text-white transition-colors duration-300">
                  Explore Collections
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-brass group-hover:translate-x-1.5 transition-transform duration-300" />
              </div>
            </div>

            {/* Desktop View */}
            <div className="hidden md:flex flex-col items-center justify-center gap-4 px-12 h-full">
              <span className="font-condensed text-[11px] uppercase tracking-[0.45em] text-brass font-bold">
                Curated Portfolio
              </span>
              <h3 className="font-display text-3xl md:text-[2.6rem] tracking-[0.2em] uppercase text-tb-white leading-none">
                DISCOVER OUR <span className="brass-text font-bold">BRANDS</span>
              </h3>
              <p className="font-condensed text-[0.72rem] tracking-[0.25em] text-white/60 max-w-md uppercase">
                Browse our unique, hand-selected designer labels
              </p>
              <div className="flex items-center gap-2 mt-2 px-6 py-2.5 rounded-full border border-white/10 bg-white/[0.02] group-hover:border-brass/60 group-hover:bg-brass/[0.03] transition-all duration-300">
                <span className="font-condensed text-xs uppercase tracking-[0.2em] text-tb-white">
                  Explore Collections
                </span>
                <ArrowRight className="w-4 h-4 text-brass group-hover:translate-x-1.5 transition-transform duration-300" />
              </div>
            </div>
          </div>
        </div>
      </motion.button>
    </section>
  );
}
