/* eslint-disable no-undef */
/**
 * FCM background message handler.
 * Injected into the Workbox-generated service worker via vite.config.ts `importScripts`.
 * Uses Firebase 10 compat CDN so it works inside a SW context without ESM imports.
 */
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCKmRGX8FOVsk0khJTM1s25Pcxe_TezYgQ",
  authDomain: "thunderbolt-auth.firebaseapp.com",
  projectId: "thunderbolt-auth",
  storageBucket: "thunderbolt-auth.firebasestorage.app",
  messagingSenderId: "491240288125",
  appId: "1:491240288125:web:a5406e022ac5a2f2442614",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[FCM-SW] Background message received:', payload);

  // If the payload contains the 'notification' key, FCM/browser automatically 
  // renders the notification using the webpush options. We return early to 
  // prevent self.registration.showNotification from showing a duplicate card.
  if (payload.notification) {
    console.log('[FCM-SW] Browser handles notification rendering automatically. Skipping SW showNotification.');
    return;
  }

  // Fallback handler for data-only (silent) notification payloads
  const data = payload.data || {};
  const title = data.title;
  const body = data.body;
  if (!title && !body) return;

  const notifTitle = title || 'Thunderbold';
  const notifBody = body || '';

  self.registration.showNotification(notifTitle, {
    body: notifBody,
    icon: 'https://thunderbold.shop/icons/icon-192x192.png',
    badge: 'https://thunderbold.shop/icons/icon-96x96.png',
    data: data,
    vibrate: [200, 100, 200],
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  const orderId = data.orderId;
  const url = orderId ? `/orders?orderId=${orderId}` : '/orders';

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if ('focus' in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});
