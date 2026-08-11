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
      className="fixed inset-0 bg-black/85 backdrop-blur-md z-[99999] flex items-center justify-center p-4 sm:p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="bg-[#0f0f0f] border border-white/15 rounded-2xl p-6 sm:p-8 max-w-lg w-full mx-auto max-h-[90vh] overflow-y-auto shadow-2xl space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500/15 border border-emerald-500/30 rounded-full flex items-center justify-center shrink-0">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg sm:text-xl tracking-wide text-white uppercase">
                Order Confirmed
              </h2>
              <p className="font-display text-xs text-zinc-400 mt-0.5">
                Thank you for shopping with Thunderbold!
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close confirmation"
            className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ArrowLeft size={16} />
          </button>
        </div>

        {/* Message */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 text-center">
          <p className="font-display text-sm text-zinc-200 leading-relaxed">
            Your order has been placed successfully. We'll contact you shortly with delivery updates.
          </p>
        </div>

        {/* Items Summary */}
        <div className="space-y-3">
          <h3 className="font-display font-semibold text-xs tracking-[0.14em] uppercase text-zinc-300">
            Items Ordered ({items.length})
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {items.map((item, index) => {
              let priceNum: number;
              if (typeof item.price === 'string') {
                priceNum = parseFloat(item.price.replace(/[^\d.]/g, ''));
              } else if (typeof item.price === 'number') {
                priceNum = item.price;
              } else {
                priceNum = 0;
              }
              const itemTotal = priceNum * (item.quantity || 1);

              return (
                <div
                  key={`${item.productId || index}-${item.size}`}
                  className="flex items-center justify-between p-3 bg-white/[0.03] border border-white/[0.06] rounded-xl"
                >
                  <div className="min-w-0 flex-1 pr-3">
                    <p className="font-display font-medium text-xs text-white truncate">
                      {item.name || item.productName || 'Product'}
                    </p>
                    <p className="font-display text-[11px] text-zinc-400 mt-0.5">
                      {item.size ? `Size: ${item.size}` : ''} {item.size ? '· ' : ''}Qty: {item.quantity || 1}
                    </p>
                  </div>
                  <div className="font-display font-semibold text-xs text-brass shrink-0">
                    ₹{itemTotal.toLocaleString('en-IN')}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Delivery Address */}
        <div className="space-y-2">
          <h3 className="font-display font-semibold text-xs tracking-[0.14em] uppercase text-zinc-300">
            Delivery Address
          </h3>
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3.5 space-y-1">
            <p className="font-display font-medium text-xs text-white">
              {address.fullName}
            </p>
            <p className="font-display text-xs text-zinc-300 leading-relaxed">
              {address.addressLine1}
              {address.addressLine2 && `, ${address.addressLine2}`}
            </p>
            <p className="font-display text-xs text-zinc-300">
              {address.city}, {address.state} — {address.pincode}
            </p>
            <p className="font-display text-xs text-zinc-400 pt-0.5">
              Phone: {address.phone}
            </p>
          </div>
        </div>

        {/* Total Amount */}
        <div className="flex items-center justify-between pt-3 border-t border-white/10">
          <span className="font-display font-semibold text-sm tracking-wider uppercase text-zinc-300">
            Total Amount (COD)
          </span>
          <span className="font-display font-bold text-xl text-brass">
            ₹{totalAmount.toLocaleString('en-IN')}
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={() => navigate('/')}
            className="flex-1 py-3 bg-white/10 hover:bg-white/15 text-white font-display font-semibold text-xs tracking-[0.12em] uppercase transition-colors rounded-xl border border-white/15"
          >
            Continue Shopping
          </button>
          <button
            onClick={() => navigate('/orders')}
            className="flex-1 py-3 bg-brass text-black font-display font-bold text-xs tracking-[0.12em] uppercase hover:bg-yellow-400 transition-colors rounded-xl shadow-lg"
          >
            View Orders
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
