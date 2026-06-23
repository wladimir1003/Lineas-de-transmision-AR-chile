const GPS = {
  watchId: null,

  activar() {
    if (!navigator.geolocation) {
      alert("Este dispositivo no soporta GPS.");
      return;
    }

    if (this.watchId) navigator.geolocation.clearWatch(this.watchId);

    this.watchId = navigator.geolocation.watchPosition(pos => {
      AppState.ultimaPosicion = pos;
      MapModule.actualizarUsuario(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy);
      Radar.detectarCercanos(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy);
    }, err => {
      UI.panel("GPS no disponible", [
        err.message,
        "Activa permisos de ubicación.",
        "En iPad/Chrome revisa Ajustes > Chrome > Ubicación.",
        "Usa HTTPS, por ejemplo GitHub Pages."
      ], "bad");
    }, {
      enableHighAccuracy: true,
      maximumAge: 1000,
      timeout: 15000
    });
  }
};
