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
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import PendingActionsIcon from "@mui/icons-material/PendingActions";

import * as XLSX from "xlsx";
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
  auditor: string;
  supervisor: string;
};

type ActividadView = ActividadBase & {
  semaforo: Semaforo;

  diasTranscurridos: number; // capado a total
  diasRestantes: number | null; // nunca negativo

  totalDiasPermitidos: number | null;
  fechaVencimiento: string | null;

  diasAtraso: number | null;

  paramMatched: boolean;
};

const TODOS = "TODOS";

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

function normalize(s: string) {
  return (s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function findParamByActividad(params: AlertaParam[], actividad: string) {
  const a = normalize(actividad);
  if (!a) return undefined;

  let found = params.find((p) => normalize(p.actividad) === a);
  if (found) return found;

  found = params.find((p) => {
    const pa = normalize(p.actividad);
    return pa && (a.includes(pa) || pa.includes(a));
  });
  if (found) return found;

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

function semaforoFromParam(param: AlertaParam | undefined, diasTranscurridosReal: number): Semaforo {
  if (!param) return "GRIS";

  const d = diasTranscurridosReal;

  if (d >= param.rojoDesde && d <= param.rojoHasta) return "ROJO";
  if (d >= param.amarilloDesde && d <= param.amarilloHasta) return "AMARILLO";
  if (d >= param.verdeDesde && d <= param.verdeHasta) return "VERDE";

  if (d >= param.totalDiasPermitidos) return "ROJO";
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

function buildMockFromParams(params: AlertaParam[]): ActividadBase[] {
  const auditores = ["J. Pérez", "M. Ríos", "L. Gómez", "D. Torres", "A. Moreno", "K. Salazar"];
  const supervisores = ["S. Martínez", "C. Valdés", "R. Herrera", "M. Pineda"];
  const estados: EstadoActividad[] = [
    "PENDIENTE_REVISION",
    "EN_EJECUCION",
    "EN_ESPERA_CONTRIBUYENTE",
    "POR_VENCER",
    "VENCIDA",
    "CERRADA",
  ];

  const contribuyentes = [
    "Comercial El Sol, S.A.",
    "Inversiones Delta, Inc.",
    "Servicios Pacífico, S.A.",
    "Transportes Andina, S.A.",
    "Grupo Marítimo Azul, S.A.",
    "Constructora Horizonte, S.A.",
  ];

  const hoy = todayYmd();

  return params.map((p, idx) => {
    const n = idx + 1;
    const yyyy = 2026;

    const tramite = `TR-${yyyy}-${String(100000 + n).slice(-6)}`;
    const ruc = `${String(1000000 + n).slice(-7)}-${(n % 9) + 1}-${yyyy}`;
    const contribuyente = contribuyentes[idx % contribuyentes.length];

    const total = Number(p.totalDiasPermitidos ?? 10) || 10;

    let diasSimulados = 1;
    if (idx % 3 === 0) diasSimulados = Math.max(1, Math.floor(total * 0.3)); // VERDE
    else if (idx % 3 === 1) diasSimulados = Math.max(1, Math.floor(total * 0.7)); // AMARILLO
    else diasSimulados = Math.max(1, Math.floor(total * 0.95)); // ROJO

    const fechaAsignacion = addDaysYmd(hoy, -diasSimulados);

    return {
      id: `A-${1000 + n}`,
      tramite,
      ruc,
      contribuyente,
      actividad: p.actividad,
      estado: estados[idx % estados.length],
      fechaAsignacion,
      auditor: auditores[idx % auditores.length],
      supervisor: supervisores[idx % supervisores.length],
    };
  });
}

function ymd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

function uniqNonEmpty(values: string[]) {
  return Array.from(new Set(values.map((v) => String(v ?? "").trim()).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b, "es")
  );
}

export default function HomeJefeSeccionFiscalizacion() {
  const [search, setSearch] = useState("");
  const [estado, setEstado] = useState<typeof TODOS | EstadoActividad>(TODOS);
  const [semaforoFiltro, setSemaforoFiltro] = useState<typeof TODOS | "VERDE" | "AMARILLO" | "ROJO">(TODOS);

  // ✅ nuevos filtros
  const [fAuditor, setFAuditor] = useState<string>(TODOS);
  const [fSupervisor, setFSupervisor] = useState<string>(TODOS);

  const [tick, setTick] = useState(0);

  const params = useMemo(() => loadParamAlertas(), [tick]);
  const baseRows = useMemo(() => buildMockFromParams(params), [params]);

  // ✅ listas sacadas de la data (no hardcode)
  const auditorOptions = useMemo(() => [TODOS, ...uniqNonEmpty(baseRows.map((r) => r.auditor))], [baseRows]);
  const supervisorOptions = useMemo(() => [TODOS, ...uniqNonEmpty(baseRows.map((r) => r.supervisor))], [baseRows]);

  const data = useMemo<ActividadView[]>(() => {
    const hoy = todayYmd();

    let rows: ActividadView[] = baseRows.map((r) => {
      const param = findParamByActividad(params, r.actividad);

      const diasTranscurridosReal = Math.max(0, daysBetween(r.fechaAsignacion, hoy));
      const totalDias = param?.totalDiasPermitidos ?? null;

      const diasTranscurridosSla =
        typeof totalDias === "number" ? Math.min(diasTranscurridosReal, totalDias) : diasTranscurridosReal;
      const diasRestantes = typeof totalDias === "number" ? Math.max(0, totalDias - diasTranscurridosReal) : null;

      const diasAtraso = typeof totalDias === "number" ? Math.max(0, diasTranscurridosReal - totalDias) : null;
      const fechaVencimiento = typeof totalDias === "number" ? addDaysYmd(r.fechaAsignacion, totalDias) : null;

      const sem = semaforoFromParam(param, diasTranscurridosReal);

      return {
        ...r,
        semaforo: sem,
        diasTranscurridos: diasTranscurridosSla,
        totalDiasPermitidos: totalDias,
        fechaVencimiento,
        diasRestantes,
        diasAtraso,
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

    if (estado !== TODOS) rows = rows.filter((r) => r.estado === estado);
    if (semaforoFiltro !== TODOS) rows = rows.filter((r) => r.semaforo === semaforoFiltro);

    // ✅ filtros auditor / supervisor
    if (fAuditor !== TODOS) rows = rows.filter((r) => r.auditor === fAuditor);
    if (fSupervisor !== TODOS) rows = rows.filter((r) => r.supervisor === fSupervisor);

    // orden
    const rank: Record<Semaforo, number> = { ROJO: 0, AMARILLO: 1, VERDE: 2, GRIS: 3 };
    rows.sort((a, b) => {
      const ra = rank[a.semaforo] - rank[b.semaforo];
      if (ra !== 0) return ra;

      const da = a.diasRestantes ?? 999999;
      const db = b.diasRestantes ?? 999999;
      if (da !== db) return da - db;

      const aa = a.diasAtraso ?? 0;
      const ab = b.diasAtraso ?? 0;
      return ab - aa;
    });

    return rows;
  }, [params, baseRows, search, estado, semaforoFiltro, fAuditor, fSupervisor]);

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

  function exportExcel() {
    const wb = XLSX.utils.book_new();

    const sheetRows = data.map((r) => ({
      Semaforo: r.semaforo,
      Estado: r.estado,
      NoTramite: r.tramite,
      RUC: r.ruc,
      Contribuyente: r.contribuyente,
      Actividad: r.actividad,
      FechaAsignacion: r.fechaAsignacion,
      TotalDiasPermitidos: r.totalDiasPermitidos ?? "",
      DiasTranscurridos: r.diasTranscurridos,
      DiasRestantes: r.diasRestantes ?? "",
      DiasAtraso: r.diasAtraso ?? "",
      FechaVencimiento: r.fechaVencimiento ?? "",
      Auditor: r.auditor,
      Supervisor: r.supervisor,
      Parametrizada: r.paramMatched ? "SI" : "NO",
    }));

    const ws1 = XLSX.utils.json_to_sheet(sheetRows);
    XLSX.utils.book_append_sheet(wb, ws1, "Bandeja Home");

    const paramRows = params.map((p) => ({
      Actividad: p.actividad,
      TotalDiasPermitidos: p.totalDiasPermitidos,
      VerdeDesde: p.verdeDesde,
      VerdeHasta: p.verdeHasta,
      AmarilloDesde: p.amarilloDesde,
      AmarilloHasta: p.amarilloHasta,
      RojoDesde: p.rojoDesde,
      RojoHasta: p.rojoHasta,
    }));

    const ws2 = XLSX.utils.json_to_sheet(paramRows);
    XLSX.utils.book_append_sheet(wb, ws2, "Parametrizacion Alertas");

    const fileName = `Home_Jefe_Seccion_${ymd(new Date())}.xlsx`;
    XLSX.writeFile(wb, fileName);
  }

  function goDetalle(r: ActividadView) {
    // TODO: aquí puedes navegar a /tramites/:id o abrir modal
    alert(`Detalle: ${r.tramite}\nActividad: ${r.actividad}`);
  }

  function goIr(r: ActividadView) {
    // TODO: aquí puedes navegar al módulo real
    alert(`Ir a gestión del trámite: ${r.tramite}`);
  }

  return (
    <Box sx={{ p: 2 }}>
      <Stack direction="row" alignItems="flex-end" justifyContent="space-between" spacing={2}>
        <Box>
          <Typography variant="h5" fontWeight={800}>
            Home – Jefe de Sección Auditoría
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Actividades tomadas del cuadro de alertas (Parametrización → Alertas).
          </Typography>
        </Box>

        <Stack direction="row" spacing={1}>
          <Tooltip title="Refrescar parametrización (localStorage)">
            <IconButton onClick={() => setTick((x) => x + 1)}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>

          <Button variant="outlined" onClick={exportExcel}>
            Generar Excel
          </Button>
        </Stack>
      </Stack>

      <Divider sx={{ my: 2 }} />

      <Grid container spacing={2}>
        <Grid item xs={12} md={2.4}>
          <Paper sx={{ p: 2, borderRadius: 3 }}>
            <Typography variant="caption" color="text.secondary">
              Total
            </Typography>
            <Typography variant="h4" fontWeight={800}>
              {kpis.total}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={2.4}>
          <Paper sx={{ p: 2, borderRadius: 3 }}>
            <Typography variant="caption" color="text.secondary">
              Rojo
            </Typography>
            <Typography variant="h4" fontWeight={800}>
              {kpis.rojas}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={2.4}>
          <Paper sx={{ p: 2, borderRadius: 3 }}>
            <Typography variant="caption" color="text.secondary">
              Amarillo
            </Typography>
            <Typography variant="h4" fontWeight={800}>
              {kpis.amarillas}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={2.4}>
          <Paper sx={{ p: 2, borderRadius: 3 }}>
            <Typography variant="caption" color="text.secondary">
              Verde
            </Typography>
            <Typography variant="h4" fontWeight={800}>
              {kpis.verdes}
            </Typography>
          </Paper>
        </Grid>
    
      </Grid>

      {/* Filtros */}
      <Paper sx={{ p: 2, mt: 2, borderRadius: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Buscar"
              placeholder="No trámite, RUC, contribuyente, actividad, auditor, supervisor…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </Grid>

          <Grid item xs={12} md={2}>
            <TextField select fullWidth label="Estado" value={estado} onChange={(e) => setEstado(e.target.value as any)}>
              <MenuItem value={TODOS}>Todos</MenuItem>
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
              <MenuItem value={TODOS}>Todos</MenuItem>
              <MenuItem value="VERDE">Verde</MenuItem>
              <MenuItem value="AMARILLO">Amarillo</MenuItem>
              <MenuItem value="ROJO">Rojo</MenuItem>
            </TextField>
          </Grid>

          {/* ✅ Auditor */}
          <Grid item xs={12} md={2}>
            <TextField
              select
              fullWidth
              label="Auditor"
              value={fAuditor}
              onChange={(e) => setFAuditor(e.target.value)}
            >
              {auditorOptions.map((a) => (
                <MenuItem key={a} value={a}>
                  {a === TODOS ? "Todos" : a}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* ✅ Supervisor */}
          <Grid item xs={12} md={2}>
            <TextField
              select
              fullWidth
              label="Supervisor"
              value={fSupervisor}
              onChange={(e) => setFSupervisor(e.target.value)}
            >
              {supervisorOptions.map((s) => (
                <MenuItem key={s} value={s}>
                  {s === TODOS ? "Todos" : s}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12}>
            <Stack direction="row" justifyContent="flex-end" spacing={1}>
              <Button
                variant="outlined"
                onClick={() => {
                  setSearch("");
                  setEstado(TODOS);
                  setSemaforoFiltro(TODOS);
                  setFAuditor(TODOS);
                  setFSupervisor(TODOS);
                }}
              >
                Limpiar
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
            Ordenado por criticidad y días restantes
          </Typography>
        </Stack>

        <Box sx={{ overflowX: "auto" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>
                  <b>Semáforo</b>
                </TableCell>
                <TableCell>
                  <b>Estado</b>
                </TableCell>
                <TableCell>
                  <b>No Trámite</b>
                </TableCell>
                <TableCell>
                  <b>RUC</b>
                </TableCell>
                <TableCell>
                  <b>Contribuyente</b>
                </TableCell>
                <TableCell>
                  <b>Actividad</b>
                </TableCell>

                <TableCell>
                  <b>Fecha Asignación</b>
                </TableCell>
                <TableCell align="right">
                  <b>Total</b>
                </TableCell>
                <TableCell align="right">
                  <b>Transc.</b>
                </TableCell>
                <TableCell align="right">
                  <b>Restan</b>
                </TableCell>
                <TableCell align="right">
                  <b>Atraso</b>
                </TableCell>
                <TableCell>
                  <b>Fecha Vencimiento</b>
                </TableCell>

                <TableCell>
                  <b>Auditor</b>
                </TableCell>
                <TableCell>
                  <b>Supervisor</b>
                </TableCell>

                <TableCell align="center">
                  <b>Acciones</b>
                </TableCell>
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
                        <Chip variant="outlined" label={s.label} sx={{ ...s.sx, borderWidth: 1 }} size="small" />
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
                      <Typography fontWeight={800}>{r.diasRestantes ?? "—"}</Typography>
                    </TableCell>

                    <TableCell align="right">
                      <Typography fontWeight={800} color={(r.diasAtraso ?? 0) > 0 ? "error.main" : "text.primary"}>
                        {r.diasAtraso ?? "—"}
                      </Typography>
                    </TableCell>

                    <TableCell>{r.fechaVencimiento ? fmtDate(r.fechaVencimiento) : "—"}</TableCell>

                    <TableCell>
                      <Typography>{r.auditor}</Typography>
                    </TableCell>

                    <TableCell>
                      <Typography>{r.supervisor}</Typography>
                    </TableCell>

                    {/* ✅ Acciones: 1) Detalle 2) Ir */}
                    <TableCell align="center">
                      <Stack direction="row" spacing={0.5} justifyContent="center">
                        {/* <Tooltip title="Detalle">
                          <IconButton size="small" onClick={() => goDetalle(r)}>
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip> */}

                        <Tooltip title="Ir">
                          <IconButton size="small" onClick={() => goIr(r)}>
                            <OpenInNewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}

              {data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={15}>
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