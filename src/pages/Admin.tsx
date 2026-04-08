import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Package, Folder, X } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CustomCursor from '../components/CustomCursor';
import ScrollProgress from '../components/ScrollProgress';
import { useAuth } from '../context/AuthContext';

const ADMIN_EMAIL = "nikhilwebworks@gmail.com";

interface OrderProduct {
  name: string;
  quantity: number;
}

interface Order {
  _id: string;
  userId: string;
  products: OrderProduct[];
  totalAmount: number;
  status: string;
  createdAt: string;
}

interface Product {
  _id: string;
  name: string;
  categoryId: string;
  price: number;
  image?: string;
  description?: string;
  stock?: number;
}

interface CategoryFormData {
  name: string;
  image: string;
}

const defaultCategoryFormData: CategoryFormData = {
  name: '',
  image: '',
};

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
    if (!form.name || !form.image) {
      setError('Name and image are required.');
      return;
    }
    setSubmitting(true);
    const ok = await onSubmit(form);
    setSubmitting(false);
    if (!ok) setError('Something went wrong. Please try again.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-surface border border-white/10 rounded-xl p-6 relative"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-sv-mid hover:text-tb-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="font-display text-xl tracking-[0.1em] text-tb-white uppercase mb-6">
          {title}
        </h3>

        <div className="space-y-4">
          {(
            [
              { key: 'name', label: 'Name', placeholder: 'Category name' },
              { key: 'image', label: 'Image URL', placeholder: 'https://...' },
            ] as { key: keyof CategoryFormData; label: string; placeholder: string }[]
          ).map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="block text-tb-white text-sm font-condensed mb-2">
                {label}
              </label>
              <input
                type={key === 'image' ? 'url' : 'text'}
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                placeholder={placeholder}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-tb-white placeholder-sv-mid focus:outline-none focus:border-white/30 transition-colors"
              />
            </div>
          ))}
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-tb-white hover:bg-white/20 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 px-4 py-3 bg-tb-white text-void font-condensed font-bold tracking-[0.2em] uppercase rounded-lg hover:bg-white transition-colors disabled:opacity-50"
          >
            {submitting ? 'Creating...' : 'Create Category'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

interface ProductFormData {
  name: string;
  categoryId: string;
  price: string;
  image: string;
  description: string;
  stock: string;
}

const defaultFormData: ProductFormData = {
  name: '',
  categoryId: '',
  price: '',
  image: '',
  description: '',
  stock: '',
};

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

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        const data = await response.json();
        setCategories(data.categories || []);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };
    fetchCategories();
  }, []);

  const formFields = [
    { key: 'price', label: 'Price (¥)', placeholder: '0', type: 'number' },
    { key: 'image', label: 'Image URL', placeholder: 'https://...' },
    { key: 'stock', label: 'Stock', placeholder: '0', type: 'number' },
  ];

  const handleSubmit = async () => {
    if (!form.name || !form.price || !form.categoryId) {
      setError('Name, price, and category are required.');
      return;
    }
    setSubmitting(true);
    const ok = await onSubmit(form);
    setSubmitting(false);
    if (!ok) setError('Something went wrong. Please try again.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-surface border border-white/10 rounded-xl p-6 relative"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-sv-mid hover:text-tb-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="font-display text-xl tracking-[0.1em] text-tb-white uppercase mb-6">
          {title}
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block font-condensed text-xs text-sv-mid uppercase tracking-wider mb-1">
              Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Product name"
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-tb-white text-sm placeholder:text-sv-mid/40 focus:outline-none focus:border-white/30"
            />
          </div>

          <div>
            <label className="block font-condensed text-xs text-sv-mid uppercase tracking-wider mb-1">
              Category
            </label>
            <select
              value={form.categoryId}
              onChange={(e) => setForm((prev) => ({ ...prev, categoryId: e.target.value }))}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-tb-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-zinc-600 hover:border-zinc-600 transition-colors duration-200"
            >
              <option value="" className="bg-zinc-800 text-zinc-500">Select a category</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id} className="bg-zinc-800 text-tb-white">
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {formFields.map(({ key, label, placeholder, type }) => (
            <div key={key}>
              <label className="block font-condensed text-xs text-sv-mid uppercase tracking-wider mb-1">
                {label}
              </label>
              <input
                type={type ?? 'text'}
                value={form[key]}
                onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
                placeholder={placeholder}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-tb-white text-sm placeholder:text-sv-mid/40 focus:outline-none focus:border-white/30"
              />
            </div>
          ))}

          <div>
            <label className="block font-condensed text-xs text-sv-mid uppercase tracking-wider mb-1">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Product description"
              rows={3}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-tb-white text-sm placeholder:text-sv-mid/40 focus:outline-none focus:border-white/30 resize-none"
            />
          </div>
        </div>

        {error && (
          <p className="mt-3 text-red-400 text-xs font-condensed">{error}</p>
        )}

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded text-sv-mid text-sm font-condensed uppercase tracking-wider hover:bg-white/10 transition-all duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 px-4 py-2 bg-tb-white text-void font-condensed font-bold text-sm tracking-[0.2em] uppercase rounded hover:bg-white transition-all duration-200 disabled:opacity-50"
          >
            {submitting ? 'Saving...' : 'Save'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'categories'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && user.email !== ADMIN_EMAIL) {
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (user && activeTab === 'orders') fetchOrders();
  }, [activeTab, user]);

  useEffect(() => {
    if (user && activeTab === 'products') fetchProducts();
  }, [activeTab, user]);

  useEffect(() => {
    if (user && activeTab === 'categories') fetchCategories();
  }, [activeTab, user]);

  const fetchOrders = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const token = await user.getIdToken();
      const response = await fetch('/api/orders', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders ?? []);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const response = await fetch('/api/products');
      const data = await response.json();
      console.log('ADMIN FETCH PRODUCTS RESPONSE:', data);
      console.log('ADMIN PRODUCTS STATE:', data.products);
      setProducts(data.products ?? []);
    } catch (err) {
      console.error('ADMIN FETCH ERROR:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const response = await fetch('/api/categories');
      const data = await response.json();
      console.log('ADMIN FETCH CATEGORIES RESPONSE:', data);
      setCategories(data.categories ?? []);
    } catch (err) {
      console.error('ADMIN FETCH CATEGORIES ERROR:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (response.ok) {
        setOrders((prev) =>
          prev.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o))
        );
      }
    } catch (err) {
      console.error('Error updating order:', err);
    }
  };

  const addProduct = async (formData: ProductFormData): Promise<boolean> => {
    if (!user) return false;
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          stock: parseInt(formData.stock, 10) || 0,
        }),
      });
      
      // Parse JSON only ONCE
      const data = await response.json();
      console.log('PRODUCT API RESPONSE:', response.status, response.statusText);
      console.log('PRODUCT API DATA:', data);
      
      if (response.ok) {
        // Update local state immediately for instant UI update
        const newProduct = {
          _id: data.product._id,
          ...formData,
          price: parseFloat(formData.price),
          stock: parseInt(formData.stock, 10) || 0,
        };
        console.log('ADDING NEW PRODUCT TO STATE:', newProduct);
        setProducts(prev => {
          console.log('PREVIOUS PRODUCTS:', prev);
          const updated = [newProduct, ...prev];
          console.log('UPDATED PRODUCTS:', updated);
          return updated;
        });
        
        setShowAddProductModal(false);
        return true;
      } else {
        console.error('PRODUCT API ERROR:', data);
        return false;
      }
    } catch (err) {
      console.error('Failed to add product:', err);
      return false;
    }
  };

  const updateProduct = async (formData: ProductFormData): Promise<boolean> => {
    if (!user || !editingProduct) return false;
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/products?id=${editingProduct._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          stock: parseInt(formData.stock, 10) || 0,
        }),
      });
      
      // Parse JSON only ONCE
      const data = await response.json();
      console.log('UPDATE PRODUCT RESPONSE:', response.status, response.statusText);
      console.log('UPDATE PRODUCT DATA:', data);
      
      if (response.ok) {
        // Update local state immediately for instant UI update
        const updatedProduct = {
          _id: editingProduct._id,
          ...formData,
          price: parseFloat(formData.price),
          stock: parseInt(formData.stock, 10) || 0,
        };
        console.log('UPDATING PRODUCT IN STATE:', updatedProduct);
        setProducts(prev => {
          console.log('PREVIOUS PRODUCTS:', prev);
          const updated = prev.map(p => p._id === editingProduct._id ? updatedProduct : p);
          console.log('UPDATED PRODUCTS:', updated);
          return updated;
        });
        
        setEditingProduct(null);
        return true;
      } else {
        console.error('UPDATE PRODUCT ERROR:', data);
        return false;
      }
    } catch (err) {
      console.error('Failed to update product:', err);
      return false;
    }
  };

  const deleteProduct = async (productId: string) => {
    if (!user) return;
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      console.log('DELETE REQUEST ID:', productId);
      
      const token = await user.getIdToken();
      const res = await fetch(`/api/products?id=${productId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      let data = null;
      try {
        data = await res.json();
      } catch {
        console.warn('Empty DELETE response');
      }

      console.log('DELETE STATUS:', res.status);
      console.log('DELETE DATA:', data);

      if (res.status === 200 && data?.deletedCount === 1) {
        setProducts(prev => prev.filter(p => p._id !== productId));
      } else {
        console.error('DELETE FAILED HARD:', data);
        alert('Delete failed — DB not updated');
      }
    } catch (err) {
      console.error('DELETE ERROR:', err);
      alert('Delete failed — network error');
    }
  };

  const deleteCategory = async (categoryId: string) => {
    if (!user) return;
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      // Parse JSON only ONCE
      const data = await response.json();
      console.log('DELETE CATEGORY RESPONSE:', response.status, response.statusText);
      console.log('DELETE CATEGORY DATA:', data);
      
      if (response.ok) {
        // Update local state immediately for instant UI update
        console.log('REMOVING CATEGORY FROM STATE:', categoryId);
        setCategories(prev => {
          console.log('PREVIOUS CATEGORIES:', prev);
          const updated = prev.filter(c => c._id !== categoryId);
          console.log('UPDATED CATEGORIES:', updated);
          return updated;
        });
        
        return true;
      } else {
        console.error('DELETE CATEGORY ERROR:', data);
        return false;
      }
    } catch (err) {
      console.error('Failed to delete category:', err);
      return false;
    }
  };

  const addCategory = async (formData: CategoryFormData): Promise<boolean> => {
    if (!user) return false;
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      
      // Parse JSON only ONCE
      const data = await response.json();
      console.log('CATEGORY API RESPONSE:', response.status, response.statusText);
      console.log('CATEGORY API DATA:', data);
      
      if (response.ok) {
        // Update local state immediately for instant UI update
        const newCategory = {
          _id: data.category._id,
          ...formData,
        };
        console.log('ADDING NEW CATEGORY TO STATE:', newCategory);
        setCategories(prev => {
          console.log('PREVIOUS CATEGORIES:', prev);
          const updated = [newCategory, ...prev];
          console.log('UPDATED CATEGORIES:', updated);
          return updated;
        });
        
        setShowAddCategoryModal(false);
        return true;
      } else {
        console.error('CATEGORY API ERROR:', data);
        return false;
      }
    } catch (err) {
      console.error('Failed to add category:', err);
      return false;
    }
  };

  if (!user) {
    return (
      <div className="noise-overlay min-h-screen flex items-center justify-center bg-void">
        <div className="text-white text-xl">Loading admin panel...</div>
      </div>
    );
  }

  if (user.email !== ADMIN_EMAIL) return null;

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500',
    confirmed: 'bg-blue-500',
    shipped: 'bg-purple-500',
    delivered: 'bg-green-500',
  };

  return (
    <div className="noise-overlay min-h-screen flex flex-col bg-void">
      <CustomCursor />
      <ScrollProgress />
      <Navbar />

      <main className="flex-1 pt-20 sm:pt-24 md:pt-28 pb-16 px-3 sm:px-5 md:px-16">
        <div className="max-w-[1400px] mx-auto">

          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <h1 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl tracking-[0.1em] text-tb-white uppercase">
              Admin Panel
            </h1>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-1 border-b border-white/20 mb-6 sm:mb-8 overflow-x-auto max-w-full">
            {(
              [
                { key: 'orders', label: 'Orders', Icon: Users },
                { key: 'products', label: 'Products', Icon: Package },
                { key: 'categories', label: 'Categories', Icon: Folder },
              ] as const
            ).map(({ key, label, Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-6 py-2 sm:py-3 font-condensed font-semibold text-xs sm:text-sm tracking-[0.2em] uppercase transition-colors duration-200 border-b-2 -mb-px whitespace-nowrap ${
                  activeTab === key
                    ? 'text-tb-white border-tb-white'
                    : 'text-sv-mid hover:text-tb-white border-transparent'
                }`}
              >
                <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline sm:inline">{label}</span>
                <span className="inline xs:hidden sm:hidden">{label.slice(0, 1)}</span>
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="min-h-[600px]">
            {loading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brass"></div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-sv-mid font-condensed text-sm tracking-wider">Loading...</p>
                  </div>
                )}
            {!loading && activeTab === 'orders' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <h2 className="font-display text-2xl tracking-[0.1em] text-tb-white uppercase mb-6">
                  Orders Management
                </h2>

                {orders.length === 0 ? (
                  <p className="text-sv-mid font-condensed text-sm tracking-wider">No orders yet.</p>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-white/10">
                    <table className="w-full bg-surface">
                      <thead>
                        <tr className="border-b border-white/10">
                          {['User', 'Products', 'Total', 'Status', 'Date', 'Update Status'].map((h) => (
                            <th
                              key={h}
                              className="px-6 py-3 text-left font-condensed text-xs text-sv-mid uppercase tracking-wider"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((order) => (
                          <tr key={order._id} className="border-b border-white/10 last:border-0">
                            <td className="px-6 py-4 text-sm text-sv-mid">
                              {order.userId.includes('@') ? order.userId : 'Unknown User'}
                            </td>
                            <td className="px-6 py-4">
                              <div className="space-y-1">
                                {order.products.map((p, i) => (
                                  <div key={i} className="text-sm text-tb-white">
                                    {p.name} ({p.quantity}×)
                                  </div>
                                ))}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-tb-white">
                              ¥{order.totalAmount?.toFixed(2)}
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-condensed uppercase tracking-wider text-white ${
                                  statusColors[order.status] ?? 'bg-gray-500'
                                }`}
                              >
                                {order.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-sv-mid">
                              {order.createdAt
                                ? new Date(order.createdAt).toLocaleDateString('en-IN', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                  })
                                : '—'}
                            </td>
                            <td className="px-6 py-4">
                              <select
                                value={order.status}
                                onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                                className="px-3 py-1 bg-white/10 border border-white/20 rounded text-tb-white text-sm focus:outline-none focus:border-white/40"
                              >
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="shipped">Shipped</option>
                                <option value="delivered">Delivered</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.div>
            )}

            {!loading && activeTab === 'products' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="font-display text-2xl tracking-[0.1em] text-tb-white uppercase">
                    Product Management
                  </h2>
                  <button
                    onClick={() => setShowAddProductModal(true)}
                    className="px-4 py-2 bg-tb-white text-void font-condensed font-bold text-sm tracking-[0.2em] uppercase hover:bg-white transition-all duration-200 rounded-lg"
                  >
                    + Add Product
                  </button>
                </div>

                {products.length === 0 ? (
                  <p className="text-sv-mid font-condensed text-sm tracking-wider">No products yet.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
                    {products.map((product) => (
                      <div
                        key={product._id}
                        className="bg-zinc-800 border border-zinc-700 rounded-lg p-2 sm:p-3 hover:shadow-lg transition-all duration-200 hover:border-zinc-600"
                      >
                        <div className="aspect-square bg-[#0c0c0c] rounded-lg overflow-hidden mb-2 sm:mb-3 h-24 sm:h-32 md:h-40">
                          <img
                            src={product.image || '/placeholder.png'}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = '/placeholder.png';
                            }}
                          />
                        </div>
                        <h3 className="font-condensed font-medium text-tb-white text-xs sm:text-sm mb-1 line-clamp-2">
                          {product.name}
                        </h3>
                        <p className="text-gray-400 text-xs mb-2">{categories.find(c => c._id === product.categoryId)?.name || 'Uncategorized'}</p>
                        <p className="font-condensed text-tb-white text-sm sm:text-base font-semibold mb-2 sm:mb-3">¥{product.price}</p>
                        <div className="flex gap-1 sm:gap-2">
                          <button
                            onClick={() => setEditingProduct(product)}
                            className="flex-1 px-1 sm:px-2 py-1 sm:py-2 bg-zinc-700 border border-zinc-600 rounded text-tb-white text-xs hover:bg-zinc-600 transition-colors duration-200"
                          >
                            <span className="hidden sm:inline">Edit</span>
                            <span className="sm:hidden">E</span>
                          </button>
                          <button
                            onClick={() => deleteProduct(product._id)}
                            className="flex-1 px-1 sm:px-2 py-1 sm:py-2 bg-red-500/20 border border-red-500/50 rounded text-red-400 text-xs hover:bg-red-500/30 transition-colors duration-200"
                          >
                            <span className="hidden sm:inline">Delete</span>
                            <span className="sm:hidden">D</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {!loading && activeTab === 'categories' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="font-display text-2xl tracking-[0.1em] text-tb-white uppercase">
                    Category Management
                  </h2>
                  <button
                    onClick={() => setShowAddCategoryModal(true)}
                    className="px-4 py-2 bg-tb-white text-void font-condensed font-bold text-sm tracking-[0.2em] uppercase hover:bg-white transition-all duration-200 rounded-lg"
                  >
                    + Add Category
                  </button>
                </div>

                {categories.length === 0 ? (
                  <p className="text-sv-mid font-condensed text-sm tracking-wider">No categories yet.</p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {categories.map((category) => (
                      <div
                        key={category._id}
                        className="bg-surface border border-white/10 rounded-lg p-3"
                      >
                        <div className="aspect-square bg-[#0c0c0c] rounded-lg overflow-hidden mb-3 h-32">
                          <img
                            src={category.image || '/placeholder.png'}
                            alt={category.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = '/placeholder.png';
                            }}
                          />
                        </div>
                        <h3 className="font-condensed font-semibold text-tb-white text-xs mb-2">
                          {category.name}
                        </h3>
                        <button
                          onClick={() => deleteCategory(category._id)}
                          className="w-full px-2 py-1 bg-red-500/20 border border-red-500/50 rounded text-red-400 text-xs hover:bg-red-500/30 transition-all duration-200"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </main>

      <Footer />

      {/* Modals */}
      <AnimatePresence>
        {showAddProductModal && (
          <ProductModal
            title="Add New Product"
            onSubmit={addProduct}
            onClose={() => setShowAddProductModal(false)}
          />
        )}
        {showAddCategoryModal && (
          <CategoryModal
            title="Add New Category"
            onSubmit={addCategory}
            onClose={() => setShowAddCategoryModal(false)}
          />
        )}
        {editingProduct && (
          <ProductModal
            title="Edit Product"
            initialData={{
              name: editingProduct.name,
              categoryId: editingProduct.categoryId,
              price: String(editingProduct.price),
              image: editingProduct.image ?? '',
              description: editingProduct.description ?? '',
              stock: String(editingProduct.stock ?? 0),
            }}
            onSubmit={updateProduct}
            onClose={() => setEditingProduct(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}