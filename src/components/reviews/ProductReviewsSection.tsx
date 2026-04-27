import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Pencil } from 'lucide-react';
import LightningRating from './LightningRating';
import ReviewModal, { ReviewData } from './ReviewModal';
import { useAuth } from '../../context/AuthContext';

interface PublicReview {
  _id: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

interface Props {
  productId: string;
  productName?: string;
  productImage?: string;
}

/** Mask an email like "alex.morgan@gmail.com" → "ale***@gmail.com" for public display. */
function maskEmail(email: string) {
  if (!email || !email.includes('@')) return 'Verified Buyer';
  const [local, domain] = email.split('@');
  const visible = local.slice(0, Math.min(3, local.length));
  return `${visible}${local.length > 3 ? '***' : ''}@${domain}`;
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

/**
 * Public reviews section shown on the product page.
 *
 * Public visitors see the active reviews list (latest first, with average rating).
 * Signed-in users who own a delivered order for this product additionally get a
 * "Write a Review" / "Edit Your Review" button — exactly one review per user
 * per product (server-enforced via the existing duplicate guard).
 *
 * The whole section hides itself only when there are NO reviews AND the current
 * user is not eligible to write one — that way unreviewed products stay calm
 * for casual browsers but always offer the CTA to verified buyers.
 */
export default function ProductReviewsSection({ productId, productName, productImage }: Props) {
  const { user } = useAuth();

  const [reviews, setReviews] = useState<PublicReview[] | null>(null);
  const [loading, setLoading] = useState(true);

  // Auth-only state
  const [eligible, setEligible] = useState(false);
  const [myReview, setMyReview] = useState<ReviewData | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // ── Public list ─────────────────────────────────────────────────────────
  const loadPublicReviews = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/reviews?productId=${encodeURIComponent(productId)}`);
      if (!r.ok) throw new Error('failed');
      const data = await r.json();
      setReviews(data.reviews ?? []);
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => { loadPublicReviews(); }, [loadPublicReviews]);

  // ── Eligibility + own review (signed-in only) ───────────────────────────
  const loadMyState = useCallback(async () => {
    if (!user) {
      setEligible(false);
      setMyReview(null);
      return;
    }
    try {
      const token = await user.getIdToken();
      const r = await fetch(`/api/reviews?mine=true&productId=${encodeURIComponent(productId)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) return;
      const data = await r.json();
      setEligible(Boolean(data.eligible));
      setMyReview(data.review ?? null);
    } catch {
      /* silent — CTA simply won't render */
    }
  }, [user, productId]);

  useEffect(() => { loadMyState(); }, [loadMyState]);

  // ── Mutations ───────────────────────────────────────────────────────────
  const submitReview = async (input: { rating: number; comment: string }) => {
    if (!user) throw new Error('Sign in to leave a review');
    const token = await user.getIdToken();
    const r = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ productId, ...input }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data?.error || 'Failed to submit review');
    setMyReview(data.review);
    loadPublicReviews();
  };

  const updateReview = async (input: { rating: number; comment: string }) => {
    if (!user || !myReview) throw new Error('No review to update');
    const token = await user.getIdToken();
    const r = await fetch(`/api/reviews?id=${myReview._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(input),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data?.error || 'Failed to update review');
    setMyReview(data.review);
    loadPublicReviews();
  };

  const deleteReview = async () => {
    if (!user || !myReview) throw new Error('No review to delete');
    const token = await user.getIdToken();
    const r = await fetch(`/api/reviews?id=${myReview._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data?.error || 'Failed to delete review');
    setMyReview(null);
    loadPublicReviews();
  };

  const summary = useMemo(() => {
    if (!reviews || reviews.length === 0) return null;
    const total = reviews.reduce((sum, r) => sum + r.rating, 0);
    return { count: reviews.length, average: total / reviews.length };
  }, [reviews]);

  // Skip render entirely if there's nothing to show and the viewer can't act.
  if (loading) return null;
  const hasReviews = (reviews?.length ?? 0) > 0;
  if (!hasReviews && !eligible) return null;

  return (
    <section className="border-t border-white/[0.07] bg-void">
      <div className="max-w-[1240px] mx-auto px-6 md:px-16 py-16 md:py-20">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
          <div>
            <p className="font-condensed text-[10px] text-sv-mid uppercase tracking-[0.18em] mb-2">
              Customer Voltage
            </p>
            <h2 className="font-display text-2xl md:text-3xl tracking-[0.06em] text-tb-white uppercase">
              Verified Reviews
            </h2>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            {summary && (
              <div className="flex items-center gap-3">
                <LightningRating value={Math.round(summary.average)} readonly size="md" />
                <div className="font-condensed">
                  <p className="text-tb-white text-lg leading-none">{summary.average.toFixed(1)}</p>
                  <p className="text-[10px] text-sv-mid uppercase tracking-[0.16em] mt-1">
                    {summary.count} review{summary.count === 1 ? '' : 's'}
                  </p>
                </div>
              </div>
            )}

            {eligible && (
              <button
                onClick={() => setModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-brass text-void font-condensed font-bold text-xs tracking-[0.15em] uppercase rounded hover:bg-yellow-400 transition-colors duration-200"
              >
                <Pencil className="w-3.5 h-3.5" />
                {myReview ? 'Edit Your Review' : 'Write a Review'}
              </button>
            )}
          </div>
        </div>

        {/* List or empty-state-for-eligible */}
        {hasReviews ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
            {reviews!.map((rv, i) => (
              <motion.article
                key={rv._id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: Math.min(i * 0.04, 0.3) }}
                className="p-5 bg-white/[0.03] border border-white/10 rounded-xl"
              >
                <div className="flex items-center justify-between gap-3 mb-2">
                  <p className="font-condensed text-sm text-tb-white truncate">{maskEmail(rv.userId)}</p>
                  <LightningRating value={rv.rating} readonly size="sm" />
                </div>
                <p className="font-condensed text-[10px] text-sv-mid uppercase tracking-[0.16em] mb-3">
                  {formatDate(rv.createdAt)}
                </p>
                {rv.comment && (
                  <p className="text-tb-off text-sm leading-relaxed whitespace-pre-wrap">{rv.comment}</p>
                )}
              </motion.article>
            ))}
          </div>
        ) : (
          <div className="p-6 sm:p-8 bg-white/[0.03] border border-white/10 rounded-xl text-center">
            <p className="font-condensed text-sm text-tb-off mb-1">Be the first to review this piece.</p>
            <p className="font-condensed text-xs text-sv-mid">Your voltage helps the next customer choose.</p>
          </div>
        )}
      </div>

      <ReviewModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        product={{ id: productId, name: productName ?? 'this product', image: productImage }}
        existingReview={myReview}
        onSubmit={submitReview}
        onUpdate={updateReview}
        onDelete={deleteReview}
      />
    </section>
  );
}
