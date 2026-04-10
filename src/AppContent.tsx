import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "./components/ui/sonner";
import { Toaster } from "./components/ui/toaster";
import { useAuth } from "./context/AuthContext";
import LoginModal from "./components/auth/LoginModal";
import { executeStoredAction } from "./lib/requireAuth";
import { modalController, ModalControlEvent } from "./lib/modalController";
import { useEffect, useState, lazy, Suspense } from "react";

import AnnouncementBar from "./components/AnnouncementBar";

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

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-void">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/10 border-t-white/60" />
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
      <AnnouncementBar />
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/about" element={<About />} />
            <Route path="/category/:categoryId" element={<CategoryView />} />
            <Route path="/product/:productId" element={<ProductView />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/checkout" element={<Checkout />} />
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
    </>
  );
};

export default AppContent;
