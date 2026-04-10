import { motion } from 'framer-motion';
import { CheckCircle, ArrowLeft, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Flexible interface to handle both cart items and single product data
interface CheckoutItem {
  productId?: string;
  name?: string;
  price?: string | number;
  image?: string;
  size?: string;
  quantity?: number;
  productImage?: string;
  productName?: string;
  productUrl?: string;
}

interface Props {
  address: {
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    pincode: string;
  };
  items: CheckoutItem[];
  totalAmount: number;
  onClose: () => void;
}

export default function OrderConfirmation({ address, items, totalAmount, onClose }: Props) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-void/95 backdrop-blur-sm z-[99999] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="bg-surface border border-white/20 rounded-2xl p-8 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl tracking-[0.1em] text-tb-white uppercase">
            Order Confirmed
          </h2>
          <button
            onClick={onClose}
            className="text-sv-mid hover:text-tb-white transition-colors duration-200"
          >
            <ArrowLeft size={20} />
          </button>
        </div>

        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </div>

        {/* Message */}
        <div className="text-center mb-6">
          <p className="font-body text-lg text-tb-white">
            Your order has been placed successfully!
          </p>
          <p className="font-condensed text-sm tracking-[0.08em] text-sv mt-1">
            We will contact you shortly to confirm delivery.
          </p>
        </div>

        {/* Order Details */}
        <div className="space-y-4 border-t border-white/10 pt-6">
          <h3 className="font-display text-lg tracking-[0.1em] text-tb-white uppercase mb-4">
            Order Details
          </h3>

          {/* Items Summary */}
          <div className="mb-4">
            <h4 className="font-condensed font-semibold text-tb-white mb-2">
              Items ({items.length})
            </h4>
            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={`${item.productId || item.productUrl?.split('/').pop() || 'unknown'}-${item.size}`} className="flex justify-between items-center p-2 bg-white/5 rounded">
                  <div className="flex-1">
                    <p className="font-condensed text-tb-white text-sm">
                      {item.name || item.productName || 'Unknown Product'}
                    </p>
                    <div className="flex gap-2 text-xs text-sv-mid">
                      <span>Size: {item.size}</span>
                      <span>×</span>
                      <span>Qty: {item.quantity}</span>
                    </div>
                  </div>
                  <div className="font-condensed text-tb-white text-sm">
                    ¥{(() => {
                      let price: number;
                      if (typeof item.price === 'string') {
                        price = parseFloat(item.price.replace(/[^\d.]/g, ''));
                      } else if (typeof item.price === 'number') {
                        price = item.price;
                      } else {
                        price = 0;
                      }
                      return (price * (item.quantity || 0)).toFixed(2);
                    })()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Address */}
          <div className="mb-4">
            <h4 className="font-condensed font-semibold text-tb-white mb-2">
              Delivery Address
            </h4>
            <div className="bg-white/5 rounded p-3 space-y-1">
              <p className="font-condensed text-tb-white text-sm">
                {address.fullName}
              </p>
              <p className="font-condensed text-tb-white text-sm">
                {address.addressLine1}
                {address.addressLine2 && `, ${address.addressLine2}`}
              </p>
              <p className="font-condensed text-tb-white text-sm">
                {address.city}, {address.state} - {address.pincode}
              </p>
              <p className="font-condensed text-tb-white text-sm">
                {address.phone}
              </p>
            </div>
          </div>

          {/* Total */}
          <div className="flex justify-between items-center pt-4 border-t border-white/10">
            <h4 className="font-display text-lg tracking-[0.1em] text-tb-white uppercase">
              Total Amount
            </h4>
            <div className="font-condensed text-2xl text-tb-white">
              ¥{totalAmount.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 mt-6">
          <button
            onClick={() => navigate('/')}
            className="flex-1 py-3 bg-white/10 text-tb-white font-condensed font-bold text-sm tracking-[0.2em] uppercase hover:bg-white/20 transition-all duration-200 rounded-lg"
          >
            Continue Shopping
          </button>
          <button
            onClick={() => navigate('/orders')}
            className="flex-1 py-3 bg-tb-white text-void font-condensed font-bold text-sm tracking-[0.2em] uppercase hover:bg-white transition-all duration-200 rounded-lg"
          >
            View Orders
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
