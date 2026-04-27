import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Package, Calendar, CheckCircle, Clock, Truck, Home, ArrowLeft, Pencil } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { getStaleOrders, setCachedOrders } from '../lib/ordersCache';
import ReviewModal, { ReviewData } from '../components/reviews/ReviewModal';
import LightningRating from '../components/reviews/LightningRating';

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
}

const Orders = () => {
  const { user } = useAuth();
  // Hydrate from in-memory cache instantly if it's already populated for this user.
  // This makes the page render with content on the first paint instead of a spinner.
  const initialCached = user ? getStaleOrders(user.uid) : null;
  const [orders, setOrders] = useState<Order[]>(initialCached || []);
  const [loading, setLoading] = useState(!initialCached);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // ── Reviews state ───────────────────────────────────────────────────────
  // Map of productId → user's existing review (for quick lookup per item).
  const [myReviews, setMyReviews] = useState<Record<string, ReviewData>>({});
  const [reviewTarget, setReviewTarget] = useState<{
    product: { id: string; name: string; image?: string };
    existing: ReviewData | null;
  } | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      // If we have any cached data for this user, render it immediately
      // and revalidate silently in the background (stale-while-revalidate).
      const cached = getStaleOrders(user.uid);
      if (cached) {
        setOrders(cached);
        setLoading(false);
      }

      try {
        const token = await user.getIdToken();
        const response = await fetch('/api/orders', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          const fresh: Order[] = data.orders || [];
          setOrders(fresh);
          setCachedOrders(user.uid, fresh);
        } else if (!cached) {
          setError('Failed to fetch orders');
        }
      } catch (err) {
        if (!cached) setError('Error fetching orders');
        console.error('Error fetching orders:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  // Fetch the user's existing reviews (so each delivered item knows whether to
  // show "Review Product" vs "Edit Review"). Lightweight — runs once per user.
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
        /* silent — review badges are non-critical */
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  // Has this order been delivered AND does the product carry a productId we can review?
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
    const r = await fetch(`/api/reviews/manage?id=${reviewId}`, {
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
    const r = await fetch(`/api/reviews/manage?id=${reviewId}`, {
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
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId }),
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log('Order cancelled successfully:', data);
        // Update local state to reflect the cancellation
        setOrders(prev => 
          prev.map(order => 
            order._id === orderId 
              ? { ...order, status: 'cancelled' }
              : order
          )
        );
        alert('Order cancelled successfully');
      } else {
        console.error('Cancel order failed:', data);
        alert('Failed to cancel order: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Cancel order error:', err);
      alert('Failed to cancel order - network error');
    }
  };

  const getStatusColor = (status: string) => {
    switch ((status ?? '').toLowerCase()) {
      case 'pending':
        return 'text-gray-400 bg-gray-400/10 border-gray-400/30';
      case 'confirmed':
        return 'text-blue-400 bg-blue-400/10 border-blue-400/30';
      case 'shipped':
        return 'text-orange-400 bg-orange-400/10 border-orange-400/30';
      case 'delivered':
        return 'text-green-400 bg-green-400/10 border-green-400/30';
      default:
        return 'text-sv-mid bg-white/5 border-white/10';
    }
  };

  const getStatusIcon = (status: string) => {
    switch ((status ?? '').toLowerCase()) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'confirmed':
        return <CheckCircle className="w-4 h-4" />;
      case 'shipped':
        return <Truck className="w-4 h-4" />;
      case 'delivered':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display text-3xl tracking-[0.2em] text-tb-white uppercase mb-4">
            Sign In Required
          </h1>
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
            <h1 className="font-display text-3xl tracking-[0.2em] text-tb-white uppercase mb-2">
              Your Orders
            </h1>
            <p className="text-sv-mid">Track and manage your orders</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brass"></div>
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
          ) : orders.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <Package className="w-16 h-16 text-sv-mid mx-auto mb-4" />
              <h2 className="font-display text-xl tracking-[0.1em] text-tb-white uppercase mb-2">
                No Orders Yet
              </h2>
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
              {orders.map((order) => (
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
                          Order #{order._id.slice(-8)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sv-mid">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm">{formatDate(order.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-condensed uppercase tracking-wider ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {getStatusIcon(order.status)}
                        {order.status}
                      </div>
                      <div className="text-right">
                        <p className="font-condensed text-tb-white">₹{order.totalAmount}</p>
                      </div>
                      {order.status !== 'cancelled' && order.status !== 'delivered' && (
                        <button
                          onClick={() => cancelOrder(order._id)}
                          className="px-3 py-1 bg-red-500/20 border border-red-500/50 rounded text-red-400 text-xs font-condensed uppercase tracking-wider hover:bg-red-500/30 transition-colors duration-200"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-white/10 pt-4">
                    <h3 className="font-condensed text-sm text-sv-mid uppercase tracking-wider mb-3">
                      Items
                    </h3>
                    <div className="space-y-3">
                      {(order.products ?? []).map((product, index) => {
                        const isDelivered = (order.status ?? '').toLowerCase() === 'delivered';
                        const canReview = isDelivered && product.productId && reviewableProducts.has(product.productId);
                        const existing = product.productId ? myReviews[product.productId] : undefined;

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
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Review Modal — single instance reused for all items */}
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
    </div>
  );
};

export default Orders;
