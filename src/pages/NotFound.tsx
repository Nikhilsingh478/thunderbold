import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import CustomCursor from "../components/CustomCursor";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="noise-overlay min-h-screen flex flex-col items-center justify-center bg-[#070707] relative overflow-hidden">
      <CustomCursor />
      
      {/* Background massive ghost text */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
        className="absolute inset-0 flex items-center justify-center pointer-events-none z-0"
      >
        <span className="font-display text-[35vw] leading-none ghost-stroke opacity-30 select-none">
          404
        </span>
      </motion.div>

      {/* Foreground Content */}
      <div className="z-10 text-center flex flex-col items-center max-w-lg px-6">
        <motion.div
           initial={{ opacity: 0, y: 30 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
           className="flex flex-col items-center"
        >
          {/* Vertical accent line */}
          <div className="w-px h-20 bg-gradient-to-b from-transparent via-brass-bright/50 to-brass-bright mx-auto mb-8" />
          
          <h1 className="font-condensed text-xs md:text-sm tracking-[0.5em] uppercase text-brass mb-6">
            Thread Lost
          </h1>
          
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl tracking-[0.15em] uppercase metal-text mb-6 leading-tight">
            Pattern Not Found
          </h2>
          
          <p className="font-serif font-light text-sv text-base md:text-lg mb-12 leading-relaxed tracking-wide">
            The seam you're looking for seems to have frayed. This page doesn't exist in the Thunderbolt collection.
          </p>
          
          <button
            onClick={() => navigate('/')}
            className="px-10 py-5 font-condensed font-bold text-sm tracking-[0.2em] uppercase transition-all duration-300 clip-bolt bg-tb-white text-void hover:bg-white hover:scale-[1.03] shadow-[0_0_20px_rgba(255,255,255,0.1)] mx-auto flex items-center gap-3 group"
          >
            <span className="transition-transform duration-300 group-hover:-translate-x-1">←</span> 
            Return to Collection
          </button>
        </motion.div>
      </div>
      
      {/* Subtle Corner Accents for technical UI feel */}
      <div className="absolute top-8 left-8 w-6 h-6 border-t border-l border-white/10" />
      <div className="absolute top-8 right-8 w-6 h-6 border-t border-r border-white/10" />
      <div className="absolute bottom-8 left-8 w-6 h-6 border-b border-l border-white/10" />
      <div className="absolute bottom-8 right-8 w-6 h-6 border-b border-r border-white/10" />
    </div>
  );
};

export default NotFound;
