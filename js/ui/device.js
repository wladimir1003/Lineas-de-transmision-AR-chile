const Device = {
  info() {
    const ua = navigator.userAgent || "";
    const platform = navigator.platform || "";

    const isIPad = /iPad/.test(ua) || (platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const isIPhone = /iPhone/.test(ua);
    const isIOS = isIPad || isIPhone || /iPod/.test(ua);
    const isAndroid = /Android/.test(ua);
    const isCriOS = /CriOS/.test(ua);
    const isChrome = /Chrome|CriOS/.test(ua) && !/Edg/.test(ua);
    const isSafari = /Safari/.test(ua) && !/Chrome|CriOS|FxiOS|EdgiOS/.test(ua);
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;

    return {
      ua,
      platform,
      isIPad,
      isIPhone,
      isIOS,
      isAndroid,
      isChrome,
      isSafari,
      isCriOS,
      isStandalone
    };
  },

  label() {
    const d = this.info();
    if (d.isIPad && d.isSafari) return "iPad Safari";
    if (d.isIPad && d.isCriOS) return "iPad Chrome";
    if (d.isIOS && d.isSafari) return "iPhone/iPad Safari";
    if (d.isIOS && d.isCriOS) return "iPhone/iPad Chrome";
    if (d.isAndroid && d.isChrome) return "Android Chrome";
    if (d.isAndroid) return "Android";
    if (d.isChrome) return "Chrome";
    if (d.isSafari) return "Safari";
    return "Navegador no identificado";
  }
};
