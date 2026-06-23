const AppState = {
  lineasGeoJSON: null,
  subestacionesGeoJSON: null,
  ultimaPosicion: null
};

const App = {
  async init() {
    MapModule.init();
    InstallHelper.init();
    this.bindEvents();
    await this.cargarDatosIniciales();

    UI.panel("Líneas Eléctricas Chile V3 lista", [
      "Dispositivo/navegador: " + Device.label(),
      "Los GeoJSON locales están vacíos para evitar datos de prueba.",
      "Presiona Datos oficiales para descargar líneas y subestaciones reales.",
      "IndexedDB activado para evitar error de cuota."
    ], "ok");
  },

  bindEvents() {
    document.getElementById("btnGPS").addEventListener("click", () => GPS.activar());
    document.getElementById("btnDownload").addEventListener("click", () => this.descargarDatos());
    document.getElementById("btnCenter").addEventListener("click", () => MapModule.centrarUsuario());
    document.getElementById("btnRadar").addEventListener("click", () => Radar.alternar());
    document.getElementById("btnStatus").addEventListener("click", () => UI.estado());
    document.getElementById("btnClear").addEventListener("click", () => this.limpiarDatos());
    document.getElementById("radarMode").addEventListener("change", () => {
      if (AppState.ultimaPosicion) {
        Radar.detectarCercanos(
          AppState.ultimaPosicion.coords.latitude,
          AppState.ultimaPosicion.coords.longitude,
          AppState.ultimaPosicion.coords.accuracy
        );
      }
    });
  },

  async cargarDatosIniciales() {
    try {
      const lineas = await DB.get("lineas");
      const subestaciones = await DB.get("subestaciones");

      if (lineas && subestaciones) {
        AppState.lineasGeoJSON = lineas.data;
        AppState.subestacionesGeoJSON = subestaciones.data;
        MapModule.dibujarCapas();
        return;
      }
    } catch (e) {
      console.warn("IndexedDB no disponible o vacío", e);
    }

    AppState.lineasGeoJSON = await (await fetch("./data/lineas_transmision.geojson")).json();
    AppState.subestacionesGeoJSON = await (await fetch("./data/subestaciones.geojson")).json();
    MapModule.dibujarCapas();

    if ((AppState.lineasGeoJSON.features || []).length === 0 && (AppState.subestacionesGeoJSON.features || []).length === 0) {
      UI.panel("Sin datos locales", [
        "Los GeoJSON de data/ están vacíos a propósito.",
        "Presiona Datos oficiales para descargar información real.",
        "Si ya descargaste antes, usa Estado para revisar IndexedDB."
      ], "warn");
    }
  },

  async descargarDatos() {
    try {
      await IDEEnergia.descargarDatosOficiales();
    } catch (err) {
      UI.panel("No se pudo descargar", [
        err.message,
        "Si dice CORS: el servidor bloqueó la consulta.",
        "Si dice cuota: usa Limpiar datos y revisa almacenamiento del equipo.",
        "Esta versión usa IndexedDB, no localStorage."
      ], "bad");
    }
  },

  async limpiarDatos() {
    if (!confirm("¿Borrar datos oficiales guardados en este dispositivo?")) return;
    await DB.deleteDatabase();
    localStorage.removeItem("lineas_oficiales_geojson");
    localStorage.removeItem("subestaciones_oficiales_geojson");
    localStorage.removeItem("fecha_descarga_datos");

    UI.panel("Datos locales borrados", [
      "Se limpió IndexedDB y localStorage antiguo.",
      "Recarga la página y vuelve a descargar datos oficiales."
    ], "ok");
  }
};

document.addEventListener("DOMContentLoaded", () => App.init());
