import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getMessaging } from 'firebase-admin/messaging';

let adminAuth = null;
let adminMessaging = null;
let initError = null;

function init() {
  if (adminAuth) return;
  if (initError) return;

  const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (!serviceAccountEnv) {
    initError = 'FIREBASE_SERVICE_ACCOUNT is not configured. Admin auth is disabled.';
    console.error('[firebaseAdmin]', initError);
    return;
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountEnv);
    if (!getApps().length) {
      initializeApp({ credential: cert(serviceAccount) });
    }
    adminAuth = getAuth();
    adminMessaging = getMessaging();
  } catch (err) {
    initError = `Firebase Admin init failed: ${err.message}`;
    console.error('[firebaseAdmin]', initError);
  }
}

/**
 * Returns the Firebase Admin Messaging instance, or null if unavailable.
 * Never throws — callers (FCM send helpers) check for null and skip silently.
 */
export function getAdminMessaging() {
  init();
  return adminMessaging;
}

/**
 * Verifies a Firebase ID token cryptographically using Firebase Admin SDK.
 * Returns { email, uid, ...claims } if valid.
 * Throws an Error with status 401/503 if invalid or service is unavailable.
 *
 * There is NO insecure fallback. If Firebase Admin is not configured or
 * the token is invalid, this function always throws — never passes through.
 */
export async function verifyFirebaseToken(token) {
  init();

  if (!adminAuth) {
    const error = new Error(initError || 'Firebase Admin SDK is not available');
    error.status = 503;
    throw error;
  }

  try {
    const decoded = await adminAuth.verifyIdToken(token, true);
    return { email: decoded.email, uid: decoded.uid, ...decoded };
  } catch (err) {
    const error = new Error('Invalid or expired token');
    error.status = 401;
    throw error;
  }
}
