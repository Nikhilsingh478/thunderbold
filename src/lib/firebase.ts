import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth';
import type { Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey) {
  console.error('[Firebase] Config missing — check VITE_FIREBASE_* env vars');
}

const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

/**
 * Lazy Firebase Auth getter.
 *
 * getAuth() / setPersistence() trigger the Firebase Auth cross-origin iframe
 * (thunderbolt-auth.firebaseapp.com/auth/iframe.js, ~90 KiB) which was
 * previously blocking the critical render path.
 *
 * By calling getAuth() here on first invocation (inside a useEffect in
 * AuthContext) instead of at module evaluation time, the iframe is only
 * requested AFTER the first paint — keeping it off the critical path entirely.
 */
let _auth: Auth | null = null;

export function getFirebaseAuth(): Auth {
  if (_auth) return _auth;
  _auth = getAuth(firebaseApp);
  setPersistence(_auth, browserLocalPersistence).catch(() => {});
  return _auth;
}

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export default firebaseApp;
