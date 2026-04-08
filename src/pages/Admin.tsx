import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Package, Users, ShoppingBag, Settings, LogOut } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CustomCursor from '../components/CustomCursor';
import ScrollProgress from '../components/ScrollProgress';
import { useAuth } from '../context/AuthContext';

const ADMIN_EMAIL = "nikhilwebworks@gmail.com";

export default function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'orders' | 'products'>('orders');
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check admin access
  useEffect(() => {
    if (user && user.email !== ADMIN_EMAIL) {
      navigate('/');
      return;
    }
  }, [user, navigate]);

  // Fetch orders
  useEffect(() => {
    if (user && activeTab === 'orders') {
      fetchOrders();
    }
  }, [activeTab, user]);

  // Fetch products
  useEffect(() => {
    if (user && activeTab === 'products') {
      fetchProducts();
    }
  }, [activeTab, user]);

  const fetchOrders = async () => {
    if (!user) {
      console.log("User not ready for fetchOrders");
      return;
    }
    
    try {
      setLoading(true);
      const token = await user.getIdToken();
      const response = await fetch('/api/orders', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      } else {
        console.error('Failed to fetch orders');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/products');
      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    if (!user) {
      console.log("User not ready for updateOrderStatus");
      return;
    }
    
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        // Update local state
        setOrders(prev => prev.map(order => 
          order._id === orderId ? { ...order, status: newStatus } : order
        ));
      } else {
        console.error('Failed to update order status');
      }
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  // Product Management Functions
  const addProduct = async (productData: any) => {
    if (!user) return;
    
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(productData)
      });
      
      if (response.ok) {
        await fetchProducts(); // Refresh products list
        setShowAddProductModal(false);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to add product:', error);
      return false;
    }
  };

  const updateProduct = async (productId: string, productData: any) => {
    if (!user) return;
    
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(productData)
      });
      
      if (response.ok) {
        await fetchProducts(); // Refresh products list
        setEditingProduct(null);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to update product:', error);
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
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        await fetchProducts(); // Refresh products list
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to delete product:', error);
      return false;
    }
  };

  // Show loading state while user is being determined
  if (!user) {
    return (
      <div className="noise-overlay min-h-screen flex items-center justify-center bg-void">
        <div className="text-white text-xl">Loading admin panel...</div>
      </div>
    );
  }

  if (!user || user.email !== ADMIN_EMAIL) {
    return null;
  }

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
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-6 py-3 font-condensed font-semibold text-sm tracking-[0.2em] uppercase transition-colors duration-200 ${
                activeTab === 'orders' 
                  ? 'text-tb-white border-b-2 border-tb-white' 
                  : 'text-sv-mid hover:text-tb-white border-b-transparent'
              }`}
            >
              <Users className="w-5 h-5 mr-2" />
              Orders
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`px-6 py-3 font-condensed font-semibold text-sm tracking-[0.2em] uppercase transition-colors duration-200 ${
                activeTab === 'products' 
                  ? 'text-tb-white border-b-2 border-tb-white' 
                  : 'text-sv-mid hover:text-tb-white border-b-transparent'
              }`}
            >
              <Package className="w-5 h-5 mr-2" />
              Products
            </button>
          </div>

          {/* Content */}
          <div className="min-h-[600px]">
            {loading && (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-t-tb-white"></div>
              </div>
            )}

            {activeTab === 'orders' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <h2 className="font-display text-2xl tracking-[0.1em] text-tb-white uppercase mb-6">
                  Orders Management
                </h2>
                
                <div className="overflow-x-auto">
                  <table className="w-full bg-surface border border-white/10 rounded-lg">
                    <thead>
                      <tr className="text-left">
                        <th className="px-6 py-3 text-left font-condensed text-xs text-sv-mid uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left font-condensed text-xs text-sv-mid uppercase tracking-wider">
                          Products
                        </th>
                        <th className="px-6 py-3 text-left font-condensed text-xs text-sv-mid uppercase tracking-wider">
                          Total
                        </th>
                        <th className="px-6 py-3 text-left font-condensed text-xs text-sv-mid uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left font-condensed text-xs text-sv-mid uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left font-condensed text-xs text-sv-mid uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr key={order._id} className="border-b border-white/10">
                          <td className="px-6 py-4">
                            <div className="text-sm text-sv-mid">
                              {order.userId}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-1">
                              {order.products.map((product, index) => (
                                <div key={index} className="text-sm text-tb-white">
                                  {product.name} ({product.quantity}x)
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            ¥{order.totalAmount?.toFixed(2)}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-condensed uppercase tracking-wider ${
                              order.status === 'pending' ? 'bg-yellow-500 text-white' :
                              order.status === 'confirmed' ? 'bg-blue-500 text-white' :
                              order.status === 'shipped' ? 'bg-purple-500 text-white' :
                              'bg-green-500 text-white'
                            }`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <select
                              value={order.status}
                              onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                              className="px-3 py-1 bg-white/10 border border-white/20 rounded text-tb-white text-sm"
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
              </motion.div>
            )}

            {activeTab === 'products' && (
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
                    Add New Product
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {products.map((product) => (
                    <div key={product._id} className="bg-surface border border-white/10 rounded-lg p-4">
                      <div className="aspect-[4/5] bg-[#0c0c0] rounded-lg overflow-hidden mb-4">
                        <img
                          src={product.image || '/placeholder.png'}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder.png';
                          }}
                        />
                      </div>
                      <h3 className="font-condensed font-semibold text-tb-white text-sm mb-2">
                        {product.name}
                      </h3>
                      <p className="text-sv-mid text-xs mb-2">{product.category}</p>
                      <p className="font-condensed text-tb-white mb-2">¥{product.price}</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingProduct(product)}
                          className="flex-1 px-3 py-1 bg-white/10 border border-white/20 rounded text-tb-white text-xs hover:bg-white/20 transition-all duration-200"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteProduct(product._id)}
                          className="flex-1 px-3 py-1 bg-red-500/20 border border-red-500/50 rounded text-red-400 text-xs hover:bg-red-500/30 transition-all duration-200"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </main>
      
      <Footer />
    </div>
  );
}
