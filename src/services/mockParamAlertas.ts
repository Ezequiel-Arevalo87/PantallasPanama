// src/services/mockParamAlertas.ts
export type FrecuenciaCorreo = "Unica" | "Diaria" | "Semanal";

export type AlertaParam = {
  /** ✅ necesario para DataGrid + ParametrizacionAlertas */
  id: string;

  /** ✅ lo que Patricia pide: actividades del cuadro */
  actividad: string;

  /** opcional (pero tu pantalla lo usa) */
  producto: string;

  /** ✅ tu pantalla lo usa como filtro/columna */
  rolResponsable: string;

  /** SLA */
  totalDiasPermitidos: number;

  /** rangos */
  verdeDesde: number;
  verdeHasta: number;
  amarilloDesde: number;
  amarilloHasta: number;
  rojoDesde: number;
  rojoHasta: number;

  /** escalamiento */
  escalamientoAmarilloRol1: string;
  escalamientoRojoRol1: string;
  escalamientoRojoRol2: string;
  escalamientoRojoRol3: string;

  /** canales */
  canalEnvioHome: boolean;
  canalEnvioCorreo: boolean;
  frecuenciaCorreo: FrecuenciaCorreo;

  /** reportes */
  generaIndicadorConsolidado: boolean;

  /** texto libre */
  observaciones: string;
};

/**
 * ✅ Catálogo base de actividades (para el botón “Nueva regla”)
 * Nota: lo dejamos simple: actividad + producto + rol (para precargar)
 */
export type ActividadBase = {
  actividad: string;
  producto: string;
  rol: string;
};

export const ACTIVIDADES_BASE: ActividadBase[] = [
  { actividad: "Informe de Auditoría (706)", producto: "Fiscalización", rol: "Auditor" },
  { actividad: "Verificación de Inconsistencias", producto: "Fiscalización", rol: "Auditor" },
  { actividad: "Requerimiento (documentación)", producto: "Fiscalización", rol: "Auditor" },
  { actividad: "Caso Omiso (apertura)", producto: "Fiscalización", rol: "Auditor" },
  // agrega aquí las del cuadro oficial si quieres “quemarlas” todas desde ya
];

const LS_KEY = "dgi:paramAlertas:v1";

function uid(prefix = "ALERTA") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

/** ✅ Seed inicial (si no hay nada en localStorage) */
export function seedParamAlertas(): AlertaParam[] {
  // Creamos una regla por cada actividad base (puedes ajustar rangos)
  return ACTIVIDADES_BASE.map((b, idx) => {
    const t = idx % 3 === 0 ? 10 : idx % 3 === 1 ? 15 : 20;

    return {
      id: uid(),
      actividad: b.actividad,
      producto: b.producto,
      rolResponsable: b.rol,

      totalDiasPermitidos: t,
      verdeDesde: 1,
      verdeHasta: Math.max(1, Math.floor(t * 0.6)),
      amarilloDesde: Math.max(2, Math.floor(t * 0.6) + 1),
      amarilloHasta: Math.max(2, Math.floor(t * 0.8)),
      rojoDesde: Math.max(3, Math.floor(t * 0.8) + 1),
      rojoHasta: t,

      escalamientoAmarilloRol1: "Supervisor",
      escalamientoRojoRol1: "Jefe de Seccion",
      escalamientoRojoRol2: "Direccion",
      escalamientoRojoRol3: "",

      canalEnvioHome: true,
      canalEnvioCorreo: true,
      frecuenciaCorreo: "Diaria",

      generaIndicadorConsolidado: true,
      observaciones: "Regla inicial",
    };
  });
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

    // ✅ normaliza por si viene data vieja sin campos nuevos
    const normalized: AlertaParam[] = (parsed ?? [])
      .filter(Boolean)
      .map((p, idx) => {
        const actividad = String(p.actividad ?? "").trim() || `Actividad ${idx + 1}`;
        const producto = String(p.producto ?? "Fiscalización");
        const rolResponsable = String((p as any).rolResponsable ?? (p as any).rol ?? "Auditor");

        const totalDiasPermitidos = Number(p.totalDiasPermitidos ?? 10) || 10;

        const verdeDesde = Number(p.verdeDesde ?? 1);
        const verdeHasta = Number(p.verdeHasta ?? Math.max(1, Math.floor(totalDiasPermitidos * 0.6)));

        const amarilloDesde = Number(p.amarilloDesde ?? verdeHasta + 1);
        const amarilloHasta = Number(p.amarilloHasta ?? Math.max(amarilloDesde, Math.floor(totalDiasPermitidos * 0.8)));

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
          escalamientoRojoRol2: String(p.escalamientoRojoRol2 ?? "Direccion"),
          escalamientoRojoRol3: String(p.escalamientoRojoRol3 ?? ""),

          canalEnvioHome: Boolean(p.canalEnvioHome ?? true),
          canalEnvioCorreo: Boolean(p.canalEnvioCorreo ?? true),
          frecuenciaCorreo: (p.frecuenciaCorreo as any) ?? "Diaria",

          generaIndicadorConsolidado: Boolean(p.generaIndicadorConsolidado ?? true),
          observaciones: String(p.observaciones ?? ""),
        };
      });

    // si quedó vacío, seed
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

/**
 * ✅ IMPORTANTE: tu ParametrizacionAlertas.tsx espera que reset retorne AlertaParam[]
 * para poder hacer:
 *   const seed = resetParamAlertas();
 *   setRows(seed);
 */
export function resetParamAlertas(): AlertaParam[] {
  localStorage.removeItem(LS_KEY);
  const seed = seedParamAlertas();
  saveParamAlertas(seed);
  return seed;
}