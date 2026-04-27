import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { optimizeCloudinaryUrl, IMG_SIZES } from '../lib/cloudinary';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Package, Folder, X, Pencil, Trash2, Plus, ChevronDown, ImagePlus, ExternalLink, MessageSquare, ArrowLeft } from 'lucide-react';
import LightningRating from '../components/reviews/LightningRating';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CustomCursor from '../components/CustomCursor';
import ScrollProgress from '../components/ScrollProgress';
import { useAuth } from '../context/AuthContext';

const ADMIN_EMAILS = [
  "adminthunderbolt@gmail.com",
  "neelsingh45940s@gmail.com",
  "thepavanartt@gmail.com",
];

interface OrderProduct {
  name: string;
  quantity: number;
  size?: string;
  price?: number;
  image?: string;
  productId?: string;
}

interface OrderAddress {
  fullName?: string;
  phone?: string;
  addressLine1?: string;
  city?: string;
  pincode?: string;
}

interface Order {
  _id: string;
  userId: string;
  products: OrderProduct[];
  totalAmount: number;
  status: string;
  createdAt: string;
  address?: OrderAddress;
  paymentMethod?: string;
}

interface AdminReview {
  _id: string;
  userId: string;
  productId: string;
  orderId: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt?: string;
}

const SIZES = ['28', '30', '32', '34', '36'] as const;

const SECTIONS = [
  { value: 'live-sale', label: 'Live Sale Section' },
  { value: 'denim', label: 'Denim Collection' },
  { value: 'tshirts', label: 'T-Shirts Section' },
  { value: 'coming-soon', label: 'Coming Soon' },
] as const;

interface Product {
  _id: string;
  name: string;
  categoryId: string;
  section?: string;
  price: number;
  image?: string;
  images?: string[];
  description?: string;
  stock?: number;
  sizeStock?: Record<string, number>;
  highlights?: ProductHighlights | null;
}

interface CategoryFormData {
  name: string;
  image: string;
  section: string;
}

const CATEGORY_SECTIONS = SECTIONS.filter(s => s.value !== 'live-sale');

const defaultCategoryFormData: CategoryFormData = { name: '', image: '', section: 'denim' };

function ModalShell({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm px-0 sm:px-4">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className="w-full sm:max-w-lg bg-[#141414] border border-white/10 rounded-t-2xl sm:rounded-2xl relative max-h-[92vh] flex flex-col"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-sv-mid hover:text-tb-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
        {children}
      </motion.div>
    </div>
  );
}

function CategoryModal({
  title,
  onSubmit,
  onClose,
}: {
  title: string;
  onSubmit: (data: CategoryFormData) => Promise<boolean>;
  onClose: () => void;
}) {
  const [form, setForm] = useState<CategoryFormData>(defaultCategoryFormData);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!form.name || !form.image || !form.section) { setError('Name, image, and section are required.'); return; }
    setSubmitting(true);
    const ok = await onSubmit(form);
    setSubmitting(false);
    if (!ok) setError('Something went wrong. Please try again.');
  };

  return (
    <ModalShell onClose={onClose}>
      <div className="px-6 pt-6 pb-2 border-b border-white/10 shrink-0">
        <h3 className="font-display text-xl tracking-[0.08em] text-tb-white uppercase pr-8">{title}</h3>
      </div>
      <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
        {(['name', 'image'] as const).map((key) => (
          <div key={key}>
            <label className="block font-condensed text-xs text-sv-mid uppercase tracking-wider mb-1.5">
              {key === 'name' ? 'Name' : 'Image URL'}
            </label>
            <input
              type={key === 'image' ? 'url' : 'text'}
              value={form[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              placeholder={key === 'name' ? 'Category name' : 'https://...'}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-tb-white text-sm placeholder:text-sv-mid/40 focus:outline-none focus:border-white/30 transition-colors"
            />
          </div>
        ))}
        {/* Section */}
        <div>
          <label className="block font-condensed text-xs text-sv-mid uppercase tracking-wider mb-1.5">Section</label>
          <div className="relative">
            <select
              value={form.section}
              onChange={(e) => setForm({ ...form, section: e.target.value })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-tb-white text-sm focus:outline-none focus:border-white/30 transition-colors appearance-none"
            >
              {CATEGORY_SECTIONS.map((s) => (
                <option key={s.value} value={s.value} className="bg-zinc-900 text-tb-white">{s.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sv-mid pointer-events-none" />
          </div>
        </div>
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
      </div>
      <div className="px-6 pb-6 pt-3 flex gap-3 shrink-0 border-t border-white/10">
        <button onClick={onClose} className="flex-1 py-3 bg-white/5 border border-white/10 rounded-lg text-sv-mid text-sm font-condensed uppercase tracking-wider hover:bg-white/10 transition-colors">
          Cancel
        </button>
        <button onClick={handleSubmit} disabled={submitting} className="flex-1 py-3 bg-tb-white text-void font-condensed font-bold text-sm tracking-[0.15em] uppercase rounded-lg hover:bg-white transition-colors disabled:opacity-50">
          {submitting ? 'Creating...' : 'Create'}
        </button>
      </div>
    </ModalShell>
  );
}

interface ProductHighlights {
  color: string;
  length: string;
  printsPattern: string;
  waistRise: string;
  shade: string;
  lengthInches: string;
}

interface ProductFormData {
  name: string;
  section: string;
  categoryId: string;
  price: string;
  images: string[];
  description: string;
  sizeStock: Record<string, string>;
  highlights: ProductHighlights;
}

const makeDefaultSizeStock = () => Object.fromEntries(SIZES.map(s => [s, '0']));
const defaultHighlights: ProductHighlights = { color: '', length: '', printsPattern: '', waistRise: '', shade: '', lengthInches: '' };
const defaultFormData: ProductFormData = { name: '', section: 'denim', categoryId: '', price: '', images: [''], description: '', sizeStock: makeDefaultSizeStock(), highlights: defaultHighlights };

function ImageInput({
  images,
  onChange,
}: {
  images: string[];
  onChange: (imgs: string[]) => void;
}) {
  const updateAt = (i: number, val: string) => {
    const next = [...images];
    next[i] = val;
    onChange(next);
  };
  const removeAt = (i: number) => onChange(images.filter((_, idx) => idx !== i));
  const addRow = () => onChange([...images, '']);

  return (
    <div className="space-y-2">
      {images.map((url, i) => (
        <div key={i} className="flex gap-2 items-start">
          {/* Thumbnail preview */}
          <div className="shrink-0 w-10 h-10 rounded-md overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center">
            {url.trim() ? (
              <img
                src={optimizeCloudinaryUrl(url, IMG_SIZES.thumbnail)}
                alt=""
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            ) : (
              <ImagePlus className="w-4 h-4 text-sv-mid/40" />
            )}
          </div>
          <input
            type="url"
            value={url}
            onChange={(e) => updateAt(i, e.target.value)}
            placeholder={i === 0 ? 'Main image URL (required)' : `Image ${i + 1} URL`}
            className="flex-1 px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-tb-white text-sm placeholder:text-sv-mid/40 focus:outline-none focus:border-white/30 transition-colors"
          />
          {images.length > 1 && (
            <button
              type="button"
              onClick={() => removeAt(i)}
              className="shrink-0 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={addRow}
        className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-white/15 rounded-lg text-sv-mid text-xs font-condensed uppercase tracking-wider hover:border-white/30 hover:text-tb-white transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        Add Another Image
      </button>
    </div>
  );
}

function SizeStockInput({
  sizeStock,
  onChange,
}: {
  sizeStock: Record<string, string>;
  onChange: (ss: Record<string, string>) => void;
}) {
  const total = SIZES.reduce((sum, s) => sum + (parseInt(sizeStock[s] ?? '0') || 0), 0);
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-5 gap-2">
        {SIZES.map(size => {
          const qty = parseInt(sizeStock[size] ?? '0') || 0;
          return (
            <div key={size} className="flex flex-col gap-1.5 items-center">
              <span className={`font-condensed text-xs uppercase tracking-wider ${qty === 0 ? 'text-red-400/70' : 'text-sv-mid'}`}>
                {size}
              </span>
              <input
                type="number"
                min="0"
                value={sizeStock[size] ?? '0'}
                onChange={(e) => onChange({ ...sizeStock, [size]: e.target.value })}
                className={`w-full px-1 py-2 bg-white/5 border rounded-lg text-tb-white text-sm text-center focus:outline-none transition-colors ${qty === 0 ? 'border-red-500/20 focus:border-red-400/40' : 'border-white/10 focus:border-white/30'}`}
              />
            </div>
          );
        })}
      </div>
      <p className="font-condensed text-xs text-sv-mid/60">
        Total stock: <span className="text-sv-mid">{total} units</span>
        {total === 0 && <span className="text-red-400/70 ml-2">— product will show as out of stock</span>}
      </p>
    </div>
  );
}

function ProductModal({
  title,
  initialData,
  onSubmit,
  onClose,
}: {
  title: string;
  initialData?: ProductFormData;
  onSubmit: (data: ProductFormData) => Promise<boolean>;
  onClose: () => void;
}) {
  const [form, setForm] = useState<ProductFormData>(initialData ?? defaultFormData);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/categories')
      .then(r => r.json())
      .then(d => setCategories(d.categories || []))
      .catch(() => {});
  }, []);

  const isLiveSale = form.section === 'live-sale';

  const handleSubmit = async () => {
    const validImages = form.images.map(s => s.trim()).filter(Boolean);
    if (!form.name || !form.price || (!isLiveSale && !form.categoryId) || validImages.length === 0) {
      setError(`Name, price, ${isLiveSale ? '' : 'category, '}and at least one image are required.`);
      return;
    }
    setSubmitting(true);
    const ok = await onSubmit({ ...form, images: validImages });
    setSubmitting(false);
    if (!ok) setError('Something went wrong. Please try again.');
  };

  return (
    <ModalShell onClose={onClose}>
      <div className="px-6 pt-6 pb-3 border-b border-white/10 shrink-0">
        <h3 className="font-display text-xl tracking-[0.08em] text-tb-white uppercase pr-8">{title}</h3>
      </div>
      <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

        {/* Name */}
        <div>
          <label className="block font-condensed text-xs text-sv-mid uppercase tracking-wider mb-1.5">Name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
            placeholder="Product name"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-tb-white text-sm placeholder:text-sv-mid/40 focus:outline-none focus:border-white/30 transition-colors"
          />
        </div>

        {/* Section */}
        <div>
          <label className="block font-condensed text-xs text-sv-mid uppercase tracking-wider mb-1.5">Section</label>
          <div className="relative">
            <select
              value={form.section}
              onChange={(e) => setForm(p => ({ ...p, section: e.target.value }))}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-tb-white text-sm focus:outline-none focus:border-white/30 transition-colors appearance-none"
            >
              {SECTIONS.map((s) => (
                <option key={s.value} value={s.value} className="bg-zinc-900 text-tb-white">{s.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sv-mid pointer-events-none" />
          </div>
        </div>

        {/* Category — hidden for Live Sale */}
        {!isLiveSale && (
          <div>
            <label className="block font-condensed text-xs text-sv-mid uppercase tracking-wider mb-1.5">Category</label>
            <div className="relative">
              <select
                value={form.categoryId}
                onChange={(e) => setForm(p => ({ ...p, categoryId: e.target.value }))}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-tb-white text-sm focus:outline-none focus:border-white/30 transition-colors appearance-none"
              >
                <option value="" className="bg-zinc-900 text-sv-mid">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id} className="bg-zinc-900 text-tb-white">{cat.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sv-mid pointer-events-none" />
            </div>
          </div>
        )}

        {/* Price */}
        <div>
          <label className="block font-condensed text-xs text-sv-mid uppercase tracking-wider mb-1.5">Price (₹)</label>
          <input
            type="number"
            value={form.price}
            onChange={(e) => setForm(p => ({ ...p, price: e.target.value }))}
            placeholder="0"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-tb-white text-sm placeholder:text-sv-mid/40 focus:outline-none focus:border-white/30 transition-colors"
          />
        </div>

        {/* Size-based Stock */}
        <div>
          <label className="block font-condensed text-xs text-sv-mid uppercase tracking-wider mb-2">
            Stock by Size
          </label>
          <SizeStockInput
            sizeStock={form.sizeStock}
            onChange={(ss) => setForm(p => ({ ...p, sizeStock: ss }))}
          />
        </div>

        {/* Images */}
        <div>
          <label className="block font-condensed text-xs text-sv-mid uppercase tracking-wider mb-1.5">
            Images <span className="text-sv-mid/50 normal-case tracking-normal">(first is the main)</span>
          </label>
          <ImageInput images={form.images} onChange={(imgs) => setForm(p => ({ ...p, images: imgs }))} />
        </div>

        {/* Description */}
        <div>
          <label className="block font-condensed text-xs text-sv-mid uppercase tracking-wider mb-1.5">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))}
            placeholder="Product description"
            rows={3}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-tb-white text-sm placeholder:text-sv-mid/40 focus:outline-none focus:border-white/30 transition-colors resize-none"
          />
        </div>

        {/* Product Highlights */}
        <div>
          <label className="block font-condensed text-xs text-sv-mid uppercase tracking-wider mb-0.5">Product Highlights</label>
          <p className="font-condensed text-[0.65rem] text-sv-mid/50 mb-3">Leave all blank to hide this section on the store.</p>
          <div className="grid grid-cols-2 gap-3">
            {([
              { key: 'color', label: 'Color' },
              { key: 'length', label: 'Length' },
              { key: 'printsPattern', label: 'Prints & Pattern' },
              { key: 'waistRise', label: 'Waist Rise' },
              { key: 'shade', label: 'Shade' },
              { key: 'lengthInches', label: '(Length) In Inches' },
            ] as { key: keyof ProductHighlights; label: string }[]).map(({ key, label }) => (
              <div key={key}>
                <label className="block font-condensed text-[0.6rem] text-sv-mid/70 uppercase tracking-wider mb-1">{label}</label>
                <input
                  type="text"
                  value={form.highlights[key]}
                  onChange={(e) => setForm(p => ({ ...p, highlights: { ...p.highlights, [key]: e.target.value } }))}
                  placeholder={label}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-tb-white text-sm placeholder:text-sv-mid/30 focus:outline-none focus:border-brass/40 transition-colors"
                />
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
      </div>
      <div className="px-6 pb-6 pt-3 flex gap-3 shrink-0 border-t border-white/10">
        <button onClick={onClose} className="flex-1 py-3 bg-white/5 border border-white/10 rounded-lg text-sv-mid text-sm font-condensed uppercase tracking-wider hover:bg-white/10 transition-colors">
          Cancel
        </button>
        <button onClick={handleSubmit} disabled={submitting} className="flex-1 py-3 bg-tb-white text-void font-condensed font-bold text-sm tracking-[0.15em] uppercase rounded-lg hover:bg-white transition-colors disabled:opacity-50">
          {submitting ? 'Saving...' : 'Save Product'}
        </button>
      </div>
    </ModalShell>
  );
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  confirmed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  shipped: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  delivered: 'bg-green-500/20 text-green-400 border-green-500/30',
};

export default function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'categories' | 'reviews'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [viewAddressOrder, setViewAddressOrder] = useState<Order | null>(null);
  const [confirmDeleteOrder, setConfirmDeleteOrder] = useState<Order | null>(null);

  // Reviews tab state
  const [reviewsProduct, setReviewsProduct] = useState<Product | null>(null);
  const [productReviews, setProductReviews] = useState<AdminReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  useEffect(() => {
    if (user && !ADMIN_EMAILS.includes(user.email)) navigate('/');
  }, [user, navigate]);

  useEffect(() => { if (user && activeTab === 'orders') fetchOrders(); }, [activeTab, user]);
  useEffect(() => { if (user && activeTab === 'products') { fetchProducts(); fetchCategories(); } }, [activeTab, user]);
  useEffect(() => { if (user && activeTab === 'categories') fetchCategories(); }, [activeTab, user]);
  useEffect(() => { if (user && activeTab === 'reviews') fetchProducts(); }, [activeTab, user]);

  // Reset drill-down when leaving the reviews tab
  useEffect(() => { if (activeTab !== 'reviews') { setReviewsProduct(null); setProductReviews([]); } }, [activeTab]);

  const fetchReviewsForProduct = async (productId: string) => {
    setReviewsLoading(true);
    try {
      const r = await fetch(`/api/reviews?productId=${encodeURIComponent(productId)}`);
      if (r.ok) {
        const d = await r.json();
        setProductReviews(d.reviews ?? []);
      } else {
        setProductReviews([]);
      }
    } catch { setProductReviews([]); }
    finally { setReviewsLoading(false); }
  };

  const adminDeleteReview = async (reviewId: string) => {
    if (!user) return;
    if (!confirm('Soft-delete this review? It will be hidden from the public.')) return;
    try {
      const token = await user.getIdToken();
      const r = await fetch(`/api/reviews/manage?id=${reviewId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.ok) setProductReviews(prev => prev.filter(rv => rv._id !== reviewId));
      else alert('Failed to delete review.');
    } catch { alert('Failed to delete review.'); }
  };

  const fetchOrders = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const r = await fetch('/api/orders', { headers: { Authorization: `Bearer ${token}` } });
      if (r.ok) { const d = await r.json(); setOrders(d.orders ?? []); }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const fetchProducts = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const r = await fetch('/api/products');
      const d = await r.json();
      setProducts(d.products ?? []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const fetchCategories = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const r = await fetch('/api/categories');
      const d = await r.json();
      setCategories(d.categories ?? []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const r = await fetch(`/api/orders/manage?id=${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      let data: any = {};
      try {
        const text = await r.text();
        if (text) data = JSON.parse(text);
      } catch {}
      if (r.ok) {
        setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
      } else {
        console.error('Status update failed:', r.status, data);
        alert(`Failed to update status: ${data.error || `HTTP ${r.status}`}`);
      }
    } catch (e) {
      console.error('Status update error:', e);
      alert('Failed to update order status. Please try again.');
    }
  };

  const deleteOrder = async (orderId: string) => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const r = await fetch(`/api/orders/manage?id=${orderId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      let data: any = {};
      try {
        const text = await r.text();
        if (text) data = JSON.parse(text);
      } catch {}
      if (r.ok) {
        setOrders(prev => prev.filter(o => o._id !== orderId));
        setConfirmDeleteOrder(null);
      } else {
        console.error('Delete failed:', r.status, data);
        alert(`Failed to delete order: ${data.error || `HTTP ${r.status}`}`);
      }
    } catch (e) {
      console.error('Delete error:', e);
      alert('Failed to delete order. Please try again.');
    }
  };

  const addProduct = async (formData: ProductFormData): Promise<boolean> => {
    if (!user) return false;
    try {
      const token = await user.getIdToken();
      const price = parseFloat(formData.price);
      const sizeStock = Object.fromEntries(
        SIZES.map(s => [s, Math.max(0, parseInt(formData.sizeStock[s] ?? '0') || 0)])
      );
      const stock = Object.values(sizeStock).reduce((sum, qty) => sum + qty, 0);
      const images = formData.images.map(s => s.trim()).filter(Boolean);
      const hasHighlights = Object.values(formData.highlights).some(v => v.trim() !== '');
      const highlights = hasHighlights ? formData.highlights : null;
      const r = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: formData.name, section: formData.section || 'denim', categoryId: formData.categoryId, price, sizeStock, stock, images, description: formData.description, highlights }),
      });
      const d = await r.json();
      if (r.ok) {
        setProducts(prev => [{ _id: d.product._id, name: formData.name, section: formData.section || 'denim', categoryId: formData.categoryId, price, stock, sizeStock, images, image: images[0], description: formData.description, highlights }, ...prev]);
        setShowAddProductModal(false);
        return true;
      }
      return false;
    } catch { return false; }
  };

  const updateProduct = async (formData: ProductFormData): Promise<boolean> => {
    if (!user || !editingProduct) return false;
    try {
      const token = await user.getIdToken();
      const price = parseFloat(formData.price);
      const sizeStock = Object.fromEntries(
        SIZES.map(s => [s, Math.max(0, parseInt(formData.sizeStock[s] ?? '0') || 0)])
      );
      const stock = Object.values(sizeStock).reduce((sum, qty) => sum + qty, 0);
      const images = formData.images.map(s => s.trim()).filter(Boolean);
      const hasHighlightsPut = Object.values(formData.highlights).some(v => v.trim() !== '');
      const highlightsPut = hasHighlightsPut ? formData.highlights : null;
      const r = await fetch(`/api/products?id=${editingProduct._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: formData.name, section: formData.section || 'denim', categoryId: formData.categoryId, price, sizeStock, stock, images, description: formData.description, highlights: highlightsPut }),
      });
      const d = await r.json();
      if (r.ok) {
        setProducts(prev => prev.map(p => p._id === editingProduct._id
          ? { _id: editingProduct._id, name: formData.name, section: formData.section || 'denim', categoryId: formData.categoryId, price, stock, sizeStock, images, image: images[0], description: formData.description, highlights: highlightsPut }
          : p
        ));
        setEditingProduct(null);
        return true;
      }
      console.error(d);
      return false;
    } catch { return false; }
  };

  const deleteProduct = async (productId: string) => {
    if (!user) return;
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/products?id=${productId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      let data = null;
      try { data = await res.json(); } catch {}
      if (res.status === 200 && data?.deletedCount === 1) {
        setProducts(prev => prev.filter(p => p._id !== productId));
      } else {
        alert('Delete failed — please try again');
      }
    } catch { alert('Delete failed — network error'); }
  };

  const deleteCategory = async (categoryId: string) => {
    if (!user) return;
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      const token = await user.getIdToken();
      const r = await fetch(`/api/categories?id=${categoryId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.ok) setCategories(prev => prev.filter(c => c._id !== categoryId));
    } catch { console.error('Failed to delete category'); }
  };

  const addCategory = async (formData: CategoryFormData): Promise<boolean> => {
    if (!user) return false;
    try {
      const token = await user.getIdToken();
      const r = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData),
      });
      const d = await r.json();
      if (r.ok) {
        setCategories(prev => [{ _id: d.category._id, ...formData }, ...prev]);
        setShowAddCategoryModal(false);
        return true;
      }
      return false;
    } catch { return false; }
  };

  if (!user) {
    return (
      <div className="noise-overlay min-h-screen flex items-center justify-center bg-void">
        <div className="text-sv-mid font-condensed text-sm tracking-widest uppercase">Loading...</div>
      </div>
    );
  }

  if (!ADMIN_EMAILS.includes(user.email)) return null;

  const tabs = [
    { key: 'orders' as const, label: 'Orders', Icon: Users },
    { key: 'products' as const, label: 'Products', Icon: Package },
    { key: 'categories' as const, label: 'Categories', Icon: Folder },
    { key: 'reviews' as const, label: 'Reviews', Icon: MessageSquare },
  ];

  return (
    <div className="noise-overlay min-h-screen flex flex-col bg-void">
      <CustomCursor />
      <ScrollProgress />
      <Navbar />

      <main className="flex-1 pt-20 sm:pt-24 md:pt-28 pb-16">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-12 lg:px-16">

          {/* Header */}
          <div className="mb-6 sm:mb-8 pt-2">
            <p className="font-condensed text-xs text-sv-mid uppercase tracking-widest mb-1">Dashboard</p>
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl tracking-[0.06em] text-tb-white uppercase">
              Admin Panel
            </h1>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/10 mb-6 sm:mb-8 overflow-x-auto scrollbar-none">
            {tabs.map(({ key, label, Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 px-4 sm:px-6 py-3 font-condensed font-semibold text-xs sm:text-sm tracking-[0.15em] uppercase transition-all duration-200 border-b-2 -mb-px whitespace-nowrap shrink-0 ${
                  activeTab === key
                    ? 'text-tb-white border-tb-white'
                    : 'text-sv-mid hover:text-tb-white border-transparent'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-7 w-7 border-2 border-white/10 border-t-white/60" />
            </div>
          )}

          {/* Content */}
          {!loading && (
            <AnimatePresence mode="wait">
              {/* ── ORDERS ── */}
              {activeTab === 'orders' && (
                <motion.div key="orders" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="font-display text-xl sm:text-2xl tracking-[0.06em] text-tb-white uppercase">Orders</h2>
                    <span className="font-condensed text-xs text-sv-mid bg-white/5 border border-white/10 rounded px-2 py-1">{orders.length} total</span>
                  </div>

                  {orders.length === 0 ? (
                    <EmptyState message="No orders yet." />
                  ) : (
                    <>
                      {/* Mobile: cards */}
                      <div className="block md:hidden space-y-3">
                        {orders.map((order) => (
                          <div key={order._id} className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
                            {/* Order ID + Status */}
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <div className="min-w-0">
                                <p className="font-condensed text-xs text-sv-mid uppercase tracking-wider mb-0.5">Order ID</p>
                                <p className="text-tb-white text-xs font-mono">#{order._id?.slice(-10) ?? '—'}</p>
                              </div>
                              <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-condensed uppercase tracking-wider border ${STATUS_COLORS[order.status] ?? 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
                                {order.status ?? 'pending'}
                              </span>
                            </div>
                            {/* Customer */}
                            <div className="mb-3">
                              <p className="font-condensed text-xs text-sv-mid uppercase tracking-wider mb-0.5">Customer</p>
                              <p className="text-tb-white text-sm truncate">{order.userId?.includes('@') ? order.userId : 'Unknown User'}</p>
                            </div>
                            {/* Items */}
                            <div className="mb-3">
                              <p className="font-condensed text-xs text-sv-mid uppercase tracking-wider mb-1.5">Items</p>
                              <div className="space-y-2">
                                {(order.products ?? []).map((p, i) => (
                                  <div key={i} className="bg-white/[0.03] rounded-lg px-3 py-2">
                                    {p.productId ? (
                                      <a
                                        href={`/product/${p.productId}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 text-sm font-medium text-tb-white hover:text-brass transition-colors duration-200 group"
                                      >
                                        <span>{p.name}</span>
                                        <ExternalLink className="w-3 h-3 opacity-40 group-hover:opacity-100 transition-opacity shrink-0" />
                                      </a>
                                    ) : (
                                      <p className="text-tb-white text-sm font-medium">{p.name}</p>
                                    )}
                                    <div className="flex items-center gap-3 mt-0.5">
                                      {p.size && <span className="text-sv-mid text-xs">Size: <span className="text-tb-white">{p.size}</span></span>}
                                      <span className="text-sv-mid text-xs">Qty: <span className="text-tb-white">{p.quantity}</span></span>
                                      {p.price != null && <span className="text-sv-mid text-xs">₹{p.price.toFixed(2)}</span>}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                            {/* Address */}
                            {order.address?.fullName && (
                              <div className="mb-3">
                                <button
                                  onClick={() => setViewAddressOrder(order)}
                                  className="w-full px-3 py-2 bg-white/5 border border-white/15 rounded-lg text-tb-white text-xs font-condensed uppercase tracking-wider hover:bg-white/10 transition-colors"
                                >
                                  View Address
                                </button>
                              </div>
                            )}
                            {/* Total + Date + Update */}
                            <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/10">
                              <div>
                                <p className="font-condensed text-xs text-sv-mid uppercase tracking-wider mb-0.5">Total</p>
                                <p className="text-tb-white font-condensed font-semibold">₹{order.totalAmount?.toFixed(2) ?? '—'}</p>
                                <p className="text-sv-mid text-xs mt-0.5">
                                  {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                                </p>
                              </div>
                              <div className="relative">
                                <select
                                  value={order.status ?? 'pending'}
                                  onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                                  className="pl-3 pr-7 py-1.5 bg-white/5 border border-white/15 rounded-lg text-tb-white text-xs font-condensed focus:outline-none focus:border-white/30 appearance-none"
                                >
                                  {['pending','confirmed','shipped','delivered'].map(s => <option key={s} value={s} className="bg-zinc-900">{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-sv-mid pointer-events-none" />
                              </div>
                              <button
                                onClick={() => setConfirmDeleteOrder(order)}
                                className="p-2 rounded-lg text-red-400/60 hover:text-red-400 hover:bg-red-400/10 transition-colors shrink-0"
                                title="Delete order"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Desktop: table */}
                      <div className="hidden md:block overflow-x-auto rounded-xl border border-white/10">
                        <table className="w-full bg-white/[0.02]">
                          <thead>
                            <tr className="border-b border-white/10">
                              {['Order ID', 'Customer', 'Items', 'Ship To', 'Total', 'Date', 'Status', 'Update', ''].map((h) => (
                                <th key={h} className="px-4 py-3 text-left font-condensed text-xs text-sv-mid uppercase tracking-wider">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {orders.map((order) => (
                              <tr key={order._id} className="border-b border-white/10 last:border-0 hover:bg-white/[0.02] transition-colors align-top">
                                {/* Order ID */}
                                <td className="px-4 py-4 text-xs text-sv-mid font-mono whitespace-nowrap">
                                  #{order._id?.slice(-10) ?? '—'}
                                </td>
                                {/* Customer */}
                                <td className="px-4 py-4 text-sm text-sv-mid max-w-[160px]">
                                  <span className="block truncate">{order.userId?.includes('@') ? order.userId : 'Unknown'}</span>
                                </td>
                                {/* Items */}
                                <td className="px-4 py-4 max-w-[220px]">
                                  <div className="space-y-2">
                                    {(order.products ?? []).map((p, i) => (
                                      <div key={i}>
                                        {p.productId ? (
                                          <a
                                            href={`/product/${p.productId}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 text-sm font-medium text-tb-white hover:text-brass transition-colors duration-200 group"
                                          >
                                            <span>{p.name}</span>
                                            <ExternalLink className="w-3 h-3 opacity-40 group-hover:opacity-100 transition-opacity shrink-0" />
                                          </a>
                                        ) : (
                                          <div className="text-sm text-tb-white font-medium">{p.name}</div>
                                        )}
                                        <div className="flex items-center gap-2 mt-0.5">
                                          {p.size && <span className="text-xs text-sv-mid">Size: <span className="text-tb-white">{p.size}</span></span>}
                                          <span className="text-xs text-sv-mid">Qty: <span className="text-tb-white">{p.quantity}</span></span>
                                          {p.price != null && <span className="text-xs text-sv-mid">₹{p.price.toFixed(2)}</span>}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </td>
                                {/* Ship To */}
                                <td className="px-4 py-4">
                                  {order.address?.fullName ? (
                                    <button
                                      onClick={() => setViewAddressOrder(order)}
                                      className="px-3 py-1.5 bg-white/5 border border-white/15 rounded-lg text-tb-white text-xs font-condensed uppercase tracking-wider hover:bg-white/10 transition-colors whitespace-nowrap"
                                    >
                                      View Address
                                    </button>
                                  ) : <span className="text-sv-mid text-xs">—</span>}
                                </td>
                                {/* Total */}
                                <td className="px-4 py-4 text-sm text-tb-white font-condensed font-semibold whitespace-nowrap">
                                  ₹{order.totalAmount?.toFixed(2) ?? '—'}
                                </td>
                                {/* Date */}
                                <td className="px-4 py-4 text-sm text-sv-mid whitespace-nowrap">
                                  {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                                </td>
                                {/* Status badge */}
                                <td className="px-4 py-4">
                                  <span className={`px-2.5 py-1 rounded-full text-xs font-condensed uppercase tracking-wider border ${STATUS_COLORS[order.status] ?? 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
                                    {order.status ?? 'pending'}
                                  </span>
                                </td>
                                {/* Update dropdown */}
                                <td className="px-4 py-4">
                                  <div className="relative inline-block">
                                    <select
                                      value={order.status ?? 'pending'}
                                      onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                                      className="pl-3 pr-8 py-1.5 bg-white/5 border border-white/15 rounded-lg text-tb-white text-xs font-condensed focus:outline-none focus:border-white/30 appearance-none"
                                    >
                                      {['pending','confirmed','shipped','delivered'].map(s => <option key={s} value={s} className="bg-zinc-900">{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-sv-mid pointer-events-none" />
                                  </div>
                                </td>
                                {/* Delete */}
                                <td className="px-4 py-4">
                                  <button
                                    onClick={() => setConfirmDeleteOrder(order)}
                                    className="p-1.5 rounded-lg text-red-400/60 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                                    title="Delete order"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </motion.div>
              )}

              {/* ── PRODUCTS ── */}
              {activeTab === 'products' && (
                <motion.div key="products" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="font-display text-xl sm:text-2xl tracking-[0.06em] text-tb-white uppercase">Products</h2>
                    <button
                      onClick={() => setShowAddProductModal(true)}
                      className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-tb-white text-void font-condensed font-bold text-xs sm:text-sm tracking-[0.15em] uppercase hover:bg-white transition-colors rounded-lg"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Product</span>
                    </button>
                  </div>

                  {products.length === 0 ? (
                    <EmptyState message="No products yet." />
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                      {products.map((product) => (
                        <div key={product._id} className="group bg-white/[0.03] border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition-all duration-200">
                          <div className="aspect-square bg-[#0c0c0c] overflow-hidden">
                            <img
                              src={optimizeCloudinaryUrl((product as any).images?.[0] || product.image || '/placeholder.png', IMG_SIZES.card)}
                              alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                              decoding="async"
                              onError={(e) => { e.currentTarget.src = '/placeholder.png'; }}
                            />
                          </div>
                          <div className="p-3">
                            <p className="font-condensed text-xs text-sv-mid mb-0.5 truncate">
                              {categories.find(c => c._id === product.categoryId)?.name || 'Uncategorized'}
                            </p>
                            <h3 className="font-condensed font-medium text-tb-white text-sm mb-1 line-clamp-2 leading-snug">{product.name}</h3>
                            <div className="flex items-center justify-between mb-2">
                              <p className="font-condensed font-semibold text-tb-white text-sm">₹{product.price}</p>
                              {typeof product.stock === 'number' && (
                                <span className={`font-condensed text-xs px-2 py-0.5 rounded-full border ${
                                  product.stock === 0
                                    ? 'bg-red-500/15 border-red-500/30 text-red-400'
                                    : product.stock <= 5
                                      ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                                      : 'bg-green-500/15 border-green-500/30 text-green-400'
                                }`}>
                                  {product.stock === 0 ? 'Out of stock' : `${product.stock} total`}
                                </span>
                              )}
                            </div>
                            {product.sizeStock && (
                              <div className="grid grid-cols-5 gap-1 mb-2">
                                {SIZES.map(size => {
                                  const qty = product.sizeStock![size] ?? 0;
                                  return (
                                    <div key={size} className={`text-center rounded py-0.5 border ${qty === 0 ? 'border-red-500/20 bg-red-500/5' : 'border-white/8 bg-white/3'}`}>
                                      <div className="font-condensed text-[10px] text-sv-mid/70">{size}</div>
                                      <div className={`font-condensed text-xs font-semibold ${qty === 0 ? 'text-red-400/60' : 'text-tb-white'}`}>{qty}</div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                            <div className="flex gap-2">
                              <button
                                onClick={() => setEditingProduct(product)}
                                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-white/5 border border-white/10 rounded-lg text-tb-white text-xs font-condensed hover:bg-white/10 transition-colors"
                              >
                                <Pencil className="w-3 h-3" />
                                Edit
                              </button>
                              <button
                                onClick={() => deleteProduct(product._id)}
                                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs font-condensed hover:bg-red-500/20 transition-colors"
                              >
                                <Trash2 className="w-3 h-3" />
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* ── CATEGORIES ── */}
              {activeTab === 'categories' && (
                <motion.div key="categories" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="font-display text-xl sm:text-2xl tracking-[0.06em] text-tb-white uppercase">Categories</h2>
                    <button
                      onClick={() => setShowAddCategoryModal(true)}
                      className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-tb-white text-void font-condensed font-bold text-xs sm:text-sm tracking-[0.15em] uppercase hover:bg-white transition-colors rounded-lg"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Category</span>
                    </button>
                  </div>

                  {categories.length === 0 ? (
                    <EmptyState message="No categories yet." />
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                      {categories.map((category) => (
                        <div key={category._id} className="group bg-white/[0.03] border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition-all duration-200">
                          <div className="aspect-square bg-[#0c0c0c] overflow-hidden">
                            <img
                              src={optimizeCloudinaryUrl(category.image || '/placeholder.png', IMG_SIZES.card)}
                              alt={category.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                              decoding="async"
                              onError={(e) => { e.currentTarget.src = '/placeholder.png'; }}
                            />
                          </div>
                          <div className="p-3">
                            <h3 className="font-condensed font-semibold text-tb-white text-sm mb-1 line-clamp-1">{category.name}</h3>
                            <p className="font-condensed text-xs text-sv-mid mb-3">
                              {CATEGORY_SECTIONS.find(s => s.value === (category.section || 'denim'))?.label ?? 'Denim Collection'}
                            </p>
                            <button
                              onClick={() => deleteCategory(category._id)}
                              className="w-full flex items-center justify-center gap-1.5 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs font-condensed hover:bg-red-500/20 transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* ── REVIEWS ── */}
              {activeTab === 'reviews' && (
                <motion.div key="reviews" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                  {!reviewsProduct ? (
                    <>
                      <div className="flex items-center justify-between mb-5">
                        <h2 className="font-display text-xl sm:text-2xl tracking-[0.06em] text-tb-white uppercase">Reviews</h2>
                        <p className="font-condensed text-xs text-sv-mid uppercase tracking-widest">Pick a product</p>
                      </div>

                      {products.length === 0 ? (
                        <EmptyState message="No products yet." />
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                          {products.map((product) => (
                            <button
                              key={product._id}
                              onClick={() => { setReviewsProduct(product); fetchReviewsForProduct(product._id); }}
                              className="group text-left bg-white/[0.03] border border-white/10 rounded-xl overflow-hidden hover:border-brass/40 transition-all duration-200"
                            >
                              <div className="aspect-square bg-[#0c0c0c] overflow-hidden">
                                <img
                                  src={optimizeCloudinaryUrl((product as any).images?.[0] || product.image || '/placeholder.png', IMG_SIZES.card)}
                                  alt={product.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  loading="lazy"
                                  decoding="async"
                                  onError={(e) => { e.currentTarget.src = '/placeholder.png'; }}
                                />
                              </div>
                              <div className="p-3">
                                <h3 className="font-condensed font-medium text-tb-white text-sm line-clamp-2 leading-snug">{product.name}</h3>
                                <p className="font-condensed text-xs text-sv-mid mt-1 group-hover:text-brass transition-colors">
                                  View reviews →
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-5 gap-4">
                        <button
                          onClick={() => { setReviewsProduct(null); setProductReviews([]); }}
                          className="font-condensed font-semibold text-xs tracking-[0.18em] uppercase text-sv-mid hover:text-brass transition-colors duration-200 flex items-center gap-2"
                        >
                          <ArrowLeft className="w-4 h-4" />
                          All Products
                        </button>
                        <p className="font-condensed text-xs text-sv-mid uppercase tracking-widest">
                          {productReviews.length} review{productReviews.length === 1 ? '' : 's'}
                        </p>
                      </div>

                      <div className="flex items-center gap-4 mb-6 p-4 bg-white/[0.03] border border-white/10 rounded-xl">
                        <img
                          src={optimizeCloudinaryUrl((reviewsProduct as any).images?.[0] || reviewsProduct.image || '/placeholder.png', IMG_SIZES.card)}
                          alt={reviewsProduct.name}
                          className="w-16 h-16 rounded-lg object-cover shrink-0"
                          onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/placeholder.png'; }}
                        />
                        <div className="min-w-0">
                          <p className="font-condensed text-xs text-sv-mid uppercase tracking-widest mb-0.5">Reviews for</p>
                          <h3 className="font-display text-lg tracking-[0.06em] text-tb-white uppercase truncate">{reviewsProduct.name}</h3>
                        </div>
                      </div>

                      {reviewsLoading ? (
                        <div className="flex justify-center py-12">
                          <div className="animate-spin rounded-full h-7 w-7 border-2 border-white/10 border-t-white/60" />
                        </div>
                      ) : productReviews.length === 0 ? (
                        <EmptyState message="No reviews for this product yet." />
                      ) : (
                        <div className="space-y-3">
                          {productReviews.map((rv) => (
                            <div key={rv._id} className="p-4 bg-white/[0.03] border border-white/10 rounded-xl">
                              <div className="flex items-start justify-between gap-3 mb-2">
                                <div className="min-w-0">
                                  <p className="font-condensed text-sm text-tb-white truncate">{rv.userId}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <LightningRating value={rv.rating} readonly size="sm" />
                                    <span className="font-condensed text-[10px] text-sv-mid uppercase tracking-[0.14em]">
                                      {new Date(rv.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                    </span>
                                  </div>
                                </div>
                                <button
                                  onClick={() => adminDeleteReview(rv._id)}
                                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-xs font-condensed uppercase tracking-wider hover:bg-red-500/20 transition-colors shrink-0"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  Delete
                                </button>
                              </div>
                              {rv.comment && (
                                <p className="text-tb-off text-sm leading-relaxed whitespace-pre-wrap mt-2">{rv.comment}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </main>

      <Footer />

      <AnimatePresence>
        {confirmDeleteOrder && (
          <ModalShell onClose={() => setConfirmDeleteOrder(null)}>
            <div className="px-6 pt-6 pb-2 border-b border-white/10 shrink-0">
              <p className="font-condensed text-xs text-red-400/70 uppercase tracking-widest mb-0.5">Danger Zone</p>
              <h3 className="font-display text-xl tracking-[0.08em] text-tb-white uppercase pr-8">Delete Order?</h3>
            </div>
            <div className="px-6 py-6 flex-1">
              <p className="text-sv-mid text-sm leading-relaxed mb-2">
                Are you sure you want to delete order
              </p>
              <p className="font-mono text-xs text-tb-white bg-white/5 border border-white/10 rounded-lg px-3 py-2 mb-4">
                #{confirmDeleteOrder._id?.slice(-10)}
              </p>
              <p className="text-sv-mid text-xs">
                This will permanently remove the order for{' '}
                <span className="text-tb-white">{confirmDeleteOrder.userId}</span>.
                This action cannot be undone.
              </p>
            </div>
            <div className="px-6 pb-6 pt-3 shrink-0 border-t border-white/10 flex gap-3">
              <button
                onClick={() => setConfirmDeleteOrder(null)}
                className="flex-1 py-3 bg-white/5 border border-white/10 rounded-lg text-sv-mid text-sm font-condensed uppercase tracking-wider hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteOrder(confirmDeleteOrder._id)}
                className="flex-1 py-3 bg-red-500/90 hover:bg-red-500 rounded-lg text-white text-sm font-condensed font-bold uppercase tracking-wider transition-colors"
              >
                Yes, Delete
              </button>
            </div>
          </ModalShell>
        )}
        {viewAddressOrder && (
          <ModalShell onClose={() => setViewAddressOrder(null)}>
            <div className="px-6 pt-6 pb-2 border-b border-white/10 shrink-0">
              <p className="font-condensed text-xs text-sv-mid uppercase tracking-widest mb-0.5">Order #{viewAddressOrder._id?.slice(-10)}</p>
              <h3 className="font-display text-xl tracking-[0.08em] text-tb-white uppercase pr-8">Delivery Address</h3>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
              {[
                { label: 'Full Name', value: viewAddressOrder.address?.fullName },
                { label: 'Phone Number', value: viewAddressOrder.address?.phone },
                { label: 'Address', value: viewAddressOrder.address?.addressLine1 },
                { label: 'City', value: viewAddressOrder.address?.city },
                { label: 'Pincode', value: viewAddressOrder.address?.pincode },
                { label: 'Payment Method', value: viewAddressOrder.paymentMethod },
                { label: 'Customer Email', value: viewAddressOrder.userId },
              ].map(({ label, value }) => value ? (
                <div key={label}>
                  <p className="font-condensed text-xs text-sv-mid uppercase tracking-wider mb-1">{label}</p>
                  <p className="text-tb-white text-sm">{value}</p>
                </div>
              ) : null)}
            </div>
            <div className="px-6 pb-6 pt-3 shrink-0 border-t border-white/10">
              <button
                onClick={() => setViewAddressOrder(null)}
                className="w-full py-3 bg-white/5 border border-white/10 rounded-lg text-sv-mid text-sm font-condensed uppercase tracking-wider hover:bg-white/10 transition-colors"
              >
                Close
              </button>
            </div>
          </ModalShell>
        )}
        {showAddProductModal && (
          <ProductModal title="Add Product" onSubmit={addProduct} onClose={() => setShowAddProductModal(false)} />
        )}
        {showAddCategoryModal && (
          <CategoryModal title="Add Category" onSubmit={addCategory} onClose={() => setShowAddCategoryModal(false)} />
        )}
        {editingProduct && (
          <ProductModal
            title="Edit Product"
            initialData={{
              name: editingProduct.name,
              section: editingProduct.section || 'denim',
              categoryId: editingProduct.categoryId,
              price: String(editingProduct.price),
              images: (editingProduct as any).images?.length
                ? (editingProduct as any).images
                : editingProduct.image
                  ? [editingProduct.image]
                  : [''],
              description: editingProduct.description ?? '',
              sizeStock: editingProduct.sizeStock
                ? Object.fromEntries(SIZES.map(s => [s, String(editingProduct.sizeStock![s] ?? 0)]))
                : makeDefaultSizeStock(),
              highlights: editingProduct.highlights
                ? { ...defaultHighlights, ...editingProduct.highlights }
                : defaultHighlights,
            }}
            onSubmit={updateProduct}
            onClose={() => setEditingProduct(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 border border-dashed border-white/10 rounded-xl">
      <p className="text-sv-mid font-condensed text-sm tracking-wider">{message}</p>
    </div>
  );
}
