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
  returnShippingCharges?: number;
  returnRefundAmount?: number;
}

const RETURN_STATUSES = ['return_requested', 'return_approved', 'return_rejected', 'refund_issued'];

const Orders = () => {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const cachedOnRender = user ? getStaleOrders(user.uid) : null;
  const displayOrders = orders.length > 0 ? orders : (cachedOnRender || []);
  const isCurrentlyLoading = authLoading || (ordersLoading && !cachedOnRender);

  // ── Reviews state ─────────────────────────────────────────────────────────
  const [myReviews, setMyReviews] = useState<Record<string, ReviewData>>({});
  const [reviewTarget, setReviewTarget] = useState<{
    product: { id: string; name: string; image?: string };
    existing: ReviewData | null;
  } | null>(null);

  // ── Return request state ──────────────────────────────────────────────────
  const [returnTarget, setReturnTarget] = useState<Order | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setOrdersLoading(false); return; }

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
    if (cached) { setOrders(cached); setOrdersLoading(false); }
    else setOrdersLoading(true);

    fetchOrders(false);
    const interval = setInterval(() => { fetchOrders(true); }, 10000);
    return () => clearInterval(interval);
  }, [user, authLoading]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const token = await user.getIdToken();
        const r = await fetch('/api/reviews?mine=true', { headers: { Authorization: `Bearer ${token}` } });
        if (!r.ok) return;
        const { reviews } = await r.json();
        if (cancelled) return;
        const map: Record<string, ReviewData> = {};
        for (const rv of reviews ?? []) map[rv.productId] = rv;
        setMyReviews(map);
      } catch { /* silent */ }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const reviewableProducts = useMemo(() => {
    const set = new Set<string>();
    for (const o of orders) {
      if ((o.status ?? '').toLowerCase() !== 'delivered') continue;
      for (const p of o.products ?? []) { if (p.productId) set.add(p.productId); }
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
    setMyReviews(prev => { const next = { ...prev }; delete next[productId]; return next; });
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
        setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: 'cancelled' } : o));
      } else {
        alert(data.error || 'Failed to cancel order');
      }
    } catch {
      alert('Failed to cancel order — network error');
    }
  };

  const submitReturn = async (orderId: string, reason: string, description: string, upiId: string) => {
    if (!user) throw new Error('Not signed in');
    const token = await user.getIdToken();
    const r = await fetch('/api/returns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ orderId, reason, description, upiId }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data?.error || 'Failed to submit return request');
    setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: 'return_requested' } : o));
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
      case 'refund_issued':     return 'text-teal-400 bg-teal-400/10 border-teal-400/30';
      default:                  return 'text-sv-mid bg-white/5 border-white/10';
    }
  };

  const getStatusIcon = (status: string) => {
    switch ((status ?? '').toLowerCase()) {
      case 'pending':           return <Clock className="w-3 h-3" />;
      case 'confirmed':         return <CheckCircle className="w-3 h-3" />;
      case 'packed':            return <Package className="w-3 h-3" />;
      case 'shipped':           return <Truck className="w-3 h-3" />;
      case 'delivered':         return <CheckCircle className="w-3 h-3" />;
      case 'cancelled':         return <X className="w-3 h-3" />;
      case 'return_requested':  return <RotateCcw className="w-3 h-3" />;
      case 'return_approved':   return <CheckCircle className="w-3 h-3" />;
      case 'return_rejected':   return <X className="w-3 h-3" />;
      case 'refund_issued':     return <CheckCircle className="w-3 h-3" />;
      default:                  return <Package className="w-3 h-3" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch ((status ?? '').toLowerCase()) {
      case 'return_requested': return 'Return Pending';
      case 'return_approved':  return 'Return Approved';
      case 'return_rejected':  return 'Return Rejected';
      case 'refund_issued':    return 'Refund Issued';
      default:                 return status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Pending';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
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
          <Link to="/" className="inline-flex items-center gap-2 px-6 py-3 bg-brass text-void font-condensed text-sm uppercase tracking-wider hover:bg-yellow-400 transition-all duration-200">
            <Home className="w-4 h-4" />Back to Home
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
          className="max-w-2xl mx-auto"
        >
          <div className="mb-8">
            <button
              onClick={() => navigate(-1)}
              className="font-condensed font-semibold text-xs tracking-[0.18em] uppercase text-sv-mid hover:text-brass transition-colors duration-200 mb-8 flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />Back
            </button>
            <h1 className="font-display text-3xl tracking-[0.2em] text-tb-white uppercase mb-1">Your Orders</h1>
            <p className="text-sv-mid text-sm">Track and manage your orders</p>
          </div>

          {isCurrentlyLoading ? (
            <div className="flex flex-col gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-surface border border-white/10 rounded-xl p-5 animate-pulse">
                  <div className="flex justify-between mb-4">
                    <div className="space-y-2"><div className="h-3 w-28 bg-white/10 rounded" /><div className="h-2.5 w-20 bg-white/5 rounded" /></div>
                    <div className="h-6 w-20 bg-white/10 rounded-full" />
                  </div>
                  <div className="space-y-2 pt-3 border-t border-white/5">
                    <div className="h-3 w-3/4 bg-white/5 rounded" />
                    <div className="h-2.5 w-1/2 bg-white/5 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-400 mb-4">{error}</p>
              <button onClick={() => window.location.reload()} className="px-4 py-2 bg-brass text-void rounded hover:bg-yellow-400 transition-colors font-condensed text-sm uppercase tracking-wider">
                Try Again
              </button>
            </div>
          ) : displayOrders.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
              <Package className="w-16 h-16 text-sv-mid mx-auto mb-4" />
              <h2 className="font-display text-xl tracking-[0.1em] text-tb-white uppercase mb-2">No Orders Yet</h2>
              <p className="text-sv-mid mb-8 text-sm">Your orders will appear here</p>
              <Link to="/" className="inline-flex items-center gap-2 px-6 py-3 bg-brass text-void font-condensed text-sm uppercase tracking-wider hover:bg-yellow-400 transition-all duration-200">
                Start Shopping
              </Link>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {displayOrders.map((order, idx) => {
                const isDelivered = order.status === 'delivered';
                const isPending   = order.status === 'pending';
                const isReturn    = RETURN_STATUSES.includes(order.status);
                const refundAmt   = order.returnRefundAmount ?? 0;
                const shipCost    = order.returnShippingCharges ?? 50;

                return (
                  <motion.div
                    key={order._id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: idx * 0.04 }}
                    className="bg-surface border border-white/10 rounded-xl overflow-hidden"
                  >
                    {/* ── Card Header ─────────────────────────────────────── */}
                    <div className="px-4 py-3.5 flex items-start justify-between gap-3 border-b border-white/8">
                      <div className="min-w-0">
                        <p className="font-condensed font-semibold text-tb-white text-xs tracking-[0.12em] uppercase">
                          {formatOrderId(order)}
                        </p>
                        <p className="flex items-center gap-1 mt-0.5 font-condensed text-[11px] text-sv-mid">
                          <Calendar className="w-3 h-3" />
                          {formatDate(order.createdAt)}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-condensed uppercase tracking-wider ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)}
                          {getStatusLabel(order.status)}
                        </span>
                        <p className="font-condensed font-semibold text-tb-white text-sm">
                          ₹{order.totalAmount?.toLocaleString('en-IN') ?? '—'}
                        </p>
                      </div>
                    </div>

                    {/* ── Return Status Banner ─────────────────────────────── */}
                    {isReturn && (
                      <div className={`px-4 py-2.5 text-[11px] font-condensed tracking-wide leading-relaxed border-b ${
                        order.status === 'return_requested' ? 'bg-amber-500/5 border-amber-500/15 text-amber-300/80' :
                        order.status === 'return_approved'  ? 'bg-emerald-500/5 border-emerald-500/15 text-emerald-300/80' :
                        order.status === 'refund_issued'    ? 'bg-teal-500/5 border-teal-500/15 text-teal-300/80' :
                        'bg-rose-500/5 border-rose-500/15 text-rose-300/80'
                      }`}>
                        {order.status === 'return_requested' && 'Return request submitted. Our team will review and contact you within 2–3 business days.'}
                        {order.status === 'return_approved'  && (
                          <>Return approved! Refund of <span className="font-semibold text-emerald-300">₹{refundAmt.toLocaleString('en-IN')}</span> (₹{order.totalAmount?.toLocaleString('en-IN')} order − ₹{shipCost} shipping) will be processed within 5–7 business days.</>
                        )}
                        {order.status === 'refund_issued'    && (
                          <>Refund of <span className="font-semibold text-teal-300">₹{refundAmt.toLocaleString('en-IN')}</span> has been issued to your UPI account.</>
                        )}
                        {order.status === 'return_rejected'  && 'Your return request was not approved. Contact support at +91 95611 72681.'}
                      </div>
                    )}

                    {/* ── Items ───────────────────────────────────────────── */}
                    <div className="px-4 py-3.5 space-y-3.5">
                      {(order.products ?? []).map((product, index) => {
                        const canReview = isDelivered && !!product.productId && reviewableProducts.has(product.productId);
                        const existing  = product.productId ? myReviews[product.productId] : undefined;

                        return (
                          <div key={index} className="flex flex-col gap-2">
                            {/* Product info row */}
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <p className="text-tb-white text-sm font-medium leading-snug line-clamp-2">{product.name}</p>
                                <p className="text-sv-mid text-xs mt-0.5 font-condensed">
                                  {product.size ? `Size ${product.size} · ` : ''}Qty {product.quantity}
                                </p>
                                {existing && (
                                  <div className="mt-1.5 flex items-center gap-1.5">
                                    <LightningRating value={existing.rating} readonly size="sm" />
                                    <span className="font-condensed text-[10px] text-sv-mid uppercase tracking-[0.1em]">Reviewed</span>
                                  </div>
                                )}
                              </div>
                              <p className="font-condensed text-tb-white text-sm shrink-0">
                                ₹{product.price?.toLocaleString('en-IN') ?? '—'}
                              </p>
                            </div>

                            {/* Action buttons row */}
                            {(product.productId || canReview) && (
                              <div className="flex items-center gap-2 flex-wrap">
                                {product.productId && (
                                  <Link
                                    to={`/product/${product.productId}`}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/5 border border-white/15 rounded-md text-[11px] font-condensed uppercase tracking-wider text-sv-mid hover:text-tb-white hover:border-white/30 transition-colors"
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
                                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-brass/10 border border-brass/30 rounded-md text-[11px] font-condensed uppercase tracking-wider text-brass hover:bg-brass/20 transition-colors"
                                  >
                                    <Pencil className="w-3 h-3" />
                                    {existing ? 'Edit Review' : 'Review'}
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* ── Footer: Cancel / Return actions ─────────────────── */}
                    {(isPending || (isDelivered && !isReturn)) && (
                      <div className="px-4 py-3 border-t border-white/8 flex items-center gap-2">
                        {isPending && (
                          <button
                            onClick={() => cancelOrder(order._id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 border border-red-500/30 rounded-md text-red-400 text-xs font-condensed uppercase tracking-wider hover:bg-red-500/20 transition-colors"
                          >
                            <X className="w-3 h-3" />
                            Cancel Order
                          </button>
                        )}
                        {isDelivered && !isReturn && (
                          <button
                            onClick={() => setReturnTarget(order)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-md text-amber-400 text-xs font-condensed uppercase tracking-wider hover:bg-amber-500/20 transition-colors"
                          >
                            <RotateCcw className="w-3 h-3" />
                            Request Return
                          </button>
                        )}
                      </div>
                    )}
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
        productId={reviewTarget?.product.id ?? ''}
        productName={reviewTarget?.product.name ?? ''}
        productImage={reviewTarget?.product.image}
        existing={reviewTarget?.existing ?? null}
        onSubmit={submitReview}
        onUpdate={updateReview}
        onDelete={deleteReview}
      />

      {/* Return Request Modal */}
      {returnTarget && (
        <ReturnRequestModal
          open={!!returnTarget}
          onClose={() => setReturnTarget(null)}
          orderId={returnTarget._id}
          orderNumber={formatOrderId(returnTarget)}
          totalAmount={returnTarget.totalAmount}
          onSubmit={submitReturn}
        />
      )}
    </div>
  );
};

export default Orders;
