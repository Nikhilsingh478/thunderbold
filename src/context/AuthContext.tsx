import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { 
  User,
  signInWithPopup,
  signInWithCredential,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import { getFirebaseAuth, googleProvider } from '../lib/firebase';
import { schedulePrefetchOrders, clearOrdersCache } from '../lib/ordersCache';
import { apiUrl } from '../lib/apiBase';
import { toast } from 'sonner';

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

  const GOOGLE_WEB_CLIENT_ID = '491240288125-clhf9bs0fuu53lg0c48vhdc46bi2gvv1.apps.googleusercontent.com';

  const loginWithGoogle = async (): Promise<User> => {
    const auth = getFirebaseAuth();
    
    // ── Native Android / iOS Platform ───────────────────────────────────────
    if (Capacitor.isNativePlatform()) {
      try {
        console.log('[Auth] Attempting Native Google Sign-In...');
        const result = await FirebaseAuthentication.signInWithGoogle({
          clientId: GOOGLE_WEB_CLIENT_ID,
        } as any);

        const idToken = result.credential?.idToken || (result as any).idToken;

        if (idToken) {
          const credential = GoogleAuthProvider.credential(idToken);
          const userCredential = await signInWithCredential(auth, credential);
          const user = userCredential.user;

          await syncUserWithDatabase(user);
          return user;
        }
      } catch (error: any) {
        console.warn('[Auth] Native Google Sign-In failed or unsupported, falling back to popup:', error);
        // Fall through to Popup fallback below
      }
    }

    // ── Web Browser / Fallback Platform ─────────────────────────────────────
    try {
      console.log('[Auth] Attempting signInWithPopup...');
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      await syncUserWithDatabase(user);
      return user;
    } catch (error: any) {
      console.error('[Auth] Google sign-in error:', error);
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
      if (Capacitor.isNativePlatform()) {
        await FirebaseAuthentication.signOut().catch(() => {});
      }
      await firebaseSignOut(getFirebaseAuth());
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  // Sync user with database
  const syncUserWithDatabase = async (user: User): Promise<void> => {
    try {
      const response = await fetch(apiUrl('/api/users'), {
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
