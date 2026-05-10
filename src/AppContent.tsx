import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "./components/ui/sonner";
import { Toaster } from "./components/ui/toaster";
import { useAuth } from "./context/AuthContext";
import LoginModal from "./components/auth/LoginModal";
import { executeStoredAction } from "./lib/requireAuth";
import { modalController, ModalControlEvent } from "./lib/modalController";
import { useEffect, useState, lazy, Suspense } from "react";
import { motion } from "framer-motion";

import AnnouncementBar from "./components/AnnouncementBar";
import SplashScreen from "./components/SplashScreen";
import PWAUpdatePrompt from "./components/PWAUpdatePrompt";

// Eagerly loaded (small / always needed on first paint)
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import About from "./pages/About";
import CategoryView from "./pages/CategoryView";

// Lazy loaded (heavy pages — split into separate JS chunks)
const ProductView = lazy(() => import("./pages/ProductView"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Cart = lazy(() => import("./pages/Cart"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const Admin = lazy(() => import("./pages/Admin"));
const Orders = lazy(() => import("./pages/Orders"));
const Profile = lazy(() => import("./pages/Profile"));
const DealsPage = lazy(() => import("./pages/DealsPage"));
const BrandsPage = lazy(() => import("./pages/BrandsPage"));
const BrandView = lazy(() => import("./pages/BrandView"));

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
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <path
            d="M13.2 2.5L4.8 13.2C4.6 13.5 4.8 14 5.2 14H11L9.8 21.2C9.7 21.8 10.5 22.1 10.9 21.6L19.2 10.8C19.4 10.5 19.2 10 18.8 10H13L14.2 2.8C14.3 2.2 13.6 1.9 13.2 2.5Z"
            fill="white"
          />
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

      <AnnouncementBar />
      <BrowserRouter>
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
    </>
  );
};

export default AppContent;
