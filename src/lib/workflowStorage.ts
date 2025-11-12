// src/lib/workflowStorage.ts
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

// ⬇️⬇️⬇️ AGREGA AQUÍ LAS FASES QUE USAS EN Home.tsx
export type FaseFlujo =
  | "SELECTOR DE CASOS Y PRIORIZACIÓN"
  | "VERIFICACIÓN"
  | "APROBACIÓN"
  | "ASIGNACIÓN"
  | "INICIO DE AUDITORIA"
  | "REVISIÓN SUPERVISOR"
  | "REVISIÓN JEFE DE SECCIÓN"
  | "NOTIFICACIÓN ACTA DE INICIO" // ⬅️ NUEVA FASE
  | "CIERRE";

export type PasoHistorial = {
  idPaso: string;
  from?: FaseFlujo | null;
  to: FaseFlujo;
  by: string;
  note?: string;
  at: string;               // ISO
  deadline?: string | null; // opcional
};

export type CasoFlujo = {
  id: string | number;
  ruc: string;
  nombre: string;
  categoria?: string;
  estado?: string;
  fase?: FaseFlujo;
  deadline?: string | null; // opcional
  history?: PasoHistorial[];
};

const writeCasos = (casos: CasoFlujo[]) => {
  localStorage.setItem(CASOS_KEY, JSON.stringify(casos));
  notifyAprobaciones();
};

// ⚠️ EXPORTA uuid para usarlo desde Home.tsx
export const uuid = () => Math.random().toString(36).slice(2, 10);

export const getNextFase = (fase?: FaseFlujo | null): FaseFlujo | null => {
  // ⬇️⬇️⬇️ ACTUALIZA EL ORDEN PARA INCLUIR LAS NUEVAS FASES
  const orden: FaseFlujo[] = [
    "SELECTOR DE CASOS Y PRIORIZACIÓN",
    "VERIFICACIÓN",
    "APROBACIÓN",
    "ASIGNACIÓN",
    "INICIO DE AUDITORIA",
    "REVISIÓN SUPERVISOR",
    "REVISIÓN JEFE DE SECCIÓN",
    "CIERRE",
  ];
  const i = orden.indexOf(fase ?? "SELECTOR DE CASOS Y PRIORIZACIÓN");
  return i >= 0 && i < orden.length - 1 ? orden[i + 1] : null;
};

export type AvanzarOpts = {
  id: string | number;
  to: FaseFlujo;
  by: string;
  note?: string;
  deadline?: string | null;
};

export const upsertCaso = (nuevo: CasoFlujo) => {
  const casos = readCasos<CasoFlujo>();
  const idx = casos.findIndex((c) => String(c.id) === String(nuevo.id));
  if (idx >= 0) casos[idx] = { ...casos[idx], ...nuevo };
  else casos.push(nuevo);
  writeCasos(casos);
  return nuevo;
};

export const avanzarCaso = (opts: AvanzarOpts) => {
  const { id, to, by, note, deadline } = opts;
  const casos = readCasos<CasoFlujo>();
  const i = casos.findIndex((c) => String(c.id) === String(id));
  const now = new Date().toISOString();

  if (i >= 0) {
    const from = casos[i].fase ?? null;
    casos[i] = {
      ...casos[i],
      fase: to,
      ...(typeof deadline !== "undefined" ? { deadline } : {}),
      history: [
        ...(casos[i].history ?? []),
        {
          idPaso: uuid(),
          from,
          to,
          by,
          note,
          at: now,
          deadline:
            typeof deadline !== "undefined" ? deadline : casos[i].deadline ?? null,
        },
      ],
    };
  } else {
    casos.push({
      id,
      ruc: "",
      nombre: "",
      fase: to,
      deadline: typeof deadline !== "undefined" ? deadline : null,
      history: [
        {
          idPaso: uuid(),
          from: null,
          to,
          by,
          note,
          at: now,
          deadline: typeof deadline !== "undefined" ? deadline : null,
        },
      ],
    });
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
