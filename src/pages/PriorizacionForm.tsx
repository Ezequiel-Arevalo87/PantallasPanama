import * as React from "react";
import { Box, Paper, Button, Stack, Typography } from "@mui/material";
import {
  DataGrid,
  GridColDef,
  GridToolbarColumnsButton,
  GridToolbarContainer,
  GridToolbarDensitySelector,
  GridToolbarExport,
  GridToolbarQuickFilter,
  useGridApiRef,
  GridRowSelectionModel,
  GridColumnVisibilityModel,
} from "@mui/x-data-grid";
import { esES } from "@mui/x-data-grid/locales";
import * as XLSX from "xlsx";

const periodoToNumber = (mmAA: string) => {
  const [mm, aa] = mmAA.split("/").map((v) => parseInt(v, 10));
  const year = 2000 + (isNaN(aa) ? 0 : aa);
  const month = isNaN(mm) ? 1 : mm;
  return year * 100 + month;
};

const fmt = new Intl.NumberFormat("es-CO", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

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

const toNumber = (v: any): number => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
};

export default function PriorizacionForm() {
  const apiRef:any = useGridApiRef();

  const rows = React.useMemo(() => {
    return (rawRows ?? []).map((r, idx) => ({
      ...r,
      id: r.id ?? idx + 1,
      valor: toNumber(r.valor ?? r.monto ?? r.total),
    }));
  }, []);

  const columns: GridColDef<Row>[] = [
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
      headerName: "Valor",
      flex: 0.8,
      minWidth: 140,
      sortable: true,
      valueFormatter: (params: any) => {
        const num = typeof params === "number" ? params : toNumber(params);
        return Number.isFinite(num) ? fmt.format(num) : "";
      },
    },
  ];

  const localeText = {
    ...esES.components.MuiDataGrid.defaultProps.localeText,
    toolbarQuickFilterPlaceholder: "Buscar…",
  };

  const [paginationModel, setPaginationModel] = React.useState({ page: 0, pageSize: 5 });
  const [columnVisibilityModel, setColumnVisibilityModel] = React.useState<GridColumnVisibilityModel>({
    categoria: true,
    ruc: true,
    nombre: true,
    periodos: true,
    valor: true,
  });
  const [selectedCount, setSelectedCount] = React.useState(0);

  const selectAll = () => {
    if (apiRef.current) {
      const allIds:any = rows.map((r:any) => r.id);
      apiRef.current.setRowSelectionModel(allIds);
    }
  };

  const clearSelection = () => {
    if (apiRef.current) {
      apiRef.current.setRowSelectionModel([]);
    }
  };

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

function CustomToolbar({ selectedCount, handleAprobar, selectAll, clearSelection }: any) {
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
    <Box component={Paper} sx={{ height: 400, mt: 2, pb: 1 }}>
      <Box sx={{ px: 2, pt: 1 }}>
        <Typography variant="body2">
          Seleccionados: <b>{selectedCount}</b>
        </Typography>
      </Box>

      <DataGrid
        apiRef={apiRef}
        localeText={localeText}
        rows={rows}
        columns={columns}
        checkboxSelection
        disableRowSelectionOnClick
        onRowSelectionModelChange={(m:any) => setSelectedCount(m.length)}
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
    <br />
          <Button size="small" variant="contained" color="success" onClick={handleAprobar}>
            Aprobar
          </Button>
    </Box>
  );
}
