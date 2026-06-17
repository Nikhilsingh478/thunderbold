import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RotateCcw, AlertCircle, CheckCircle2, Wallet } from 'lucide-react';

const RETURN_REASONS = [
  { value: 'defective',        label: 'Defective Product' },
  { value: 'wrong_item',       label: 'Wrong Item Delivered' },
  { value: 'size_issue',       label: 'Size / Fit Issue' },
  { value: 'not_as_described', label: 'Not As Described' },
  { value: 'other',            label: 'Other' },
] as const;

type ReturnReason = typeof RETURN_REASONS[number]['value'];

interface ReturnRequestModalProps {
  open: boolean;
  onClose: () => void;
  orderId: string;
  orderNumber?: string;
  totalAmount: number;
  onSubmit: (orderId: string, reason: ReturnReason, description: string, upiId: string) => Promise<void>;
}

const SHIPPING_DEDUCTION = 50;

// Basic UPI ID format: localpart@provider (e.g. 9876543210@upi, name@okhdfcbank)
function isValidUpiId(id: string): boolean {
  return /^[a-zA-Z0-9._\-+]{2,}@[a-zA-Z]{2,}$/.test(id.trim());
}

export default function ReturnRequestModal({
  open,
  onClose,
  orderId,
  orderNumber,
  totalAmount,
  onSubmit,
}: ReturnRequestModalProps) {
  const [reason, setReason] = useState<ReturnReason>('defective');
  const [description, setDescription] = useState('');
  const [upiId, setUpiId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const estimatedRefund = Math.max(0, totalAmount - SHIPPING_DEDUCTION);

  const handleSubmit = async () => {
    if (description.trim().length < 10) {
      setError('Please describe the issue in at least 10 characters.');
      return;
    }
    if (!upiId.trim()) {
      setError('Please enter your UPI ID for the refund.');
      return;
    }
    if (!isValidUpiId(upiId)) {
      setError('Enter a valid UPI ID (e.g. 9876543210@upi or name@okhdfcbank).');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await onSubmit(orderId, reason, description.trim(), upiId.trim());
      setSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (submitting) return;
    setReason('defective');
    setDescription('');
    setUpiId('');
    setError('');
    setSubmitted(false);
    onClose();
  };

  const canSubmit = !submitting && description.trim().length >= 10 && upiId.trim().length > 0;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[400] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm px-0 sm:px-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="w-full sm:max-w-lg bg-[#141414] border border-white/10 rounded-t-2xl sm:rounded-2xl relative max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-5 pt-5 pb-4 border-b border-white/10 shrink-0 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <RotateCcw className="w-4 h-4 text-brass" />
                  <h3 className="font-display text-xl tracking-[0.08em] text-tb-white uppercase">Request Return</h3>
                </div>
                {orderNumber && (
                  <p className="font-condensed text-xs text-sv-mid tracking-wider">Order {orderNumber}</p>
                )}
              </div>
              <button
                onClick={handleClose}
                disabled={submitting}
                className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-sv-mid hover:text-tb-white transition-colors shrink-0 mt-0.5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-6 flex flex-col items-center text-center gap-4"
                >
                  <div className="w-14 h-14 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
                    <CheckCircle2 className="w-7 h-7 text-green-400" />
                  </div>
                  <div>
                    <p className="font-display text-xl tracking-wider text-tb-white uppercase mb-1.5">Request Submitted</p>
                    <p className="font-condensed text-sm text-sv-mid leading-relaxed max-w-[300px]">
                      We've received your return request. Our team will review and contact you within 2–3 business days.
                    </p>
                  </div>

                  {/* Refund breakdown */}
                  <div className="w-full p-4 bg-brass/5 border border-brass/20 rounded-xl space-y-2.5">
                    <p className="font-condensed text-xs text-brass uppercase tracking-wider">Estimated Refund (if approved)</p>
                    <div className="flex items-center justify-between text-xs font-condensed text-sv-mid">
                      <span>Order total</span>
                      <span className="text-tb-white">₹{totalAmount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-condensed text-sv-mid">
                      <span>Shipping deduction</span>
                      <span className="text-red-400">− ₹{SHIPPING_DEDUCTION}</span>
                    </div>
                    <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                      <span className="font-condensed text-xs text-sv-mid uppercase tracking-wider">You receive</span>
                      <span className="font-display text-xl tracking-wider text-brass">₹{estimatedRefund.toLocaleString('en-IN')}</span>
                    </div>
                    <p className="font-condensed text-[10px] text-sv-dim text-center">Refund to UPI: {upiId}</p>
                  </div>

                  <button
                    onClick={handleClose}
                    className="mt-1 px-6 py-2.5 bg-tb-white text-void font-condensed font-bold text-xs tracking-[0.15em] uppercase rounded-lg hover:bg-white transition-colors"
                  >
                    Done
                  </button>
                </motion.div>
              ) : (
                <>
                  {/* Policy notice */}
                  <div className="flex items-start gap-3 p-3.5 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <p className="font-condensed text-xs text-amber-200/70 leading-relaxed tracking-wide">
                      Returns accepted for defective, wrong, or misrepresented items only.
                      Approved refunds are processed within 5–7 business days.
                    </p>
                  </div>

                  {/* Reason */}
                  <div>
                    <label className="block font-condensed text-xs text-sv-mid uppercase tracking-wider mb-2">
                      Reason for Return <span className="text-brass">*</span>
                    </label>
                    <div className="grid grid-cols-1 gap-1.5">
                      {RETURN_REASONS.map(({ value, label }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setReason(value as ReturnReason)}
                          className={`px-4 py-2.5 rounded-lg border text-left font-condensed text-sm tracking-wider transition-all duration-150 ${
                            reason === value
                              ? 'bg-brass/10 border-brass/50 text-brass'
                              : 'bg-white/3 border-white/10 text-sv-mid hover:border-white/25 hover:text-tb-white'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block font-condensed text-xs text-sv-mid uppercase tracking-wider mb-2">
                      Describe the Issue <span className="text-brass">*</span>
                    </label>
                    <textarea
                      rows={3}
                      value={description}
                      onChange={(e) => { setDescription(e.target.value.slice(0, 500)); if (error) setError(''); }}
                      placeholder="Describe what went wrong — e.g. stitching came apart, received wrong size, colour very different from photos..."
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-tb-white text-sm placeholder:text-sv-dim/50 focus:outline-none focus:border-white/30 transition-colors resize-none leading-relaxed"
                    />
                    <div className="flex items-center justify-between mt-1">
                      <span />
                      <p className={`font-condensed text-xs tabular-nums ${description.length >= 450 ? 'text-amber-400' : 'text-sv-dim'}`}>
                        {description.length}/500
                      </p>
                    </div>
                  </div>

                  {/* Refund Breakdown */}
                  <div className="p-4 bg-white/[0.03] border border-white/8 rounded-xl">
                    <p className="font-condensed text-xs text-sv-mid uppercase tracking-wider mb-3">Estimated Refund (if approved)</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm font-condensed">
                        <span className="text-sv-mid">Order total</span>
                        <span className="text-tb-white">₹{totalAmount.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm font-condensed">
                        <span className="text-sv-mid">Shipping charges deducted</span>
                        <span className="text-red-400">− ₹{SHIPPING_DEDUCTION}</span>
                      </div>
                      <div className="flex items-center justify-between pt-2.5 border-t border-white/10">
                        <span className="font-condensed text-xs text-sv-mid uppercase tracking-wider">You receive</span>
                        <span className="font-display text-2xl tracking-wider text-brass">₹{estimatedRefund.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>

                  {/* UPI ID */}
                  <div>
                    <label className="block font-condensed text-xs text-sv-mid uppercase tracking-wider mb-2">
                      <span className="flex items-center gap-1.5">
                        <Wallet className="w-3 h-3 text-brass" />
                        UPI ID for Refund <span className="text-brass">*</span>
                      </span>
                    </label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => { setUpiId(e.target.value.trim()); if (error) setError(''); }}
                      placeholder="e.g. 9876543210@upi or name@okhdfcbank"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-tb-white text-sm placeholder:text-sv-dim/40 focus:outline-none focus:border-white/30 transition-colors font-mono"
                    />
                    <p className="font-condensed text-[10px] text-sv-dim mt-1.5 tracking-wide">
                      Refund will be sent to this UPI ID once approved. Double-check before submitting.
                    </p>
                  </div>

                  {/* Error */}
                  {error && (
                    <p className="font-condensed text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                      {error}
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            {!submitted && (
              <div className="px-5 pb-5 pt-3.5 flex gap-3 shrink-0 border-t border-white/10">
                <button
                  onClick={handleClose}
                  disabled={submitting}
                  className="flex-1 py-3 bg-white/5 border border-white/10 rounded-lg text-sv-mid text-sm font-condensed uppercase tracking-wider hover:bg-white/10 transition-colors disabled:opacity-40"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className="flex-1 py-3 bg-brass text-void font-condensed font-bold text-sm tracking-[0.15em] uppercase rounded-lg hover:bg-yellow-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <><span className="w-3.5 h-3.5 border-2 border-void/30 border-t-void rounded-full animate-spin" />Submitting…</>
                  ) : (
                    <><RotateCcw className="w-3.5 h-3.5" />Submit Request</>
                  )}
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
