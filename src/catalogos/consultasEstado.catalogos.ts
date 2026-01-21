// src/catalogos/consultasEstado.catalogos.ts

import type { EstadoActividad } from "../services/mockEstados";

/** ✅ Valor real de "TODOS" (NO VACÍO) */
export const ALL = "__ALL__" as const;

/** ✅ Actividades (incluye AN1/AN2) */
export const ACTIVIDADES: EstadoActividad[] = [
  "asignacion",
  "acta de inicio",
  "notificacion acta de inicio",
  "informe auditoria",
  "propuesta de regularizacion",
  "Revisión Análisis Normativo 1",
  "Revisión Análisis Normativo 2",
  "notificación propuesta de regularizacion",
  "aceptacion total",
  "aceptacion parcial",
  "rechazo",
  "resolucion en firme",
  "notificación de resolución",
  "cierre y archivo",
];

export const TIPOS_INCONSISTENCIA = ["Omiso", "Inexacto", "Extemporáneo"] as const;
export type TipoInconsistencia = (typeof TIPOS_INCONSISTENCIA)[number];

export const PROGRAMAS_OMISO = [
  "Omisos vs retenciones 4331 ITBMS",
  "Omisos vs informes",
  "Omisos vs ISR Renta",
  "Omisos vs ITBMS",
] as const;

export const PROGRAMAS_INEXACTO = [
  "Costos y gastos vs Anexos",
  "Ventas e ingresos vs Anexos",
  "Inexactos vs retenciones 4331 ITBMS",
  "Inexactos vs ITBMS",
] as const;

export const PROGRAMAS_EXTEMPORANEO = [
  "Base contribuyentes VS Calendario ISR",
  "Base contribuyentes VS Calendario ITBMS",
  "Base contribuyentes VS Calendario retenciones ITBMS",
] as const;

export const REDS = ["675", "659"] as const;
export type Red = (typeof REDS)[number];

/** ✅ Programa con CÓDIGO ÚNICO (guardamos código, mostramos solo nombre) */
export type ProgramaOpt = {
  codigo: string;
  nombre: string;
};

export const PROGRAMA_CODIGO: Record<string, string> = {
  "Omisos vs retenciones 4331 ITBMS": "115",
  "Omisos vs informes": "116",
  "Omisos vs ISR Renta": "113",
  "Omisos vs ITBMS": "114",

  "Costos y gastos vs Anexos": "210",
  "Ventas e ingresos vs Anexos": "211",
  "Inexactos vs retenciones 4331 ITBMS": "212",
  "Inexactos vs ITBMS": "213",

  "Base contribuyentes VS Calendario ISR": "310",
  "Base contribuyentes VS Calendario ITBMS": "311",
  "Base contribuyentes VS Calendario retenciones ITBMS": "312",
};

export const uniqCaseInsensitive = (items: string[]) =>
  Array.from(new Map(items.map((s) => [s.trim().toLowerCase(), s])).values()).filter(Boolean);

export const toProgramaOpt = (nombre: string): ProgramaOpt => {
  const codigo = PROGRAMA_CODIGO[nombre] ?? "";
  return { codigo, nombre };
};
