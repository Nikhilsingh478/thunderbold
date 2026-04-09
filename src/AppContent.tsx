import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "./components/ui/sonner";
import { Toaster } from "./components/ui/toaster";
import { useAuth } from "./context/AuthContext";
import LoginModal from "./components/auth/LoginModal";
import { executeStoredAction } from "./lib/requireAuth";
import { modalController, ModalControlEvent } from "./lib/modalController";
import { useEffect, useState } from "react";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import About from "./pages/About";
import CategoryView from "./pages/CategoryView";
import ProductView from "./pages/ProductView";
import Checkout from "./pages/Checkout";
import Cart from "./pages/Cart";
import Wishlist from "./pages/Wishlist";
import Admin from "./pages/Admin";
import Orders from "./pages/Orders";
import Profile from "./pages/Profile";

const AppContent = () => {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [modalSource, setModalSource] = useState<'requireAuth' | 'delayedPrompt' | 'manual'>('manual');
  const { user } = useAuth();

  useEffect(() => {
    // Subscribe to modal controller events
    const unsubscribe = modalController.subscribe((event: ModalControlEvent) => {
      if (event.type === 'open-login-modal') {
        setShowLoginModal(true);
        setModalSource(event.source);
      } else if (event.type === 'close-login-modal') {
        setShowLoginModal(false);
      }
    });

    // Also handle legacy DOM events for backward compatibility
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

  // Delayed login prompt
  useEffect(() => {
    // Only show delayed prompt if user is not logged in
    if (user) return;

    // Check if prompt was already shown this session
    const promptShown = sessionStorage.getItem('login_prompt_shown');
    if (promptShown) return;

    // Show prompt after 10 seconds
    const timer = setTimeout(() => {
      modalController.openModal('delayedPrompt');
      sessionStorage.setItem('login_prompt_shown', 'true');
    }, 10000); // 10 seconds

    return () => clearTimeout(timer);
  }, [user]);

  const handleLoginModalClose = () => {
    setShowLoginModal(false);
    modalController.closeModal();
    executeStoredAction(); // Execute stored action after successful login
  };

  return (
    <>
      <BrowserRouter>
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
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
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
