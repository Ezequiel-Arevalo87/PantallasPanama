import { loadParamAlertas, type AlertaParam } from "../services/mockParamAlertas";

type Semaforo = "ROJO" | "AMARILLO" | "VERDE" | "GRIS";

function todayYmd() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function daysBetween(startYmd: string, endYmd: string) {
  const a = new Date(startYmd + "T00:00:00").getTime();
  const b = new Date(endYmd + "T00:00:00").getTime();
  return Math.floor((b - a) / (1000 * 60 * 60 * 24));
}

function addDaysYmd(startYmd: string, n: number) {
  const d = new Date(startYmd + "T00:00:00");
  d.setDate(d.getDate() + n);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Busca parametrización por actividad (match simple). */
function findParamByActividad(params: AlertaParam[], actividad: string) {
  const a = actividad.trim().toLowerCase();
  return params.find((p) => p.actividad.trim().toLowerCase() === a);
}

/** Calcula semáforo según rangos de la matriz paramétrica */
function semaforoFromParam(param: AlertaParam | undefined, diasTranscurridos: number): Semaforo {
  if (!param) return "GRIS";
  const d = diasTranscurridos;

  if (d >= param.rojoDesde && d <= param.rojoHasta) return "ROJO";
  if (d >= param.amarilloDesde && d <= param.amarilloHasta) return "AMARILLO";
  if (d >= param.verdeDesde && d <= param.verdeHasta) return "VERDE";

  // Si se pasó del total, también debe ser ROJO (vencida)
  if (d > param.totalDiasPermitidos) return "ROJO";

  // Si está antes del verdeDesde (raro), lo dejamos VERDE
  if (d < param.verdeDesde) return "VERDE";

  return "GRIS";
}
