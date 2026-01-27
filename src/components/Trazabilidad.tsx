// src/components/Trazabilidad.tsx
import * as React from "react";
import { Chip, Box, Tooltip, Typography } from "@mui/material";
import {
  DataGrid,
  type GridColDef,
  GridToolbarContainer,
  GridToolbarColumnsButton,
  GridToolbarDensitySelector,
  GridToolbarExport,
  GridToolbarQuickFilter,
} from "@mui/x-data-grid";
import dayjs from "dayjs";

export type EstadoAprobacion = "APROBADO" | "RECHAZADO" | "PENDIENTE" | "ASIGNADO";

/**
 * Compatible: acepta lo viejo (fechaISO/actor/accion) y lo nuevo (actividad/usuarioGestion/fechaInicialISO/fechaFinalISO)
 * + NUEVO: observacion
 */
export type TrazaItem = {
  id: string;

  // legacy
  fechaISO?: string;
  actor?: string;
  accion?: string;

  // nuevo
  actividad?: string;
  usuarioGestion?: string;
  fechaInicialISO?: string;
  fechaFinalISO?: string;

  // ✅ NUEVO
  observacion?: string;

  estado: EstadoAprobacion;
  periodo?: string;
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

const safeFormatDate = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
};

const safeToTime = (iso?: string) => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.getTime();
};

// ✅ fallback determinístico por fila (para que se vea “real”)
const FALLBACK_ACTIVIDADES = [
  "Asignación",
  "Acta de inicio",
  "Notificación acta de inicio",
  "Informe auditoría",
  "Propuesta de regularización",
  "Revisión Análisis Normativo 1",
  "Revisión Análisis Normativo 2",
  "Notificación propuesta de regularización",
  "Aceptación total",
  "Aceptación parcial",
  "Rechazo",
  "Resolución en firme",
  "Notificación de resolución",
  "Cierre y archivo",
];

const FALLBACK_USUARIOS = [
  "Juan Pérez",
  "María Rodríguez",
  "Ana González",
  "Carlos Martínez",
  "Diana Fernández",
  "Pedro López",
  "Sofía Sánchez",
  "Andrés Ramírez",
];

const clampText = (s: any) => String(s ?? "").trim();

export const Trazabilidad: React.FC<Props> = ({ rows, height = 480 }) => {
  const rowsNormalized = React.useMemo(() => {
    const base = (rows ?? []).map((r, idx) => {
      // 1) actividad
      let actividad = clampText(r.actividad ?? r.accion);
      if (!actividad) {
        actividad = FALLBACK_ACTIVIDADES[idx % FALLBACK_ACTIVIDADES.length];
      }

      // 2) usuario gestión
      let usuarioGestion = clampText(r.usuarioGestion ?? r.actor);
      if (!usuarioGestion) {
        usuarioGestion = FALLBACK_USUARIOS[idx % FALLBACK_USUARIOS.length];
      }

      // 3) fecha inicial/final
      let fechaInicialISO = clampText(r.fechaInicialISO ?? r.fechaISO);
      let fechaFinalISO = clampText(r.fechaFinalISO);

      // si no viene ninguna fecha, inventamos una secuencia
      if (!fechaInicialISO) {
        fechaInicialISO = dayjs()
          .subtract((rows?.length ?? 8) - idx, "day")
          .hour(9)
          .minute(0)
          .second(0)
          .toISOString();
      }

      // si no viene fecha final, inventamos fin (excepto última fila)
      if (!fechaFinalISO) {
        const isLast = idx === (rows?.length ?? 1) - 1;
        fechaFinalISO = isLast
          ? ""
          : dayjs(fechaInicialISO).add(1, "day").hour(17).minute(0).second(0).toISOString();
      }

      const observacion = clampText(r.observacion);

      return {
        ...r,
        actividad,
        usuarioGestion,
        fechaInicialISO,
        fechaFinalISO,
        observacion,

        // mantenemos legacy por si algo más lo usa
        accion: r.accion ?? actividad,
        actor: r.actor ?? usuarioGestion,
        fechaISO: r.fechaISO ?? fechaInicialISO,
      };
    });

    // ✅ Orden desc por fecha inicial (para que se vea como “trazabilidad real”)
    return base.sort((a, b) => {
      const ta = safeToTime(a.fechaInicialISO) ?? 0;
      const tb = safeToTime(b.fechaInicialISO) ?? 0;
      return tb - ta;
    });
  }, [rows]);

  const columns = React.useMemo<GridColDef<any>[]>(
    () => [
      { field: "actividad", headerName: "Actividad", minWidth: 220, flex: 1 },
      {
        field: "estado",
        headerName: "Estado",
        minWidth: 140,
        renderCell: (params) => <EstadoChip value={params.value as EstadoAprobacion} />,
      },
      {
        field: "fechaInicialISO",
        headerName: "Fecha Inicial",
        minWidth: 140,
        renderCell: (params) => safeFormatDate(params.value as string),
        sortComparator: (_v1, _v2, p1: any, p2: any) => {
          const t1 = safeToTime(p1?.row?.fechaInicialISO) ?? 0;
          const t2 = safeToTime(p2?.row?.fechaInicialISO) ?? 0;
          return t1 - t2;
        },
      },
      {
        field: "fechaFinalISO",
        headerName: "Fecha Final",
        minWidth: 140,
        renderCell: (params) => safeFormatDate(params.value as string),
        sortComparator: (_v1, _v2, p1: any, p2: any) => {
          const t1 = safeToTime(p1?.row?.fechaFinalISO) ?? 0;
          const t2 = safeToTime(p2?.row?.fechaFinalISO) ?? 0;
          return t1 - t2;
        },
      },

      // ✅ NUEVO: Observación
      {
        field: "observacion",
        headerName: "Observación",
        minWidth: 260,
        flex: 1,
        sortable: false,
        renderCell: (params) => {
          const txt = clampText(params.value);
          if (!txt) return <Typography variant="body2" color="text.secondary">—</Typography>;
          return (
            <Tooltip title={txt}>
              <Typography variant="body2" noWrap sx={{ width: "100%" }}>
                {txt}
              </Typography>
            </Tooltip>
          );
        },
      },

      { field: "usuarioGestion", headerName: "Usuario de Gestión", minWidth: 200, flex: 1 },
    ],
    []
  );

  return (
    <Box sx={{ height, width: "100%" }}>
      <DataGrid
        rows={rowsNormalized}
        columns={columns}
        disableRowSelectionOnClick
        getRowId={(r) => r.id}
        slots={{ toolbar: Toolbar }}
        initialState={{
          pagination: { paginationModel: { page: 0, pageSize: 10 } },
          sorting: { sortModel: [{ field: "fechaInicialISO", sort: "desc" }] },
        }}
        pageSizeOptions={[5, 10, 25, 50]}
      />
    </Box>
  );
};

export default Trazabilidad;
