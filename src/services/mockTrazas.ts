// src/services/mockTrazas.ts
import dayjs from "dayjs";
import type { TrazaItem, EstadoAprobacion } from "../components/Trazabilidad";

const ACTIVIDADES_TRAZA = [
  "Asignación",
  "Acta de inicio",
  "Notificación acta de inicio",
  "Informe auditoría",
  "Propuesta de regularización",
  "Revisión Análisis Normativo 1",
  "Revisión Análisis Normativo 2",
  "Notificación propuesta de regularización",
  "Aceptación total",
  "Aceptación parcial",
  "Rechazo",
  "Resolución en firme",
  "Notificación de resolución",
  "Cierre y archivo",
];

const USUARIOS = [
  "Juan Pérez",
  "María Rodríguez",
  "Ana González",
  "Carlos Martínez",
  "Diana Fernández",
  "Pedro López",
  "Sofía Sánchez",
  "Andrés Ramírez",
];

function pick<T>(arr: T[], seed: number) {
  return arr[seed % arr.length];
}

// Hash simple determinístico (para que el mismo trámite tenga la misma trazabilidad)
function hashSeed(str: string) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// genera entero [0, max)
function randInt(seed: number, idx: number, max: number) {
  const x = Math.imul(seed ^ (idx + 1), 1103515245) + 12345;
  return Math.abs(x) % max;
}

function estadoPorIndice(i: number, total: number): EstadoAprobacion {
  // regla simple: las primeras suelen ir APROBADO, la última puede variar
  if (i < total - 1) return "APROBADO";
  const last = i % 3;
  if (last === 0) return "APROBADO";
  if (last === 1) return "PENDIENTE";
  return "RECHAZADO";
}

/**
 * ✅ Devuelve trazas ya con:
 * actividad | estado | fechaInicialISO | fechaFinalISO | usuarioGestion
 */
export function buildMockTrazas(key: string, cantidad?: number): TrazaItem[] {
  const seed = hashSeed(key || "default");

  // 3 a 8 filas por defecto (o cantidad forzada)
  const total =
    typeof cantidad === "number"
      ? Math.max(1, Math.min(20, cantidad))
      : 3 + (seed % 6); // 3..8

  // fecha base (hace 20..60 días)
  const startDaysAgo = 20 + (seed % 40);
  let cursor = dayjs().subtract(startDaysAgo, "day").hour(9).minute(0).second(0);

  const rows: TrazaItem[] = [];

  for (let i = 0; i < total; i++) {
    const actIdx = randInt(seed, i, ACTIVIDADES_TRAZA.length);
    const actividad = ACTIVIDADES_TRAZA[actIdx];

    const userIdx = randInt(seed + 99, i, USUARIOS.length);
    const usuarioGestion = USUARIOS[userIdx];

    // cada etapa dura entre 1 y 7 días
    const durDias = 1 + randInt(seed + 7, i, 7);

    const fechaInicialISO = cursor.toISOString();
    const fechaFinalISO =
      i === total - 1
        ? "" // última puede quedar sin final (en proceso)
        : cursor.add(durDias, "day").hour(17).minute(0).second(0).toISOString();

    const estado = estadoPorIndice(i, total);

    rows.push({
      id: `${key}-${i + 1}`,
      estado,

      // ✅ lo que necesita la grilla
      actividad,
      usuarioGestion,
      fechaInicialISO,
      fechaFinalISO,

      // ✅ compat con lo viejo (por si algo aún lo usa)
      accion: actividad,
      actor: usuarioGestion,
      fechaISO: fechaInicialISO,
    });

    // avanzar cursor al “final” para la próxima etapa
    cursor = i === total - 1 ? cursor.add(1, "day") : dayjs(fechaFinalISO);
  }

  // Orden descendente por fecha inicial (como el DataGrid)
  return rows.sort((a, b) => {
    const ta = a.fechaInicialISO ? new Date(a.fechaInicialISO).getTime() : 0;
    const tb = b.fechaInicialISO ? new Date(b.fechaInicialISO).getTime() : 0;
    return tb - ta;
  });
}
