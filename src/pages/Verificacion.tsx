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
  Tabs,
  Tab,
  TextField,
  MenuItem,
  Stack,
  IconButton,
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

import VisibilityIcon from "@mui/icons-material/Visibility";
import BlockIcon from "@mui/icons-material/Block";

import { esES } from "@mui/x-data-grid/locales";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";

import { CASOS_KEY } from "../lib/aprobacionesStorage";
import Trazabilidad, { type TrazaItem } from "../components/Trazabilidad";
import { getRolSimulado, type RolSimulado } from "../lib/rolSimulado";

/* =============================================================================================
 * TIPOS
 * ============================================================================================= */

type RowBase = {
  id: number | string;
  categoria: string;
  ruc: string;
  nombre: string;
  provincia: string;
  periodos: string;
  valor?: number | string | null;
  monto?: number | string | null;
  total?: number | string | null;
};

type RowMeta = {
  metaCategoria?: string;
  metaInconsistencia?: string;
  metaPrograma?: string | null;
  metaActividadEconomica?: string[];
  metaPeriodoInicial?: string | null;
  metaPeriodoFinal?: string | null;
  metaImpuesto?: string | null;
  metaZonaEspecial?: string | null;
};

type EstadoVerificacion =
  | "Pendiente"
  | "Verificado"
  | "EnviadoAprobacion"
  | "NoProductivo";

type Row = RowBase &
  RowMeta & {
    valorNum: number;
    trazas?: TrazaItem[];
    detalleVisto?: boolean;
    fechaAsignacionISO?: string;
    esDoble?: boolean;
    estadoVerif?: EstadoVerificacion;
    motivoNoProductivo?: string | null;
    comentarioNoProductivo?: string | null;
  };

const MOTIVOS_NO_PROD = [
  "Exento",
  "Incentivo",
  "Ingresos no representativos",
  "Diferencias de monto no representativo",
  "Otro",
] as const;

/* =============================================================================================
 * UTILS
 * ============================================================================================= */

const toNumber = (v: any): number => {
  if (v == null) return 0;
  const n = Number(String(v).replace(/[^\d.-]/g, ""));
  return isNaN(n) ? 0 : n;
};

const fmtMoneyUS = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const PERIODOS_FIJOS = ["dic-20", "dic-21", "dic-22", "dic-23", "dic-24", "dic-25"];

function buildBreakdown(row: Row) {
  const total = row.valorNum || 0;
  const cant = PERIODOS_FIJOS.length;
  return {
    items: PERIODOS_FIJOS.map((p) => ({ periodo: p, monto: total / cant })),
    total,
  };
}

/* =============================================================================================
 * SEMÁFORO
 * ============================================================================================= */

const diasDesdeAsignacion = (row: Row): number => {
  if (!row.fechaAsignacionISO) return 0;
  return Math.floor((Date.now() - new Date(row.fechaAsignacionISO).getTime()) / 86400000);
};

type ChipColor = "success" | "error";

const getAlertaInfo = (row: Row): { color: ChipColor; label: string } => {
  const d = diasDesdeAsignacion(row);
  return d <= 1
    ? { color: "success", label: "Día 1" }
    : { color: "error", label: "Día 2" };
};

/* =============================================================================================
 * TOOLBAR
 * ============================================================================================= */

function CustomToolbar() {
  return (
    <GridToolbarContainer sx={{ p: 1, display: "flex", alignItems: "center", gap: 1 }}>
      <GridToolbarColumnsButton />
      <GridToolbarDensitySelector />
      <GridToolbarExport />
      <Box sx={{ flex: 1 }} />
      <GridToolbarQuickFilter />
    </GridToolbarContainer>
  );
}

/* =============================================================================================
 * MOCK TRAZABILIDAD
 * ============================================================================================= */

const mockTrazas = (ruc: string): TrazaItem[] => [
  {
    id: `${ruc}-1`,
    fechaISO: new Date().toISOString(),
    actor: "Sistema",
    accion: "Caso importado",
    estado: "APROBADO",
  },
];

/* =============================================================================================
 * COMPONENTE PRINCIPAL
 * ============================================================================================= */

const Verificacion: React.FC = () => {
  const apiRef = useGridApiRef();

  const [rows, setRows] = React.useState<Row[]>([]);
  const [selectedCount, setSelectedCount] = React.useState(0);
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [detailRow, setDetailRow] = React.useState<Row | null>(null);
  const [tab, setTab] = React.useState(0);

  const [npOpen, setNpOpen] = React.useState(false);
  const [npRow, setNpRow] = React.useState<Row | null>(null);
  const [npMotivo, setNpMotivo] = React.useState(MOTIVOS_NO_PROD[0]);
  const [npComentario, setNpComentario] = React.useState("");

  const rol: RolSimulado = getRolSimulado();

  /* =============================================================================================
   * LOAD STORAGE
   * ============================================================================================= */

  const loadStorage = React.useCallback(() => {
    const raw = localStorage.getItem(CASOS_KEY);
    const arr: any[] = raw ? JSON.parse(raw) : [];

    const mapped: Row[] = arr.map((r, idx) => ({
      ...r,
      valorNum: toNumber(r.valor ?? r.monto ?? r.total),
      detalleVisto: r.detalleVisto ?? false,
      estadoVerif: r.estadoVerif ?? "Pendiente",
      fechaAsignacionISO:
        r.fechaAsignacionISO ??
        new Date(Date.now() - (idx + 1) * 86400000).toISOString(),
      trazas: r.trazas ?? mockTrazas(r.ruc),
    }));

    setRows(mapped);
  }, []);

  React.useEffect(() => loadStorage(), [loadStorage]);

  React.useEffect(() => {
    const h = () => loadStorage();
    window.addEventListener("casosAprobacion:update", h);
    return () => window.removeEventListener("casosAprobacion:update", h);
  }, [loadStorage]);

  /* =============================================================================================
   * COLUMNAS
   * ============================================================================================= */

const columns: GridColDef<Row>[] = [
  {
    field: "alerta",
    headerName: "Alerta",
    minWidth: 120,
    renderCell: (params) => {
      const info = getAlertaInfo(params.row);
      return <Chip size="small" color={info.color} label={info.label} />;
    },
  },

  { field: "ruc", headerName: "RUC", minWidth: 130 },
  { field: "nombre", headerName: "Nombre", minWidth: 230 },
  { field: "provincia", headerName: "Provincia", minWidth: 150 },

  {
    field: "metaCategoria",
    headerName: "Categoría",
    minWidth: 160,
    renderCell: (p) =>
      p.row.metaCategoria ?? p.row.categoria ?? "",
  },

  {
    field: "metaInconsistencia",
    headerName: "Inconsistencia",
    minWidth: 160,
    renderCell: (p) =>
      p.row.metaInconsistencia ?? "",
  },

  {
    field: "metaImpuesto",
    headerName: "Impuesto",
    minWidth: 150,
    renderCell: (p) => p.row.metaImpuesto ?? "",
  },

  {
    field: "metaZonaEspecial",
    headerName: "Zona Especial",
    minWidth: 180,
    renderCell: (p) => p.row.metaZonaEspecial ?? "",
  },

  {
    field: "valorNum",
    headerName: "Valor (B/.)",
    minWidth: 140,
    renderCell: (p) => fmtMoneyUS.format(p.row.valorNum ?? 0),
  },

  {
    field: "estadoVerif",
    headerName: "Estado",
    minWidth: 180,
    renderCell: (p) => {
      const r = p.row;

      if (r.estadoVerif === "NoProductivo")
        return <Chip size="small" color="warning" label="No productivo" />;

      if (r.estadoVerif === "EnviadoAprobacion")
        return <Chip size="small" color="info" label="Enviado a aprobación" />;

      if (r.estadoVerif === "Verificado")
        return <Chip size="small" color="success" label="Verificado" />;

      if (r.detalleVisto)
        return <Chip size="small" label="Detalle visto" color="success" />;

      return <Chip size="small" label="Pendiente" />;
    },
  },

  // ÍCONOS DE ACCIONES
  {
    field: "acciones",
    headerName: "Acciones",
    minWidth: 160,
    renderCell: (params) => (
      <Stack direction="row" spacing={1}>
        <IconButton
          size="small"
          color="primary"
          onClick={() => {
            setDetailRow(params.row);
            setDetailOpen(true);
          }}
          title="Ver detalle"
        >
          <VisibilityIcon fontSize="small" />
        </IconButton>

        <IconButton
          size="small"
          color="warning"
          onClick={() => {
            setNpRow(params.row);
            setNpOpen(true);
            setNpComentario("");
            setNpMotivo(MOTIVOS_NO_PROD[0]);
          }}
          title="Marcar No Productivo"
        >
          <BlockIcon fontSize="small" />
        </IconButton>
      </Stack>
    ),
  },
];


  /* =============================================================================================
   * PASAR A APROBACIÓN
   * ============================================================================================= */

  const pasarAAprobacion = async () => {
    const api = apiRef.current;
    if (!api) return;

    const selected = Array.from(api.getSelectedRows().values()) as Row[];

    if (!selected.length) {
      Swal.fire("Sin selección", "Seleccione al menos un caso.", "info");
      return;
    }

    const { isConfirmed } = await Swal.fire({
      icon: "question",
      title: "¿Pasar a Aprobación?",
      html: `Se enviarán <b>${selected.length}</b> caso(s) a Aprobación.`,
      showCancelButton: true,
      confirmButtonText: "Sí, continuar",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
    });

    if (!isConfirmed) return;

    const nuevos = rows.map((r: any) =>
      selected.find((s) => s.ruc === r.ruc)
        ? { ...r, estadoVerif: "EnviadoAprobacion" }
        : r
    );

    localStorage.setItem(CASOS_KEY, JSON.stringify(nuevos));

    Swal.fire("Éxito", "Casos enviados a Aprobación.", "success");

    setRows(nuevos);
  };

  /* =============================================================================================
   * EXPORTAR
   * ============================================================================================= */

  const exportExcel = () => {
    if (!rows) {
      Swal.fire("Sin datos", "No hay datos para exportar.", "info");
      return;
    }

    const data = rows.map((r) => ({
      RUC: r.ruc,
      Nombre: r.nombre,
      Provincia: r.provincia,
      Categoria: r.metaCategoria ?? r.categoria,
      Inconsistencia: r.metaInconsistencia ?? "",
      Impuesto: r.metaImpuesto ?? "",
      ZonaEspecial: r.metaZonaEspecial ?? "",
      Valor: r.valorNum,
      Estado: r.estadoVerif,
      FechaAsignacion: r.fechaAsignacionISO,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Verificación");
    XLSX.writeFile(wb, "verificacion.xlsx");
  };

  /* =============================================================================================
   * RENDER
   * ============================================================================================= */

  return (
    <Box component={Paper} sx={{ p: 2 }}>
      {/* HEADER */}
      <Grid container spacing={2} alignItems="center" sx={{ mb: 1 }}>
        <Grid item>
          <Typography variant="h6">Verificación</Typography>
        </Grid>

        <Grid item>
          <Chip size="small" variant="outlined" label={`Total: ${rows.length}`} />
        </Grid>

        <Grid item>
          <Chip size="small" variant="outlined" color="info" label={`Seleccionados: ${selectedCount}`} />
        </Grid>

        <Grid item sx={{ ml: "auto" }}>
          <Chip
            size="small"
            color="secondary"
            label={
              rol === "JEFE_SECCION"
                ? "Rol: Jefe de Sección"
                : "Rol: Jefe de Departamento"
            }
          />
        </Grid>
      </Grid>

      {/* GRID */}
      <DataGrid
        sx={{ height: 520 }}
        apiRef={apiRef}
        rows={rows}
        columns={columns}
        localeText={{
          ...esES.components.MuiDataGrid.defaultProps.localeText,
        }}
        checkboxSelection
        disableRowSelectionOnClick
        isRowSelectable={(params) => params.row.estadoVerif !== "NoProductivo"}
        onRowSelectionModelChange={(m:any) => {
  const count = Array.isArray(m) ? m.length : (m as Set<any>).size;
  setSelectedCount(count);
}}
        slots={{ toolbar: CustomToolbar }}
      />

    
      <Box sx={{ mt: 2, display: "flex", gap: 1 }}>
        <Button variant="outlined" onClick={exportExcel}>
          Exportar Excel
        </Button>

        <Button
          variant="contained"
          color="success"
          disabled={selectedCount === 0}
          onClick={pasarAAprobacion}
        >
          Pasar a Aprobación
        </Button>
      </Box>

      {/* DETALLE */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Detalle del caso</DialogTitle>
        <DialogContent dividers>
          {detailRow && (
            <>
              <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
                <Tab label="Información" />
                <Tab label="Trazabilidad" />
              </Tabs>

              {/* INFO */}
              {tab === 0 && (
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Typography variant="caption">Categoría</Typography>
                    <Paper sx={{ p: 1 }}>
                      {detailRow.metaCategoria ?? detailRow.categoria ?? "—"}
                    </Paper>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Typography variant="caption">Inconsistencia</Typography>
                    <Paper sx={{ p: 1 }}>
                      {detailRow.metaInconsistencia ?? "—"}
                    </Paper>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Typography variant="caption">Provincia</Typography>
                    <Paper sx={{ p: 1 }}>
                      {detailRow.provincia}
                    </Paper>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Typography variant="caption">Impuesto</Typography>
                    <Paper sx={{ p: 1 }}>
                      {detailRow.metaImpuesto ?? "—"}
                    </Paper>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Typography variant="caption">Zona Especial</Typography>
                    <Paper sx={{ p: 1 }}>
                      {detailRow.metaZonaEspecial ?? "—"}
                    </Paper>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="caption">Actividad Económica</Typography>
                    <Paper sx={{ p: 1 }}>
                      {detailRow.metaActividadEconomica?.length
                        ? detailRow.metaActividadEconomica.join(", ")
                        : "—"}
                    </Paper>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Typography variant="caption">Período Inicial</Typography>
                    <Paper sx={{ p: 1 }}>
                      {detailRow.metaPeriodoInicial ?? "—"}
                    </Paper>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Typography variant="caption">Período Final</Typography>
                    <Paper sx={{ p: 1 }}>
                      {detailRow.metaPeriodoFinal ?? "—"}
                    </Paper>
                  </Grid>

                  {/* TABLA DE MONTOS */}
                  <Grid item xs={12}>
                    <Typography sx={{ mt: 2 }} variant="subtitle2">
                      Distribución por períodos
                    </Typography>

                    {(() => {
                      const bd = buildBreakdown(detailRow);
                      return (
                        <Table size="small" sx={{ mt: 1 }}>
                          <TableHead>
                            <TableRow>
                              {bd.items.map((it) => (
                                <TableCell key={it.periodo} align="right">
                                  {it.periodo}
                                </TableCell>
                              ))}
                              <TableCell align="right"><b>Total</b></TableCell>
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
                  </Grid>
                </Grid>
              )}

              {/* TRAZABILIDAD */}
              {tab === 1 && (
                <Trazabilidad rows={detailRow.trazas ?? []} height={360} />
              )}
            </>
          )}
        </DialogContent>

        <DialogActions>
          <Button variant="contained" onClick={() => setDetailOpen(false)}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* NO PRODUCTIVO */}
      <Dialog open={npOpen} onClose={() => setNpOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Marcar No Productivo</DialogTitle>
        <DialogContent dividers>
          <TextField
            select
            fullWidth
            label="Motivo"
            value={npMotivo}
            onChange={(e: any) => setNpMotivo(e.target.value)}
            sx={{ mb: 2 }}
          >
            {MOTIVOS_NO_PROD.map((m) => (
              <MenuItem key={m} value={m}>{m}</MenuItem>
            ))}
          </TextField>

          <TextField
            fullWidth
            multiline
            minRows={2}
            label="Comentario adicional"
            value={npComentario}
            onChange={(e) => setNpComentario(e.target.value)}
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setNpOpen(false)}>Cancelar</Button>

          <Button
            variant="contained"
            color="warning"
            onClick={() => {
              if (!npRow) return;

              const nuevos:any = rows.map((r) =>
                r.id === npRow.id
                  ? {
                      ...r,
                      estadoVerif: "NoProductivo",
                      motivoNoProductivo: npMotivo,
                      comentarioNoProductivo: npComentario,
                    }
                  : r
              );

              localStorage.setItem(CASOS_KEY, JSON.stringify(nuevos));
              setRows(nuevos);
              setNpOpen(false);

              Swal.fire(
                "Marcado como No Productivo",
                "El caso fue marcado correctamente y ya no podrá enviarse a Aprobación.",
                "success"
              );
            }}
          >
            Aceptar
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default Verificacion;
