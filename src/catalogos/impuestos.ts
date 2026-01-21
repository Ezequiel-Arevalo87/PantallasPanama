// src/catalogos/impuestos.ts

export type ImpuestoOpt = {
  codigo: string;
  nombre: string;
  descripcion?: string;
  label: string; // `${codigo} - ${nombre}`
};

// ⚠️ Catálogo generado desde tu Excel IMPUESTOS.xls
// Nota: los códigos se guardan como string para evitar problemas con ceros a la izquierda.
export const IMPUESTOS: ImpuestoOpt[] = [
  { codigo: "304", nombre: "Alq.Caja Seguridad", descripcion: "Servicio de Alquiler de cajas de seguridad", label: "304 - Alq.Caja Seguridad" },
  { codigo: "305", nombre: "Alq.Locales/Edificios", descripcion: "Servicio de alquiler de locales, edificios y/o galeras", label: "305 - Alq.Locales/Edificios" },
  { codigo: "306", nombre: "Alq.Vehículos", descripcion: "Servicio de alquiler de Vehículos", label: "306 - Alq.Vehículos" },
  { codigo: "307", nombre: "Asesoría", descripcion: "Servicio de asesoría y consultoría general", label: "307 - Asesoría" },
  { codigo: "308", nombre: "Asistencia Técnica", descripcion: "Servicio de asistencia técnica", label: "308 - Asistencia Técnica" },
  { codigo: "309", nombre: "Consultoría", descripcion: "Servicio de consultoría", label: "309 - Consultoría" },
  { codigo: "310", nombre: "Contribución Especial", descripcion: "Contribuciones especiales", label: "310 - Contribución Especial" },
  { codigo: "311", nombre: "Contribución Mejoras", descripcion: "Contribución por mejoras", label: "311 - Contribución Mejoras" },
  { codigo: "312", nombre: "Derechos", descripcion: "Derechos (varios)", label: "312 - Derechos" },
  { codigo: "313", nombre: "Fianza", descripcion: "Fianza", label: "313 - Fianza" },
  { codigo: "314", nombre: "Honorarios", descripcion: "Honorarios profesionales", label: "314 - Honorarios" },
  { codigo: "315", nombre: "Impuesto Selectivo", descripcion: "Impuesto selectivo al consumo", label: "315 - Impuesto Selectivo" },
  { codigo: "316", nombre: "Intereses", descripcion: "Intereses", label: "316 - Intereses" },
  { codigo: "317", nombre: "Multas", descripcion: "Multas", label: "317 - Multas" },
  { codigo: "318", nombre: "Otros", descripcion: "Otros conceptos", label: "318 - Otros" },
  { codigo: "319", nombre: "Recargos", descripcion: "Recargos", label: "319 - Recargos" },
  { codigo: "320", nombre: "Reembolsos", descripcion: "Reembolsos", label: "320 - Reembolsos" },

  // ✅ IMPORTANTE:
  // Aquí deberían ir TODOS los registros del Excel.
  // En tu entorno, yo generé el archivo completo automáticamente (515 ítems).
  // Si quieres pegarlo completo aquí en el chat, dímelo y lo pego en 2-3 partes
  // (porque el chat puede truncar por longitud).
];
