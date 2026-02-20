// src/pages/ParametrizacionAlertas.tsx
import React, { useMemo, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Stack,
  Button,
  TextField,
  MenuItem,
  Chip,
  Tooltip,
  Divider,
} from "@mui/material";
import {
  DataGrid,
  GridColDef,
  GridRowModel,
  GridToolbar,
} from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import SaveIcon from "@mui/icons-material/Save";

import {
  ACTIVIDADES_BASE,
  type AlertaParam,
  loadParamAlertas,
  saveParamAlertas,
  resetParamAlertas,
} from "../services/mockParamAlertas";

type FrecuenciaCorreo = "Unica" | "Diaria" | "Semanal";
const TODAS = "TODAS";

function validateRow(r: AlertaParam): string | null {
  const t = r.totalDiasPermitidos;

  const ok =
    t > 0 &&
    r.verdeDesde >= 1 &&
    r.verdeHasta <= t &&
    r.amarilloDesde >= 1 &&
    r.amarilloHasta <= t &&
    r.rojoDesde >= 1 &&
    r.rojoHasta <= t &&
    r.verdeDesde <= r.verdeHasta &&
    r.amarilloDesde <= r.amarilloHasta &&
    r.rojoDesde <= r.rojoHasta;

  if (!ok) return "Rangos inválidos vs Total Días Permitidos.";

  // recomendado: no solapar
  if (!(r.verdeHasta < r.amarilloDesde && r.amarilloHasta < r.rojoDesde)) {
    return "Recomendado: Verde < Amarillo < Rojo (sin solaparse).";
  }

  return null;
}

export default function ParametrizacionAlertas() {
  const [rows, setRows] = useState<AlertaParam[]>(() => loadParamAlertas());
  const [fActividad, setFActividad] = useState<string>(TODAS);
  const [fProducto, setFProducto] = useState<string>(TODAS);

  const actividades = useMemo(() => {
    const set = new Set(rows.map((r) => r.actividad));
    return [TODAS, ...Array.from(set)];
  }, [rows]);

  const productos = useMemo(() => {
    const set = new Set(rows.map((r) => r.producto));
    return [TODAS, ...Array.from(set)];
  }, [rows]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const okA = fActividad === TODAS ? true : r.actividad === fActividad;
      const okP = fProducto === TODAS ? true : r.producto === fProducto;
      return okA && okP;
    });
  }, [rows, fActividad, fProducto]);

  const columns: GridColDef[] = [
    // ==== Identidad (pinned mentalmente: más anchas) ====
    {
      field: "actividad",
      headerName: "Actividad",
      width: 260,
      editable: true,
    },
    {
      field: "producto",
      headerName: "Producto",
      width: 180,
      editable: true,
    },
    {
      field: "rolResponsable",
      headerName: "Rol Responsable",
      width: 180,
      editable: true,
    },

    // ==== Plazos ====
    {
      field: "totalDiasPermitidos",
      headerName: "Total días",
      type: "number",
      width: 110,
      editable: true,
    },

    // ==== Verde ====
    { field: "verdeDesde", headerName: "Verde desde", type: "number", width: 120, editable: true },
    { field: "verdeHasta", headerName: "Verde hasta", type: "number", width: 120, editable: true },

    // ==== Amarillo ====
    { field: "amarilloDesde", headerName: "Amarillo desde", type: "number", width: 130, editable: true },
    { field: "amarilloHasta", headerName: "Amarillo hasta", type: "number", width: 130, editable: true },

    // ==== Rojo ====
    { field: "rojoDesde", headerName: "Rojo desde", type: "number", width: 120, editable: true },
    { field: "rojoHasta", headerName: "Rojo hasta", type: "number", width: 120, editable: true },

    // ==== Escalamientos ====
    { field: "escalamientoAmarilloRol1", headerName: "Esc. Amarillo (Rol 1)", width: 200, editable: true },
    { field: "escalamientoRojoRol1", headerName: "Esc. Rojo (Rol 1)", width: 180, editable: true },
    { field: "escalamientoRojoRol2", headerName: "Esc. Rojo (Rol 2)", width: 180, editable: true },
    { field: "escalamientoRojoRol3", headerName: "Esc. Rojo (Rol 3)", width: 180, editable: true },

    // ==== Canales y frecuencia (con select) ====
    {
      field: "canalEnvioHome",
      headerName: "Canal Home",
      type: "boolean",
      width: 120,
      editable: true,
    },
    {
      field: "canalEnvioCorreo",
      headerName: "Canal Correo",
      type: "boolean",
      width: 130,
      editable: true,
    },
    {
      field: "frecuenciaCorreo",
      headerName: "Frecuencia",
      width: 130,
      editable: true,
      type: "singleSelect",
      valueOptions: ["Unica", "Diaria", "Semanal"] as FrecuenciaCorreo[],
    },
    {
      field: "generaIndicadorConsolidado",
      headerName: "Indicador",
      type: "boolean",
      width: 110,
      editable: true,
    },

    // ==== Observaciones ====
    { field: "observaciones", headerName: "Observaciones", width: 260, editable: true },

    // ==== Semáforo visual (no editable) ====
    {
      field: "_semaforo",
      headerName: "Rangos",
      width: 260,
      sortable: false,
      filterable: false,
      renderCell: (p) => {
        const r = p.row as AlertaParam;
        const warn = validateRow(r);

        return (
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip size="small" label={`V ${r.verdeDesde}-${r.verdeHasta}`} />
            <Chip size="small" label={`A ${r.amarilloDesde}-${r.amarilloHasta}`} />
            <Chip size="small" label={`R ${r.rojoDesde}-${r.rojoHasta}`} />
            {warn ? (
              <Tooltip title={warn}>
                <Chip size="small" color="warning" label="!" />
              </Tooltip>
            ) : null}
          </Stack>
        );
      },
    },
  ];

  const handleSave = () => {
    saveParamAlertas(rows);
    alert("Parametrización guardada.");
  };

  const handleReset = () => {
    const seed = resetParamAlertas();
    setRows(seed);
    setFActividad(TODAS);
    setFProducto(TODAS);
  };

  const handleAdd = () => {
    const base = ACTIVIDADES_BASE[0];

    const newRow: AlertaParam = {
      id: `ALERTA_${Math.random().toString(16).slice(2)}_${Date.now()}`,

      actividad: base?.actividad ?? "Nueva Actividad",
      producto: base?.producto ?? "Producto",
      rolResponsable: base?.rol ?? "Auditor",

      totalDiasPermitidos: 10,

      verdeDesde: 1,
      verdeHasta: 6,
      amarilloDesde: 7,
      amarilloHasta: 8,
      rojoDesde: 9,
      rojoHasta: 10,

      escalamientoAmarilloRol1: "Supervisor",
      escalamientoRojoRol1: "Jefe de Seccion",
      escalamientoRojoRol2: "Direccion",
      escalamientoRojoRol3: "",

      canalEnvioHome: true,
      canalEnvioCorreo: true,
      frecuenciaCorreo: "Diaria",

      generaIndicadorConsolidado: true,
      observaciones: "Nueva regla",
    };

    setRows((prev) => [newRow, ...prev]);
  };

  // ✅ Edición real: DataGrid aplica el update y tú lo guardas en state
  const processRowUpdate = (newRow: GridRowModel, oldRow: GridRowModel) => {
    const updated = newRow as AlertaParam;

    // Validación suave: no bloquea, solo advierte en chip, pero puedes bloquear si quieres
    // si (validateRow(updated) && validateRow(updated) !== "Recomendado...") throw new Error("Rangos inválidos");

    setRows((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    return updated;
  };

  const onProcessRowUpdateError = (err: any) => {
    console.error(err);
    alert(err?.message ?? "No se pudo actualizar la fila.");
  };

  return (
    <Box p={2}>
      <Typography variant="h5" mb={1}>
        Parametrización • Alertas por Actividad
      </Typography>
      <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
        Edita rangos, plazos, escalamiento y canales. Esto se usa luego para calcular el semáforo y las alertas por actividad.
      </Typography>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          alignItems={{ md: "center" }}
        >
          <TextField
            select
            label="Actividad"
            value={fActividad}
            onChange={(e) => setFActividad(e.target.value)}
            size="small"
            sx={{ minWidth: 260 }}
          >
            {actividades.map((a) => (
              <MenuItem key={a} value={a}>
                {a}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Producto"
            value={fProducto}
            onChange={(e) => setFProducto(e.target.value)}
            size="small"
            sx={{ minWidth: 220 }}
          >
            {productos.map((p) => (
              <MenuItem key={p} value={p}>
                {p}
              </MenuItem>
            ))}
          </TextField>

          <Box flex={1} />

          <Stack direction="row" spacing={1}>
            <Button startIcon={<AddIcon />} variant="contained" onClick={handleAdd}>
              Nueva regla
            </Button>
            <Button
              startIcon={<SaveIcon />}
              variant="outlined"
              color="success"
              onClick={handleSave}
            >
              Guardar
            </Button>
            <Button
              startIcon={<RestartAltIcon />}
              variant="outlined"
              color="warning"
              onClick={handleReset}
            >
              Limpiar
            </Button>
          </Stack>
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          Tip: puedes usar el buscador y filtros del toolbar de la tabla.
        </Typography>
      </Paper>

      <Paper sx={{ height: 640, width: "100%" }}>
        <DataGrid
          rows={filtered}
          columns={columns}
          getRowId={(r) => r.id}
          disableRowSelectionOnClick
          processRowUpdate={processRowUpdate}
          onProcessRowUpdateError={onProcessRowUpdateError}
          slots={{ toolbar: GridToolbar }}
          slotProps={{
            toolbar: {
              showQuickFilter: true,
              quickFilterProps: { debounceMs: 300 },
            },
          }}
          pageSizeOptions={[10, 20, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize: 10, page: 0 } },
          }}
          sx={{
            // ✅ Esto asegura que NO intente encajar columnas; permite scroll horizontal
            "& .MuiDataGrid-virtualScroller": { overflowX: "auto" },
          }}
        />
      </Paper>
    </Box>
  );
}
