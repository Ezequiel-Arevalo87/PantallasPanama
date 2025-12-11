// src/services/mockTrazas.ts
import type { TrazaItem, EstadoAprobacion } from "../components/Trazabilidad";

/** PRNG determinístico a partir de una semilla (derivada del RUC/trámite) */
function seedFrom(str: string) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return (h >>> 0) || 1;
}

function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const ACTORES = ["Sistema", "Supervisor", "Auditor"] as const;
const ACCIONES = [
  "Recepción de caso",
  "Asignación",
  "Revisión",
  "Actualización",
] as const;
const ESTADOS: EstadoAprobacion[] = [
  "PENDIENTE",
  "ASIGNADO",
  "APROBADO",
  "RECHAZADO",
];

/** Genera trazabilidad simulada para cualquier combinación (RUC / Trámite) */
export function buildMockTrazas(key: string): TrazaItem[] {
  const seed = seedFrom(key);
  const rndf = mulberry32(seed);

  // Últimos 18 meses como rango con distribución simple
  const randomDate = (): string => {
    const now = new Date();
    const pastMonths = Math.floor(rndf() * 19); // 0..18
    const day = 1 + Math.floor(rndf() * 28);
    const hour = 7 + Math.floor(rndf() * 12); // 7..18
    const minute = Math.floor(rndf() * 60);
    const d = new Date(now);
    d.setMonth(d.getMonth() - pastMonths);
    d.setDate(day);
    d.setHours(hour, minute, 0, 0);
    return d.toISOString();
  };

  const rows: TrazaItem[] = [];
  const total = 3 + Math.floor(rndf() * 4); // 3..6 filas

  for (let i = 0; i < total; i++) {
    rows.push({
      id: `${key}-${i + 1}`,
      fechaISO: randomDate(),
      actor: ACTORES[Math.floor(rndf() * ACTORES.length)],
      accion: ACCIONES[Math.floor(rndf() * ACCIONES.length)],
      estado: ESTADOS[Math.floor(rndf() * ESTADOS.length)],
    });
  }

  // Ordenar de más reciente a más antigua
  rows.sort(
    (a, b) => new Date(b.fechaISO).getTime() - new Date(a.fechaISO).getTime()
  );
  return rows;
}
