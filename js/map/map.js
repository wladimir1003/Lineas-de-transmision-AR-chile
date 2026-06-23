const MapModule = {
  map: null,
  userMarker: null,
  userCircle: null,
  capaLineas: null,
  capaLineasTouch: null,
  capaSubestaciones: null,
  lineaResaltada: null,
  puntoObjetivoLayer: null,

  init() {
    this.map = L.map("map", { zoomControl: true }).setView([-33.45, -70.66], 6);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 21,
      attribution: "© OpenStreetMap"
    }).addTo(this.map);
  },

  dibujarCapas() {
    if (this.capaLineas) this.map.removeLayer(this.capaLineas);
    if (this.capaLineasTouch) this.map.removeLayer(this.capaLineasTouch);
    if (this.capaSubestaciones) this.map.removeLayer(this.capaSubestaciones);
    if (this.lineaResaltada) this.map.removeLayer(this.lineaResaltada);
    if (this.puntoObjetivoLayer) this.map.removeLayer(this.puntoObjetivoLayer);

    this.capaLineas = L.geoJSON(AppState.lineasGeoJSON || { type: "FeatureCollection", features: [] }, {
      style: f => ({
        color: colorPorVoltaje(f.properties || {}),
        weight: 4,
        opacity: 0.9
      }),
      onEachFeature: this.configurarLinea.bind(this)
    }).addTo(this.map);

    this.capaLineasTouch = L.geoJSON(AppState.lineasGeoJSON || { type: "FeatureCollection", features: [] }, {
      style: () => ({
        color: "#000",
        weight: 26,
        opacity: 0,
        fillOpacity: 0
      }),
      onEachFeature: this.configurarLinea.bind(this)
    }).addTo(this.map);

    this.capaSubestaciones = L.geoJSON(AppState.subestacionesGeoJSON || { type: "FeatureCollection", features: [] }, {
      pointToLayer: (f, latlng) => L.circleMarker(latlng, {
        radius: 10,
        color: "#003366",
        fillColor: "#00bcd4",
        fillOpacity: 0.9,
        weight: 3
      }),
      onEachFeature: (f, layer) => {
        const p = f.properties || {};
        layer.bindPopup(this.infoSubestacionHTML(p));
        layer.on("click", () => this.mostrarSubestacionManual(f));
      }
    }).addTo(this.map);

    try {
      const b = this.capaLineas.getBounds();
      if (b.isValid()) this.map.fitBounds(b);
    } catch (e) {}
  },

  configurarLinea(feature, layer) {
    const p = feature.properties || {};
    layer.bindPopup(this.infoLineaHTML(p));
    layer.on("click", () => {
      this.resaltarLinea(feature);
      this.mostrarLineaManual(feature);
    });
  },

  actualizarUsuario(lat, lng, precision) {
    const latlng = [lat, lng];

    if (!this.userMarker) {
      this.userMarker = L.marker(latlng).addTo(this.map).bindPopup("Tu ubicación");
      this.userCircle = L.circle(latlng, {
        radius: precision,
        color: "#007bff",
        fillColor: "#007bff",
        fillOpacity: 0.12,
        weight: 1
      }).addTo(this.map);
      this.map.setView(latlng, 17);
    } else {
      this.userMarker.setLatLng(latlng);
      this.userCircle.setLatLng(latlng);
      this.userCircle.setRadius(precision);
    }
  },

  resaltarLinea(linea) {
    if (this.lineaResaltada) {
      this.map.removeLayer(this.lineaResaltada);
      this.lineaResaltada = null;
    }
    if (!linea) return;

    this.lineaResaltada = L.geoJSON(linea, {
      style: { color: "#ffff00", weight: 9, opacity: 0.95 }
    }).addTo(this.map);
  },

  marcarObjetivo(obj) {
    if (this.puntoObjetivoLayer) {
      this.map.removeLayer(this.puntoObjetivoLayer);
      this.puntoObjetivoLayer = null;
    }
    if (!obj || !obj.point || !obj.point.geometry) return;

    const coords = obj.point.geometry.coordinates;
    this.puntoObjetivoLayer = L.circleMarker([coords[1], coords[0]], {
      radius: 8,
      color: "#ff8c00",
      fillColor: "#ffff00",
      fillOpacity: 0.95,
      weight: 3
    }).addTo(this.map).bindPopup("Objetivo radar: " + obj.tipo);
  },

  centrarUsuario() {
    if (!AppState.ultimaPosicion) {
      alert("Primero activa GPS.");
      return;
    }
    this.map.setView([
      AppState.ultimaPosicion.coords.latitude,
      AppState.ultimaPosicion.coords.longitude
    ], 18);
  },

  mostrarLineaManual(feature) {
    const p = feature.properties || {};
    UI.panel("Línea seleccionada", [
      "Nombre: " + campo(p, ["NOMBRE","nombre","Name"], "Línea sin nombre"),
      "Tensión: " + campo(p, ["TENSION_KV","voltaje_kv","Voltaje","kv"], "s/i") + " kV",
      "Propiedad: " + campo(p, ["PROPIEDAD","propietario","Propietario","OWNER"], "s/i"),
      "Tramo: " + campo(p, ["TRAMO","tramo","Tramo"], "s/i")
    ], "ok");
  },

  mostrarSubestacionManual(feature) {
    const p = feature.properties || {};
    UI.panel("Subestación seleccionada", [
      "Nombre: " + campo(p, ["NOMBRE","nombre","Name"], "Subestación"),
      "Tensión: " + campo(p, ["TENSION_KV","voltaje_kv","Voltaje","kv"], "s/i") + " kV",
      "Propiedad: " + campo(p, ["PROPIEDAD","propietario","Propietario","OWNER"], "s/i")
    ], "ok");
  },

  infoLineaHTML(p) {
    return "<b>" + campo(p, ["NOMBRE","nombre","Name"], "Línea sin nombre") + "</b><br>" +
      "Tensión: " + campo(p, ["TENSION_KV","voltaje_kv","Voltaje","kv"], "s/i") + " kV<br>" +
      "Propiedad: " + campo(p, ["PROPIEDAD","propietario","Propietario","OWNER"], "s/i") + "<br>" +
      "Tramo: " + campo(p, ["TRAMO","tramo","Tramo"], "s/i");
  },

  infoSubestacionHTML(p) {
    return "<b>" + campo(p, ["NOMBRE","nombre","Name"], "Subestación") + "</b><br>" +
      "Tensión: " + campo(p, ["TENSION_KV","voltaje_kv","Voltaje","kv"], "s/i") + " kV<br>" +
      "Propiedad: " + campo(p, ["PROPIEDAD","propietario","Propietario","OWNER"], "s/i");
  }
};
