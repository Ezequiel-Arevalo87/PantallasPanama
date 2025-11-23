// ==========================================
// src/lib/aprobacionesStorage.ts
// ==========================================

// Clave única para localStorage
export const CASOS_KEY = "casosAprobacion" as const;

// Notificar cambio a todas las pantallas (Home, Verificación, Aprobaciones…)
export const notifyAprobaciones = () =>
  window.dispatchEvent(new Event("casosAprobacion:update"));

// Leer todos los casos del storage
export const readCasos = <T = any>(): T[] => {
  try {
    const raw = localStorage.getItem(CASOS_KEY);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
};

// Guardar lista completa de casos
export const writeCasos = (rows: any[]) => {
  localStorage.setItem(CASOS_KEY, JSON.stringify(rows));
  notifyAprobaciones();
};

// Actualizar uno o más casos con una función de transformación
export const updateCasos = (fn: (row: any) => any) => {
  const rows = readCasos<any>();
  const updated = rows.map(fn);
  writeCasos(updated);
  return updated;
};

// Devuelve solo los casos aprobados según estadoVerif
export const readAprobados = <T = any>(): T[] =>
  readCasos<T>().filter(
    (r: any) => (r?.estadoVerif ?? "Pendiente") === "Aprobado"
  );

// Devuelve solo los pendientes de verificación
export const readPendientesVerif = <T = any>(): T[] =>
  readCasos<T>().filter(
    (r: any) => (r?.estadoVerif ?? "Pendiente") === "Pendiente"
  );

// Devuelve los que ya pasaron verificación y van a aprobación
export const readParaAprobacion = <T = any>(): T[] =>
  readCasos<T>().filter(
    (r: any) => (r?.estadoVerif ?? "Pendiente") === "ParaAprobacion"
  );
