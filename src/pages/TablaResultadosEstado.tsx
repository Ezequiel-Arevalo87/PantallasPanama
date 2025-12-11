// src/components/TablaResultadosEstado.tsx
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

const colorDeSemaforo = (s: "VERDE" | "AMARILLO" | "ROJO") =>
  s === "VERDE" ? "success" : s === "AMARILLO" ? "warning" : "error";

const TablaResultadosEstado: React.FC<Props> = ({ rows }) => {
  const [openTraza, setOpenTraza] = useState(false);
  const [trazasSeleccionadas, setTrazasSeleccionadas] = useState<TrazaItem[]>([]);
  const [tramiteActual, setTramiteActual] = useState<string | number | null>(null);

  const handleVerTrazas = useCallback((fila: FilaEstado) => {
    const ruc = (fila as any).ruc ?? "";
    const tramite = fila.numeroTramite ?? "";
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

  const columns = useMemo<GridColDef[]>(
    () => [
      { field: "numeroTramite", headerName: "numero tramite", width: 130 },
      { field: "ruc", headerName: "ruc", width: 140 },
      {
        field: "contribuyente",
        headerName: "nombre contribuyente",
        flex: 1,
        minWidth: 240,
      },
      { field: "estado", headerName: "estado", width: 230 },

      // FECHA
      {
        field: "fecha",
        headerName: "fecha",
        width: 140,
        renderCell: (p: any) => {
          const f = p?.row?.fecha;
          if (!f) return "";
          try {
            const d = new Date(f);
            const formatted = `${d
              .getDate()
              .toString()
              .padStart(2, "0")}/${(d.getMonth() + 1)
              .toString()
              .padStart(2, "0")}/${d.getFullYear()}`;
            return formatted;
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

      // SEMÁFORO
      {
        field: "semaforo",
        headerName: "semaforo",
        width: 150,
        valueGetter: (p) => {
          const f = (p as any)?.row?.fecha as string | undefined;
          return f ? calcularSemaforo(f) : "";
        },
        renderCell: (p) => {
          const f = (p as any)?.row?.fecha as string | undefined;
          if (!f) return null;
          const s = calcularSemaforo(f);
          const d = diasRestantes(f);
          return (
            <Chip
              label={`${d} días`}
              color={colorDeSemaforo(s)}
              size="small"
            />
          );
        },
      },

      // ACCIÓN: TRAZABILIDAD (ICONO OJITO + TOOLTIP)
      {
        field: "accion",
        headerName: "Acción",
        width: 120,
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
    const data = rows.map((r) => ({
      "numero tramite": r.numeroTramite ?? "",
      ruc: r.ruc ?? "",
      "nombre contribuyente": r.contribuyente ?? "",
      estado: r.estado ?? "",
      fecha: toDDMMYYYY(r.fecha ?? ""),
      semaforo: r.fecha ? calcularSemaforo(r.fecha) : "",
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Resultados");
    XLSX.writeFile(wb, "consulta_estado.xlsx");
  };

  return (
    <Box>
      <Box display="flex" justifyContent="flex-end" mb={1}>
        <button onClick={exportar} className="btn-export">
          Descargar Excel
        </button>
      </Box>

      <div style={{ height: 520, width: "100%" }}>
        <DataGrid
          rows={rows.map((r, i) => ({ id: i, ...r }))}
          columns={columns}
          density="compact"
          disableRowSelectionOnClick
          pageSizeOptions={[10, 25, 50]}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
        />
      </div>

      {/* Dialog de Trazabilidad */}
      <Dialog
        open={openTraza}
        onClose={handleCerrarTrazas}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ m: 0, p: 2 }}>
          Trazabilidad {tramiteActual ? `- Trámite ${tramiteActual}` : ""}
          <IconButton
            aria-label="close"
            onClick={handleCerrarTrazas}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
            }}
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

      <style>{`
        .btn-export{
          padding:8px 12px;
          border-radius:8px;
          border:1px solid #ccc;
          background:#fff;
          cursor:pointer;
        }
        .btn-export:hover{
          background:#f5f5f5;
        }
      `}</style>
    </Box>
  );
};

export default TablaResultadosEstado;
