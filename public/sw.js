// Life OS service worker
// v1: basic install + offline shell + notification click handling.
// v2 will add real Web Push (needs VAPID keys, see /api/push/* on deploy).

const CACHE = "life-os-v1";

self.addEventListener("install", (e) => {
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(self.clients.claim());
});

// Pass-through fetch (we'll add proper caching later).
self.addEventListener("fetch", () => {});

// Display a notification when the page asks us to.
self.addEventListener("message", (e) => {
  const { type, title, body, tag, url } = e.data || {};
  if (type === "notify") {
    self.registration.showNotification(title || "Life OS", {
      body: body || "",
      tag: tag || "lifeos",
      icon: "/icon.svg",
      badge: "/icon.svg",
      data: { url: url || "/" },
    });
  }
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = e.notification.data?.url || "/";
  e.waitUntil(
    self.clients.matchAll({ type: "window" }).then((wins) => {
      for (const w of wins) {
        if ("focus" in w) { w.navigate?.(url); return w.focus(); }
      }
      return self.clients.openWindow(url);
    }),
  );
});

// Future: Web Push event
self.addEventListener("push", (e) => {
  let data = {};
  try { data = e.data ? e.data.json() : {}; } catch {}
  e.waitUntil(self.registration.showNotification(
    data.title || "Life OS",
    {
      body: data.body || "",
      tag: data.tag || "lifeos",
      icon: "/icon.svg",
      badge: "/icon.svg",
      data: { url: data.url || "/" },
    },
  ));
});
