// src/pages/PriorizacionForm.tsx
import * as React from "react";
import { Box, Paper } from "@mui/material";
import {
  DataGrid,
  GridColDef,
  GridToolbarColumnsButton,
  GridToolbarContainer,
  GridToolbarDensitySelector,
  GridToolbarExport,
  GridToolbarQuickFilter,
} from "@mui/x-data-grid";
import { esES } from "@mui/x-data-grid/locales";

// Helper para ordenar mm/aa
const periodoToNumber = (mmAA: string) => {
  const [mm, aa] = mmAA.split("/").map((v) => parseInt(v, 10));
  const year = 2000 + (isNaN(aa) ? 0 : aa);
  const month = isNaN(mm) ? 1 : mm;
  return year * 100 + month;
};

// Formateador numérico
const fmt = new Intl.NumberFormat("es-CO", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const rows = [
  { id: 1, categoria: "Fiscalización Masiva", ruc: "8-123-456", nombre: "Individual", periodos: "06/25", valor: 236.32 },
  { id: 2, categoria: "Grandes Contribuyentes", ruc: "RUC-998877", nombre: "Comercial ABC S.A.", periodos: "05/25", valor: 654.32 },
  { id: 3, categoria: "Auditoría Sectorial", ruc: "RUC-555888", nombre: "Servicios XYZ", periodos: "04/25", valor: 158.32 },
  { id: 4, categoria: "Fiscalización Masiva", ruc: "RUC-111222", nombre: "Individual", periodos: "03/25", valor: 695.32 },
  { id: 5, categoria: "Grandes Contribuyentes", ruc: "RUC-222333", nombre: "Inversiones Delta, S.A.", periodos: "02/25", valor: 657.32 },
  { id: 6, categoria: "Auditoría Sectorial", ruc: "RUC-333444", nombre: "AgroPanamá Ltda.", periodos: "01/25", valor: 1025.32 },
  { id: 7, categoria: "Fiscalización Masiva", ruc: "8-654-321", nombre: "Individual", periodos: "12/24", valor: 2365.32 },
  { id: 8, categoria: "Grandes Contribuyentes", ruc: "RUC-444555", nombre: "Tecno Global S.A.", periodos: "11/24", valor: 236.32 },
  { id: 9, categoria: "Auditoría Sectorial", ruc: "RUC-777999", nombre: "Transporte Caribe", periodos: "10/24", valor: 8547.32 },
  { id: 10, categoria: "Fiscalización Masiva", ruc: "RUC-101010", nombre: "Individual", periodos: "09/24", valor: 236.32 },
  { id: 11, categoria: "Grandes Contribuyentes", ruc: "RUC-121212", nombre: "Construcciones PAC, S.A.", periodos: "08/24", valor: 978.32 },
  { id: 12, categoria: "Auditoría Sectorial", ruc: "RUC-131313", nombre: "Textiles del Istmo", periodos: "07/24", valor: 3252.32 },
];

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
    field: "valor", headerName: "Valor", type: "number", flex: 0.8,  minWidth: 140,    sortable: true,
  },
];

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

// Locale en español con placeholder personalizado
const localeText = {
  ...esES.components.MuiDataGrid.defaultProps.localeText,
  toolbarQuickFilterPlaceholder: "Buscar…",
};

export default function PriorizacionForm() {
  const [paginationModel, setPaginationModel] = React.useState({ page: 0, pageSize: 5 });
  const [columnVisibilityModel, setColumnVisibilityModel] = React.useState({
    categoria: true,
    ruc: true,
    nombre: true,
    periodos: true,
    valor: true,
  });

  return (
    <Box component={Paper} sx={{ height: 560, mt: 2 }}>
      <DataGrid
        localeText={localeText}
        rows={rows}
        columns={columns}
        disableRowSelectionOnClick
        slots={{ toolbar: CustomToolbar }}
        slotProps={{ toolbar: { showQuickFilter: true, quickFilterProps: { debounceMs: 400 } } }}
        pagination
        pageSizeOptions={[5, 10, 25, 50]}
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        columnVisibilityModel={columnVisibilityModel}
        onColumnVisibilityModelChange={(m:any) => setColumnVisibilityModel(m)}
        initialState={{
          sorting: { sortModel: [{ field: "periodos", sort: "desc" }] },
        }}
      />
    </Box>
  );
}
