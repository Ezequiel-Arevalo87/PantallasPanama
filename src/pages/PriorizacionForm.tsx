import * as React from "react";
import {
  Box, Paper, Grid, Chip, Typography, Button,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Table, TableHead, TableRow, TableCell, TableBody, Stack
} from "@mui/material";
import {
  DataGrid, GridColDef, GridToolbarColumnsButton, GridToolbarContainer,
  GridToolbarDensitySelector, GridToolbarExport, GridToolbarQuickFilter,
  GridColumnVisibilityModel, useGridApiRef,

} from "@mui/x-data-grid";
import { esES } from "@mui/x-data-grid/locales";
import Swal from "sweetalert2";
import { CASOS_KEY, notifyAprobaciones } from "../lib/aprobacionesStorage";

// ===== Tipos =====
type Operador = ">=" | "<=" | "==" | "!=";
type Condicion = { criterio: string; operador: Operador; valorBalboas: number };

type Props = {
  condiciones?: Condicion[];
  categoria?: string;
  inconsistencia?: string;
  actividadEconomica?: string[];
  valoresDeclarados?: number | string;
  programa?: string | null;
  periodoInicial?: string | null;
  periodoFinal?: string | null;
  operadorFiltro?: Operador;
  valorFiltro?: number | string;
};

type Row = {
  id: number | string;
  categoria: string; // categoría “real” de la fila demo
  ruc: string;
  nombre: string;
  periodos: string;
  valor?: number | string | null;
  monto?: number | string | null;
  total?: number | string | null;
};

// ➕ Tipo extendido que guardaremos en Aprobación
export type RowAprobacion = Row & {
  metaCategoria?: string;
  metaInconsistencia?: string;
  metaPrograma?: string | null;
  metaActividadEconomica?: string[];
  metaPeriodoInicial?: string | null;
  metaPeriodoFinal?: string | null;
};

// ===== Utils =====
const periodoToNumber = (mmAA: string) => {
  const [mm, aa] = mmAA.split("/").map((v) => parseInt(v, 10));
  const year = 2000 + (isNaN(aa) ? 0 : aa);
  const month = isNaN(mm) ? 1 : mm;
  return year * 100 + month;
};
const toNumber = (v: any): number => {
  if (v === null || v === undefined) return 0;
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  let s = String(v).trim();
  s = s.replace(/[^\d.,\-]/g, "");
  s = s.replace(/\.(?=\d{3}(\D|$))/g, "");
  s = s.replace(/,/, ".");
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
};
const fmtMoney = new Intl.NumberFormat("es-PA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (iso?: string | null) => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
};

// ===== Datos demo =====
const rawRows: Row[] = [
  // Fiscalización Masiva
  { id: 1,  categoria: "Fiscalización Masiva", ruc: "8-123-456",   nombre: "Individual",                 periodos: "06/25", valor: 1250000.50 },
  { id: 2,  categoria: "Fiscalización Masiva", ruc: "8-654-321",   nombre: "Individual",                 periodos: "05/25", valor: 236.00 },
  { id: 3,  categoria: "Fiscalización Masiva", ruc: "RUC-100200",  nombre: "Panamá Retail S.A.",         periodos: "04/25", valor: 2980000.00 },
  { id: 4,  categoria: "Fiscalización Masiva", ruc: "RUC-100201",  nombre: "Construcciones Istmo S.A.",  periodos: "03/25", valor: "1,745,320.90" },
  { id: 5,  categoria: "Fiscalización Masiva", ruc: "RUC-100202",  nombre: "Servicios Canal S.A.",       periodos: "02/25", valor: 695.00 },
  { id: 6,  categoria: "Fiscalización Masiva", ruc: "RUC-100203",  nombre: "Agroexport Delta",           periodos: "01/25", valor: 1100000.00 },
  { id: 7,  categoria: "Fiscalización Masiva", ruc: "RUC-100204",  nombre: "Tecno Sur S.A.",             periodos: "12/24", valor: 8547.00 },
  { id: 8,  categoria: "Fiscalización Masiva", ruc: "RUC-100205",  nombre: "Transporte Caribe",          periodos: "11/24", valor: "2,300,000.00" },
  { id: 9,  categoria: "Fiscalización Masiva", ruc: "RUC-100206",  nombre: "Hoteles del Istmo",          periodos: "10/24", valor: 978.00 },
  { id:10,  categoria: "Fiscalización Masiva", ruc: "RUC-100207",  nombre: "Textiles del Istmo",         periodos: "09/24", valor: 1505000.25 },

  // Grandes Contribuyentes
  { id:11,  categoria: "Grandes Contribuyentes", ruc: "RUC-200300", nombre: "Comercial ABC S.A.",        periodos: "06/25", valor: "654,00" },
  { id:12,  categoria: "Grandes Contribuyentes", ruc: "RUC-200301", nombre: "Energía Nacional S.A.",     periodos: "05/25", valor: 4123000.00 },
  { id:13,  categoria: "Grandes Contribuyentes", ruc: "RUC-200302", nombre: "Telecom Panavisión",        periodos: "04/25", valor: 158.00 },
  { id:14,  categoria: "Grandes Contribuyentes", ruc: "RUC-200303", nombre: "Aviación del Istmo",        periodos: "03/25", valor: 2060000.75 },
  { id:15,  categoria: "Grandes Contribuyentes", ruc: "RUC-200304", nombre: "Finanzas Canal Group",      periodos: "02/25", valor: 657.00 },
  { id:16,  categoria: "Grandes Contribuyentes", ruc: "RUC-200305", nombre: "Minería del Pacífico",      periodos: "01/25", valor: "3,100,450.10" },
  { id:17,  categoria: "Grandes Contribuyentes", ruc: "RUC-200306", nombre: "Alimentos Global S.A.",     periodos: "12/24", valor: 236.00 },
  { id:18,  categoria: "Grandes Contribuyentes", ruc: "RUC-200307", nombre: "Logística Intermodal",      periodos: "11/24", valor: 1299000.00 },
  { id:19,  categoria: "Grandes Contribuyentes", ruc: "RUC-200308", nombre: "Farmacéutica Panamericana", periodos: "10/24", valor: 2365.00 },
  { id:20,  categoria: "Grandes Contribuyentes", ruc: "RUC-200309", nombre: "Seguros del Istmo",         periodos: "09/24", valor: "1,080,000.00" },

  // Auditoría Sectorial
  { id:21,  categoria: "Auditoría Sectorial", ruc: "RUC-300400", nombre: "Servicios XYZ",               periodos: "06/25", valor: 158.00 },
  { id:22,  categoria: "Auditoría Sectorial", ruc: "RUC-300401", nombre: "AgroPanamá Ltda.",            periodos: "05/25", valor: 1025.00 },
  { id:23,  categoria: "Auditoría Sectorial", ruc: "RUC-300402", nombre: "Turismo & Viajes S.A.",       periodos: "04/25", valor: 1350000.00 },
  { id:24,  categoria: "Auditoría Sectorial", ruc: "RUC-300403", nombre: "Educación Privada del Sur",   periodos: "03/25", valor: "2,450,000.00" },
  { id:25,  categoria: "Auditoría Sectorial", ruc: "RUC-300404", nombre: "Salud Integral S.A.",         periodos: "02/25", valor: 695.00 },
  { id:26,  categoria: "Auditoría Sectorial", ruc: "RUC-300405", nombre: "Tecnología Andina",           periodos: "01/25", valor: 1789000.00 },
  { id:27,  categoria: "Auditoría Sectorial", ruc: "RUC-300406", nombre: "Arquitectura Moderna",        periodos: "12/24", valor: 320.00 },
  { id:28,  categoria: "Auditoría Sectorial", ruc: "RUC-300407", nombre: "Transporte Urbano S.A.",      periodos: "11/24", valor: "1,250,000.00" },
  { id:29,  categoria: "Auditoría Sectorial", ruc: "RUC-300408", nombre: "Comercial Marítima",          periodos: "10/24", valor: 236.00 },
  { id:30,  categoria: "Auditoría Sectorial", ruc: "RUC-300409", nombre: "Consultores del Istmo",       periodos: "09/24", valor: 2110000.35 },
];

const evalCond = (valor: number, operador: Operador, objetivo: number) => {
  switch (operador) {
    case ">=": return valor >= objetivo;
    case "<=": return valor <= objetivo;
    case "==": return valor === objetivo;
    case "!=": return valor !== objetivo;
    default: return true;
  }
};

const PERIODOS_FIJOS = ["dic-20", "dic-21", "dic-22", "dic-23", "dic-24", "dic-25"];
function buildBreakdown(row: Row) {
  const total = toNumber(row.valor ?? row.monto ?? row.total);
  if (!total) {
    return { items: PERIODOS_FIJOS.map(p => ({ periodo: p, monto: 0 })), total: 0 };
  }
  const seed = (typeof row.id === "number" ? row.id : Number(String(row.id).replace(/\D/g, ''))) || 1;
  const weights = PERIODOS_FIJOS.map((_, i) => (i + 1) * ((seed % 7) + 3));
  const sumW = weights.reduce((a, b) => a + b, 0);
  const items = PERIODOS_FIJOS.map((p, i) => ({
    periodo: p,
    monto: Math.round((total * weights[i]) / sumW)
  }));
  const ajuste = total - items.reduce((a, b) => a + b.monto, 0);
  if (ajuste !== 0) items[items.length - 1].monto += ajuste;
  return { items, total };
}

// === Helpers para el texto del modal según inconsistencia (para subtítulo)
const normalize = (s?: string | null) => (s || "").toLowerCase();
const inconsLabels = (inc?: string | null) => {
  switch (normalize(inc)) {
    case "omiso":         return { singular: "omiso",         plural: "omisos" };
    case "inexacto":      return { singular: "inexacto",      plural: "inexactos" };
    case "extemporáneo":
    case "extemporaneo":  return { singular: "extemporáneo",  plural: "extemporáneos" };
    default:              return { singular: "inconsistencia", plural: "inconsistencias" };
  }
};

export default function PriorizacionForm({
  condiciones = [],
  categoria,
  inconsistencia,
  actividadEconomica,
  valoresDeclarados,
  programa,
  periodoInicial,
  periodoFinal,
  operadorFiltro,
  valorFiltro,
}: Props) {
  const apiRef = useGridApiRef();

  const rows = React.useMemo<Row[]>(() => {
    let base = rawRows;

    if (condiciones && condiciones.length > 0) {
      base = base.filter((r) =>
        condiciones.every((c) =>
          evalCond(toNumber(r.valor ?? r.monto ?? r.total), c.operador, c.valorBalboas)
        )
      );
    }
    if (typeof valorFiltro !== "undefined" && valorFiltro !== "" && operadorFiltro) {
      const objetivo = toNumber(valorFiltro);
      base = base.filter((r) => {
        const val = toNumber(r.valor ?? r.monto ?? r.total);
        return evalCond(val, operadorFiltro, objetivo);
      });
    }
    return base;
  }, [condiciones, operadorFiltro, valorFiltro]);

  const [paginationModel, setPaginationModel] = React.useState({ page: 0, pageSize: 5 });
  const [columnVisibilityModel, setColumnVisibilityModel] =
    React.useState<GridColumnVisibilityModel>({
      categoria: true, ruc: true, nombre: true, periodos: true, valor: true,
    });
  const [selectedCount, setSelectedCount] = React.useState(0);

  const [detailOpen, setDetailOpen] = React.useState(false);
  const [detailRow, setDetailRow] = React.useState<Row | null>(null);
  const openDetail = (row: Row) => { setDetailRow(row); setDetailOpen(true); };
  const closeDetail = () => setDetailOpen(false);

  const columns: GridColDef[] = [
    { field: "ruc", headerName: "RUC", flex: 1, minWidth: 140 },
    { field: "nombre", headerName: "Nombre o Razón Social", flex: 1.2, minWidth: 240 },
    {
      field: "periodos",
      headerName: "Períodos no presentados (mm/aa)",
      flex: 1,
      minWidth: 220,
      sortable: true,
      sortComparator: (v1, v2) =>
        periodoToNumber(String(v1)) - periodoToNumber(String(v2)),
    },
    { field: "valor", headerName: "Valor (B/.)", type: "number", flex: 0.8, minWidth: 160, sortable: true },
    {
      field: "acciones",
      headerName: "Acciones",
      sortable: false,
      filterable: false,
      align: "center",
      headerAlign: "center",
      minWidth: 140,
      renderCell: (params) => (
        <Button size="small" variant="contained" onClick={() => openDetail(params.row as Row)}>
          DETALLE
        </Button>
      ),
    },
  ];

  const localeText = {
    ...esES.components.MuiDataGrid.defaultProps.localeText,
    toolbarQuickFilterPlaceholder: "Buscar…",
  };

  /** Pasar a Aprobación: guarda selección con metadata y reemplaza lo previo */
  const handleAprobar = async () => {
    const api = apiRef.current;
    if (!api) {
      await Swal.fire({ icon: "error", title: "No se pudo leer la tabla", text: "Intenta nuevamente.", confirmButtonText: "Ok" });
      return;
    }

    const selected = Array.from(api.getSelectedRows().values()) as Row[];
    if (selected.length === 0) {
      await Swal.fire({ icon: "info", title: "Sin selección", text: "No hay casos seleccionados para pasar a aprobación.", confirmButtonText: "Ok" });
      return;
    }

    const { isConfirmed } = await Swal.fire({
      icon: "question",
      title: "¿Pasar a Aprobación?",
      html: `Se enviarán <b>${selected.length}</b> caso(s) a aprobación.<br/>Esto reemplazará cualquier lista previa.`,
      showCancelButton: true,
      confirmButtonText: "Sí, confirmar",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
      focusCancel: true,
    });
    if (!isConfirmed) return;

    const conMeta: RowAprobacion[] = selected.map((r) => ({
      ...r,
      // ⚠️ fuerza que la Aprobación vea lo elegido aquí
      metaCategoria: categoria ?? r.categoria,
      metaInconsistencia: inconsistencia ?? undefined,
      metaPrograma: programa ?? null,
      metaActividadEconomica: actividadEconomica ?? [],
      metaPeriodoInicial: periodoInicial ?? null,
      metaPeriodoFinal: periodoFinal ?? null,
    }));

    localStorage.setItem(CASOS_KEY, JSON.stringify(conMeta));
    notifyAprobaciones();

    await Swal.fire({ icon: "success", title: "Guardado", text: `Se enviaron ${selected.length} caso(s) a Aprobación.`, confirmButtonText: "Listo" });
  };

  // etiquetas dinámicas (solo para el subtítulo)
  const inc = inconsLabels(inconsistencia);

  return (
    <Box component={Paper} sx={{ mt: 2, pb: 1 }}>
      {/* Resumen de filtros */}
      <Box sx={{ px: 2, pt: 1 }}>
        <Grid container spacing={1} alignItems="center">
          <Grid item>
            <Typography variant="body2">Seleccionados: <b>{selectedCount}</b></Typography>
          </Grid>
          {categoria && <Grid item><Chip label={`Categoría: ${categoria}`} size="small" /></Grid>}
          {inconsistencia && <Grid item><Chip label={`Inconsistencia: ${inconsistencia}`} size="small" /></Grid>}
          {programa && <Grid item><Chip color="primary" variant="outlined" label={`Programa: ${programa}`} size="small" /></Grid>}
          {(periodoInicial || periodoFinal) && (
            <Grid item>
              <Chip variant="outlined" label={`Rango: ${fmtDate(periodoInicial)}${periodoInicial && periodoFinal ? " — " : ""}${fmtDate(periodoFinal)}`} size="small" />
            </Grid>
          )}
          {typeof valoresDeclarados !== "undefined" && valoresDeclarados !== "" && (
            <Grid item><Chip label={`Valores declarados: ${fmtMoney.format(toNumber(valoresDeclarados))}`} size="small" /></Grid>
          )}
          {actividadEconomica && actividadEconomica.length > 0 && (
            <Grid item><Chip label={`Actividades: ${actividadEconomica.join(", ")}`} size="small" /></Grid>
          )}
          <Grid item><Chip color="primary" variant="outlined" label={`Reglas activas: ${condiciones?.length ?? 0}`} size="small" /></Grid>
        </Grid>
      </Box>

      <DataGrid
        sx={{ height: 420 }}
        apiRef={apiRef}
        rows={rows}
        columns={columns}
        checkboxSelection
        disableRowSelectionOnClick
        onRowSelectionModelChange={(m: any) => setSelectedCount(m.length)}
        slots={{ toolbar: CustomToolbar }}
        slotProps={{ toolbar: { showQuickFilter: true, quickFilterProps: { debounceMs: 400 } } }}
        pagination
        pageSizeOptions={[5, 10, 25, 50]}
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        columnVisibilityModel={columnVisibilityModel}
        onColumnVisibilityModelChange={(model) => setColumnVisibilityModel(model)}
        initialState={{ sorting: { sortModel: [{ field: "periodos", sort: "desc" }] } }}
        localeText={localeText}
      />

      {/* Modal Detalle */}
      <Dialog open={detailOpen} onClose={closeDetail} maxWidth="md" fullWidth>
        {/* ✅ TÍTULO SIN “inexactos” */}
        <DialogTitle>Detalle de períodos</DialogTitle>
        <DialogContent dividers>
          {detailRow && (
            <Box sx={{ mb: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Typography variant="caption">Categoría</Typography>
                  <Box component={Paper} sx={{ p: 1 }}>{categoria || detailRow.categoria}</Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="caption">Inconsistencia</Typography>
                  <Box component={Paper} sx={{ p: 1 }}>{inconsistencia || "—"}</Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="caption">Programa</Typography>
                  <Box component={Paper} sx={{ p: 1 }}>{programa || "—"}</Box>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Typography variant="caption">RUC</Typography>
                  <Box component={Paper} sx={{ p: 1 }}>{detailRow.ruc}</Box>
                </Grid>
                <Grid item xs={12} md={8}>
                  <Typography variant="caption">Nombre</Typography>
                  <Box component={Paper} sx={{ p: 1 }}>{detailRow.nombre}</Box>
                </Grid>

                {actividadEconomica && actividadEconomica.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="caption">Actividad(es) económica(s)</Typography>
                    <Box component={Paper} sx={{ p: 1 }}>
                      {actividadEconomica.join(", ")}
                    </Box>
                  </Grid>
                )}
              </Grid>

              <Box sx={{ mt: 2 }}>
                {/* Subtítulo dinámico se mantiene */}
                <Typography sx={{ mb: 1 }} variant="subtitle2">
                  Cantidad de períodos {inc.singular}
                </Typography>
                {(() => {
                  const bd = buildBreakdown(detailRow);
                  return (
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          {PERIODOS_FIJOS.map(p => <TableCell key={p} align="right">{p}</TableCell>)}
                          <TableCell align="right"><b>Total</b></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <TableRow>
                          {bd.items.map(it => (
                            <TableCell key={it.periodo} align="right">
                              {fmtMoney.format(it.monto)}
                            </TableCell>
                          ))}
                          <TableCell align="right"><b>{fmtMoney.format(bd.total)}</b></TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  );
                })()}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Stack direction="row" spacing={1} sx={{ mr: "auto", pl: 1 }}>
            <Button variant="outlined" size="small">EXCEL</Button>
            <Button variant="outlined" size="small">WORD</Button>
            <Button variant="outlined" size="small">PDF</Button>
          </Stack>
          <Button variant="contained" onClick={closeDetail}>CERRAR</Button>
        </DialogActions>
      </Dialog>

      {/* Botón aprobar */}
      <Box sx={{ px: 2, py: 1 }}>
        <Button
          size="small"
          variant="contained"
          color="success"
          onClick={handleAprobar}
          disabled={selectedCount === 0}
        >
          Pasar a Aprobación
        </Button>
      </Box>
    </Box>
  );
}

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
