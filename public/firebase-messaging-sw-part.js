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
  const imageUrl = data.imageUrl || data.image || '';

  // Build actions list for silent/fallback notifications
  const actions = [];
  if (data.orderId) {
    actions.push(
      { action: 'track_order', title: 'Track Order 📦' },
      { action: 'shop_now', title: 'Shop Streetwear ⚡' }
    );
  } else {
    actions.push(
      { action: 'shop_now', title: 'Shop Now ⚡' },
      { action: 'view_deals', title: 'View Deals 🏷️' }
    );
  }

  self.registration.showNotification(notifTitle, {
    body: notifBody,
    icon: '/icons/icon-192x192.png',
    badge: '/favicon.svg',
    image: imageUrl || undefined,
    data: data,
    vibrate: [200, 100, 200],
    actions: actions,
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  const action = event.action;

  // Resolve target URL based on action button clicked
  let url = '/';
  if (action === 'track_order' && data.orderId) {
    url = `/orders?orderId=${data.orderId}`;
  } else if (action === 'shop_now') {
    url = '/#categories';
  } else if (action === 'view_deals') {
    url = '/deals/under-999';
  } else {
    // Default notification body click
    url = data.orderId ? `/orders?orderId=${data.orderId}` : '/';
  }

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Find existing open tab/window
        for (const client of windowClients) {
          if ('focus' in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        // Fallback to opening a new tab
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});
