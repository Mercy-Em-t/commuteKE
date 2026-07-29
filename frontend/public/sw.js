import { precacheAndRoute } from 'workbox-precaching';

// Precaching all the static assets from Vite build
precacheAndRoute(self.__WB_MANIFEST || []);

// Listen for push events
self.addEventListener('push', function (event) {
  if (event.data) {
    let payload;
    try {
      payload = event.data.json();
    } catch (e) {
      payload = { title: 'Transy Alert', body: event.data.text() };
    }
    
    const options = {
      body: payload.body,
      icon: '/transy_logo.jpg',
      badge: '/icons.svg',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: '2'
      }
    };
    event.waitUntil(
      self.registration.showNotification(payload.title, options)
    );
  }
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});
