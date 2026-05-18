// Life OS service worker — v3
// Network-first for HTML/RSC so new deploys propagate on first load.
// Cache-first for static assets (hashed JS/CSS) since they're immutable.

const CACHE = "life-os-v3";
const STATIC_ASSETS = ["/icon.svg", "/manifest.json"];

self.addEventListener("install", (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    try { await c.addAll(STATIC_ASSETS); } catch {}
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    // Nuke previous caches so old HTML stops being served.
    const names = await caches.keys();
    await Promise.all(names.filter((n) => n !== CACHE).map((n) => caches.delete(n)));
    await self.clients.claim();
    // Tell all open clients there's a new version.
    const clients = await self.clients.matchAll({ type: "window" });
    for (const c of clients) c.postMessage({ type: "sw-updated", version: CACHE });
  })());
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  const isHTML = req.mode === "navigate" || req.headers.get("accept")?.includes("text/html");
  const isRSC = url.searchParams.has("_rsc") || req.headers.get("rsc") !== null;
  const isStatic = url.pathname.startsWith("/_next/static/") || /\.(?:png|jpg|jpeg|svg|webp|ico|woff2?)$/i.test(url.pathname);

  if (isHTML || isRSC) {
    // Network first — always try fresh. Fall back to cache only on failure (offline).
    e.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const c = await caches.open(CACHE);
        c.put(req, fresh.clone()).catch(() => {});
        return fresh;
      } catch {
        const cached = await caches.match(req);
        if (cached) return cached;
        // Last fallback: offline shell.
        return new Response("<h1>Offline</h1><p>Reconnect to load Life OS.</p>", { headers: { "content-type": "text/html" } });
      }
    })());
    return;
  }

  if (isStatic) {
    // Cache-first for hashed static assets.
    e.respondWith((async () => {
      const cached = await caches.match(req);
      if (cached) return cached;
      try {
        const fresh = await fetch(req);
        const c = await caches.open(CACHE);
        c.put(req, fresh.clone()).catch(() => {});
        return fresh;
      } catch {
        return cached ?? Response.error();
      }
    })());
    return;
  }

  // Default: just let the browser handle it.
});

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
  } else if (type === "skip-waiting") {
    self.skipWaiting();
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
