// ==========================================
// src/lib/aprobacionesStorage.ts (FINAL)
// ==========================================

// Clave única para todos los casos del flujo
export const CASOS_KEY = "casosAprobacion" as const;

// Dispara un evento global para que Home, Verificación, Aprobación y Asignación recarguen datos
export const notifyAprobaciones = () =>
  window.dispatchEvent(new Event("casosAprobacion:update"));

/* ==========================================
   LEER – SIEMPRE DEVUELVE UN ARREGLO VÁLIDO
========================================== */
export const readCasos = <T = any>(): T[] => {
  try {
    const raw = localStorage.getItem(CASOS_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? (list as T[]) : [];
  } catch {
    return [];
  }
};

/* ==========================================
   GUARDAR – reescribe todo y notifica
========================================== */
export const writeCasos = (rows: any[]) => {
  try {
    localStorage.setItem(CASOS_KEY, JSON.stringify(rows));
  } catch {
    /* ignoramos para no romper interfaz */
  }
  notifyAprobaciones();
};

/* ==========================================
   ACTUALIZAR – modifica solo registros tocados
========================================== */
export const updateCasos = (fn: (row: any) => any) => {
  const rows = readCasos<any>();
  const updated = rows.map(fn);
  writeCasos(updated);
  return updated;
};

/* ==========================================
   LEER SOLO APROBADOS
========================================== */
export const readAprobados = <T = any>(): T[] =>
  readCasos<T>().filter(
    (r: any) => (r?.estadoVerif ?? "Pendiente") === "Aprobado"
  );

/* ==========================================
   GENERADOR DE AUTO DE APERTURA
   Secuencial, persistente y formateado
   AA-2025-0001
========================================== */
export const nextNumeroAuto = (): string => {
  const key = "AUTO_APERTURA_SEQ";
  const current = Number(localStorage.getItem(key) || "0") + 1;

  localStorage.setItem(key, String(current));

  const year = new Date().getFullYear();
  return `AA-${year}-${String(current).padStart(4, "0")}`;
};
