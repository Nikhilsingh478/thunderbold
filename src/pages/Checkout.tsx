import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ScrollProgress from '../components/ScrollProgress';
import CustomCursor from '../components/CustomCursor';
import AddressForm, { type AddressData } from '../components/checkout/AddressForm';
import ProductSummary from '../components/checkout/ProductSummary';
import OrderConfirmation from '../components/checkout/OrderConfirmation';

const STORAGE_KEY = 'user_address';

function loadSavedAddress(): AddressData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, clearCartData } = useCart();
  
  // Get cart items from location state or use current cart
  // Handle both single product and cart checkout
  const singleProductData = location.state?.productName ? [location.state] : null;
  const cartItems = location.state?.cartItems || singleProductData || items;
  
  // Debug: Log the data to identify NaN source
  console.log("CHECKOUT DEBUG: cartItems:", cartItems);
  console.log("CHECKOUT DEBUG: location.state:", location.state);
  
  // Calculate total amount with proper price parsing
  const totalAmount = (cartItems?.reduce((total, item) => {
    let price: number;
    if (typeof item.price === 'string') {
      price = parseFloat(item.price.replace(/[^\d.]/g, ''));
    } else if (typeof item.price === 'number') {
      price = item.price;
    } else {
      price = 0;
    }
    return total + (price * (item.quantity || 0));
  }, 0) || 0);
  
  console.log("CHECKOUT DEBUG: totalAmount:", totalAmount);
  
  const [submitting, setSubmitting] = useState(false);
  const [savedAddress] = useState<AddressData | null>(loadSavedAddress);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [submittedAddress, setSubmittedAddress] = useState<AddressData | null>(null);

  useEffect(() => { 
    // Scroll to top first, then to address form after a short delay
    window.scrollTo(0, 0);
    setTimeout(() => {
      const addressForm = document.getElementById('address-form');
      if (addressForm) {
        addressForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 800);
  }, []);

  // If no cart items, redirect back
  useEffect(() => {
    if (!cartItems || cartItems.length === 0) navigate('/cart', { replace: true });
  }, [cartItems, navigate]);

  const handleSubmit = async (address: AddressData) => {
    if (!user) {
      toast.error('Please login to place an order');
      navigate('/login');
      return;
    }

    setSubmitting(true);
    setSubmittedAddress(address);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(address));

    try {
      console.log("CHECKOUT: Starting order submission...");
      
      // Prepare products array for order API
      const orderProducts = cartItems.map(item => ({
        productId: item.productId || item.productUrl?.split('/').pop() || 'unknown',
        name: item.name || item.productName || 'Unknown Product',
        price: typeof item.price === 'string' ? parseFloat(item.price.replace(/[^\d.]/g, '')) : (item.price || 0),
        size: item.size || 'N/A',
        quantity: item.quantity || 1,
        image: item.image || item.productImage || '/placeholder.png'
      }));

      const orderData = {
        products: orderProducts,
        address: {
          fullName: address.fullName,
          phone: address.phone,
          addressLine1: address.addressLine1,
          addressLine2: address.addressLine2 || '',
          city: address.city,
          state: address.state,
          pincode: address.pincode,
          landmark: address.landmark || ''
        },
        paymentMethod: 'COD'
      };

      console.log("CHECKOUT: Order data prepared:", JSON.stringify(orderData, null, 2));
      console.log("CHECKOUT: Sending request to /api/orders/create");

      // Get auth token
      const token = await user.getIdToken();
      
      const response = await fetch('/api/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(orderData)
      });

      console.log("CHECKOUT: Response received");
      console.log("CHECKOUT: Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("CHECKOUT: HTTP error - status:", response.status);
        console.error("CHECKOUT: Response text:", errorText);
        toast.error(`Order failed with status ${response.status}. Please try again.`);
        setSubmitting(false);
        return;
      }

      const result = await response.json();
      console.log("CHECKOUT: Response body:", JSON.stringify(result, null, 2));

      if (result.error) {
        console.error("CHECKOUT: API returned error:", result.error);
        toast.error(`Order failed: ${result.error}. Please try again.`);
        setSubmitting(false);
        return;
      }

      console.log("CHECKOUT: Order created successfully:", result.orderId);
      
      // Clear cart after successful order only if it was a cart checkout
      if (location.state?.cartItems) {
        await clearCartData();
      }
      
      toast.success('Order placed successfully!');
      setShowConfirmation(true);
      setSubmitting(false);
      
    } catch (error) {
      console.error("CHECKOUT: Network error during order submission:", error);
      console.error("CHECKOUT: Error details:", {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
      toast.error('Network error. Please check your connection and try again.');
      setSubmitting(false);
    }
  };

  if (!cartItems || cartItems.length === 0) return null;

  return (
    <div className="noise-overlay min-h-screen flex flex-col bg-void">
      <CustomCursor />
      <ScrollProgress />
      <Navbar />

      <main className="flex-1 pt-28 pb-24 px-5 md:px-16">
        <div className="max-w-[1100px] mx-auto">
          {/* Back */}
          <motion.button
            onClick={() => navigate(-1)}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="font-condensed font-semibold text-xs tracking-[0.18em] uppercase text-sv-mid hover:text-brass-bright transition-colors duration-200 mb-10 flex items-center gap-2 group"
          >
            <span className="transition-transform duration-300 group-hover:-translate-x-1">Back to Cart</span>
          </motion.button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Address Form */}
            <div>
              <h2 className="font-display text-2xl tracking-[0.1em] text-tb-white uppercase mb-6">
                Delivery Address
              </h2>
              <AddressForm 
                onSubmit={handleSubmit}
                submitting={submitting}
                savedAddress={savedAddress}
              />
            </div>

            {/* Order Summary */}
            <div>
              <ProductSummary 
                items={cartItems}
                totalAmount={totalAmount}
              />
            </div>
          </div>
        </div>
      </main>
      
      <Footer />

      {/* Order Confirmation Modal */}
      {showConfirmation && submittedAddress && (
        <OrderConfirmation
          address={submittedAddress}
          items={cartItems}
          totalAmount={totalAmount}
          onClose={() => navigate('/orders')}
        />
      )}
    </div>
  );
}
