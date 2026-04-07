import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  setPersistence, 
  browserLocalPersistence 
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCKmRGX8FOVsk0khJTM1s25Pcxe_TezYgQ",
  authDomain: "thunderbolt-auth.firebaseapp.com",
  projectId: "thunderbolt-auth",
  storageBucket: "thunderbolt-auth.firebasestorage.app",
  messagingSenderId: "491240288125",
  appId: "1:491240288125:web:a5406e022ac5a2f2442614"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

// Set persistence properly
setPersistence(auth, browserLocalPersistence);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export default app;