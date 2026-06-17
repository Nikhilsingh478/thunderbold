import { Link, useLocation } from 'react-router-dom';
import { Home, ShoppingCart, Heart, User } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { modalController } from '../lib/modalController';

export default function BottomNav() {
  const location = useLocation();
  const { getTotalItems } = useCart();
  const { getWishlistCount } = useWishlist();
  const { user, loading: authLoading } = useAuth();

  if (location.pathname.startsWith('/admin')) return null;
  if (location.pathname.startsWith('/checkout')) return null;

  const p = location.pathname;
  const isHome      = p === '/';
  const isCart      = p.startsWith('/cart');
  const isWishlist  = p.startsWith('/wishlist');
  const isAccount   = p.startsWith('/profile') || p.startsWith('/orders');

  const cartCount     = getTotalItems();
  const wishlistCount = getWishlistCount();

  const tab = (active: boolean) =>
    `flex flex-1 flex-col items-center justify-center gap-[3px] h-full select-none transition-colors duration-150 ${
      active ? 'text-tb-white' : 'text-white/38'
    }`;

  const Badge = ({ count }: { count: number }) =>
    count > 0 ? (
      <span className="absolute -top-[5px] -right-[7px] min-w-[14px] h-[14px] bg-[#D4AA30] text-black text-[8px] font-bold rounded-full flex items-center justify-center leading-none px-[2px]">
        {count > 9 ? '9+' : count}
      </span>
    ) : null;

  const label = 'text-[9px] font-condensed tracking-[0.1em] uppercase';

  return (
    <nav
      id="tb-bottom-nav"
      className="md:hidden fixed bottom-0 left-0 right-0 z-[80]"
      style={{
        background: 'rgba(7,7,7,0.97)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="flex items-stretch h-[52px]">

        {/* ── Home ── */}
        <Link to="/" className={tab(isHome)}>
          <Home size={19} strokeWidth={isHome ? 2.2 : 1.5} />
          <span className={label}>Home</span>
        </Link>

        {/* ── Cart ── */}
        <Link to="/cart" className={tab(isCart)}>
          <span className="relative">
            <ShoppingCart size={19} strokeWidth={isCart ? 2.2 : 1.5} />
            <Badge count={cartCount} />
          </span>
          <span className={label}>Cart</span>
        </Link>

        {/* ── Wishlist / Saved ── */}
        <Link to="/wishlist" className={tab(isWishlist)}>
          <span className="relative">
            <Heart
              size={19}
              strokeWidth={isWishlist ? 2.2 : 1.5}
              fill={isWishlist ? 'currentColor' : 'none'}
            />
            <Badge count={wishlistCount} />
          </span>
          <span className={label}>Saved</span>
        </Link>

        {/* ── Account / Login ── */}
        {!authLoading && user ? (
          <Link to="/profile" className={tab(isAccount)}>
            <User size={19} strokeWidth={isAccount ? 2.2 : 1.5} />
            <span className={label}>Account</span>
          </Link>
        ) : (
          <button
            className={tab(false)}
            onClick={() => modalController.openModal('manual')}
          >
            <User size={19} strokeWidth={1.5} />
            <span className={label}>{authLoading ? '···' : 'Login'}</span>
          </button>
        )}

      </div>
    </nav>
  );
}
