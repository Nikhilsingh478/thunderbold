import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ScrollProgress from '../components/ScrollProgress';
import CustomCursor from '../components/CustomCursor';
import {
  User,
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

  useEffect(() => {
    if (!user) { navigate('/'); return; }
    fetchProfile();
  }, [user]);

  useEffect(() => {
    if (activeTab === 'orders' && !ordersLoaded) fetchOrders();
  }, [activeTab]);

  const getToken = () => user!.getIdToken();

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

  const getInitials = (name: string) => {
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(w => w[0]?.toUpperCase() || '')
      .join('');
  };

  const getStatusColor = (status: string) => {
    switch ((status ?? '').toLowerCase()) {
      case 'pending': return 'text-gray-400 bg-gray-400/10 border-gray-400/30';
      case 'confirmed': return 'text-blue-400 bg-blue-400/10 border-blue-400/30';
      case 'shipped': return 'text-orange-400 bg-orange-400/10 border-orange-400/30';
      case 'delivered': return 'text-green-400 bg-green-400/10 border-green-400/30';
      case 'cancelled': return 'text-red-400 bg-red-400/10 border-red-400/30';
      default: return 'text-sv-mid bg-white/5 border-white/10';
    }
  };

  const getStatusIcon = (status: string) => {
    switch ((status ?? '').toLowerCase()) {
      case 'pending': return <Clock className="w-3 h-3" />;
      case 'confirmed': return <CheckCircle className="w-3 h-3" />;
      case 'shipped': return <Truck className="w-3 h-3" />;
      case 'delivered': return <CheckCircle className="w-3 h-3" />;
      default: return <Package className="w-3 h-3" />;
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

      <main className="flex-1 pt-[148px] pb-24 px-4 md:px-10 lg:px-16">
        <div className="max-w-[1100px] mx-auto">

          {/* Back */}
          <motion.button
            onClick={() => navigate(-1)}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="font-condensed font-semibold text-xs tracking-[0.18em] uppercase text-sv-mid hover:text-brass-bright transition-colors duration-200 mb-10 flex items-center gap-2 group"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform duration-300 group-hover:-translate-x-1" />
            Back
          </motion.button>

          {profileLoading ? (
            <div className="flex justify-center items-center py-24">
              <div className="w-8 h-8 border-2 border-white/10 border-t-brass rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Profile Header Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="bg-surface border border-white/[0.08] rounded-xl p-6 md:p-8 mb-8"
              >
                <div className="flex flex-col sm:flex-row sm:items-start gap-6">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-brass/20 border-2 border-brass/40 flex items-center justify-center">
                      <span className="font-display text-xl md:text-2xl tracking-wider brass-text">
                        {getInitials(profile?.name || user.email || 'U')}
                      </span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 space-y-4">
                    {/* Name */}
                    <div>
                      <div className="font-condensed font-semibold text-[0.62rem] tracking-[0.32em] uppercase text-sv-mid mb-1.5">
                        Full Name
                      </div>
                      {editingName ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={nameDraft}
                            onChange={e => setNameDraft(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditingName(false); }}
                            autoFocus
                            className="bg-transparent border-b border-brass/50 focus:border-brass text-tb-white font-body text-base outline-none pb-0.5 flex-1 min-w-0"
                            placeholder="Your full name"
                            maxLength={100}
                          />
                          <button
                            onClick={saveName}
                            disabled={saving}
                            className="p-1.5 text-brass hover:text-brass-bright transition-colors"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { setEditingName(false); setNameDraft(profile?.name || ''); }}
                            className="p-1.5 text-sv-mid hover:text-white transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 group">
                          <span className="font-body text-base md:text-lg text-tb-white">
                            {profile?.name || '—'}
                          </span>
                          <button
                            onClick={() => { setEditingName(true); setNameDraft(profile?.name || ''); }}
                            className="opacity-0 group-hover:opacity-100 p-1 text-sv-mid hover:text-brass transition-all duration-200"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Email */}
                    <div>
                      <div className="font-condensed font-semibold text-[0.62rem] tracking-[0.32em] uppercase text-sv-mid mb-1.5 flex items-center gap-1.5">
                        <Mail className="w-3 h-3" /> Email
                      </div>
                      <span className="font-body text-sm text-sv-mid">{profile?.email || user.email}</span>
                    </div>

                    {/* Phone */}
                    <div>
                      <div className="font-condensed font-semibold text-[0.62rem] tracking-[0.32em] uppercase text-sv-mid mb-1.5 flex items-center gap-1.5">
                        <Phone className="w-3 h-3" /> Phone
                      </div>
                      {editingPhone ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="tel"
                            inputMode="numeric"
                            value={phoneDraft}
                            onChange={e => setPhoneDraft(e.target.value.replace(/\D/g, '').slice(0, 10))}
                            onKeyDown={e => { if (e.key === 'Enter') savePhone(); if (e.key === 'Escape') setEditingPhone(false); }}
                            autoFocus
                            className="bg-transparent border-b border-brass/50 focus:border-brass text-tb-white font-body text-sm outline-none pb-0.5 w-36"
                            placeholder="10-digit mobile"
                          />
                          <button
                            onClick={savePhone}
                            disabled={saving}
                            className="p-1.5 text-brass hover:text-brass-bright transition-colors"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { setEditingPhone(false); setPhoneDraft(profile?.phone || ''); }}
                            className="p-1.5 text-sv-mid hover:text-white transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 group">
                          <span className="font-body text-sm text-sv-mid">
                            {profile?.phone || 'Not added'}
                          </span>
                          <button
                            onClick={() => { setEditingPhone(true); setPhoneDraft(profile?.phone || ''); }}
                            className="opacity-0 group-hover:opacity-100 p-1 text-sv-mid hover:text-brass transition-all duration-200"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Tabs */}
              <div className="flex gap-1 mb-8 border-b border-white/[0.08]">
                {(['addresses', 'orders'] as Tab[]).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`relative font-condensed font-semibold text-[0.7rem] tracking-[0.22em] uppercase px-5 py-3 transition-colors duration-200 ${
                      activeTab === tab ? 'text-tb-white' : 'text-sv-mid hover:text-white'
                    }`}
                  >
                    {tab === 'addresses' ? (
                      <span className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5" />Addresses</span>
                    ) : (
                      <span className="flex items-center gap-2"><Package className="w-3.5 h-3.5" />Orders</span>
                    )}
                    {activeTab === tab && (
                      <motion.div
                        layoutId="tab-indicator"
                        className="absolute bottom-0 left-0 right-0 h-px bg-brass"
                      />
                    )}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <AnimatePresence mode="wait">
                {activeTab === 'addresses' && (
                  <motion.div
                    key="addresses"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="font-display text-lg tracking-[0.12em] uppercase text-tb-white">
                        Saved Addresses
                      </h2>
                      {!showAddressForm && (
                        <button
                          onClick={() => { setShowAddressForm(true); setAddressForm({ ...emptyAddress }); setAddressErrors({}); }}
                          className="flex items-center gap-2 px-4 py-2 bg-brass/10 border border-brass/30 text-brass font-condensed font-semibold text-[0.65rem] tracking-[0.18em] uppercase hover:bg-brass/20 transition-all duration-200"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add Address
                        </button>
                      )}
                    </div>

                    {/* Address List */}
                    <div className="space-y-4 mb-6">
                      {(profile?.addresses || []).length === 0 && !showAddressForm ? (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex flex-col items-center py-14 text-center"
                        >
                          <MapPin className="w-10 h-10 text-sv-dim/40 mb-4" />
                          <p className="font-condensed text-sm tracking-[0.12em] uppercase text-sv-mid mb-2">
                            No addresses saved
                          </p>
                          <p className="text-sv-dim text-sm">Add an address to speed up checkout</p>
                        </motion.div>
                      ) : (
                        (profile?.addresses || []).map((addr, i) => (
                          <motion.div
                            key={addr.id}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className={`bg-surface border rounded-xl p-5 transition-colors duration-300 ${
                              addr.isDefault ? 'border-brass/30' : 'border-white/[0.07]'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="font-body font-semibold text-sm text-tb-white">
                                    {addr.fullName}
                                  </span>
                                  {addr.isDefault && (
                                    <span className="flex items-center gap-1 px-2 py-0.5 bg-brass/10 border border-brass/30 text-brass font-condensed text-[0.58rem] tracking-[0.18em] uppercase rounded-full">
                                      <Star className="w-2.5 h-2.5 fill-current" />
                                      Default
                                    </span>
                                  )}
                                </div>
                                <p className="text-sv-mid text-sm">{addr.phone}</p>
                                <p className="text-sv-mid text-sm mt-1">
                                  {addr.addressLine1}
                                  {addr.addressLine2 ? `, ${addr.addressLine2}` : ''}
                                </p>
                                <p className="text-sv-mid text-sm">
                                  {addr.city}, {addr.state} — {addr.pincode}
                                </p>
                                {addr.landmark && (
                                  <p className="text-sv-dim text-xs mt-1">Near: {addr.landmark}</p>
                                )}
                              </div>
                              <div className="flex flex-col gap-2 flex-shrink-0">
                                {!addr.isDefault && (
                                  <button
                                    onClick={() => handleSetDefault(addr.id)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-sv-mid hover:text-white font-condensed text-[0.6rem] tracking-[0.14em] uppercase transition-all duration-200 rounded"
                                  >
                                    <Star className="w-3 h-3" />
                                    Set Default
                                  </button>
                                )}
                                <button
                                  onClick={() => handleRemoveAddress(addr.id)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/5 hover:bg-red-500/15 border border-red-500/20 hover:border-red-500/40 text-red-400/70 hover:text-red-400 font-condensed text-[0.6rem] tracking-[0.14em] uppercase transition-all duration-200 rounded"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  Remove
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        ))
                      )}
                    </div>

                    {/* Add Address Form */}
                    <AnimatePresence>
                      {showAddressForm && (
                        <motion.div
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                          className="bg-surface border border-white/[0.08] rounded-xl p-6 md:p-8"
                        >
                          <div className="flex items-center justify-between mb-6">
                            <h3 className="font-display text-base tracking-[0.12em] uppercase text-tb-white">
                              New Address
                            </h3>
                            <button
                              onClick={() => { setShowAddressForm(false); setAddressErrors({}); }}
                              className="p-2 text-sv-mid hover:text-white transition-colors"
                            >
                              <X className="w-4 h-4" />
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5">
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
                                placeholder="Nearby landmark (optional)"
                              />
                            </div>

                            <div className="flex items-center gap-3 mb-6">
                              <button
                                type="button"
                                onClick={() => setAddressForm(p => ({ ...p, isDefault: !p.isDefault }))}
                                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors duration-200 ${
                                  addressForm.isDefault ? 'border-brass bg-brass' : 'border-white/30'
                                }`}
                              >
                                {addressForm.isDefault && <div className="w-2 h-2 bg-void rounded-full" />}
                              </button>
                              <span
                                className="font-condensed text-[0.68rem] tracking-[0.14em] uppercase text-sv-mid cursor-pointer select-none"
                                onClick={() => setAddressForm(p => ({ ...p, isDefault: !p.isDefault }))}
                              >
                                Set as default address
                              </span>
                            </div>

                            <div className="flex gap-3">
                              <motion.button
                                type="submit"
                                disabled={addressSubmitting}
                                whileTap={{ scale: 0.985 }}
                                className="flex-1 py-4 bg-tb-white text-void font-condensed font-bold text-sm tracking-[0.18em] uppercase hover:bg-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {addressSubmitting ? (
                                  <span className="flex items-center justify-center gap-2">
                                    <span className="w-4 h-4 border-2 border-void/30 border-t-void rounded-full animate-spin" />
                                    Saving...
                                  </span>
                                ) : 'Save Address'}
                              </motion.button>
                              <button
                                type="button"
                                onClick={() => { setShowAddressForm(false); setAddressErrors({}); }}
                                className="px-6 py-4 border border-white/[0.12] text-sv-mid font-condensed font-semibold text-sm tracking-[0.18em] uppercase hover:bg-white/5 transition-all duration-200"
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

                {activeTab === 'orders' && (
                  <motion.div
                    key="orders"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="font-display text-lg tracking-[0.12em] uppercase text-tb-white">
                        Order History
                      </h2>
                    </div>

                    {ordersLoading ? (
                      <div className="flex justify-center py-16">
                        <div className="w-8 h-8 border-2 border-white/10 border-t-brass rounded-full animate-spin" />
                      </div>
                    ) : orders.length === 0 ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center py-14 text-center"
                      >
                        <Package className="w-10 h-10 text-sv-dim/40 mb-4" />
                        <p className="font-condensed text-sm tracking-[0.12em] uppercase text-sv-mid mb-2">
                          No orders yet
                        </p>
                        <p className="text-sv-dim text-sm mb-6">Your order history will appear here</p>
                        <Link
                          to="/"
                          className="px-6 py-3 bg-brass text-void font-condensed font-bold text-xs tracking-[0.18em] uppercase hover:bg-yellow-400 transition-all duration-200"
                        >
                          Start Shopping
                        </Link>
                      </motion.div>
                    ) : (
                      <div className="space-y-4">
                        {orders.map((order, i) => (
                          <motion.div
                            key={order._id}
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.04 }}
                            className="bg-surface border border-white/[0.07] rounded-xl p-5 md:p-6"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                              <div className="flex flex-wrap items-center gap-3">
                                <span className="font-condensed text-xs tracking-[0.14em] text-sv-mid uppercase">
                                  #{order._id.slice(-8)}
                                </span>
                                <div className="flex items-center gap-1.5 text-sv-dim text-xs">
                                  <Calendar className="w-3 h-3" />
                                  {formatDate(order.createdAt)}
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span
                                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[0.65rem] font-condensed uppercase tracking-wider ${getStatusColor(order.status)}`}
                                >
                                  {getStatusIcon(order.status)}
                                  {order.status}
                                </span>
                                <span className="font-condensed text-tb-white text-sm font-semibold">
                                  ₹{order.totalAmount?.toLocaleString('en-IN')}
                                </span>
                              </div>
                            </div>
                            <div className="border-t border-white/[0.06] pt-4 space-y-2">
                              {(order.products ?? []).map((p, idx) => (
                                <div key={idx} className="flex justify-between items-center">
                                  <div>
                                    <p className="text-sm text-tb-white">{p.name}</p>
                                    <p className="text-xs text-sv-mid">
                                      {p.size ? `Size: ${p.size} · ` : ''}Qty: {p.quantity}
                                    </p>
                                  </div>
                                  <p className="text-sm text-tb-white">₹{p.price?.toLocaleString('en-IN') ?? '—'}</p>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>
      </main>

      <Footer />
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
      <label className="block font-condensed font-semibold text-[0.65rem] tracking-[0.18em] uppercase text-sv-mid mb-2">
        {label}{required && <span className="text-brass ml-1">*</span>}
      </label>
      <input
        type={type || 'text'}
        inputMode={inputMode}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full bg-void border px-4 py-3 font-body text-sm text-tb-white placeholder:text-sv-dim/50 outline-none transition-all duration-300 rounded ${
          error
            ? 'border-red-500/50 focus:border-red-400'
            : 'border-white/[0.08] focus:border-brass/50'
        }`}
      />
      {error && (
        <p className="font-body text-[0.72rem] text-red-400/80 mt-1">{error}</p>
      )}
    </div>
  );
}
