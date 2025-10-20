// src/lib/workflowStorage.ts

// ===== Clave y eventos =====
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

// ===== Tipos de flujo =====
export type FaseFlujo =
  | "SELECTOR DE CASOS Y PRIORIZACIÓN"
  | "VERIFICACIÓN"
  | "APROBACIÓN"
  | "ASIGNACIÓN"
  | "INICIO DE AUDITORIA";

export type PasoHistorial = {
  idPaso: string;
  from?: FaseFlujo | null;
  to: FaseFlujo;
  by: string;
  note?: string;
  at: string;
};

export type CasoFlujo = {
  id: string | number;
  ruc: string;
  nombre: string;
  categoria?: string;
  estado?: string;
  fase?: FaseFlujo;
  history?: PasoHistorial[];
};

// ===== Helpers =====
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

export const readCasosOrdenados = (): CasoFlujo[] => {
  const cs = readCasos<CasoFlujo>();
  return [...cs].sort((a, b) => {
    const ax = a.history?.[a.history.length - 1]?.at ?? "";
    const bx = b.history?.[b.history.length - 1]?.at ?? "";
    return bx.localeCompare(ax);
  });
};
