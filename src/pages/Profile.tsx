import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { optimizeCloudinaryUrl, IMG_SIZES } from '../lib/cloudinary';

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

const emptyAddress = {
  fullName: '', phone: '', addressLine1: '', addressLine2: '',
  city: '', state: '', pincode: '', landmark: '', isDefault: false,
};

type Tab = 'addresses' | 'orders';

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
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

  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersLoaded, setOrdersLoaded] = useState(false);
  const [cancellingOrder, setCancellingOrder] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  useEffect(() => {
    if (!user) { navigate('/'); return; }
    fetchProfile();
  }, [user]);

  useEffect(() => {
    if (activeTab === 'orders' && !ordersLoaded) fetchOrders();
  }, [activeTab]);

  const getToken = () => user!.getIdToken();

  const handleDeleteAccount = async () => {
    if (!user) return;
    setDeletingAccount(true);
    try {
      const token = await getToken();
      await fetch('/api/users', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const authUser = getAuth().currentUser;
      if (authUser) await deleteUser(authUser);
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

  const fetchProfile = async () => {
    try {
      const token = await getToken();
      const res = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data.data);
        setNameDraft(data.data?.name || '');
        setPhoneDraft(data.data?.phone || '');
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    } finally {
      setProfileLoading(false);
    }
  };

  const fetchOrders = async () => {
    setOrdersLoading(true);
    try {
      const token = await getToken();
      const res = await fetch('/api/orders', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setOrdersLoading(false);
      setOrdersLoaded(true);
    }
  };

  const cancelOrder = async (orderId: string) => {
    setCancellingOrder(orderId);
    try {
      const token = await getToken();
      const res = await fetch('/api/orders/cancel', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (res.ok) {
        setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: 'cancelled' } : o));
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
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: trimmed }),
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data.data);
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
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ phone: trimmed }),
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data.data);
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
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...addressForm, phone: addressForm.phone.replace(/\D/g, '') }),
      });
      if (res.ok) {
        toast.success('Address saved');
        setShowAddressForm(false);
        setAddressForm({ ...emptyAddress });
        setAddressErrors({});
        await fetchProfile();
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
      const res = await fetch('/api/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        toast.success('Address removed');
        await fetchProfile();
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
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'set_default_address', id }),
      });
      if (res.ok) {
        toast.success('Default address updated');
        await fetchProfile();
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
            className="font-condensed text-xs tracking-[0.18em] uppercase text-white/40 hover:text-white/70 transition-colors duration-200 mb-8 flex items-center gap-2 group"
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
              <div className="bg-white/[0.04] border border-white/[0.09] rounded-2xl p-5 md:p-6 mb-6">

                {/* Avatar + Name row */}
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-14 h-14 rounded-full bg-brass/20 border border-brass/35 flex items-center justify-center shrink-0">
                    <span className="font-display text-lg tracking-wider brass-text">
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
                          className="bg-transparent border-b border-brass/50 focus:border-brass text-white text-base outline-none pb-0.5 flex-1 min-w-0"
                          placeholder="Your full name"
                          maxLength={100}
                        />
                        <button onClick={saveName} disabled={saving} className="p-1.5 text-brass hover:text-brass-bright transition-colors shrink-0">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => { setEditingName(false); setNameDraft(profile?.name || ''); }} className="p-1.5 text-white/40 hover:text-white transition-colors shrink-0">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="font-body text-base text-white truncate">
                          {profile?.name || '—'}
                        </span>
                        <button
                          onClick={() => { setEditingName(true); setNameDraft(profile?.name || ''); }}
                          className="p-1 text-white/30 hover:text-brass transition-colors shrink-0"
                          aria-label="Edit name"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                    <p className="font-condensed text-xs text-white/35 tracking-[0.06em] mt-0.5 truncate">
                      Member account
                    </p>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-white/[0.07] mb-5" />

                {/* Email */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-white/[0.05] border border-white/[0.07] flex items-center justify-center shrink-0">
                    <Mail className="w-3.5 h-3.5 text-white/40" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-condensed text-[0.6rem] tracking-[0.22em] uppercase text-white/35 mb-0.5">Email</p>
                    <p className="font-body text-sm text-white/75 truncate">{profile?.email || user.email}</p>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/[0.05] border border-white/[0.07] flex items-center justify-center shrink-0">
                    <Phone className="w-3.5 h-3.5 text-white/40" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-condensed text-[0.6rem] tracking-[0.22em] uppercase text-white/35 mb-0.5">Phone</p>
                    {editingPhone ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="tel"
                          inputMode="numeric"
                          value={phoneDraft}
                          onChange={e => setPhoneDraft(e.target.value.replace(/\D/g, '').slice(0, 10))}
                          onKeyDown={e => { if (e.key === 'Enter') savePhone(); if (e.key === 'Escape') setEditingPhone(false); }}
                          autoFocus
                          className="bg-transparent border-b border-brass/50 focus:border-brass text-white text-sm outline-none pb-0.5 w-40"
                          placeholder="10-digit mobile"
                        />
                        <button onClick={savePhone} disabled={saving} className="p-1.5 text-brass hover:text-brass-bright transition-colors shrink-0">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => { setEditingPhone(false); setPhoneDraft(profile?.phone || ''); }} className="p-1.5 text-white/40 hover:text-white transition-colors shrink-0">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="font-body text-sm text-white/75">
                          {profile?.phone || <span className="text-white/35 italic">Not added</span>}
                        </span>
                        <button
                          onClick={() => { setEditingPhone(true); setPhoneDraft(profile?.phone || ''); }}
                          className="p-1 text-white/30 hover:text-brass transition-colors shrink-0"
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
              <div className="flex border-b border-white/[0.09] mb-6">
                {(['addresses', 'orders'] as Tab[]).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`relative flex items-center gap-2 font-condensed text-xs tracking-[0.2em] uppercase px-5 py-3.5 transition-colors duration-200 ${
                      activeTab === tab ? 'text-white' : 'text-white/40 hover:text-white/65'
                    }`}
                  >
                    {tab === 'addresses'
                      ? <><MapPin className="w-3.5 h-3.5" />Addresses</>
                      : <><Package className="w-3.5 h-3.5" />Orders</>
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
                      <h2 className="font-condensed text-xs tracking-[0.22em] uppercase text-white/50">
                        Saved Addresses
                      </h2>
                      {!showAddressForm && (
                        <button
                          onClick={() => { setShowAddressForm(true); setAddressForm({ ...emptyAddress }); setAddressErrors({}); }}
                          className="flex items-center gap-1.5 px-3.5 py-2 bg-brass/10 border border-brass/30 text-brass font-condensed text-[0.65rem] tracking-[0.16em] uppercase hover:bg-brass/20 active:scale-95 transition-all duration-200 rounded-lg"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add Address
                        </button>
                      )}
                    </div>

                    {/* Address list */}
                    <div className="space-y-3 mb-4">
                      {(profile?.addresses || []).length === 0 && !showAddressForm ? (
                        <div className="flex flex-col items-center py-14 text-center">
                          <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center mb-4">
                            <MapPin className="w-5 h-5 text-white/20" />
                          </div>
                          <p className="font-condensed text-sm tracking-[0.1em] uppercase text-white/45 mb-1.5">
                            No addresses saved
                          </p>
                          <p className="text-white/30 text-sm">Add an address to speed up checkout</p>
                        </div>
                      ) : (
                        (profile?.addresses || []).map((addr) => (
                          <div
                            key={addr.id}
                            className={`bg-white/[0.03] border rounded-xl p-4 transition-colors duration-200 ${
                              addr.isDefault ? 'border-brass/25' : 'border-white/[0.08]'
                            }`}
                          >
                            {/* Name + badge */}
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="font-body font-semibold text-sm text-white">
                                {addr.fullName}
                              </span>
                              {addr.isDefault && (
                                <span className="flex items-center gap-1 px-2 py-0.5 bg-brass/10 border border-brass/25 text-brass font-condensed text-[0.56rem] tracking-[0.16em] uppercase rounded-full">
                                  <Star className="w-2.5 h-2.5 fill-current" />
                                  Default
                                </span>
                              )}
                            </div>

                            {/* Address lines */}
                            <p className="text-sm text-white/55 leading-snug">
                              {addr.phone}
                            </p>
                            <p className="text-sm text-white/55 leading-snug mt-0.5">
                              {addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ''}
                            </p>
                            <p className="text-sm text-white/55 leading-snug">
                              {addr.city}, {addr.state} — {addr.pincode}
                            </p>
                            {addr.landmark && (
                              <p className="text-xs text-white/30 mt-1">Near: {addr.landmark}</p>
                            )}

                            {/* Actions row */}
                            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/[0.07]">
                              {!addr.isDefault && (
                                <button
                                  onClick={() => handleSetDefault(addr.id)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.09] hover:border-white/[0.16] text-white/50 hover:text-white/80 font-condensed text-[0.6rem] tracking-[0.14em] uppercase transition-all duration-200 rounded-lg active:scale-95"
                                >
                                  <Star className="w-3 h-3" />
                                  Set Default
                                </button>
                              )}
                              <button
                                onClick={() => handleRemoveAddress(addr.id)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/5 hover:bg-red-500/10 border border-red-500/15 hover:border-red-500/30 text-red-400/60 hover:text-red-400 font-condensed text-[0.6rem] tracking-[0.14em] uppercase transition-all duration-200 rounded-lg active:scale-95"
                              >
                                <Trash2 className="w-3 h-3" />
                                Remove
                              </button>
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
                          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                          className="bg-white/[0.03] border border-white/[0.09] rounded-2xl p-5 md:p-6"
                        >
                          <div className="flex items-center justify-between mb-5">
                            <h3 className="font-condensed text-xs tracking-[0.22em] uppercase text-white/60">
                              New Address
                            </h3>
                            <button
                              onClick={() => { setShowAddressForm(false); setAddressErrors({}); }}
                              className="w-7 h-7 flex items-center justify-center rounded-full bg-white/[0.05] text-white/40 hover:text-white hover:bg-white/10 transition-all duration-200"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <form onSubmit={handleAddAddress} noValidate>
                            <AddressField
                              label="Full Name" required
                              value={addressForm.fullName}
                              onChange={v => setAddressForm(p => ({ ...p, fullName: v.replace(/[^a-zA-Z\s.'-]/g, '') }))}
                              error={addressErrors.fullName}
                              placeholder="Your full name"
                            />
                            <AddressField
                              label="Phone" required type="tel" inputMode="numeric"
                              value={addressForm.phone}
                              onChange={v => setAddressForm(p => ({ ...p, phone: v.replace(/\D/g, '').slice(0, 10) }))}
                              error={addressErrors.phone}
                              placeholder="10-digit mobile number"
                            />
                            <AddressField
                              label="Address Line 1" required
                              value={addressForm.addressLine1}
                              onChange={v => setAddressForm(p => ({ ...p, addressLine1: v }))}
                              error={addressErrors.addressLine1}
                              placeholder="House no., Street, Area"
                            />
                            <AddressField
                              label="Address Line 2"
                              value={addressForm.addressLine2}
                              onChange={v => setAddressForm(p => ({ ...p, addressLine2: v }))}
                              placeholder="Apartment, Building (optional)"
                            />
                            <div className="grid grid-cols-2 gap-x-4">
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
                              <AddressField
                                label="Pincode" required type="tel" inputMode="numeric"
                                value={addressForm.pincode}
                                onChange={v => setAddressForm(p => ({ ...p, pincode: v.replace(/\D/g, '').slice(0, 6) }))}
                                error={addressErrors.pincode}
                                placeholder="6-digit pincode"
                              />
                              <AddressField
                                label="Landmark"
                                value={addressForm.landmark}
                                onChange={v => setAddressForm(p => ({ ...p, landmark: v }))}
                                placeholder="Nearby landmark"
                              />
                            </div>

                            {/* Default toggle */}
                            <button
                              type="button"
                              onClick={() => setAddressForm(p => ({ ...p, isDefault: !p.isDefault }))}
                              className="flex items-center gap-3 mb-5 w-full text-left"
                            >
                              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors duration-200 ${
                                addressForm.isDefault ? 'border-brass bg-brass' : 'border-white/25'
                              }`}>
                                {addressForm.isDefault && <div className="w-2 h-2 bg-void rounded-full" />}
                              </div>
                              <span className="font-condensed text-xs tracking-[0.14em] uppercase text-white/50 select-none">
                                Set as default address
                              </span>
                            </button>

                            <div className="flex gap-3">
                              <button
                                type="submit"
                                disabled={addressSubmitting}
                                className="flex-1 py-3.5 bg-tb-white text-void font-condensed font-bold text-sm tracking-[0.18em] uppercase hover:bg-white active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl"
                              >
                                {addressSubmitting ? (
                                  <span className="flex items-center justify-center gap-2">
                                    <span className="w-4 h-4 border-2 border-void/30 border-t-void rounded-full animate-spin" />
                                    Saving...
                                  </span>
                                ) : 'Save Address'}
                              </button>
                              <button
                                type="button"
                                onClick={() => { setShowAddressForm(false); setAddressErrors({}); }}
                                className="px-5 py-3.5 border border-white/[0.1] text-white/45 font-condensed font-semibold text-sm tracking-[0.16em] uppercase hover:bg-white/5 hover:text-white/65 active:scale-[0.98] transition-all duration-200 rounded-xl"
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
                      <h2 className="font-condensed text-xs tracking-[0.22em] uppercase text-white/50">
                        Order History
                      </h2>
                    </div>

                    {ordersLoading ? (
                      <div className="flex justify-center py-16">
                        <div className="w-7 h-7 border-2 border-white/10 border-t-brass rounded-full animate-spin" />
                      </div>
                    ) : orders.length === 0 ? (
                      <div className="flex flex-col items-center py-14 text-center">
                        <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center mb-4">
                          <Package className="w-5 h-5 text-white/20" />
                        </div>
                        <p className="font-condensed text-sm tracking-[0.1em] uppercase text-white/45 mb-1.5">
                          No orders yet
                        </p>
                        <p className="text-white/30 text-sm mb-6">Your order history will appear here</p>
                        <Link
                          to="/"
                          className="px-5 py-2.5 bg-brass text-void font-condensed font-bold text-xs tracking-[0.18em] uppercase hover:bg-yellow-400 active:scale-95 transition-all duration-200 rounded-xl"
                        >
                          Start Shopping
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {orders.map((order) => {
                          const statusCfg = getStatusConfig(order.status);
                          return (
                            <div
                              key={order._id}
                              className="bg-white/[0.03] border border-white/[0.08] rounded-xl overflow-hidden"
                            >
                              {/* Card header */}
                              <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-3">
                                <div>
                                  <p className="font-condensed text-xs tracking-[0.14em] text-white/65 uppercase">
                                    {formatOrderId(order)}
                                  </p>
                                  <div className="flex items-center gap-1.5 mt-0.5 text-white/30 text-xs">
                                    <Calendar className="w-3 h-3" />
                                    {formatDate(order.createdAt)}
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-1.5">
                                  <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[0.62rem] font-condensed uppercase tracking-wider ${statusCfg.color}`}>
                                    {statusCfg.icon}
                                    {statusCfg.label}
                                  </span>
                                  <span className="font-condensed text-sm text-white font-semibold">
                                    ₹{order.totalAmount?.toLocaleString('en-IN')}
                                  </span>
                                </div>
                              </div>

                              {/* Products */}
                              <div className="border-t border-white/[0.06] px-4 py-3 space-y-2.5">
                                {(order.products ?? []).map((p, idx) => (
                                  <div key={idx} className="flex items-start gap-3 border-b border-white/[0.03] last:border-b-0 pb-3 last:pb-0">
                                    {/* Product Image */}
                                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-white/5 border border-white/10 shrink-0">
                                      <img
                                        src={optimizeCloudinaryUrl(p.image || '/placeholder.png', IMG_SIZES.thumbnail)}
                                        alt={p.name}
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                        decoding="async"
                                        onError={(e) => {
                                          e.currentTarget.src = '/placeholder.png';
                                        }}
                                      />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-start justify-between gap-3">
                                        <div>
                                          <p className="text-sm text-white/80 leading-snug line-clamp-2">{p.name}</p>
                                          <p className="text-xs text-white/35 mt-0.5">
                                            {p.size ? `Size ${p.size} · ` : ''}Qty {p.quantity}
                                          </p>
                                        </div>
                                        <p className="text-sm text-white/65 shrink-0 font-condensed">₹{p.price?.toLocaleString('en-IN') ?? '—'}</p>
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
                                    className="flex items-center gap-2 px-3.5 py-2 border border-red-500/20 text-red-400/70 hover:text-red-400 hover:border-red-500/40 hover:bg-red-500/5 font-condensed text-[0.62rem] tracking-[0.16em] uppercase transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg active:scale-95"
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
              <div className="mt-14 pt-6 border-t border-white/[0.07]">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h3 className="font-condensed text-xs tracking-[0.18em] uppercase text-white/40 mb-1">
                      Delete Account
                    </h3>
                    <p className="font-body text-sm text-white/28 leading-relaxed">
                      Permanently deletes your account and all associated data. Irreversible.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="shrink-0 px-4 py-2.5 font-condensed font-bold text-[0.68rem] tracking-[0.18em] uppercase text-red-400/60 border border-red-500/10 bg-red-500/5 hover:bg-red-500/10 hover:border-red-500/25 hover:text-red-400/80 transition-colors duration-200 rounded-lg active:scale-95"
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
                  className="w-full py-3 font-condensed font-bold text-[0.72rem] tracking-[0.18em] uppercase text-white bg-red-700 hover:bg-red-600 active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 rounded-xl"
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
                  className="w-full py-3 font-condensed font-bold text-[0.72rem] tracking-[0.18em] uppercase text-white/50 border border-white/[0.09] hover:border-white/[0.16] hover:text-white/70 active:scale-[0.98] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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
    <div className="mb-4">
      <label className="block font-condensed text-[0.62rem] tracking-[0.2em] uppercase text-white/40 mb-1.5">
        {label}{required && <span className="text-brass ml-1">*</span>}
      </label>
      <input
        type={type || 'text'}
        inputMode={inputMode}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full bg-void border px-4 py-3 font-body text-sm text-white placeholder:text-white/20 outline-none transition-all duration-300 rounded-xl ${
          error
            ? 'border-red-500/40 focus:border-red-400/70'
            : 'border-white/[0.09] focus:border-brass/50'
        }`}
      />
      {error && (
        <p className="font-body text-[0.7rem] text-red-400/80 mt-1.5">{error}</p>
      )}
    </div>
  );
}
