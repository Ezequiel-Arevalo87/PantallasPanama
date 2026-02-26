// src/services/mockParamAlertas.ts
export type FrecuenciaCorreo = "Unica" | "Diaria" | "Semanal";

export type AlertaParam = {
  id: string;

  actividad: string;
  /** ✅ puede ser "" (vacío) */
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
  escalamientoRojoRol3: string;

  canalEnvioHome: boolean;
  canalEnvioCorreo: boolean;
  frecuenciaCorreo: FrecuenciaCorreo;

  generaIndicadorConsolidado: boolean;
  observaciones: string;
};

type MatrizRow = Omit<AlertaParam, "id">;

/**
 * ✅ MATRIZ según tu Excel (productos solo donde aplica)
 * IMPORTANTE: "borradores" se queda SOLO en ACTIVIDAD, NO en PRODUCTO.
 */
const MATRIZ_EXCEL: MatrizRow[] = [
  // ACTA DE INICIO (producto = ACTA DE INICIO)
  {
    actividad: "CREACION  ACTA DE INICIO",
    producto: "ACTA DE INICIO",
    rolResponsable: "Auditor",
    totalDiasPermitidos: 5,
    verdeDesde: 1,
    verdeHasta: 3,
    amarilloDesde: 4,
    amarilloHasta: 4,
    rojoDesde: 5,
    rojoHasta: 5,
    escalamientoAmarilloRol1: "Supervisor",
    escalamientoRojoRol1: "Jefe de Seccion",
    escalamientoRojoRol2: "Director DGI",
    escalamientoRojoRol3: "",
    canalEnvioHome: true,
    canalEnvioCorreo: true,
    frecuenciaCorreo: "Diaria",
    generaIndicadorConsolidado: true,
    observaciones: "",
  },
  {
    actividad: "APROBACION ACTA DE INICIO",
    producto: "ACTA DE INICIO",
    rolResponsable: "Supervisor",
    totalDiasPermitidos: 3,
    verdeDesde: 1,
    verdeHasta: 2,
    amarilloDesde: 3,
    amarilloHasta: 3,
    rojoDesde: 3,
    rojoHasta: 3,
    escalamientoAmarilloRol1: "Jefe de Seccion",
    escalamientoRojoRol1: "Director DGI",
    escalamientoRojoRol2: "",
    escalamientoRojoRol3: "",
    canalEnvioHome: true,
    canalEnvioCorreo: true,
    frecuenciaCorreo: "Diaria",
    generaIndicadorConsolidado: true,
    observaciones: "",
  },
  {
    actividad: "NOTIFICACION ACTA DE INICIO",
    producto: "ACTA DE INICIO",
    rolResponsable: "Auditor",
    totalDiasPermitidos: 5,
    verdeDesde: 1,
    verdeHasta: 3,
    amarilloDesde: 4,
    amarilloHasta: 4,
    rojoDesde: 5,
    rojoHasta: 5,
    escalamientoAmarilloRol1: "Supervisor",
    escalamientoRojoRol1: "Jefe de Seccion",
    escalamientoRojoRol2: "Director DGI",
    escalamientoRojoRol3: "",
    canalEnvioHome: true,
    canalEnvioCorreo: true,
    frecuenciaCorreo: "Diaria",
    generaIndicadorConsolidado: true,
    observaciones: "",
  },

  // PRODUCTO LARGO (Informe/Acta Cierre/Propuesta/Resolución) -> NO lleva "borradores"
  {
    actividad:
      "CREACION  INFORME DE AUDITORIA, ACTA DE CIERRE, PROPUESTA DE REGULARIZACION, RESOLUCION(ES) borradores",
    producto:
      "INFORME DE AUDITORIA,\nACTA DE CIERRE,\nPROPUESTA DE REGULARIZACION,\nRESOLUCION(ES)",
    rolResponsable: "Auditor",
    totalDiasPermitidos: 20,
    verdeDesde: 1,
    verdeHasta: 12,
    amarilloDesde: 13,
    amarilloHasta: 16,
    rojoDesde: 17,
    rojoHasta: 20,
    escalamientoAmarilloRol1: "Supervisor",
    escalamientoRojoRol1: "Jefe de Seccion",
    escalamientoRojoRol2: "Director DGI",
    escalamientoRojoRol3: "",
    canalEnvioHome: true,
    canalEnvioCorreo: true,
    frecuenciaCorreo: "Semanal",
    generaIndicadorConsolidado: true,
    observaciones: "",
  },
  {
    actividad:
      "APROBACION INFORME  AUDITORIA,  ACTA DE CIERRE, PROPUESTA DE REGULARIZACION, RESOLUCION(ES) borradores",
    producto:
      "INFORME DE AUDITORIA,\nACTA DE CIERRE,\nPROPUESTA DE REGULARIZACION,\nRESOLUCION(ES)",
    rolResponsable: "Jefe de Seccion",
    totalDiasPermitidos: 7,
    verdeDesde: 1,
    verdeHasta: 4,
    amarilloDesde: 5,
    amarilloHasta: 6,
    rojoDesde: 7,
    rojoHasta: 7,
    escalamientoAmarilloRol1: "Director DGI",
    escalamientoRojoRol1: "Director DGI",
    escalamientoRojoRol2: "",
    escalamientoRojoRol3: "",
    canalEnvioHome: true,
    canalEnvioCorreo: true,
    frecuenciaCorreo: "Diaria",
    generaIndicadorConsolidado: true,
    observaciones: "",
  },

  // Sin producto (vacío)
  {
    actividad: "DILIGENCIA ACTA DE CIERRE",
    producto: "",
    rolResponsable: "Auditor",
    totalDiasPermitidos: 10,
    verdeDesde: 1,
    verdeHasta: 6,
    amarilloDesde: 7,
    amarilloHasta: 8,
    rojoDesde: 9,
    rojoHasta: 10,
    escalamientoAmarilloRol1: "Supervisor",
    escalamientoRojoRol1: "Jefe de Seccion",
    escalamientoRojoRol2: "Director DGI",
    escalamientoRojoRol3: "",
    canalEnvioHome: true,
    canalEnvioCorreo: true,
    frecuenciaCorreo: "Diaria",
    generaIndicadorConsolidado: true,
    observaciones: "",
  },

  // AUTO DE ARCHIVO (producto = AUTO DE ARCHIVO)
  {
    actividad: "AUTO DE ARCHIVO(IMPRODUCTIVO O PRESENTACION VOLUNTARIA",
    producto: "AUTO DE ARCHIVO",
    rolResponsable: "Auditor",
    totalDiasPermitidos: 8,
    verdeDesde: 1,
    verdeHasta: 5,
    amarilloDesde: 6,
    amarilloHasta: 7,
    rojoDesde: 8,
    rojoHasta: 8,
    escalamientoAmarilloRol1: "Supervisor",
    escalamientoRojoRol1: "Jefe de Seccion",
    escalamientoRojoRol2: "",
    escalamientoRojoRol3: "",
    canalEnvioHome: true,
    canalEnvioCorreo: false,
    frecuenciaCorreo: "Diaria",
    generaIndicadorConsolidado: true,
    observaciones: "",
  },
  {
    actividad: "APROBACION AUTO DE ARCHIVO",
    producto: "AUTO DE ARCHIVO",
    rolResponsable: "Supervisor",
    totalDiasPermitidos: 5,
    verdeDesde: 1,
    verdeHasta: 3,
    amarilloDesde: 4,
    amarilloHasta: 4,
    rojoDesde: 5,
    rojoHasta: 5,
    escalamientoAmarilloRol1: "Jefe de Seccion",
    escalamientoRojoRol1: "Director DGI",
    escalamientoRojoRol2: "",
    escalamientoRojoRol3: "",
    canalEnvioHome: true,
    canalEnvioCorreo: true,
    frecuenciaCorreo: "Diaria",
    generaIndicadorConsolidado: true,
    observaciones: "",
  },

  // Resto sin producto (vacío) como en tu Excel
  {
    actividad: "RESPUESTA PROPUESTA REGULARIZACION",
    producto: "",
    rolResponsable: "Contribuyente",
    totalDiasPermitidos: 15,
    verdeDesde: 1,
    verdeHasta: 10,
    amarilloDesde: 11,
    amarilloHasta: 13,
    rojoDesde: 14,
    rojoHasta: 15,
    escalamientoAmarilloRol1: "Auditor",
    escalamientoRojoRol1: "Supervisor",
    escalamientoRojoRol2: "Jefe de Seccion",
    escalamientoRojoRol3: "",
    canalEnvioHome: true,
    canalEnvioCorreo: true,
    frecuenciaCorreo: "Semanal",
    generaIndicadorConsolidado: true,
    observaciones: "",
  },
  {
    actividad: "ENVIO CUENTA CORRIENTE",
    producto: "",
    rolResponsable: "Auditor",
    totalDiasPermitidos: 5,
    verdeDesde: 1,
    verdeHasta: 3,
    amarilloDesde: 4,
    amarilloHasta: 4,
    rojoDesde: 5,
    rojoHasta: 5,
    escalamientoAmarilloRol1: "Supervisor",
    escalamientoRojoRol1: "Jefe de Seccion",
    escalamientoRojoRol2: "",
    escalamientoRojoRol3: "",
    canalEnvioHome: true,
    canalEnvioCorreo: true,
    frecuenciaCorreo: "Diaria",
    generaIndicadorConsolidado: true,
    observaciones: "",
  },
  {
    actividad: "FIRMA RESOLUCION",
    producto: "",
    rolResponsable: "Director DGI",
    totalDiasPermitidos: 5,
    verdeDesde: 1,
    verdeHasta: 3,
    amarilloDesde: 4,
    amarilloHasta: 4,
    rojoDesde: 5,
    rojoHasta: 5,
    escalamientoAmarilloRol1: "",
    escalamientoRojoRol1: "",
    escalamientoRojoRol2: "",
    escalamientoRojoRol3: "",
    canalEnvioHome: true,
    canalEnvioCorreo: true,
    frecuenciaCorreo: "Unica",
    generaIndicadorConsolidado: true,
    observaciones: "",
  },
  {
    actividad: "NOTIFICACION RESOLUCION",
    producto: "",
    rolResponsable: "Auditor",
    totalDiasPermitidos: 5,
    verdeDesde: 1,
    verdeHasta: 3,
    amarilloDesde: 4,
    amarilloHasta: 4,
    rojoDesde: 5,
    rojoHasta: 5,
    escalamientoAmarilloRol1: "Supervisor",
    escalamientoRojoRol1: "Jefe de Seccion",
    escalamientoRojoRol2: "Director DGI",
    escalamientoRojoRol3: "",
    canalEnvioHome: true,
    canalEnvioCorreo: true,
    frecuenciaCorreo: "Diaria",
    generaIndicadorConsolidado: true,
    observaciones: "",
  },
  {
    actividad: "CIERRE Y ARCHIVO",
    producto: "",
    rolResponsable: "Auditor",
    totalDiasPermitidos: 7,
    verdeDesde: 1,
    verdeHasta: 4,
    amarilloDesde: 5,
    amarilloHasta: 6,
    rojoDesde: 7,
    rojoHasta: 7,
    escalamientoAmarilloRol1: "Supervisor",
    escalamientoRojoRol1: "Jefe de Seccion",
    escalamientoRojoRol2: "",
    escalamientoRojoRol3: "",
    canalEnvioHome: true,
    canalEnvioCorreo: false,
    frecuenciaCorreo: "Semanal",
    generaIndicadorConsolidado: true,
    observaciones: "",
  },
  {
    actividad: "RECURSO APELACION",
    producto: "",
    rolResponsable: "Auditor Apartamento Jurídico Tributario",
    totalDiasPermitidos: 15,
    verdeDesde: 1,
    verdeHasta: 10,
    amarilloDesde: 11,
    amarilloHasta: 13,
    rojoDesde: 14,
    rojoHasta: 15,
    escalamientoAmarilloRol1: "Jefe Depto Control",
    escalamientoRojoRol1: "Director DGI",
    escalamientoRojoRol2: "",
    escalamientoRojoRol3: "",
    canalEnvioHome: true,
    canalEnvioCorreo: true,
    frecuenciaCorreo: "Semanal",
    generaIndicadorConsolidado: true,
    observaciones: "",
  },
];

export type ActividadBase = { actividad: string; producto: string; rol: string };
export const ACTIVIDADES_BASE: ActividadBase[] = MATRIZ_EXCEL.map((r) => ({
  actividad: r.actividad,
  producto: r.producto,
  rol: r.rolResponsable,
}));

function uniqNonEmpty(arr: string[]) {
  return Array.from(new Set(arr.map((x) => String(x ?? "").trim()).filter((x) => x.length > 0)));
}

export const CATALOGO_PRODUCTOS = uniqNonEmpty(MATRIZ_EXCEL.map((r) => r.producto)) as readonly string[];
export const CATALOGO_ROLES = uniqNonEmpty(MATRIZ_EXCEL.map((r) => r.rolResponsable)) as readonly string[];
export const CATALOGO_ACTIVIDADES = uniqNonEmpty(MATRIZ_EXCEL.map((r) => r.actividad)) as readonly string[];

const LS_KEY = "dgi:paramAlertas:v2";

function uid(prefix = "ALERTA") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function asFrecuencia(v: any): FrecuenciaCorreo {
  return v === "Unica" || v === "Diaria" || v === "Semanal" ? v : "Diaria";
}

export function seedParamAlertas(): AlertaParam[] {
  return MATRIZ_EXCEL.map((r) => ({ id: uid(), ...r }));
}

export function loadParamAlertas(): AlertaParam[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) {
      const seed = seedParamAlertas();
      saveParamAlertas(seed);
      return seed;
    }

    const parsed = JSON.parse(raw) as Partial<AlertaParam>[];

    // auto-migración si trae actividades que ya no existen en la matriz
    const actividadesExcel = new Set(MATRIZ_EXCEL.map((r) => r.actividad.trim()));
    const parsedTieneViejas = (parsed ?? []).some((p) => {
      const a = String(p.actividad ?? "").trim();
      return a && actividadesExcel.size > 0 && !actividadesExcel.has(a);
    });

    if (parsedTieneViejas) {
      const seed = seedParamAlertas();
      saveParamAlertas(seed);
      return seed;
    }

    // normaliza SIN forzar producto (puede ser "")
    const normalized: AlertaParam[] = (parsed ?? [])
      .filter(Boolean)
      .map((p, idx) => {
        const actividad = String(p.actividad ?? "").trim() || `Actividad ${idx + 1}`;
        const producto = String(p.producto ?? "").trim(); // ✅ respeta vacío
        const rolResponsable = String((p as any).rolResponsable ?? (p as any).rol ?? "Auditor").trim();

        const totalDiasPermitidos = Number(p.totalDiasPermitidos ?? 10) || 10;

        const verdeDesde = Number(p.verdeDesde ?? 1);
        const verdeHasta = Number(p.verdeHasta ?? Math.max(1, Math.floor(totalDiasPermitidos * 0.6)));

        const amarilloDesde = Number(p.amarilloDesde ?? verdeHasta + 1);
        const amarilloHasta = Number(
          p.amarilloHasta ?? Math.max(amarilloDesde, Math.floor(totalDiasPermitidos * 0.8))
        );

        const rojoDesde = Number(p.rojoDesde ?? amarilloHasta + 1);
        const rojoHasta = Number(p.rojoHasta ?? totalDiasPermitidos);

        return {
          id: String((p as any).id ?? uid("ALERTA")),
          actividad,
          producto,
          rolResponsable,

          totalDiasPermitidos,
          verdeDesde,
          verdeHasta,
          amarilloDesde,
          amarilloHasta,
          rojoDesde,
          rojoHasta,

          escalamientoAmarilloRol1: String(p.escalamientoAmarilloRol1 ?? "Supervisor"),
          escalamientoRojoRol1: String(p.escalamientoRojoRol1 ?? "Jefe de Seccion"),
          escalamientoRojoRol2: String(p.escalamientoRojoRol2 ?? "Director DGI"),
          escalamientoRojoRol3: String(p.escalamientoRojoRol3 ?? ""),

          canalEnvioHome: Boolean(p.canalEnvioHome ?? true),
          canalEnvioCorreo: Boolean(p.canalEnvioCorreo ?? true),
          frecuenciaCorreo: asFrecuencia((p as any).frecuenciaCorreo),

          generaIndicadorConsolidado: Boolean(p.generaIndicadorConsolidado ?? true),
          observaciones: String(p.observaciones ?? ""),
        };
      });

    if (!normalized.length) {
      const seed = seedParamAlertas();
      saveParamAlertas(seed);
      return seed;
    }

    return normalized;
  } catch {
    const seed = seedParamAlertas();
    saveParamAlertas(seed);
    return seed;
  }
}

export function saveParamAlertas(rows: AlertaParam[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(rows ?? []));
}

export function resetParamAlertas(): AlertaParam[] {
  localStorage.removeItem(LS_KEY);
  const seed = seedParamAlertas();
  saveParamAlertas(seed);
  return seed;
}