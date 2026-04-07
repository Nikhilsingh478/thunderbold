import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "./components/ui/sonner";
import { Toaster } from "./components/ui/toaster";
import { useAuth } from "./context/AuthContext";
import LoginModal from "./components/auth/LoginModal";
import { executeStoredAction } from "./lib/requireAuth";
import { useEffect, useState } from "react";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import About from "./pages/About";
import CategoryView from "./pages/CategoryView";
import ProductView from "./pages/ProductView";
import Checkout from "./pages/Checkout";

const AppContent = () => {
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    const handleShowLoginModal = () => setShowLoginModal(true);
    const handleCloseLoginModal = () => setShowLoginModal(false);

    window.addEventListener('showLoginModal', handleShowLoginModal);
    window.addEventListener('closeLoginModal', handleCloseLoginModal);

    return () => {
      window.removeEventListener('showLoginModal', handleShowLoginModal);
      window.removeEventListener('closeLoginModal', handleCloseLoginModal);
    };
  }, []);

  const handleLoginModalClose = () => {
    setShowLoginModal(false);
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
          <Route path="/checkout" element={<Checkout />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
      <Sonner />
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={handleLoginModalClose} 
      />
    </>
  );
};

export default AppContent;
