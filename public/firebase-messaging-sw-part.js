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
  const { title, body } = payload.notification || {};
  const notifTitle = title || 'Thunderbold';
  const notifBody = body || '';

  self.registration.showNotification(notifTitle, {
    body: notifBody,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    data: payload.data || {},
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
