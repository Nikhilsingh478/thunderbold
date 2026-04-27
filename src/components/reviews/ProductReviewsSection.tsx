import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import LightningRating from './LightningRating';

interface PublicReview {
  _id: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

interface Props {
  productId: string;
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
 * Lazily fetches the active (non-deleted) reviews for a product.
 * Hides itself entirely while loading or when there are no reviews — keeps the
 * page calm for unreviewed products.
 */
export default function ProductReviewsSection({ productId }: Props) {
  const [reviews, setReviews] = useState<PublicReview[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const r = await fetch(`/api/reviews?productId=${encodeURIComponent(productId)}`);
        if (!r.ok) throw new Error('failed');
        const data = await r.json();
        if (!cancelled) setReviews(data.reviews ?? []);
      } catch {
        if (!cancelled) setReviews([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [productId]);

  const summary = useMemo(() => {
    if (!reviews || reviews.length === 0) return null;
    const total = reviews.reduce((sum, r) => sum + r.rating, 0);
    return { count: reviews.length, average: total / reviews.length };
  }, [reviews]);

  if (loading || !reviews || reviews.length === 0) return null;

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
        </div>

        {/* List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
          {reviews.map((rv, i) => (
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
      </div>
    </section>
  );
}
