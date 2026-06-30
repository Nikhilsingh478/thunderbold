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
        className="group w-full block overflow-hidden rounded-xl border border-brass/20 transition-all duration-500 relative"
        style={{
          background: 'linear-gradient(135deg, #7a6210 0%, #b8941a 50%, #7a6210 100%)'
        }}
      >
        <div className="relative h-[130px] md:h-[250px] flex items-center justify-center overflow-hidden">
          {/* Radial light highlight glow */}
          <div
            className="absolute inset-0 pointer-events-none opacity-20 group-hover:opacity-45 transition-opacity duration-700"
            style={{
              background: 'radial-gradient(circle at center, rgba(255,255,255,0.4) 0%, transparent 70%)',
            }}
          />

          {/* Premium background grid lines */}
          <div className="absolute inset-0 opacity-[0.04] group-hover:opacity-[0.06] transition-opacity duration-500 pointer-events-none bg-[linear-gradient(rgba(0,0,0,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.15)_1px,transparent_1px)] bg-[size:24px_24px]" />

          {/* Large background decorative initials */}
          <div className="absolute inset-0 flex items-center justify-center select-none pointer-events-none">
            <span
              className="font-display text-[9rem] md:text-[15rem] leading-none tracking-[0.05em] uppercase transition-all duration-700 select-none"
              style={{
                color: 'rgba(0,0,0,0.015)',
                WebkitTextStroke: '1px rgba(0,0,0,0.03)',
              }}
            >
              BRANDS
            </span>
          </div>

          <div className="relative z-10 w-full">
            {/* Mobile View */}
            <div className="flex md:hidden flex-col items-center justify-center gap-2 px-6 h-full">
              <h3 className="font-display text-xl tracking-[0.16em] uppercase text-neutral-950 leading-none">
                DISCOVER OUR <span className="font-bold underline decoration-neutral-950/20">BRANDS</span>
              </h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="font-condensed text-[10px] uppercase tracking-[0.2em] text-neutral-950 font-bold">
                  Explore Collections
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-neutral-950 group-hover:translate-x-1.5 transition-transform duration-300" />
              </div>
            </div>

            {/* Desktop View */}
            <div className="hidden md:flex flex-col items-center justify-center gap-3 px-12 h-full">
              <h3 className="font-display text-3xl md:text-[2.6rem] tracking-[0.2em] uppercase text-neutral-950 leading-none">
                DISCOVER OUR <span className="font-bold underline decoration-neutral-950/20">BRANDS</span>
              </h3>
              <p className="font-condensed text-[0.72rem] tracking-[0.25em] text-neutral-800 max-w-md uppercase">
                Browse our unique, hand-selected designer labels
              </p>
              <div className="flex items-center gap-2 mt-2 px-6 py-2.5 rounded-full border border-neutral-950/15 bg-neutral-950/[0.03] group-hover:border-neutral-950/30 group-hover:bg-neutral-950/[0.06] transition-all duration-300">
                <span className="font-condensed text-xs uppercase tracking-[0.2em] text-neutral-950 font-bold">
                  Explore Collections
                </span>
                <ArrowRight className="w-4 h-4 text-neutral-950 group-hover:translate-x-1.5 transition-transform duration-300" />
              </div>
            </div>
          </div>
        </div>
      </motion.button>
    </section>
  );
}
