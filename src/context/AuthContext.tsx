import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import { getFirebaseAuth, googleProvider } from '../lib/firebase';
import { schedulePrefetchOrders, clearOrdersCache } from '../lib/ordersCache';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginWithGoogle: () => Promise<User>;
  loginWithEmail: (email: string, password: string) => Promise<User>;
  signupWithEmail: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getFirebaseAuth();
    
    // Process redirect sign-in result first, THEN subscribe to auth state.
    // This order ensures that when the page returns from Google's redirect,
    // the user credential is stored before onAuthStateChanged fires.
    getRedirectResult(auth)
      .then(async (result) => {
        if (result?.user) {
          await syncUserWithDatabase(result.user);
        }
      })
      .catch((error) => {
        // auth/credential-already-in-use and similar errors are non-fatal — ignore them
        const code = error?.code || '';
        if (!code.includes('credential-already-in-use')) {
          console.error('Google redirect sign-in error:', error);
        }
      })
      .finally(() => {
        // Only subscribe to auth state AFTER the redirect result has been
        // processed. This prevents the brief "logged out" flash.
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
          setUser(currentUser);
          setLoading(false);
          if (currentUser) {
            schedulePrefetchOrders(currentUser);
          } else {
            clearOrdersCache();
          }
        });
        // Store unsubscribe so it can be called on cleanup
        return unsubscribe;
      });

    // Fallback unsubscribe setup in case redirect result resolves after unmount
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (currentUser) {
        schedulePrefetchOrders(currentUser);
      } else {
        clearOrdersCache();
      }
    });

    return unsubscribe;
  }, []);

  const loginWithGoogle = async (): Promise<User> => {
    const auth = getFirebaseAuth();
    
    // Strategy: Always try popup first.
    // Popup works correctly in Chrome Custom Tabs (TWA) on most devices.
    // If the popup is blocked or the browser/WebView explicitly disallows it,
    // catch that specific error and fall back to the redirect flow.
    // This avoids the redirect race condition where getRedirectResult() fires
    // before Firebase has restored its internal session state.
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      await syncUserWithDatabase(user);
      return user;
    } catch (error: any) {
      const code = error?.code || '';
      // These error codes mean the popup was blocked or explicitly disallowed by the WebView.
      // In this case only, fall back to the redirect flow.
      const shouldRedirect = 
        code === 'auth/popup-blocked' ||
        code === 'auth/popup-closed-by-user' ||
        code === 'auth/cancelled-popup-request' ||
        code === 'auth/operation-not-supported-in-this-environment';

      if (shouldRedirect) {
        console.log('[Auth] Popup blocked — falling back to redirect flow');
        await signInWithRedirect(auth, googleProvider);
        // Page is navigating away — return a non-resolving promise
        return new Promise(() => {});
      }

      console.error('Google sign-in error:', error);
      throw error;
    }
  };

  const loginWithEmail = async (email: string, password: string): Promise<User> => {
    try {
      const result = await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
      const user = result.user;
      
      // Sync user with database
      await syncUserWithDatabase(user);
      
      return user;
    } catch (error) {
      console.error('Email sign-in error:', error);
      throw error;
    }
  };

  const signupWithEmail = async (email: string, password: string): Promise<User> => {
    try {
      const result = await createUserWithEmailAndPassword(getFirebaseAuth(), email, password);
      const user = result.user;
      
      // Sync user with database
      await syncUserWithDatabase(user);
      
      return user;
    } catch (error) {
      console.error('Email sign-up error:', error);
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await firebaseSignOut(getFirebaseAuth());
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  // Sync user with database
  const syncUserWithDatabase = async (user: User): Promise<void> => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid: user.uid,
          email: user.email,
          name: user.displayName || user.email?.split('@')[0] || 'User',
        }),
      });

      if (!response.ok) {
        console.error('Failed to sync user with database');
      }
    } catch (error) {
      console.error('Error syncing user with database:', error);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    loginWithGoogle,
    loginWithEmail,
    signupWithEmail,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
