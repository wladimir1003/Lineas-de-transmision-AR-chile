const IDEEnergia = {
  async descargarArcGIS(baseUrl, nombre) {
    const pageSize = 1000;
    let offset = 0;
    let features = [];

    while (true) {
      UI.panel("Descargando " + nombre, [
        "Registros descargados: " + features.length,
        "Guardado final será en IndexedDB."
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

    return { type: "FeatureCollection", name: nombre, features };
  },

  async descargarDatosOficiales() {
    UI.panel("Descargando datos oficiales", [
      "Usando IndexedDB, no localStorage.",
      "Conectando con IDE Energía."
    ]);

    const lineas = await this.descargarArcGIS(APP_CONFIG.urls.lineas, "líneas");
    await DB.save("lineas", lineas);

    UI.panel("Líneas guardadas", [
      "Líneas: " + lineas.features.length,
      "Ahora descargando subestaciones."
    ]);

    const subestaciones = await this.descargarArcGIS(APP_CONFIG.urls.subestaciones, "subestaciones");
    await DB.save("subestaciones", subestaciones);

    await DB.save("metadata", {
      fecha: new Date().toISOString(),
      lineas: lineas.features.length,
      subestaciones: subestaciones.features.length
    });

    AppState.lineasGeoJSON = lineas;
    AppState.subestacionesGeoJSON = subestaciones;
    MapModule.dibujarCapas();

    UI.panel("Datos oficiales descargados y guardados", [
      "Líneas: " + lineas.features.length,
      "Subestaciones: " + subestaciones.features.length,
      "Guardado: IndexedDB",
      "Listo para uso offline."
    ], "ok");
  }
};
