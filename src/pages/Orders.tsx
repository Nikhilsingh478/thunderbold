import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Package, Calendar, CheckCircle, Clock, Truck, Home, ArrowLeft, Pencil, Eye, X, RotateCcw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { getStaleOrders, setCachedOrders } from '../lib/ordersCache';
import ReviewModal, { ReviewData } from '../components/reviews/ReviewModal';
import LightningRating from '../components/reviews/LightningRating';
import { formatOrderId } from '../lib/utils';
import ReturnRequestModal from '../components/ReturnRequestModal';

interface OrderProduct {
  productId?: string;
  name: string;
  quantity: number;
  size: string;
  price: number;
  image?: string;
}

interface Order {
  _id: string;
  userId: string;
  products: OrderProduct[];
  totalAmount: number;
  status: string;
  createdAt: string;
  orderNumber?: string;
}

const RETURN_STATUSES = ['return_requested', 'return_approved', 'return_rejected'];

const Orders = () => {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Compute cache dynamically inside render so that on the frame the user object resolves,
  // we instantly pull the cached orders instead of rendering a spinner.
  const cachedOnRender = user ? getStaleOrders(user.uid) : null;
  const displayOrders = orders.length > 0 ? orders : (cachedOnRender || []);
  const isCurrentlyLoading = authLoading || (ordersLoading && !cachedOnRender);

  // ── Reviews state ────────────────────────────────────────────────────────
  const [myReviews, setMyReviews] = useState<Record<string, ReviewData>>({});
  const [reviewTarget, setReviewTarget] = useState<{
    product: { id: string; name: string; image?: string };
    existing: ReviewData | null;
  } | null>(null);

  // ── Return request state ─────────────────────────────────────────────────
  const [returnTarget, setReturnTarget] = useState<Order | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setOrdersLoading(false);
      return;
    }

    const fetchOrders = async (isPoll = false) => {
      try {
        const token = await user.getIdToken();
        const response = await fetch('/api/orders', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          const fresh: Order[] = data.orders || [];
          setOrders(prev => {
            if (JSON.stringify(prev) !== JSON.stringify(fresh)) {
              setCachedOrders(user.uid, fresh);
              return fresh;
            }
            return prev;
          });
        } else if (!isPoll && !getStaleOrders(user.uid)) {
          setError('Failed to fetch orders');
        }
      } catch (err) {
        if (!isPoll && !getStaleOrders(user.uid)) setError('Error fetching orders');
        console.error('Error fetching orders:', err);
      } finally {
        if (!isPoll) setOrdersLoading(false);
      }
    };

    const cached = getStaleOrders(user.uid);
    if (cached) {
      setOrders(cached);
      setOrdersLoading(false);
    } else {
      setOrdersLoading(true);
    }

    fetchOrders(false);

    const interval = setInterval(() => { fetchOrders(true); }, 10000);
    return () => clearInterval(interval);
  }, [user, authLoading]);

  // Fetch the user's existing reviews
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const token = await user.getIdToken();
        const r = await fetch('/api/reviews?mine=true', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!r.ok) return;
        const { reviews } = await r.json();
        if (cancelled) return;
        const map: Record<string, ReviewData> = {};
        for (const rv of reviews ?? []) map[rv.productId] = rv;
        setMyReviews(map);
      } catch {
        /* silent */
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const reviewableProducts = useMemo(() => {
    const set = new Set<string>();
    for (const o of orders) {
      if ((o.status ?? '').toLowerCase() !== 'delivered') continue;
      for (const p of o.products ?? []) {
        if (p.productId) set.add(p.productId);
      }
    }
    return set;
  }, [orders]);

  const submitReview = async (productId: string, input: { rating: number; comment: string }) => {
    if (!user) throw new Error('Not signed in');
    const token = await user.getIdToken();
    const r = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ productId, ...input }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data?.error || 'Failed to submit review');
    setMyReviews(prev => ({ ...prev, [productId]: data.review }));
  };

  const updateReview = async (reviewId: string, productId: string, input: { rating: number; comment: string }) => {
    if (!user) throw new Error('Not signed in');
    const token = await user.getIdToken();
    const r = await fetch(`/api/reviews?id=${reviewId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(input),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data?.error || 'Failed to update review');
    setMyReviews(prev => ({ ...prev, [productId]: data.review }));
  };

  const deleteReview = async (reviewId: string, productId: string) => {
    if (!user) throw new Error('Not signed in');
    const token = await user.getIdToken();
    const r = await fetch(`/api/reviews?id=${reviewId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data?.error || 'Failed to delete review');
    setMyReviews(prev => {
      const next = { ...prev };
      delete next[productId];
      return next;
    });
  };

  const cancelOrder = async (orderId: string) => {
    if (!user) return;
    if (!confirm('Are you sure you want to cancel this order?')) return;
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/orders/cancel', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ orderId }),
      });
      const data = await response.json();
      if (response.ok) {
        setOrders(prev =>
          prev.map(order => order._id === orderId ? { ...order, status: 'cancelled' } : order)
        );
      } else {
        alert(data.error || 'Failed to cancel order');
      }
    } catch {
      alert('Failed to cancel order — network error');
    }
  };

  const submitReturn = async (orderId: string, reason: string, description: string) => {
    if (!user) throw new Error('Not signed in');
    const token = await user.getIdToken();
    const r = await fetch('/api/returns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ orderId, reason, description }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data?.error || 'Failed to submit return request');
    // Optimistically update order status so the button disappears
    setOrders(prev =>
      prev.map(o => o._id === orderId ? { ...o, status: 'return_requested' } : o)
    );
  };

  const getStatusColor = (status: string) => {
    switch ((status ?? '').toLowerCase()) {
      case 'pending':           return 'text-gray-400 bg-gray-400/10 border-gray-400/30';
      case 'confirmed':         return 'text-blue-400 bg-blue-400/10 border-blue-400/30';
      case 'packed':            return 'text-violet-400 bg-violet-400/10 border-violet-400/30';
      case 'shipped':           return 'text-orange-400 bg-orange-400/10 border-orange-400/30';
      case 'delivered':         return 'text-green-400 bg-green-400/10 border-green-400/30';
      case 'cancelled':         return 'text-red-400 bg-red-400/10 border-red-400/30';
      case 'return_requested':  return 'text-amber-400 bg-amber-400/10 border-amber-400/30';
      case 'return_approved':   return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30';
      case 'return_rejected':   return 'text-rose-400 bg-rose-400/10 border-rose-400/30';
      default:                  return 'text-sv-mid bg-white/5 border-white/10';
    }
  };

  const getStatusIcon = (status: string) => {
    switch ((status ?? '').toLowerCase()) {
      case 'pending':           return <Clock className="w-4 h-4" />;
      case 'confirmed':         return <CheckCircle className="w-4 h-4" />;
      case 'packed':            return <Package className="w-4 h-4" />;
      case 'shipped':           return <Truck className="w-4 h-4" />;
      case 'delivered':         return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':         return <X className="w-4 h-4" />;
      case 'return_requested':  return <RotateCcw className="w-4 h-4" />;
      case 'return_approved':   return <CheckCircle className="w-4 h-4" />;
      case 'return_rejected':   return <X className="w-4 h-4" />;
      default:                  return <Package className="w-4 h-4" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch ((status ?? '').toLowerCase()) {
      case 'return_requested': return 'Return Pending';
      case 'return_approved':  return 'Return Approved';
      case 'return_rejected':  return 'Return Rejected';
      default:                 return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brass mx-auto mb-4" />
          <p className="font-condensed text-xs text-sv-mid uppercase tracking-[0.16em]">Loading Account...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display text-3xl tracking-[0.2em] text-tb-white uppercase mb-4">Sign In Required</h1>
          <p className="text-sv-mid mb-8">Please sign in to view your orders</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-brass text-void font-condensed text-sm uppercase tracking-wider hover:bg-yellow-400 transition-all duration-200"
          >
            <Home className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-void">
      <div className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          <div className="mb-8">
            <button
              onClick={() => navigate(-1)}
              className="font-condensed font-semibold text-xs tracking-[0.18em] uppercase text-sv-mid hover:text-brass transition-colors duration-200 mb-8 flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <h1 className="font-display text-3xl tracking-[0.2em] text-tb-white uppercase mb-2">Your Orders</h1>
            <p className="text-sv-mid">Track and manage your orders</p>
          </div>

          {isCurrentlyLoading ? (
            <div className="flex flex-col gap-6 py-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-surface border border-white/10 rounded-lg p-6 animate-pulse">
                  <div className="flex justify-between items-center mb-6">
                    <div className="h-4 w-32 bg-white/10 rounded" />
                    <div className="h-4 w-20 bg-white/10 rounded" />
                  </div>
                  <div className="space-y-3">
                    <div className="h-3.5 w-2/3 bg-white/5 rounded" />
                    <div className="h-3 w-1/2 bg-white/5 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-brass text-void rounded hover:bg-yellow-400 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : displayOrders.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
              <Package className="w-16 h-16 text-sv-mid mx-auto mb-4" />
              <h2 className="font-display text-xl tracking-[0.1em] text-tb-white uppercase mb-2">No Orders Yet</h2>
              <p className="text-sv-mid mb-8">Your orders will appear here</p>
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-6 py-3 bg-brass text-void font-condensed text-sm uppercase tracking-wider hover:bg-yellow-400 transition-all duration-200"
              >
                Start Shopping
              </Link>
            </motion.div>
          ) : (
            <div className="space-y-6">
              {displayOrders.map((order) => {
                const isDelivered = order.status === 'delivered';
                const isPending   = order.status === 'pending';
                const isReturn    = RETURN_STATUSES.includes(order.status);

                return (
                  <motion.div
                    key={order._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="bg-surface border border-white/10 rounded-lg p-6"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                      <div className="flex items-center gap-4 mb-4 md:mb-0">
                        <div className="flex items-center gap-2">
                          <Package className="w-5 h-5 text-sv-mid" />
                          <span className="font-condensed text-sm text-sv-mid">
                            Order {formatOrderId(order)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sv-mid">
                          <Calendar className="w-4 h-4" />
                          <span className="text-sm">{formatDate(order.createdAt)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        {/* Status badge */}
                        <div
                          className={`flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-condensed uppercase tracking-wider ${getStatusColor(order.status)}`}
                        >
                          {getStatusIcon(order.status)}
                          {getStatusLabel(order.status)}
                        </div>
                        <div className="text-right">
                          <p className="font-condensed text-tb-white">₹{order.totalAmount}</p>
                        </div>

                        {/* Cancel — only for pending */}
                        {isPending && (
                          <button
                            onClick={() => cancelOrder(order._id)}
                            className="px-3 py-1 bg-red-500/20 border border-red-500/50 rounded text-red-400 text-xs font-condensed uppercase tracking-wider hover:bg-red-500/30 transition-colors duration-200"
                          >
                            Cancel
                          </button>
                        )}

                        {/* Request Return — only for delivered, not if return already filed */}
                        {isDelivered && !isReturn && (
                          <button
                            onClick={() => setReturnTarget(order)}
                            className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/40 rounded text-amber-400 text-xs font-condensed uppercase tracking-wider hover:bg-amber-500/20 transition-colors duration-200"
                          >
                            <RotateCcw className="w-3 h-3" />
                            Return
                          </button>
                        )}

                        {/* Return status info for return_approved — show refund note */}
                        {order.status === 'return_approved' && (
                          <span className="font-condensed text-[10px] text-emerald-400/70 tracking-wider">
                            Refund in 5–7 days
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Return info banner */}
                    {isReturn && (
                      <div className={`mb-4 px-4 py-2.5 rounded-lg border text-xs font-condensed tracking-wider ${
                        order.status === 'return_requested' ? 'bg-amber-500/5 border-amber-500/20 text-amber-300/80' :
                        order.status === 'return_approved'  ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-300/80' :
                        'bg-rose-500/5 border-rose-500/20 text-rose-300/80'
                      }`}>
                        {order.status === 'return_requested' && 'Your return request is under review. We\'ll contact you within 2–3 business days.'}
                        {order.status === 'return_approved'  && 'Return approved! Your refund (order total − ₹50 shipping) will be processed within 5–7 business days.'}
                        {order.status === 'return_rejected'  && 'Your return request was not approved. Contact us at +91 95611 72681 if you have questions.'}
                      </div>
                    )}

                    <div className="border-t border-white/10 pt-4">
                      <h3 className="font-condensed text-sm text-sv-mid uppercase tracking-wider mb-3">Items</h3>
                      <div className="space-y-3">
                        {(order.products ?? []).map((product, index) => {
                          const canReview = isDelivered && product.productId && reviewableProducts.has(product.productId);
                          const existing  = product.productId ? myReviews[product.productId] : undefined;

                          return (
                            <div key={index} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                              <div className="flex-1 min-w-0">
                                <p className="text-tb-white font-medium">{product.name}</p>
                                <p className="text-sv-mid text-sm">
                                  {product.size ? `Size: ${product.size} · ` : ''}Qty: {product.quantity}
                                </p>
                                {existing && (
                                  <div className="mt-1.5 flex items-center gap-2">
                                    <LightningRating value={existing.rating} readonly size="sm" />
                                    <span className="font-condensed text-[10px] text-sv-mid uppercase tracking-[0.14em]">Your review</span>
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                                <p className="text-tb-white">₹{product.price?.toFixed(2) ?? '—'}</p>
                                {product.productId && (
                                  <Link
                                    to={`/product/${product.productId}`}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/20 rounded text-tb-white text-xs font-condensed uppercase tracking-wider hover:bg-white/10 hover:border-white/30 transition-colors duration-200 whitespace-nowrap"
                                  >
                                    <Eye className="w-3 h-3" />
                                    View Product
                                  </Link>
                                )}
                                {canReview && (
                                  <button
                                    onClick={() => setReviewTarget({
                                      product: { id: product.productId!, name: product.name, image: product.image },
                                      existing: existing ?? null,
                                    })}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-brass/15 border border-brass/40 rounded text-brass text-xs font-condensed uppercase tracking-wider hover:bg-brass/25 transition-colors duration-200 whitespace-nowrap"
                                  >
                                    <Pencil className="w-3 h-3" />
                                    {existing ? 'Edit Review' : 'Review Product'}
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* Review Modal */}
      <ReviewModal
        open={!!reviewTarget}
        onClose={() => setReviewTarget(null)}
        product={reviewTarget?.product ?? { id: '', name: '' }}
        existingReview={reviewTarget?.existing ?? null}
        onSubmit={async (input) => {
          if (!reviewTarget) return;
          await submitReview(reviewTarget.product.id, input);
        }}
        onUpdate={async (input) => {
          if (!reviewTarget?.existing) return;
          await updateReview(reviewTarget.existing._id, reviewTarget.product.id, input);
        }}
        onDelete={async () => {
          if (!reviewTarget?.existing) return;
          await deleteReview(reviewTarget.existing._id, reviewTarget.product.id);
        }}
      />

      {/* Return Request Modal */}
      <ReturnRequestModal
        open={!!returnTarget}
        onClose={() => setReturnTarget(null)}
        orderId={returnTarget?._id ?? ''}
        orderNumber={returnTarget?.orderNumber ?? formatOrderId(returnTarget ?? { _id: '', userId: '', products: [], totalAmount: 0, status: '', createdAt: '' })}
        totalAmount={returnTarget?.totalAmount ?? 0}
        onSubmit={submitReturn}
      />
    </div>
  );
};

export default Orders;
