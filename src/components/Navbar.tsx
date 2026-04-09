import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, Heart, ShoppingCart, User, Package, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { toast } from 'sonner';
import SearchOverlay from './SearchOverlay';

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() || '')
    .join('');
}

const Navbar = () => {
  const { user, logout } = useAuth();
  const { getTotalItems } = useCart();
  const { getWishlistCount } = useWishlist();
  const navigate = useNavigate();

  const baseLinks = [
    { name: 'Categories', href: '/' },
    { name: 'About Us', href: '/about' },
  ];

  const links = baseLinks;
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const cartItemsCount = getTotalItems();
  const wishlistItemsCount = getWishlistCount();

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Account';
  const initials = getInitials(displayName);

  const handleLogout = async () => {
    setUserMenuOpen(false);
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/');
    } catch {
      toast.error('Failed to logout. Please try again.');
    }
  };

  const handleLogin = () => {
    window.dispatchEvent(new Event('open-login-modal'));
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close user menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    if (userMenuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userMenuOpen]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const navVariants = {
    hidden: { y: -100, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as [number, number, number, number], staggerChildren: 0.1, delayChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { y: -20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.6, ease: 'easeOut' as const } },
  };

  const menuVariants = {
    closed: {
      clipPath: 'circle(0% at calc(100% - 40px) 40px)',
      transition: { duration: 0.6, ease: [0.32, 0, 0.67, 0] as [number, number, number, number] },
    },
    open: {
      clipPath: 'circle(150% at calc(100% - 40px) 40px)',
      transition: { duration: 0.8, ease: [0.32, 0, 0.67, 0] as [number, number, number, number] },
    },
  };

  const linkVariants = {
    closed: { opacity: 0, x: 100 },
    open: { opacity: 1, x: 0, transition: { delay: 0.3, duration: 0.6, ease: 'easeOut' as const } },
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
        <Link
          to="/"
          className="font-display text-xl md:text-2xl tracking-[0.28em] text-tb-white z-[110] relative decoration-none hover:opacity-90"
        >
          <motion.span variants={itemVariants}>
            THUNDER<span className="brass-text">BOLT</span>
          </motion.span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-10">
          {links.map(link => (
            <motion.div variants={itemVariants} key={link.name}>
              <Link
                to={link.href}
                className="group font-condensed font-semibold text-[0.72rem] tracking-[0.20em] uppercase text-sv-mid hover:text-white transition-colors duration-300 relative"
              >
                {link.name}
                <span className="absolute -bottom-2 left-0 w-0 h-px bg-brass-bright group-hover:w-full transition-all duration-300 ease-in-out" />
              </Link>
            </motion.div>
          ))}

          {/* Cart & Wishlist Icons */}
          <motion.div variants={itemVariants} className="flex items-center gap-3">
            <Link
              to="/wishlist"
              className="relative p-2 text-sv-mid hover:text-white transition-colors duration-200 group"
            >
              <Heart size={20} className="group-hover:scale-110 transition-transform duration-200" />
              {wishlistItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-brass text-black text-xs font-bold rounded-full flex items-center justify-center">
                  {wishlistItemsCount}
                </span>
              )}
            </Link>
            <Link
              to="/cart"
              className="relative p-2 text-sv-mid hover:text-white transition-colors duration-200 group"
            >
              <ShoppingCart size={20} className="group-hover:scale-110 transition-transform duration-200" />
              {cartItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-brass text-black text-xs font-bold rounded-full flex items-center justify-center">
                  {cartItemsCount}
                </span>
              )}
            </Link>
          </motion.div>

          {/* Desktop Auth */}
          <motion.div variants={itemVariants} className="relative" ref={userMenuRef}>
            {user ? (
              <>
                <button
                  onClick={() => setUserMenuOpen(v => !v)}
                  className="flex items-center gap-2 group"
                  aria-label="Account menu"
                >
                  <div className="w-8 h-8 rounded-full bg-brass/20 border border-brass/40 flex items-center justify-center flex-shrink-0 group-hover:border-brass/70 transition-colors duration-200">
                    <span className="font-display text-[0.65rem] tracking-wide brass-text">{initials}</span>
                  </div>
                  <ChevronDown
                    size={14}
                    className={`text-sv-mid transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.97 }}
                      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                      className="absolute right-0 top-full mt-3 w-52 bg-[#0e0e0e] border border-white/[0.09] rounded-xl shadow-2xl overflow-hidden z-[200]"
                    >
                      {/* User Info */}
                      <div className="px-4 py-3.5 border-b border-white/[0.07]">
                        <p className="font-body text-xs font-medium text-tb-white truncate">{displayName}</p>
                        <p className="font-body text-[0.7rem] text-sv-dim truncate mt-0.5">{user.email}</p>
                      </div>

                      {/* Menu Items */}
                      <div className="py-1">
                        <Link
                          to="/profile"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 font-condensed text-[0.68rem] tracking-[0.14em] uppercase text-sv-mid hover:text-white hover:bg-white/5 transition-all duration-150"
                        >
                          <User className="w-3.5 h-3.5 flex-shrink-0" />
                          My Profile
                        </Link>
                        <Link
                          to="/orders"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 font-condensed text-[0.68rem] tracking-[0.14em] uppercase text-sv-mid hover:text-white hover:bg-white/5 transition-all duration-150"
                        >
                          <Package className="w-3.5 h-3.5 flex-shrink-0" />
                          My Orders
                        </Link>
                        <div className="h-px bg-white/[0.06] my-1" />
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-2.5 font-condensed text-[0.68rem] tracking-[0.14em] uppercase text-sv-mid hover:text-red-400 hover:bg-red-400/5 transition-all duration-150"
                        >
                          <LogOut className="w-3.5 h-3.5 flex-shrink-0" />
                          Logout
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            ) : (
              <button
                onClick={handleLogin}
                className="text-sm px-4 py-2 border border-neutral-700 hover:border-yellow-500 transition-colors duration-200 text-sv-mid hover:text-white"
              >
                Login
              </button>
            )}
          </motion.div>

          <motion.button
            variants={itemVariants}
            onClick={() => setIsSearchOpen(true)}
            className="text-sv-mid hover:text-tb-white transition-colors focus:outline-none"
            aria-label="Search"
          >
            <Search size={20} strokeWidth={1.5} />
          </motion.button>
        </div>

        {/* Mobile Header Right */}
        <div className="md:hidden flex items-center gap-3 z-[110]">
          <div className="flex items-center gap-1">
            <Link to="/wishlist" className="relative p-2 text-sv-mid hover:text-white transition-colors duration-200">
              <Heart size={18} />
              {wishlistItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-brass text-black text-xs font-bold rounded-full flex items-center justify-center">
                  {wishlistItemsCount}
                </span>
              )}
            </Link>
            <Link to="/cart" className="relative p-2 text-sv-mid hover:text-white transition-colors duration-200">
              <ShoppingCart size={18} />
              {cartItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-brass text-black text-xs font-bold rounded-full flex items-center justify-center">
                  {cartItemsCount}
                </span>
              )}
            </Link>
          </div>

          {/* Mobile user avatar / login */}
          {user ? (
            <Link
              to="/profile"
              className="w-8 h-8 rounded-full bg-brass/20 border border-brass/40 flex items-center justify-center hover:border-brass/70 transition-colors"
            >
              <span className="font-display text-[0.65rem] tracking-wide brass-text">{initials}</span>
            </Link>
          ) : (
            <button
              onClick={handleLogin}
              className="text-sm px-3 py-1.5 border border-neutral-700 hover:border-yellow-500 transition-colors duration-200 text-sv-mid hover:text-white"
            >
              Login
            </button>
          )}

          {/* Hamburger */}
          <motion.button
            variants={itemVariants}
            onClick={() => setIsOpen(!isOpen)}
            className="flex flex-col justify-center items-center w-8 h-8 relative focus:outline-none group"
            aria-label="Toggle menu"
          >
            <span className={`w-7 h-px bg-white block transition-all duration-300 ease-out origin-center ${isOpen ? 'rotate-45 translate-y-[1px]' : '-translate-y-1 group-hover:bg-brass-bright'}`} />
            <span className={`w-7 h-px bg-white block transition-all duration-300 ease-out origin-center ${isOpen ? '-rotate-45 -translate-y-[1px]' : 'translate-y-1 group-hover:bg-brass-bright'}`} />
          </motion.button>
        </div>
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
                <motion.div
                  key={link.name}
                  initial="closed"
                  animate="open"
                  exit="closed"
                  variants={linkVariants}
                  custom={i}
                >
                  <Link
                    to={link.href}
                    onClick={() => setIsOpen(false)}
                    className="font-display text-4xl md:text-5xl tracking-[0.28em] text-tb-white decoration-none hover:opacity-90 transition-opacity"
                  >
                    {link.name}
                  </Link>
                </motion.div>
              ))}

              {user && (
                <>
                  <motion.div initial="closed" animate="open" exit="closed" variants={linkVariants} custom={links.length}>
                    <Link
                      to="/profile"
                      onClick={() => setIsOpen(false)}
                      className="font-display text-4xl md:text-5xl tracking-[0.28em] text-tb-white decoration-none hover:opacity-90 transition-opacity"
                    >
                      Profile
                    </Link>
                  </motion.div>
                  <motion.div initial="closed" animate="open" exit="closed" variants={linkVariants} custom={links.length + 1}>
                    <Link
                      to="/orders"
                      onClick={() => setIsOpen(false)}
                      className="font-display text-4xl md:text-5xl tracking-[0.28em] text-tb-white decoration-none hover:opacity-90 transition-opacity"
                    >
                      Orders
                    </Link>
                  </motion.div>
                  <motion.div initial="closed" animate="open" exit="closed" variants={linkVariants} custom={links.length + 2}>
                    <button
                      onClick={handleLogout}
                      className="font-display text-4xl md:text-5xl tracking-[0.28em] text-sv-mid hover:text-red-400 transition-colors"
                    >
                      Logout
                    </button>
                  </motion.div>
                </>
              )}

              {!user && (
                <motion.div initial="closed" animate="open" exit="closed" variants={linkVariants} custom={links.length}>
                  <button
                    onClick={() => { setIsOpen(false); handleLogin(); }}
                    className="font-display text-4xl md:text-5xl tracking-[0.28em] brass-text hover:opacity-80 transition-opacity"
                  >
                    Login
                  </button>
                </motion.div>
              )}
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

      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
};

export default Navbar;
