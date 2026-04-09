import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import jwt from 'jsonwebtoken';

let adminAuth = null;
let initError = null;

function init() {
  if (adminAuth) return;
  if (initError) return;

  try {
    const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT;

    if (!serviceAccountEnv) {
      initError = 'FIREBASE_SERVICE_ACCOUNT not configured — falling back to jwt.decode (less secure)';
      console.warn('[firebaseAdmin]', initError);
      return;
    }

    const serviceAccount = JSON.parse(serviceAccountEnv);

    if (!getApps().length) {
      initializeApp({ credential: cert(serviceAccount) });
    }

    adminAuth = getAuth();
  } catch (err) {
    initError = `Firebase Admin init failed: ${err.message}`;
    console.error('[firebaseAdmin]', initError);
  }
}

/**
 * Verifies a Firebase ID token.
 * Returns { email, uid, ...claims } if valid.
 * Throws an Error with status 401 if invalid.
 *
 * Falls back to jwt.decode if Firebase Admin is not configured.
 * In fallback mode the token is NOT cryptographically verified — this is
 * acceptable during local development but a service account MUST be
 * configured in production.
 */
export async function verifyFirebaseToken(token) {
  init();

  if (adminAuth) {
    try {
      const decoded = await adminAuth.verifyIdToken(token, true);
      return { email: decoded.email, uid: decoded.uid, ...decoded };
    } catch (err) {
      const error = new Error('Invalid or expired token');
      error.status = 401;
      throw error;
    }
  }

  // Fallback — jwt.decode only (no cryptographic verification)
  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.email) {
      const error = new Error('Unauthorized');
      error.status = 401;
      throw error;
    }
    return decoded;
  } catch (err) {
    if (err.status === 401) throw err;
    const error = new Error('Unauthorized');
    error.status = 401;
    throw error;
  }
}
