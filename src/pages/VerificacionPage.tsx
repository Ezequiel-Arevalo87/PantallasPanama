// ==========================================
// src/pages/VerificacionPage.tsx
// ==========================================
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

// =======================================================
// Cargar casos desde localStorage
// =======================================================
const loadCasosFromStorage = () => {
  try {
    const raw = localStorage.getItem(CASOS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

// =======================================================
// SEMAFORIZACIÓN DÍA 1 / DÍA 2
// =======================================================
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

// =======================================================
// COMPONENTE PRINCIPAL
// =======================================================
export default function VerificacionPage() {
  const [rows, setRows] = useState(loadCasosFromStorage());

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRow, setDetailRow] = useState<any>(null);

  const [npOpen, setNpOpen] = useState(false);
  const [npRow, setNpRow] = useState<any>(null);

  const [reporteOpen, setReporteOpen] = useState(false);

  useEffect(() => {
    const listener = () => setRows(loadCasosFromStorage());
    window.addEventListener("casosAprobacion:update", listener);
    return () => window.removeEventListener("casosAprobacion:update", listener);
  }, []);

  // =======================================================
  // COLUMNAS DE LA TABLA
  // =======================================================
  const columns: GridColDef[] = [
    {
      field: "semaforo",
      headerName: "Tiempo",
      width: 160,
      renderCell: (params) => (
        <Semaforo fecha={params.row.fechaAsignacionISO} />
      ),
    },
    { field: "ruc", headerName: "RUC", width: 180 },
    { field: "nombre", headerName: "Nombre", width: 220 },
    { field: "metaInconsistencia", headerName: "Inconsistencia", width: 180 },
    { field: "provincia", headerName: "Provincia", width: 160 },
    {
      field: "valor",
      headerName: "Valor",
      width: 180,
      renderCell: (p) =>
        p.row.valor ? `B/. ${Number(p.row.valor).toLocaleString()}` : "—",
    },

    {
      field: "acciones",
      headerName: "Acciones",
      width: 180,
      renderCell: (params) => (
        <Stack direction="row" spacing={1}>
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

  // =======================================================
  // PASAR A APROBACIÓN (CORREGIDO)
  // =======================================================
const enviarAprobacion = () => {
  Swal.fire("Procesado", "Los casos fueron enviados a Aprobación", "success");

  const actualizados = rows.map((r:any) =>
    r.estadoVerif !== "NoProductivo"
      ? { ...r, estadoVerif: "ParaAprobacion" }
      : r
  );

  localStorage.setItem(CASOS_KEY, JSON.stringify(actualizados));
  setRows(actualizados);

  window.dispatchEvent(new Event("casosAprobacion:update"));
};


  // =======================================================
  // MARCAR COMO NO PRODUCTIVO
  // =======================================================
  const marcarNoProductivo = () => {
    if (!npRow) return;

    const nuevos = rows.map((r: any) =>
      r.id === npRow.id ? { ...r, estadoVerif: "NoProductivo" } : r
    );

    localStorage.setItem(CASOS_KEY, JSON.stringify(nuevos));
    setRows(nuevos);

    Swal.fire(
      "Marcado como No Productivo",
      "El caso ya no podrá enviarse a Aprobación",
      "success"
    );
  };

  // =======================================================
  // TOOLBAR PERSONALIZADO
  // =======================================================
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

  // =======================================================
  // RENDER
  // =======================================================
  return (
    <>
      <Box sx={{ width: "100%" }}>
        <DataGrid
          rows={rows}
          columns={columns}
          getRowId={(r) => r.id}
          sx={{
            height: 520,
            width: "100%",
            backgroundColor: "#fff",
          }}
          checkboxSelection
          disableRowSelectionOnClick
          isRowSelectable={(p) => p.row.estadoVerif !== "NoProductivo"}
          slots={{ toolbar: CustomToolbar }}
        />
      </Box>

      <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
        <Button variant="contained" color="success" onClick={enviarAprobacion}>
          ENVIAR PARA APROBACIÓN
        </Button>

        <Button variant="outlined" onClick={() => setReporteOpen(true)}>
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
