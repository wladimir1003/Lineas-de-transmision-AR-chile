/*
ElectroLíneas Chile GPS - Etapa 2 Final
Creado por Wladimir Campos
www.JFSasesorias.org
*/
const CACHE_NAME = "electrolineas-chile-gps-etapa2-final-v1";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./assets/icon.svg",
  "./data/lineas_transmision.geojson",
  "./data/subestaciones.geojson",
  "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
  "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js",
  "https://unpkg.com/@turf/turf@6/turf.min.js"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => key !== CACHE_NAME ? caches.delete(key) : null))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(cached =>
      cached || fetch(event.request).then(response => {
        const copy = response.clone();
        if (event.request.method === "GET") {
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        }
        return response;
      }).catch(() => cached)
    )
  );
});
