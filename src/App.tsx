import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster as Sonner } from "./components/ui/sonner";
import { Toaster } from "./components/ui/toaster";
import { TooltipProvider } from "./components/ui/tooltip";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { WishlistProvider } from "./context/WishlistContext";
import { NotificationsProvider } from "./context/NotificationsContext";
import AppContent from "./AppContent";

const App = () => {
  return (
    <AuthProvider>
      <NotificationsProvider>
        <CartProvider>
          <WishlistProvider>
            <QueryClientProvider client={queryClient}>
              <TooltipProvider>
                <AppContent />
              </TooltipProvider>
            </QueryClientProvider>
          </WishlistProvider>
        </CartProvider>
      </NotificationsProvider>
    </AuthProvider>
  );
};

export default App;
