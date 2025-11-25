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
} from "@mui/material";

import {
  DataGrid,
  GridColDef,
  GridToolbarColumnsButton,
  GridToolbarContainer,
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

/* ====================== TYPES ====================== */
type Operador = ">=" | "<=" | "==" | "!=";

type Props = {
  categoria?: string;
  inconsistencia?: string;
  actividadEconomica?: string[];
  impuesto?: string;
  zonaEspecial?: string;
  programa?: string | null;
  periodoInicial?: string | null;
  periodoFinal?: string | null;
  operador?: Operador;
  valorMin?: string;
  valorMax?: string;
  provincia?: string;
};

type RawRow = {
  id: number;
  categoria: string;
  ruc: string;
  nombre: string;
  periodos: string;
  valor: number;
  provincia: string;
};

type Row = {
  id: number | string;
  categoria: string;
  ruc: string;
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
  metaImpuesto?: string | null;
  metaZonaEspecial?: string | null;
  fechaAsignacionISO?: string;
  detalleVisto?: boolean;
};

/* ========================== UTILS =========================== */
const toInt = (v: any): number => Math.trunc(Number(v || 0));

const fmtMoney = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/* ========================== MOCK DATA =========================== */
const rawRows: RawRow[] = [
  { id: 1, categoria: "Fiscalización Masiva", ruc: "8-123-456", nombre: "Individual", periodos: "06/25", valor: 1250000, provincia: "Darién" },
  { id: 2, categoria: "Fiscalización Masiva", ruc: "8-654-321", nombre: "Individual", periodos: "05/25", valor: 236.23, provincia: "Darién" },
  { id: 3, categoria: "Fiscalización Masiva", ruc: "100200", nombre: "Panamá Retail S.A.", periodos: "04/25", valor: 2980000, provincia: "Panamá" },
  { id: 4, categoria: "Fiscalización Masiva", ruc: "100201", nombre: "Construcciones Istmo S.A.", periodos: "03/25", valor: 1745320, provincia: "Panamá Oeste" },
  { id: 5, categoria: "Fiscalización Masiva", ruc: "100202", nombre: "Servicios Canal S.A.", periodos: "02/25", valor: 695, provincia: "Colón" },
  { id: 6, categoria: "Fiscalización Masiva", ruc: "100203", nombre: "Agroexport Delta", periodos: "01/25", valor: 1100000, provincia: "Veraguas" },
  { id: 7, categoria: "Fiscalización Masiva", ruc: "100204", nombre: "Tecno Sur S.A.", periodos: "12/24", valor: 8547, provincia: "Coclé" },
  { id: 8, categoria: "Fiscalización Masiva", ruc: "100205", nombre: "Transporte Caribe", periodos: "11/24", valor: 2300000, provincia: "Chiriquí" },
  { id: 9, categoria: "Fiscalización Masiva", ruc: "100206", nombre: "Hoteles del Istmo", periodos: "10/24", valor: 978, provincia: "Bocas del Toro" },
  { id: 10, categoria: "Fiscalización Masiva", ruc: "100207", nombre: "Textiles del Istmo", periodos: "09/24", valor: 1505000, provincia: "Los Santos" },

  // GC…
  { id: 11, categoria: "Grandes Contribuyentes", ruc: "200300", nombre: "Comercial ABC S.A.", periodos: "06/25", valor: 654, provincia: "Panamá" },
  { id: 12, categoria: "Grandes Contribuyentes", ruc: "200301", nombre: "Energía Nacional S.A.", periodos: "05/25", valor: 4123000.21, provincia: "Colón" },
  { id: 13, categoria: "Grandes Contribuyentes", ruc: "200302", nombre: "Telecom Panavisión", periodos: "04/25", valor: 158, provincia: "Panamá Oeste" },
  { id: 14, categoria: "Grandes Contribuyentes", ruc: "200303", nombre: "Aviación del Istmo", periodos: "03/25", valor: 2060000.45, provincia: "Chiriquí" },
  { id: 15, categoria: "Grandes Contribuyentes", ruc: "200304", nombre: "Finanzas Canal Group", periodos: "02/25", valor: 657, provincia: "Herrera" },
  { id: 16, categoria: "Grandes Contribuyentes", ruc: "200305", nombre: "Minería del Pacífico", periodos: "01/25", valor: 3100450.23, provincia: "Veraguas" },
];

const BASE_ROWS: Row[] = rawRows.map((r) => ({
  ...r,
  valorInt: toInt(r.valor),
  trazas: [],
}));

/* ========================== MAIN COMPONENT =========================== */
export default function PriorizacionForm({
  categoria,
  inconsistencia,
  actividadEconomica,
  impuesto,
  zonaEspecial,
  programa,
  periodoInicial,
  periodoFinal,
  operador,
  valorMin,
  valorMax,
  provincia,
}: Props) {
  const apiRef = useGridApiRef();

  /* ========== RUCs ya enviados ========== */
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

  /* ========== FILTRO ========== */
  const rows = React.useMemo<Row[]>(() => {
    let base = BASE_ROWS;

    if (provincia && provincia !== "Todos")
      base = base.filter((r) => r.provincia === provincia);

    const minVal = valorMin ? Number(valorMin) : null;
    const maxVal = valorMax ? Number(valorMax) : null;

    if (minVal != null) base = base.filter((r) => r.valorInt >= minVal);
    if (maxVal != null) base = base.filter((r) => r.valorInt <= maxVal);

    return base;
  }, [provincia, valorMin, valorMax]);

  const [selectedCount, setSelectedCount] = React.useState(0);

  /* ========== DETALLE ========== */
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [detailRow, setDetailRow] = React.useState<Row | null>(null);
  const [tabSel, setTabSel] = React.useState(0);

  const openDetail = (row: Row) => {
    setDetailRow(row);
    setTabSel(0);
    setDetailOpen(true);
  };

  /* ========== COLUMNAS ========== */
  const columns: GridColDef[] = [
    { field: "ruc", headerName: "RUC", flex: 0.8, minWidth: 130 },
    { field: "nombre", headerName: "Nombre / Razón Social", flex: 1.1, minWidth: 220 },
    { field: "provincia", headerName: "Provincia", flex: 0.7, minWidth: 110 },

    { field: "zonaEspecial", headerName: "Zona Especial", minWidth: 150, valueGetter: () => zonaEspecial ?? "—" },
    { field: "impuesto", headerName: "Impuesto", minWidth: 130, valueGetter: () => impuesto ?? "—" },

    {
      field: "valorInt",
      headerName: "Valor (B/.)",
      minWidth: 140,
      renderCell: (params) => fmtMoney.format(params.row.valorInt),
    },

    {
      field: "acciones",
      headerName: "Acciones",
      minWidth: 140,
      renderCell: (params) => (
        <Button size="small" variant="contained" onClick={() => openDetail(params.row as Row)}>
          DETALLE
        </Button>
      ),
    },
  ];

  /* ========== PASAR A VERIFICACIÓN ========== */
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
  metaImpuesto: impuesto,
  metaZonaEspecial: zonaEspecial,
  fechaAsignacionISO: ahoraISO,
  detalleVisto: false,

  // ⭐ NUEVO ⭐
  estadoVerif: "Pendiente",
}));

const existentes = JSON.parse(localStorage.getItem(CASOS_KEY) || "[]");

// quitar cualquier duplicado por RUC
const sinDuplicados = existentes.filter(
  (x: any) => !paquete.some((p) => p.ruc === x.ruc)
);

// fusionar
localStorage.setItem(CASOS_KEY, JSON.stringify([...sinDuplicados, ...paquete]));

    notifyAprobaciones();

    await Swal.fire("Éxito", "Casos enviados a Verificación.", "success");

    const s = new Set(rucsEnVerificacion);
    paquete.forEach((r) => s.add(String(r.ruc)));
    setRucsEnVerificacion(s);
  };

  /* ========== EXPORT ========== */
  const handleExportExcel = () => {
    if (!rows.length) {
      Swal.fire("Sin datos", "No hay datos que exportar.", "info");
      return;
    }

    const data = rows.map((r) => ({
      RUC: r.ruc,
      Nombre: r.nombre,
      Provincia: r.provincia,
      Categoria: categoria ?? r.categoria,
      Inconsistencia: inconsistencia ?? "",
      Impuesto: impuesto ?? "",
      ZonaEspecial: zonaEspecial ?? "",
      Periodos: r.periodos,
      Valor: r.valorInt,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Priorización");
    XLSX.writeFile(wb, "selector_casos_priorizacion.xlsx");
  };

  /* ========== TOOLBAR ========== */
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

  /* ========== RENDER ========== */
  return (
    <Box component={Paper} sx={{ mt: 2, p: 1 }}>

      <DataGrid
        sx={{ height: 420 }}
        apiRef={apiRef}
        rows={rows}
        columns={columns}
        checkboxSelection
        disableRowSelectionOnClick
        isRowSelectable={(params) => !rucsEnVerificacion.has(String(params.row.ruc))}
       onRowSelectionModelChange={(m:any) => {
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

      {/* DETALLE */}
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
                      <Typography variant="caption">Categoría</Typography>
                      <Paper sx={{ p: 1 }}>{categoria}</Paper>
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <Typography variant="caption">Inconsistencia</Typography>
                      <Paper sx={{ p: 1 }}>{inconsistencia}</Paper>
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <Typography variant="caption">RUC</Typography>
                      <Paper sx={{ p: 1 }}>{detailRow.ruc}</Paper>
                    </Grid>

                    <Grid item xs={12} md={8}>
                      <Typography variant="caption">Nombre</Typography>
                      <Paper sx={{ p: 1 }}>{detailRow.nombre}</Paper>
                    </Grid>

                    <Grid item xs={12}>
                      <Typography variant="caption">Actividad Económica</Typography>
                      <Paper sx={{ p: 1 }}>
                        {actividadEconomica?.length ? actividadEconomica.join(", ") : "—"}
                      </Paper>
                    </Grid>

                    <Grid item xs={6}>
                      <Typography variant="caption">Periodo Inicial</Typography>
                      <Paper sx={{ p: 1 }}>{periodoInicial}</Paper>
                    </Grid>

                    <Grid item xs={6}>
                      <Typography variant="caption">Periodo Final</Typography>
                      <Paper sx={{ p: 1 }}>{periodoFinal}</Paper>
                    </Grid>
                  </Grid>

                  {/* Ejemplo tabla interna */}
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

      {/* BOTONES FINALES */}
      <Box sx={{ px: 2, py: 1, display: "flex", gap: 1 }}>
        <Button size="small" variant="outlined" onClick={handleExportExcel}>
          Exportar Excel
        </Button>

        <Button
          size="small"
          variant="contained"
          color="success"
          disabled={selectedCount === 0}
          onClick={handleAprobar}
        >
          Pasar a Verificación
        </Button>
      </Box>

    </Box>
  );
}
