import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster as Sonner } from "./components/ui/sonner";
import { Toaster } from "./components/ui/toaster";
import { TooltipProvider } from "./components/ui/tooltip";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { WishlistProvider } from "./context/WishlistContext";
import { NotificationsProvider } from "./context/NotificationsContext";
import AppContent from "./AppContent";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
    },
  },
});

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
