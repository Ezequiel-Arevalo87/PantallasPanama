// ==========================================
// src/lib/aprobacionesStorage.ts
// ==========================================

// Clave única
export const CASOS_KEY = "casosAprobacion" as const;

// Notificar cambios globales
export const notifyAprobaciones = () =>
  window.dispatchEvent(new Event("casosAprobacion:update"));

// Leer storage
export const readCasos = <T = any>(): T[] => {
  try {
    const raw = localStorage.getItem(CASOS_KEY);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
};

// Guardar lista completa
export const writeCasos = (rows: any[]) => {
  localStorage.setItem(CASOS_KEY, JSON.stringify(rows));
  notifyAprobaciones();
};

// Actualizar registros
export const updateCasos = (fn: (row: any) => any) => {
  const rows = readCasos<any>();
  const updated = rows.map(fn);
  writeCasos(updated);
  return updated;
};

// Casos aprobados por estadoVerif
export const readAprobados = <T = any>(): T[] =>
  readCasos<T>().filter(
    (r: any) => (r?.estadoVerif ?? "Pendiente") === "Aprobado"
  );

// Generador incremental de AUTO DE APERTURA
export const nextNumeroAuto = (): string => {
  const key = "AUTO_APERTURA_SEQ";
  const current = Number(localStorage.getItem(key) || "0") + 1;
  localStorage.setItem(key, String(current));

  const year = new Date().getFullYear();
  return `AA-${year}-${String(current).padStart(4, "0")}`;
};
