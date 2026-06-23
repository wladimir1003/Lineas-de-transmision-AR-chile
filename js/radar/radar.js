const Radar = {
  visible: false,
  heading: 0,
  ultimoObjetivo: null,

  alternar() {
    this.visible = !this.visible;
    document.getElementById("radarPanel").classList.toggle("hidden", !this.visible);
    document.getElementById("btnRadar").classList.toggle("active", this.visible);
    this.pedirPermisoBrujula();
    this.actualizar();
  },

  async pedirPermisoBrujula() {
    try {
      if (typeof DeviceOrientationEvent !== "undefined" &&
          typeof DeviceOrientationEvent.requestPermission === "function") {
        await DeviceOrientationEvent.requestPermission();
      }

      window.addEventListener("deviceorientationabsolute", e => {
        if (e.alpha !== null) {
          this.heading = normalizar(360 - e.alpha);
          this.actualizar();
        }
      }, true);

      window.addEventListener("deviceorientation", e => {
        if (e.webkitCompassHeading) {
          this.heading = e.webkitCompassHeading;
          this.actualizar();
        } else if (e.alpha !== null) {
          this.heading = normalizar(360 - e.alpha);
          this.actualizar();
        }
      }, true);
    } catch (e) {
      console.warn("Brújula no disponible", e);
    }
  },

  detectarCercanos(lat, lng, precision) {
    const usuario = turf.point([lng, lat]);
    const radio = Number(document.getElementById("searchRadius").value || 150);
    const modo = document.getElementById("radarMode").value;

    let mejorLinea = null;
    let mejorPuntoLinea = null;
    let menorLinea = Infinity;

    for (const linea of (AppState.lineasGeoJSON?.features || [])) {
      if (!linea.geometry) continue;
      try {
        const punto = turf.nearestPointOnLine(linea, usuario, { units: "meters" });
        const d = punto.properties.dist || turf.distance(usuario, punto, { units: "meters" });
        if (d < menorLinea) {
          menorLinea = d;
          mejorLinea = linea;
          mejorPuntoLinea = punto;
        }
      } catch (e) {}
    }

    let mejorSub = null;
    let menorSub = Infinity;

    for (const sub of (AppState.subestacionesGeoJSON?.features || [])) {
      try {
        const d = turf.distance(usuario, sub, { units: "meters" });
        if (d < menorSub) {
          menorSub = d;
          mejorSub = sub;
        }
      } catch (e) {}
    }

    const objetivoLinea = this.crearObjetivo("línea", mejorLinea, mejorPuntoLinea, menorLinea, usuario);
    const objetivoSub = this.crearObjetivo("subestación", mejorSub, mejorSub, menorSub, usuario);

    if (modo === "line") this.ultimoObjetivo = objetivoLinea;
    else if (modo === "substation") this.ultimoObjetivo = objetivoSub;
    else if (modo === "both") this.ultimoObjetivo = objetivoLinea || objetivoSub;
    else {
      this.ultimoObjetivo = (objetivoLinea && objetivoSub)
        ? (objetivoLinea.distancia <= objetivoSub.distancia ? objetivoLinea : objetivoSub)
        : (objetivoLinea || objetivoSub);
    }

    this.mostrarResultado(mejorLinea, menorLinea, mejorSub, menorSub, precision, radio, modo);
    MapModule.resaltarLinea(mejorLinea);
    MapModule.marcarObjetivo(this.ultimoObjetivo);
    this.actualizar();
  },

  crearObjetivo(tipo, feature, pointFeature, distancia, usuario) {
    if (!feature || !pointFeature || !isFinite(distancia)) return null;
    const props = feature.properties || {};
    const nombre = campo(props, ["NOMBRE","nombre","Name"], tipo);
    const bearing = normalizar(turf.bearing(usuario, pointFeature));
    return { tipo, feature, point: pointFeature, distancia, bearing, nombre };
  },

  mostrarResultado(linea, distLinea, sub, distSub, precision, radio, modo) {
    const p = linea?.properties || {};
    const sp = sub?.properties || {};
    const dentro = linea && distLinea <= radio;

    if (!dentro) {
      UI.panel("Sin línea dentro del radio", [
        "Radio: " + radio + " m",
        "Distancia a línea: " + (isFinite(distLinea) ? distLinea.toFixed(1) + " m" : "s/i"),
        "Subestación cercana: " + campo(sp, ["NOMBRE","nombre","Name"], "s/i") + " (" + (isFinite(distSub) ? distSub.toFixed(0) + " m" : "s/i") + ")",
        "Modo radar: " + textoModo(modo),
        "Precisión GPS: ±" + precision.toFixed(1) + " m"
      ], "bad");
      return;
    }

    UI.panel(campo(p, ["NOMBRE","nombre","Name"], "Línea cercana"), [
      "Radio: " + radio + " m",
      "Distancia a línea: " + distLinea.toFixed(1) + " m",
      "Tensión: " + campo(p, ["TENSION_KV","voltaje_kv","Voltaje","kv"], "s/i") + " kV",
      "Propiedad: " + campo(p, ["PROPIEDAD","propietario","Propietario","OWNER"], "s/i"),
      "Tramo: " + campo(p, ["TRAMO","tramo","Tramo"], "s/i"),
      "Subestación cercana: " + campo(sp, ["NOMBRE","nombre","Name"], "s/i") + " (" + distSub.toFixed(0) + " m)",
      "Modo radar: " + textoModo(modo),
      "Precisión GPS: ±" + precision.toFixed(1) + " m"
    ], distLinea <= 30 ? "ok" : "warn");
  },

  actualizar() {
    if (!this.visible) return;

    const title = document.getElementById("radarTitle");
    const dist = document.getElementById("radarDistance");
    const bear = document.getElementById("radarBearing");
    const mode = document.getElementById("radarModeText");
    const arrow = document.getElementById("radarArrow");

    if (!this.ultimoObjetivo) {
      title.textContent = "Sin objetivo";
      dist.textContent = "Distancia: --";
      bear.textContent = "Rumbo: --";
      mode.textContent = "Modo: " + textoModo(document.getElementById("radarMode").value);
      return;
    }

    const relativo = normalizar(this.ultimoObjetivo.bearing - this.heading - 90);
    arrow.style.transform = "translate(-50%,-50%) rotate(" + relativo + "deg)";

    title.textContent = this.ultimoObjetivo.nombre;
    dist.textContent = "Distancia: " + this.ultimoObjetivo.distancia.toFixed(1) + " m";
    bear.textContent = "Rumbo: " + this.ultimoObjetivo.bearing.toFixed(0) + "° / " + rumboTexto(this.ultimoObjetivo.bearing);
    mode.textContent = "Objetivo: " + this.ultimoObjetivo.tipo + " · " + textoModo(document.getElementById("radarMode").value);
  }
};
