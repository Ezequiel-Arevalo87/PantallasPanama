// src/pages/Verificacion.tsx
import * as React from "react";
import {
  Box, Paper, Button, Chip, Typography, Grid,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Table, TableHead, TableRow, TableCell, TableBody, Stack
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
  // Se mantienen opcionales por si vuelven a usarse en el futuro:
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

type Row = RowBase & RowMeta;

// =============== Utils ===============
const toNumber = (v: any): number => {
  if (v === null || v === undefined) return 0;
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  let s = String(v).trim();
  s = s.replace(/[^\d.,\-]/g, "");
  s = s.replace(/\.(?=\d{3}(\D|$))/g, "");
  s = s.replace(/,/, ".");
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
};

const fmtMoney = new Intl.NumberFormat("es-PA", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const PERIODOS_FIJOS = ["dic-20", "dic-21", "dic-22", "dic-23", "dic-24", "dic-25"] as const;

function buildBreakdown(row: Row) {
  const total = toNumber((row as any).valor ?? (row as any).monto ?? (row as any).total);
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
      const data: Row[] = texto ? JSON.parse(texto) : [];
      setRows(data.map((r) => (r.estado ? r : { ...r, estado: "Pendiente" as const })));
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
    
    { field: "valor", headerName: "Valor (B/.)", type: "number", flex: 0.8, minWidth: 160, sortable: true },
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

    // ✅ Enviar SOLO lo seleccionado
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
        <Grid item><Chip size="small" variant="outlined" color="primary" label={`Total: ${rows.length}`} /></Grid>
        <Grid item><Chip size="small" variant="outlined" label={`Seleccionados: ${selectedCount}`} /></Grid>
      </Grid>

      <DataGrid
        sx={{ height: 500 }}
        apiRef={apiRef}
        rows={rows}
        columns={columns}
        checkboxSelection
        disableRowSelectionOnClick
        onRowSelectionModelChange={(m: any) => setSelectedCount(m.length)}
        onRowDoubleClick={(p) => openDetail(p.row as Row)}   // doble click también abre el detalle
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
                            {fmtMoney.format(it.monto)}
                          </TableCell>
                        ))}
                        <TableCell align="right">
                          <b>{fmtMoney.format(bd.total)}</b>
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
