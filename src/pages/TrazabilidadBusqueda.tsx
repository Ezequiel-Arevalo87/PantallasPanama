// src/pages/TrazabilidadBusqueda.tsx
import * as React from "react";
import {
  Box,
  Paper,
  Stack,
  TextField,
  Button,
  Typography,
} from "@mui/material";
import Trazabilidad, { type TrazaItem, type EstadoAprobacion } from "../components/Trazabilidad";

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
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fecha aleatoria dentro de los últimos N días */
function randomPastDate(rnd: () => number, daysBackMax = 540) {
  const now = Date.now();
  const backDays = Math.floor(rnd() * daysBackMax); // 0..N
  const hour = Math.floor(rnd() * 24);
  const min = Math.floor(rnd() * 60);
  const sec = Math.floor(rnd() * 60);
  const d = new Date(now - backDays * 86_400_000);
  d.setHours(hour, min, sec, 0);
  return d.toISOString();
}

const ACTORES = ["Sistema", "Supervisor", "Auditor"] as const;
const ACCIONES = ["Recepción de caso", "Asignación", "Revisión", "Actualización"] as const;
const ESTADOS: EstadoAprobacion[] = ["PENDIENTE", "ASIGNADO", "APROBADO", "RECHAZADO"];

/** Genera trazabilidad simulada para cualquier combinación (RUC / Trámite) */
function buildMockTrazas(key: string): TrazaItem[] {
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
  rows.sort((a, b) => new Date(b.fechaISO).getTime() - new Date(a.fechaISO).getTime());
  return rows;
}

const TrazabilidadBusqueda: React.FC = () => {
  const [ruc, setRuc] = React.useState("");
  const [tramite, setTramite] = React.useState("");
  const [rows, setRows] = React.useState<TrazaItem[]>([]);

  const handleBuscar = () => {
    const rucClean = ruc.trim();
    const traClean = tramite.trim();

    // Requerimos al menos uno de los dos campos
    if (!rucClean && !traClean) {
      setRows([]);
      return;
    }

    // Semilla combinada estable (si uno está vacío, igual funciona)
    const key = `${rucClean}|${traClean}`;
    setRows(buildMockTrazas(key));
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleBuscar();
  };

  const handleLimpiar = () => {
    setRuc("");
    setTramite("");
    setRows([]);
  };

  return (
    <Box component={Paper} sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Trazabilidad por RUC y Número de trámite (simulado)
      </Typography>

    <Stack
  direction={{ xs: "column", sm: "row" }}
  spacing={1.5}
  sx={{
    mb: 2,
    alignItems: "stretch",
    "& .MuiTextField-root": { flex: 1 },
    "& .MuiButton-root": {
      minWidth: 120,
      fontWeight: "bold",
      height: "56px", // igual que los TextField
    },
  }}
>
  <TextField
    label="RUC"
    value={ruc}
    onChange={(e) => setRuc(e.target.value)}
    onKeyDown={handleKey}
    placeholder="Ej.: 8-123-456"
  />
  <TextField
    label="Número de trámite"
    value={tramite}
    onChange={(e) => setTramite(e.target.value)}
    onKeyDown={handleKey}
    placeholder="Ej.: 2025-000123"
  />
  <Button variant="contained" onClick={handleBuscar}>
    Buscar
  </Button>
  <Button variant="outlined" color="inherit" onClick={handleLimpiar}>
    Limpiar
  </Button>
</Stack>


      {rows.length > 0 ? (
        <Trazabilidad rows={rows} height={420} />
      ) : (
        <Box sx={{ py: 6, textAlign: "center", color: "text.secondary" }}>
          Ingresa <b>RUC</b>, <b>Número de trámite</b> o ambos y presiona <b>Buscar</b> para ver la trazabilidad simulada.
        </Box>
      )}
    </Box>
  );
};

export default TrazabilidadBusqueda;
