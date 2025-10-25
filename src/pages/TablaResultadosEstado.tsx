import React, { useMemo } from "react";
import { Box, Chip } from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";

import * as XLSX from "xlsx";
import {
  calcularSemaforo,
  diasRestantes,
  toDDMMYYYY,
  type FilaEstado,
} from "../services/mockEstados";

type Props = { rows: FilaEstado[] };

const colorDeSemaforo = (s: "VERDE" | "AMARILLO" | "ROJO") =>
  s === "VERDE" ? "success" : s === "AMARILLO" ? "warning" : "error";

const TablaResultadosEstado: React.FC<Props> = ({ rows }) => {
 const columns = useMemo<GridColDef[]>(
  () => [
    { field: "numeroTramite", headerName: "numero tramite", width: 130 },
    { field: "ruc", headerName: "ruc", width: 140 },
    { field: "contribuyente", headerName: "nombre contribuyente", flex: 1, minWidth: 240 },
    { field: "estado", headerName: "estado", width: 230 },

    // ⬇️ FECHA: usar valueGetter con guard y comparar como fecha real
  {
  field: "fecha",
  headerName: "fecha",
  width: 140,
  // ✅ Mostrar la fecha en el formato original o dd/mm/yyyy
  renderCell: (p: any) => {
    const f = p?.row?.fecha;
    if (!f) return "";
    try {
      const d = new Date(f);
      // dd/mm/yyyy
      const formatted = `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1)
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
        // solo color + días (sin “VERDE/AMARILLO/ROJO”)
        return <Chip label={`${d} días`} color={s === "VERDE" ? "success" : s === "AMARILLO" ? "warning" : "error"} size="small" />;
      },
    },
  ],
  []
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
        <button onClick={exportar} className="btn-export">Descargar Excel</button>
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

      <style>{`
        .btn-export{
          padding:8px 12px;border-radius:8px;border:1px solid #ccc;background:#fff;cursor:pointer
        }
        .btn-export:hover{background:#f5f5f5}
      `}</style>
    </Box>
  );
};

export default TablaResultadosEstado;
