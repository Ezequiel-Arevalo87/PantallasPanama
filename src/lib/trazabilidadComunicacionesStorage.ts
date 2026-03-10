export type EstadoCorreo = "ENVIADO" | "RESPONDIDO" | "VENCIDO";

export type TrazabilidadCorreo = {
  id: string;
  ruc: string;
  noTramite: string;
  fechaEnvio: string;
  fechaRespuesta: string;
  origen: string;
  destino: string;
  asunto: string;
  mensaje: string;
  noDocumento: string;
  nombreDocumento: string;
  diasMaxRespuesta: number;
  diasFaltantes: number;
  fechaLimiteRespuesta: string;
  estado: EstadoCorreo;
};

const STORAGE_KEY = "mock_trazabilidad_comunicaciones";

const seedData: TrazabilidadCorreo[] = [
  {
    id: "mail-seed-1",
    ruc: "8-359-1371",
    noTramite: "TRM-2026-000008",
    fechaEnvio: "09/03/2026, 09:15 a. m.",
    fechaRespuesta: "—",
    origen: "Sistema",
    destino: "Correo registrado",
    asunto: "Correo",
    mensaje: "Se envía correo informativo asociado al trámite TRM-2026-000008.",
    noDocumento: "DOC-20260309-0008",
    nombreDocumento: "Correo_TRM-2026-000008.pdf",
    diasMaxRespuesta: 5,
    diasFaltantes: 5,
    fechaLimiteRespuesta: "14/03/2026",
    estado: "ENVIADO",
  },
];

export function readTrazabilidadComunicaciones(): TrazabilidadCorreo[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seedData));
      return seedData;
    }
    const parsed = JSON.parse(raw) as TrazabilidadCorreo[];
    return Array.isArray(parsed) ? parsed : seedData;
  } catch {
    return seedData;
  }
}

export function saveTrazabilidadComunicaciones(rows: TrazabilidadCorreo[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
}

export function appendTrazabilidadComunicacion(row: TrazabilidadCorreo) {
  const current = readTrazabilidadComunicaciones();
  const next = [row, ...current];
  saveTrazabilidadComunicaciones(next);
  return next;
}