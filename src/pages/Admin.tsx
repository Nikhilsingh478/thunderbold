import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Users, X } from 'lucide-react';
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
  category: string;
  price: number;
  image?: string;
  description?: string;
  stock?: number;
}

interface ProductFormData {
  name: string;
  category: string;
  price: string;
  image: string;
  description: string;
  stock: string;
}

const defaultFormData: ProductFormData = {
  name: '',
  category: '',
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

  const handleSubmit = async () => {
    if (!form.name || !form.price) {
      setError('Name and price are required.');
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
              { key: 'name', label: 'Name', placeholder: 'Product name' },
              { key: 'category', label: 'Category', placeholder: 'e.g. Tops, Bottoms' },
              { key: 'price', label: 'Price (¥)', placeholder: '0', type: 'number' },
              { key: 'image', label: 'Image URL', placeholder: 'https://...' },
              { key: 'stock', label: 'Stock', placeholder: '0', type: 'number' },
            ] as { key: keyof ProductFormData; label: string; placeholder: string; type?: string }[]
          ).map(({ key, label, placeholder, type }) => (
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
  const [activeTab, setActiveTab] = useState<'orders' | 'products'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
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
    try {
      setLoading(true);
      const response = await fetch('/api/products');
      const data = await response.json();
      setProducts(data.products ?? []);
    } catch (err) {
      console.error('Error fetching products:', err);
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
      if (response.ok) {
        await fetchProducts();
        setShowAddProductModal(false);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to add product:', err);
      return false;
    }
  };

  const updateProduct = async (formData: ProductFormData): Promise<boolean> => {
    if (!user || !editingProduct) return false;
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/products/${editingProduct._id}`, {
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
      if (response.ok) {
        await fetchProducts();
        setEditingProduct(null);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to update product:', err);
      return false;
    }
  };

  const deleteProduct = async (productId: string) => {
    if (!user) return;
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) await fetchProducts();
    } catch (err) {
      console.error('Failed to delete product:', err);
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

      <main className="flex-1 pt-28 pb-24 px-5 md:px-16">
        <div className="max-w-[1400px] mx-auto">

          {/* Header */}
          <div className="mb-8">
            <h1 className="font-display text-4xl md:text-5xl tracking-[0.1em] text-tb-white uppercase">
              Admin Panel
            </h1>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 border-b border-white/20 mb-8">
            {(
              [
                { key: 'orders', label: 'Orders', Icon: Users },
                { key: 'products', label: 'Products', Icon: Package },
              ] as const
            ).map(({ key, label, Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`inline-flex items-center gap-2 px-6 py-3 font-condensed font-semibold text-sm tracking-[0.2em] uppercase transition-colors duration-200 border-b-2 -mb-px ${
                  activeTab === key
                    ? 'text-tb-white border-tb-white'
                    : 'text-sv-mid hover:text-tb-white border-transparent'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="min-h-[600px]">
            {loading && (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-tb-white" />
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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {products.map((product) => (
                      <div
                        key={product._id}
                        className="bg-surface border border-white/10 rounded-lg p-4"
                      >
                        <div className="aspect-[4/5] bg-[#0c0c0c] rounded-lg overflow-hidden mb-4">
                          <img
                            src={product.image || '/placeholder.png'}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = '/placeholder.png';
                            }}
                          />
                        </div>
                        <h3 className="font-condensed font-semibold text-tb-white text-sm mb-1">
                          {product.name}
                        </h3>
                        <p className="text-sv-mid text-xs mb-1">{product.category}</p>
                        <p className="font-condensed text-tb-white mb-3">¥{product.price}</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingProduct(product)}
                            className="flex-1 px-3 py-1.5 bg-white/10 border border-white/20 rounded text-tb-white text-xs hover:bg-white/20 transition-all duration-200"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteProduct(product._id)}
                            className="flex-1 px-3 py-1.5 bg-red-500/20 border border-red-500/50 rounded text-red-400 text-xs hover:bg-red-500/30 transition-all duration-200"
                          >
                            Delete
                          </button>
                        </div>
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
        {editingProduct && (
          <ProductModal
            title="Edit Product"
            initialData={{
              name: editingProduct.name,
              category: editingProduct.category,
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