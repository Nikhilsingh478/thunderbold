/* eslint-disable no-undef */
/**
 * Fallback Firebase Cloud Messaging Service Worker.
 * Used when registering the FCM token without passing the custom Workbox PWA service worker,
 * especially useful in local development where VitePWA registers no sw.js, or on device environments
 * where PWA activation is delayed.
 *
 * It simply imports the shared FCM compatibility code from `/firebase-messaging-sw-part.js`.
 */
importScripts('/firebase-messaging-sw-part.js');
