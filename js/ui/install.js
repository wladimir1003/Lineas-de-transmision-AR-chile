const InstallHelper = {
  deferredPrompt: null,

  init() {
    window.addEventListener("beforeinstallprompt", e => {
      e.preventDefault();
      this.deferredPrompt = e;
    });

    document.getElementById("btnInstallHelp").addEventListener("click", () => this.showHelp());
    document.getElementById("btnCloseInstall").addEventListener("click", () => this.close());
    document.getElementById("btnDoInstall").addEventListener("click", () => this.install());
  },

  showHelp() {
    const d = Device.info();
    const title = document.getElementById("installTitle");
    const text = document.getElementById("installText");
    const btn = document.getElementById("btnDoInstall");

    title.textContent = "Instalar / agregar a inicio";
    btn.classList.add("hidden");

    if (d.isStandalone) {
      text.innerHTML = "<p>La aplicación ya está funcionando como app instalada.</p>";
    } else if (d.isAndroid && d.isChrome) {
      text.innerHTML = `
        <p><b>Android Chrome detectado.</b></p>
        <p>Puedes instalar la app directamente si el navegador lo permite.</p>
        <ol>
          <li>Presiona <b>Instalar app</b>.</li>
          <li>Si no aparece, abre el menú ⋮ de Chrome.</li>
          <li>Elige <b>Agregar a pantalla principal</b> o <b>Instalar app</b>.</li>
        </ol>`;
      btn.classList.remove("hidden");
    } else if (d.isIPad && d.isSafari) {
      text.innerHTML = `
        <p><b>iPad Safari detectado.</b></p>
        <ol>
          <li>Presiona el botón <b>Compartir</b> de Safari.</li>
          <li>Selecciona <b>Agregar a pantalla de inicio</b>.</li>
          <li>Confirma el nombre <b>ElectroLíneas</b>.</li>
        </ol>
        <p>En iPad Safari esta es la forma correcta de instalar la PWA.</p>`;
    } else if (d.isIPad && d.isCriOS) {
      text.innerHTML = `
        <p><b>iPad Chrome detectado.</b></p>
        <p>En iPad, Chrome no instala PWA igual que Android.</p>
        <ol>
          <li>Abre esta misma URL en <b>Safari</b>.</li>
          <li>Presiona <b>Compartir</b>.</li>
          <li>Elige <b>Agregar a pantalla de inicio</b>.</li>
        </ol>`;
    } else if (d.isIOS) {
      text.innerHTML = `
        <p><b>iPhone/iPad detectado.</b></p>
        <ol>
          <li>Abre la página en <b>Safari</b>.</li>
          <li>Presiona <b>Compartir</b>.</li>
          <li>Elige <b>Agregar a pantalla de inicio</b>.</li>
        </ol>`;
    } else {
      text.innerHTML = `
        <p><b>${Device.label()} detectado.</b></p>
        <ol>
          <li>Busca en el menú del navegador la opción <b>Instalar app</b>.</li>
          <li>También puede aparecer como <b>Agregar a pantalla principal</b>.</li>
          <li>La página debe estar en HTTPS.</li>
        </ol>`;
      if (this.deferredPrompt) btn.classList.remove("hidden");
    }

    document.getElementById("installPanel").classList.remove("hidden");
  },

  close() {
    document.getElementById("installPanel").classList.add("hidden");
  },

  async install() {
    if (!this.deferredPrompt) {
      this.showHelp();
      return;
    }
    this.deferredPrompt.prompt();
    await this.deferredPrompt.userChoice;
    this.deferredPrompt = null;
    this.close();
  }
};
