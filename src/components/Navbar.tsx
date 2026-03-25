import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

const Navbar = () => {
  const links = [
    { name: 'Contact', href: '#footer' },
    { name: 'Craft', href: '#craft' },
    { name: 'Details', href: '#details' },
    { name: 'Legacy', href: '#legacy' }
  ];
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navVariants = {
    hidden: { y: -100, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as [number, number, number, number], staggerChildren: 0.1, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: -20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.6, ease: 'easeOut' as const } }
  };

  const menuVariants = {
    closed: { 
      clipPath: 'circle(0% at calc(100% - 40px) 40px)',
      transition: { duration: 0.6, ease: [0.32, 0, 0.67, 0] as [number, number, number, number] }
    },
    open: { 
      clipPath: 'circle(150% at calc(100% - 40px) 40px)',
      transition: { duration: 0.8, ease: [0.32, 0, 0.67, 0] as [number, number, number, number] }
    }
  };

  const linkVariants = {
    closed: { y: 40, opacity: 0, filter: 'blur(4px)' },
    open: { y: 0, opacity: 1, filter: 'blur(0px)', transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } }
  };

  useEffect(() => {
    if (isOpen) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '0px';
    }
    return () => { 
      document.body.style.overflow = '';
      document.body.style.paddingRight = '0px';
    };
  }, [isOpen]);

  return (
    <>
      <motion.nav
        variants={navVariants}
        initial="hidden"
        animate="visible"
        className={`fixed top-0 left-0 w-full px-6 py-5 md:px-[52px] md:py-6 flex items-center justify-between transition-colors duration-500 z-[100] ${
          scrolled ? 'bg-[#070707]/90 backdrop-blur-md border-b border-white/5' : 'bg-transparent'
        }`}
      >
        <motion.a variants={itemVariants} href="#" className="font-display text-xl md:text-2xl tracking-[0.28em] text-tb-white z-[110] relative">
          THUNDER<span className="brass-text">⚡</span>BOLT
        </motion.a>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-10">
          {links.map((link) => (
            <motion.a
              variants={itemVariants}
              key={link.name}
              href={link.href}
              className="group font-condensed font-semibold text-[0.72rem] tracking-[0.20em] uppercase text-sv-mid hover:text-white transition-colors duration-300 relative"
            >
              {link.name}
              <span className="absolute -bottom-2 left-0 w-0 h-px bg-brass-bright group-hover:w-full transition-all duration-300 ease-in-out" />
            </motion.a>
          ))}
        </div>

        {/* Mobile Toggle Button */}
        <motion.button
          variants={itemVariants}
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden flex flex-col justify-center items-center w-8 h-8 z-[110] relative focus:outline-none group"
          aria-label="Toggle menu"
        >
          <span className={`w-7 h-px bg-white block transition-all duration-300 ease-out origin-center ${isOpen ? 'rotate-45 translate-y-[1px]' : '-translate-y-1 group-hover:bg-brass-bright'}`} />
          <span className={`w-7 h-px bg-white block transition-all duration-300 ease-out origin-center ${isOpen ? '-rotate-45 -translate-y-[1px]' : 'translate-y-1 group-hover:bg-brass-bright'}`} />
        </motion.button>
      </motion.nav>

      {/* Mobile Fullscreen Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={menuVariants}
            initial="closed"
            animate="open"
            exit="closed"
            className="fixed inset-0 bg-[#070707]/95 backdrop-blur-xl z-[90] flex flex-col items-center justify-center overflow-hidden"
          >
            <div className="flex flex-col items-center gap-6">
              {links.map((link, i) => (
                <motion.a
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="font-display text-4xl tracking-[0.16em] uppercase text-white hover:text-brass-bright transition-colors duration-300 relative block"
                  initial="closed"
                  animate="open"
                  exit="closed"
                  variants={linkVariants}
                  transition={{ delay: i * 0.08 + 0.2 }}
                >
                  <span className="metal-text block py-2">{link.name}</span>
                </motion.a>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="absolute bottom-12 flex flex-col items-center gap-4"
            >
              <div className="w-px h-12 bg-gradient-to-b from-brass-bright/50 to-transparent" />
              <span className="font-condensed text-[0.6rem] tracking-[0.4em] text-sv-mid uppercase">
                Thunderbolt Brand World
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
