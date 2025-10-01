import * as React from "react";
import { Box, Paper, Grid, Chip, Typography } from "@mui/material";
import {
  DataGrid, GridColDef, GridToolbarColumnsButton, GridToolbarContainer,
  GridToolbarDensitySelector, GridToolbarExport, GridToolbarQuickFilter,
  GridColumnVisibilityModel,
} from "@mui/x-data-grid";
import { esES } from "@mui/x-data-grid/locales";
// import * as XLSX from "xlsx"; // 👈 oculto: export de aprobados

/** ========= Tipos ========= */
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
};

type Row = {
  id: number | string;
  categoria: string;
  ruc: string;
  nombre: string;
  periodos: string;
  valor?: number | string | null;
  monto?: number | string | null;
  total?: number | string | null;
};

/** ========= Utils ========= */
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

/** ========= Datos demo ========= */
const rawRows: Row[] = [
  { id: 1, categoria: "Fiscalización Masiva", ruc: "8-123-456", nombre: "Individual", periodos: "06/25", valor: 236.0 },
  { id: 2, categoria: "Grandes Contribuyentes", ruc: "RUC-998877", nombre: "Comercial ABC S.A.", periodos: "05/25", valor: "654,00" },
  { id: 3, categoria: "Auditoría Sectorial", ruc: "RUC-555888", nombre: "Servicios XYZ", periodos: "04/25", valor: 158 },
  { id: 4, categoria: "Fiscalización Masiva", ruc: "RUC-111222", nombre: "Individual", periodos: "03/25", valor: 695 },
  { id: 5, categoria: "Grandes Contribuyentes", ruc: "RUC-222333", nombre: "Inversiones Delta, S.A.", periodos: "02/25", valor: 657 },
  { id: 6, categoria: "Auditoría Sectorial", ruc: "RUC-333444", nombre: "AgroPanamá Ltda.", periodos: "01/25", valor: 1025 },
];

/** ========= Eval condiciones (se mantiene por compatibilidad) ========= */
const evalCond = (valor: number, operador: Operador, objetivo: number) => {
  switch (operador) {
    case ">=": return valor >= objetivo;
    case "<=": return valor <= objetivo;
    case "==": return valor === objetivo;
    case "!=": return valor !== objetivo;
    default: return true;
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
}: Props) {
  /** Filas (si no hay reglas, no filtramos) */
  const rows = React.useMemo<Row[]>(() => {
    if (!condiciones || condiciones.length === 0) return rawRows;
    return rawRows.filter((r) =>
      condiciones.every((c) =>
        evalCond(toNumber(r.valor ?? r.monto ?? r.total), c.operador, c.valorBalboas)
      )
    );
  }, [condiciones]);

  /** Columnas */
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
  ];

  /** Locale */
  const localeText = {
    ...esES.components.MuiDataGrid.defaultProps.localeText,
    toolbarQuickFilterPlaceholder: "Buscar…",
  };

  /** Visibilidad de columnas (se deja por si el usuario quiere ocultar desde toolbar) */
  const [paginationModel, setPaginationModel] = React.useState({ page: 0, pageSize: 5 });
  const [columnVisibilityModel, setColumnVisibilityModel] =
    React.useState<GridColumnVisibilityModel>({
      categoria: true,
      ruc: true,
      nombre: true,
      periodos: true,
      valor: true,
    });

  /** Toolbar sin acciones de selección/aprobar */
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

  return (
    <Box component={Paper} sx={{ mt: 2, pb: 1 }}>
      {/* Resumen de filtros */}
      <Box sx={{ px: 2, pt: 1 }}>
        <Grid container spacing={1} alignItems="center">
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
          <Grid item>
            <Chip color="primary" variant="outlined" label={`Reglas activas: ${condiciones?.length ?? 0}`} size="small" />
          </Grid>
        </Grid>
      </Box>

      <DataGrid
        sx={{ height: 420 }}
        rows={rows}
        columns={columns}
        // 👇 Se deshabilita la selección con checks
        checkboxSelection={false}
        disableRowSelectionOnClick
        // Sin conteo de seleccionados ni apiRef
        slots={{ toolbar: CustomToolbar }}
        slotProps={{ toolbar: { showQuickFilter: true, quickFilterProps: { debounceMs: 400 } } }}
        pagination
        pageSizeOptions={[5, 10, 25, 50]}
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        columnVisibilityModel={columnVisibilityModel}
        onColumnVisibilityModelChange={(model) => setColumnVisibilityModel(model)}
        initialState={{ sorting: { sortModel: [{ field: "periodos", sort: "desc" }] } }}
      />

      {/* Botón Aprobar oculto (dejar comentado para futura activación)
      <Box sx={{ px: 2, py: 1 }}>
        <Button size="small" variant="contained" color="success" onClick={handleAprobar} disabled={selectedCount === 0}>
          Aprobar
        </Button>
      </Box>
      */}
    </Box>
  );
}
