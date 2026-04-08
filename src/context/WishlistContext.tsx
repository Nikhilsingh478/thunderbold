import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { WishlistItem, CartItem, getWishlist, setWishlist, clearWishlist, mergeWishlistItems } from '../lib/storage';
import { toast } from 'sonner';

// Wishlist State Interface
interface WishlistState {
  items: WishlistItem[];
  loading: boolean;
  error: string | null;
}

// Wishlist Actions
type WishlistAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_WISHLIST'; payload: WishlistItem[] }
  | { type: 'ADD_ITEM'; payload: WishlistItem }
  | { type: 'REMOVE_ITEM'; payload: string } // productId
  | { type: 'CLEAR_WISHLIST' };

// Initial State
const initialState: WishlistState = {
  items: [],
  loading: false,
  error: null,
};

// Wishlist Reducer
const wishlistReducer = (state: WishlistState, action: WishlistAction): WishlistState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'SET_WISHLIST':
      return { ...state, items: action.payload, loading: false, error: null };
    case 'ADD_ITEM':
      const exists = state.items.some(item => item.productId === action.payload.productId);
      if (exists) return state;
      return { ...state, items: [...state.items, action.payload] };
    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter(item => item.productId !== action.payload) };
    case 'CLEAR_WISHLIST':
      return { ...state, items: [] };
    default:
      return state;
  }
};

// Wishlist Context Interface
interface WishlistContextType extends WishlistState {
  addToWishlist: (item: WishlistItem) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  toggleWishlist: (item: WishlistItem) => Promise<void>;
  clearWishlistData: () => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  getWishlistCount: () => number;
  moveToCart: (productId: string) => void; // Move item from wishlist to cart
}

// Create Context
const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

// Wishlist Provider Component
export const WishlistProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(wishlistReducer, initialState);
  const { user } = useAuth();

  // Load wishlist on mount and auth changes
  useEffect(() => {
    loadWishlist();
  }, [user]);

  // Sync local to DB on login
  useEffect(() => {
    if (user) {
      syncLocalToDB();
    }
  }, [user]);

  const loadWishlist = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      if (user) {
        // Load from DB with auth headers
        const token = await user.getIdToken();
        const response = await fetch('/api/wishlist', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('Load wishlist response:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Loaded wishlist from DB:', data.items);
          dispatch({ type: 'SET_WISHLIST', payload: data.items || [] });
        } else {
          const errorData = await response.text();
          console.error('Load wishlist error:', errorData);
          throw new Error('Failed to load wishlist from database');
        }
      } else {
        // Load from localStorage
        const localWishlist = getWishlist();
        console.log('Loading wishlist from localStorage:', localWishlist);
        dispatch({ type: 'SET_WISHLIST', payload: localWishlist });
      }
    } catch (error) {
      console.error('Error loading wishlist:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load wishlist' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const syncLocalToDB = async () => {
    if (!user) return;

    try {
      // Get local wishlist
      const localWishlist = getWishlist();
      console.log('Syncing local wishlist to DB:', localWishlist);
      if (localWishlist.length === 0) return;

      // Get auth token
      const token = await user.getIdToken();
      
      // Get DB wishlist with auth headers
      const response = await fetch('/api/wishlist', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const dbWishlist = response.ok ? (await response.json()).items || [] : [];

      // Merge wishlists
      const mergedWishlist = mergeWishlistItems(localWishlist, dbWishlist);
      console.log('Merged wishlist:', mergedWishlist);

      // Save merged wishlist to DB
      const saveResponse = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ items: mergedWishlist }),
      });

      if (saveResponse.ok) {
        console.log('Successfully saved merged wishlist to DB');
        // Clear local storage only after successful save
        clearWishlist();
        // Reload wishlist from DB to get latest state
        loadWishlist();
      } else {
        console.error('Failed to save merged wishlist to DB');
        throw new Error('Failed to save merged wishlist to database');
      }
    } catch (error) {
      console.error('Error syncing wishlist to DB:', error);
    }
  };

  const saveWishlist = async (items: WishlistItem[]) => {
    try {
      if (user) {
        // Get auth token
        const token = await user.getIdToken();
        
        // Save to DB
        const response = await fetch('/api/wishlist', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ items }),
        });
        
        if (!response.ok) {
          const errorData = await response.text();
          console.error('Wishlist API error:', errorData);
          throw new Error('Failed to save wishlist to database');
        }
      } else {
        // Save to localStorage
        console.log('Saving wishlist to localStorage for logged-out user');
        setWishlist(items);
        console.log('Wishlist saved to localStorage');
      }
    } catch (error) {
      console.error('Error saving wishlist:', error);
      // Don't throw error for localStorage issues, just log them
      if (user) {
        throw error; // Only throw for logged-in users (API errors)
      }
    }
  };

  const addToWishlist = async (item: WishlistItem) => {
    try {
      console.log('=== ADD TO WISHLIST START ===');
      console.log('Item:', item);
      console.log('Current state items:', state.items);
      
      dispatch({ type: 'ADD_ITEM', payload: item });
      console.log('Dispatched ADD_ITEM action');
      
      // Save to storage
      await saveWishlist(state.items);
      console.log('=== ADD TO WISHLIST SUCCESS ===');
      
      toast.success(`${item.name} added to wishlist`);
    } catch (error) {
      console.error('=== ADD TO WISHLIST ERROR ===', error);
      toast.error('Failed to add item to wishlist');
      dispatch({ type: 'SET_ERROR', payload: 'Failed to add item to wishlist' });
    }
  };

  const removeFromWishlist = async (productId: string) => {
    try {
      console.log('=== REMOVE FROM WISHLIST START ===');
      console.log('Product ID:', productId);
      console.log('Current state items:', state.items);
      
      dispatch({ type: 'REMOVE_ITEM', payload: productId });
      console.log('Dispatched REMOVE_ITEM action');
      
      // Save to storage
      await saveWishlist(state.items);
      console.log('=== REMOVE FROM WISHLIST SUCCESS ===');
      
      toast.success('Item removed from wishlist');
    } catch (error) {
      console.error('=== REMOVE FROM WISHLIST ERROR ===', error);
      toast.error('Failed to remove item from wishlist');
      dispatch({ type: 'SET_ERROR', payload: 'Failed to remove item from wishlist' });
    }
  };

  const toggleWishlist = async (item: WishlistItem) => {
    if (isInWishlist(item.productId)) {
      await removeFromWishlist(item.productId);
    } else {
      await addToWishlist(item);
    }
  };

  const clearWishlistData = async () => {
    try {
      dispatch({ type: 'CLEAR_WISHLIST' });
      
      if (user) {
        await fetch('/api/wishlist', { method: 'DELETE' });
      } else {
        clearWishlist();
      }
      
      toast.success('Wishlist cleared');
    } catch (error) {
      console.error('Error clearing wishlist:', error);
      toast.error('Failed to clear wishlist');
      dispatch({ type: 'SET_ERROR', payload: 'Failed to clear wishlist' });
    }
  };

  const isInWishlist = (productId: string) => {
    return state.items.some(item => item.productId === productId);
  };

  const getWishlistCount = () => {
    return state.items.length;
  };

  const moveToCart = (productId: string) => {
    const item = state.items.find(item => item.productId === productId);
    if (!item) return;

    // Create a custom event to notify cart to add this item
    // This avoids circular dependency between contexts
    const event = new CustomEvent('add-to-cart-from-wishlist', {
      detail: {
        productId: item.productId,
        name: item.name,
        price: item.price,
        image: item.image,
        size: 'M', // Default size - should be improved
        quantity: 1
      }
    });
    window.dispatchEvent(event);

    // Remove from wishlist
    removeFromWishlist(productId);
  };

  const value: WishlistContextType = {
    ...state,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    clearWishlistData,
    isInWishlist,
    getWishlistCount,
    moveToCart,
  };

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
};

// Hook to use wishlist context
export const useWishlist = (): WishlistContextType => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
