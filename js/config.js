/*
ElectroLíneas Chile GPS
Creado por Wladimir Campos
www.JFSasesorias.org
*/
const APP_CONFIG = {
  name: "ElectroLíneas Chile GPS",
  stage: "Etapa 3",
  author: "Wladimir Campos",
  website: "www.JFSasesorias.org",
  urls: {
    lineas: "https://ide-energia.minenergia.cl/server/rest/services/IDE_Energia/Visor_IDE_Energ%C3%ADa/MapServer/10/query",
    subestaciones: "https://ide-energia.minenergia.cl/server/rest/services/IDE_Energia/Visor_IDE_Energ%C3%ADa/MapServer/8/query"
  },
  db: {
    name: "electrolineas_chile_gps_db",
    version: 1,
    storeName: "capas"
  }
};
