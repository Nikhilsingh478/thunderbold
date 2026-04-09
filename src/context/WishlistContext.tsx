import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { WishlistItem, CartItem, getWishlist, setWishlist, clearWishlist, mergeWishlistItems } from '../lib/storage';
import { toast } from 'sonner';

interface WishlistState {
  items: WishlistItem[];
  loading: boolean;
  error: string | null;
}

type WishlistAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_WISHLIST'; payload: WishlistItem[] }
  | { type: 'ADD_ITEM'; payload: WishlistItem }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'CLEAR_WISHLIST' };

const initialState: WishlistState = { items: [], loading: false, error: null };

const wishlistReducer = (state: WishlistState, action: WishlistAction): WishlistState => {
  switch (action.type) {
    case 'SET_LOADING':   return { ...state, loading: action.payload };
    case 'SET_ERROR':     return { ...state, error: action.payload, loading: false };
    case 'SET_WISHLIST':  return { ...state, items: action.payload, loading: false, error: null };
    case 'ADD_ITEM':
      if (state.items.some(i => i.productId === action.payload.productId)) return state;
      return { ...state, items: [...state.items, action.payload] };
    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter(i => i.productId !== action.payload) };
    case 'CLEAR_WISHLIST':
      return { ...state, items: [] };
    default:
      return state;
  }
};

interface WishlistContextType extends WishlistState {
  addToWishlist: (item: WishlistItem) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  toggleWishlist: (item: WishlistItem) => Promise<void>;
  clearWishlistData: () => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  getWishlistCount: () => number;
  moveToCart: (productId: string) => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(wishlistReducer, initialState);
  const { user } = useAuth();

  useEffect(() => { loadWishlist(); }, [user]);
  useEffect(() => { if (user) syncLocalToDB(); }, [user]);

  const loadWishlist = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      if (user) {
        const token = await user.getIdToken();
        const response = await fetch('/api/wishlist', { headers: { 'Authorization': `Bearer ${token}` } });
        if (response.ok) {
          const data = await response.json();
          dispatch({ type: 'SET_WISHLIST', payload: data.items || [] });
        } else {
          throw new Error('Failed to load wishlist');
        }
      } else {
        dispatch({ type: 'SET_WISHLIST', payload: getWishlist() });
      }
    } catch {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load wishlist' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const syncLocalToDB = async () => {
    if (!user) return;
    try {
      const localWishlist = getWishlist();
      if (localWishlist.length === 0) return;
      const token = await user.getIdToken();
      const response = await fetch('/api/wishlist', { headers: { 'Authorization': `Bearer ${token}` } });
      const dbWishlist = response.ok ? (await response.json()).items || [] : [];
      const mergedWishlist = mergeWishlistItems(localWishlist, dbWishlist);
      const saveResponse = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ items: mergedWishlist }),
      });
      if (saveResponse.ok) {
        clearWishlist();
        loadWishlist();
      }
    } catch {}
  };

  const saveWishlist = async (items: WishlistItem[]) => {
    if (user) {
      const token = await user.getIdToken();
      const response = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ items }),
      });
      if (!response.ok) throw new Error('Failed to save wishlist');
    } else {
      setWishlist(items);
    }
  };

  const addToWishlist = async (item: WishlistItem) => {
    try {
      if (state.items.some(i => i.productId === item.productId)) return;
      const newItems = [...state.items, item];
      dispatch({ type: 'ADD_ITEM', payload: item });
      await saveWishlist(newItems);
      toast.success(`${item.name} added to wishlist`);
    } catch {
      toast.error('Failed to add item to wishlist');
      dispatch({ type: 'SET_ERROR', payload: 'Failed to add item to wishlist' });
    }
  };

  const removeFromWishlist = async (productId: string) => {
    try {
      const newItems = state.items.filter(i => i.productId !== productId);
      dispatch({ type: 'REMOVE_ITEM', payload: productId });
      await saveWishlist(newItems);
      toast.success('Item removed from wishlist');
    } catch {
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
    } catch {
      toast.error('Failed to clear wishlist');
      dispatch({ type: 'SET_ERROR', payload: 'Failed to clear wishlist' });
    }
  };

  const isInWishlist = (productId: string) => state.items.some(i => i.productId === productId);
  const getWishlistCount = () => state.items.length;

  const moveToCart = (productId: string) => {
    const item = state.items.find(i => i.productId === productId);
    if (!item) return;
    window.dispatchEvent(new CustomEvent('add-to-cart-from-wishlist', {
      detail: { productId: item.productId, name: item.name, price: item.price, image: item.image, size: 'M', quantity: 1 }
    }));
    removeFromWishlist(productId);
  };

  return (
    <WishlistContext.Provider value={{ ...state, addToWishlist, removeFromWishlist, toggleWishlist, clearWishlistData, isInWishlist, getWishlistCount, moveToCart }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = (): WishlistContextType => {
  const context = useContext(WishlistContext);
  if (!context) throw new Error('useWishlist must be used within a WishlistProvider');
  return context;
};
