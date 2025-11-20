// src/pages/Aprobaciones.tsx
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
import { CASOS_KEY } from "../lib/aprobacionesStorage";
import Trazabilidad, { type TrazaItem } from "../components/Trazabilidad";

// Icons
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import UndoOutlinedIcon from "@mui/icons-material/UndoOutlined";
import OpenInFullOutlinedIcon from "@mui/icons-material/OpenInFullOutlined";

import {
  getRolSimulado,
  setRolSimulado,
  type RolSimulado,
} from "../lib/rolSimulado";

/* ===================== Tipos ===================== */
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
  motivoAmpliar?: string | null;
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

/* ===================== Utils ===================== */
const toNumber = (v: any): number => {
  if (v === null || v === undefined) return 0;
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  let s = String(v).trim();
  if (!s) return 0;
  s = s.replace(/\s+/g, "").replace(/[^\d.,\-]/g, "");
  const lastDot = s.lastIndexOf(".");
  const lastComma = s.lastIndexOf(",");
  let decimalSep: "." | "," | null = null;
  if (lastDot !== -1 || lastComma !== -1)
    decimalSep = lastComma > lastDot ? "," : ".";
  if (decimalSep) {
    const thousandSep = decimalSep === "." ? "," : ".";
    s = s.replace(new RegExp("\\" + thousandSep, "g"), "");
    if (decimalSep === ",") s = s.replace(/,/g, ".");
  } else {
    s = s.replace(/[^\d\-]/g, "");
  }
  const n = Number(s);
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
  const weights = PERIODOS_FIJOS.map(
    (_, i) => (i + 1) * ((seed % 7) + 3)
  );
  const sumW = weights.reduce((a, b) => a + b, 0);
  const items = PERIODOS_FIJOS.map((p, i) => ({
    periodo: p,
    monto: Math.round((total * weights[i]) / sumW),
  }));
  const ajuste = total - items.reduce((a, b) => a + b.monto, 0);
  if (ajuste !== 0) items[items.length - 1].monto += ajuste;
  return { items, total };
};

function CustomToolbar() {
  return (
    <GridToolbarContainer sx={{ p: 1, display: "flex", alignItems: "center" }}>
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

/* Mock de trazas */
const mockTrazas = (ruc: string): TrazaItem[] => [
  {
    id: `${ruc}-1`,
    fechaISO: new Date(
      Date.now() - 86400000 * 7
    ).toISOString(),
    actor: "Supervisor A",
    accion: "Revisión inicial",
    estado: "PENDIENTE",
  },
  {
    id: `${ruc}-2`,
    fechaISO: new Date(
      Date.now() - 86400000 * 2
    ).toISOString(),
    actor: "Auditor B",
    accion: "Validación documental",
    estado: "APROBADO",
  },
];

/* ===================== Componente ===================== */
const Aprobaciones: React.FC = () => {
  const apiRef = useGridApiRef();

  const [rows, setRows] = React.useState<Row[]>([]);
  const [selectedCount, setSelectedCount] = React.useState(0);

  const [detailOpen, setDetailOpen] = React.useState(false);
  const [detailRow, setDetailRow] = React.useState<Row | null>(null);
  const [tab, setTab] = React.useState(0);

  // Motivo (Devolver/Ampliar)
  const [motivoOpen, setMotivoOpen] = React.useState(false);
  const [motivoText, setMotivoText] = React.useState("");
  const [motivoAction, setMotivoAction] = React.useState<
    "Devolver" | "Ampliar" | null
  >(null);
  const [motivoRow, setMotivoRow] = React.useState<Row | null>(null);

  // Rol simulado
  const [rol, setRol] = React.useState<RolSimulado>(() => getRolSimulado());

  const handleRolChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
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
      const texto = localStorage.getItem(CASOS_KEY);
      const data: (RowBase & RowMeta)[] = texto ? JSON.parse(texto) : [];
      const withNum: Row[] = data.map((r) => ({
        ...r,
        estado: r.estado ?? "Pendiente",
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
  };

  const aprobarUno = async (row: Row) => {
    if (rol !== "JEFE_DEPARTAMENTO") return; // solo simulado
    const { isConfirmed } = await Swal.fire({
      icon: "question",
      title: "¿Aprobar caso?",
      html: `<b>${row.nombre}</b><br/>RUC: ${row.ruc}<br/>Valor: <b>B/. ${fmtMoneyUS.format(
        row.valorNum
      )}</b>`,
      showCancelButton: true,
      confirmButtonText: "Sí, aprobar",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
    });
    if (!isConfirmed) return;
    persist(
      rows.map((r) =>
        r.id === row.id ? { ...r, estado: "Aprobado" } : r
      )
    );
    Swal.fire({
      icon: "success",
      title: "Aprobado",
      text: "Caso aprobado correctamente.",
    });
  };

  const aprobarSeleccion = async () => {
    if (rol !== "JEFE_DEPARTAMENTO") return;
    const seleccion = Array.from(
      apiRef.current?.getSelectedRows().values() || []
    ) as Row[];
    if (!seleccion.length) {
      return Swal.fire({
        icon: "info",
        title: "Sin selección",
        text: "Selecciona uno o más casos.",
      });
    }
    const { isConfirmed } = await Swal.fire({
      icon: "question",
      title: "¿Aprobar selección?",
      html: `Se aprobarán <b>${seleccion.length}</b> caso(s).`,
      showCancelButton: true,
      confirmButtonText: "Sí, aprobar",
    });
    if (!isConfirmed) return;
    const ids = new Set(seleccion.map((r) => r.id));
    persist(
      rows.map((r) =>
        ids.has(r.id) ? { ...r, estado: "Aprobado" } : r
      )
    );
    Swal.fire({
      icon: "success",
      title: "Aprobados",
      text: "Selección aprobada correctamente.",
    });
  };

  const abrirMotivo = (accion: "Devolver" | "Ampliar", row: Row) => {
    if (rol !== "JEFE_DEPARTAMENTO") return;
    setMotivoAction(accion);
    setMotivoRow(row);
    setMotivoText("");
    setMotivoOpen(true);
  };

  const cerrarMotivo = () => {
    setMotivoOpen(false);
    setMotivoText("");
    setMotivoAction(null);
    setMotivoRow(null);
  };

  const confirmarMotivo = async () => {
    if (!motivoAction || !motivoRow) return;
    const texto = motivoText.trim();
    if (!texto)
      return Swal.fire({
        icon: "info",
        title: "Motivo requerido",
        text: "Escribe un motivo.",
      });
    const updated = rows.map((r) => {
      if (r.id !== motivoRow.id) return r;
      return motivoAction === "Devolver"
        ? { ...r, motivoDevolucion: texto }
        : { ...r, motivoAmpliar: texto };
    });
    persist(updated);
    cerrarMotivo();
    Swal.fire({
      icon: "success",
      title:
        motivoAction === "Devolver"
          ? "Devuelto"
          : "Ampliación registrada",
      text:
        motivoAction === "Devolver"
          ? "Se guardó el motivo de devolución."
          : "Se solicitó ampliar información.",
    });
  };

  const columns: GridColDef<Row>[] = [
    { field: "ruc", headerName: "RUC", flex: 0.9 },
    {
      field: "nombre",
      headerName: "Nombre o Razón Social",
      flex: 1.2,
    },
    {
      field: "valorNum",
      headerName: "Valor (B/.)",
      flex: 0.8,
      renderCell: (p) => fmtMoneyUS.format(p.row.valorNum),
    },
    {
      field: "estado",
      headerName: "Estado",
      minWidth: 120,
      renderCell: (p) => (
        <Chip
          size="small"
          label={p.row.estado ?? "Pendiente"}
          color={p.row.estado === "Aprobado" ? "success" : "default"}
          variant={p.row.estado === "Aprobado" ? "filled" : "outlined"}
        />
      ),
    },
    {
      field: "acciones",
      headerName: "Acciones",
      sortable: false,
      width: 260,
      renderCell: (p) => {
        const r = p.row;
        const disabledPorRol = rol !== "JEFE_DEPARTAMENTO";
        return (
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="Detalle">
              <IconButton size="small" onClick={() => openDetail(r)}>
                <InfoOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip
              title={
                disabledPorRol
                  ? "Solo Jefe de Departamento (simulado)"
                  : "Aprobar"
              }
            >
              <IconButton
                size="small"
                color="success"
                disabled={r.estado === "Aprobado" || disabledPorRol}
                onClick={() => aprobarUno(r)}
              >
                <CheckCircleOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip
              title={
                disabledPorRol
                  ? "Solo Jefe de Departamento (simulado)"
                  : "Devolver (motivo)"
              }
            >
              <IconButton
                size="small"
                color="warning"
                disabled={disabledPorRol}
                onClick={() => abrirMotivo("Devolver", r)}
              >
                <UndoOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip
              title={
                disabledPorRol
                  ? "Solo Jefe de Departamento (simulado)"
                  : "Ampliar información"
              }
            >
              <IconButton
                size="small"
                color="primary"
                disabled={disabledPorRol}
                onClick={() => abrirMotivo("Ampliar", r)}
              >
                <OpenInFullOutlinedIcon fontSize="small" />
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
              <MenuItem value="JEFE_DEPARTAMENTO">
                Jefe de Departamento
              </MenuItem>
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

      {/* === Dialog Detalle con Tabs === */}
      <Dialog open={detailOpen} onClose={closeDetail} maxWidth="md" fullWidth>
        <DialogTitle>Detalle del caso</DialogTitle>
        <DialogContent dividers>
          {detailRow && (
            <>
              <Tabs
                value={tab}
                onChange={(_, v) => setTab(v)}
                sx={{ mb: 2 }}
              >
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

              {tab === 1 && (
                <Box sx={{ mt: 2 }}>
                  <Trazabilidad rows={detailRow.trazas ?? []} height={360} />
                </Box>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Stack direction="row" spacing={1} sx={{ mr: "auto", pl: 1 }}>
            <Button variant="outlined" size="small">
              EXCEL
            </Button>
            <Button variant="outlined" size="small">
              WORD
            </Button>
            <Button variant="outlined" size="small">
              PDF
            </Button>
          </Stack>
          <Button variant="contained" onClick={closeDetail}>
            CERRAR
          </Button>
        </DialogActions>
      </Dialog>

      {/* === Dialog Motivo === */}
      <Dialog open={motivoOpen} onClose={cerrarMotivo} maxWidth="sm" fullWidth>
        <DialogTitle>
          {motivoAction === "Devolver"
            ? "Motivo de devolución"
            : "Motivo para ampliar información"}
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
          <Button variant="contained" onClick={confirmarMotivo}>
            Guardar motivo
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Aprobaciones;
