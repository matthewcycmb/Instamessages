/* Retired service worker: the web-app product was removed. This build
   unregisters itself from any browser that still has the old one. */

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
  event.waitUntil(
    self.registration
      .unregister()
      .then(() => self.clients.matchAll())
      .then((clients) => clients.forEach((c) => "navigate" in c && c.navigate(c.url)))
  );
});
