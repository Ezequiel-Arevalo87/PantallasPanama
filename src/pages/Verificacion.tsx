// src/pages/Verificacion.tsx
import * as React from "react";
import {
  Box, Paper, Button, Chip, Typography, Grid,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Table, TableHead, TableRow, TableCell, TableBody
} from "@mui/material";
import {
  DataGrid, type GridColDef, GridToolbarContainer, GridToolbarColumnsButton,
  GridToolbarDensitySelector, GridToolbarExport, GridToolbarQuickFilter, useGridApiRef,
} from "@mui/x-data-grid";
import { esES } from "@mui/x-data-grid/locales";
import Swal from "sweetalert2";
import { CASOS_KEY, notifyAprobaciones } from "../lib/aprobacionesStorage";

// =============== Tipos ===============
type RowBase = {
  id: number | string;
  categoria: string;
  ruc: string;
  nombre: string;
  periodos: string;
  valor?: number | string | null;
  monto?: number | string | null;
  total?: number | string | null;
  estado?: "Pendiente" | "Aprobado";
  motivoDevolucion?: string | null;
  motivoAmpliar?: string | null;
};

type RowMeta = {
  metaCategoria?: string;
  metaInconsistencia?: string;
  metaPrograma?: string | null;
  metaActividadEconomica?: string[];
  metaPeriodoInicial?: string | null;
  metaPeriodoFinal?: string | null;
};

// 👉 fila que usaremos en la tabla (ya con número real para mostrar/ordenar)
type Row = RowBase & RowMeta & {
  valorNum: number; // 👈 número seguro (con o sin decimales)
};

// =============== Utils ===============
const toNumber = (v: any): number => {
  if (v === null || v === undefined) return 0;
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  // Limpieza robusta: quita símbolos, maneja miles/decimales mixtos
  let s = String(v).trim();
  if (!s) return 0;
  s = s.replace(/\s+/g, "").replace(/[^\d.,\-]/g, "");
  const lastDot = s.lastIndexOf(".");
  const lastComma = s.lastIndexOf(",");
  let decimalSep: "." | "," | null = null;
  if (lastDot !== -1 || lastComma !== -1) decimalSep = lastComma > lastDot ? "," : ".";
  if (decimalSep) {
    const thousandSep = decimalSep === "." ? "," : ".";
    s = s.replace(new RegExp("\\" + thousandSep, "g"), "");
    if (decimalSep === ",") s = s.replace(/,/g, ".");
  } else {
    s = s.replace(/[^\d\-]/g, "");
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
};

// ✅ Formato 1,000,000.00
const fmtMoneyUS = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const PERIODOS_FIJOS = ["dic-20", "dic-21", "dic-22", "dic-23", "dic-24", "dic-25"] as const;

function buildBreakdown(row: Row) {
  const total = row.valorNum || 0; // 👈 usamos el número ya calculado
  if (!total) {
    return { items: PERIODOS_FIJOS.map((p) => ({ periodo: p, monto: 0 })), total: 0 };
  }
  const seed =
    (typeof row.id === "number"
      ? row.id
      : Number(String(row.id).replace(/\D/g, ""))) || 1;
  const weights = PERIODOS_FIJOS.map((_, i) => (i + 1) * ((Number(seed) % 7) + 3));
  const sumW = weights.reduce((a, b) => a + b, 0);
  const items = PERIODOS_FIJOS.map((p, i) => ({
    periodo: p,
    monto: Math.round((total * weights[i]) / sumW),
  }));
  const ajuste = total - items.reduce((a, b) => a + b.monto, 0);
  if (ajuste !== 0) items[items.length - 1].monto += ajuste;
  return { items, total };
}

function CustomToolbar() {
  return (
    <GridToolbarContainer sx={{ p: 1, display: "flex", alignItems: "center" }}>
      <GridToolbarColumnsButton />
      <GridToolbarDensitySelector />
      <GridToolbarExport />
      <Box sx={{ flex: 1 }} />
      <GridToolbarQuickFilter />
    </GridToolbarContainer>
  );
}

// =============== Componente ===============
const Verificacion: React.FC = () => {
  const apiRef = useGridApiRef();

  const [rows, setRows] = React.useState<Row[]>([]);
  const [selectedCount, setSelectedCount] = React.useState(0);

  const [detailOpen, setDetailOpen] = React.useState(false);
  const [detailRow, setDetailRow] = React.useState<Row | null>(null);

  const openDetail = (row: Row) => { setDetailRow(row); setDetailOpen(true); };
  const closeDetail = () => setDetailOpen(false);

  const loadFromStorage = React.useCallback(() => {
    try {
      const texto = localStorage.getItem(CASOS_KEY);
      const data: (RowBase & RowMeta)[] = texto ? JSON.parse(texto) : [];
      const withNum: Row[] = data.map((r) => {
        const n = toNumber(r.valor ?? r.monto ?? r.total);
        return {
          ...r,
          estado: r.estado ?? "Pendiente",
          valorNum: n, // 👈 número seguro (puede tener decimales)
        };
      });
      setRows(withNum);
    } catch {
      setRows([]);
    }
  }, []);

  React.useEffect(() => { loadFromStorage(); }, [loadFromStorage]);

  React.useEffect(() => {
    const onStorage = (e: StorageEvent) => { if (e.key === CASOS_KEY) loadFromStorage(); };
    const onCustom = () => loadFromStorage();
    window.addEventListener("storage", onStorage);
    window.addEventListener("casosAprobacion:update", onCustom);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("casosAprobacion:update", onCustom);
    };
  }, [loadFromStorage]);

  const columns: GridColDef<Row>[] = [
    { field: "ruc", headerName: "RUC", flex: 0.9, minWidth: 140 },
    { field: "nombre", headerName: "Nombre o Razón Social", flex: 1.2, minWidth: 240 },
    { field: "periodos", headerName: "Períodos (mm/aa)", flex: 0.9, minWidth: 160 },

    // 👇 misma lógica de formato que en Priorización: mostramos valorNum con en-US
    {
      field: "valorNum",
      headerName: "Valor (B/.)",
      type: "number",
      flex: 0.8,
      minWidth: 160,
      sortable: true,

      // el grid ordena numéricamente
      valueGetter: (params:any) => Number(params.row?.valorNum) ?? 0,

      // pintamos con 1,000,000.00 evitando dobles formateos
      renderCell: (params) => {
        const num = typeof params.row?.valorNum === "number"
          ? params.row.valorNum
          : Number(params.row?.valorNum) || 0;
        return fmtMoneyUS.format(num);
      },

      sortComparator: (a, b) => (Number(a) || 0) - (Number(b) || 0),
    },

    {
      field: "acciones",
      headerName: "Acciones",
      sortable: false,
      filterable: false,
      align: "center",
      headerAlign: "center",
      minWidth: 140,
      renderCell: (params) => (
        <Button size="small" variant="contained" onClick={() => openDetail(params.row as Row)}>
          DETALLE
        </Button>
      ),
    },
  ];

  const localeText = {
    ...esES.components.MuiDataGrid.defaultProps.localeText,
    toolbarQuickFilterPlaceholder: "Buscar…",
  };

  const pasarAAprobacion = async () => {
    const api = apiRef.current;
    if (!api) return;

    const seleccion = Array.from(api.getSelectedRows().values()) as Row[];
    if (seleccion.length === 0) {
      await Swal.fire({
        icon: "info",
        title: "Sin selección",
        text: "Selecciona uno o más casos.",
        confirmButtonText: "Ok",
      });
      return;
    }

    const { isConfirmed } = await Swal.fire({
      icon: "question",
      title: "¿Pasar a Aprobación?",
      html: `Se enviarán <b>${seleccion.length}</b> caso(s) a Aprobación.<br/>Esto reemplazará cualquier lista previa.`,
      showCancelButton: true,
      confirmButtonText: "Sí, confirmar",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
      focusCancel: true,
    });
    if (!isConfirmed) return;

    // ✅ Enviar SOLO lo seleccionado (se conserva el valorNum en el objeto)
    localStorage.setItem(CASOS_KEY, JSON.stringify(seleccion));
    notifyAprobaciones(); // refresca en el mismo tab

    await Swal.fire({
      icon: "success",
      title: "Enviado",
      text: `Se enviaron ${seleccion.length} caso(s) a Aprobación.`,
      confirmButtonText: "Listo",
    });
  };

  return (
    <Box component={Paper} sx={{ p: 2 }}>
      <Grid container alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <Grid item><Typography variant="h6">Verificación</Typography></Grid>
        <Grid item>
          <Chip size="small" variant="outlined" color="primary" label={`Total: ${rows.length}`} />
        </Grid>
        <Grid item>
          <Chip size="small" variant="outlined" label={`Seleccionados: ${selectedCount}`} />
        </Grid>
      </Grid>

      <DataGrid
        sx={{ height: 500 }}
        apiRef={apiRef}
        rows={rows}
        columns={columns}
        checkboxSelection
        disableRowSelectionOnClick
        onRowSelectionModelChange={(m: any) => setSelectedCount(m.length)}
        onRowDoubleClick={(p) => openDetail(p.row as Row)}
        slots={{ toolbar: CustomToolbar }}
        slotProps={{ toolbar: { showQuickFilter: true, quickFilterProps: { debounceMs: 400 } } }}
        pageSizeOptions={[5, 10, 25, 50]}
        initialState={{ pagination: { paginationModel: { page: 0, pageSize: 10 } } }}
        localeText={localeText}
      />

      {/* Botón inferior alineado a la IZQUIERDA */}
      <Box sx={{ mt: 1, display: "flex", justifyContent: "flex-start" }}>
        <Button size="small" variant="contained" color="success" onClick={pasarAAprobacion}>
          Pasar a Aprobación
        </Button>
      </Box>

      {/* Modal Detalle */}
      <Dialog open={detailOpen} onClose={closeDetail} maxWidth="md" fullWidth>
        <DialogTitle>Detalle de períodos</DialogTitle>
        <DialogContent dividers>
          {detailRow && (
            <>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={4}>
                  <Typography variant="caption">Categoría</Typography>
                  <Box component={Paper} sx={{ p: 1 }}>
                    {detailRow.metaCategoria ?? detailRow.categoria ?? "—"}
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="caption">RUC</Typography>
                  <Box component={Paper} sx={{ p: 1 }}>{detailRow.ruc}</Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="caption">Nombre</Typography>
                  <Box component={Paper} sx={{ p: 1 }}>{detailRow.nombre}</Box>
                </Grid>

                {!!detailRow.metaPrograma && (
                  <Grid item xs={12} md={4}>
                    <Typography variant="caption">Programa</Typography>
                    <Box component={Paper} sx={{ p: 1 }}>{detailRow.metaPrograma}</Box>
                  </Grid>
                )}
                {!!detailRow.metaInconsistencia && (
                  <Grid item xs={12} md={4}>
                    <Typography variant="caption">Inconsistencia</Typography>
                    <Box component={Paper} sx={{ p: 1 }}>{detailRow.metaInconsistencia}</Box>
                  </Grid>
                )}
                {!!detailRow.metaActividadEconomica?.length && (
                  <Grid item xs={12}>
                    <Typography variant="caption">Actividad(es) económica(s)</Typography>
                    <Box component={Paper} sx={{ p: 1 }}>
                      {detailRow.metaActividadEconomica.join(", ")}
                    </Box>
                  </Grid>
                )}
                {detailRow.motivoDevolucion && (
                  <Grid item xs={12}>
                    <Typography variant="caption">Motivo de devolución</Typography>
                    <Box component={Paper} sx={{ p: 1 }}>{detailRow.motivoDevolucion}</Box>
                  </Grid>
                )}
                {detailRow.motivoAmpliar && (
                  <Grid item xs={12}>
                    <Typography variant="caption">Motivo para ampliar</Typography>
                    <Box component={Paper} sx={{ p: 1 }}>{detailRow.motivoAmpliar}</Box>
                  </Grid>
                )}
              </Grid>

              {(() => {
                const bd = buildBreakdown(detailRow);
                return (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        {PERIODOS_FIJOS.map((p) => <TableCell key={p} align="right">{p}</TableCell>)}
                        <TableCell align="right"><b>Total</b></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        {bd.items.map((it) => (
                          <TableCell key={it.periodo} align="right">
                            {fmtMoneyUS.format(it.monto)}
                          </TableCell>
                        ))}
                        <TableCell align="right">
                          <b>{fmtMoneyUS.format(bd.total)}</b>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                );
              })()}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={closeDetail}>CERRAR</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Verificacion;
