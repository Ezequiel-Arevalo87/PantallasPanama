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
  id: string;
  fechaISO: string; // ISO string (ej: "2025-10-25T14:30:00.000Z")
  actor: string;
  accion: string;
  estado: EstadoAprobacion;
  periodo?: string; // opcional; si no viene lo calculamos
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

// ---- Helpers ----
const safeFormatDateTime = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(d);
};

const periodoFromISO = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${mm}/${yyyy}`;
};

export const Trazabilidad: React.FC<Props> = ({ rows, height = 480 }) => {
  // ✅ Pre-calcula "periodo" en los datos (evita valueGetter)
  const rowsWithPeriodo = React.useMemo(
    () =>
      (rows ?? []).map((r) => ({
        ...r,
        periodo: r.periodo ?? periodoFromISO(r.fechaISO),
      })),
    [rows]
  );

  const columns = React.useMemo<GridColDef<TrazaItem>[]>(
    () => [
   {
  field: "fechaISO",
  headerName: "Fecha",
  minWidth: 170,
  // (opcional) expón el valor para ordenar/filtrar
  valueGetter: (params : any) => (params?.row as TrazaItem)?.fechaISO ?? "",
 renderCell: (params) => {
  const iso = (params?.row as TrazaItem)?.fechaISO;
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
},

},

      { field: "actor", headerName: "Actor", minWidth: 180, flex: 1 },
      { field: "accion", headerName: "Acción", minWidth: 160 },
      {
        field: "estado",
        headerName: "Estado",
        minWidth: 140,
        renderCell: (params) => (
          <EstadoChip value={params.value as EstadoAprobacion} />
        ),
      },
      // 👇 ahora es un campo normal (ya viene en cada fila)
      {
        field: "periodo",
        headerName: "Periodo",
        minWidth: 120,
      },
    ],
    []
  );

  return (
    <Box sx={{ height, width: "100%" }}>
      <DataGrid
        rows={rowsWithPeriodo}
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
