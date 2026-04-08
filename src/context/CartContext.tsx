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

  // Sync local to DB on login
  useEffect(() => {
    if (user) {
      syncLocalToDB();
    }
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
      if (user) {
        // Load from DB with auth headers
        const token = await user.getIdToken();
        const response = await fetch('/api/cart', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('Load cart response:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          dispatch({ type: 'SET_CART', payload: data.items || [] });
        } else {
          const errorData = await response.text();
          console.error('Load cart error:', errorData);
          throw new Error('Failed to load cart from database');
        }
      } else {
        // Load from localStorage
        const localCart = getCart();
        console.log('Loading from localStorage:', localCart);
        dispatch({ type: 'SET_CART', payload: localCart });
      }
    } catch (error) {
      console.error('Error loading cart:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load cart' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const syncLocalToDB = async () => {
    if (!user) return;

    try {
      // Get local cart
      const localCart = getCart();
      console.log('Syncing local cart to DB:', localCart);
      if (localCart.length === 0) return;

      // Get auth token
      const token = await user.getIdToken();
      
      // Get DB cart with auth headers
      const response = await fetch('/api/cart', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const dbCart = response.ok ? (await response.json()).items || [] : [];

      // Merge carts
      const mergedCart = mergeCartItems(localCart, dbCart);
      console.log('Merged cart:', mergedCart);

      // Save merged cart to DB
      const saveResponse = await fetch('/api/cart', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ items: mergedCart }),
      });

      if (saveResponse.ok) {
        console.log('Successfully saved merged cart to DB');
        // Clear local storage only after successful save
        clearCart();
        // Reload cart from DB to get latest state
        loadCart();
      } else {
        console.error('Failed to save merged cart to DB');
        throw new Error('Failed to save merged cart to database');
      }
    } catch (error) {
      console.error('Error syncing cart to DB:', error);
    }
  };

  const saveCart = async (items: CartItem[]) => {
    try {
      console.log('Saving cart items:', items);
      console.log('User logged in:', !!user);
      
      // ALWAYS update localStorage first for immediate persistence
      setCart(items);
      console.log('Cart saved to localStorage');
      
      if (user) {
        // Get user token for API call
        const token = await user.getIdToken();
        
        // Save to DB
        const response = await fetch('/api/cart', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ items }),
        });
        
        console.log('Cart API response:', response.status);
        
        if (!response.ok) {
          const errorData = await response.text();
          console.error('Cart API error:', errorData);
          // Don't throw error for localStorage issues, just log them
          // localStorage already has the data, so user experience is preserved
        }
      }
    } catch (error) {
      console.error('Error saving cart:', error);
      // Don't throw error for localStorage issues, just log them
      // localStorage already has the data, so user experience is preserved
    }
  };

  const addToCart = async (item: Omit<CartItem, 'quantity'>, quantity: number = 1) => {
    try {
      console.log('=== ADD TO CART START ===');
      console.log('Item:', item);
      console.log('Quantity:', quantity);
      console.log('Current state items:', state.items);
      console.log('User logged in:', !!user);
      
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
      
      if (existingItemIndex >= 0) {
        // Update existing item quantity
        const updatedQuantity = currentItems[existingItemIndex].quantity + cartItem.quantity;
        currentItems[existingItemIndex] = {
          ...currentItems[existingItemIndex],
          quantity: updatedQuantity
        };
        console.log('Updated existing item quantity:', updatedQuantity);
        dispatch({ type: 'SET_CART', payload: currentItems });
      } else {
        // Add new item
        currentItems.push(cartItem);
        console.log('Added new item:', cartItem);
        dispatch({ type: 'SET_CART', payload: currentItems });
      }
      
      // Save to storage
      await saveCart(currentItems);
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
      dispatch({ type: 'REMOVE_ITEM', payload: key });
      
      // Save to storage
      await saveCart(state.items);
      
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
      dispatch({ type: 'UPDATE_QUANTITY', payload: { key, quantity } });
      
      // Save to storage
      await saveCart(state.items);
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast.error('Failed to update quantity');
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update quantity' });
    }
  };

  const clearCartData = async () => {
    try {
      dispatch({ type: 'CLEAR_CART' });
      
      if (user) {
        await fetch('/api/cart', { method: 'DELETE' });
      } else {
        clearCart();
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
