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

/** Stable-width skeleton placeholder shown while Firebase auth resolves.
 *  Matches the exact dimensions of the profile circle so no layout shift occurs. */
function AuthSkeleton({ size = 32 }: { size?: number }) {
  return (
    <div
      className="rounded-full bg-white/[0.06] animate-pulse flex-shrink-0"
      style={{ width: size, height: size }}
    />
  );
}

let hasNavbarAnimatedThisSession = false;

const Navbar = () => {
  const { user, loading: authLoading, logout } = useAuth();
  const { getTotalItems } = useCart();
  const { getWishlistCount } = useWishlist();
  const navigate = useNavigate();

  const [shouldAnimate, setShouldAnimate] = useState(!hasNavbarAnimatedThisSession);

  useEffect(() => {
    hasNavbarAnimatedThisSession = true;
  }, []);


  const baseLinks = [
    { name: 'Categories', href: '/' },
    { name: 'Brands', href: '/brands' },
    { name: 'About Us', href: '/about' },
    { name: 'Policies', href: '/policies' },
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
    // rAF throttle: coalesce rapid scroll events into one paint cycle.
    // passive:true tells the browser this listener never calls preventDefault()
    // — allows the browser to begin scrolling immediately without waiting for JS.
    let rafId = 0;
    const handleScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        setScrolled(window.scrollY > 50);
      });
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  useEffect(() => {
    const handler = () => setIsSearchOpen(true);
    window.addEventListener('open-search-overlay', handler);
    return () => window.removeEventListener('open-search-overlay', handler);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    if (userMenuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userMenuOpen]);

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
      clipPath: 'circle(0% at 40px 40px)',
      transition: { duration: 0.3, ease: [0.32, 0, 0.67, 0] as [number, number, number, number] },
    },
    open: {
      clipPath: 'circle(150% at 40px 40px)',
      transition: { duration: 0.38, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
    },
  };

  const linkVariants = {
    closed: { opacity: 0, x: 40 },
    open: { opacity: 1, x: 0, transition: { delay: 0.1, duration: 0.25, ease: 'easeOut' as const } },
  };

  useEffect(() => {
    const ua = navigator.userAgent || '';
    const href = window.location.href || '';
    const isTwa = href.includes('app_version=') || href.includes('twa=');
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches ||
      (window.navigator as any).standalone === true ||
      isTwa;
    const isWebView =
      isStandalone ||
      /\bwv\b/i.test(ua) ||
      /Android.*Version\/[\d.]+ /.test(ua) ||
      typeof (window as any).Android !== 'undefined';

    if (isWebView) {
      document.documentElement.style.setProperty('--tb-banner-h', '0px');
      const banner = document.getElementById('apk-banner');
      if (banner) banner.style.display = 'none';
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      <motion.nav
        id="tb-navbar"
        variants={navVariants}
        initial={shouldAnimate ? "hidden" : false}
        animate="visible"
        style={{ top: 'var(--tb-banner-h, 36px)', paddingTop: 'env(safe-area-inset-top)', willChange: 'transform, opacity' }}
        className={`fixed left-0 w-full px-6 md:px-[52px] md:py-6 flex items-center justify-between transition-all duration-300 z-[100] ${
          scrolled ? 'py-4 bg-[#070707]/95 backdrop-blur-lg border-b border-white/5 shadow-lg' : 'pt-4 pb-5 bg-transparent'
        }`}
      >
        {/* Mobile Layout */}
        <div className="flex w-full items-center justify-between md:hidden">
          {/* Hamburger Menu on Left */}
          <div className="z-[110]">
            <motion.button
              variants={itemVariants}
              onClick={() => setIsOpen(!isOpen)}
              className="flex flex-col justify-center items-center w-9 h-9 relative focus:outline-none group"
              aria-label="Toggle menu"
            >
              <span className={`w-6 h-px bg-white block transition-all duration-300 ease-out origin-center ${isOpen ? 'rotate-45 translate-y-[1px]' : '-translate-y-[3px] group-hover:bg-brass-bright'}`} />
              <span className={`w-6 h-px bg-white block transition-all duration-300 ease-out origin-center ${isOpen ? '-rotate-45 -translate-y-[1px]' : 'translate-y-[3px] group-hover:bg-brass-bright'}`} />
            </motion.button>
          </div>

          {/* Heading Logo in Center */}
          <div className="absolute left-1/2 -translate-x-1/2 z-[110]">
            <Link
              to="/"
              onClick={() => setIsOpen(false)}
              className="decoration-none hover:opacity-90 flex items-center"
            >
              <motion.img
                variants={itemVariants}
                src="/loader_assets/thunderbold-wordmark.svg"
                alt="Thunderbold"
                className="h-4 sm:h-5 w-auto"
              />
            </Link>
          </div>

          {/* Search Icon on Right */}
          <div className="z-[110] flex items-center">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-2 text-sv-mid hover:text-white transition-colors duration-200"
              aria-label="Search"
            >
              <Search size={19} />
            </button>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:flex w-full items-center justify-between">
          <Link
            to="/"
            className="z-[110] relative decoration-none hover:opacity-90 flex items-center"
          >
            <motion.img
              variants={itemVariants}
              src="/loader_assets/thunderbold-wordmark.svg"
              alt="Thunderbold"
              className="h-5 md:h-6 w-auto"
            />
          </Link>

          <div className="flex items-center gap-8">
            {/* Search Bar */}
            <motion.button
              variants={itemVariants}
              onClick={() => setIsSearchOpen(true)}
              aria-label="Open search"
              className="group flex items-center gap-2.5 px-4 py-2 border border-white/15 hover:border-white/30 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] transition-all duration-300 focus:outline-none w-[196px] xl:w-[228px]"
            >
              <Search
                size={14}
                strokeWidth={2}
                className="text-zinc-300 group-hover:text-white transition-colors duration-300 flex-shrink-0"
              />
              <span className="font-display font-medium text-[0.7rem] tracking-[0.14em] uppercase text-zinc-300 group-hover:text-white transition-colors duration-300 truncate">
                Search styles & fits…
              </span>
            </motion.button>

            {/* Nav links */}
            {links.map(link => (
              <motion.div variants={itemVariants} key={link.name}>
                <Link
                  to={link.href}
                  className="group font-display font-medium text-[0.75rem] tracking-[0.14em] uppercase text-zinc-200 hover:text-white transition-colors duration-300 relative"
                >
                  {link.name}
                  <span className="absolute -bottom-2 left-0 w-0 h-px bg-brass-bright group-hover:w-full transition-all duration-300 ease-in-out" />
                </Link>
              </motion.div>
            ))}

            {/* Wishlist & Cart */}
            <motion.div variants={itemVariants} className="flex items-center gap-3">
              <Link
                to="/wishlist"
                className="relative p-2 text-zinc-300 hover:text-white transition-colors duration-200 group"
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
                className="relative p-2 text-zinc-300 hover:text-white transition-colors duration-200 group"
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
              {authLoading ? (
                <AuthSkeleton size={32} />
              ) : user ? (
                <>
                  <button
                    onClick={() => setUserMenuOpen(v => !v)}
                    className="flex items-center gap-2 group"
                    aria-label="Account menu"
                  >
                    <div className="w-8 h-8 rounded-full bg-brass/20 border border-brass/40 flex items-center justify-center flex-shrink-0 group-hover:border-brass/70 transition-colors duration-200">
                      <span className="font-display font-bold text-[0.65rem] tracking-wide text-brass">{initials}</span>
                    </div>
                    <ChevronDown
                      size={14}
                      className={`text-zinc-300 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.97 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute right-0 top-full mt-3 w-52 bg-[#0e0e0e] border border-white/15 rounded-xl shadow-2xl overflow-hidden z-[200]"
                      >
                        <div className="px-4 py-3.5 border-b border-white/10">
                          <p className="font-display text-xs font-semibold text-white truncate">{displayName}</p>
                          <p className="font-display text-[0.7rem] text-zinc-400 truncate mt-0.5">{user.email}</p>
                        </div>
                        <div className="py-1">
                          <Link
                            to="/profile"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 font-display font-medium text-[0.7rem] tracking-[0.12em] uppercase text-zinc-200 hover:text-white hover:bg-white/5 transition-all duration-150"
                          >
                            <User className="w-3.5 h-3.5 flex-shrink-0 text-brass" />
                            My Profile
                          </Link>
                          <Link
                            to="/orders"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 font-display font-medium text-[0.7rem] tracking-[0.12em] uppercase text-zinc-200 hover:text-white hover:bg-white/5 transition-all duration-150"
                          >
                            <Package className="w-3.5 h-3.5 flex-shrink-0 text-brass" />
                            My Orders
                          </Link>
                          <div className="h-px bg-white/10 my-1" />
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-2.5 font-display font-medium text-[0.7rem] tracking-[0.12em] uppercase text-zinc-200 hover:text-red-400 hover:bg-red-400/5 transition-all duration-150"
                          >
                            <LogOut className="w-3.5 h-3.5 flex-shrink-0 text-red-400" />
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
                  className="font-display font-semibold text-xs tracking-wider uppercase px-4 py-2 border border-white/20 hover:border-brass transition-all duration-200 text-white rounded-lg"
                >
                  Login
                </button>
              )}
            </motion.div>
          </div>
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

              {/* Logout — only show on mobile where bottom nav handles Profile/Orders/Login */}
              {!authLoading && user && (
                <motion.div initial="closed" animate="open" exit="closed" variants={linkVariants} custom={links.length}>
                  <button
                    onClick={handleLogout}
                    className="font-display text-4xl md:text-5xl tracking-[0.28em] text-sv-mid hover:text-red-400 transition-colors"
                  >
                    Logout
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
              <span className="font-display text-[0.65rem] tracking-[0.3em] text-zinc-300 font-medium uppercase">
                Thunderbold Brand World
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
