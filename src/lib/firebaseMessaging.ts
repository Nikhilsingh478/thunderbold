import { getMessaging, getToken, Messaging } from 'firebase/messaging';
import app from './firebase';

let messagingInstance: Messaging | null = null;

/**
 * Returns the Firebase Messaging instance.
 * Returns null if messaging is not supported or SW is not available.
 */
export async function initMessaging(): Promise<Messaging | null> {
  if (messagingInstance) return messagingInstance;
  if (!('serviceWorker' in navigator) || !('Notification' in window)) {
    console.warn('[FCM] serviceWorker or Notification API not supported by browser.');
    return null;
  }

  try {
    messagingInstance = getMessaging(app);
    return messagingInstance;
  } catch (error) {
    console.error('[FCM] Failed to initialize messaging instance:', error);
    return null;
  }
}

/**
 * Requests notification permission, obtains an FCM token, and calls
 * `updateTokenFn(token)` if permission is granted.
 */
export async function requestAndRegisterToken(
  updateTokenFn: (token: string) => Promise<void>
): Promise<void> {
  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
  if (!vapidKey) {
    console.warn('[FCM] VITE_FIREBASE_VAPID_KEY is missing. Token registration aborted.');
    return;
  }

  try {
    console.log('[FCM] Checking/Requesting notification permission...');
    const permission = await Notification.requestPermission();
    console.log(`[FCM] Notification permission state is currently: "${permission}"`);
    if (permission !== 'granted') {
      console.log('[FCM] Notification permission was not granted. Aborting registration.');
      return;
    }

    const messaging = await initMessaging();
    if (!messaging) {
      console.warn('[FCM] Messaging could not be initialized.');
      return;
    }

    let token = null;

    // Try retrieving the main active PWA service worker registration
    try {
      let mainReg = null;
      if ('serviceWorker' in navigator) {
        // In production, we reuse the service worker registered by main.tsx once it is ready
        if (!import.meta.env.DEV) {
          try {
            mainReg = await navigator.serviceWorker.ready;
            console.log('[FCM] Main PWA service worker is ready for push registration.');
          } catch (swErr) {
            console.error('[FCM] Failed to await main service worker readiness:', swErr);
          }
        }
      }

      if (mainReg) {
        console.log('[FCM] Registering token through main PWA service worker...');
        token = await getToken(messaging, {
          vapidKey,
          serviceWorkerRegistration: mainReg,
        });
      } else {
        console.log('[FCM] PWA service worker not used (either in DEV mode or service worker ready timed out).');
      }
    } catch (swErr) {
      console.warn('[FCM] Failed to fetch token using main PWA service worker:', swErr);
    }

    // Fallback: use default FCM registration (registers /firebase-messaging-sw.js) ONLY in development
    if (!token && import.meta.env.DEV) {
      console.log('[FCM] Dev fallback: Attempting default FCM service worker token registration (/firebase-messaging-sw.js)...');
      try {
        token = await getToken(messaging, { vapidKey });
      } catch (fallbackErr) {
        console.error('[FCM] Default FCM token generation failed:', fallbackErr);
        throw fallbackErr; // Propagate to outer catch
      }
    }

    if (token) {
      console.log('[FCM] FCM Token generated successfully:', token.slice(0, 15) + '...');
      await updateTokenFn(token);
    } else {
      console.warn('[FCM] Token generation resolved, but returned an empty token.');
    }
  } catch (error) {
    console.error('[FCM] Critical error in requestAndRegisterToken pipeline:', error);
  }
}
