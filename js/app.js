/*
ElectroLíneas Chile GPS
Creado por Wladimir Campos
www.JFSasesorias.org
*/
let map;
let userMarker = null;
let userCircle = null;
let lineasGeoJSON = null;
let subestacionesGeoJSON = null;
let capaLineas = null;
let capaSubestaciones = null;
let lineaResaltada = null;
let ultimaPosicion = null;
let watchId = null;
let ultimaLinea = null;
let ultimaDistancia = null;
let ultimaSubestacion = null;
let heading = 0;
let radarVisible = false;
const URL_LINEAS = "https://ide-energia.minenergia.cl/server/rest/services/IDE_Energia/Visor_IDE_Energ%C3%ADa/MapServer/10/query";
const URL_SUBESTACIONES = "https://ide-energia.minenergia.cl/server/rest/services/IDE_Energia/Visor_IDE_Energ%C3%ADa/MapServer/8/query";
const panel = document.getElementById("infoPanel");
document.addEventListener("DOMContentLoaded", () => {
  iniciarMapa();
  configurarBotones();
  registrarServiceWorker();
  cargarDatosIniciales();
  activarBrujula();
});
function configurarBotones() {
  document.getElementById("btnGPS").addEventListener("click", activarGPS);
  document.getElementById("btnDownload").addEventListener("click", descargarDatosOficiales);
  document.getElementById("btnCenter").addEventListener("click", centrarUsuario);
  document.getElementById("btnStatus").addEventListener("click", mostrarEstado);
  document.getElementById("btnRadar").addEventListener("click", alternarRadar);
}
function iniciarMapa() {
  map = L.map("map").setView([-33.45, -70.66], 6);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 21,
    attribution: "© OpenStreetMap"
  }).addTo(map);
}
async function cargarDatosIniciales() {
  const cacheLineas = localStorage.getItem("lineas_oficiales_geojson");
  const cacheSub = localStorage.getItem("subestaciones_oficiales_geojson");
  if (cacheLineas && cacheSub) {
    try {
      lineasGeoJSON = JSON.parse(cacheLineas);
      subestacionesGeoJSON = JSON.parse(cacheSub);
      dibujarCapas();
      panel.innerHTML = panelBase("Datos oficiales cargados desde memoria", [
        "Líneas: " + lineasGeoJSON.features.length,
        "Subestaciones: " + subestacionesGeoJSON.features.length,
        "Puedes usar la app sin Internet."
      ]);
      return;
    } catch (e) {
      console.warn("Memoria local dañada, cargando demo.", e);
    }
  }
  await cargarDatosDemo();
}
async function cargarDatosDemo() {
  lineasGeoJSON = await (await fetch("./data/lineas_transmision.geojson")).json();
  subestacionesGeoJSON = await (await fetch("./data/subestaciones.geojson")).json();
  dibujarCapas();
  panel.innerHTML = panelBase("Datos demo cargados", [
    "Presiona Datos oficiales para intentar descargar capas reales.",
    "Luego presiona GPS para detectar la línea más cercana."
  ]);
}
async function descargarDatosOficiales() {
  try {
    panel.innerHTML = panelBase("Descargando datos oficiales", [
      "Conectando con IDE Energía...",
      "Esto puede demorar según la conexión."
    ]);
    const lineas = await descargarArcGIS(URL_LINEAS, "líneas");
    const subestaciones = await descargarArcGIS(URL_SUBESTACIONES, "subestaciones");
    localStorage.setItem("lineas_oficiales_geojson", JSON.stringify(lineas));
    localStorage.setItem("subestaciones_oficiales_geojson", JSON.stringify(subestaciones));
    localStorage.setItem("fecha_descarga_datos", new Date().toISOString());
    lineasGeoJSON = lineas;
    subestacionesGeoJSON = subestaciones;
    dibujarCapas();
    panel.innerHTML = panelBase("Datos oficiales descargados", [
      "Líneas: " + lineas.features.length,
      "Subestaciones: " + subestaciones.features.length,
      "Quedan guardados para uso offline."
    ]);
  } catch (err) {
    panel.innerHTML = panelBase("No se pudo descargar", [
      err.message,
      "Puede ser bloqueo CORS, falta de Internet o cambio del servicio oficial.",
      "La app seguirá funcionando con los GeoJSON locales de /data."
    ]);
  }
}
async function descargarArcGIS(baseUrl, nombre) {
  const pageSize = 2000;
  let offset = 0;
  let features = [];
  while (true) {
    panel.innerHTML = panelBase("Descargando " + nombre, [
      "Registros descargados: " + features.length
    ]);
    const params = new URLSearchParams({
      where: "1=1",
      outFields: "*",
      returnGeometry: "true",
      outSR: "4326",
      f: "geojson",
      resultOffset: String(offset),
      resultRecordCount: String(pageSize)
    });
    const res = await fetch(baseUrl + "?" + params.toString());
    if (!res.ok) throw new Error("Error HTTP " + res.status + " al descargar " + nombre);
    const geo = await res.json();
    if (!geo.features || !Array.isArray(geo.features)) {
      throw new Error("Respuesta GeoJSON inválida en " + nombre);
    }
    features = features.concat(geo.features);
    if (geo.features.length < pageSize) break;
    offset += pageSize;
    if (offset > 100000) throw new Error("Demasiados registros en " + nombre);
  }
  return {
    type: "FeatureCollection",
    name,
    features
  };
}
function dibujarCapas() {
  if (capaLineas) map.removeLayer(capaLineas);
  if (capaSubestaciones) map.removeLayer(capaSubestaciones);
  if (lineaResaltada) map.removeLayer(lineaResaltada);
  capaLineas = L.geoJSON(lineasGeoJSON, {
    style: f => ({
      color: colorPorVoltaje(f.properties || {}),
      weight: 4,
      opacity: 0.85
    }),
    onEachFeature: (f, layer) => {
      const p = f.properties || {};
      layer.bindPopup(
        "<b>" + campo(p, ["NOMBRE","nombre","Name"], "Línea sin nombre") + "</b><br>" +
        "Tensión: " + campo(p, ["TENSION_KV","voltaje_kv","Voltaje","kv"], "s/i") + " kV<br>" +
        "Propiedad: " + campo(p, ["PROPIEDAD","propietario","Propietario","OWNER"], "s/i")
      );
    }
  }).addTo(map);
  capaSubestaciones = L.geoJSON(subestacionesGeoJSON, {
    pointToLayer: (f, latlng) => L.circleMarker(latlng, {
      radius: 7,
      color: "#003366",
      fillColor: "#00bcd4",
      fillOpacity: 0.9,
      weight: 2
    }),
    onEachFeature: (f, layer) => {
      const p = f.properties || {};
      layer.bindPopup("<b>" + campo(p, ["NOMBRE","nombre","Name"], "Subestación") + "</b>");
    }
  }).addTo(map);
  try {
    const b = capaLineas.getBounds();
    if (b.isValid()) map.fitBounds(b);
  } catch (e) {}
}
function activarGPS() {
  if (!navigator.geolocation) {
    alert("Este dispositivo no soporta GPS.");
    return;
  }
  if (watchId) navigator.geolocation.clearWatch(watchId);
  watchId = navigator.geolocation.watchPosition(pos => {
    ultimaPosicion = pos;
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;
    const acc = pos.coords.accuracy;
    actualizarUsuario(lat, lng, acc);
    detectarCercanos(lat, lng, acc);
  }, err => {
    panel.innerHTML = panelBase("GPS no disponible", [
      err.message,
      "Activa permisos de ubicación y usa HTTPS, como GitHub Pages."
    ]);
  }, {
    enableHighAccuracy: true,
    maximumAge: 1000,
    timeout: 15000
  });
}
function actualizarUsuario(lat, lng, precision) {
  const latlng = [lat, lng];
  if (!userMarker) {
    userMarker = L.marker(latlng).addTo(map).bindPopup("Tu ubicación");
    userCircle = L.circle(latlng, {
      radius: precision,
      color: "#007bff",
      fillColor: "#007bff",
      fillOpacity: 0.12,
      weight: 1
    }).addTo(map);
    map.setView(latlng, 17);
  } else {
    userMarker.setLatLng(latlng);
    userCircle.setLatLng(latlng);
    userCircle.setRadius(precision);
  }
}
function detectarCercanos(lat, lng, precision) {
  if (!lineasGeoJSON || !lineasGeoJSON.features) return;
  const usuario = turf.point([lng, lat]);
  let menor = Infinity;
  let lineaCercana = null;
  for (const linea of lineasGeoJSON.features) {
    if (!linea.geometry) continue;
    try {
      const d = turf.pointToLineDistance(usuario, linea, { units: "meters" });
      if (d < menor) {
        menor = d;
        lineaCercana = linea;
      }
    } catch (e) {}
  }
  let menorSub = Infinity;
  let subCercana = null;
  for (const sub of (subestacionesGeoJSON?.features || [])) {
    try {
      const d = turf.distance(usuario, sub, { units: "meters" });
      if (d < menorSub) {
        menorSub = d;
        subCercana = sub;
      }
    } catch (e) {}
  }
  ultimaLinea = lineaCercana;
  ultimaDistancia = menor;
  ultimaSubestacion = { feature: subCercana, distancia: menorSub };
  mostrarResultado(lineaCercana, menor, precision, subCercana, menorSub, lat, lng);
  resaltarLinea(lineaCercana);
  actualizarRadar();
}
function mostrarResultado(linea, distancia, precision, sub, distSub, lat, lng) {
  const p = linea?.properties || {};
  const sp = sub?.properties || {};
  const radio = 150;
  const dentro = linea && distancia <= radio;
  const bearing = linea ? bearingALinea(lat, lng, linea) : null;
  if (!dentro) {
    panel.innerHTML = panelBase("Sin línea dentro del radio", [
      "Distancia mínima: " + distancia.toFixed(1) + " m",
      "Precisión GPS: ±" + precision.toFixed(1) + " m",
      "Subestación cercana: " + campo(sp, ["NOMBRE","nombre","Name"], "s/i") + " (" + distSub.toFixed(0) + " m)"
    ], "bad");
    return;
  }
  panel.innerHTML = panelBase(campo(p, ["NOMBRE","nombre","Name"], "Línea sin nombre"), [
    "Distancia a línea: " + distancia.toFixed(1) + " m",
    "Tensión: " + campo(p, ["TENSION_KV","voltaje_kv","Voltaje","kv"], "s/i") + " kV",
    "Propiedad: " + campo(p, ["PROPIEDAD","propietario","Propietario","OWNER"], "s/i"),
    "Tramo: " + campo(p, ["TRAMO","tramo","Tramo"], "s/i"),
    "Rumbo a línea: " + (bearing !== null ? bearing.toFixed(0) + "° / " + rumboTexto(bearing) : "s/i"),
    "Subestación cercana: " + campo(sp, ["NOMBRE","nombre","Name"], "s/i") + " (" + distSub.toFixed(0) + " m)",
    "Precisión GPS: ±" + precision.toFixed(1) + " m"
  ], distancia <= 30 ? "ok" : "warn");
}
function resaltarLinea(linea) {
  if (lineaResaltada) {
    map.removeLayer(lineaResaltada);
    lineaResaltada = null;
  }
  if (!linea) return;
  lineaResaltada = L.geoJSON(linea, {
    style: {
      color: "#ffff00",
      weight: 8,
      opacity: 0.9
    }
  }).addTo(map);
}
function centrarUsuario() {
  if (!ultimaPosicion) {
    alert("Primero activa GPS.");
    return;
  }
  map.setView([ultimaPosicion.coords.latitude, ultimaPosicion.coords.longitude], 18);
}
function mostrarEstado() {
  const fecha = localStorage.getItem("fecha_descarga_datos");
  const tiene = !!localStorage.getItem("lineas_oficiales_geojson");
  panel.innerHTML = panelBase("Estado de la aplicación", [
    "Etapa: 2",
    "Conexión: " + (navigator.onLine ? "Con Internet" : "Sin Internet"),
    "Datos oficiales guardados: " + (tiene ? "Sí" : "No"),
    "Fecha descarga: " + (fecha ? new Date(fecha).toLocaleString() : "Sin descarga"),
    "Líneas cargadas: " + (lineasGeoJSON?.features?.length || 0),
    "Subestaciones cargadas: " + (subestacionesGeoJSON?.features?.length || 0)
  ]);
}
function panelBase(titulo, filas, tipo = "warn") {
  const clase = tipo === "ok" ? "status-ok" : tipo === "bad" ? "status-bad" : "status-warn";
  return "<h2>" + titulo + "</h2>" +
    "<span class='" + clase + "'>ElectroLíneas Chile GPS</span>" +
    filas.map(x => "<div class='data-row'>" + x + "</div>").join("") +
    "<div class='copyright'><b>Creado por Wladimir Campos</b><br>www.JFSasesorias.org</div>";
}
function campo(obj, nombres, defecto) {
  for (const n of nombres) {
    if (obj[n] !== undefined && obj[n] !== null && obj[n] !== "") return obj[n];
  }
  return defecto;
}
function colorPorVoltaje(p) {
  const v = Number(campo(p, ["TENSION_KV","voltaje_kv","Voltaje","SUBTIPO","kv"], 0));
  if (v >= 500) return "#d00000";
  if (v >= 220) return "#ff8c00";
  if (v >= 154) return "#cc00ff";
  if (v >= 110) return "#0066ff";
  if (v >= 66) return "#00a651";
  return "#555555";
}
function bearingALinea(lat, lng, linea) {
  try {
    const usuario = turf.point([lng, lat]);
    const punto = turf.nearestPointOnLine(linea, usuario, { units: "meters" });
    return normalizar(turf.bearing(usuario, punto));
  } catch (e) {
    return null;
  }
}
function normalizar(g) {
  return ((g % 360) + 360) % 360;
}
function rumboTexto(g) {
  const dirs = ["N","NE","E","SE","S","SO","O","NO"];
  return dirs[Math.round(normalizar(g) / 45) % 8];
}
function alternarRadar() { radarVisible = !radarVisible; document.getElementById("radarPanel").classList.toggle("hidden", !radarVisible); actualizarRadar(); }
function activarBrujula() { window.addEventListener("deviceorientationabsolute", e => { if (e.alpha !== null) { heading = normalizar(360 - e.alpha); actualizarRadar(); } }, true); window.addEventListener("deviceorientation", e => { if (e.webkitCompassHeading) { heading = e.webkitCompassHeading; actualizarRadar(); } }, true); }
function actualizarRadar() { if (!radarVisible) return; const title = document.getElementById("radarTitle"); const dist = document.getElementById("radarDistance"); const bear = document.getElementById("radarBearing"); const sub = document.getElementById("radarSubstation"); const arrow = document.getElementById("radarArrow"); if (!ultimaPosicion || !ultimaLinea) { title.textContent = "Sin línea"; dist.textContent = "Distancia: --"; bear.textContent = "Rumbo: --"; return; } const lat = ultimaPosicion.coords.latitude; const lng = ultimaPosicion.coords.longitude; const b = bearingALinea(lat, lng, ultimaLinea); const p = ultimaLinea.properties || {}; const sp = ultimaSubestacion?.feature?.properties || {}; title.textContent = campo(p, ["NOMBRE","nombre","Name"], "Línea cercana"); dist.textContent = "Distancia: " + ultimaDistancia.toFixed(1) + " m"; bear.textContent = "Rumbo: " + (b !== null ? b.toFixed(0) + "° / " + rumboTexto(b) : "s/i"); sub.textContent = "S/E cercana: " + campo(sp, ["NOMBRE","nombre","Name"], "s/i"); if (b !== null) arrow.style.transform = "translate(-50%,-50%) rotate(" + normalizar(b - heading) + "deg)"; }
function registrarServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./service-worker.js").catch(console.warn);
  }
}
