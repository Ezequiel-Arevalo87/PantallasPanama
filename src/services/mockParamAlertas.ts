// src/services/mockParamAlertas.ts

export type FrecuenciaCorreo = "Unica" | "Diaria" | "Semanal";

export type AlertaParam = {
  id: string;

  actividad: string;
  producto: string;
  rolResponsable: string;

  totalDiasPermitidos: number;

  verdeDesde: number;
  verdeHasta: number;

  amarilloDesde: number;
  amarilloHasta: number;

  rojoDesde: number;
  rojoHasta: number;

  escalamientoAmarilloRol1: string;
  escalamientoRojoRol1: string;
  escalamientoRojoRol2: string;
  escalamientoRojoRol3?: string;

  canalEnvioHome: boolean;
  canalEnvioCorreo: boolean;
  frecuenciaCorreo: FrecuenciaCorreo;

  generaIndicadorConsolidado: boolean;
  observaciones?: string;
};

/**
 * ✅ Catálogo base para el botón "Nueva regla"
 * (así ParametrizacionAlertas.tsx NO falla)
 */
export const ACTIVIDADES_BASE: Array<{
  actividad: string;
  producto: string;
  rol: string;
}> = [
  { actividad: "Informe de Auditoría (706)", producto: "Informe Auditoría", rol: "Auditor" },
  { actividad: "Verificación de Inconsistencias", producto: "Verificación", rol: "Analista" },
  { actividad: "Requerimiento (documentación)", producto: "Requerimientos", rol: "Auditor" },
  { actividad: "Caso Omiso (apertura)", producto: "Omiso", rol: "Jefe de Seccion" },
  { actividad: "Acta de Cierre (799)", producto: "Cierre", rol: "Auditor" },
];

const LS_KEY = "DGI_PARAM_ALERTAS_V1";

function uid(prefix = "ALERTA") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

/**
 * ✅ Semilla: incluye las actividades del HOME (para que NO salga "Sin SLA")
 */
export function buildSeedParamAlertas(): AlertaParam[] {
  return [
    {
      id: uid(),
      actividad: "Informe de Auditoría (706)",
      producto: "Informe Auditoría",
      rolResponsable: "Auditor",
      totalDiasPermitidos: 20,
      verdeDesde: 1,
      verdeHasta: 14,
      amarilloDesde: 15,
      amarilloHasta: 18,
      rojoDesde: 19,
      rojoHasta: 20,
      escalamientoAmarilloRol1: "Supervisor",
      escalamientoRojoRol1: "Supervisor",
      escalamientoRojoRol2: "Jefe de Seccion",
      escalamientoRojoRol3: "Direccion",
      canalEnvioHome: true,
      canalEnvioCorreo: true,
      frecuenciaCorreo: "Diaria",
      generaIndicadorConsolidado: true,
      observaciones: "Semilla para HOME (auditoría)",
    },
    {
      id: uid(),
      actividad: "Verificación de Inconsistencias",
      producto: "Verificación",
      rolResponsable: "Analista",
      totalDiasPermitidos: 15,
      verdeDesde: 1,
      verdeHasta: 10,
      amarilloDesde: 11,
      amarilloHasta: 13,
      rojoDesde: 14,
      rojoHasta: 15,
      escalamientoAmarilloRol1: "Supervisor",
      escalamientoRojoRol1: "Supervisor",
      escalamientoRojoRol2: "Jefe de Seccion",
      escalamientoRojoRol3: "Direccion",
      canalEnvioHome: true,
      canalEnvioCorreo: false,
      frecuenciaCorreo: "Diaria",
      generaIndicadorConsolidado: true,
      observaciones: "Semilla para HOME (verificación)",
    },
    {
      id: uid(),
      actividad: "Requerimiento (documentación)",
      producto: "Requerimientos",
      rolResponsable: "Auditor",
      totalDiasPermitidos: 30,
      verdeDesde: 1,
      verdeHasta: 20,
      amarilloDesde: 21,
      amarilloHasta: 27,
      rojoDesde: 28,
      rojoHasta: 30,
      escalamientoAmarilloRol1: "Supervisor",
      escalamientoRojoRol1: "Supervisor",
      escalamientoRojoRol2: "Jefe de Seccion",
      escalamientoRojoRol3: "Direccion",
      canalEnvioHome: true,
      canalEnvioCorreo: true,
      frecuenciaCorreo: "Semanal",
      generaIndicadorConsolidado: true,
      observaciones: "Semilla para HOME (espera contribuyente)",
    },
    {
      id: uid(),
      actividad: "Caso Omiso (apertura)",
      producto: "Omiso",
      rolResponsable: "Jefe de Seccion",
      totalDiasPermitidos: 10,
      verdeDesde: 1,
      verdeHasta: 6,
      amarilloDesde: 7,
      amarilloHasta: 8,
      rojoDesde: 9,
      rojoHasta: 10,
      escalamientoAmarilloRol1: "Supervisor",
      escalamientoRojoRol1: "Jefe de Seccion",
      escalamientoRojoRol2: "Direccion",
      escalamientoRojoRol3: "",
      canalEnvioHome: true,
      canalEnvioCorreo: true,
      frecuenciaCorreo: "Diaria",
      generaIndicadorConsolidado: true,
      observaciones: "Semilla para HOME (omisos)",
    },
    {
      id: uid(),
      actividad: "Acta de Cierre (799)",
      producto: "Cierre",
      rolResponsable: "Auditor",
      totalDiasPermitidos: 10,
      verdeDesde: 1,
      verdeHasta: 7,
      amarilloDesde: 8,
      amarilloHasta: 9,
      rojoDesde: 10,
      rojoHasta: 10,
      escalamientoAmarilloRol1: "Supervisor",
      escalamientoRojoRol1: "Jefe de Seccion",
      escalamientoRojoRol2: "Direccion",
      escalamientoRojoRol3: "",
      canalEnvioHome: true,
      canalEnvioCorreo: true,
      frecuenciaCorreo: "Diaria",
      generaIndicadorConsolidado: true,
      observaciones: "Semilla extra",
    },
  ];
}

export function loadParamAlertas(): AlertaParam[] {
  const seed = buildSeedParamAlertas();

  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) {
      localStorage.setItem(LS_KEY, JSON.stringify(seed));
      return seed;
    }

    const parsed = JSON.parse(raw);
    const current: AlertaParam[] = Array.isArray(parsed) ? (parsed as AlertaParam[]) : [];

    // ✅ MERGE: si faltan actividades del seed, las agrega sin borrar lo existente
    const norm = (s: string) =>
      (s ?? "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\([^)]*\)/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    const byKey = new Map<string, AlertaParam>();
    current.forEach((r) => byKey.set(norm(r.actividad), r));

    let changed = false;

    for (const s of seed) {
      const k = norm(s.actividad);
      if (!byKey.has(k)) {
        current.push(s);
        byKey.set(k, s);
        changed = true;
      }
    }

    if (changed) {
      localStorage.setItem(LS_KEY, JSON.stringify(current));
    }

    return current.length ? current : seed;
  } catch {
    localStorage.setItem(LS_KEY, JSON.stringify(seed));
    return seed;
  }
}


export function saveParamAlertas(rows: AlertaParam[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(rows));
}

export function resetParamAlertas(): AlertaParam[] {
  const seed = buildSeedParamAlertas();
  localStorage.setItem(LS_KEY, JSON.stringify(seed));
  return seed;
}
