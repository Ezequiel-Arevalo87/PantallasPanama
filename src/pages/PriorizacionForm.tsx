import * as React from "react";
import {
  Box,
  Paper,
  Grid,
  Typography,
  Button,
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
  IconButton,
  Tooltip,
} from "@mui/material";

import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";

import {
  DataGrid,
  GridColDef,
  GridToolbarContainer,
  GridToolbarColumnsButton,
  GridToolbarDensitySelector,
  GridToolbarExport,
  GridToolbarQuickFilter,
  useGridApiRef,
} from "@mui/x-data-grid";

import { esES } from "@mui/x-data-grid/locales";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";

import { CASOS_KEY, notifyAprobaciones } from "../lib/aprobacionesStorage";
import Trazabilidad, { type TrazaItem } from "../components/Trazabilidad";
import type { Actividad } from "../services/actividadesLoader";

/* ====================== TYPES ====================== */
type Operador = ">=" | "<=" | "==" | "!=";

type Props = {
  categoria?: string;
  inconsistencia?: string;
  actividadEconomica?: string[];
  programa?: string | null;
  zonaEspecial?: string;
  periodoInicial?: string | null;
  periodoFinal?: string | null;
  operador?: Operador;
  valorMin?: string;
  valorMax?: string;
  provincia?: string;
  actividades?: Actividad[]; // ✅ catálogo
};

type RawRow = {
  id: number;
  categoria: string;
  ruc: string;
  dv: number | string | null;
  nombre: string;
  periodos: string;
  valor: number;
  provincia: string;
};

type Row = {
  id: number | string;
  categoria: string;
  ruc: string;
  dv: string; // 2 dígitos
  nombre: string;
  periodos: string;
  valor: number;
  valorInt: number;
  provincia: string;
  trazas?: TrazaItem[];
};

export type RowAprobacion = Row & {
  metaCategoria?: string;
  metaInconsistencia?: string;
  metaPrograma?: string | null;
  metaActividadEconomica?: string[];
  metaPeriodoInicial?: string | null;
  metaPeriodoFinal?: string | null;
  metaZonaEspecial?: string | null;
  metaProvincia?: string | null;
  fechaAsignacionISO?: string;
  detalleVisto?: boolean;

  estadoVerif: "Pendiente" | "ParaAprobacion" | "Aprobado" | "NoProductivo" | "Devuelto";
};

/* ========================== UTILS =========================== */
const toInt = (v: any): number => Math.trunc(Number(v || 0));

const fmtMoney = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const toDV = (dv: any): string => {
  if (dv === null || dv === undefined) return "—";
  const n = Number(dv);
  if (Number.isNaN(n)) return "—";
  return n.toString().padStart(2, "0");
};

const buildActividadMap = (actividades?: Actividad[]) => {
  const m = new Map<string, string>();
  (actividades ?? []).forEach((a) => m.set(String(a.code), String(a.label)));
  return m;
};

// ✅ SOLO PRIMERA ACTIVIDAD (por nombre)
const firstActividadLabel = (codes: string[] | undefined, map: Map<string, string>) => {
  if (!codes || codes.length === 0) return "Todas";
  const first = String(codes[0] ?? "").trim();
  if (!first) return "Todas";
  return map.get(first) ?? first; // si no hay label, muestra el código
};

/* ========================== MOCK DATA =========================== */
const rawRows: RawRow[] = [
  { id: 1, categoria: "Fiscalización Masiva", ruc: "100200", dv: 3, nombre: "Panamá Retail S.A.", periodos: "06/25", valor: 1250000, provincia: "Panamá" },
  { id: 2, categoria: "Fiscalización Masiva", ruc: "100201", dv: 15, nombre: "Construcciones Istmo S.A.", periodos: "05/25", valor: 236.23, provincia: "Panamá Oeste" },
];

const BASE_ROWS: Row[] = rawRows.map((r) => ({
  ...r,
  dv: toDV(r.dv),
  valorInt: toInt(r.valor),
  trazas: [],
}));

export default function PriorizacionForm({
  categoria,
  inconsistencia,
  actividadEconomica,
  programa,
  zonaEspecial,
  periodoInicial,
  periodoFinal,
  operador,
  valorMin,
  valorMax,
  provincia,
  actividades,
}: Props) {
  const apiRef = useGridApiRef();

  const actividadesMap = React.useMemo(() => buildActividadMap(actividades), [actividades]);

  const [rucsEnVerificacion, setRucsEnVerificacion] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(CASOS_KEY);
      if (!raw) return;
      const arr = JSON.parse(raw);
      const s = new Set<string>();
      arr.forEach((r: any) => {
        if (r?.ruc) s.add(String(r.ruc));
      });
      setRucsEnVerificacion(s);
    } catch {
      setRucsEnVerificacion(new Set());
    }
  }, []);

  const rows = React.useMemo<Row[]>(() => {
    let base = BASE_ROWS;

    if (provincia && provincia !== "Todos") base = base.filter((r) => r.provincia === provincia);

    const minVal = valorMin ? Number(valorMin) : null;
    const maxVal = valorMax ? Number(valorMax) : null;

    if (minVal != null) base = base.filter((r) => r.valorInt >= minVal);
    if (maxVal != null) base = base.filter((r) => r.valorInt <= maxVal);

    return base;
  }, [provincia, valorMin, valorMax]);

  const [selectedCount, setSelectedCount] = React.useState(0);

  const [detailOpen, setDetailOpen] = React.useState(false);
  const [detailRow, setDetailRow] = React.useState<Row | null>(null);
  const [tabSel, setTabSel] = React.useState(0);

  const openDetail = (row: Row) => {
    setDetailRow(row);
    setTabSel(0);
    setDetailOpen(true);
  };

  const columns: GridColDef[] = [
    { field: "ruc", headerName: "RUC", flex: 0.7, minWidth: 130 },
    { field: "dv", headerName: "DV", flex: 0.35, minWidth: 80 },
    { field: "nombre", headerName: "Nombre Contribuyente", flex: 1.2, minWidth: 240 },
    { field: "provincia", headerName: "Provincia", flex: 0.7, minWidth: 120 },

    // ✅ SOLO el primer nombre de actividad
    {
      field: "actividadEconomica",
      headerName: "Actividad Económica",
      minWidth: 220,
      flex: 1,
      valueGetter: () => firstActividadLabel(actividadEconomica, actividadesMap),
    },

    {
      field: "zonaEspecial",
      headerName: "Zonas especiales",
      minWidth: 160,
      valueGetter: () => zonaEspecial ?? "—",
    },

    {
      field: "valorInt",
      headerName: "Valor (B/.)",
      minWidth: 140,
      renderCell: (params) => fmtMoney.format(params.row.valorInt),
    },

    {
      field: "acciones",
      headerName: "Acciones",
      minWidth: 110,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Tooltip title="Ver detalle">
          <IconButton size="small" onClick={() => openDetail(params.row as Row)}>
            <VisibilityOutlinedIcon />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  const handleAprobar = async () => {
    const api = apiRef.current;
    if (!api) return;

    const selected = Array.from(api.getSelectedRows().values()) as Row[];

    if (!selected.length) {
      await Swal.fire("Sin selección", "Seleccione al menos un caso.", "info");
      return;
    }

    const { isConfirmed } = await Swal.fire({
      icon: "question",
      title: "¿Enviar a Verificación?",
      html: `Se enviarán <b>${selected.length}</b> caso(s).`,
      showCancelButton: true,
      confirmButtonText: "Sí, confirmar",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
    });

    if (!isConfirmed) return;

    const ahoraISO = new Date().toISOString();

    const paquete: RowAprobacion[] = selected.map((r) => ({
      ...r,
      metaCategoria: categoria,
      metaInconsistencia: inconsistencia,
      metaPrograma: programa,
      metaActividadEconomica: actividadEconomica ?? [],
      metaPeriodoInicial: periodoInicial,
      metaPeriodoFinal: periodoFinal,
      metaZonaEspecial: zonaEspecial,
      metaProvincia: provincia ?? null,
      fechaAsignacionISO: ahoraISO,
      detalleVisto: false,
      estadoVerif: "Pendiente",
    }));

    const existentes = JSON.parse(localStorage.getItem(CASOS_KEY) || "[]");

    const sinDuplicados = existentes.filter((x: any) => !paquete.some((p) => p.ruc === x.ruc));
    const nuevos = [...sinDuplicados, ...paquete];

    localStorage.setItem(CASOS_KEY, JSON.stringify(nuevos));
    notifyAprobaciones();

    await Swal.fire("Éxito", "Casos enviados a Verificación.", "success");

    const s = new Set(rucsEnVerificacion);
    paquete.forEach((r) => s.add(String(r.ruc)));
    setRucsEnVerificacion(s);
  };

  const handleExportExcel = () => {
    if (!rows.length) {
      Swal.fire("Sin datos", "No hay datos que exportar.", "info");
      return;
    }

    const data = rows.map((r) => ({
      RUC: r.ruc,
      DV: r.dv,
      "Nombre Contribuyente": r.nombre,
      Provincia: r.provincia,
      "Tipo Inconsistencia": inconsistencia ?? "",
      "Impuesto/Programa": programa ?? "",
      "Zonas especiales": zonaEspecial ?? "",
      "Actividad Económica": firstActividadLabel(actividadEconomica, actividadesMap), // ✅ solo primero
      Periodos: r.periodos,
      Valor: r.valorInt,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Priorización");
    XLSX.writeFile(wb, "selector_casos_priorizacion.xlsx");
  };

  const localeText = {
    ...esES.components.MuiDataGrid.defaultProps.localeText,
    toolbarQuickFilterPlaceholder: "Buscar…",
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

  return (
    <Box component={Paper} sx={{ mt: 2, p: 1 }}>
      {/* <Box sx={{ px: 1, pt: 1, pb: 0.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          Resultados de consulta
        </Typography>
        <Typography variant="body2">
          <b>Tipo de Inconsistencia:</b> {inconsistencia ?? "—"} &nbsp;|&nbsp;{" "}
          <b>Impuesto/Programa:</b> {programa || "—"}
        </Typography>
      </Box> */}

      <DataGrid
        sx={{ height: 420, mt: 1 }}
        apiRef={apiRef}
        rows={rows}
        columns={columns}
        checkboxSelection
        disableRowSelectionOnClick
        isRowSelectable={(params) => !rucsEnVerificacion.has(String(params.row.ruc))}
        onRowSelectionModelChange={(m: any) => {
          const count = Array.isArray(m) ? m.length : (m as Set<any>).size;
          setSelectedCount(count);
        }}
        slots={{ toolbar: CustomToolbar }}
        localeText={localeText}
        pageSizeOptions={[5, 10, 25, 50]}
        initialState={{
          pagination: { paginationModel: { page: 0, pageSize: 10 } },
        }}
      />

      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Detalle del Caso</DialogTitle>
        <DialogContent dividers>
          {detailRow && (
            <>
              <Stack direction="row" spacing={2}>
                <Button variant={tabSel === 0 ? "contained" : "text"} onClick={() => setTabSel(0)}>
                  Información
                </Button>
                <Button variant={tabSel === 1 ? "contained" : "text"} onClick={() => setTabSel(1)}>
                  Trazabilidad
                </Button>
              </Stack>

              {tabSel === 0 && (
                <Box sx={{ mt: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <Typography variant="caption">Tipo de Inconsistencia</Typography>
                      <Paper sx={{ p: 1 }}>{inconsistencia ?? "—"}</Paper>
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <Typography variant="caption">Impuesto/Programa</Typography>
                      <Paper sx={{ p: 1 }}>{programa ?? "—"}</Paper>
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <Typography variant="caption">RUC / DV</Typography>
                      <Paper sx={{ p: 1 }}>
                        {detailRow.ruc} &nbsp; <b>DV:</b> {detailRow.dv}
                      </Paper>
                    </Grid>

                    <Grid item xs={12} md={8}>
                      <Typography variant="caption">Nombre Contribuyente</Typography>
                      <Paper sx={{ p: 1 }}>{detailRow.nombre}</Paper>
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <Typography variant="caption">Provincia</Typography>
                      <Paper sx={{ p: 1 }}>{detailRow.provincia}</Paper>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Typography variant="caption">Zonas especiales</Typography>
                      <Paper sx={{ p: 1 }}>{zonaEspecial ?? "—"}</Paper>
                    </Grid>

                    {/* ✅ DETALLE: solo primer nombre de actividad */}
                    <Grid item xs={12} md={6}>
                      <Typography variant="caption">Actividad Económica</Typography>
                      <Paper sx={{ p: 1 }}>{firstActividadLabel(actividadEconomica, actividadesMap)}</Paper>
                    </Grid>
                  </Grid>

                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle2">Períodos por monto</Typography>

                    <Table size="small" sx={{ mt: 1 }}>
                      <TableHead>
                        <TableRow>
                          <TableCell align="right">2025</TableCell>
                          <TableCell align="right">2024</TableCell>
                          <TableCell align="right">2023</TableCell>
                          <TableCell align="right">Total</TableCell>
                        </TableRow>
                      </TableHead>

                      <TableBody>
                        <TableRow>
                          <TableCell align="right">{fmtMoney.format(detailRow.valorInt * 0.4)}</TableCell>
                          <TableCell align="right">{fmtMoney.format(detailRow.valorInt * 0.35)}</TableCell>
                          <TableCell align="right">{fmtMoney.format(detailRow.valorInt * 0.25)}</TableCell>
                          <TableCell align="right">{fmtMoney.format(detailRow.valorInt)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </Box>
                </Box>
              )}

              {tabSel === 1 && (
                <Box sx={{ mt: 2 }}>
                  <Trazabilidad rows={detailRow.trazas ?? []} height={360} />
                </Box>
              )}
            </>
          )}
        </DialogContent>

        <DialogActions>
          <Button variant="contained" onClick={() => setDetailOpen(false)}>
            CERRAR
          </Button>
        </DialogActions>
      </Dialog>

      <Box sx={{ px: 2, py: 1, display: "flex", gap: 1 }}>
        <Button size="small" variant="outlined" onClick={handleExportExcel}>
          Exportar Excel
        </Button>

        <Button size="small" variant="contained" color="success" disabled={selectedCount === 0} onClick={handleAprobar}>
          Pasar a Verificación
        </Button>
      </Box>
    </Box>
  );
}
