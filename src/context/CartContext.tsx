import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { CartItem, getCart, setCart, clearCart, mergeCartItems } from '../lib/storage';
import { toast } from 'sonner';

// Cart State Interface
interface CartState {
  items: CartItem[];
  loading: boolean;
  error: string | null;
}

// Cart Actions
type CartAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_CART'; payload: CartItem[] }
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM'; payload: string } // productId-size key
  | { type: 'UPDATE_QUANTITY'; payload: { key: string; quantity: number } }
  | { type: 'CLEAR_CART' };

// Initial State
const initialState: CartState = {
  items: [],
  loading: false,
  error: null,
};

// Cart Reducer
const cartReducer = (state: CartState, action: CartAction): CartState => {
  console.log('Cart reducer action:', action.type);
  if ('payload' in action) {
    console.log('Action payload:', action.payload);
  }
  
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'SET_CART':
      console.log('Setting cart items:', action.payload);
      return { ...state, items: action.payload, loading: false, error: null };
    case 'ADD_ITEM':
      console.log('Adding item to cart:', action.payload);
      // Check for existing item and update quantity or add new
      const existingItemIndex = state.items.findIndex(
        item => item.productId === action.payload.productId && item.size === action.payload.size
      );
      
      let updatedItems;
      if (existingItemIndex >= 0) {
        // Update existing item quantity
        updatedItems = state.items.map(item =>
          `${item.productId}-${item.size}` === `${action.payload.productId}-${action.payload.size}`
            ? { ...item, quantity: item.quantity + action.payload.quantity }
            : item
        );
        console.log('Updated existing item quantity:', updatedItems[existingItemIndex].quantity);
      } else {
        // Add new item
        updatedItems = [...state.items, action.payload];
        console.log('Added new item:', action.payload);
      }
      
      return { ...state, items: updatedItems, loading: false, error: null };
    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter(item => `${item.productId}-${item.size}` !== action.payload) };
    case 'UPDATE_QUANTITY':
      return {
        ...state,
        items: state.items.map(item =>
          `${item.productId}-${item.size}` === action.payload.key
            ? { ...item, quantity: action.payload.quantity }
            : item
        ).filter(item => item.quantity > 0)
      };
    case 'CLEAR_CART':
      console.log('Clearing cart');
      return { ...state, items: [] };
    default:
      return state;
  }
};

// Cart Context Interface
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

// Create Context
const CartContext = createContext<CartContextType | undefined>(undefined);

// Cart Provider Component
export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const { user } = useAuth();

  // Load cart on mount and auth changes
  useEffect(() => {
    loadCart();
  }, [user]);

  // Listen for wishlist to cart events
  useEffect(() => {
    const handleWishlistToCart = (event: CustomEvent) => {
      const item = event.detail;
      addToCart(item, item.quantity);
    };

    window.addEventListener('add-to-cart-from-wishlist', handleWishlistToCart as EventListener);
    
    return () => {
      window.removeEventListener('add-to-cart-from-wishlist', handleWishlistToCart as EventListener);
    };
  }, []);

  const loadCart = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      // ONLY load from localStorage - single source of truth
      const localCart = JSON.parse(localStorage.getItem("cart") || "[]");
      console.log('Loading cart from localStorage ONLY:', localCart);
      dispatch({ type: 'SET_CART', payload: localCart });
      
      // Optional DB sync - NO UI IMPACT
      if (user && localCart.length > 0) {
        fetch('/api/cart', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await user.getIdToken()}`
          },
          body: JSON.stringify({ items: localCart }),
        }).catch(() => {
          // Silently fail - localStorage is source of truth
        });
      }
    } catch (error) {
      console.error('Error loading cart:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load cart' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const saveCart = async (items: CartItem[]) => {
    try {
      console.log('Saving cart items:', items);
      
      // ONLY update localStorage - single source of truth
      localStorage.setItem("cart", JSON.stringify(items));
      console.log('Cart saved to localStorage ONLY');
      
      // Optional DB sync - NO UI IMPACT
      if (user) {
        fetch('/api/cart', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await user.getIdToken()}`
          },
          body: JSON.stringify({ items }),
        }).catch(() => {
          // Silently fail
        });
      }
    } catch (error) {
      console.error('Error saving cart:', error);
    }
  };

  const addToCart = async (item: Omit<CartItem, 'quantity'>, quantity: number = 1) => {
    try {
      console.log('=== ADD TO CART START ===');
      console.log('Item:', item);
      console.log('Quantity:', quantity);
      console.log('Current state items:', state.items);
      
      // Create cart item with proper validation
      const cartItem: CartItem = { 
        ...item, 
        quantity: Math.max(1, quantity) // Ensure minimum quantity of 1
      };
      
      // Get current items and check for existing item
      const currentItems = [...state.items];
      const existingItemIndex = currentItems.findIndex(
        existing => existing.productId === cartItem.productId && existing.size === cartItem.size
      );
      
      let updatedItems;
      if (existingItemIndex >= 0) {
        // Update existing item quantity
        const updatedQuantity = currentItems[existingItemIndex].quantity + cartItem.quantity;
        currentItems[existingItemIndex] = {
          ...currentItems[existingItemIndex],
          quantity: updatedQuantity
        };
        updatedItems = currentItems;
        console.log('Updated existing item quantity:', updatedQuantity);
      } else {
        // Add new item
        currentItems.push(cartItem);
        updatedItems = currentItems;
        console.log('Added new item:', cartItem);
      }
      
      // SINGLE dispatch and localStorage update
      localStorage.setItem("cart", JSON.stringify(updatedItems));
      dispatch({ type: 'SET_CART', payload: updatedItems });
      console.log('Cart saved to localStorage and state updated');
      
      // Optional DB sync - NO UI IMPACT
      if (user) {
        fetch('/api/cart', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await user.getIdToken()}`
          },
          body: JSON.stringify({ items: updatedItems }),
        }).catch(() => {
          // Silently fail
        });
      }
      
      console.log('=== ADD TO CART SUCCESS ===');
      toast.success(`${cartItem.name} added to cart`);
    } catch (error) {
      console.error('=== ADD TO CART ERROR ===', error);
      toast.error('Failed to add item to cart');
      dispatch({ type: 'SET_ERROR', payload: 'Failed to add item to cart' });
    }
  };

  const removeFromCart = async (productId: string, size: string) => {
    try {
      const key = `${productId}-${size}`;
      const updatedItems = state.items.filter(item => `${item.productId}-${item.size}` !== key);
      
      // SINGLE localStorage update and dispatch
      localStorage.setItem("cart", JSON.stringify(updatedItems));
      dispatch({ type: 'SET_CART', payload: updatedItems });
      console.log('Item removed from cart and localStorage updated');
      
      // Optional DB sync - NO UI IMPACT
      if (user) {
        fetch('/api/cart', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await user.getIdToken()}`
          },
          body: JSON.stringify({ items: updatedItems }),
        }).catch(() => {
          // Silently fail
        });
      }
      
      toast.success('Item removed from cart');
    } catch (error) {
      console.error('Error removing from cart:', error);
      toast.error('Failed to remove item from cart');
      dispatch({ type: 'SET_ERROR', payload: 'Failed to remove item from cart' });
    }
  };

  const updateQuantity = async (productId: string, size: string, quantity: number) => {
    if (quantity < 1) return;
    
    try {
      const key = `${productId}-${size}`;
      const updatedItems = state.items.map(item =>
        `${item.productId}-${item.size}` === key
          ? { ...item, quantity }
          : item
      ).filter(item => item.quantity > 0);
      
      // SINGLE localStorage update and dispatch
      localStorage.setItem("cart", JSON.stringify(updatedItems));
      dispatch({ type: 'SET_CART', payload: updatedItems });
      console.log('Quantity updated and localStorage updated');
      
      // Optional DB sync - NO UI IMPACT
      if (user) {
        fetch('/api/cart', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await user.getIdToken()}`
          },
          body: JSON.stringify({ items: updatedItems }),
        }).catch(() => {
          // Silently fail
        });
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast.error('Failed to update quantity');
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update quantity' });
    }
  };

  const clearCartData = async () => {
    try {
      const updatedItems = [];
      
      // SINGLE localStorage update and dispatch
      localStorage.setItem("cart", JSON.stringify(updatedItems));
      dispatch({ type: 'SET_CART', payload: updatedItems });
      console.log('Cart cleared and localStorage updated');
      
      // Optional DB sync - NO UI IMPACT
      if (user) {
        fetch('/api/cart', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await user.getIdToken()}`
          },
          body: JSON.stringify({ items: updatedItems }),
        }).catch(() => {
          // Silently fail
        });
      }
      
      toast.success('Cart cleared');
    } catch (error) {
      console.error('Error clearing cart:', error);
      toast.error('Failed to clear cart');
      dispatch({ type: 'SET_ERROR', payload: 'Failed to clear cart' });
    }
  };

  const getTotalItems = () => {
    return state.items.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return state.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const isInCart = (productId: string, size: string) => {
    return state.items.some(item => item.productId === productId && item.size === size);
  };

  const getItemQuantity = (productId: string, size: string) => {
    const item = state.items.find(item => item.productId === productId && item.size === size);
    return item ? item.quantity : 0;
  };

  const value: CartContextType = {
    ...state,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCartData,
    getTotalItems,
    getTotalPrice,
    isInCart,
    getItemQuantity,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

// Hook to use cart context
export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
