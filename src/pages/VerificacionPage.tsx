import React, { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Button,
  Typography,
  Stack,
  IconButton,
  Chip,
} from "@mui/material";

import {
  DataGrid,
  type GridColDef,
  GridToolbarContainer,
  GridToolbarColumnsButton,
  GridToolbarDensitySelector,
  GridToolbarExport,
  GridToolbarQuickFilter,
} from "@mui/x-data-grid";

import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import BlockIcon from "@mui/icons-material/Block";

import dayjs from "dayjs";
import Swal from "sweetalert2";

import { CASOS_KEY } from "../lib/aprobacionesStorage";

import DetalleCasoModal from "../components/DetalleCasoModal";
import NoProductivoModal from "../components/NoProductivoModal";
import ReporteVerificacionModal from "../components/ReporteVerificacionModal";

// ============================================================================
// UTIL: Cargar casos enviados desde SELECTOR
// ============================================================================
const loadCasosFromStorage = () => {
  try {
    const raw = localStorage.getItem(CASOS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

// ============================================================================
// SEMAFORIZACIÓN DÍA 1 / DÍA 2
// ============================================================================
function calcularDias(fechaISO: string) {
  return dayjs().diff(dayjs(fechaISO), "day");
}

function Semaforo({ fecha }: { fecha: string }) {
  const dias = calcularDias(fecha);

  return (
    <Chip
      size="small"
      color={dias <= 1 ? "success" : "error"}
      label={dias <= 1 ? "Día 1" : "Día 2"}
    />
  );
}

// ============================================================================
// PÁGINA PRINCIPAL
// ============================================================================
export default function VerificacionPage() {
  // === Datos reales desde selector ===
  const [rows, setRows] = useState(loadCasosFromStorage());

  // === Estados para modales ===
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRow, setDetailRow] = useState<any>(null);

  const [npOpen, setNpOpen] = useState(false);
  const [npRow, setNpRow] = useState<any>(null);

  const [reporteOpen, setReporteOpen] = useState(false);

  // === Actualizar cuando SELECTOR manda casos ===
  useEffect(() => {
    const listener = () => setRows(loadCasosFromStorage());
    window.addEventListener("casosAprobacion:update", listener);
    return () => window.removeEventListener("casosAprobacion:update", listener);
  }, []);

  // ========================================================================
  // COLUMNAS DEL GRID
  // ========================================================================
  const columns: GridColDef[] = [
    {
      field: "semaforo",
      headerName: "Tiempo",
      width: 200,
      renderCell: (params) => (
        <Semaforo fecha={params.row.fechaAsignacionISO} />
      ),
    },
    { field: "ruc", headerName: "RUC", width: 300 },
    { field: "nombre", headerName: "Nombre", width: 220 },
    { field: "metaInconsistencia", headerName: "Inconsistencia", width: 160 },
    { field: "provincia", headerName: "Provincia", width: 300 },
    {
      field: "valor",
      headerName: "Valor",
      width: 300,
      renderCell: (p) =>
        p.row.valor ? `B/. ${Number(p.row.valor).toLocaleString()}` : "—",
    },

    // === ACCIONES ===
    {
      field: "acciones",
      headerName: "Acciones",
      width: 200,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={1}>
          {/* DETALLE */}
          <IconButton
            size="small"
            color="info"
            onClick={() => {
              setDetailRow(params.row);
              setDetailOpen(true);
            }}
          >
            <InfoOutlinedIcon fontSize="small" />
          </IconButton>

          {/* NO PRODUCTIVO */}
          <IconButton
            size="small"
            color="warning"
            onClick={() => {
              setNpRow(params.row);
              setNpOpen(true);
            }}
          >
            <BlockIcon fontSize="small" />
          </IconButton>
        </Stack>
      ),
    },
  ];

  // ========================================================================
  // PASAR A APROBACIÓN
  // ========================================================================
  const enviarAprobacion = () => {
    Swal.fire("Procesado", "Los casos fueron enviados a Aprobación", "success");

    const actualizados = rows.map((r: any) =>
      r.estadoVerif === "Pendiente" || !r.estadoVerif
        ? { ...r, estadoVerif: "EnviadoAprobacion" }
        : r
    );

    localStorage.setItem(CASOS_KEY, JSON.stringify(actualizados));
    setRows(actualizados);
    window.dispatchEvent(new Event("casosAprobacion:update"));
  };

  // ========================================================================
  // MARCAR NO PRODUCTIVO
  // ========================================================================
  const marcarNoProductivo = () => {
    if (!npRow) return;

    const nuevos = rows.map((r: any) =>
      r.id === npRow.id
        ? { ...r, estadoVerif: "NoProductivo" }
        : r
    );

    localStorage.setItem(CASOS_KEY, JSON.stringify(nuevos));
    setRows(nuevos);

    Swal.fire(
      "Marcado como No Productivo",
      "El caso ya no podrá enviarse a Aprobación",
      "success"
    );
  };

  // ========================================================================
  // TOOLBAR
  // ========================================================================
  function CustomToolbar() {
    return (
      <GridToolbarContainer sx={{ p: 1, gap: 1 }}>
        <GridToolbarColumnsButton />
        <GridToolbarDensitySelector />
        <GridToolbarExport />
        <Box sx={{ flex: 1 }} />
        <GridToolbarQuickFilter />
      </GridToolbarContainer>
    );
  }

  // ========================================================================
  // RENDER
  // ========================================================================
  return (
    <>
      <Box sx={{ width: "100%" }}>
        <DataGrid
          rows={rows}
          columns={columns}
          getRowId={(r) => r.id}
          autoHeight={false}
          sx={{
            height: 520,
            width: "100%",
            borderColor: "#e0e0e0",
            backgroundColor: "#fff",
          }}
          checkboxSelection
          disableRowSelectionOnClick
          isRowSelectable={(p) => p.row.estadoVerif !== "NoProductivo"}
          slots={{ toolbar: CustomToolbar }}
        />
      </Box>

      {/* BOTONES */}
      <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
        <Button
          variant="contained"
          color="success"
          onClick={enviarAprobacion}
          sx={{ textTransform: "none", fontWeight: "bold" }}
        >
          ENVIAR PARA APROBACIÓN
        </Button>

        <Button
          variant="outlined"
          onClick={() => setReporteOpen(true)}
          sx={{ textTransform: "none", fontWeight: "bold" }}
        >
          REPORTE VERIFICACIÓN
        </Button>
      </Stack>

      {/* MODALES */}
      <DetalleCasoModal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        caso={detailRow}
      />

      <NoProductivoModal
        open={npOpen}
        onClose={() => setNpOpen(false)}
        selected={[npRow?.id]}
        onSave={marcarNoProductivo}
      />

      <ReporteVerificacionModal
        open={reporteOpen}
        onClose={() => setReporteOpen(false)}
      />
    </>
  );
}
