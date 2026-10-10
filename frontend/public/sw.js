/* Retrivo Vault service worker — Web Push only.
 * Deliberately minimal: no offline caching, no fetch handler. It exists so the
 * browser can show push notifications the admin sends from the dashboard. */

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "Retrivo Vault", body: event.data && event.data.text() };
  }

  const title = data.title || "Retrivo Vault";
  const options = {
    body: data.body || "",
    tag: data.tag || "retrivo",
    data: { link: data.link || "/app" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const link = (event.notification.data && event.notification.data.link) || "/app";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) {
          client.navigate(link);
          return client.focus();
        }
      }
      return self.clients.openWindow(link);
    })
  );
});
