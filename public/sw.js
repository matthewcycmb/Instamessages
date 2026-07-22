/* Instamessages service worker: web push + notification click. */

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let data = { title: "Instamessages", body: "New message", url: "/" };
  try {
    data = { ...data, ...event.data.json() };
  } catch {
    /* keep defaults */
  }
  event.waitUntil(
    (async () => {
      await self.registration.showNotification(data.title, {
        body: data.body,
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        data: { url: data.url },
        tag: data.url, // collapse multiple pushes from the same thread
      });
      // App-icon unread badge: notifications collapse per thread, so their
      // count ≈ conversations with something new.
      if (self.navigator.setAppBadge) {
        const shown = await self.registration.getNotifications();
        await self.navigator.setAppBadge(Math.max(shown.length, 1)).catch(() => {});
      }
    })()
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (self.navigator.clearAppBadge) self.navigator.clearAppBadge().catch(() => {});
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
