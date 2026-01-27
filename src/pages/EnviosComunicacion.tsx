// src/pages/EnviosComunicacion.tsx
import * as React from "react";
import {
  Box,
  Paper,
  Stack,
  TextField,
  Button,
  Typography,
  Divider,
  Grid,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Alert,
  Chip,
} from "@mui/material";
import dayjs from "dayjs";
import Trazabilidad, { type TrazaItem, type EstadoAprobacion } from "../components/Trazabilidad";
import { buildMockTrazas } from "../services/mockTrazas";

type ModalidadEnvio = "CORREO" | "PLATAFORMA" | "TODAS";
type TipoNotificacionPlataforma = "ELECTRONICA" | "PRESENCIAL";
type DocumentoFormal = "ACTA_INICIO" | "PROPUESTA_REG" | "RESOLUCION" | "ACTA_CIERRE";

type CasoInfo = {
  noTramite: string;
  ruc: string;
  razonSocial: string;
  actaInicio: string;
  representanteLegal: string;
  correo: string;
};

const DOCS: { value: DocumentoFormal; label: string }[] = [
  { value: "ACTA_INICIO", label: "Acta de Inicio" },
  { value: "PROPUESTA_REG", label: "Propuesta de Regularización" },
  { value: "RESOLUCION", label: "Resolución" },
  { value: "ACTA_CIERRE", label: "Acta de Cierre" },
];

const labelModalidad = (m: ModalidadEnvio) =>
  m === "CORREO" ? "Correo Electrónico" : m === "PLATAFORMA" ? "Notificación por Plataforma" : "Todas";

const randomFrom = (seed: string, arr: string[]) => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return arr[h % arr.length];
};

const buildMockCaso = (key: string): CasoInfo => {
  const empresas = [
    "Comercial La Esperanza, S.A.",
    "Servicios del Istmo, S.R.L.",
    "Inversiones Panamá Norte, S.A.",
    "Distribuidora Pacífico, S.A.",
    "Constructora Bahía Azul, S.A.",
  ];
  const reps = ["Luis Gómez", "María Pérez", "Carlos Díaz", "Ana Sánchez", "Pedro Rodríguez"];
  const razonSocial = randomFrom(key + "|rs", empresas);
  const representanteLegal = randomFrom(key + "|rep", reps);
  const correo = `${razonSocial.split(" ")[0].toLowerCase().replace(/[^a-z0-9]/g, "")}@correo.com`;

  const noTramite = key.split("|")[1]?.trim() || "2026-000001";
  const ruc = key.split("|")[0]?.trim() || "8-000-000";

  return {
    noTramite,
    ruc,
    razonSocial,
    actaInicio: `AI-${dayjs().format("YYYY")}-${String((noTramite.match(/\d+/)?.[0] ?? "1")).slice(-4)}`,
    representanteLegal,
    correo,
  };
};

const buildActividad = (m: ModalidadEnvio, tipoNotif?: TipoNotificacionPlataforma, doc?: DocumentoFormal, adj?: boolean) => {
  if (m === "CORREO") return adj ? `Envío de correo (con adjunto${doc ? `: ${doc}` : ""})` : "Envío de correo";
  if (m === "PLATAFORMA") return `Notificación por plataforma (${tipoNotif ?? "ELECTRONICA"})`;
  return `Envío por correo y plataforma`;
};

const EnviosComunicacion: React.FC = () => {
  // búsqueda
  const [ruc, setRuc] = React.useState("");
  const [tramite, setTramite] = React.useState("");

  // caso + trazas
  const [caso, setCaso] = React.useState<CasoInfo | null>(null);
  const [trazas, setTrazas] = React.useState<TrazaItem[]>([]);

  // formulario envío
  const [modalidad, setModalidad] = React.useState<ModalidadEnvio>("CORREO");

  // correo
  const [requiereAdjunto, setRequiereAdjunto] = React.useState(false);
  const [documento, setDocumento] = React.useState<DocumentoFormal>("ACTA_INICIO");

  // plataforma
  const [tipoNotif, setTipoNotif] = React.useState<TipoNotificacionPlataforma>("ELECTRONICA");

  // ✅ obligatorio
  const [observacion, setObservacion] = React.useState("");
  const [error, setError] = React.useState<string>("");

  const key = React.useMemo(() => `${ruc.trim()}|${tramite.trim()}`, [ruc, tramite]);

  const resetFormEnvio = React.useCallback(() => {
    setModalidad("CORREO");
    setRequiereAdjunto(false);
    setDocumento("ACTA_INICIO");
    setTipoNotif("ELECTRONICA");
    setObservacion("");
    setError("");
  }, []);

  const handleBuscar = () => {
    const rucClean = ruc.trim();
    const traClean = tramite.trim();

    if (!rucClean && !traClean) {
      setCaso(null);
      setTrazas([]);
      resetFormEnvio();
      return;
    }

    const k = `${rucClean}|${traClean}`;
    setCaso(buildMockCaso(k));
    setTrazas(buildMockTrazas(k)); // trae historial simulado
    resetFormEnvio();
  };

  const handleLimpiar = () => {
    setRuc("");
    setTramite("");
    setCaso(null);
    setTrazas([]);
    resetFormEnvio();
  };

  const handleEnviar = () => {
    setError("");

    if (!caso) {
      setError("Primero debes buscar un RUC o un Número de trámite.");
      return;
    }

    const obs = observacion.trim();
    if (!obs) {
      setError("La observación es obligatoria antes de enviar.");
      return;
    }

    // ✅ reglas mínimas: si correo seleccionado, preguntamos adjunto (y si requiereAdjunto, debe haber documento)
    if ((modalidad === "CORREO" || modalidad === "TODAS") && requiereAdjunto && !documento) {
      setError("Debes seleccionar el documento a adjuntar.");
      return;
    }

    const nowISO = new Date().toISOString();

    const actividad = buildActividad(
      modalidad,
      modalidad === "PLATAFORMA" || modalidad === "TODAS" ? tipoNotif : undefined,
      modalidad === "CORREO" || modalidad === "TODAS" ? documento : undefined,
      modalidad === "CORREO" || modalidad === "TODAS" ? requiereAdjunto : false
    );

    const nuevo: TrazaItem = {
      id: `ENV-${Date.now()}`,
      actividad,
      usuarioGestion: "Auditor (Simulado)",
      fechaInicialISO: nowISO,
      fechaFinalISO: "", // queda pendiente hasta respuesta
      estado: "PENDIENTE" as EstadoAprobacion,
      observacion: obs,
    };

    // guardamos en trazabilidad (simulado)
    setTrazas((prev) => [nuevo, ...prev]);

    // limpiamos solo observación (puedes cambiar si quieres)
    setObservacion("");
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleBuscar();
  };

  const showCorreoBlock = modalidad === "CORREO" || modalidad === "TODAS";
  const showPlataformaBlock = modalidad === "PLATAFORMA" || modalidad === "TODAS";

  return (
    <Box component={Paper} sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Comunicaciones → Envíos
      </Typography>

      {/* Busqueda */}
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

      {!caso ? (
        <Box sx={{ py: 6, textAlign: "center", color: "text.secondary" }}>
          Ingresa <b>RUC</b>, <b>Número de trámite</b> o ambos y presiona <b>Buscar</b>.
        </Box>
      ) : (
        <>
          {/* Info caso */}
          <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
            <Stack direction="row" spacing={1} sx={{ mb: 1 }} alignItems="center">
              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                Información del Contribuyente / Caso
              </Typography>
              <Chip size="small" label={`Trámite: ${caso.noTramite}`} />
              <Chip size="small" label={`RUC: ${caso.ruc}`} />
            </Stack>

            <Grid container spacing={1.5}>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">
                  Razón Social
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 700 }}>
                  {caso.razonSocial}
                </Typography>
              </Grid>

              <Grid item xs={12} md={3}>
                <Typography variant="body2" color="text.secondary">
                  No. Acta de Inicio
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 700 }}>
                  {caso.actaInicio}
                </Typography>
              </Grid>

              <Grid item xs={12} md={3}>
                <Typography variant="body2" color="text.secondary">
                  Correo
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 700 }}>
                  {caso.correo}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">
                  Representante Legal
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 700 }}>
                  {caso.representanteLegal}
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          <Divider sx={{ my: 2 }} />

          {/* Form envio */}
          <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>
            Envío de Comunicación Formal
          </Typography>

          {error ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          ) : null}

          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                select
                fullWidth
                label="Modalidad de Envío"
                value={modalidad}
                onChange={(e) => {
                  const v = e.target.value as ModalidadEnvio;
                  setModalidad(v);
                  setError("");
                }}
              >
                <MenuItem value="CORREO">Correo Electrónico</MenuItem>
                <MenuItem value="PLATAFORMA">Notificación por Plataforma</MenuItem>
                <MenuItem value="TODAS">Todas</MenuItem>
              </TextField>
            </Grid>

            {showPlataformaBlock ? (
              <Grid item xs={12} md={4}>
                <TextField
                  select
                  fullWidth
                  label="Tipo de Notificación (Plataforma)"
                  value={tipoNotif}
                  onChange={(e) => setTipoNotif(e.target.value as TipoNotificacionPlataforma)}
                >
                  <MenuItem value="ELECTRONICA">Electrónica</MenuItem>
                  <MenuItem value="PRESENCIAL">Presencial</MenuItem>
                </TextField>
              </Grid>
            ) : null}

            {showCorreoBlock ? (
              <Grid item xs={12} md={4}>
                <Paper variant="outlined" sx={{ p: 1.5, height: "100%" }}>
                  <Typography variant="body2" sx={{ fontWeight: 800, mb: 0.5 }}>
                    Correo Electrónico
                  </Typography>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={requiereAdjunto}
                        onChange={(e) => setRequiereAdjunto(e.target.checked)}
                      />
                    }
                    label="Requiere adjuntar documento"
                  />
                  {requiereAdjunto ? (
                    <TextField
                      select
                      fullWidth
                      label="Documento a enviar"
                      value={documento}
                      onChange={(e) => setDocumento(e.target.value as DocumentoFormal)}
                      sx={{ mt: 1 }}
                    >
                      {DOCS.map((d) => (
                        <MenuItem key={d.value} value={d.value}>
                          {d.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  ) : null}
                </Paper>
              </Grid>
            ) : null}

            {/* ✅ Observación obligatoria */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Observación (obligatoria antes de enviar)"
                value={observacion}
                onChange={(e) => {
                  setObservacion(e.target.value);
                  if (error) setError("");
                }}
                placeholder="Ej.: Se remite Acta de Inicio para notificación formal y constancia de entrega."
                multiline
                minRows={3}
              />
            </Grid>

            <Grid item xs={12}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} justifyContent="flex-end">
                <Button
                  variant="outlined"
                  color="inherit"
                  onClick={() => {
                    setObservacion("");
                    setError("");
                  }}
                >
                  Limpiar observación
                </Button>
                <Button variant="contained" onClick={handleEnviar}>
                  Enviar 
                </Button>
              </Stack>

              {/* <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                Al enviar (simulado) se crea un registro en trazabilidad con estado <b>PENDIENTE</b>, fecha inicial y
                la <b>Observación</b>.
              </Typography> */}
              <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                Modalidad seleccionada: <b>{labelModalidad(modalidad)}</b>
              </Typography>
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />

          {/* Trazabilidad */}
          {/* <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>
            Trazabilidad del Caso
          </Typography>
          <Trazabilidad rows={trazas} height={460} /> */}
        </>
      )}
    </Box>
  );
};

export default EnviosComunicacion;
