// ==========================================
// src/pages/Aprobaciones.tsx
// ==========================================
import * as React from "react";
import {
  Box,
  Paper,
  Button,
  Chip,
  Typography,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Stack,
  Tooltip,
  IconButton,
  TextField,
  Tabs,
  Tab,
  MenuItem,
} from "@mui/material";

import {
  DataGrid,
  type GridColDef,
  GridToolbarContainer,
  GridToolbarColumnsButton,
  GridToolbarDensitySelector,
  GridToolbarExport,
  GridToolbarQuickFilter,
  useGridApiRef,
} from "@mui/x-data-grid";

import { esES } from "@mui/x-data-grid/locales";
import Swal from "sweetalert2";
import { CASOS_KEY, nextNumeroAuto } from "../lib/aprobacionesStorage";
import Trazabilidad, { type TrazaItem } from "../components/Trazabilidad";

// ICONOS
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import UndoOutlinedIcon from "@mui/icons-material/UndoOutlined";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";

import {
  getRolSimulado,
  setRolSimulado,
  type RolSimulado,
} from "../lib/rolSimulado";

// ===================== Tipos =====================
type RowBase = {
  id: number | string;
  categoria: string;
  ruc: string;
  nombre: string;
  periodos: string;
  valor?: number | string | null;
  monto?: number | string | null;
  total?: number | string | null;
  estado?: "Pendiente" | "Aprobado";
  motivoDevolucion?: string | null;
  motivoRechazo?: string | null;
  estadoVerif?: string | null;
  numeroAuto?: string | null; // ← NUEVO: número de Auto de Apertura
};

type RowMeta = {
  metaCategoria?: string;
  metaInconsistencia?: string;
  metaPrograma?: string | null;
  metaActividadEconomica?: string[];
  metaPeriodoInicial?: string | null;
  metaPeriodoFinal?: string | null;
};

type Row = RowBase &
  RowMeta & {
    valorNum: number;
    trazas?: TrazaItem[];
  };

// ===================== Utils =====================
const toNumber = (v: any): number => {
  if (!v) return 0;
  if (typeof v === "number") return v;
  const n = Number(String(v).replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

const fmtMoneyUS = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const PERIODOS_FIJOS = [
  "dic-20",
  "dic-21",
  "dic-22",
  "dic-23",
  "dic-24",
  "dic-25",
] as const;

const buildBreakdown = (row: Row) => {
  const total = row.valorNum || 0;
  if (!total)
    return {
      items: PERIODOS_FIJOS.map((p) => ({ periodo: p, monto: 0 })),
      total: 0,
    };

  const seed =
    (typeof row.id === "number"
      ? row.id
      : Number(String(row.id).replace(/\D/g, ""))) || 1;

  const weights = PERIODOS_FIJOS.map((_, i) => (i + 1) * ((seed % 7) + 3));
  const sumW = weights.reduce((a, b) => a + b, 0);

  const items = PERIODOS_FIJOS.map((p, i) => ({
    periodo: p,
    monto: Math.round((total * weights[i]) / sumW),
  }));

  const ajuste = total - items.reduce((a, b) => a + b.monto, 0);
  items[items.length - 1].monto += ajuste;

  return { items, total };
};

function CustomToolbar() {
  return (
    <GridToolbarContainer sx={{ p: 1 }}>
      <GridToolbarColumnsButton />
      <GridToolbarDensitySelector />
      <GridToolbarExport />
      <Box sx={{ flex: 1 }} />
      <GridToolbarQuickFilter />
    </GridToolbarContainer>
  );
}

const normalize = (s?: string | null) => (s || "").toLowerCase();

const inconsLabels = (inc?: string | null) => {
  switch (normalize(inc)) {
    case "omiso":
      return { singular: "omiso", plural: "omisos" };
    case "inexacto":
      return { singular: "inexacto", plural: "inexactos" };
    case "extemporáneo":
    case "extemporaneo":
      return { singular: "extemporáneo", plural: "extemporáneos" };
    default:
      return { singular: "inconsistencia", plural: "inconsistencias" };
  }
};

const mockTrazas = (ruc: string): TrazaItem[] => [
  {
    id: `${ruc}-1`,
    fechaISO: new Date(Date.now() - 86400000 * 7).toISOString(),
    actor: "Supervisor A",
    accion: "Revisión inicial",
    estado: "PENDIENTE",
  },
  {
    id: `${ruc}-2`,
    fechaISO: new Date(Date.now() - 86400000 * 2).toISOString(),
    actor: "Auditor B",
    accion: "Validación documental",
    estado: "APROBADO",
  },
];

// ===================== Componente =====================
const Aprobaciones: React.FC = () => {
  const apiRef = useGridApiRef();

  const [rows, setRows] = React.useState<Row[]>([]);
  const [selectedCount, setSelectedCount] = React.useState(0);

  const [detailOpen, setDetailOpen] = React.useState(false);
  const [detailRow, setDetailRow] = React.useState<Row | null>(null);
  const [tab, setTab] = React.useState(0);

  const [motivoOpen, setMotivoOpen] = React.useState(false);
  const [motivoText, setMotivoText] = React.useState("");
  const [motivoAction, setMotivoAction] =
    React.useState<"Devolver" | "Rechazar" | null>(null);
  const [motivoRow, setMotivoRow] = React.useState<Row | null>(null);

  const [rol, setRol] = React.useState<RolSimulado>(() => getRolSimulado());

  const handleRolChange = (e: any) => {
    const value = e.target.value as RolSimulado;
    setRol(value);
    setRolSimulado(value);
  };

  const openDetail = (row: Row) => {
    setDetailRow(row);
    setTab(0);
    setDetailOpen(true);
  };
  const closeDetail = () => setDetailOpen(false);

  const loadFromStorage = React.useCallback(() => {
    try {
      const raw = localStorage.getItem(CASOS_KEY);
      const data: (RowBase & RowMeta)[] = raw ? JSON.parse(raw) : [];
      const withNum: Row[] = data.map((r) => ({
        ...r,
        estado: r.estado ?? "Pendiente",
        estadoVerif: r.estadoVerif ?? "Pendiente",
        valorNum: toNumber(r.valor ?? r.monto ?? r.total),
        trazas: (r as any).trazas ?? mockTrazas(String(r.ruc)),
      }));
      setRows(withNum);
    } catch {
      setRows([]);
    }
  }, []);

  React.useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  const persist = (data: Row[]) => {
    localStorage.setItem(CASOS_KEY, JSON.stringify(data));
    setRows(data);
    window.dispatchEvent(new Event("casosAprobacion:update"));
  };

  // ===================== Acciones =====================
  const aprobarUno = async (row: Row) => {
    if (rol !== "JEFE_DEPARTAMENTO") return;

    const { isConfirmed } = await Swal.fire({
      icon: "question",
      title: "¿Aprobar caso?",
      html: `<b>${row.nombre}</b><br/>RUC: ${row.ruc}<br/>Valor: <b>B/. ${fmtMoneyUS.format(
        row.valorNum
      )}</b>`,
      confirmButtonText: "Sí, aprobar",
      showCancelButton: true,
    });

    if (!isConfirmed) return;

    const updated:any = rows.map((r) => {
      if (r.id !== row.id) return r;

      const numeroAuto = r.numeroAuto || nextNumeroAuto();

      return {
        ...r,
        estado: "Aprobado",
        estadoVerif: "Aprobado",
        numeroAuto, // ← guardamos el número de Auto
      };
    });

    persist(updated);

    Swal.fire("Aprobado", "Caso aprobado correctamente.", "success");
  };

  const aprobarSeleccion = async () => {
    if (rol !== "JEFE_DEPARTAMENTO") return;

    const seleccion = Array.from(
      apiRef.current?.getSelectedRows().values() || []
    ) as Row[];

    if (!seleccion.length)
      return Swal.fire(
        "Sin selección",
        "Selecciona uno o más casos.",
        "info"
      );

    const { isConfirmed } = await Swal.fire({
      icon: "question",
      title: "¿Aprobar selección?",
      html: `Se aprobarán <b>${seleccion.length}</b> caso(s).`,
      confirmButtonText: "Sí, aprobar",
      showCancelButton: true,
    });

    if (!isConfirmed) return;

    const ids = new Set(seleccion.map((r) => r.id));
    const updated:any = rows.map((r) => {
      if (!ids.has(r.id)) return r;

      const numeroAuto = r.numeroAuto || nextNumeroAuto();

      return {
        ...r,
        estado: "Aprobado",
        estadoVerif: "Aprobado",
        numeroAuto,
      };
    });

    persist(updated);

    Swal.fire("Aprobados", "Selección aprobada correctamente.", "success");
  };

  const abrirMotivo = (accion: "Devolver" | "Rechazar", row: Row) => {
    if (rol !== "JEFE_DEPARTAMENTO") return;
    setMotivoAction(accion);
    setMotivoRow(row);
    setMotivoText("");
    setMotivoOpen(true);
  };

  const cerrarMotivo = () => {
    setMotivoOpen(false);
    setMotivoText("");
    setMotivoRow(null);
    setMotivoAction(null);
  };

  const confirmarMotivo = async () => {
    if (!motivoAction || !motivoRow) return;
    const texto = motivoText.trim();
    if (!texto)
      return Swal.fire("Motivo requerido", "Debes escribir un motivo.", "info");

    const updated = rows.map((r) => {
      if (r.id !== motivoRow.id) return r;

      return motivoAction === "Devolver"
        ? {
            ...r,
            motivoDevolucion: texto,
            estadoVerif: "Devuelto",
          }
        : {
            ...r,
            motivoRechazo: texto,
            estadoVerif: "Rechazado",
          };
    });

    persist(updated);
    cerrarMotivo();

    Swal.fire(
      motivoAction === "Devolver" ? "Devuelto" : "Rechazado",
      motivoAction === "Devolver"
        ? "Se guardó el motivo de devolución."
        : "Se rechazó el caso correctamente.",
      "success"
    );
  };

  // ===================== Columnas =====================
  const columns: GridColDef<Row>[] = [
    { field: "ruc", headerName: "RUC", flex: 0.9 },
    { field: "nombre", headerName: "Nombre o Razón Social", flex: 1.2 },
    {
      field: "valorNum",
      headerName: "Valor (B/.)",
      flex: 0.8,
      renderCell: (p) => fmtMoneyUS.format(p.row.valorNum),
    },
    {
      field: "estadoVerif",
      headerName: "Estado Verificación",
      width: 160,
      renderCell: (p) => {
        const est = p.row.estadoVerif;
        const map: Record<string, any> = {
          Aprobado: { color: "success", label: "Aprobado" },
          Devuelto: { color: "warning", label: "Devuelto" },
          Rechazado: { color: "error", label: "Rechazado" },
          Pendiente: { color: "default", label: "Pendiente" },
        };
        const cfg = map[est ?? "Pendiente"] || map["Pendiente"];
        return <Chip size="small" {...cfg} />;
      },
    },
    {
      field: "acciones",
      headerName: "Acciones",
      sortable: false,
      width: 260,
      renderCell: (p) => {
        const r = p.row;
        const disabled = rol !== "JEFE_DEPARTAMENTO";

        return (
          <Stack direction="row" spacing={0.5}>
            {/* Detalle */}
            <Tooltip title="Detalle">
              <IconButton size="small" onClick={() => openDetail(r)}>
                <InfoOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            {/* Aprobar */}
            <Tooltip title="Aprobar">
              <IconButton
                size="small"
                color="success"
                disabled={disabled}
                onClick={() => aprobarUno(r)}
              >
                <CheckCircleOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            {/* Devolver */}
            <Tooltip title="Devolver">
              <IconButton
                size="small"
                color="warning"
                disabled={disabled}
                onClick={() => abrirMotivo("Devolver", r)}
              >
                <UndoOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            {/* Rechazar */}
            <Tooltip title="Rechazar">
              <IconButton
                size="small"
                color="error"
                disabled={disabled}
                onClick={() => abrirMotivo("Rechazar", r)}
              >
                <CancelOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        );
      },
    },
  ];

  const inc = inconsLabels(detailRow?.metaInconsistencia);

  return (
    <Box component={Paper} sx={{ p: 2 }}>
      <Grid container alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <Grid item>
          <Typography variant="h6">Aprobaciones</Typography>
        </Grid>

        <Grid item sx={{ ml: "auto" }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <TextField
              select
              size="small"
              label="Rol simulado"
              value={rol}
              onChange={handleRolChange}
              sx={{ minWidth: 220 }}
            >
              <MenuItem value="JEFE_SECCION">Jefe de Sección</MenuItem>
              <MenuItem value="JEFE_DEPARTAMENTO">Jefe de Departamento</MenuItem>
            </TextField>

            <Button
              size="small"
              variant="contained"
              color="success"
              onClick={aprobarSeleccion}
              disabled={!selectedCount || rol !== "JEFE_DEPARTAMENTO"}
            >
              Aprobar selección
            </Button>
          </Stack>
        </Grid>
      </Grid>

      <DataGrid
        sx={{ height: 500 }}
        apiRef={apiRef}
        rows={rows}
        columns={columns}
        checkboxSelection
        disableRowSelectionOnClick
        onRowSelectionModelChange={(m: any) => setSelectedCount(m.length)}
        slots={{ toolbar: CustomToolbar }}
        localeText={esES.components.MuiDataGrid.defaultProps.localeText}
      />

      {/* === DETAIL DIALOG === */}
      <Dialog open={detailOpen} onClose={closeDetail} maxWidth="md" fullWidth>
        <DialogTitle>Detalle del caso</DialogTitle>
        <DialogContent dividers>
          {detailRow && (
            <>
              <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
                <Tab label="Información" />
                <Tab label="Trazabilidad" />
              </Tabs>

              {tab === 0 && (
                <Box>
                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={12} md={4}>
                      <Typography variant="caption">Categoría</Typography>
                      <Box component={Paper} sx={{ p: 1 }}>
                        {detailRow.metaCategoria ?? detailRow.categoria}
                      </Box>
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <Typography variant="caption">RUC</Typography>
                      <Box component={Paper} sx={{ p: 1 }}>
                        {detailRow.ruc}
                      </Box>
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <Typography variant="caption">Nombre</Typography>
                      <Box component={Paper} sx={{ p: 1 }}>
                        {detailRow.nombre}
                      </Box>
                    </Grid>
                  </Grid>

                  <Typography sx={{ mb: 1 }} variant="subtitle2">
                    Cantidad de períodos {inc.singular}
                  </Typography>

                  {(() => {
                    const bd = buildBreakdown(detailRow);
                    return (
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            {PERIODOS_FIJOS.map((p) => (
                              <TableCell key={p} align="right">
                                {p}
                              </TableCell>
                            ))}
                            <TableCell align="right">
                              <b>Total</b>
                            </TableCell>
                          </TableRow>
                        </TableHead>

                        <TableBody>
                          <TableRow>
                            {bd.items.map((it) => (
                              <TableCell key={it.periodo} align="right">
                                {fmtMoneyUS.format(it.monto)}
                              </TableCell>
                            ))}

                            <TableCell align="right">
                              <b>{fmtMoneyUS.format(bd.total)}</b>
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    );
                  })()}
                </Box>
              )}

              {/* ---------------- TRAZABILIDAD ---------------- */}
              {tab === 1 && (
                <Box sx={{ mt: 2 }}>
                  <Trazabilidad rows={detailRow.trazas ?? []} height={360} />
                </Box>
              )}
            </>
          )}
        </DialogContent>

        <DialogActions>
          <Button variant="contained" onClick={closeDetail}>
            CERRAR
          </Button>
        </DialogActions>
      </Dialog>

      {/* === MOTIVO === */}
      <Dialog open={motivoOpen} onClose={cerrarMotivo} maxWidth="sm" fullWidth>
        <DialogTitle>
          {motivoAction === "Devolver"
            ? "Motivo de devolución"
            : "Motivo de rechazo"}
        </DialogTitle>

        <DialogContent dividers>
          <Stack spacing={1}>
            {motivoRow && (
              <>
                <Typography variant="body2">
                  <b>RUC:</b> {motivoRow.ruc}
                </Typography>

                <Typography variant="body2">
                  <b>Nombre:</b> {motivoRow.nombre}
                </Typography>
              </>
            )}

            <TextField
              label="Escribe el motivo"
              value={motivoText}
              onChange={(e) => setMotivoText(e.target.value)}
              fullWidth
              multiline
              minRows={3}
              autoFocus
            />
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={cerrarMotivo}>Cancelar</Button>

          <Button variant="contained" color="error" onClick={confirmarMotivo}>
            Guardar motivo
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Aprobaciones;