import * as React from "react";
import {
  Box,
  Paper,
  Button,
  Stack,
  Typography,
  Chip,
  Grid,
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
  GridColumnVisibilityModel,
} from "@mui/x-data-grid";
import { esES } from "@mui/x-data-grid/locales";
import * as XLSX from "xlsx";

/** ========= Tipos de props recibidas desde el padre ========= */
type Operador = ">=" | "<=" | "==" | "!=";

type Condicion = {
  criterio: string;       // solo texto descriptivo
  operador: Operador;     // >=, <=, ==, !=
  valorBalboas: number;   // contra esto comparamos la col "valor"
};

type Props = {
  condiciones?: Condicion[];
  categoria?: string;
  inconsistencia?: string;
  actividadEconomica?: string[];     // múltiple
  valoresDeclarados?: number | string;
};

/** ========= Utilidades ========= */
const periodoToNumber = (mmAA: string) => {
  const [mm, aa] = mmAA.split("/").map((v) => parseInt(v, 10));
  const year = 2000 + (isNaN(aa) ? 0 : aa);
  const month = isNaN(mm) ? 1 : mm;
  return year * 100 + month;
};

const toNumber = (v: any): number => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
};

// Formato Panamá (Balboa)
const fmtMoney = new Intl.NumberFormat("es-PA", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** ========= Datos demo ========= */
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

const rawRows: Row[] = [
  { id: 1, categoria: "Fiscalización Masiva", ruc: "8-123-456", nombre: "Individual", periodos: "06/25", valor: 236 },
  { id: 2, categoria: "Grandes Contribuyentes", ruc: "RUC-998877", nombre: "Comercial ABC S.A.", periodos: "05/25", valor: 654 },
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

/** ========= Eval de condiciones contra un valor numérico ========= */
const evalCond = (valor: number, operador: Operador, objetivo: number) => {
  switch (operador) {
    case ">=": return valor >= objetivo;
    case "<=": return valor <= objetivo;
    case "==": return valor === objetivo;
    case "!=": return valor !== objetivo;
    default:   return true;
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

  /** Normalizar filas y agregar campo auxiliar "cumple" */
  const rows = React.useMemo(() => {
    const base = (rawRows ?? []).map((r, idx) => ({
      ...r,
      id: r.id ?? idx + 1,
      valor: toNumber(r.valor ?? r.monto ?? r.total),
    }));

    if (!condiciones || condiciones.length === 0) {
      // sin reglas, no filtro
      return base.map((r) => ({ ...r, cumple: true }));
    }

    return base
      .map((r) => {
        const v = toNumber(r.valor);
        const ok = condiciones.every((c) => evalCond(v, c.operador, c.valorBalboas));
        return { ...r, cumple: ok };
      })
      .filter((r) => r.cumple);
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
      sortComparator: (v1, v2) => periodoToNumber(String(v1)) - periodoToNumber(String(v2)),
    },
    {
      field: "valor",
      headerName: "Valor (B/.)",
      flex: 0.8,
      minWidth: 160,
      sortable: true,
      valueFormatter: ({ value }) => {
        const num = toNumber(value);
        return Number.isFinite(num) ? fmtMoney.format(num) : "";
      },
    },
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
      valor: true,
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
      {/* Resumen de filtros arriba */}
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
              <Chip label={`Actividades: ${actividadEconomica.join(', ')}`} size="small" />
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
