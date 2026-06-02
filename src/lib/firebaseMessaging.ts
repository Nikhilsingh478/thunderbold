import { getMessaging, getToken, Messaging } from 'firebase/messaging';
import app from './firebase';

let messagingInstance: Messaging | null = null;

/**
 * Returns the Firebase Messaging instance, sharing the Workbox service worker
 * registration so FCM uses the same SW (not a separate one).
 * Returns null if messaging is not supported or SW is not available.
 */
export async function initMessaging(): Promise<Messaging | null> {
  if (messagingInstance) return messagingInstance;
  if (!('serviceWorker' in navigator) || !('Notification' in window)) return null;

  try {
    messagingInstance = getMessaging(app);
    return messagingInstance;
  } catch {
    return null;
  }
}

/**
 * Requests notification permission, obtains an FCM token, and calls
 * `updateTokenFn(token)` if permission is granted.
 *
 * - Does nothing (no throw) if permission is denied or already denied.
 * - Does nothing if VAPID key is missing or SW is unavailable.
 */
export async function requestAndRegisterToken(
  updateTokenFn: (token: string) => Promise<void>
): Promise<void> {
  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
  if (!vapidKey) return;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;

    const messaging = await initMessaging();
    if (!messaging) return;

    const swRegistration = await navigator.serviceWorker.ready;

    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: swRegistration,
    });

    if (token) {
      await updateTokenFn(token);
    }
  } catch {
  }
}
