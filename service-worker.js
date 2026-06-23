/*
ElectroLíneas Chile GPS - Etapa 3
Creado por Wladimir Campos
www.JFSasesorias.org
*/
const CACHE_NAME = "electrolineas-chile-gps-etapa3-v1";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/styles.css",
  "./assets/icon.svg",
  "./data/lineas_transmision.geojson",
  "./data/subestaciones.geojson",
  "./js/config.js",
  "./js/utils.js",
  "./js/storage/indexeddb.js",
  "./js/services/ideenergia.js",
  "./js/ui/device.js",
  "./js/ui/panel.js",
  "./js/ui/install.js",
  "./js/map/map.js",
  "./js/gps/gps.js",
  "./js/radar/radar.js",
  "./js/app.js",
  "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
  "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js",
  "https://unpkg.com/@turf/turf@6/turf.min.js"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.map(key => key !== CACHE_NAME ? caches.delete(key) : null))
  ));
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
