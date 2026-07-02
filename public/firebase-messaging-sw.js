/* Firebase Cloud Messaging service worker — handles background push.
 *
 * Served from the web root so its scope covers the whole app. The config below
 * is public by design (same values shipped in the client bundle); none of it is
 * a secret. Keep it in sync with NEXT_PUBLIC_FIREBASE_* in the environment.
 */
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyAYKfgVS5WGsbZLQ42dsKTJy98fRRjj1w8',
  authDomain: 'mealdirect-2192b.firebaseapp.com',
  projectId: 'mealdirect-2192b',
  storageBucket: 'mealdirect-2192b.firebasestorage.app',
  messagingSenderId: '99018858239',
  appId: '1:99018858239:web:9ff663f20b28f8c5d036ca',
  measurementId: 'G-34V8S6D2GF',
});

const messaging = firebase.messaging();

// Show a notification for data/background messages.
messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || payload.data?.title || 'Meal Direct';
  const options = {
    body: payload.notification?.body || payload.data?.body || '',
    icon: '/icon-192.png',
    badge: '/favicon-32.png',
    data: { url: payload.fcmOptions?.link || payload.data?.linkPath || '/' },
  };
  self.registration.showNotification(title, options);
});

// Focus an existing tab (or open one) at the notification's link on click.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      return self.clients.openWindow(targetUrl);
    })
  );
});
