import React, { useMemo, useState } from "react";
import {
  Box,
  Grid,
  Paper,
  Typography,
  Stack,
  Chip,
  Divider,
  TextField,
  MenuItem,
  Button,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import VisibilityIcon from "@mui/icons-material/Visibility";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import PendingActionsIcon from "@mui/icons-material/PendingActions";

type Semaforo = "ROJO" | "AMARILLO" | "VERDE" | "GRIS";

type EstadoActividad =
  | "PENDIENTE_REVISION"
  | "EN_EJECUCION"
  | "EN_ESPERA_CONTRIBUYENTE"
  | "POR_VENCER"
  | "VENCIDA"
  | "CERRADA"
  | "ANULADA";

type Actividad = {
  id: string;
  tramite: string;
  ruc: string;
  contribuyente: string;
  actividad: string;
  tipo: "Auditoría" | "Verificación" | "Omiso" | "Rectificativa" | "Cierre";
  estado: EstadoActividad;
  semaforo: Semaforo;
  fechaAsignacion: string; // YYYY-MM-DD
  fechaVencimiento: string; // YYYY-MM-DD
  diasRestantes: number; // puede ser negativo
  analista: string;
  prioridad: "Alta" | "Media" | "Baja";
};

function fmtDate(ymd: string) {
  const d = new Date(ymd + "T00:00:00");
  return d.toLocaleDateString("es-CO", { year: "numeric", month: "2-digit", day: "2-digit" });
}

function chipSemaforo(s: Semaforo) {
  switch (s) {
    case "ROJO":
      return { label: "Crítico", sx: { bgcolor: "#fde7e9", color: "#b42318", borderColor: "#fecdca" } };
    case "AMARILLO":
      return { label: "Alerta", sx: { bgcolor: "#fff6d6", color: "#8a5a00", borderColor: "#ffe59a" } };
    case "VERDE":
      return { label: "En tiempo", sx: { bgcolor: "#e7f8ed", color: "#027a48", borderColor: "#abefc6" } };
    default:
      return { label: "Sin SLA", sx: { bgcolor: "#f4f4f5", color: "#52525b", borderColor: "#e4e4e7" } };
  }
}

function chipEstado(
  e: EstadoActividad
): { label: string; icon?: React.ReactElement; sx?: any } {
  const map: Record<
    EstadoActividad,
    { label: string; icon?: React.ReactElement; sx?: any }
  > = {
    PENDIENTE_REVISION: {
      label: "Pendiente revisión",
      icon: <PendingActionsIcon fontSize="small" />,
    },
    EN_EJECUCION: { label: "En ejecución" },
    EN_ESPERA_CONTRIBUYENTE: { label: "Espera contribuyente" },
    POR_VENCER: { label: "Por vencer", icon: <WarningAmberIcon fontSize="small" /> },
    VENCIDA: { label: "Vencida", icon: <WarningAmberIcon fontSize="small" /> },
    CERRADA: { label: "Cerrada", icon: <AssignmentTurnedInIcon fontSize="small" /> },
    ANULADA: { label: "Anulada" },
  };

  return map[e];
}


/** ✅ Mock para mostrar varios estados y semáforos */
const MOCK: Actividad[] = [
  {
    id: "A-1001",
    tramite: "TR-2026-000145",
    ruc: "1555666-1-2026",
    contribuyente: "Comercial El Sol, S.A.",
    actividad: "Informe de Auditoría (706)",
    tipo: "Auditoría",
    estado: "POR_VENCER",
    semaforo: "AMARILLO",
    fechaAsignacion: "2026-02-01",
    fechaVencimiento: "2026-02-20",
    diasRestantes: 2,
    analista: "Analista: J. Pérez",
    prioridad: "Alta",
  },
  {
    id: "A-1002",
    tramite: "TR-2026-000188",
    ruc: "1888777-2-2025",
    contribuyente: "Inversiones Delta, Inc.",
    actividad: "Verificación de Inconsistencias",
    tipo: "Verificación",
    estado: "EN_EJECUCION",
    semaforo: "VERDE",
    fechaAsignacion: "2026-02-10",
    fechaVencimiento: "2026-03-05",
    diasRestantes: 15,
    analista: "Analista: M. Ríos",
    prioridad: "Media",
  },
  {
    id: "A-1003",
    tramite: "TR-2026-000201",
    ruc: "1020304-3-2024",
    contribuyente: "Servicios Pacífico, S.A.",
    actividad: "Requerimiento (documentación)",
    tipo: "Auditoría",
    estado: "EN_ESPERA_CONTRIBUYENTE",
    semaforo: "GRIS",
    fechaAsignacion: "2026-01-25",
    fechaVencimiento: "2026-03-01",
    diasRestantes: 11,
    analista: "Analista: L. Gómez",
    prioridad: "Media",
  },
  {
    id: "A-1004",
    tramite: "TR-2026-000099",
    ruc: "9090909-9-2023",
    contribuyente: "Transportes Andina, S.A.",
    actividad: "Caso Omiso (apertura)",
    tipo: "Omiso",
    estado: "VENCIDA",
    semaforo: "ROJO",
    fechaAsignacion: "2026-01-05",
    fechaVencimiento: "2026-02-12",
    diasRestantes: -6,
    analista: "Analista: D. Torres",
    prioridad: "Alta",
  },
  {
    id: "A-1005",
    tramite: "TR-2026-000220",
    ruc: "4455667-1-2026",
    contribuyente: "Global Market, S.A.",
    actividad: "Acta de Cierre (799)",
    tipo: "Cierre",
    estado: "CERRADA",
    semaforo: "VERDE",
    fechaAsignacion: "2026-01-15",
    fechaVencimiento: "2026-02-10",
    diasRestantes: 0,
    analista: "Analista: C. Méndez",
    prioridad: "Baja",
  },
  {
    id: "A-1006",
    tramite: "TR-2026-000173",
    ruc: "7771112-4-2025",
    contribuyente: "Constructora Norte, S.A.",
    actividad: "Rectificativa (análisis preliminar)",
    tipo: "Rectificativa",
    estado: "PENDIENTE_REVISION",
    semaforo: "AMARILLO",
    fechaAsignacion: "2026-02-14",
    fechaVencimiento: "2026-02-28",
    diasRestantes: 10,
    analista: "Analista: A. Ruiz",
    prioridad: "Media",
  },
];

export default function HomeJefeSeccionFiscalizacion() {
  const [search, setSearch] = useState("");
  const [estado, setEstado] = useState<"TODOS" | EstadoActividad>("TODOS");
  const [soloCriticos, setSoloCriticos] = useState(false);

  const data = useMemo(() => {
    let rows = [...MOCK];

    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter((r) => {
        const blob = `${r.tramite} ${r.ruc} ${r.contribuyente} ${r.actividad} ${r.analista}`.toLowerCase();
        return blob.includes(q);
      });
    }

    if (estado !== "TODOS") rows = rows.filter((r) => r.estado === estado);

    if (soloCriticos) rows = rows.filter((r) => r.semaforo === "ROJO" || r.semaforo === "AMARILLO");

    // orden: primero ROJO, luego AMARILLO, luego VERDE, luego GRIS; y por días restantes asc
    const rank: Record<Semaforo, number> = { ROJO: 0, AMARILLO: 1, VERDE: 2, GRIS: 3 };
    rows.sort((a, b) => {
      const ra = rank[a.semaforo] - rank[b.semaforo];
      if (ra !== 0) return ra;
      return a.diasRestantes - b.diasRestantes;
    });

    return rows;
  }, [search, estado, soloCriticos]);

  const kpis = useMemo(() => {
    const total = MOCK.length;
    const rojas = MOCK.filter((x) => x.semaforo === "ROJO").length;
    const amarillas = MOCK.filter((x) => x.semaforo === "AMARILLO").length;
    const pendientes = MOCK.filter((x) => x.estado === "PENDIENTE_REVISION").length;
    const espera = MOCK.filter((x) => x.estado === "EN_ESPERA_CONTRIBUYENTE").length;
    return { total, rojas, amarillas, pendientes, espera };
  }, []);

  return (
    <Box sx={{ p: 2 }}>
      {/* Header */}
      <Stack direction="row" alignItems="flex-end" justifyContent="space-between" spacing={2}>
        <Box>
          <Typography variant="h5" fontWeight={800}>
            Home – Jefe de Sección (Fiscalización)
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Bandeja de control: actividades asignadas, alertas por vencimiento y seguimiento de ejecución.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1}>
          <Tooltip title="Refrescar (mock)">
            <IconButton onClick={() => { /* aquí iría refetch */ }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant={soloCriticos ? "contained" : "outlined"}
            onClick={() => setSoloCriticos((v) => !v)}
          >
            {soloCriticos ? "Mostrando críticos" : "Solo críticos"}
          </Button>
        </Stack>
      </Stack>

      <Divider sx={{ my: 2 }} />

      {/* KPI Cards */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, borderRadius: 3 }}>
            <Typography variant="caption" color="text.secondary">
              Total actividades
            </Typography>
            <Typography variant="h4" fontWeight={800}>
              {kpis.total}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, borderRadius: 3 }}>
            <Typography variant="caption" color="text.secondary">
              Críticas (Rojo)
            </Typography>
            <Typography variant="h4" fontWeight={800}>
              {kpis.rojas}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Requiere atención inmediata
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, borderRadius: 3 }}>
            <Typography variant="caption" color="text.secondary">
              Alertas (Amarillo)
            </Typography>
            <Typography variant="h4" fontWeight={800}>
              {kpis.amarillas}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Próximas a vencer
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, borderRadius: 3 }}>
            <Typography variant="caption" color="text.secondary">
              Pendiente revisión / Espera
            </Typography>
            <Typography variant="h4" fontWeight={800}>
              {kpis.pendientes} / {kpis.espera}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Flujo de gestión
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Filtros */}
      <Paper sx={{ p: 2, mt: 2, borderRadius: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Buscar"
              placeholder="Trámite, RUC, contribuyente, actividad, analista…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              select
              fullWidth
              label="Estado"
              value={estado}
              onChange={(e) => setEstado(e.target.value as any)}
            >
              <MenuItem value="TODOS">Todos</MenuItem>
              <MenuItem value="PENDIENTE_REVISION">Pendiente revisión</MenuItem>
              <MenuItem value="EN_EJECUCION">En ejecución</MenuItem>
              <MenuItem value="EN_ESPERA_CONTRIBUYENTE">Espera contribuyente</MenuItem>
              <MenuItem value="POR_VENCER">Por vencer</MenuItem>
              <MenuItem value="VENCIDA">Vencida</MenuItem>
              <MenuItem value="CERRADA">Cerrada</MenuItem>
              <MenuItem value="ANULADA">Anulada</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} md={3}>
            <Stack direction="row" justifyContent="flex-end" spacing={1}>
              <Button
                variant="outlined"
                onClick={() => {
                  setSearch("");
                  setEstado("TODOS");
                  setSoloCriticos(false);
                }}
              >
                Limpiar
              </Button>
              <Button variant="contained" startIcon={<VisibilityIcon />}>
                Ver tablero
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabla */}
      <Paper sx={{ p: 2, mt: 2, borderRadius: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
          <Typography variant="h6" fontWeight={800}>
            Actividades ({data.length})
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Ordenado por semáforo y días restantes
          </Typography>
        </Stack>

        <Box sx={{ overflowX: "auto" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell><b>Semáforo</b></TableCell>
                <TableCell><b>Estado</b></TableCell>
                <TableCell><b>Trámite</b></TableCell>
                <TableCell><b>Contribuyente</b></TableCell>
                <TableCell><b>Actividad</b></TableCell>
                <TableCell><b>Tipo</b></TableCell>
                <TableCell><b>Analista</b></TableCell>
                <TableCell><b>Vence</b></TableCell>
                <TableCell align="right"><b>Días</b></TableCell>
                <TableCell><b>Prioridad</b></TableCell>
                <TableCell align="center"><b>Acciones</b></TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {data.map((r) => {
                const s = chipSemaforo(r.semaforo);
                const e = chipEstado(r.estado);
                return (
                  <TableRow key={r.id} hover>
                    <TableCell>
                      <Chip
                        variant="outlined"
                        label={s.label}
                        sx={{ ...s.sx, borderWidth: 1 }}
                        size="small"
                      />
                    </TableCell>

                    <TableCell>
                      <Chip
                        size="small"
                        variant="outlined"
                        icon={e.icon}
                        label={e.label}
                      />
                    </TableCell>

                    <TableCell>
                      <Typography fontWeight={700}>{r.tramite}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {r.ruc}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography fontWeight={700}>{r.contribuyente}</Typography>
                    </TableCell>

                    <TableCell>
                      <Typography>{r.actividad}</Typography>
                    </TableCell>

                    <TableCell>
                      <Chip size="small" label={r.tipo} variant="outlined" />
                    </TableCell>

                    <TableCell>
                      <Typography>{r.analista}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Asignado: {fmtDate(r.fechaAsignacion)}
                      </Typography>
                    </TableCell>

                    <TableCell>{fmtDate(r.fechaVencimiento)}</TableCell>

                    <TableCell align="right">
                      <Typography fontWeight={800} color={r.diasRestantes < 0 ? "error.main" : "text.primary"}>
                        {r.diasRestantes}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Chip
                        size="small"
                        label={r.prioridad}
                        variant={r.prioridad === "Alta" ? "filled" : "outlined"}
                      />
                    </TableCell>

                    <TableCell align="center">
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <Tooltip title="Ver detalle">
                          <IconButton size="small" onClick={() => alert(`Abrir detalle ${r.id}`)}>
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Tomar acción">
                          <IconButton size="small" onClick={() => alert(`Acción sobre ${r.id}`)}>
                            <AssignmentTurnedInIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}

              {data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={11}>
                    <Typography color="text.secondary">No hay resultados con los filtros actuales.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>
      </Paper>
    </Box>
  );
}
