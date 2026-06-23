/*
Líneas Eléctricas Chile V3.1
Herramienta de medición GPS → punto en pantalla
Creado por Wladimir Campos
www.JFSasesorias.org
*/

const Measure = {
  active: false,
  lineLayer: null,
  startMarker: null,
  endMarker: null,
  labelMarker: null,

  init() {
    document.getElementById("btnMeasure").addEventListener("click", () => this.toggle());
    document.getElementById("btnClearMeasure").addEventListener("click", () => this.clear());

    MapModule.map.on("click", e => {
      if (!this.active) return;
      this.measureToPoint(e.latlng);
    });
  },

  toggle() {
    this.active = !this.active;
    document.getElementById("btnMeasure").classList.toggle("active", this.active);

    if (this.active) {
      UI.panel("Huincha de medir activada", [
        "Toca cualquier punto en el mapa.",
        "Se medirá desde tu posición GPS actual hasta ese punto.",
        "Si tu ubicación no aparece, presiona Activar GPS primero."
      ], "ok");
    } else {
      UI.panel("Huincha de medir desactivada", [
        "La última medida queda visible.",
        "Presiona Borrar medida para limpiar el mapa."
      ]);
    }
  },

  measureToPoint(targetLatLng) {
    if (!AppState.ultimaPosicion) {
      UI.panel("GPS requerido", [
        "Primero presiona Activar GPS.",
        "La medición parte desde la posición que marca el GPS."
      ], "bad");
      return;
    }

    const lat1 = AppState.ultimaPosicion.coords.latitude;
    const lng1 = AppState.ultimaPosicion.coords.longitude;
    const lat2 = targetLatLng.lat;
    const lng2 = targetLatLng.lng;
    const precision = AppState.ultimaPosicion.coords.accuracy;

    const origen = turf.point([lng1, lat1]);
    const destino = turf.point([lng2, lat2]);

    const distancia = turf.distance(origen, destino, { units: "meters" });
    const bearing = normalizar(turf.bearing(origen, destino));
    const mid = turf.midpoint(origen, destino);
    const midCoords = mid.geometry.coordinates;

    this.draw(lat1, lng1, lat2, lng2, distancia, bearing);

    UI.panel("Medición GPS → punto", [
      "Distancia: " + distancia.toFixed(2) + " m",
      "Rumbo: " + bearing.toFixed(0) + "° / " + rumboTexto(bearing),
      "Origen GPS: " + lat1.toFixed(6) + ", " + lng1.toFixed(6),
      "Punto tocado: " + lat2.toFixed(6) + ", " + lng2.toFixed(6),
      "Precisión GPS: ±" + precision.toFixed(1) + " m"
    ], "ok");
  },

  draw(lat1, lng1, lat2, lng2, distancia, bearing) {
    this.clear(false);

    this.lineLayer = L.polyline([[lat1, lng1], [lat2, lng2]], {
      color: "#ff8c00",
      weight: 5,
      opacity: 0.95,
      dashArray: "8, 8"
    }).addTo(MapModule.map);

    this.startMarker = L.circleMarker([lat1, lng1], {
      radius: 8,
      color: "#007bff",
      fillColor: "#007bff",
      fillOpacity: 0.95,
      weight: 3
    }).addTo(MapModule.map).bindPopup("Origen GPS");

    this.endMarker = L.circleMarker([lat2, lng2], {
      radius: 8,
      color: "#ff8c00",
      fillColor: "#ffff00",
      fillOpacity: 0.95,
      weight: 3
    }).addTo(MapModule.map).bindPopup("Punto medido");

    const midLat = (lat1 + lat2) / 2;
    const midLng = (lng1 + lng2) / 2;

    const html = `
      <div style="background:white;border:2px solid #ff8c00;border-radius:10px;padding:5px 8px;font-size:12px;font-weight:bold;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,.3)">
        📏 ${distancia.toFixed(1)} m<br>
        ${bearing.toFixed(0)}° / ${rumboTexto(bearing)}
      </div>
    `;

    this.labelMarker = L.marker([midLat, midLng], {
      icon: L.divIcon({
        className: "",
        html,
        iconSize: [120, 44],
        iconAnchor: [60, 22]
      }),
      interactive: false
    }).addTo(MapModule.map);
  },

  clear(showPanel = true) {
    if (this.lineLayer) MapModule.map.removeLayer(this.lineLayer);
    if (this.startMarker) MapModule.map.removeLayer(this.startMarker);
    if (this.endMarker) MapModule.map.removeLayer(this.endMarker);
    if (this.labelMarker) MapModule.map.removeLayer(this.labelMarker);

    this.lineLayer = null;
    this.startMarker = null;
    this.endMarker = null;
    this.labelMarker = null;

    if (showPanel) {
      UI.panel("Medición borrada", [
        "La huincha fue eliminada del mapa.",
        "Puedes activar Medir y tocar otro punto."
      ], "ok");
    }
  }
};
