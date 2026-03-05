// src/services/trazasStore.ts


const STORAGE_KEY = "DGI_TRAZAS_EXTRA_V1";

/** Lee todo el mapa de trazas extra guardadas */
function readAll(): Record<string, any[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as Record<string, any[]>;
  } catch {
    return {};
  }
}

/** Guarda todo el mapa */
function writeAll(map: Record<string, any[]>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

/** Normaliza llave estable */
export function makeTrazaKey(ruc: string, tramite: string) {
  return `${(ruc ?? "").trim()}|${(tramite ?? "").trim()}`;
}

/** Obtiene trazas extra (las creadas desde comunicaciones) para una llave */
export function getExtraTrazas(key: string): any[] {
  const all = readAll();
  return Array.isArray(all[key]) ? all[key] : [];
}

/** Agrega una traza extra al inicio */
export function addExtraTraza(key: string, item: any) {
  const all = readAll();
  const prev = Array.isArray(all[key]) ? all[key] : [];
  all[key] = [item, ...prev];
  writeAll(all);
}

/** Reemplaza todas las extra (si lo necesitas en el futuro) */
export function setExtraTrazas(key: string, items: any[]) {
  const all = readAll();
  all[key] = items;
  writeAll(all);
}

/** Limpia extras de una llave (opcional, por si agregas botón después) */
export function clearExtraTrazas(key: string) {
  const all = readAll();
  delete all[key];
  writeAll(all);
}
