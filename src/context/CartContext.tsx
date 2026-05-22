import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { CartItem, getCart, setCart, clearCart, mergeCartItems } from '../lib/storage';
import { toast } from 'sonner';

interface CartState {
  items: CartItem[];
  loading: boolean;
  error: string | null;
}

type CartAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_CART'; payload: CartItem[] }
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { key: string; quantity: number } }
  | { type: 'CLEAR_CART' };

const initialState: CartState = { items: [], loading: false, error: null };

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'SET_CART':
      return { ...state, items: action.payload, loading: false, error: null };
    case 'ADD_ITEM': {
      const existingIndex = state.items.findIndex(
        item => item.productId === action.payload.productId && item.size === action.payload.size
      );
      const updatedItems = existingIndex >= 0
        ? state.items.map(item =>
            `${item.productId}-${item.size}` === `${action.payload.productId}-${action.payload.size}`
              ? { ...item, quantity: item.quantity + action.payload.quantity }
              : item
          )
        : [...state.items, action.payload];
      return { ...state, items: updatedItems, loading: false, error: null };
    }
    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter(item => `${item.productId}-${item.size}` !== action.payload) };
    case 'UPDATE_QUANTITY':
      return {
        ...state,
        items: state.items
          .map(item => `${item.productId}-${item.size}` === action.payload.key ? { ...item, quantity: action.payload.quantity } : item)
          .filter(item => item.quantity > 0),
      };
    case 'CLEAR_CART':
      return { ...state, items: [] };
    default:
      return state;
  }
};

interface CartContextType extends CartState {
  addToCart: (item: Omit<CartItem, 'quantity'>, quantity?: number) => Promise<void>;
  removeFromCart: (productId: string, size: string) => Promise<void>;
  updateQuantity: (productId: string, size: string, quantity: number) => Promise<void>;
  clearCartData: () => Promise<void>;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  isInCart: (productId: string, size: string) => boolean;
  getItemQuantity: (productId: string, size: string) => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const { user } = useAuth();

  useEffect(() => { loadCart(); }, [user]);

  useEffect(() => {
    const handleWishlistToCart = (event: CustomEvent) => {
      const item = event.detail;
      addToCart(item, item.quantity);
    };
    window.addEventListener('add-to-cart-from-wishlist', handleWishlistToCart as EventListener);
    return () => window.removeEventListener('add-to-cart-from-wishlist', handleWishlistToCart as EventListener);
  }, []);

  const syncToDb = async (items: CartItem[]) => {
    if (!user) return;
    try {
      fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${await user.getIdToken()}` },
        body: JSON.stringify({ items }),
      }).catch(() => {});
    } catch {}
  };

  const loadCart = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const localCart = JSON.parse(localStorage.getItem('cart') || '[]');
      dispatch({ type: 'SET_CART', payload: localCart });
      if (user && localCart.length > 0) syncToDb(localCart);
    } catch {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load cart' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const addToCart = async (item: Omit<CartItem, 'quantity'>, quantity = 1) => {
    try {
      const cartItem: CartItem = { ...item, quantity: Math.max(1, quantity) };
      const currentItems = [...state.items];
      const existingIndex = currentItems.findIndex(
        e => e.productId === cartItem.productId && e.size === cartItem.size
      );
      let updatedItems: CartItem[];
      if (existingIndex >= 0) {
        currentItems[existingIndex] = { ...currentItems[existingIndex], quantity: currentItems[existingIndex].quantity + cartItem.quantity };
        updatedItems = currentItems;
      } else {
        updatedItems = [...currentItems, cartItem];
      }
      localStorage.setItem('cart', JSON.stringify(updatedItems));
      dispatch({ type: 'SET_CART', payload: updatedItems });
      syncToDb(updatedItems);
      toast.success(`${cartItem.name} added to cart`);
    } catch {
      toast.error('Failed to add item to cart');
      dispatch({ type: 'SET_ERROR', payload: 'Failed to add item to cart' });
    }
  };

  const removeFromCart = async (productId: string, size: string) => {
    try {
      const updatedItems = state.items.filter(item => !(item.productId === productId && item.size === size));
      localStorage.setItem('cart', JSON.stringify(updatedItems));
      dispatch({ type: 'SET_CART', payload: updatedItems });
      syncToDb(updatedItems);
      toast.success('Item removed from cart');
    } catch {
      toast.error('Failed to remove item from cart');
      dispatch({ type: 'SET_ERROR', payload: 'Failed to remove item from cart' });
    }
  };

  const updateQuantity = async (productId: string, size: string, quantity: number) => {
    if (quantity < 1) return;
    try {
      const updatedItems = state.items
        .map(item => item.productId === productId && item.size === size ? { ...item, quantity } : item)
        .filter(item => item.quantity > 0);
      localStorage.setItem('cart', JSON.stringify(updatedItems));
      dispatch({ type: 'SET_CART', payload: updatedItems });
      syncToDb(updatedItems);
    } catch {
      toast.error('Failed to update quantity');
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update quantity' });
    }
  };

  const clearCartData = async () => {
    try {
      localStorage.setItem('cart', '[]');
      dispatch({ type: 'SET_CART', payload: [] });
      syncToDb([]);
      toast.success('Cart cleared');
    } catch {
      toast.error('Failed to clear cart');
      dispatch({ type: 'SET_ERROR', payload: 'Failed to clear cart' });
    }
  };

  const getTotalItems = () => state.items.reduce((t, i) => t + i.quantity, 0);
  const getTotalPrice = () => state.items.reduce((t, i) => t + i.price * i.quantity, 0);
  const isInCart = (productId: string, size: string) => state.items.some(i => i.productId === productId && i.size === size);
  const getItemQuantity = (productId: string, size: string) => state.items.find(i => i.productId === productId && i.size === size)?.quantity ?? 0;

  return (
    <CartContext.Provider value={{ ...state, addToCart, removeFromCart, updateQuantity, clearCartData, getTotalItems, getTotalPrice, isInCart, getItemQuantity }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
