import { motion } from 'framer-motion';
import { CheckCircle, ArrowLeft, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { CheckoutState } from '../../pages/Checkout';

interface Props {
  orderDetails: CheckoutState;
  address: {
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    pincode: string;
  };
  onClose: () => void;
}

export default function OrderConfirmation({ orderDetails, address, onClose }: Props) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-void/95 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="bg-surface border border-white/[0.08] rounded-2xl max-w-lg w-full p-8 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Success Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle className="w-8 h-8 text-green-400" />
        </motion.div>

        {/* Success Message */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-center mb-8"
        >
          <h2 className="font-display text-2xl md:text-3xl tracking-[0.06em] metal-text uppercase leading-none mb-3">
            Order Placed!
          </h2>
          <p className="font-body text-sv-mid text-sm">
            Your order details have been sent to WhatsApp. We'll contact you soon to confirm availability and delivery.
          </p>
        </motion.div>

        {/* Order Details */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="space-y-4 mb-8"
        >
          <div className="border-t border-white/[0.08] pt-4">
            <h3 className="font-condensed font-semibold text-[0.68rem] tracking-[0.18em] uppercase text-sv-mid mb-3">
              Order Summary
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-body text-sv-dim text-sm">Product</span>
                <span className="font-body text-tb-white text-sm">{orderDetails.productName}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-body text-sv-dim text-sm">Size</span>
                <span className="font-body text-tb-white text-sm">{orderDetails.size}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-body text-sv-dim text-sm">Quantity</span>
                <span className="font-body text-tb-white text-sm">{orderDetails.quantity}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-body text-sv-dim text-sm">Price</span>
                <span className="font-body text-brass text-sm">{orderDetails.price}</span>
              </div>
            </div>
          </div>

          <div className="border-t border-white/[0.08] pt-4">
            <h3 className="font-condensed font-semibold text-[0.68rem] tracking-[0.18em] uppercase text-sv-mid mb-3">
              Delivery Address
            </h3>
            <div className="font-body text-sv-dim text-sm space-y-1">
              <p className="text-tb-white">{address.fullName}</p>
              <p>{address.phone}</p>
              <p>{address.addressLine1}</p>
              {address.addressLine2 && <p>{address.addressLine2}</p>}
              <p>{address.city}, {address.state} - {address.pincode}</p>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="flex gap-3"
        >
          <button
            onClick={() => {
              onClose();
              navigate(-1);
            }}
            className="flex-1 py-3 px-4 bg-white/5 border border-white/[0.08] font-condensed font-semibold text-[0.68rem] tracking-[0.18em] uppercase text-sv-mid hover:bg-white/10 transition-all duration-300 flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Product
          </button>
          <button
            onClick={() => {
              onClose();
              navigate('/');
            }}
            className="flex-1 py-3 px-4 bg-tb-white text-void font-condensed font-semibold text-[0.68rem] tracking-[0.18em] uppercase hover:bg-white transition-all duration-300 flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            Home
          </button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
