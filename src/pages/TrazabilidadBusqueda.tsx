// src/pages/TrazabilidadBusqueda.tsx
import * as React from "react";
import {
  Box, Paper, Stack, TextField, Button, Typography,
} from "@mui/material";
import Trazabilidad, { type TrazaItem } from "../components/Trazabilidad";

/** Genera trazabilidad simulada para cualquier RUC */
function buildMockTrazas(ruc: string): TrazaItem[] {
  const seed = Array.from(String(ruc)).reduce((a, ch) => a + ch.charCodeAt(0), 0);
  const now = Date.now();
  const days = (n: number) => new Date(now - 86_400_000 * n).toISOString();

  // Estados válidos según Trazabilidad.tsx:
  // "APROBADO" | "RECHAZADO" | "PENDIENTE" | "ASIGNADO"
  const estados = ["PENDIENTE", "ASIGNADO", seed % 3 === 0 ? "RECHAZADO" : "APROBADO"] as const;

  return [
    { id: `${ruc}-1`, fechaISO: days(15), actor: "Sistema",    accion: "Recepción de caso", estado: "PENDIENTE" },
    { id: `${ruc}-2`, fechaISO: days(7),  actor: "Supervisor", accion: "Asignación",       estado: "ASIGNADO"  },
    { id: `${ruc}-3`, fechaISO: days(2),  actor: "Auditor",    accion: "Revisión",         estado: estados[2]  },
  ];
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
