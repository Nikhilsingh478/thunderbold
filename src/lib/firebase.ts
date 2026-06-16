import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth';
import type { Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCKmRGX8FOVsk0khJTM1s25Pcxe_TezYgQ",
  authDomain: "thunderbolt-auth.firebaseapp.com",
  projectId: "thunderbolt-auth",
  storageBucket: "thunderbolt-auth.firebasestorage.app",
  messagingSenderId: "491240288125",
  appId: "1:491240288125:web:a5406e022ac5a2f2442614"
};

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
