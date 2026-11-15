/* ==========================================================================
   11/5 CLASS PLATFORM SERVICE WORKER (Web Push Notifications + Standalone PWA)
   ========================================================================== */

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let payload = {
    title: '11⁵ კლასი • კომაროვი',
    body: 'ახალი შეტყობინება პლატფორმაზე',
    url: '/',
    tag: 'class11-5-notif',
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      payload = {
        ...payload,
        ...parsed,
      };
    } catch {
      try {
        payload.body = event.data.text();
      } catch {}
    }
  }

  const options = {
    body: payload.body,
    icon: '/icons/icon-192.png?v=2',
    badge: '/icons/badge-96.png?v=2',
    tag: payload.tag || 'class11-5-notif-' + Date.now(),
    renotify: true,
    data: {
      url: payload.url || '/',
    },
  };

  event.waitUntil(self.registration.showNotification(payload.title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ('focus' in client) {
          client.focus();
          if ('navigate' in client && targetUrl) {
            try {
              client.navigate(targetUrl);
            } catch {}
          }
          return;
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
