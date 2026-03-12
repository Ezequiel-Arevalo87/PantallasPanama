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
  Chip,
} from "@mui/material";
import dayjs from "dayjs";

import TablaResultadosComunicacion, {
  type CasoInfo,
} from "./TablaResultadosComunicacion";
import EnviosComunicacion from "./EnviosComunicacion";

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

  const reps = [
    "Luis Gómez",
    "María Pérez",
    "Carlos Díaz",
    "Ana Sánchez",
    "Pedro Rodríguez",
  ];

  const correosBase = [
    "contacto@empresa.com",
    "legal@empresa.com",
    "administracion@empresa.com",
    "tributario@empresa.com",
    "gerencia@empresa.com",
  ];

  const seed = `${ruc}|${noTramite}`;
  const razonSocial = randomFrom(seed + "|rs", empresas);
  const representanteLegal = randomFrom(seed + "|rep", reps);

  const correoPrincipal = `${razonSocial
    .split(" ")[0]
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")}@correo.com`;

  const otrosCorreos = [
    correoPrincipal,
    ...correosBase.map((_, idx) => {
      const pref = razonSocial
        .split(" ")[0]
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
      return `${pref}${idx + 1}@correo.com`;
    }),
  ].slice(0, 3);

  const actaInicio = `AI-${dayjs().format("YYYY")}-${String(
    noTramite.match(/\d+/)?.[0] ?? "1"
  ).slice(-4)}`;

  const fechaApertura = dayjs()
    .subtract(Number(noTramite.replace(/\D/g, "").slice(-2) || 5), "day")
    .format("DD/MM/YYYY");

  return {
    noTramite,
    ruc,
    razonSocial,
    actaInicio,
    representanteLegal,
    correo: correoPrincipal,
    correos: otrosCorreos,
    fechaApertura,
    estadoCaso: randomFrom(seed + "|estado", [
      "EN PROCESO",
      "PENDIENTE DOCUMENTACIÓN",
      "EN ANÁLISIS",
      "ACTIVO",
    ]),
  };
};

const buildMockResultados = (ruc?: string, tramite?: string): CasoInfo[] => {
  const r = (ruc ?? "").trim();
  const t = (tramite ?? "").trim();

  if (!r && !t) return [];

  if (t) {
    const rucFinal = r || "8-000-000";
    return [buildMockCaso(rucFinal, t)];
  }

  const rucFinal = r || "8-000-000";
  const y = dayjs().format("YYYY");
  const base = rucFinal.replace(/[^0-9]/g, "").slice(-3) || "001";

  const tramites = Array.from({ length: 5 }).map((_, idx) => {
    const n = String(Number(base) + idx).padStart(6, "0");
    return `${y}-${n}`;
  });

  return tramites.map((noTramite) => buildMockCaso(rucFinal, noTramite));
};

const isRucValido = (value: string) => {
  if (!value.trim()) return true;
  return /^[0-9A-Za-z-]+$/.test(value.trim());
};

type Props = {
  handleSelect: (ruta: string, state?: any) => void;
};

const ComunicacionesEnviosPage: React.FC<Props> = ({ handleSelect }) => {
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

    if (r && !isRucValido(r)) {
      setRows([]);
      setSelectedCaso(null);
      setError("RUC errado.");
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
    <Box component={Paper} sx={{ p: 2.5, borderRadius: 3 }}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={1}
        sx={{ mb: 2, alignItems: { xs: "flex-start", md: "center" } }}
      >
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          Comunicaciones → Envíos
        </Typography>

        <Chip
          label="Mockup funcional front"
          color="primary"
          variant="outlined"
          size="small"
        />
      </Stack>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Simulación visual del flujo de búsqueda, selección de caso y gestión de
        envío al contribuyente.
      </Typography>

      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        sx={{
          mb: 2,
          alignItems: "stretch",
          "& .MuiTextField-root": { flex: 1 },
          "& .MuiButton-root": { minWidth: 120, fontWeight: "bold", height: 56 },
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
        <Box
          sx={{
            py: 7,
            textAlign: "center",
            color: "text.secondary",
            border: "1px dashed",
            borderColor: "divider",
            borderRadius: 2,
            bgcolor: "grey.50",
          }}
        >
          Ingresa <b>RUC</b>, <b>Número de trámite</b> o ambos y presiona{" "}
          <b>Buscar</b>.
        </Box>
      ) : (
        <>
          <Divider sx={{ my: 2 }} />
          <TablaResultadosComunicacion
            rows={rows}
            onSelect={(row) => setSelectedCaso(row)}
            onGoTrazabilidad={({ ruc, noTramite }) => {
              handleSelect("TRAZABILIDAD DE COMUNICACIONES", {
                ruc,
                noTramite,
              });
            }}
          />
        </>
      )}

      <Dialog
        open={!!selectedCaso}
        onClose={() => setSelectedCaso(null)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 900 }}>
          Gestión de Envíos / Comunicación
        </DialogTitle>

        <DialogContent sx={{ pt: 1 }}>
          {selectedCaso ? (
            <EnviosComunicacion
              caso={selectedCaso}
              onClose={() => setSelectedCaso(null)}
              onGoTrazabilidad={({ ruc, noTramite }) => {
                setSelectedCaso(null);
                handleSelect("TRAZABILIDAD DE COMUNICACIONES", {
                  ruc,
                  noTramite,
                });
              }}
              handleGo={(view) => {
                setSelectedCaso(null);
                handleSelect(view);
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default ComunicacionesEnviosPage;