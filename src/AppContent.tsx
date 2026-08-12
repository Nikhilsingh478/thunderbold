import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "./components/ui/sonner";
import { Toaster } from "./components/ui/toaster";
import { useAuth } from "./context/AuthContext";
import LoginModal from "./components/auth/LoginModal";
import { executeStoredAction } from "./lib/requireAuth";
import { modalController, ModalControlEvent } from "./lib/modalController";
import { useEffect, useState, lazy, Suspense } from "react";
import { motion } from "framer-motion";

import SplashScreen from "./components/SplashScreen";
import PWAUpdatePrompt from "./components/PWAUpdatePrompt";
import AppUpdatePrompt from "./components/AppUpdatePrompt";
import NotificationPermissionPrompt from "./components/NotificationPermissionPrompt";
import ScrollToTop from "./components/ScrollToTop";
import BottomNav from "./components/BottomNav";

// Eagerly loaded (small / always needed on first paint)
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import About from "./pages/About";
import CategoryView from "./pages/CategoryView";
import BrandsPage from "./pages/BrandsPage";
import BrandView from "./pages/BrandView";

// Lazy loaded (heavy pages — split into separate JS chunks)
const ProductView = lazy(() => import("./pages/ProductView"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Cart = lazy(() => import("./pages/Cart"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const Admin = lazy(() => import("./pages/Admin"));
const Orders = lazy(() => import("./pages/Orders"));
const Profile = lazy(() => import("./pages/Profile"));
const DealsPage = lazy(() => import("./pages/DealsPage"));
const Policies = lazy(() => import("./pages/Policies"));

/**
 * Branded page loader — shown while lazy-loaded route chunks are fetching.
 * Minimal and fast: a white bolt icon with a sliding shimmer bar.
 */
function PageLoader() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-5"
      style={{ backgroundColor: '#0a0a0a' }}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.7, 0.4, 0.7] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        aria-hidden
      >
        <svg width="32" height="36" viewBox="0 0 718 820" fill="none">
          <path d="M 465 104 L 150 490 L 352 492 L 226 790 L 604 376 L 604 374 L 378 374 L 354 436 L 446 437 L 403 498 L 402 496 L 418 450 L 331 449 Z" fill="#F8C80A"/>
          <path d="M 445 139 L 164 483 L 359 483 L 362 486 L 247 759 L 589 381 L 383 381 L 365 429 L 456 429 L 459 432 L 379 545 L 378 539 L 409 458 L 324 457 L 322 455 Z" fill="#FEFEFE"/>
        </svg>
      </motion.div>

      {/* Shimmer bar */}
      <div className="w-20 h-px bg-white/8 relative overflow-hidden rounded-full">
        <motion.div
          className="absolute inset-y-0 w-10 rounded-full"
          style={{
            background:
              'linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent)',
          }}
          animate={{ x: [-40, 40] }}
          transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
    </div>
  );
}

const AppContent = () => {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [modalSource, setModalSource] = useState<'requireAuth' | 'delayedPrompt' | 'manual'>('manual');
  const { user } = useAuth();

  useEffect(() => {
    const unsubscribe = modalController.subscribe((event: ModalControlEvent) => {
      if (event.type === 'open-login-modal') {
        setShowLoginModal(true);
        setModalSource(event.source);
      } else if (event.type === 'close-login-modal') {
        setShowLoginModal(false);
      }
    });

    const handleShowLoginModal = (e: CustomEvent) => {
      setShowLoginModal(true);
      setModalSource(e.detail?.source || 'manual');
    };
    const handleCloseLoginModal = () => setShowLoginModal(false);

    window.addEventListener('open-login-modal', handleShowLoginModal as EventListener);
    window.addEventListener('close-login-modal', handleCloseLoginModal);

    return () => {
      unsubscribe();
      window.removeEventListener('open-login-modal', handleShowLoginModal as EventListener);
      window.removeEventListener('close-login-modal', handleCloseLoginModal);
    };
  }, []);

  // Delayed login prompt for unauthenticated users
  useEffect(() => {
    if (user) return;
    const promptShown = sessionStorage.getItem('login_prompt_shown');
    if (promptShown) return;
    const timer = setTimeout(() => {
      modalController.openModal('delayedPrompt');
      sessionStorage.setItem('login_prompt_shown', 'true');
    }, 10000);
    return () => clearTimeout(timer);
  }, [user]);

  const handleLoginModalClose = () => {
    setShowLoginModal(false);
    modalController.closeModal();
    executeStoredAction();
  };

  return (
    <>
      {/* Cinematic branded splash — shown once per session, overlays the app */}
      <SplashScreen />

      <BrowserRouter>
        <ScrollToTop />
        <BottomNav />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/about" element={<About />} />
            <Route path="/category/:categoryId" element={<CategoryView />} />
            <Route path="/deals/:dealKey" element={<DealsPage />} />
            <Route path="/product/:productId" element={<ProductView />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/brands" element={<BrandsPage />} />
            <Route path="/brand/:brandId" element={<BrandView />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/policies" element={<Policies />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
      <Toaster />
      <Sonner />
      <LoginModal
        isOpen={showLoginModal}
        onClose={handleLoginModalClose}
        isDelayedPrompt={modalSource === 'delayedPrompt'}
      />

      {/* PWA lifecycle toasts — update available + offline ready */}
      <PWAUpdatePrompt />

      {/* Native App Store update prompt */}
      <AppUpdatePrompt />

      {/* Push notification permission prompt — shown 3s after first login */}
      <NotificationPermissionPrompt />
    </>
  );
};

export default AppContent;
