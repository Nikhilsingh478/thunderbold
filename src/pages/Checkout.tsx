import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ScrollProgress from '../components/ScrollProgress';
import CustomCursor from '../components/CustomCursor';
import AddressForm, { type AddressData } from '../components/checkout/AddressForm';
import ProductSummary from '../components/checkout/ProductSummary';
import OrderConfirmation from '../components/checkout/OrderConfirmation';

export interface CheckoutState {
  productName: string;
  productImage: string;
  price: string;
  size: string;
  quantity: number;
  categoryName: string;
  productUrl: string;
}

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
  const product = location.state as CheckoutState | null;
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

  // If no product state, redirect back
  useEffect(() => {
    if (!product) navigate('/', { replace: true });
  }, [product, navigate]);

  if (!product) return null;

  const handleSubmit = async (address: AddressData) => {
    setSubmitting(true);
    setSubmittedAddress(address);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(address));

    // Save order to database first
    try {
      const orderData = {
        product: {
          name: product.productName,
          price: product.price,
          size: product.size,
          quantity: product.quantity
        },
        address: {
          fullName: address.fullName,
          phone: address.phone,
          addressLine1: address.addressLine1,
          addressLine2: address.addressLine2,
          city: address.city,
          state: address.state,
          pincode: address.pincode,
          landmark: address.landmark
        }
      };

      const response = await fetch('/api/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        console.error('Failed to save order to database');
        toast.error('Failed to save order. Redirecting to WhatsApp anyway...');
      } else {
        const result = await response.json();
        if (result.success) {
          console.log('Order saved to database:', result.data);
        } else {
          console.error('Error saving order:', result.error);
          toast.error('Failed to save order. Redirecting to WhatsApp anyway...');
        }
      }
    } catch (error) {
      console.error('Error saving order to database:', error);
      toast.error('Failed to save order. Redirecting to WhatsApp anyway...');
    }

    // Continue with WhatsApp flow (TEMPORARILY PAUSED)
    // const addressLine2 = address.addressLine2 ? `, ${address.addressLine2}` : '';
    // const landmark = address.landmark ? `\nLandmark: ${address.landmark}` : '';

    // const message = `⚡ *THUNDERBOLT ORDER REQUEST* ⚡

    // Hello, I want to order:

    // *Product:* ${product.productName}
    // *Category:* ${product.categoryName}
    // *Size:* ${product.size}
    // *Quantity:* ${product.quantity}
    // *Price:* ${product.price}

    // *Delivery Address:*
    // ${address.fullName}
    // ${address.phone}
    // ${address.addressLine1}${addressLine2}
    // ${address.city}, ${address.state} - ${address.pincode}${landmark}

    // 🔗 *Product Link:*
    // ${product.productUrl}

    // Please confirm availability and next steps!`;

    // toast.success('Order details ready. Redirecting to WhatsApp…');

    // setTimeout(() => {
    //   const encoded = encodeURIComponent(message);
    //   const phoneNumber = '919561172681';
    //   window.open(`https://wa.me/${phoneNumber}?text=${encoded}`, '_blank');
    //   setSubmitting(false);
      
    //   // Show confirmation modal after WhatsApp opens
    //   setTimeout(() => {
    //     setShowConfirmation(true);
    //   }, 500);
    // }, 1200);

    // TEMPORARY: Show success message and confirmation modal immediately after DB save
    toast.success('Order saved successfully!');
    setSubmitting(false);
    setShowConfirmation(true);
  };

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
            <span className="transition-transform duration-300 group-hover:-translate-x-1">←</span> Back to Product
          </motion.button>

          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="mb-10 md:mb-14"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-px bg-brass/50" />
              <span className="font-condensed font-semibold text-[0.62rem] tracking-[0.38em] uppercase text-brass">
                Checkout
              </span>
            </div>
            <h1 className="font-display text-4xl md:text-5xl tracking-[0.06em] metal-text uppercase leading-none">
              Complete Your Order
            </h1>
          </motion.div>

          {/* Two column layout */}
          <div className="flex flex-col md:flex-row gap-8 md:gap-14 items-start">
            {/* Left — Product Summary */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="w-full md:w-[340px] md:flex-shrink-0"
            >
              <ProductSummary product={product} />
            </motion.div>

            {/* Right — Address Form */}
            <motion.div
              id="address-form"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="w-full flex-1"
            >
              <AddressForm
                onSubmit={handleSubmit}
                submitting={submitting}
                savedAddress={savedAddress}
              />
            </motion.div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Order Confirmation Modal */}
      {showConfirmation && submittedAddress && (
        <OrderConfirmation
          orderDetails={product}
          address={submittedAddress}
          onClose={() => setShowConfirmation(false)}
        />
      )}
    </div>
  );
}
