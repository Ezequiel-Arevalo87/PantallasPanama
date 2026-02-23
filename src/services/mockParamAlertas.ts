// src/services/mockParamAlertas.ts
export type AlertaParam = {
  actividad: string;

  // SLA total permitido (en días)
  totalDiasPermitidos: number;

  // Rangos por color (0-based: 0 = mismo día de asignación)
  verdeDesde: number;
  verdeHasta: number;
  amarilloDesde: number;
  amarilloHasta: number;
  rojoDesde: number;
  rojoHasta: number;
};

const LS_KEY = "paramAlertas:v1";

/**
 * ✅ Defaults tomados del cuadro "INVENTARIO DE ALERTAS TIEMPOS Y ESCALAMIENTOS"
 * Nota: se convirtieron a rangos 0-based:
 * - En el cuadro suelen estar como días 1..N (1-based)
 * - Aquí usamos diasTranscurridos 0..N-1
 */
export const DEFAULT_ALERTAS: AlertaParam[] = [
  {
    actividad: "CREACION  ACTA DE INICIO",
    totalDiasPermitidos: 1,
    verdeDesde: 0,
    verdeHasta: -1,
    amarilloDesde: -1,
    amarilloHasta: -1,
    rojoDesde: 0,
    rojoHasta: 0,
  },
  {
    actividad: "NOTIFICACION ACTA DE INICIO",
    totalDiasPermitidos: 1,
    verdeDesde: 0,
    verdeHasta: -1,
    amarilloDesde: -1,
    amarilloHasta: -1,
    rojoDesde: 0,
    rojoHasta: 0,
  },
  {
    actividad:
      "CREACION  INFORME DE AUDITORIA, ACTA DE CIERRE, PROPUESTA DE REGULARIZACION, RESOLUCION(ES)",
    totalDiasPermitidos: 45,
    verdeDesde: 0,
    verdeHasta: 29,
    amarilloDesde: 30,
    amarilloHasta: 39,
    rojoDesde: 40,
    rojoHasta: 44,
  },
  {
    actividad:
      "APROBACION INFORME  AUDITORIA,  ACTA DE CIERRE, PROPUESTA DE REGULARIZACION, RESOLUCION(ES)",
    totalDiasPermitidos: 3,
    verdeDesde: 0,
    verdeHasta: 0,
    amarilloDesde: 1,
    amarilloHasta: 1,
    rojoDesde: 2,
    rojoHasta: 2,
  },
  {
    actividad: "DILIGENCIA ACTA DE CIERRE",
    totalDiasPermitidos: 2,
    verdeDesde: 0,
    verdeHasta: -1,
    amarilloDesde: 0,
    amarilloHasta: 0,
    rojoDesde: 1,
    rojoHasta: 1,
  },
  {
    actividad: "AUTO DE ARCHIVO(IMPRODUCTIVO O PRESENTACION VOLUNTARIA",
    totalDiasPermitidos: 3,
    verdeDesde: 0,
    verdeHasta: 0,
    amarilloDesde: 1,
    amarilloHasta: 1,
    rojoDesde: 2,
    rojoHasta: 2,
  },
  {
    actividad: "APROBACION AUTO DE ARCHIVO",
    totalDiasPermitidos: 2,
    verdeDesde: 0,
    verdeHasta: -1,
    amarilloDesde: 0,
    amarilloHasta: 0,
    rojoDesde: 1,
    rojoHasta: 1,
  },
  {
    actividad: "RESPUESTA PROPUESTA REGULARIZACION",
    totalDiasPermitidos: 10,
    verdeDesde: 0,
    verdeHasta: 4,
    amarilloDesde: 5,
    amarilloHasta: 7,
    rojoDesde: 8,
    rojoHasta: 9,
  },
  {
    actividad: "ELABORACION RESOLUCION(ES) O ACTO ADMINISTRATIVO",
    totalDiasPermitidos: 10,
    verdeDesde: 0,
    verdeHasta: 4,
    amarilloDesde: 5,
    amarilloHasta: 7,
    rojoDesde: 8,
    rojoHasta: 9,
  },
  {
    actividad: "NOTIFICACION RESOLUCION(ES)",
    totalDiasPermitidos: 5,
    verdeDesde: 0,
    verdeHasta: 2,
    amarilloDesde: 3,
    amarilloHasta: 3,
    rojoDesde: 4,
    rojoHasta: 4,
  },
  {
    actividad: "RESPUESTA APELACION",
    totalDiasPermitidos: 30,
    verdeDesde: 0,
    verdeHasta: 19,
    amarilloDesde: 20,
    amarilloHasta: 24,
    rojoDesde: 25,
    rojoHasta: 29,
  },
];

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function normalizeActividad(s: string) {
  return (s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * ✅ Carga parametrización desde localStorage.
 * Si no existe, devuelve DEFAULT_ALERTAS (las actividades reales del cuadro).
 */
export function loadParamAlertas(): AlertaParam[] {
  const ls = safeParse<AlertaParam[]>(localStorage.getItem(LS_KEY));
  const data = Array.isArray(ls) ? ls : DEFAULT_ALERTAS;

  // Limpieza mínima: quitar duplicados por actividad normalizada
  const seen = new Set<string>();
  const out: AlertaParam[] = [];
  for (const p of data) {
    const k = normalizeActividad(p.actividad);
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(p);
  }

  return out;
}

/** ✅ Guarda parametrización (si tienes UI de editar alertas) */
export function saveParamAlertas(list: AlertaParam[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(list ?? []));
}

/** ✅ Reset rápido a defaults del cuadro */
export function resetParamAlertas() {
  localStorage.removeItem(LS_KEY);
}