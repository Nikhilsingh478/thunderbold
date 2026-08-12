import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { queryClient } from '../lib/queryClient';
import {
  Package, Calendar, CheckCircle, Clock, Truck, Home, ArrowLeft,
  Pencil, Eye, X, RotateCcw, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import ReviewModal, { ReviewData } from '../components/reviews/ReviewModal';
import LightningRating from '../components/reviews/LightningRating';
import { formatOrderId } from '../lib/utils';
import ReturnRequestModal from '../components/ReturnRequestModal';
import { optimizeCloudinaryUrl, IMG_SIZES, PLACEHOLDER } from '../lib/cloudinary';


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
  adminNotes?: string;
  giftMessage?: string;
  giftCardId?: string;
}

interface OrdersApiResponse {
  orders: Order[];
  count: number;
  total: number;
  page: number;
  totalPages: number;
  limit: number;
}

const RETURN_STATUSES = ['return_requested', 'return_approved', 'return_rejected', 'refund_issued'];

// ── Pagination Component ───────────────────────────────────────────────────────
function Pagination({
  currentPage,
  totalPages,
  totalOrders,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  totalOrders: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const getPageNumbers = (): (number | '…')[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | '…')[] = [1];
    if (currentPage > 4) pages.push('…');
    const rangeStart = Math.max(2, currentPage - 1);
    const rangeEnd   = Math.min(totalPages - 1, currentPage + 1);
    for (let i = rangeStart; i <= rangeEnd; i++) pages.push(i);
    if (currentPage < totalPages - 3) pages.push('…');
    pages.push(totalPages);
    return pages;
  };

  const btnBase =
    'w-8 h-8 flex items-center justify-center rounded border font-condensed text-xs transition-colors';

  return (
    <div className="flex flex-col items-center gap-2 py-2">
      <div className="flex items-center gap-1">
        {/* Prev */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`${btnBase} border-white/15 text-sv-mid hover:text-tb-white hover:border-white/30 disabled:opacity-30 disabled:cursor-not-allowed`}
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        {getPageNumbers().map((page, i) =>
          page === '…' ? (
            <span
              key={`e${i}`}
              className="w-8 h-8 flex items-center justify-center text-sv-dim font-condensed text-xs"
            >
              …
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page as number)}
              className={`${btnBase} ${
                page === currentPage
                  ? 'bg-brass text-void border-brass font-bold'
                  : 'bg-white/5 border-white/15 text-sv-mid hover:text-tb-white hover:border-white/30'
              }`}
            >
              {page}
            </button>
          )
        )}

        {/* Next */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`${btnBase} border-white/15 text-sv-mid hover:text-tb-white hover:border-white/30 disabled:opacity-30 disabled:cursor-not-allowed`}
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
      <p className="font-condensed text-[10px] text-sv-dim uppercase tracking-wider">
        Page {currentPage} of {totalPages} &nbsp;·&nbsp; {totalOrders} order{totalOrders !== 1 ? 's' : ''}
      </p>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
const Orders = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [currentPage, setCurrentPage] = useState(1);

  // ── TanStack Query for orders — staleTime 30s, gcTime 5m, placeholderData keepPreviousData ──
  const {
    data: ordersResponse,
    isLoading: ordersLoading,
    isError,
    error: ordersQueryError,
    refetch: refetchOrders,
  } = useQuery<OrdersApiResponse>({
    queryKey: ['orders', currentPage],
    queryFn: async () => {
      const token = await user!.getIdToken();
      const r = await fetch(`/api/orders?page=${currentPage}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) throw new Error('Failed to load orders. Please try again.');
      return r.json();
    },
    enabled: !!user && !authLoading,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    placeholderData: (previousData) => previousData,
    refetchInterval: 10_000, // 10s background poll for order status updates
  });

  const orders: Order[] = ordersResponse?.orders ?? [];
  const totalPages = ordersResponse?.totalPages ?? 1;
  const totalOrders = ordersResponse?.total ?? orders.length;
  const error = isError ? (ordersQueryError instanceof Error ? ordersQueryError.message : 'Failed to load orders') : '';

  // ── Reviews state ──────────────────────────────────────────────────────────
  const [myReviews, setMyReviews] = useState<Record<string, ReviewData>>({});
  const [reviewTarget, setReviewTarget] = useState<{
    product: { id: string; name: string; image?: string };
    existing: ReviewData | null;
  } | null>(null);

  // ── Return request state ───────────────────────────────────────────────────
  const [returnTarget, setReturnTarget] = useState<Order | null>(null);

  // Fetch user's reviews (for review buttons)
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const token = await user.getIdToken();
        const r = await fetch('/api/reviews?mine=true', { headers: { Authorization: `Bearer ${token}` } });
        if (!r.ok || cancelled) return;
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
      if (o.status?.toLowerCase() !== 'delivered') continue;
      for (const p of o.products ?? []) { if (p.productId) set.add(p.productId); }
    }
    return set;
  }, [orders]);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Review actions ─────────────────────────────────────────────────────────
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
    setMyReviews(prev => { const n = { ...prev }; delete n[productId]; return n; });
  };

  const handleReviewSubmit = async (input: { rating: number; comment: string }) => {
    if (!reviewTarget?.product.id) return;
    await submitReview(reviewTarget.product.id, input);
  };

  const handleReviewUpdate = async (input: { rating: number; comment: string }) => {
    if (!reviewTarget?.existing?._id || !reviewTarget?.product.id) return;
    await updateReview(reviewTarget.existing._id, reviewTarget.product.id, input);
  };

  const handleReviewDelete = async () => {
    if (!reviewTarget?.existing?._id || !reviewTarget?.product.id) return;
    await deleteReview(reviewTarget.existing._id, reviewTarget.product.id);
  };


  // ── Cancel order ───────────────────────────────────────────────────────────
  const cancelOrder = async (orderId: string) => {
    if (!user || !confirm('Are you sure you want to cancel this order?')) return;
    try {
      const token = await user.getIdToken();
      const r = await fetch('/api/orders/cancel', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ orderId }),
      });
      const data = await r.json();
      if (r.ok) {
        queryClient.invalidateQueries({ queryKey: ['orders'] });
      } else {
        alert(data.error || 'Failed to cancel order');
      }
    } catch {
      alert('Network error — please try again');
    }
  };

  // ── Submit return ──────────────────────────────────────────────────────────
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
    queryClient.invalidateQueries({ queryKey: ['orders'] });
  };

  // ── Status helpers ─────────────────────────────────────────────────────────
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':          return 'text-gray-400 bg-gray-400/10 border-gray-400/30';
      case 'confirmed':        return 'text-blue-400 bg-blue-400/10 border-blue-400/30';
      case 'packed':           return 'text-violet-400 bg-violet-400/10 border-violet-400/30';
      case 'shipped':          return 'text-orange-400 bg-orange-400/10 border-orange-400/30';
      case 'delivered':        return 'text-green-400 bg-green-400/10 border-green-400/30';
      case 'cancelled':        return 'text-red-400 bg-red-400/10 border-red-400/30';
      case 'return_requested': return 'text-amber-400 bg-amber-400/10 border-amber-400/30';
      case 'return_approved':  return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30';
      case 'return_rejected':  return 'text-rose-400 bg-rose-400/10 border-rose-400/30';
      case 'refund_issued':    return 'text-teal-400 bg-teal-400/10 border-teal-400/30';
      default:                 return 'text-sv-mid bg-white/5 border-white/10';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':          return <Clock className="w-3 h-3" />;
      case 'confirmed':        return <CheckCircle className="w-3 h-3" />;
      case 'packed':           return <Package className="w-3 h-3" />;
      case 'shipped':          return <Truck className="w-3 h-3" />;
      case 'delivered':        return <CheckCircle className="w-3 h-3" />;
      case 'cancelled':        return <X className="w-3 h-3" />;
      case 'return_requested': return <RotateCcw className="w-3 h-3" />;
      case 'return_approved':  return <CheckCircle className="w-3 h-3" />;
      case 'return_rejected':  return <X className="w-3 h-3" />;
      case 'refund_issued':    return <CheckCircle className="w-3 h-3" />;
      default:                 return <Package className="w-3 h-3" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'return_requested': return 'Return Pending';
      case 'return_approved':  return 'Return Approved';
      case 'return_rejected':  return 'Return Rejected';
      case 'refund_issued':    return 'Refund Issued';
      default:                 return status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Pending';
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  // ── Render guards ──────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brass mx-auto mb-4" />
          <p className="font-condensed text-xs text-sv-mid uppercase tracking-[0.16em]">Loading…</p>
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

  // ── Loading skeleton ───────────────────────────────────────────────────────
  const loadingSkeleton = (
    <div className="flex flex-col gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-surface border border-white/10 rounded-xl p-5 animate-pulse">
          <div className="flex justify-between mb-4">
            <div className="space-y-2">
              <div className="h-3 w-28 bg-white/10 rounded" />
              <div className="h-2.5 w-20 bg-white/5 rounded" />
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="h-5 w-20 bg-white/10 rounded-full" />
              <div className="h-3 w-12 bg-white/5 rounded" />
            </div>
          </div>
          <div className="space-y-2 pt-3 border-t border-white/5">
            <div className="h-3 w-3/4 bg-white/5 rounded" />
            <div className="h-2.5 w-1/2 bg-white/5 rounded" />
          </div>
        </div>
      ))}
    </div>
  );

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-void">
      <div className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto"
        >
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => navigate(-1)}
              className="font-display font-semibold text-xs tracking-[0.14em] uppercase text-zinc-300 hover:text-brass transition-colors duration-200 mb-6 flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />Back
            </button>
            <div className="flex items-baseline justify-between gap-4 flex-wrap">
              <div>
                <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-[0.12em] text-white uppercase mb-1">Your Orders</h1>
                <p className="text-zinc-300 font-display text-xs sm:text-sm">
                  {totalOrders > 0 ? `${totalOrders} order${totalOrders !== 1 ? 's' : ''} total` : 'Track and manage your orders'}
                </p>
              </div>
            </div>
          </div>

          {/* Pagination — top (only when > 1 page) */}
          {!ordersLoading && totalPages > 1 && (
            <div className="mb-5">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalOrders={totalOrders}
                onPageChange={handlePageChange}
              />
            </div>
          )}

          {/* Content */}
          {ordersLoading ? (
            loadingSkeleton
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-400 font-display text-sm mb-4">{error}</p>
              <button
                onClick={() => refetchOrders()}
                className="px-5 py-2.5 bg-brass text-black rounded-lg hover:bg-yellow-400 transition-colors font-display text-xs font-bold uppercase tracking-wider shadow"
              >
                Try Again
              </button>
            </div>
          ) : orders.length === 0 && totalOrders === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 bg-white/[0.02] border border-white/10 rounded-2xl p-8">
              <Package className="w-14 h-14 text-zinc-400 mx-auto mb-4" />
              <h2 className="font-display font-bold text-xl tracking-[0.1em] text-white uppercase mb-2">No Orders Yet</h2>
              <p className="text-zinc-300 font-display text-sm mb-8">Your orders will appear here once placed.</p>
              <Link to="/" className="inline-flex items-center gap-2 px-6 py-3 bg-brass text-black font-display font-bold text-xs uppercase tracking-wider hover:bg-yellow-400 transition-all duration-200 rounded-xl shadow-lg">
                Start Shopping
              </Link>
            </motion.div>
          ) : (
            <>
              <div className="space-y-5">
                {orders.map((order, idx) => {
                  const isDelivered = order.status === 'delivered';
                  const isPending   = order.status === 'pending';
                  const isReturn    = RETURN_STATUSES.includes(order.status);
                  const refundAmt   = order.returnRefundAmount ?? 0;
                  const shipCost    = order.returnShippingCharges ?? 50;

                  return (
                    <motion.div
                      key={order._id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: idx * 0.04 }}
                      className="bg-[#0f0f0f] border border-white/15 rounded-2xl overflow-hidden shadow-xl"
                    >
                      {/* Card Header */}
                      <div className="px-4 sm:px-5 py-4 flex items-start justify-between gap-3 border-b border-white/10 bg-white/[0.02]">
                        <div className="min-w-0">
                          <p className="font-display font-bold text-white text-xs sm:text-sm tracking-wide uppercase truncate">
                            {formatOrderId(order)}
                          </p>
                          <p className="flex items-center gap-1.5 mt-1 font-display text-xs text-zinc-300">
                            <Calendar className="w-3.5 h-3.5 text-brass shrink-0" />
                            {formatDate(order.createdAt)}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <span className={`flex items-center gap-1 px-3 py-1 rounded-full border text-[11px] font-display font-semibold uppercase tracking-wider ${getStatusColor(order.status)}`}>
                            {getStatusIcon(order.status)}
                            {getStatusLabel(order.status)}
                          </span>
                          <p className="font-display font-bold text-brass text-sm sm:text-base">
                            ₹{order.totalAmount?.toLocaleString('en-IN') ?? '—'}
                          </p>
                        </div>
                      </div>

                      {/* Return banner */}
                      {isReturn && (
                        <div className={`px-5 py-3 text-xs font-display tracking-wide leading-relaxed border-b ${
                          order.status === 'return_requested' ? 'bg-amber-500/10 border-amber-500/20 text-amber-200' :
                          order.status === 'return_approved'  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200' :
                          order.status === 'refund_issued'    ? 'bg-teal-500/10 border-teal-500/20 text-teal-200' :
                          'bg-rose-500/10 border-rose-500/20 text-rose-200'
                        }`}>
                          {order.status === 'return_requested' && 'Return submitted. Our team will review and contact you within 2–3 business days.'}
                          {order.status === 'return_approved'  && (
                            <>Return approved! Refund of{' '}
                              <span className="font-bold text-emerald-300">₹{refundAmt.toLocaleString('en-IN')}</span>
                              {' '}(₹{order.totalAmount?.toLocaleString('en-IN')} − ₹{shipCost} shipping) will be processed within 5–7 business days.</>
                          )}
                          {order.status === 'refund_issued'    && (
                            <>Refund of{' '}
                              <span className="font-bold text-teal-300">₹{refundAmt.toLocaleString('en-IN')}</span>
                              {' '}has been issued to your UPI account.</>
                          )}
                          {order.status === 'return_rejected'  && 'Your return request was not approved. Contact support at +91 95611 72681.'}
                          {/* Admin message */}
                          {order.adminNotes && (
                            <p className="mt-2 pt-2 border-t border-white/10 text-zinc-200">
                              <span className="font-semibold text-white">Note from our team: </span>{order.adminNotes}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Gift Card */}
                      {order.giftCardId && (
                        <div className="px-5 py-3 border-b border-white/10 bg-white/[0.015] flex items-center gap-3.5">
                          <img
                            src={`/gift-cards/${order.giftCardId}.webp`}
                            alt={order.giftCardId}
                            className="w-10 h-14 rounded-md object-cover border border-white/20 shrink-0 shadow"
                          />
                          <div className="min-w-0">
                            <p className="font-display font-semibold text-[11px] text-brass uppercase tracking-wider mb-0.5">Gift Card Included</p>
                            <p className="font-display text-xs text-zinc-200 capitalize font-medium">{order.giftCardId}</p>
                          </div>
                        </div>
                      )}

                      {/* Items */}
                      <div className="px-4 sm:px-5 py-4 space-y-4">
                        {(order.products ?? []).map((product, index) => {
                          const canReview = isDelivered && !!product.productId && reviewableProducts.has(product.productId);
                          const existing  = product.productId ? myReviews[product.productId] : undefined;

                          return (
                            <div key={index} className="flex gap-4 items-start border-b border-white/10 last:border-b-0 pb-4 last:pb-0">
                              {/* Product Image */}
                              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-white/5 border border-white/15 shrink-0">
                                <img
                                  src={optimizeCloudinaryUrl(product.image, IMG_SIZES.thumbnail)}
                                  alt={product.name}
                                  className="w-full h-full object-cover text-transparent"
                                  loading="lazy"
                                  decoding="async"
                                  onError={(e) => {
                                    e.currentTarget.onerror = null;
                                    e.currentTarget.src = PLACEHOLDER;
                                  }}
                                />
                              </div>

                              <div className="min-w-0 flex-1 flex flex-col gap-2">
                                {/* Product details */}
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="text-white text-sm font-display font-semibold leading-snug line-clamp-2">{product.name}</p>
                                    <p className="text-zinc-300 text-xs mt-1 font-display">
                                      {product.size ? `Size: ${product.size} · ` : ''}Qty: {product.quantity}
                                    </p>
                                  </div>
                                  <p className="font-display font-bold text-white text-sm shrink-0">
                                    ₹{product.price?.toLocaleString('en-IN') ?? '—'}
                                  </p>
                                </div>

                                {existing && (
                                  <div className="flex items-center gap-2">
                                    <LightningRating value={existing.rating} readonly size="sm" />
                                    <span className="font-display text-[11px] text-zinc-300 font-medium uppercase tracking-wider">Reviewed</span>
                                  </div>
                                )}

                                {/* Action buttons */}
                                {(product.productId || canReview) && (
                                  <div className="flex items-center gap-2.5 flex-wrap pt-1">
                                    {product.productId && (
                                      <Link
                                        to={`/product/${product.productId}`}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 border border-white/20 rounded-lg text-xs font-display font-semibold uppercase tracking-wider text-zinc-200 hover:text-white hover:bg-white/20 transition-colors"
                                      >
                                        <Eye className="w-3.5 h-3.5" />View Product
                                      </Link>
                                    )}
                                    {canReview && (
                                      <button
                                        onClick={() => setReviewTarget({
                                          product: { id: product.productId!, name: product.name, image: product.image },
                                          existing: existing ?? null,
                                        })}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brass/15 border border-brass/40 rounded-lg text-xs font-display font-bold uppercase tracking-wider text-brass hover:bg-brass/25 transition-colors"
                                      >
                                        <Pencil className="w-3.5 h-3.5" />
                                        {existing ? 'Edit Review' : 'Review'}
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Footer: cancel / return */}
                      {(isPending || (isDelivered && !isReturn)) && (
                        <div className="px-4 sm:px-5 py-3.5 border-t border-white/10 bg-white/[0.02] flex items-center gap-3">
                          {isPending && (
                            <button
                              onClick={() => cancelOrder(order._id)}
                              className="flex items-center gap-1.5 px-4 py-2 bg-red-500/15 border border-red-500/40 rounded-xl text-red-300 text-xs font-display font-bold uppercase tracking-wider hover:bg-red-500/25 transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />Cancel Order
                            </button>
                          )}
                          {isDelivered && !isReturn && (
                            <button
                              onClick={() => setReturnTarget(order)}
                              className="flex items-center gap-1.5 px-4 py-2 bg-amber-500/15 border border-amber-500/40 rounded-xl text-amber-300 text-xs font-display font-bold uppercase tracking-wider hover:bg-amber-500/25 transition-colors"
                            >
                              <RotateCcw className="w-3 h-3" />Request Return
                            </button>
                          )}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {/* Pagination — bottom */}
              {totalPages > 1 && (
                <div className="mt-8">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalOrders={totalOrders}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </>
          )}
        </motion.div>
      </div>

      {/* Review Modal */}
      <ReviewModal
        open={!!reviewTarget}
        onClose={() => setReviewTarget(null)}
        product={reviewTarget?.product ?? { id: '', name: '' }}
        existingReview={reviewTarget?.existing ?? null}
        onSubmit={handleReviewSubmit}
        onUpdate={handleReviewUpdate}
        onDelete={handleReviewDelete}
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
