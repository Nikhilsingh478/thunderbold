import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useNotifications } from '../hooks/useNotifications';
import Navbar from '../components/Navbar';
import ScrollProgress from '../components/ScrollProgress';
import CustomCursor from '../components/CustomCursor';
import AddressForm, { type AddressData } from '../components/checkout/AddressForm';
import ProductSummary from '../components/checkout/ProductSummary';
import OrderConfirmation from '../components/checkout/OrderConfirmation';

const STORAGE_KEY = 'user_address';
const GIFT_MSG_MAX = 300;

const GIFT_CARDS = [
  { id: 'brother',   label: 'Brother',   src: '/gift-cards/brother.webp' },
  { id: 'dad',       label: 'Dad',       src: '/gift-cards/dad.webp' },
  { id: 'friend',    label: 'Friend',    src: '/gift-cards/friend.webp' },
  { id: 'mom',       label: 'Mom',       src: '/gift-cards/mom.webp' },
  { id: 'valentine', label: 'Valentine', src: '/gift-cards/valentine.webp' },
];

function loadSavedAddress(): AddressData | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, clearCartData } = useCart();
  const { triggerPrompt } = useNotifications();

  const singleProductData = location.state?.productName ? [location.state] : null;
  const cartItems = location.state?.cartItems || singleProductData || items;

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

  const [submitting, setSubmitting] = useState(false);
  const [savedAddress, setSavedAddress] = useState<AddressData | null>(loadSavedAddress);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [submittedAddress, setSubmittedAddress] = useState<AddressData | null>(null);
  const [giftMessage, setGiftMessage] = useState('');
  const [isGift, setIsGift] = useState(false);
  const [selectedGiftCard, setSelectedGiftCard] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchDefaultAddress = async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch('/api/users', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const addresses: Array<{
            id: string; fullName: string; phone: string; addressLine1: string;
            addressLine2: string; city: string; state: string; pincode: string;
            landmark: string; isDefault: boolean;
          }> = data.data?.addresses || [];
          const defaultAddr = addresses.find(a => a.isDefault) || addresses[0];
          if (defaultAddr) {
            const mapped: AddressData = {
              fullName: defaultAddr.fullName,
              phone: defaultAddr.phone,
              addressLine1: defaultAddr.addressLine1,
              addressLine2: defaultAddr.addressLine2 || '',
              city: defaultAddr.city,
              state: defaultAddr.state,
              pincode: defaultAddr.pincode,
              landmark: defaultAddr.landmark || '',
            };
            setSavedAddress(mapped);
          }
        }
      } catch {
        // silently fall back to localStorage
      }
    };
    fetchDefaultAddress();
  }, [user]);

  useEffect(() => {
    window.scrollTo(0, 0);
    setTimeout(() => {
      const addressForm = document.getElementById('address-form');
      if (addressForm) {
        addressForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 800);
  }, []);

  useEffect(() => {
    if (!cartItems || cartItems.length === 0) navigate('/cart', { replace: true });
  }, [cartItems, navigate]);

  const handleSubmit = async (address: AddressData) => {
    if (!user) {
      toast.error('Please login to place an order');
      navigate('/login');
      return;
    }

    if (submitting) return;

    setSubmitting(true);
    setSubmittedAddress(address);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(address));

    const clientOrderId = crypto.randomUUID();

    try {
      const orderProducts = cartItems.map(item => ({
        productId: item.productId || item.productUrl?.split('/').pop() || 'unknown',
        name: item.name || item.productName || 'Unknown Product',
        size: item.size || 'N/A',
        quantity: item.quantity || 1,
        image: item.image || item.productImage || '/placeholder.png',
        ...(item.topwearSize ? { topwearSize: item.topwearSize } : {}),
        ...(item.bottomwearSize ? { bottomwearSize: item.bottomwearSize } : {}),
      }));

      const trimmedMessage = giftMessage.trim().slice(0, GIFT_MSG_MAX);

      const orderData: Record<string, unknown> = {
        products: orderProducts,
        address: {
          fullName: address.fullName,
          phone: address.phone,
          addressLine1: address.addressLine1,
          addressLine2: address.addressLine2 || '',
          city: address.city,
          state: address.state,
          pincode: address.pincode,
          landmark: address.landmark || '',
        },
        paymentMethod: 'COD',
        clientOrderId,
      };

      if (trimmedMessage) {
        orderData.giftMessage = trimmedMessage;
      }

      if (isGift && selectedGiftCard) {
        orderData.giftCardId = selectedGiftCard;
      }

      const token = await user.getIdToken();

      let response: Response | null = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          response = await fetch('/api/orders/create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(orderData),
          });
          break;
        } catch {
          if (attempt < 2) await new Promise(r => setTimeout(r, 800 * (attempt + 1)));
        }
      }

      if (!response) {
        toast.error('Network error. Please check your connection and try again.');
        setSubmitting(false);
        return;
      }

      if (!response.ok) {
        let errMsg = `Order failed (${response.status})`;
        try {
          const errData = await response.json();
          if (errData?.error) errMsg = errData.error;
        } catch {}
        toast.error(errMsg);
        setSubmitting(false);
        return;
      }

      const result = await response.json();

      if (result.error) {
        toast.error(`Order failed: ${result.error}`);
        setSubmitting(false);
        return;
      }

      if (location.state?.cartItems) {
        await clearCartData();
      }

      toast.success('Order placed successfully!');
      setShowConfirmation(true);
      setSubmitting(false);
      triggerPrompt();

    } catch (error) {
      console.error('CHECKOUT: Unexpected error:', error);
      toast.error('Something went wrong. Please try again.');
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
                {isGift ? "Recipient's Address" : 'Delivery Address'}
              </h2>
              <AddressForm
                onSubmit={handleSubmit}
                submitting={submitting}
                savedAddress={savedAddress}
              />
            </div>

            {/* Right Column — Gift Section then Order Summary */}
            <div className="flex flex-col gap-6">
              {/* Gift Toggle + Gift Card + Message */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="border border-white/[0.08] bg-white/[0.02] p-5 md:p-6"
              >
                {/* Gift Toggle */}
                <label className="flex items-center gap-3 cursor-pointer mb-4 select-none">
                  <div
                    onClick={() => {
                      setIsGift(v => !v);
                      if (isGift) setSelectedGiftCard(null);
                    }}
                    className={`relative w-10 h-5 rounded-full transition-colors duration-300 ${
                      isGift ? 'bg-brass' : 'bg-white/15'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-300 ${
                        isGift ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </div>
                  <span className="font-condensed font-semibold text-[0.78rem] tracking-[0.18em] uppercase text-tb-white">
                    This is a gift 🎁
                  </span>
                </label>

                {/* Gift Card Picker — shown only when gift is enabled */}
                {isGift && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="mb-4"
                  >
                    <p className="font-condensed text-[0.65rem] tracking-[0.2em] uppercase text-sv-dim mb-3">
                      Choose a gift card <span className="text-sv-dim/60 normal-case tracking-normal">(optional)</span>
                    </p>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5 sm:gap-3 pt-1 pb-2">
                      {GIFT_CARDS.map((card) => (
                        <button
                          key={card.id}
                          type="button"
                          onClick={() =>
                            setSelectedGiftCard(prev => (prev === card.id ? null : card.id))
                          }
                          className={`flex flex-col items-center gap-1.5 transition-all duration-200 ${
                            selectedGiftCard === card.id
                              ? 'opacity-100 scale-100'
                              : 'opacity-70 hover:opacity-100 scale-95 hover:scale-100'
                          }`}
                        >
                          <div
                            className={`w-full aspect-[3/4] rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                              selectedGiftCard === card.id
                                ? 'border-brass shadow-[0_0_12px_rgba(212,170,48,0.3)] ring-1 ring-brass'
                                : 'border-white/10 hover:border-white/30 bg-white/[0.02]'
                            }`}
                          >
                            <img
                              src={card.src}
                              alt={card.label}
                              className="w-full h-full object-cover"
                              draggable={false}
                            />
                          </div>
                          <span
                            className={`font-display text-[0.68rem] font-medium tracking-[0.1em] uppercase transition-colors duration-200 ${
                              selectedGiftCard === card.id ? 'text-brass font-bold' : 'text-zinc-400'
                            }`}
                          >
                            {card.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Gift / Order Message */}
                <div className="mb-4">
                  <p className="font-condensed font-semibold text-[0.68rem] tracking-[0.22em] uppercase text-tb-white">
                    Gift / Order Message
                    <span className="ml-2 font-condensed text-[0.6rem] tracking-[0.14em] text-sv-dim normal-case">
                      Optional
                    </span>
                  </p>
                  <p className="font-body text-[0.75rem] text-sv-dim mt-1">
                    Add a personal note or any special instructions for your order.
                  </p>
                </div>
                <div className="relative">
                  <textarea
                    value={giftMessage}
                    onChange={e => setGiftMessage(e.target.value.slice(0, GIFT_MSG_MAX))}
                    placeholder="Write a message for the recipient (optional)"
                    rows={3}
                    className="w-full bg-surface border border-white/[0.08] focus:border-brass/40 px-4 py-3 font-body text-[0.9rem] text-tb-white placeholder:text-sv-dim/50 outline-none transition-colors duration-300 resize-none"
                  />
                  <span className={`absolute bottom-3 right-3 font-condensed text-[0.62rem] tracking-wide tabular-nums transition-colors duration-200 ${
                    giftMessage.length >= GIFT_MSG_MAX ? 'text-red-400/70' : 'text-sv-dim/60'
                  }`}>
                    {giftMessage.length}/{GIFT_MSG_MAX}
                  </span>
                </div>
              </motion.div>

              {/* Order Summary */}
              <ProductSummary
                items={cartItems}
                totalAmount={totalAmount}
              />
            </div>
          </div>
        </div>
      </main>


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
