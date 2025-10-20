// Clave única para localStorage
export const CASOS_KEY = "casosAprobacion" as const;

// Dispara un evento para notificar cambios (entre pantallas)

export const notifyAprobaciones = () =>
  window.dispatchEvent(new Event("casosAprobacion:update"));

// Lee todos los casos del storage (o arreglo vacío)
export const readCasos = <T = any>(): T[] => {
  try {
    const raw = localStorage.getItem(CASOS_KEY);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
};



// Devuelve solo los casos aprobados
export const readAprobados = <T = any>(): T[] =>
  readCasos<T>().filter((r: any) => (r?.estado ?? "Pendiente") === "Aprobado");
