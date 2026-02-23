// src/pages/HomeJefeSeccionFiscalizacion.tsx
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

import { loadParamAlertas, type AlertaParam } from "../services/mockParamAlertas";

type Semaforo = "ROJO" | "AMARILLO" | "VERDE" | "GRIS";

type EstadoActividad =
  | "PENDIENTE_REVISION"
  | "EN_EJECUCION"
  | "EN_ESPERA_CONTRIBUYENTE"
  | "POR_VENCER"
  | "VENCIDA"
  | "CERRADA"
  | "ANULADA";

type ActividadBase = {
  id: string;
  tramite: string;
  ruc: string;
  contribuyente: string;
  actividad: string;
  estado: EstadoActividad;
  fechaAsignacion: string; // YYYY-MM-DD
  auditor: string; // antes: analista
  supervisor: string; // nuevo
};

type ActividadView = ActividadBase & {
  semaforo: Semaforo;
  diasTranscurridos: number;
  totalDiasPermitidos: number | null;
  fechaVencimiento: string | null;
  diasRestantes: number | null;
  paramMatched: boolean;
};

function fmtDate(ymd: string) {
  const d = new Date(ymd + "T00:00:00");
  return d.toLocaleDateString("es-CO", { year: "numeric", month: "2-digit", day: "2-digit" });
}

function todayYmd() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function daysBetween(startYmd: string, endYmd: string) {
  const a = new Date(startYmd + "T00:00:00").getTime();
  const b = new Date(endYmd + "T00:00:00").getTime();
  return Math.floor((b - a) / (1000 * 60 * 60 * 24));
}

function addDaysYmd(startYmd: string, n: number) {
  const d = new Date(startYmd + "T00:00:00");
  d.setDate(d.getDate() + n);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** ✅ Normaliza textos para hacer match flexible */
function normalize(s: string) {
  return (s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quita acentos
    .replace(/\([^)]*\)/g, " ") // quita (706), (799), etc.
    .replace(/[^a-z0-9\s]/g, " ") // quita signos raros
    .replace(/\s+/g, " ")
    .trim();
}

/** ✅ Match flexible: exacto -> incluye -> por tokens */
function findParamByActividad(params: AlertaParam[], actividad: string) {
  const a = normalize(actividad);
  if (!a) return undefined;

  // 1) exacto
  let found = params.find((p) => normalize(p.actividad) === a);
  if (found) return found;

  // 2) includes (ambos sentidos)
  found = params.find((p) => {
    const pa = normalize(p.actividad);
    return pa && (a.includes(pa) || pa.includes(a));
  });
  if (found) return found;

  // 3) tokens (si comparte suficientes palabras)
  const tokens = new Set(a.split(" ").filter(Boolean));
  found = params.find((p) => {
    const pa = normalize(p.actividad);
    if (!pa) return false;
    const pt = pa.split(" ").filter(Boolean);
    const hits = pt.filter((t) => tokens.has(t)).length;
    return hits >= Math.min(3, Math.max(1, pt.length - 1));
  });

  return found;
}

function semaforoFromParam(param: AlertaParam | undefined, diasTranscurridos: number): Semaforo {
  if (!param) return "GRIS";
  const d = diasTranscurridos;

  if (d >= param.rojoDesde && d <= param.rojoHasta) return "ROJO";
  if (d >= param.amarilloDesde && d <= param.amarilloHasta) return "AMARILLO";
  if (d >= param.verdeDesde && d <= param.verdeHasta) return "VERDE";
  if (d > param.totalDiasPermitidos) return "ROJO";
  if (d < param.verdeDesde) return "VERDE";
  return "GRIS";
}

function chipSemaforo(s: Semaforo) {
  switch (s) {
    case "ROJO":
      return { label: "Rojo", sx: { bgcolor: "#fde7e9", color: "#b42318", borderColor: "#fecdca" } };
    case "AMARILLO":
      return { label: "Amarillo", sx: { bgcolor: "#fff6d6", color: "#8a5a00", borderColor: "#ffe59a" } };
    case "VERDE":
      return { label: "Verde", sx: { bgcolor: "#e7f8ed", color: "#027a48", borderColor: "#abefc6" } };
    default:
      return { label: "Sin SLA", sx: { bgcolor: "#f4f4f5", color: "#52525b", borderColor: "#e4e4e7" } };
  }
}

function chipEstado(e: EstadoActividad): { label: string; icon?: React.ReactElement } {
  const map: Record<EstadoActividad, { label: string; icon?: React.ReactElement }> = {
    PENDIENTE_REVISION: { label: "Pendiente revisión", icon: <PendingActionsIcon fontSize="small" /> },
    EN_EJECUCION: { label: "En ejecución" },
    EN_ESPERA_CONTRIBUYENTE: { label: "Espera contribuyente" },
    POR_VENCER: { label: "Por vencer", icon: <WarningAmberIcon fontSize="small" /> },
    VENCIDA: { label: "Vencida", icon: <WarningAmberIcon fontSize="small" /> },
    CERRADA: { label: "Cerrada", icon: <AssignmentTurnedInIcon fontSize="small" /> },
    ANULADA: { label: "Anulada" },
  };
  return map[e];
}

/** ✅ Mock mínimo (YA SIN tipo/prioridad, y con auditor/supervisor) */
const MOCK: ActividadBase[] = [
  {
    id: "A-1001",
    tramite: "TR-2026-000145",
    ruc: "1555666-1-2026",
    contribuyente: "Comercial El Sol, S.A.",
    actividad: "Informe de Auditoría (706)",
    estado: "POR_VENCER",
    fechaAsignacion: "2026-02-01",
    auditor: "J. Pérez",
    supervisor: "S. Martínez",
  },
  {
    id: "A-1002",
    tramite: "TR-2026-000188",
    ruc: "1888777-2-2025",
    contribuyente: "Inversiones Delta, Inc.",
    actividad: "Verificación de Inconsistencias",
    estado: "EN_EJECUCION",
    fechaAsignacion: "2026-02-10",
    auditor: "M. Ríos",
    supervisor: "S. Martínez",
  },
  {
    id: "A-1003",
    tramite: "TR-2026-000201",
    ruc: "1020304-3-2024",
    contribuyente: "Servicios Pacífico, S.A.",
    actividad: "Requerimiento (documentación)",
    estado: "EN_ESPERA_CONTRIBUYENTE",
    fechaAsignacion: "2026-01-25",
    auditor: "L. Gómez",
    supervisor: "C. Valdés",
  },
  {
    id: "A-1004",
    tramite: "TR-2026-000099",
    ruc: "9090909-9-2023",
    contribuyente: "Transportes Andina, S.A.",
    actividad: "Caso Omiso (apertura)",
    estado: "VENCIDA",
    fechaAsignacion: "2026-01-05",
    auditor: "D. Torres",
    supervisor: "C. Valdés",
  },
];

export default function HomeJefeSeccionFiscalizacion() {
  const [search, setSearch] = useState("");
  const [estado, setEstado] = useState<"TODOS" | EstadoActividad>("TODOS");

  // ✅ filtro por semaforización (colores)
  const [semaforoFiltro, setSemaforoFiltro] = useState<"TODOS" | "VERDE" | "AMARILLO" | "ROJO">("TODOS");

  // ✅ si cambias parametrización y quieres refrescar: usa estado "tick"
  const [tick, setTick] = useState(0);

  const params = useMemo(() => loadParamAlertas(), [tick]);

  const data = useMemo<ActividadView[]>(() => {
    const hoy = todayYmd();

    let rows: ActividadView[] = MOCK.map((r) => {
      const param = findParamByActividad(params, r.actividad);
      const diasTranscurridos = Math.max(0, daysBetween(r.fechaAsignacion, hoy));
      const totalDias = param?.totalDiasPermitidos ?? null;

      const fechaVencimiento = totalDias ? addDaysYmd(r.fechaAsignacion, totalDias) : null;
      const diasRestantes = totalDias ? totalDias - diasTranscurridos : null;

      const sem = semaforoFromParam(param, diasTranscurridos);

      return {
        ...r,
        semaforo: sem,
        diasTranscurridos,
        totalDiasPermitidos: totalDias,
        fechaVencimiento,
        diasRestantes,
        paramMatched: !!param,
      };
    });

    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter((r) => {
        const blob = `${r.tramite} ${r.ruc} ${r.contribuyente} ${r.actividad} ${r.auditor} ${r.supervisor}`.toLowerCase();
        return blob.includes(q);
      });
    }

    if (estado !== "TODOS") rows = rows.filter((r) => r.estado === estado);

    if (semaforoFiltro !== "TODOS") {
      rows = rows.filter((r) => r.semaforo === semaforoFiltro);
    }

    // Orden: rojo -> amarillo -> verde -> gris, luego por días restantes
    const rank: Record<Semaforo, number> = { ROJO: 0, AMARILLO: 1, VERDE: 2, GRIS: 3 };
    rows.sort((a, b) => {
      const ra = rank[a.semaforo] - rank[b.semaforo];
      if (ra !== 0) return ra;

      const da = a.diasRestantes ?? 999999;
      const db = b.diasRestantes ?? 999999;
      return da - db;
    });

    return rows;
  }, [params, search, estado, semaforoFiltro]);

  const kpis = useMemo(() => {
    const total = data.length;
    const rojas = data.filter((x) => x.semaforo === "ROJO").length;
    const amarillas = data.filter((x) => x.semaforo === "AMARILLO").length;
    const verdes = data.filter((x) => x.semaforo === "VERDE").length;
    const pendientes = data.filter((x) => x.estado === "PENDIENTE_REVISION").length;
    const espera = data.filter((x) => x.estado === "EN_ESPERA_CONTRIBUYENTE").length;
    const sinSla = data.filter((x) => x.semaforo === "GRIS").length;
    return { total, rojas, amarillas, verdes, pendientes, espera, sinSla };
  }, [data]);

  return (
    <Box sx={{ p: 2 }}>
      <Stack direction="row" alignItems="flex-end" justifyContent="space-between" spacing={2}>
        <Box>
          <Typography variant="h5" fontWeight={800}>
            Home – Jefe de Sección (Fiscalización)
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Bandeja con semaforización (Verde/Amarillo/Rojo) calculada desde Parametrización → Alertas.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1}>
          <Tooltip title="Refrescar parametrización (localStorage)">
            <IconButton onClick={() => setTick((x) => x + 1)}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      <Divider sx={{ my: 2 }} />

      <Grid container spacing={2}>
        <Grid item xs={12} md={2.4}>
          <Paper sx={{ p: 2, borderRadius: 3 }}>
            <Typography variant="caption" color="text.secondary">Total</Typography>
            <Typography variant="h4" fontWeight={800}>{kpis.total}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={2.4}>
          <Paper sx={{ p: 2, borderRadius: 3 }}>
            <Typography variant="caption" color="text.secondary">Rojo</Typography>
            <Typography variant="h4" fontWeight={800}>{kpis.rojas}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={2.4}>
          <Paper sx={{ p: 2, borderRadius: 3 }}>
            <Typography variant="caption" color="text.secondary">Amarillo</Typography>
            <Typography variant="h4" fontWeight={800}>{kpis.amarillas}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={2.4}>
          <Paper sx={{ p: 2, borderRadius: 3 }}>
            <Typography variant="caption" color="text.secondary">Verde</Typography>
            <Typography variant="h4" fontWeight={800}>{kpis.verdes}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={2.4}>
          <Paper sx={{ p: 2, borderRadius: 3 }}>
            <Typography variant="caption" color="text.secondary">Pendiente / Espera</Typography>
            <Typography variant="h4" fontWeight={800}>{kpis.pendientes} / {kpis.espera}</Typography>
            <Typography variant="caption" color="text.secondary">Sin SLA: {kpis.sinSla}</Typography>
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ p: 2, mt: 2, borderRadius: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={5}>
            <TextField
              fullWidth
              label="Buscar"
              placeholder="Trámite, RUC, contribuyente, actividad, auditor, supervisor…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField select fullWidth label="Estado" value={estado} onChange={(e) => setEstado(e.target.value as any)}>
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

          <Grid item xs={12} md={2}>
            <TextField
              select
              fullWidth
              label="Semaforización"
              value={semaforoFiltro}
              onChange={(e) => setSemaforoFiltro(e.target.value as any)}
            >
              <MenuItem value="TODOS">Todos</MenuItem>
              <MenuItem value="VERDE">Verde</MenuItem>
              <MenuItem value="AMARILLO">Amarillo</MenuItem>
              <MenuItem value="ROJO">Rojo</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} md={2}>
            <Stack direction="row" justifyContent="flex-end" spacing={1}>
              <Button
                variant="outlined"
                onClick={() => {
                  setSearch("");
                  setEstado("TODOS");
                  setSemaforoFiltro("TODOS");
                }}
              >
                Limpiar
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 2, mt: 2, borderRadius: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
          <Typography variant="h6" fontWeight={800}>
            Actividades ({data.length})
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Ordenado por criticidad y días restantes
          </Typography>
        </Stack>

        <Box sx={{ overflowX: "auto" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell><b>Semáforo</b></TableCell>
                <TableCell><b>Estado</b></TableCell>
                <TableCell><b>Trámite</b></TableCell>
                <TableCell><b>RUC</b></TableCell>
                <TableCell><b>Contribuyente</b></TableCell>
                <TableCell><b>Actividad</b></TableCell>

                <TableCell><b>Asignado</b></TableCell>
                <TableCell align="right"><b>Total</b></TableCell>
                <TableCell align="right"><b>Transc.</b></TableCell>
                <TableCell align="right"><b>Restan</b></TableCell>
                <TableCell><b>Vence</b></TableCell>

                <TableCell><b>Auditor</b></TableCell>
                <TableCell><b>Supervisor</b></TableCell>

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
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip
                          variant="outlined"
                          label={s.label}
                          sx={{ ...s.sx, borderWidth: 1 }}
                          size="small"
                        />
                        {!r.paramMatched && (
                          <Tooltip title="No se encontró parametrización para esta actividad">
                            <Chip size="small" variant="outlined" label="Sin matriz" />
                          </Tooltip>
                        )}
                      </Stack>
                    </TableCell>

                    <TableCell>
                      <Chip size="small" variant="outlined" icon={e.icon} label={e.label} />
                    </TableCell>

                    <TableCell>
                      <Typography fontWeight={700}>{r.tramite}</Typography>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2">{r.ruc}</Typography>
                    </TableCell>

                    <TableCell>
                      <Typography fontWeight={700}>{r.contribuyente}</Typography>
                    </TableCell>

                    <TableCell>
                      <Typography>{r.actividad}</Typography>
                    </TableCell>

                    <TableCell>{fmtDate(r.fechaAsignacion)}</TableCell>

                    <TableCell align="right">
                      <Typography fontWeight={800}>{r.totalDiasPermitidos ?? "—"}</Typography>
                    </TableCell>

                    <TableCell align="right">
                      <Typography fontWeight={800}>{r.diasTranscurridos}</Typography>
                    </TableCell>

                    <TableCell align="right">
                      <Typography
                        fontWeight={800}
                        color={typeof r.diasRestantes === "number" && r.diasRestantes < 0 ? "error.main" : "text.primary"}
                      >
                        {r.diasRestantes ?? "—"}
                      </Typography>
                    </TableCell>

                    <TableCell>{r.fechaVencimiento ? fmtDate(r.fechaVencimiento) : "—"}</TableCell>

                    <TableCell>
                      <Typography>{r.auditor}</Typography>
                    </TableCell>

                    <TableCell>
                      <Typography>{r.supervisor}</Typography>
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
                  <TableCell colSpan={14}>
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