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

/** ✅ Nuevo estado para comunicaciones */
export type EstadoComunicacion = "ENVIADO" | "RESPONDIDO";

/**
 * ✅ Modelo de fila para COMUNICACIONES
 * (si hoy tienes otro shape, lo normalizamos abajo)
 */
export type ComunicacionItem = {
  id: string;

  ruc?: string;
  noTramite?: string;

  fechaEnvioISO?: string;
  fechaRespuestaISO?: string;

  origen?: string;
  destino?: string;

  /** (Notificación, correo) */
  asunto?: string;

  mensaje?: string;

  noDocumento?: string;
  nombreDocumento?: string;

  estado: EstadoComunicacion;
};

type Props = {
  rows: ComunicacionItem[];
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

const EstadoChip: React.FC<{ value: EstadoComunicacion }> = ({ value }) => {
  const color = value === "RESPONDIDO" ? "success" : "warning";
  return <Chip size="small" label={value} color={color as any} />;
};

const clampText = (s: any) => String(s ?? "").trim();

const safeFormatDateTime = (iso?: string) => {
  const v = clampText(iso);
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
};

const safeToTime = (iso?: string) => {
  const v = clampText(iso);
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.getTime();
};

// ✅ fallbacks “realistas” por si llega info incompleta (opcional pero útil para mock)
const FALLBACK_ASUNTOS = ["Notificación", "Correo"];
const FALLBACK_ORIGEN = ["DGI", "Fiscalización", "Gestión", "Sistema"];
const FALLBACK_DESTINO = ["Contribuyente", "Representante", "Apoderado", "Correo registrado"];

export const Trazabilidad: React.FC<Props> = ({ rows, height = 480 }) => {
 const rowsNormalized = React.useMemo(() => {
  const input = rows ?? [];

  const base = input.map((r, idx) => {
    // helpers
    const pad = (n: number, len = 6) => String(n).padStart(len, "0");

    // ✅ RUC (fallback)
    let ruc = clampText((r as any).ruc);
    if (!ruc) {
      // formato "8-765-1234" (ejemplo realista)
      const a = 1 + (idx % 9);
      const b = 100 + ((idx * 37) % 900);
      const c = 1000 + ((idx * 53) % 9000);
      ruc = `${a}-${b}-${c}`;
    }

    // ✅ No Trámite (fallback)
    let noTramite = clampText((r as any).noTramite);
    if (!noTramite) {
      noTramite = `TRM-${dayjs().year()}-${pad(idx + 1, 6)}`;
    }

    // ✅ Fechas
    let fechaEnvioISO = clampText((r as any).fechaEnvioISO);
    let fechaRespuestaISO = clampText((r as any).fechaRespuestaISO);

    if (!fechaEnvioISO) {
      fechaEnvioISO = dayjs()
        .subtract((input.length || 8) - idx, "day")
        .hour(9)
        .minute(15)
        .second(0)
        .toISOString();
    }

    // ✅ Estado (fallback alternado)
    let estado = String((r as any).estado ?? "").toUpperCase();
    if (estado !== "ENVIADO" && estado !== "RESPONDIDO") {
      estado = idx % 3 === 0 ? "RESPONDIDO" : "ENVIADO"; // 1 de cada 3 respondidos
    }

    // si es respondido y no viene fecha respuesta, la inventamos
    if (!fechaRespuestaISO && estado === "RESPONDIDO") {
      fechaRespuestaISO = dayjs(fechaEnvioISO)
        .add(1, "day")
        .hour(16)
        .minute(40)
        .second(0)
        .toISOString();
    }

    // ✅ Origen/Destino/Asunto (fallback)
    let origen = clampText((r as any).origen);
    if (!origen) origen = FALLBACK_ORIGEN[idx % FALLBACK_ORIGEN.length];

    let destino = clampText((r as any).destino);
    if (!destino) destino = FALLBACK_DESTINO[idx % FALLBACK_DESTINO.length];

    let asunto = clampText((r as any).asunto);
    if (!asunto) asunto = FALLBACK_ASUNTOS[idx % FALLBACK_ASUNTOS.length];

    // ✅ Mensaje (fallback)
    let mensaje = clampText((r as any).mensaje);
    if (!mensaje) {
      mensaje =
        asunto.toLowerCase().includes("notifica")
          ? `Se notifica al ${destino.toLowerCase()} el avance del trámite ${noTramite}.`
          : `Se envía correo informativo asociado al trámite ${noTramite}.`;
    }

    // ✅ Documento (fallback)
    let noDocumento = clampText((r as any).noDocumento);
    if (!noDocumento) noDocumento = `DOC-${dayjs(fechaEnvioISO).format("YYYYMMDD")}-${pad(idx + 1, 4)}`;

    let nombreDocumento = clampText((r as any).nombreDocumento);
    if (!nombreDocumento) {
      nombreDocumento =
        asunto.toLowerCase().includes("notifica")
          ? `Notificacion_${noTramite}.pdf`
          : `Correo_${noTramite}.pdf`;
    }

    return {
      ...r,
      ruc,
      noTramite,
      fechaEnvioISO,
      fechaRespuestaISO,
      origen,
      destino,
      asunto,
      mensaje,
      noDocumento,
      nombreDocumento,
      estado, // 👈 importante que quede en la fila
    };
  });

  return base.sort(
    (a, b) => (safeToTime(b.fechaEnvioISO) ?? 0) - (safeToTime(a.fechaEnvioISO) ?? 0)
  );
}, [rows]);

  const columns = React.useMemo<GridColDef<any>[]>(
    () => [
      { field: "ruc", headerName: "RUC", minWidth: 140 },
      { field: "noTramite", headerName: "No Trámite", minWidth: 140 },

      {
        field: "fechaEnvioISO",
        headerName: "Fecha Envío",
        minWidth: 170,
        renderCell: (params) => safeFormatDateTime(params.value as string),
        sortComparator: (_v1, _v2, p1: any, p2: any) => {
          const t1 = safeToTime(p1?.row?.fechaEnvioISO) ?? 0;
          const t2 = safeToTime(p2?.row?.fechaEnvioISO) ?? 0;
          return t1 - t2;
        },
      },
      {
        field: "fechaRespuestaISO",
        headerName: "Fecha Respuesta",
        minWidth: 190,
        renderCell: (params) => safeFormatDateTime(params.value as string) || "—",
        sortComparator: (_v1, _v2, p1: any, p2: any) => {
          const t1 = safeToTime(p1?.row?.fechaRespuestaISO) ?? 0;
          const t2 = safeToTime(p2?.row?.fechaRespuestaISO) ?? 0;
          return t1 - t2;
        },
      },

      { field: "origen", headerName: "Origen", minWidth: 150, flex: 0.8 },
      { field: "destino", headerName: "Destino", minWidth: 170, flex: 0.9 },

      { field: "asunto", headerName: "Asunto", minWidth: 150 },

      {
        field: "mensaje",
        headerName: "Mensaje",
        minWidth: 280,
        flex: 1.2,
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

      { field: "noDocumento", headerName: "No Documento", minWidth: 150 },
      { field: "nombreDocumento", headerName: "Nombre Documento", minWidth: 220, flex: 1 },

      {
        field: "estado",
        headerName: "Estado",
        minWidth: 140,
        renderCell: (params) => <EstadoChip value={params.value as EstadoComunicacion} />,
      },
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
          sorting: { sortModel: [{ field: "fechaEnvioISO", sort: "desc" }] },
        }}
        pageSizeOptions={[5, 10, 25, 50]}
      />
    </Box>
  );
};

export default Trazabilidad;