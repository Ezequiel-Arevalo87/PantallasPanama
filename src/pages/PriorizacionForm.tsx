import * as React from "react";
import {
  Box, Paper, Button, Stack, Typography, Chip, Grid,
} from "@mui/material";
import {
  DataGrid, GridColDef, GridToolbarColumnsButton, GridToolbarContainer,
  GridToolbarDensitySelector, GridToolbarExport, GridToolbarQuickFilter,
  useGridApiRef, GridColumnVisibilityModel,
} from "@mui/x-data-grid";
import { esES } from "@mui/x-data-grid/locales";
import * as XLSX from "xlsx";

/** ========= Tipos ========= */
type Operador = ">=" | "<=" | "==" | "!=";

type Condicion = {
  criterio: string;
  operador: Operador;
  valorBalboas: number;
};

type Props = {
  condiciones?: Condicion[];
  categoria?: string;
  inconsistencia?: string;
  actividadEconomica?: string[];
  valoresDeclarados?: number | string;
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

/** ========= Utilidades ========= */
const periodoToNumber = (mmAA: string) => {
  const [mm, aa] = mmAA.split("/").map((v) => parseInt(v, 10));
  const year = 2000 + (isNaN(aa) ? 0 : aa);
  const month = isNaN(mm) ? 1 : mm;
  return year * 100 + month;
};

// Convierte "B/. 5,555.00", "654,00", "1.234,56" → número
const toNumber = (v: any): number => {
  if (v === null || v === undefined) return 0;
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  let s = String(v).trim();
  s = s.replace(/[^\d.,\-]/g, "");       // deja dígitos, coma, punto, signo
  s = s.replace(/\.(?=\d{3}(\D|$))/g, ""); // quita puntos de miles
  s = s.replace(/,/, ".");               // coma decimal → punto
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
};

// Formato Panamá (Balboa)
const fmtMoney = new Intl.NumberFormat("es-PA", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** ========= Datos demo ========= */
const rawRows: Row[] = [
  { id: 1, categoria: "Fiscalización Masiva", ruc: "8-123-456", nombre: "Individual", periodos: "06/25", valor: 236.0 },
  { id: 2, categoria: "Grandes Contribuyentes", ruc: "RUC-998877", nombre: "Comercial ABC S.A.", periodos: "05/25", valor: "654,00" },
  { id: 3, categoria: "Auditoría Sectorial", ruc: "RUC-555888", nombre: "Servicios XYZ", periodos: "04/25", valor: 158 },
  { id: 4, categoria: "Fiscalización Masiva", ruc: "RUC-111222", nombre: "Individual", periodos: "03/25", valor: 695 },
  { id: 5, categoria: "Grandes Contribuyentes", ruc: "RUC-222333", nombre: "Inversiones Delta, S.A.", periodos: "02/25", valor: 657 },
  { id: 6, categoria: "Auditoría Sectorial", ruc: "RUC-333444", nombre: "AgroPanamá Ltda.", periodos: "01/25", valor: 1025 },
  { id: 7, categoria: "Fiscalización Masiva", ruc: "8-654-321", nombre: "Individual", periodos: "12/24", valor: 2365 },
  { id: 8, categoria: "Grandes Contribuyentes", ruc: "RUC-444555", nombre: "Tecno Global S.A.", periodos: "11/24", valor: 236 },
  { id: 9, categoria: "Auditoría Sectorial", ruc: "RUC-777999", nombre: "Transporte Caribe", periodos: "10/24", valor: 8547 },
  { id: 10, categoria: "Fiscalización Masiva", ruc: "RUC-101010", nombre: "Individual", periodos: "09/24", valor: 236 },
  { id: 11, categoria: "Grandes Contribuyentes", ruc: "RUC-121212", nombre: "Construcciones PAC S.A.", periodos: "08/24", valor: 978 },
  { id: 12, categoria: "Auditoría Sectorial", ruc: "RUC-131313", nombre: "Textiles del Istmo", periodos: "07/24", valor: 3252 },
];

/** ========= Eval de condiciones ========= */
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
}: Props) {
  const apiRef: any = useGridApiRef();

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
    { field: "categoria", headerName: "Categoría", flex: 1, minWidth: 180 },
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
  {
  field: "valor",
  headerName: "Valor (B/.)",
  type: "number",
  flex: 0.8,
  minWidth: 160,
  sortable: true,

}
  ];

  /** Locale */
  const localeText = {
    ...esES.components.MuiDataGrid.defaultProps.localeText,
    toolbarQuickFilterPlaceholder: "Buscar…",
  };

  /** Estado UI */
  const [paginationModel, setPaginationModel] = React.useState({ page: 0, pageSize: 5 });
  const [columnVisibilityModel, setColumnVisibilityModel] =
    React.useState<GridColumnVisibilityModel>({
      categoria: true,
      ruc: true,
      nombre: true,
      periodos: true,
      valor: true, // 👈 coincide con field
    });
  const [selectedCount, setSelectedCount] = React.useState(0);

  /** Acciones selección */
  const selectAll = () => {
    if (!apiRef.current) return;
    const allIds = rows.map((r: any) => r.id);
    apiRef.current.setRowSelectionModel(allIds);
  };
  const clearSelection = () => {
    if (!apiRef.current) return;
    apiRef.current.setRowSelectionModel([]);
  };

  /** Export de seleccionados */
  const handleAprobar = () => {
    if (!apiRef.current) return;
    const selectedRows = Array.from(apiRef.current.getSelectedRows().values());
    if (selectedRows.length === 0) {
      alert("No hay casos seleccionados para aprobar.");
      return;
    }
    const worksheet = XLSX.utils.json_to_sheet(selectedRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Casos Aprobados");
    XLSX.writeFile(workbook, "casos_aprobados.xlsx");
  };

  /** Toolbar personalizada */
  function CustomToolbar() {
    return (
      <GridToolbarContainer sx={{ p: 1, display: "flex", alignItems: "center" }}>
        <GridToolbarColumnsButton />
        <GridToolbarDensitySelector />
        <GridToolbarExport />
        <Box sx={{ flex: 1 }} />
        <GridToolbarQuickFilter />
        <Stack direction="row" spacing={1} sx={{ ml: 1 }}>
          <Button size="small" variant="outlined" onClick={selectAll}>
            Seleccionar todo
          </Button>
          <Button size="small" variant="text" onClick={clearSelection}>
            Limpiar selección
          </Button>
        </Stack>
      </GridToolbarContainer>
    );
  }

  return (
    <Box component={Paper} sx={{ mt: 2, pb: 1 }}>
      {/* Resumen de filtros */}
      <Box sx={{ px: 2, pt: 1 }}>
        <Grid container spacing={1} alignItems="center">
          <Grid item>
            <Typography variant="body2">
              Seleccionados: <b>{selectedCount}</b>
            </Typography>
          </Grid>
          {categoria && (
            <Grid item>
              <Chip label={`Categoría: ${categoria}`} size="small" />
            </Grid>
          )}
          {inconsistencia && (
            <Grid item>
              <Chip label={`Inconsistencia: ${inconsistencia}`} size="small" />
            </Grid>
          )}
          {actividadEconomica && actividadEconomica.length > 0 && (
            <Grid item>
              <Chip label={`Actividades: ${actividadEconomica.join(", ")}`} size="small" />
            </Grid>
          )}
          <Grid item>
            <Chip
              color="primary"
              variant="outlined"
              label={`Reglas activas: ${condiciones?.length ?? 0}`}
              size="small"
            />
          </Grid>
        </Grid>
      </Box>

      <DataGrid
        sx={{ height: 420 }}
        apiRef={apiRef}
        localeText={localeText}
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
        initialState={{
          sorting: { sortModel: [{ field: "periodos", sort: "desc" }] },
        }}
      />

      <Box sx={{ px: 2, py: 1 }}>
        <Button
          size="small"
          variant="contained"
          color="success"
          onClick={handleAprobar}
          disabled={selectedCount === 0}
        >
          Aprobar
        </Button>
      </Box>
    </Box>
  );
}
