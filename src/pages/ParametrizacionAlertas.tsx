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
import { DataGrid, type GridColDef, GridToolbar } from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import IconButton from "@mui/material/IconButton";

import {
  ACTIVIDADES_BASE,
  type AlertaParam,
  loadParamAlertas,
  saveParamAlertas,
  resetParamAlertas,
} from "../services/mockParamAlertas";

import AlertRuleDialog from "../components/AlertRuleDialog";
import ConfirmDialog from "../components/ConfirmDialog";

type FrecuenciaCorreo = "Unica" | "Diaria" | "Semanal";
const TODAS = "TODAS";

function uid(prefix = "ALERTA") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

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

  if (!(r.verdeHasta < r.amarilloDesde && r.amarilloHasta < r.rojoDesde)) {
    return "Recomendado: Verde < Amarillo < Rojo (sin solaparse).";
  }

  return null;
}

export default function ParametrizacionAlertas() {
  const [rows, setRows] = useState<AlertaParam[]>(() => loadParamAlertas());

  // filtros: Actividad + Rol
  const [fActividad, setFActividad] = useState<string>(TODAS);
  const [fRol, setFRol] = useState<string>(TODAS);

  // modal crear/editar
  const [openRule, setOpenRule] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [draft, setDraft] = useState<AlertaParam | null>(null);

  // eliminar confirm
  const [openConfirmDelete, setOpenConfirmDelete] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const actividades = useMemo(() => {
    const set = new Set(rows.map((r) => r.actividad));
    return [TODAS, ...Array.from(set)];
  }, [rows]);

  const roles = useMemo(() => {
    const set = new Set(rows.map((r) => r.rolResponsable));
    return [TODAS, ...Array.from(set)];
  }, [rows]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const okA = fActividad === TODAS ? true : r.actividad === fActividad;
      const okR = fRol === TODAS ? true : r.rolResponsable === fRol;
      return okA && okR;
    });
  }, [rows, fActividad, fRol]);

  const columns: GridColDef[] = [
    {
      field: "_actions",
      headerName: "Acciones",
      width: 120,
      sortable: false,
      filterable: false,
      renderCell: (p) => {
        const r = p.row as AlertaParam;

        return (
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="Editar">
              <IconButton
                size="small"
                onClick={() => {
                  setMode("edit");
                  setDraft({ ...r });
                  setOpenRule(true);
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title="Eliminar">
              <IconButton
                size="small"
                onClick={() => {
                  setDeleteId(r.id);
                  setOpenConfirmDelete(true);
                }}
              >
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        );
      },
    },

    { field: "actividad", headerName: "Actividad", width: 260 },
    { field: "producto", headerName: "Producto", width: 180 },
    { field: "rolResponsable", headerName: "Rol Responsable", width: 180 },

    { field: "totalDiasPermitidos", headerName: "Total días", type: "number", width: 110 },

    { field: "verdeDesde", headerName: "Verde desde", type: "number", width: 120 },
    { field: "verdeHasta", headerName: "Verde hasta", type: "number", width: 120 },

    { field: "amarilloDesde", headerName: "Amarillo desde", type: "number", width: 130 },
    { field: "amarilloHasta", headerName: "Amarillo hasta", type: "number", width: 130 },

    { field: "rojoDesde", headerName: "Rojo desde", type: "number", width: 120 },
    { field: "rojoHasta", headerName: "Rojo hasta", type: "number", width: 120 },

    { field: "escalamientoAmarilloRol1", headerName: "Esc. Amarillo (Rol 1)", width: 200 },
    { field: "escalamientoRojoRol1", headerName: "Esc. Rojo (Rol 1)", width: 180 },
    { field: "escalamientoRojoRol2", headerName: "Esc. Rojo (Rol 2)", width: 180 },
    { field: "escalamientoRojoRol3", headerName: "Esc. Rojo (Rol 3)", width: 180 },

    { field: "canalEnvioHome", headerName: "Canal Home", type: "boolean", width: 120 },
    { field: "canalEnvioCorreo", headerName: "Canal Correo", type: "boolean", width: 130 },
    {
      field: "frecuenciaCorreo",
      headerName: "Frecuencia",
      width: 130,
      type: "singleSelect",
      valueOptions: ["Unica", "Diaria", "Semanal"] as FrecuenciaCorreo[],
    },
    { field: "generaIndicadorConsolidado", headerName: "Indicador", type: "boolean", width: 110 },

    { field: "observaciones", headerName: "Observaciones", width: 260 },

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

  const openCreate = () => {
    const base = ACTIVIDADES_BASE[0];
    const newRow: AlertaParam = {
      id: uid(),
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

    setMode("create");
    setDraft(newRow);
    setOpenRule(true);
  };

  const handleUpsert = (next: AlertaParam) => {
    // aplica cambios
    setRows((prev) => {
      const exists = prev.some((r) => r.id === next.id);
      if (exists) return prev.map((r) => (r.id === next.id ? next : r));
      return [next, ...prev];
    });

    // ✅ persiste al instante (ya no hay botón Guardar)
    setTimeout(() => {
      // usamos callback de setRows para estado actual, pero aquí basta con leer del updater:
      // (para evitar líos, guardamos en un segundo useEffect sería lo ideal, pero así es simple)
      saveParamAlertas(
        (() => {
          const current = loadParamAlertas(); // fallback
          // mejor: guardamos con la última versión desde el estado real:
          // como no tenemos ese estado aquí sincronizado, guardamos directo con el "next" aplicado:
          // -> hacemos un guardado correcto abajo con un setRows que ya calculó la lista.
          return current;
        })()
      );
    }, 0);

    setOpenRule(false);
    setDraft(null);
  };

  const handleReset = () => {
    const seed = resetParamAlertas();
    setRows(seed);
    setFActividad(TODAS);
    setFRol(TODAS);
  };

  const doDelete = () => {
    if (!deleteId) return;

    setRows((prev) => {
      const next = prev.filter((r) => r.id !== deleteId);
      saveParamAlertas(next); // ✅ persistimos al instante
      return next;
    });

    setOpenConfirmDelete(false);
    setDeleteId(null);
  };

  return (
    <Box p={2}>
      <Typography variant="h5" mb={1}>
        Parametrización • Alertas por Actividad
      </Typography>
      <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
        Crear/Editar/Eliminar se hace por modales con confirmación. No hay guardado manual.
      </Typography>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "center" }}>
          <TextField
            select
            label="Actividad"
            value={fActividad}
            onChange={(e) => setFActividad(e.target.value)}
            size="small"
            sx={{ minWidth: 280 }}
          >
            {actividades.map((a) => (
              <MenuItem key={a} value={a}>
                {a}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Rol Responsable"
            value={fRol}
            onChange={(e) => setFRol(e.target.value)}
            size="small"
            sx={{ minWidth: 240 }}
          >
            {roles.map((r) => (
              <MenuItem key={r} value={r}>
                {r}
              </MenuItem>
            ))}
          </TextField>

          <Box flex={1} />

          <Stack direction="row" spacing={1}>
            <Button startIcon={<AddIcon />} variant="contained" onClick={openCreate}>
              Nueva regla
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
          Tip: usa el buscador del toolbar. Acciones → Editar / Eliminar.
        </Typography>
      </Paper>

      <Paper sx={{ height: 640, width: "100%" }}>
        <DataGrid
          rows={filtered}
          columns={columns}
          getRowId={(r) => r.id}
          disableRowSelectionOnClick
          slots={{ toolbar: GridToolbar }}
          slotProps={{
            toolbar: {
              showQuickFilter: true,
              quickFilterProps: { debounceMs: 300 },
            },
          }}
          pageSizeOptions={[10, 20, 50]}
          initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
          sx={{ "& .MuiDataGrid-virtualScroller": { overflowX: "auto" } }}
        />
      </Paper>

      {/* Modal Crear/Editar */}
      {draft ? (
        <AlertRuleDialog
          open={openRule}
          mode={mode}
          value={draft}
          onClose={() => {
            setOpenRule(false);
            setDraft(null);
          }}
          onSubmit={(next) => {
            // ✅ guardado inmediato y correcto (sin el setTimeout raro)
            setRows((prev) => {
              const exists = prev.some((r) => r.id === next.id);
              const merged = exists ? prev.map((r) => (r.id === next.id ? next : r)) : [next, ...prev];
              saveParamAlertas(merged);
              return merged;
            });

            setOpenRule(false);
            setDraft(null);
          }}
          validateRow={validateRow}
        />
      ) : null}

      {/* Confirmación Eliminar */}
      <ConfirmDialog
        open={openConfirmDelete}
        title="Eliminar regla"
        message="¿Seguro que deseas eliminar esta regla? Esta acción no se puede deshacer."
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        onClose={() => {
          setOpenConfirmDelete(false);
          setDeleteId(null);
        }}
        onConfirm={doDelete}
      />
    </Box>
  );
}