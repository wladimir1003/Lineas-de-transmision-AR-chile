# ElectroLíneas Chile GPS Offline

Aplicación PWA para GitHub Pages que detecta líneas de transmisión y subestaciones cercanas en Chile usando GPS.

## Funciones

- GPS en tiempo real.
- Descarga de datos oficiales desde IDE Energía.
- Guardado local para uso offline.
- Mapa con líneas y subestaciones.
- Detección de línea más cercana.
- Distancia, rumbo y radar.
- Subestación más cercana.

## Cómo subir a GitHub Pages

1. Crea un repositorio nuevo, por ejemplo `electrolineas-chile-gps`.
2. Sube todos los archivos de esta carpeta.
3. Entra a `Settings > Pages`.
4. Selecciona `Deploy from a branch`.
5. Branch: `main`. Folder: `/root`.
6. Abre la URL HTTPS generada por GitHub Pages.

## Uso

1. Abre la app con Internet la primera vez.
2. Presiona **Descargar datos oficiales**.
3. Presiona **Activar GPS**.
4. Luego puedes usarla sin Internet con los datos guardados.

## Importante

El GPS requiere HTTPS. GitHub Pages ya entrega HTTPS.

El mapa base de OpenStreetMap puede necesitar Internet si no fue cargado antes. Las líneas y subestaciones descargadas quedan guardadas localmente.

## Archivos principales

```text
index.html
css/styles.css
js/app.js
manifest.json
service-worker.js
data/lineas_transmision.geojson
data/subestaciones.geojson
assets/icon.svg
```
