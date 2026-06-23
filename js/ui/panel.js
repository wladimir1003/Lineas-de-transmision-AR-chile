const UI = {
  panel(titulo, filas, tipo = "warn") {
    const clase = tipo === "ok" ? "status-ok" : tipo === "bad" ? "status-bad" : "status-warn";
    document.getElementById("infoPanel").innerHTML =
      "<h2>" + titulo + "</h2>" +
      "<span class='" + clase + "'>Líneas Eléctricas Chile V3.1</span>" +
      filas.map(x => "<div class='data-row'>" + x + "</div>").join("") +
      "<div class='copyright'><b>Creado por Wladimir Campos</b><br>www.JFSasesorias.org</div>";
  },

  async estado() {
    let meta = null;
    try { meta = await DB.get("metadata"); } catch (e) {}

    const radio = document.getElementById("searchRadius").value;
    const modo = document.getElementById("radarMode").value;
    const d = Device.info();

    this.panel("Estado de la aplicación", [
      "Etapa: 3",
      "Dispositivo/navegador: " + Device.label(),
      "Modo instalada: " + (d.isStandalone ? "Sí" : "No"),
      "Almacenamiento: IndexedDB",
      "Radio: " + radio + " m",
      "Modo radar: " + textoModo(modo),
      "Conexión: " + (navigator.onLine ? "Con Internet" : "Sin Internet"),
      "Datos guardados: " + (meta ? "Sí" : "No"),
      "Fecha descarga: " + (meta ? new Date(meta.data.fecha).toLocaleString() : "Sin descarga"),
      "Líneas cargadas: " + (AppState.lineasGeoJSON?.features?.length || 0),
      "Subestaciones cargadas: " + (AppState.subestacionesGeoJSON?.features?.length || 0)
    ], "ok");
  }
};
