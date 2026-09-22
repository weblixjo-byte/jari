// jari Loyalty & Rewards - Web Push Service Worker
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle incoming Web Push notifications from server
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      try {
        data = {
          title: 'jari',
          body: event.data.text(),
        };
      } catch (err) {
        data = {
          title: 'jari',
          body: 'You have a new update in your account!',
        };
      }
    }
  } else {
    data = {
      title: 'jari',
      body: 'You have a new notification from jari!',
    };
  }

  const title = data.title || 'jari';
  const targetUrl = data.url || '/customer';

  // Enhanced options compatible across Android Chrome, iOS Safari PWA, and Desktop
  const options = {
    body: data.body || data.message || 'You have an update on your loyalty balance and rewards!',
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/icon-192.png',
    vibrate: [300, 150, 300, 150, 300],
    renotify: true,
    requireInteraction: true, // Remains on lock screen / desktop until user interacts
    silent: false,
    data: {
      url: targetUrl,
      time: Date.now(),
    },
    tag: data.tag || 'jari-' + Date.now(),
  };

  // Notify any open customer tabs immediately (0ms instant live sync)
  self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
    clients.forEach((client) => {
      try {
        client.postMessage({
          type: 'PUSH_NOTIFICATION_RECEIVED',
          data: data,
        });
      } catch (e) {
        // Ignore client messaging errors
      }
    });
  });

  event.waitUntil(
    self.registration.showNotification(title, options).catch((err) => {
      console.warn('[SW] Full showNotification failed, falling back to minimal options:', err);
      return self.registration.showNotification(title, {
        body: options.body,
        icon: '/icon-192.png',
      }).catch((minimalErr) => {
        // Ultimate fallback: plain title and body
        return self.registration.showNotification(title, { body: options.body });
      });
    })
  );
});

// Handle notification click by opening the customer pass
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = (event.notification.data && event.notification.data.url) || '/customer';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If customer window is already open, focus it
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          if ('navigate' in client) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
