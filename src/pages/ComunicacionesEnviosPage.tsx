// src/pages/ComunicacionesEnviosPage.tsx
import * as React from "react";
import {
  Box,
  Paper,
  Stack,
  TextField,
  Button,
  Typography,
  Alert,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
} from "@mui/material";
import dayjs from "dayjs";

import TablaResultadosComunicacion, { type CasoInfo } from "./TablaResultadosComunicacion";
import EnviosComunicacion from "./EnviosComunicacion";

/** ===================== MOCK HELPERS ===================== */
const randomFrom = (seed: string, arr: string[]) => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return arr[h % arr.length];
};

const buildMockCaso = (ruc: string, noTramite: string): CasoInfo => {
  const empresas = [
    "Comercial La Esperanza, S.A.",
    "Servicios del Istmo, S.R.L.",
    "Inversiones Panamá Norte, S.A.",
    "Distribuidora Pacífico, S.A.",
    "Constructora Bahía Azul, S.A.",
  ];
  const reps = ["Luis Gómez", "María Pérez", "Carlos Díaz", "Ana Sánchez", "Pedro Rodríguez"];

  const seed = `${ruc}|${noTramite}`;
  const razonSocial = randomFrom(seed + "|rs", empresas);
  const representanteLegal = randomFrom(seed + "|rep", reps);

  const correo = `${razonSocial
    .split(" ")[0]
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")}@correo.com`;

  const actaInicio = `AI-${dayjs().format("YYYY")}-${String((noTramite.match(/\d+/)?.[0] ?? "1")).slice(-4)}`;

  return {
    noTramite,
    ruc,
    razonSocial,
    actaInicio,
    representanteLegal,
    correo,
  };
};

const buildMockResultados = (ruc?: string, tramite?: string): CasoInfo[] => {
  const r = (ruc ?? "").trim();
  const t = (tramite ?? "").trim();

  if (!r && !t) return [];

  // Si viene trámite, retornamos 1
  if (t) {
    const rucFinal = r || "8-000-000";
    return [buildMockCaso(rucFinal, t)];
  }

  // Si viene solo RUC, retornamos varios trámites (simulación)
  const rucFinal = r || "8-000-000";
  const y = dayjs().format("YYYY");
  const base = rucFinal.replace(/[^0-9]/g, "").slice(-3) || "001";

  const tramites = Array.from({ length: 5 }).map((_, idx) => {
    const n = String(Number(base) + idx).padStart(6, "0");
    return `${y}-${n}`;
  });

  return tramites.map((noTramite) => buildMockCaso(rucFinal, noTramite));
};

/** ===================== PAGE ===================== */
const ComunicacionesEnviosPage: React.FC = () => {
  const [ruc, setRuc] = React.useState("");
  const [tramite, setTramite] = React.useState("");

  const [error, setError] = React.useState("");
  const [rows, setRows] = React.useState<CasoInfo[]>([]);

  const [selectedCaso, setSelectedCaso] = React.useState<CasoInfo | null>(null);

  const handleBuscar = () => {
    setError("");
    const r = ruc.trim();
    const t = tramite.trim();

    if (!r && !t) {
      setRows([]);
      setSelectedCaso(null);
      return;
    }

    const data = buildMockResultados(r, t);

    if (!data.length) {
      setRows([]);
      setSelectedCaso(null);
      setError("No se encontraron resultados con los filtros ingresados.");
      return;
    }

    setRows(data);
    setSelectedCaso(null);
  };

  const handleLimpiar = () => {
    setRuc("");
    setTramite("");
    setError("");
    setRows([]);
    setSelectedCaso(null);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleBuscar();
  };

  return (
    <Box component={Paper} sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Comunicaciones → Envíos
      </Typography>

      {/* Búsqueda */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        sx={{
          mb: 2,
          alignItems: "stretch",
          "& .MuiTextField-root": { flex: 1 },
          "& .MuiButton-root": { minWidth: 120, fontWeight: "bold", height: "56px" },
        }}
      >
        <TextField
          label="RUC"
          value={ruc}
          onChange={(e) => setRuc(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Ej.: 8-123-456"
        />
        <TextField
          label="Número de trámite"
          value={tramite}
          onChange={(e) => setTramite(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Ej.: 2026-000123"
        />
        <Button variant="contained" onClick={handleBuscar}>
          Buscar
        </Button>
        <Button variant="outlined" color="inherit" onClick={handleLimpiar}>
          Limpiar
        </Button>
      </Stack>

      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}

      {!rows.length ? (
        <Box sx={{ py: 6, textAlign: "center", color: "text.secondary" }}>
          Ingresa <b>RUC</b>, <b>Número de trámite</b> o ambos y presiona <b>Buscar</b>.
        </Box>
      ) : (
        <>
          <Divider sx={{ my: 2 }} />
          <TablaResultadosComunicacion rows={rows} onSelect={(row) => setSelectedCaso(row)} />
        </>
      )}

      {/* Detalle en Dialog */}
      <Dialog
        open={!!selectedCaso}
        onClose={() => setSelectedCaso(null)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 900 }}>
          Gestión de Envíos / Comunicación Formal
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          {selectedCaso ? (
            <EnviosComunicacion caso={selectedCaso} onClose={() => setSelectedCaso(null)} />
          ) : null}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default ComunicacionesEnviosPage;
