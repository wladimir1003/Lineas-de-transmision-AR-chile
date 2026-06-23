function campo(obj, nombres, defecto) {
  for (const n of nombres) {
    if (obj[n] !== undefined && obj[n] !== null && obj[n] !== "") return obj[n];
  }
  return defecto;
}

function normalizar(g) {
  return ((g % 360) + 360) % 360;
}

function rumboTexto(g) {
  const dirs = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"];
  return dirs[Math.round(normalizar(g) / 45) % 8];
}

function colorPorVoltaje(p) {
  const v = Number(campo(p, ["TENSION_KV", "voltaje_kv", "Voltaje", "SUBTIPO", "kv"], 0));
  if (v >= 500) return "#d00000";
  if (v >= 220) return "#ff8c00";
  if (v >= 154) return "#cc00ff";
  if (v >= 110) return "#0066ff";
  if (v >= 66) return "#00a651";
  return "#555555";
}

function textoModo(modo) {
  if (modo === "line") return "Línea eléctrica";
  if (modo === "substation") return "Subestación";
  if (modo === "both") return "Ambas";
  return "Más cercano";
}
