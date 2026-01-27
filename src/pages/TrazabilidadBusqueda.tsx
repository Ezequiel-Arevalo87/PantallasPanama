// src/pages/TrazabilidadBusqueda.tsx
import * as React from "react";
import { Box, Paper, Stack, TextField, Button, Typography } from "@mui/material";
import Trazabilidad, { type TrazaItem } from "../components/Trazabilidad";
import { buildMockTrazas } from "../services/mockTrazas";

const TrazabilidadBusqueda: React.FC = () => {
  const [ruc, setRuc] = React.useState("");
  const [tramite, setTramite] = React.useState("");
  const [rows, setRows] = React.useState<TrazaItem[]>([]);

  const handleBuscar = () => {
    const rucClean = ruc.trim();
    const traClean = tramite.trim();

    if (!rucClean && !traClean) {
      setRows([]);
      return;
    }

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
            height: "56px",
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
          Ingresa <b>RUC</b>, <b>Número de trámite</b> o ambos y presiona <b>Buscar</b>.
        </Box>
      )}
    </Box>
  );
};

export default TrazabilidadBusqueda;
