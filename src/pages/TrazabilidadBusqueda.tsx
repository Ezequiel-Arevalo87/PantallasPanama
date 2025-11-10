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

/** PRNG determinístico a partir de una semilla (derivada del RUC) */
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

/** Genera trazabilidad simulada para cualquier RUC (fechas “al azar” coherentes) */
/** Genera trazabilidad simulada para cualquier RUC (con fechas aleatorias coherentes) */
function buildMockTrazas(ruc: string): TrazaItem[] {
  const seed = Array.from(String(ruc)).reduce((a, ch) => a + ch.charCodeAt(0), 0);
  const rnd = (min: number, max: number) =>
    Math.floor(Math.abs(Math.sin(seed + Math.random()) * (max - min + 1))) + min;

  // Últimos 18 meses como rango
  const randomDate = (): string => {
    const now = new Date();
    const pastMonths = rnd(0, 18);
    const day = rnd(1, 28);
    const hour = rnd(7, 18);
    const minute = rnd(0, 59);
    const d = new Date(now);
    d.setMonth(d.getMonth() - pastMonths);
    d.setDate(day);
    d.setHours(hour, minute, 0, 0);
    return d.toISOString();
  };

  const estados = ["PENDIENTE", "ASIGNADO", "APROBADO", "RECHAZADO"] as const;
  const actores = ["Sistema", "Supervisor", "Auditor"];
  const acciones = ["Recepción de caso", "Asignación", "Revisión", "Actualización"];

  const rows: TrazaItem[] = [];
  const total = rnd(3, 6); // entre 3 y 6 filas

  for (let i = 0; i < total; i++) {
    const fechaISO = randomDate();
    rows.push({
      id: `${ruc}-${i + 1}`,
      fechaISO,
      actor: actores[rnd(0, actores.length - 1)],
      accion: acciones[rnd(0, acciones.length - 1)],
      estado: estados[rnd(0, estados.length - 1)],
    });
  }

  // Ordenar de más reciente a más antigua
  rows.sort((a, b) => new Date(b.fechaISO).getTime() - new Date(a.fechaISO).getTime());
  return rows;
}

const TrazabilidadBusqueda: React.FC = () => {
  const [ruc, setRuc] = React.useState("");
  const [rows, setRows] = React.useState<TrazaItem[]>([]);

  const handleBuscar = () => {
    const clean = ruc.trim();
    if (!clean) {
      setRows([]);
      return;
    }
    setRows(buildMockTrazas(clean));
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleBuscar();
  };

  const handleLimpiar = () => {
    setRuc("");
    setRows([]);
  };

  return (
    <Box component={Paper} sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Trazabilidad por RUC (simulado)
      </Typography>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mb: 2 }}>
        <TextField
          label="RUC"
          value={ruc}
          onChange={(e) => setRuc(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Ej.: 8-123-456"
          fullWidth
        />
        <Button variant="contained" onClick={handleBuscar}>Buscar</Button>
        <Button variant="outlined" color="inherit" onClick={handleLimpiar}>Limpiar</Button>
      </Stack>

      {rows.length > 0 ? (
        <Trazabilidad rows={rows} height={420} />
      ) : (
        <Box sx={{ py: 6, textAlign: "center", color: "text.secondary" }}>
          Ingresa un RUC y presiona <b>Buscar</b> para ver la trazabilidad simulada.
        </Box>
      )}
    </Box>
  );
};

export default TrazabilidadBusqueda;
