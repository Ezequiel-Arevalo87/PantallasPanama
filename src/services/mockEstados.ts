import dayjs from "dayjs";

// ===== Tipos =====
export type Categoria = "Fiscalización Masiva" | "Auditoría Sectorial" | "Grandes Contribuyentes" | "Todos";
export type EstadoActividad =
  | "asignacion"
  | "acta de inicio"
  | "notificacion"
  | "informe auditoria"
  | "propuesta de regularizacion"
  | "aceptacion total"
  | "aceptacion parcial"
  | "rechazo"
  | "resolucion"
  | "cierre y archivo";
export type Semaforo = "VERDE" | "AMARILLO" | "ROJO";

export type FilaEstado = {
  numeroTramite: string;
  ruc: string;
  contribuyente: string;
  categoria: Categoria;
  estado: EstadoActividad;
  fecha: string; // formato ISO
};

// ===== Utilidades =====
export const toDDMMYYYY = (f: string) => dayjs(f).format("DD-MM-YYYY");

export const diasRestantes = (fecha: string) => {
  const hoy = dayjs();
  return dayjs(fecha).diff(hoy, "day");
};

export const calcularSemaforo = (fecha: string): Semaforo => {
  const d = diasRestantes(fecha);
  if (d > 10) return "VERDE";
  if (d >= 3) return "AMARILLO";
  return "ROJO";
};

// ====== Mock ======
const CONTRIBUYENTES = [
  "Panamá Retail S.A.",
  "Construcciones Istmo S.A.",
  "Servicios Globales S.A.",
  "Tecnología del Istmo",
  "Importadora del Pacífico",
  "Transportes del Canal",
  "Consultores Latam",
  "Farmacias Unidas",
  "Agropecuaria del Norte",
  "Comercial El Centro",
  "Distribuidora Caribeña",
  "Proyectos del Sur",
  "Grupo Industrial del Norte",
];

const ESTADOS: EstadoActividad[] = [
  "asignacion",
  "acta de inicio",
  "notificacion",
  "informe auditoria",
  "propuesta de regularizacion",
  "aceptacion total",
  "aceptacion parcial",
  "rechazo",
  "resolucion",
  "cierre y archivo",
];

const CATEGORIAS: Categoria[] = [
  "Fiscalización Masiva",
  "Auditoría Sectorial",
  "Grandes Contribuyentes",
];

// ===== Generar fechas random =====
function randomFecha(): string {
  const randomDias = Math.floor(Math.random() * 60) - 30; // entre -30 y +30 días
  return dayjs().add(randomDias, "day").format("YYYY-MM-DD");
}

// ===== Construir mock =====
export function buildMockEstados(cantidad = 20): FilaEstado[] {
  const arr: FilaEstado[] = [];
  for (let i = 0; i < cantidad; i++) {
    const categoria = CATEGORIAS[Math.floor(Math.random() * CATEGORIAS.length)];
    const estado = ESTADOS[Math.floor(Math.random() * ESTADOS.length)];
    const contribuyente = CONTRIBUYENTES[Math.floor(Math.random() * CONTRIBUYENTES.length)];

    arr.push({
      numeroTramite: `${categoria.startsWith("Grandes") ? "GC" : "FS"}-${(i + 1)
        .toString()
        .padStart(4, "0")}`,
      ruc: `RUC-${100200 + i}`,
      contribuyente,
      categoria,
      estado,
      fecha: randomFecha(),
    });
  }
  return arr;
}
