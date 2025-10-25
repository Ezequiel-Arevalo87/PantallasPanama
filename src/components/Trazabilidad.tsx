// src/components/Trazabilidad.tsx
import * as React from "react";
import { Chip, Box } from "@mui/material";
import {
  DataGrid,
  type GridColDef,
  GridToolbarContainer,
  GridToolbarColumnsButton,
  GridToolbarDensitySelector,
  GridToolbarExport,
  GridToolbarQuickFilter,
} from "@mui/x-data-grid";

export type EstadoAprobacion = "APROBADO" | "RECHAZADO" | "PENDIENTE" | "ASIGNADO";

export type TrazaItem = {
  id: string | number;
  fechaISO: string;      // ISO string
  actor: string;         // quién aprobó o ejecutó
  accion: string;        // p.ej. "Aprobación", "Revisión", "Asignación"
  estado: EstadoAprobacion;
  detalle?: string;      // opcional, comentarios
};

type Props = {
  rows: TrazaItem[];
  height?: number | string;
};

function Toolbar() {
  return (
    <GridToolbarContainer>
      <GridToolbarColumnsButton />
      <GridToolbarDensitySelector />
      <GridToolbarExport />
      <span style={{ flex: 1 }} />
      <GridToolbarQuickFilter />
    </GridToolbarContainer>
  );
}

const EstadoChip: React.FC<{ value: EstadoAprobacion }> = ({ value }) => {
  const color =
    value === "APROBADO"
      ? "success"
      : value === "RECHAZADO"
      ? "error"
      : value === "ASIGNADO"
      ? "info"
      : "warning";
  return <Chip size="small" label={value} color={color as any} />;
};

export const Trazabilidad: React.FC<Props> = ({ rows, height = 480 }) => {
  const columns = React.useMemo<GridColDef<TrazaItem>[]>(
    () => [
      {
        field: "fechaISO",
        headerName: "Fecha",
        minWidth: 160,
        valueFormatter: ({ value }) =>
          new Date(value as string).toLocaleString(),
      },
      { field: "actor", headerName: "Actor", minWidth: 180, flex: 1 },
      { field: "accion", headerName: "Acción", minWidth: 160 },
      {
        field: "estado",
        headerName: "Estado",
        minWidth: 140,
        renderCell: (params) => <EstadoChip value={params.value as EstadoAprobacion} />,
      },
    
    ],
    []
  );

  return (
    <Box sx={{ height, width: "100%" }}>
      <DataGrid
        rows={rows}
        columns={columns}
        disableRowSelectionOnClick
        getRowId={(r) => r.id}
        slots={{ toolbar: Toolbar }}
        initialState={{
          pagination: { paginationModel: { page: 0, pageSize: 10 } },
          sorting: { sortModel: [{ field: "fechaISO", sort: "desc" }] },
        }}
        pageSizeOptions={[5, 10, 25, 50]}
      />
    </Box>
  );
};

export default Trazabilidad;
