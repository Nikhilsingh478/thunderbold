import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2 } from 'lucide-react';
import LightningRating from './LightningRating';

export interface ReviewData {
  _id: string;
  productId: string;
  rating: number;
  comment: string;
}

interface ReviewModalProps {
  open: boolean;
  onClose: () => void;
  product: { id: string; name: string; image?: string };
  /** Existing review for edit mode. When provided, the modal pre-fills and shows Update + Delete actions. */
  existingReview?: ReviewData | null;
  /** Submit a NEW review. Should resolve once the API call completes. */
  onSubmit: (input: { rating: number; comment: string }) => Promise<void>;
  /** Update existing review. Required when `existingReview` is provided. */
  onUpdate?: (input: { rating: number; comment: string }) => Promise<void>;
  /** Soft-delete existing review. Required when `existingReview` is provided. */
  onDelete?: () => Promise<void>;
}

/**
 * Lightning-rating review modal. Used for both create + edit flows.
 * Lives outside the page tree so it works from any list (Orders, ProductView, etc.).
 */
export default function ReviewModal({
  open,
  onClose,
  product,
  existingReview,
  onSubmit,
  onUpdate,
  onDelete,
}: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const isEdit = Boolean(existingReview);

  // Reset / hydrate state whenever the modal opens or the target review changes.
  useEffect(() => {
    if (!open) return;
    setRating(existingReview?.rating ?? 0);
    setComment(existingReview?.comment ?? '');
    setError('');
    setSubmitting(false);
    setDeleting(false);
  }, [open, existingReview]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const handleSubmit = async () => {
    if (rating < 1 || rating > 5) {
      setError('Please choose a lightning-bolt rating.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      if (isEdit && onUpdate) {
        await onUpdate({ rating, comment: comment.trim() });
      } else {
        await onSubmit({ rating, comment: comment.trim() });
      }
      onClose();
    } catch (err) {
      setError((err as Error).message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    if (!confirm('Delete your review? This cannot be undone from your end.')) return;
    setDeleting(true);
    setError('');
    try {
      await onDelete();
      onClose();
    } catch (err) {
      setError((err as Error).message || 'Failed to delete review.');
      setDeleting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[400] flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm px-0 sm:px-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-md bg-[#141414] border border-white/10 rounded-t-2xl sm:rounded-2xl relative max-h-[92vh] flex flex-col"
          >
            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute top-4 right-4 z-10 p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-sv-mid hover:text-tb-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="px-6 pt-6 pb-4 border-b border-white/10 shrink-0">
              <p className="font-condensed text-[10px] text-sv-mid uppercase tracking-[0.18em] mb-1">
                {isEdit ? 'Edit Review' : 'Write a Review'}
              </p>
              <h3 className="font-display text-lg sm:text-xl tracking-[0.06em] text-tb-white uppercase pr-8 line-clamp-2">
                {product.name}
              </h3>
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1 px-6 py-6 space-y-6">
              {/* Rating */}
              <div className="flex flex-col items-center gap-3">
                <LightningRating value={rating} onChange={setRating} size="lg" />
                <p className="font-condensed text-[11px] text-sv-mid uppercase tracking-[0.16em] h-3">
                  {rating > 0 ? `${rating} of 5` : 'Tap to rate'}
                </p>
              </div>

              {/* Comment */}
              <div>
                <label className="block font-condensed text-xs text-sv-mid uppercase tracking-wider mb-1.5">
                  Your Review <span className="lowercase tracking-normal text-sv-mid/60">(optional)</span>
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Write your review..."
                  maxLength={1000}
                  rows={5}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-tb-white text-sm placeholder:text-sv-mid/40 focus:outline-none focus:border-white/30 transition-colors resize-none"
                />
                <p className="text-right text-[10px] text-sv-mid/60 mt-1">{comment.length}/1000</p>
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 pb-6 pt-3 flex gap-3 shrink-0 border-t border-white/10">
              {isEdit && onDelete && (
                <button
                  onClick={handleDelete}
                  disabled={deleting || submitting}
                  className="flex items-center justify-center gap-1.5 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm font-condensed uppercase tracking-wider hover:bg-red-500/20 transition-colors disabled:opacity-50"
                  aria-label="Delete review"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">{deleting ? 'Deleting...' : 'Delete'}</span>
                </button>
              )}
              <button
                onClick={onClose}
                disabled={submitting || deleting}
                className="flex-1 py-3 bg-white/5 border border-white/10 rounded-lg text-sv-mid text-sm font-condensed uppercase tracking-wider hover:bg-white/10 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || deleting || rating < 1}
                className="flex-1 py-3 bg-brass text-void font-condensed font-bold text-sm tracking-[0.15em] uppercase rounded-lg hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Saving...' : isEdit ? 'Update' : 'Submit'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
