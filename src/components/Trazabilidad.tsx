// src/components/Trazabilidad.tsx
import * as React from "react";
import { Chip, Box, Typography } from "@mui/material";
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

/** ---------- Toolbar ---------- */
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

/** ---------- Helpers fecha/periodo ---------- */
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

/** ---------- Random name determinístico a partir de rows ---------- */
function hashSeed(str: string) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function rngFromSeed(seed: number) {
  // xorshift32 simple
  let x = seed || 1;
  return () => {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return ((x >>> 0) / 0xffffffff);
  };
}
function pick<T>(arr: T[], r: () => number) {
  return arr[Math.floor(r() * arr.length)];
}
function buildDisplayName(rows: TrazaItem[]): string {
  const base = rows.map(r => r.id).join("|"); // estable para un mismo dataset
  const rnd = rngFromSeed(hashSeed(base));

  const asPersona = rnd() < 0.5; // mitad persona / mitad empresa
  if (asPersona) {
    const nombres = ["María", "Juan", "Luis", "Ana", "Carlos", "Diana", "Pedro", "Paola", "Andrés", "Sofía", "Gabriel", "Valeria"];
    const apellidos = ["Pérez", "Rodríguez", "González", "García", "Martínez", "Fernández", "López", "Sánchez", "Ramírez", "Castillo", "Moreno", "Torres"];
    return `${pick(nombres, rnd)} ${pick(apellidos, rnd)}`;
  } else {
    const prefijos = ["Grupo", "Inversiones", "Servicios", "Constructora", "Comercial", "Tecnologías", "Industrias", "Distribuidora", "Consultores", "Alimentos"];
    const nucleos = ["Istmo", "Panamá", "Canal", "Pacífico", "Atlas", "Global", "Centenario", "Horizonte", "Delta", "Sigma"];
    const sufijos = ["S.A.", "S.R.L.", "Corp.", "Holdings", "SAS"];
    return `${pick(prefijos, rnd)} ${pick(nucleos, rnd)} ${pick(sufijos, rnd)}`;
  }
}

export const Trazabilidad: React.FC<Props> = ({ rows, height = 480 }) => {
  // ✅ Nombre mostrado arriba (estable para el mismo set de filas)
  const displayName = React.useMemo(() => (rows?.length ? buildDisplayName(rows) : ""), [rows]);

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
        valueGetter: (params: any) => (params?.row as TrazaItem)?.fechaISO ?? "",
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
      { field: "actor", headerName: "Responsable", minWidth: 180, flex: 1 },
      { field: "accion", headerName: "Acción", minWidth: 160 },
      {
        field: "estado",
        headerName: "Estado",
        minWidth: 140,
        renderCell: (params) => (
          <EstadoChip value={params.value as EstadoAprobacion} />
        ),
      },
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
      {/* Encabezado con nombre aleatorio */}
      {displayName ? (
        <Typography
          variant="subtitle1"
          sx={{ mb: 1.5, fontWeight: 700, color: "text.primary" }}
        >
          {displayName}
        </Typography>
      ) : null}

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
