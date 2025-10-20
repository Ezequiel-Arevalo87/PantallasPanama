// src/lib/workflowStorage.ts
// ===== Clave y eventos ya existentes =====
export const CASOS_KEY = "casosAprobacion" as const;
export const notifyAprobaciones = () =>
  window.dispatchEvent(new Event("casosAprobacion:update"));

export const readCasos = <T = any>(): T[] => {
  try {
    const raw = localStorage.getItem(CASOS_KEY);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
};
export const readAprobados = <T = any>(): T[] =>
  readCasos<T>().filter((r: any) => (r?.estado ?? "Pendiente") === "Aprobado");

// ====== NUEVO: Tipos de flujo e historial ======
export type FaseFlujo =
  | "SELECTOR DE CASOS Y PRIORIZACIÓN"
  | "VERIFICACIÓN"
  | "APROBACIÓN"
  | "ASIGNACIÓN"
  | "INICIO DE AUDITORIA"; // final

export type PasoHistorial = {
  idPaso: string;           // uuid simple
  from?: FaseFlujo | null;  // fase origen
  to: FaseFlujo;            // fase destino
  by: string;               // quién asignó
  note?: string;            // opcional
  at: string;               // ISO datetime
};

export type CasoFlujo = {
  id: string | number;
  ruc: string;
  nombre: string;
  categoria?: string;
  // tu app puede traer más campos...
  estado?: string;          // (compatibilidad con tu módulo Aprobaciones)
  fase?: FaseFlujo;         // fase actual del flujo (nuevo)
  history?: PasoHistorial[]; // historial de asignaciones (nuevo)
};

// ====== NUEVO: helpers de escritura / actualización ======
const writeCasos = (casos: CasoFlujo[]) => {
  localStorage.setItem(CASOS_KEY, JSON.stringify(casos));
  notifyAprobaciones();
};

export const upsertCaso = (nuevo: CasoFlujo) => {
  const casos = readCasos<CasoFlujo>();
  const idx = casos.findIndex((c) => String(c.id) === String(nuevo.id));
  if (idx >= 0) casos[idx] = { ...casos[idx], ...nuevo };
  else casos.push(nuevo);
  writeCasos(casos);
  return nuevo;
};

export const getNextFase = (fase?: FaseFlujo | null): FaseFlujo | null => {
  const orden: FaseFlujo[] = [
    "SELECTOR DE CASOS Y PRIORIZACIÓN",
    "VERIFICACIÓN",
    "APROBACIÓN",
    "ASIGNACIÓN",
    "INICIO DE AUDITORIA",
  ];
  const i = orden.indexOf(fase ?? "SELECTOR DE CASOS Y PRIORIZACIÓN");
  return i >= 0 && i < orden.length - 1 ? orden[i + 1] : null;
};

const uuid = () => Math.random().toString(36).slice(2, 10);

/**
 * Avanza un caso a 'to'. Registra quién lo asignó y una nota opcional.
 * Si el caso no existe, lo crea con fase = to.
 */
export const avanzarCaso = (opts: {
  id: string | number;
  to: FaseFlujo;
  by: string;
  note?: string;
}) => {
  const { id, to, by, note } = opts;
  const casos = readCasos<CasoFlujo>();
  const i = casos.findIndex((c) => String(c.id) === String(id));
  const now = new Date().toISOString();

  if (i >= 0) {
    const from = casos[i].fase ?? null;
    const paso: PasoHistorial = { idPaso: uuid(), from, to, by, note, at: now };
    casos[i] = {
      ...casos[i],
      fase: to,
      history: [...(casos[i].history ?? []), paso],
    };
  } else {
    const paso: PasoHistorial = { idPaso: uuid(), from: null, to, by, note, at: now };
    casos.push({ id, ruc: "", nombre: "", fase: to, history: [paso] });
  }

  writeCasos(casos);
};

export const marcarAprobado = (id: string | number) => {
  const casos = readCasos<CasoFlujo>();
  const i = casos.findIndex((c) => String(c.id) === String(id));
  if (i >= 0) {
    casos[i].estado = "Aprobado";
    writeCasos(casos);
  }
};

// Conveniencia: últimos primero para la bandeja
export const readCasosOrdenados = (): CasoFlujo[] => {
  const cs = readCasos<CasoFlujo>();
  return [...cs].sort((a, b) => {
    const ax = a.history?.[a.history.length - 1]?.at ?? "";
    const bx = b.history?.[b.history.length - 1]?.at ?? "";
    return bx.localeCompare(ax);
  });
};
