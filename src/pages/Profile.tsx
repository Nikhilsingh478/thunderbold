import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { queryClient } from '../lib/queryClient';
import { useAuth } from '../context/AuthContext';
import { useNotificationsContext } from '../context/NotificationsContext';
import { Capacitor } from '@capacitor/core';
import { optimizeCloudinaryUrl, IMG_SIZES, PLACEHOLDER } from '../lib/cloudinary';
import { apiUrl } from '../lib/apiBase';

import { deleteUser, getAuth } from 'firebase/auth';
import { toast } from 'sonner';
import { formatOrderId } from '../lib/utils';
import Navbar from '../components/Navbar';
import ScrollProgress from '../components/ScrollProgress';
import CustomCursor from '../components/CustomCursor';
import {
  MapPin,
  Package,
  Pencil,
  Check,
  X,
  Plus,
  Trash2,
  Star,
  ArrowLeft,
  Phone,
  Mail,
  Clock,
  Truck,
  CheckCircle,
  Calendar,
  AlertTriangle,
} from 'lucide-react';

interface Address {
  id: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  landmark: string;
  isDefault: boolean;
  createdAt: string;
}

interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  addresses?: Address[];
}

interface Order {
  _id: string;
  userId: string;
  products: Array<{ name: string; quantity: number; size: string; price: number; image?: string }>;
  totalAmount: number;
  status: string;
  createdAt: string;
  orderNumber?: string;
}

interface OrdersApiResponse {
  orders: Order[];
  count: number;
  total: number;
  page: number;
  totalPages: number;
  limit: number;
}

const emptyAddress = {
  fullName: '', phone: '', addressLine1: '', addressLine2: '',
  city: '', state: '', pincode: '', landmark: '', isDefault: false,
};

type Tab = 'addresses' | 'orders';

export default function Profile() {
  const { user } = useAuth();
  const { testTokenRegistration } = useNotificationsContext();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<Tab>('addresses');

  const [editingName, setEditingName] = useState(false);
  const [editingPhone, setEditingPhone] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [phoneDraft, setPhoneDraft] = useState('');
  const [saving, setSaving] = useState(false);

  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState({ ...emptyAddress });
  const [addressErrors, setAddressErrors] = useState<Record<string, string>>({});
  const [addressSubmitting, setAddressSubmitting] = useState(false);

  const [cancellingOrder, setCancellingOrder] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  useEffect(() => {
    if (!user) { navigate('/'); }
  }, [user, navigate]);

  // ── Profile query — staleTime 60s, gcTime 10m ─────────────────────────────
  const {
    data: profile,
    isLoading: profileLoading,
  } = useQuery<UserProfile | null>({
    queryKey: ['profile'],
    queryFn: async () => {
      const token = await user!.getIdToken();
      const res = await fetch(apiUrl('/api/users'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch profile');
      const json = await res.json();
      return json.data;
    },
    enabled: !!user,
    staleTime: 60 * 1000, // 60 seconds
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // ── Orders query — staleTime 30s, gcTime 5m ───────────────────────────────
  const {
    data: ordersResponse,
    isLoading: ordersLoading,
  } = useQuery<OrdersApiResponse>({
    queryKey: ['orders', 1],
    queryFn: async () => {
      const token = await user!.getIdToken();
      const res = await fetch(apiUrl('/api/orders?page=1'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch orders');
      return res.json();
    },
    enabled: !!user && activeTab === 'orders',
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  const orders: Order[] = ordersResponse?.orders ?? [];

  useEffect(() => {
    if (profile) {
      if (!editingName) setNameDraft(profile.name || '');
      if (!editingPhone) setPhoneDraft(profile.phone || '');
    }
  }, [profile, editingName, editingPhone]);

  const getToken = () => user!.getIdToken();

  const handleDeleteAccount = async () => {
    if (!user) return;
    setDeletingAccount(true);
    try {
      const token = await getToken();
      await fetch(apiUrl('/api/users'), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const authUser = getAuth().currentUser;
      if (authUser) await deleteUser(authUser);
      queryClient.clear();
      toast.success('Account deleted. Goodbye.');
      navigate('/');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Account deletion failed';
      if (message.includes('requires-recent-login')) {
        toast.error('For security, please sign out and sign in again before deleting your account.');
      } else {
        toast.error('Could not delete account. Please try again or contact support.');
      }
      setDeletingAccount(false);
      setShowDeleteModal(false);
    }
  };

  const cancelOrder = async (orderId: string) => {
    setCancellingOrder(orderId);
    try {
      const token = await getToken();
      const res = await fetch(apiUrl('/api/orders/cancel'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        toast.success('Order cancelled successfully');
      } else {
        toast.error(data.error || 'Failed to cancel order');
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setCancellingOrder(null);
    }
  };

  const saveName = async () => {
    const trimmed = nameDraft.trim();
    if (!trimmed || trimmed.length < 2) { toast.error('Enter a valid name'); return; }
    setSaving(true);
    try {
      const token = await getToken();
      const res = await fetch(apiUrl('/api/users'), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: trimmed }),
      });
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ['profile'] });
        setEditingName(false);
        toast.success('Name updated');
      } else {
        toast.error('Failed to update name');
      }
    } catch {
      toast.error('Failed to update name');
    } finally {
      setSaving(false);
    }
  };

  const savePhone = async () => {
    const trimmed = phoneDraft.trim().replace(/\D/g, '');
    if (!trimmed || trimmed.length !== 10 || !/^[6-9]/.test(trimmed)) {
      toast.error('Enter a valid 10-digit Indian mobile number');
      return;
    }
    setSaving(true);
    try {
      const token = await getToken();
      const res = await fetch(apiUrl('/api/users'), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ phone: trimmed }),
      });
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ['profile'] });
        setEditingPhone(false);
        toast.success('Phone updated');
      } else {
        toast.error('Failed to update phone');
      }
    } catch {
      toast.error('Failed to update phone');
    } finally {
      setSaving(false);
    }
  };

  const validateAddressForm = () => {
    const e: Record<string, string> = {};
    if (!addressForm.fullName.trim() || addressForm.fullName.trim().length < 2)
      e.fullName = 'Full name is required';
    if (!/^[6-9]\d{9}$/.test(addressForm.phone.trim()))
      e.phone = 'Enter a valid 10-digit mobile number';
    if (!addressForm.addressLine1.trim() || addressForm.addressLine1.trim().length < 5)
      e.addressLine1 = 'Address is required (min 5 chars)';
    if (!addressForm.city.trim()) e.city = 'City is required';
    if (!addressForm.state.trim()) e.state = 'State is required';
    if (!/^\d{6}$/.test(addressForm.pincode.trim()) || addressForm.pincode.startsWith('0'))
      e.pincode = 'Enter a valid 6-digit pincode';
    return e;
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateAddressForm();
    setAddressErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setAddressSubmitting(true);
    try {
      const token = await getToken();
      const res = await fetch(apiUrl('/api/users'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...addressForm, phone: addressForm.phone.replace(/\D/g, '') }),
      });
      if (res.ok) {
        toast.success('Address saved');
        setShowAddressForm(false);
        setAddressForm({ ...emptyAddress });
        setAddressErrors({});
        queryClient.invalidateQueries({ queryKey: ['profile'] });
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to save address');
      }
    } catch {
      toast.error('Failed to save address');
    } finally {
      setAddressSubmitting(false);
    }
  };

  const handleRemoveAddress = async (id: string) => {
    try {
      const token = await getToken();
      const res = await fetch(apiUrl('/api/users'), {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        toast.success('Address removed');
        queryClient.invalidateQueries({ queryKey: ['profile'] });
      } else {
        toast.error('Failed to remove address');
      }
    } catch {
      toast.error('Failed to remove address');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const token = await getToken();
      const res = await fetch(apiUrl('/api/users'), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'set_default_address', id }),
      });
      if (res.ok) {
        toast.success('Default address updated');
        queryClient.invalidateQueries({ queryKey: ['profile'] });
      } else {
        toast.error('Failed to update default address');
      }
    } catch {
      toast.error('Failed to update default address');
    }
  };

  const getInitials = (name: string) =>
    name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() || '').join('');

  const getStatusConfig = (status: string) => {
    switch ((status ?? '').toLowerCase()) {
      case 'pending':   return { color: 'text-white/60 bg-white/8 border-white/15',         icon: <Clock className="w-3 h-3" />,       label: 'Pending' };
      case 'confirmed': return { color: 'text-sky-300 bg-sky-400/10 border-sky-400/25',      icon: <CheckCircle className="w-3 h-3" />, label: 'Confirmed' };
      case 'shipped':   return { color: 'text-amber-300 bg-amber-400/10 border-amber-400/25', icon: <Truck className="w-3 h-3" />,      label: 'Shipped' };
      case 'delivered': return { color: 'text-emerald-300 bg-emerald-400/10 border-emerald-400/25', icon: <CheckCircle className="w-3 h-3" />, label: 'Delivered' };
      case 'cancelled': return { color: 'text-red-400 bg-red-400/10 border-red-400/25',      icon: <X className="w-3 h-3" />,           label: 'Cancelled' };
      default:          return { color: 'text-white/50 bg-white/5 border-white/10',          icon: <Package className="w-3 h-3" />,    label: status };
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });

  if (!user) return null;

  return (
    <div className="noise-overlay min-h-screen flex flex-col bg-void">
      <CustomCursor />
      <ScrollProgress />
      <Navbar />

      <main className="flex-1 pt-[calc(148px+var(--tb-banner-h))] pb-28 px-4 md:px-10 lg:px-16">
        <div className="max-w-[680px] mx-auto">

          {/* Back */}
          <button
            onClick={() => navigate(-1)}
            className="font-display font-medium text-xs tracking-[0.16em] uppercase text-sv-mid hover:text-white transition-colors duration-200 mb-8 flex items-center gap-2 group"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform duration-200 group-hover:-translate-x-0.5" />
            Back
          </button>

          {profileLoading ? (
            <div className="flex justify-center items-center py-32">
              <div className="w-7 h-7 border-2 border-white/10 border-t-brass rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* ── Profile Card ───────────────────────────────────── */}
              <div className="bg-[#0a0a0a] border border-white/[0.08] rounded-md p-5 md:p-6 mb-6">

                {/* Avatar + Name row */}
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-14 h-14 rounded-full bg-brass/15 border border-brass/30 flex items-center justify-center shrink-0">
                    <span className="font-display font-bold text-lg tracking-wider text-brass">
                      {getInitials(profile?.name || user.email || 'U')}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    {editingName ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={nameDraft}
                          onChange={e => setNameDraft(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditingName(false); }}
                          autoFocus
                          className="bg-transparent border-b border-brass focus:border-brass-bright text-white font-display text-base outline-none pb-0.5 flex-1 min-w-0"
                          placeholder="Your full name"
                          maxLength={100}
                        />
                        <button onClick={saveName} disabled={saving} className="p-1.5 text-brass hover:text-brass-bright transition-colors shrink-0">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => { setEditingName(false); setNameDraft(profile?.name || ''); }} className="p-1.5 text-sv-mid hover:text-white transition-colors shrink-0">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="font-display font-semibold text-lg text-tb-white truncate">
                          {profile?.name || '—'}
                        </span>
                        <button
                          onClick={() => { setEditingName(true); setNameDraft(profile?.name || ''); }}
                          className="p-1 text-sv-mid hover:text-brass transition-colors shrink-0"
                          aria-label="Edit name"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                    <p className="font-display text-xs text-sv-mid font-medium tracking-wide mt-0.5 truncate">
                      Member account
                    </p>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-white/[0.06] mb-5" />

                {/* Email */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-md bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0">
                    <Mail className="w-3.5 h-3.5 text-sv-mid" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-[0.62rem] tracking-[0.18em] uppercase text-sv-mid font-medium mb-0.5">Email</p>
                    <p className="font-display text-sm text-tb-white font-medium truncate">{profile?.email || user.email}</p>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0">
                    <Phone className="w-3.5 h-3.5 text-sv-mid" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-[0.62rem] tracking-[0.18em] uppercase text-sv-mid font-medium mb-0.5">Phone</p>
                    {editingPhone ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="tel"
                          value={phoneDraft}
                          onChange={e => setPhoneDraft(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') savePhone(); if (e.key === 'Escape') setEditingPhone(false); }}
                          autoFocus
                          className="bg-transparent border-b border-brass focus:border-brass-bright text-white font-display text-sm outline-none pb-0.5 flex-1 min-w-0"
                          placeholder="Phone number"
                        />
                        <button onClick={savePhone} disabled={saving} className="p-1 text-brass hover:text-brass-bright transition-colors shrink-0">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => setEditingPhone(false)} className="p-1 text-sv-mid hover:text-white transition-colors shrink-0">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="font-display text-sm text-tb-white font-medium truncate">
                          {profile?.phone || 'Add phone number'}
                        </span>
                        <button
                          onClick={() => { setEditingPhone(true); setPhoneDraft(profile?.phone || ''); }}
                          className="p-1 text-sv-mid hover:text-brass transition-colors shrink-0"
                          aria-label="Edit phone"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Tabs ──────────────────────────────────────────── */}
              <div className="flex border-b border-white/10 mb-6">
                {(['addresses', 'orders'] as Tab[]).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`relative flex items-center gap-2 font-display text-xs font-semibold tracking-[0.18em] uppercase px-5 py-3.5 transition-colors duration-200 ${
                      activeTab === tab ? 'text-tb-white' : 'text-sv-mid hover:text-white'
                    }`}
                  >
                    {tab === 'addresses'
                      ? <><MapPin className="w-3.5 h-3.5 text-brass" />Addresses</>
                      : <><Package className="w-3.5 h-3.5 text-brass" />Orders</>
                    }
                    {activeTab === tab && (
                      <motion.div
                        layoutId="profile-tab-indicator"
                        className="absolute bottom-0 left-0 right-0 h-px bg-brass"
                      />
                    )}
                  </button>
                ))}
              </div>

              {/* ── Tab Content ───────────────────────────────────── */}
              <AnimatePresence mode="wait">

                {/* ADDRESSES */}
                {activeTab === 'addresses' && (
                  <motion.div
                    key="addresses"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  >
                    {/* Section header */}
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-display font-medium text-xs tracking-[0.18em] uppercase text-sv-mid">
                        Saved Addresses
                      </h2>
                      {!showAddressForm && (
                        <button
                          onClick={() => { setShowAddressForm(true); setAddressForm({ ...emptyAddress }); setAddressErrors({}); }}
                          className="flex items-center gap-1.5 px-4 py-2 bg-tb-white text-void font-display font-bold text-[11px] tracking-[0.16em] uppercase hover:bg-white active:scale-95 transition-all duration-200 rounded-sm"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add Address
                        </button>
                      )}
                    </div>

                    {/* Address list */}
                    <div className="space-y-4 mb-6">
                      {(profile?.addresses || []).length === 0 && !showAddressForm ? (
                        <div className="flex flex-col items-center py-16 text-center bg-[#0a0a0a] border border-white/[0.08] rounded-md p-8">
                          <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                            <MapPin className="w-5 h-5 text-brass" />
                          </div>
                          <p className="font-display font-medium text-sm tracking-[0.12em] uppercase text-tb-white mb-1.5">
                            No addresses saved
                          </p>
                          <p className="text-sv-mid font-display text-xs tracking-wide">Add a shipping address to speed up your checkout</p>
                        </div>
                      ) : (
                        (profile?.addresses || []).map((addr) => (
                          <div
                            key={addr.id}
                            className={`bg-[#0a0a0a] border rounded-md p-5 transition-all duration-200 relative ${
                              addr.isDefault ? 'border-brass/40 bg-[#0c0c0c]' : 'border-white/[0.08] hover:border-white/20'
                            }`}
                          >
                            {/* Card Header: Name + Default Badge */}
                            <div className="flex items-center justify-between gap-3 mb-2.5">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="font-display font-semibold text-base text-tb-white truncate">
                                  {addr.fullName}
                                </span>
                                {addr.isDefault && (
                                  <span className="shrink-0 flex items-center gap-1 px-2.5 py-0.5 bg-brass/15 border border-brass/30 text-brass font-display font-bold text-[0.6rem] tracking-[0.16em] uppercase rounded-sm">
                                    <Star className="w-2.5 h-2.5 fill-current" />
                                    Default
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Address details */}
                            <div className="space-y-1 text-xs font-display text-tb-off leading-relaxed">
                              <p className="font-medium text-tb-white">{addr.addressLine1}</p>
                              {addr.addressLine2 && <p className="text-sv-mid">{addr.addressLine2}</p>}
                              <p className="text-sv-mid">
                                {addr.city}, {addr.state} — <span className="text-tb-white font-medium">{addr.pincode}</span>
                              </p>
                              {addr.landmark && (
                                <p className="text-sv-dim italic text-[11px]">Landmark: {addr.landmark}</p>
                              )}
                            </div>

                            {/* Phone number */}
                            <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between">
                              <p className="text-xs text-sv-mid font-display">
                                Contact: <span className="text-tb-white font-medium">{addr.phone}</span>
                              </p>

                              {/* Actions row */}
                              <div className="flex items-center gap-4">
                                {!addr.isDefault && (
                                  <button
                                    onClick={() => handleSetDefault(addr.id)}
                                    className="text-xs text-brass hover:text-brass-bright font-display font-semibold uppercase tracking-[0.12em] transition-colors"
                                  >
                                    Set Default
                                  </button>
                                )}
                                <button
                                  onClick={() => handleRemoveAddress(addr.id)}
                                  className="text-xs text-sv-mid hover:text-red-400 font-display font-medium uppercase tracking-[0.12em] transition-colors"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Add Address Form */}
                    <AnimatePresence>
                      {showAddressForm && (
                        <motion.div
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                          className="bg-[#0a0a0a] border border-white/10 rounded-md p-6 mb-6"
                        >
                          <div className="flex items-center justify-between pb-4 mb-5 border-b border-white/10">
                            <h3 className="font-display font-medium text-xs tracking-[0.2em] uppercase text-tb-white">
                              Add New Address
                            </h3>
                            <button
                              onClick={() => { setShowAddressForm(false); setAddressErrors({}); }}
                              className="p-1 text-sv-mid hover:text-white transition-colors"
                              aria-label="Close form"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          <form onSubmit={handleAddAddress} noValidate className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <AddressField
                                label="Full Name" required
                                value={addressForm.fullName}
                                onChange={v => setAddressForm(p => ({ ...p, fullName: v.replace(/[^a-zA-Z\s.'-]/g, '') }))}
                                error={addressErrors.fullName}
                                placeholder="Full recipient name"
                              />
                              <AddressField
                                label="Phone Number" required type="tel" inputMode="numeric"
                                value={addressForm.phone}
                                onChange={v => setAddressForm(p => ({ ...p, phone: v.replace(/\D/g, '').slice(0, 10) }))}
                                error={addressErrors.phone}
                                placeholder="10-digit mobile number"
                              />
                            </div>

                            <AddressField
                              label="Street Address / Line 1" required
                              value={addressForm.addressLine1}
                              onChange={v => setAddressForm(p => ({ ...p, addressLine1: v }))}
                              error={addressErrors.addressLine1}
                              placeholder="House no., Building, Street, Area"
                            />

                            <AddressField
                              label="Address Line 2 (Optional)"
                              value={addressForm.addressLine2}
                              onChange={v => setAddressForm(p => ({ ...p, addressLine2: v }))}
                              placeholder="Apartment, Suite, Unit, etc."
                            />

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                              <AddressField
                                label="City" required
                                value={addressForm.city}
                                onChange={v => setAddressForm(p => ({ ...p, city: v.replace(/[^a-zA-Z\s'-]/g, '') }))}
                                error={addressErrors.city}
                                placeholder="City"
                              />
                              <AddressField
                                label="State" required
                                value={addressForm.state}
                                onChange={v => setAddressForm(p => ({ ...p, state: v.replace(/[^a-zA-Z\s]/g, '') }))}
                                error={addressErrors.state}
                                placeholder="State"
                              />
                              <div className="col-span-2 sm:col-span-1">
                                <AddressField
                                  label="Pincode" required type="tel" inputMode="numeric"
                                  value={addressForm.pincode}
                                  onChange={v => setAddressForm(p => ({ ...p, pincode: v.replace(/\D/g, '').slice(0, 6) }))}
                                  error={addressErrors.pincode}
                                  placeholder="6-digit PIN"
                                />
                              </div>
                            </div>

                            <AddressField
                              label="Landmark (Optional)"
                              value={addressForm.landmark}
                              onChange={v => setAddressForm(p => ({ ...p, landmark: v }))}
                              placeholder="Nearby landmark for easy delivery"
                            />

                            {/* Default toggle */}
                            <button
                              type="button"
                              onClick={() => setAddressForm(p => ({ ...p, isDefault: !p.isDefault }))}
                              className="flex items-center gap-3 py-2 w-full text-left cursor-pointer group"
                            >
                              <div className={`w-4 h-4 rounded-sm border flex items-center justify-center shrink-0 transition-colors ${
                                addressForm.isDefault ? 'border-brass bg-brass text-black' : 'border-white/20 group-hover:border-white/40'
                              }`}>
                                {addressForm.isDefault && <Check className="w-3 h-3 stroke-[3]" />}
                              </div>
                              <span className="font-display font-medium text-xs tracking-[0.14em] uppercase text-sv-mid group-hover:text-white select-none">
                                Set as my default delivery address
                              </span>
                            </button>

                            <div className="flex gap-3 pt-2">
                              <button
                                type="submit"
                                disabled={addressSubmitting}
                                className="flex-1 py-3 px-6 bg-tb-white text-void font-display font-bold text-xs tracking-[0.18em] uppercase hover:bg-white active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-sm"
                              >
                                {addressSubmitting ? (
                                  <span className="flex items-center justify-center gap-2">
                                    <span className="w-3.5 h-3.5 border-2 border-void/30 border-t-void rounded-full animate-spin" />
                                    Saving...
                                  </span>
                                ) : 'Save Address'}
                              </button>
                              <button
                                type="button"
                                onClick={() => { setShowAddressForm(false); setAddressErrors({}); }}
                                className="px-6 py-3 border border-white/15 text-sv-mid font-display font-medium text-xs tracking-[0.16em] uppercase hover:bg-white/5 hover:text-white transition-all duration-200 rounded-sm"
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}

                {/* ORDERS */}
                {activeTab === 'orders' && (
                  <motion.div
                    key="orders"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-display font-medium text-xs tracking-[0.18em] uppercase text-sv-mid">
                        Order History
                      </h2>
                    </div>

                    {ordersLoading ? (
                      <div className="flex justify-center py-16">
                        <div className="w-7 h-7 border-2 border-white/10 border-t-brass rounded-full animate-spin" />
                      </div>
                    ) : orders.length === 0 ? (
                      <div className="flex flex-col items-center py-14 text-center bg-[#0a0a0a] border border-white/[0.08] rounded-md p-6">
                        <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                          <Package className="w-5 h-5 text-brass" />
                        </div>
                        <p className="font-display font-medium text-sm tracking-[0.1em] uppercase text-tb-white mb-1.5">
                          No orders yet
                        </p>
                        <p className="text-sv-mid font-display text-xs mb-6">Your order history will appear here</p>
                        <Link
                          to="/"
                          className="px-7 py-3 bg-tb-white text-void font-display font-bold text-xs tracking-[0.18em] uppercase hover:bg-white transition-colors duration-200 rounded-sm"
                        >
                          Start Shopping
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {orders.map((order) => {
                          const statusCfg = getStatusConfig(order.status);
                          return (
                            <div
                              key={order._id}
                              className="bg-[#0a0a0a] border border-white/[0.08] rounded-md overflow-hidden"
                            >
                              {/* Card header */}
                              <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-3">
                                <div>
                                  <p className="font-display font-semibold text-xs tracking-[0.14em] text-tb-white uppercase">
                                    {formatOrderId(order)}
                                  </p>
                                  <div className="flex items-center gap-1.5 mt-0.5 text-sv-mid text-xs font-display">
                                    <Calendar className="w-3.5 h-3.5" />
                                    {formatDate(order.createdAt)}
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-1.5">
                                  <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[0.62rem] font-display font-semibold uppercase tracking-wider ${statusCfg.color}`}>
                                    {statusCfg.icon}
                                    {statusCfg.label}
                                  </span>
                                  <span className="font-display text-base text-brass font-bold">
                                    ₹{order.totalAmount?.toLocaleString('en-IN')}
                                  </span>
                                </div>
                              </div>

                              {/* Products */}
                              <div className="border-t border-white/[0.06] px-4 py-3 space-y-2.5">
                                {(order.products ?? []).map((p, idx) => (
                                  <div key={idx} className="flex items-start gap-3 border-b border-white/[0.04] last:border-b-0 pb-3 last:pb-0">
                                    {/* Product Image */}
                                    <div className="w-12 h-12 rounded-sm overflow-hidden bg-[#070707] border border-white/10 shrink-0">
                                      <img
                                        src={optimizeCloudinaryUrl(p.image, IMG_SIZES.thumbnail)}
                                        alt={p.name}
                                        className="w-full h-full object-cover text-transparent"
                                        loading="lazy"
                                        decoding="async"
                                        onError={(e) => {
                                          e.currentTarget.onerror = null;
                                          e.currentTarget.src = PLACEHOLDER;
                                        }}
                                      />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-start justify-between gap-3">
                                        <div>
                                          <p className="text-sm font-display font-medium text-tb-white leading-snug line-clamp-2">{p.name}</p>
                                          <p className="text-xs font-display text-sv-mid mt-0.5">
                                            {p.size ? `Size ${p.size} · ` : ''}Qty {p.quantity}
                                          </p>
                                        </div>
                                        <p className="text-sm text-brass shrink-0 font-display font-semibold">₹{p.price?.toLocaleString('en-IN') ?? '—'}</p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Cancel action */}
                              {!['cancelled', 'delivered', 'shipped'].includes(order.status) && (
                                <div className="border-t border-white/[0.06] px-4 py-3">
                                  <button
                                    onClick={() => cancelOrder(order._id)}
                                    disabled={cancellingOrder === order._id}
                                    className="flex items-center gap-2 px-3.5 py-2 border border-red-500/25 text-red-400 hover:text-white hover:bg-red-500/10 font-display text-[0.65rem] font-semibold tracking-[0.14em] uppercase transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed rounded-sm"
                                  >
                                    {cancellingOrder === order._id ? (
                                      <>
                                        <span className="w-3 h-3 border border-red-400/40 border-t-red-400 rounded-full animate-spin" />
                                        Cancelling...
                                      </>
                                    ) : (
                                      <>
                                        <X className="w-3 h-3" />
                                        Cancel Order
                                      </>
                                    )}
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── Delete Account ─────────────────────────────────── */}
              <div className="mt-14 pt-6 border-t border-white/10">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#0a0a0a] border border-white/[0.08] p-5 rounded-md">
                  <div>
                    <h3 className="font-display font-medium text-xs tracking-[0.16em] uppercase text-sv-mid mb-1">
                      Delete Account
                    </h3>
                    <p className="font-display text-xs text-sv-mid/70 leading-relaxed">
                      Permanently deletes your account and all associated data. Irreversible.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="shrink-0 px-4 py-2.5 font-display font-medium text-xs tracking-[0.14em] uppercase text-red-400 border border-red-500/20 hover:bg-red-500/10 transition-all duration-200 rounded-sm"
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* ── Delete Account Modal ─────────────────────────────────── */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/75 px-4 pb-4 sm:pb-0"
            onClick={() => !deletingAccount && setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm bg-[#141414] border border-white/[0.09] rounded-2xl p-6"
            >
              <div className="flex items-start gap-3.5 mb-5">
                <div className="w-9 h-9 rounded-full bg-red-900/25 border border-red-900/35 flex items-center justify-center shrink-0 mt-0.5">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                </div>
                <div>
                  <h2 className="font-display text-lg tracking-[0.08em] uppercase text-white mb-1.5">
                    Delete Account
                  </h2>
                  <p className="font-body text-sm text-white/45 leading-relaxed">
                    This will permanently delete your Thunderbold account, all saved addresses, and your order history. This cannot be undone.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2.5">
                <button
                  onClick={handleDeleteAccount}
                  disabled={deletingAccount}
                  className="w-full py-3 font-display font-bold text-xs tracking-[0.14em] uppercase text-white bg-red-700 hover:bg-red-600 active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 rounded-xl"
                >
                  {deletingAccount ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Deleting...
                    </>
                  ) : 'Yes, Delete My Account'}
                </button>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deletingAccount}
                  className="w-full py-3 font-display font-medium text-xs tracking-[0.14em] uppercase text-sv-mid border border-white/15 hover:border-white/30 hover:text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed rounded-sm"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {Capacitor.isNativePlatform() && (
        <button
          onClick={() => testTokenRegistration()}
          style={{
            position: 'fixed',
            bottom: 100,
            right: 20,
            zIndex: 9999,
            background: 'red',
            color: 'white',
            padding: '10px',
            borderRadius: '8px',
            fontSize: '12px',
          }}
        >
          Test FCM
        </button>
      )}
    </div>
  );
}

interface AddressFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  required?: boolean;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  placeholder?: string;
}

function AddressField({ label, value, onChange, error, required, type, inputMode, placeholder }: AddressFieldProps) {
  return (
    <div className="w-full">
      <label className="block font-display font-medium text-[11px] tracking-[0.16em] uppercase text-sv-mid mb-1.5">
        {label}{required && <span className="text-brass ml-1">*</span>}
      </label>
      <input
        type={type || 'text'}
        inputMode={inputMode}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full bg-[#050505] border px-4 py-2.5 font-display font-medium text-xs text-tb-white placeholder:text-sv-dim/40 outline-none transition-colors rounded-sm ${
          error
            ? 'border-red-500/80 focus:border-red-400'
            : 'border-white/10 focus:border-brass'
        }`}
      />
      {error && (
        <p className="font-display text-[11px] text-red-400 mt-1 font-medium">{error}</p>
      )}
    </div>
  );
}
