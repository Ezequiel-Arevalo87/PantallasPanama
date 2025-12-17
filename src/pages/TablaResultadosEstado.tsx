import React, { useMemo, useState, useCallback } from "react";
import {
  Box,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Tooltip,
  Stack,
  Button,
} from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import CloseIcon from "@mui/icons-material/Close";
import VisibilityIcon from "@mui/icons-material/Visibility";

import * as XLSX from "xlsx";
import {
  calcularSemaforo,
  diasRestantes,
  toDDMMYYYY,
  type FilaEstado,
} from "../services/mockEstados";

import Trazabilidad, { type TrazaItem } from "../components/Trazabilidad";
import { buildMockTrazas } from "../services/mockTrazas";

type Props = { rows: FilaEstado[] };
type Semaforo = "VERDE" | "AMARILLO" | "ROJO";

const colorDeSemaforo = (s: Semaforo) =>
  s === "VERDE" ? "success" : s === "AMARILLO" ? "warning" : "error";

const TablaResultadosEstado: React.FC<Props> = ({ rows }) => {
  const [openTraza, setOpenTraza] = useState(false);
  const [trazasSeleccionadas, setTrazasSeleccionadas] = useState<TrazaItem[]>([]);
  const [tramiteActual, setTramiteActual] = useState<string | number | null>(null);

  // ✅ Filtro por chips (nuestro, NO del DataGrid)
  const [semaforoSeleccionado, setSemaforoSeleccionado] = useState<Semaforo | "">("");

  const handleToggleFiltroSemaforo = useCallback((s: Semaforo) => {
    setSemaforoSeleccionado((prev) => (prev === s ? "" : s));
  }, []);

  const handleVerTrazas = useCallback((fila: FilaEstado) => {
    const ruc = (fila as any).ruc ?? "";
    const tramite = (fila as any).numeroTramite ?? "";
    const key = `${ruc}|${tramite}`;

    setTramiteActual(tramite || "");
    setTrazasSeleccionadas(buildMockTrazas(key));
    setOpenTraza(true);
  }, []);

  const handleCerrarTrazas = useCallback(() => {
    setOpenTraza(false);
    setTramiteActual(null);
    setTrazasSeleccionadas([]);
  }, []);

  // ✅ Base rows con impuesto normalizado
  const gridRowsBase = useMemo(() => {
    return rows.map((r, i) => {
      const impuestoPrograma =
        (r as any).impuestoPrograma ??
        (r as any).impuesto_programa ??
        (r as any).impuesto ??
        "";

      return {
        id: i,
        ...r,
        impuestoPrograma,
      };
    });
  }, [rows]);

  // ✅ Filtrado REAL (a prueba de fallos)
  const gridRows = useMemo(() => {
    if (!semaforoSeleccionado) return gridRowsBase;

    return gridRowsBase.filter((r: any) => {
      const f = r?.fecha;
      if (!f) return false;
      return (calcularSemaforo(f) as Semaforo) === semaforoSeleccionado;
    });
  }, [gridRowsBase, semaforoSeleccionado]);

  // ✅ Resumen calculado sobre lo que se ve (gridRows ya filtrado)
  const resumenSemaforos = useMemo(() => {
    let rojo = 0;
    let amarillo = 0;
    let verde = 0;

    // Para el resumen, cuando hay filtro, mostramos el total filtrado (y sus colores serán solo ese)
    // Cuando NO hay filtro, mostramos el conteo real por color
    const base = semaforoSeleccionado ? gridRows : gridRowsBase;

    for (const r of base as any[]) {
      const f = r?.fecha as string | undefined;
      if (!f) continue;
      const s = calcularSemaforo(f) as Semaforo;
      if (s === "ROJO") rojo++;
      else if (s === "AMARILLO") amarillo++;
      else if (s === "VERDE") verde++;
    }

    return { rojo, amarillo, verde, total: base.length };
  }, [gridRows, gridRowsBase, semaforoSeleccionado]);

  const columns = useMemo<GridColDef[]>(
    () => [
      { field: "numeroTramite", headerName: "Número trámite", width: 140 },
      { field: "ruc", headerName: "RUC", width: 140 },
      {
        field: "contribuyente",
        headerName: "Nombre / Razón Social",
        flex: 1,
        minWidth: 260,
      },
      { field: "estado", headerName: "Estado", width: 220 },

      // ✅ Impuesto
      { field: "impuestoPrograma", headerName: "Impuesto", width: 280 },

      // Fecha
      {
        field: "fecha",
        headerName: "Fecha",
        width: 140,
        renderCell: (p: any) => {
          const f = p?.row?.fecha;
          if (!f) return "";
          try {
            const d = new Date(f);
            return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1)
              .toString()
              .padStart(2, "0")}/${d.getFullYear()}`;
          } catch {
            return f;
          }
        },
        sortComparator: (_v1: any, _v2: any, params1: any, params2: any) => {
          const iso1 = params1?.row?.fecha;
          const iso2 = params2?.row?.fecha;
          if (!iso1 && !iso2) return 0;
          if (!iso1) return -1;
          if (!iso2) return 1;
          return new Date(iso1).getTime() - new Date(iso2).getTime();
        },
      },

      // ✅ Semáforo (único)
      {
        field: "semaforo",
        headerName: "Semáforo",
        width: 170,
        sortable: false,
        filterable: false, // no usamos filtro interno
        renderCell: (p) => {
          const f = (p as any)?.row?.fecha as string | undefined;
          if (!f) return null;
          const s = calcularSemaforo(f) as Semaforo;
          const d = diasRestantes(f);

          return (
            <Chip
              label={`${d} días`}
              color={colorDeSemaforo(s)}
              size="small"
              variant="filled"
            />
          );
        },
      },

      // Acción
      {
        field: "accion",
        headerName: "Acción",
        width: 110,
        sortable: false,
        filterable: false,
        align: "center",
        headerAlign: "center",
        renderCell: (params) => {
          const fila = params.row as FilaEstado;
          return (
            <Tooltip title="Trazabilidad">
              <IconButton
                size="small"
                color="primary"
                onClick={() => handleVerTrazas(fila)}
                aria-label="Ver trazabilidad"
              >
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          );
        },
      },
    ],
    [handleVerTrazas]
  );

  const exportar = () => {
    // ✅ exporta lo que está visible (filtrado o no)
    const data = (gridRows as any[]).map((r) => ({
      "Número trámite": r.numeroTramite ?? "",
      RUC: r.ruc ?? "",
      "Nombre / Razón Social": r.contribuyente ?? "",
      Estado: r.estado ?? "",
      Impuesto: r.impuestoPrograma ?? "",
      Fecha: toDDMMYYYY(r.fecha ?? ""),
      Semáforo: r.fecha ? calcularSemaforo(r.fecha) : "",
      "Días restantes": r.fecha ? diasRestantes(r.fecha) : "",
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Resultados");
    XLSX.writeFile(wb, "consulta_estado.xlsx");
  };

  return (
    <Box>
      <br />
      <br />

      {/* Resumen + filtro chips */}
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        gap={2}
        mb={1}
        flexWrap="wrap"
      >
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          <Typography variant="body2" sx={{ mr: 1 }}>
            Total: <b>{resumenSemaforos.total}</b>
          </Typography>

          <Chip
            clickable
            label={`ROJO: ${resumenSemaforos.rojo}`}
            color="error"
            variant={semaforoSeleccionado === "ROJO" ? "filled" : "outlined"}
            onClick={() => handleToggleFiltroSemaforo("ROJO")}
          />
          <Chip
            clickable
            label={`AMARILLO: ${resumenSemaforos.amarillo}`}
            color="warning"
            variant={semaforoSeleccionado === "AMARILLO" ? "filled" : "outlined"}
            onClick={() => handleToggleFiltroSemaforo("AMARILLO")}
          />
          <Chip
            clickable
            label={`VERDE: ${resumenSemaforos.verde}`}
            color="success"
            variant={semaforoSeleccionado === "VERDE" ? "filled" : "outlined"}
            onClick={() => handleToggleFiltroSemaforo("VERDE")}
          />

          {semaforoSeleccionado && (
            <Button
              size="small"
              variant="text"
              onClick={() => setSemaforoSeleccionado("")}
            >
              Quitar filtro
            </Button>
          )}
        </Stack>

        <Button variant="outlined" onClick={exportar}>
          Descargar Excel
        </Button>
      </Box>

      <div style={{ height: 520, width: "100%" }}>
        <DataGrid
          rows={gridRows} // ✅ ya viene filtrado si aplica
          columns={columns}
          density="compact"
          disableRowSelectionOnClick
          pageSizeOptions={[10, 25, 50]}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
        />
      </div>

      {/* Dialog trazabilidad */}
      <Dialog open={openTraza} onClose={handleCerrarTrazas} maxWidth="md" fullWidth>
        <DialogTitle sx={{ m: 0, p: 2 }}>
          Trazabilidad {tramiteActual ? `- Trámite ${tramiteActual}` : ""}
          <IconButton
            aria-label="close"
            onClick={handleCerrarTrazas}
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {trazasSeleccionadas && trazasSeleccionadas.length > 0 ? (
            <Trazabilidad rows={trazasSeleccionadas} height={420} />
          ) : (
            <Typography variant="body2">
              No hay trazabilidad registrada para este trámite.
            </Typography>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default TablaResultadosEstado;
