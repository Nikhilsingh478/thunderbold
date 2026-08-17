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
import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { SplashScreen } from "@capacitor/splash-screen";

const App = () => {
  // Hide the native splash screen only after React has mounted and painted.
  // Must NOT be called from main.tsx (which runs before render) — that would
  // dismiss the splash before the WebView has painted, causing a black screen.
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      SplashScreen.hide({ fadeOutDuration: 300 }).catch(() => {});
    }
  }, []);

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
