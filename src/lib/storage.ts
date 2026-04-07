// Local Storage Utilities for Cart and Wishlist
// Handles hybrid storage: localStorage for logged-out users, DB sync for logged-in users

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  image: string;
  size: string;
  quantity: number;
}

export interface WishlistItem {
  productId: string;
  name: string;
  image: string;
  price: number;
}

export interface StorageData {
  cart: CartItem[];
  wishlist: WishlistItem[];
}

// CART STORAGE FUNCTIONS
export const getCart = (): CartItem[] => {
  try {
    const cartData = localStorage.getItem('thunderbolt_cart');
    return cartData ? JSON.parse(cartData) : [];
  } catch (error) {
    console.error('Error reading cart from localStorage:', error);
    return [];
  }
};

export const setCart = (cart: CartItem[]): void => {
  try {
    localStorage.setItem('thunderbolt_cart', JSON.stringify(cart));
  } catch (error) {
    console.error('Error saving cart to localStorage:', error);
  }
};

export const clearCart = (): void => {
  try {
    localStorage.removeItem('thunderbolt_cart');
  } catch (error) {
    console.error('Error clearing cart from localStorage:', error);
  }
};

// WISHLIST STORAGE FUNCTIONS
export const getWishlist = (): WishlistItem[] => {
  try {
    const wishlistData = localStorage.getItem('thunderbolt_wishlist');
    return wishlistData ? JSON.parse(wishlistData) : [];
  } catch (error) {
    console.error('Error reading wishlist from localStorage:', error);
    return [];
  }
};

export const setWishlist = (wishlist: WishlistItem[]): void => {
  try {
    localStorage.setItem('thunderbolt_wishlist', JSON.stringify(wishlist));
  } catch (error) {
    console.error('Error saving wishlist to localStorage:', error);
  }
};

export const clearWishlist = (): void => {
  try {
    localStorage.removeItem('thunderbolt_wishlist');
  } catch (error) {
    console.error('Error clearing wishlist from localStorage:', error);
  }
};

// CLEAR ALL STORAGE
export const clearStorage = (): void => {
  clearCart();
  clearWishlist();
};

// SYNC HELPERS
export const hasLocalCart = (): boolean => {
  return getCart().length > 0;
};

export const hasLocalWishlist = (): boolean => {
  return getWishlist().length > 0;
};

// MERGE HELPERS FOR SYNC
export const mergeCartItems = (localCart: CartItem[], dbCart: CartItem[]): CartItem[] => {
  const merged: CartItem[] = [];
  const seen = new Set<string>();

  // Add DB cart items first
  dbCart.forEach(item => {
    const key = `${item.productId}-${item.size}`;
    merged.push(item);
    seen.add(key);
  });

  // Merge local cart items
  localCart.forEach(localItem => {
    const key = `${localItem.productId}-${localItem.size}`;
    
    if (seen.has(key)) {
      // Merge quantities for same product + size
      const existingItem = merged.find(item => `${item.productId}-${item.size}` === key);
      if (existingItem) {
        existingItem.quantity += localItem.quantity;
      }
    } else {
      // Add new item
      merged.push(localItem);
      seen.add(key);
    }
  });

  return merged;
};

export const mergeWishlistItems = (localWishlist: WishlistItem[], dbWishlist: WishlistItem[]): WishlistItem[] => {
  const merged: WishlistItem[] = [];
  const seen = new Set<string>();

  // Add DB wishlist items first
  dbWishlist.forEach(item => {
    merged.push(item);
    seen.add(item.productId);
  });

  // Add local wishlist items that don't exist in DB
  localWishlist.forEach(localItem => {
    if (!seen.has(localItem.productId)) {
      merged.push(localItem);
      seen.add(localItem.productId);
    }
  });

  return merged;
};
