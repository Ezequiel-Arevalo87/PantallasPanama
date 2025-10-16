// src/pages/Aprobaciones.tsx
import * as React from "react";
import {
  Box, Paper, Button, Chip, Typography, Grid,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Table, TableHead, TableRow, TableCell, TableBody, Stack,
} from "@mui/material";
import {
  DataGrid, type GridColDef, GridToolbarContainer, GridToolbarColumnsButton,
  GridToolbarDensitySelector, GridToolbarExport, GridToolbarQuickFilter, useGridApiRef,
  GridRowSelectionModel
} from "@mui/x-data-grid";
import { esES } from "@mui/x-data-grid/locales";
import Swal from "sweetalert2";
import { CASOS_KEY } from "../lib/aprobacionesStorage";

// =============== Tipos ===============
type RowBase = {
  id: number | string;
  categoria: string;               // categoría “real” del registro de datos
  ruc: string;
  nombre: string;
  periodos: string;
  valor?: number | string | null;
  monto?: number | string | null;
  total?: number | string | null;
  estado?: "Pendiente" | "Aprobado";
};

// ✅ Metadata que llega desde Priorización
type RowMeta = {
  metaCategoria?: string;
  metaInconsistencia?: string;     // Omiso | Inexacto | Extemporáneo | …
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

const fmtMoney = new Intl.NumberFormat("es-PA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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

// helpers para subtítulo según inconsistencia
const normalize = (s?: string | null) => (s || "").toLowerCase();
const inconsLabels = (inc?: string | null) => {
  switch (normalize(inc)) {
    case "omiso":        return { singular: "omiso",        plural: "omisos" };
    case "inexacto":     return { singular: "inexacto",     plural: "inexactos" };
    case "extemporáneo":
    case "extemporaneo": return { singular: "extemporáneo", plural: "extemporáneos" };
    default:             return { singular: "inconsistencia", plural: "inconsistencias" };
  }
};

// =============== Componente ===============
const Aprobaciones: React.FC = () => {
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
      // normaliza estado
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

  const persist = (data: Row[]) => {
    localStorage.setItem(CASOS_KEY, JSON.stringify(data));
    setRows(data);
  };

    const getValorDeFila = (row: any) =>
  row?.valor ?? row?.monto ?? row?.total ?? 0;


  const aprobarUno = async (row: Row) => {
    const { isConfirmed } = await Swal.fire({
      icon: "question",
      title: "¿Aprobar caso?",
      html: `<b>${row.nombre}</b><br/>RUC: ${row.ruc}<br/>Valor: <b>B/. ${fmtMoney.format(
        toNumber((row as any).valor ?? (row as any).monto ?? (row as any).total)
      )}</b>`,
      showCancelButton: true,
      confirmButtonText: "Sí, aprobar",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
      focusCancel: true,
    });
    if (!isConfirmed) return;

    const updated = rows.map((r) =>
      r.id === row.id ? { ...r, estado: "Aprobado" as const } : r
    );

  
    persist(updated);
    await Swal.fire({ icon: "success", title: "Aprobado", text: "El caso fue aprobado correctamente.", confirmButtonText: "Listo" });
  };

  const aprobarSeleccion = async () => {
    const api = apiRef.current;
    if (!api) return;

    const seleccion = Array.from(api.getSelectedRows().values()) as Row[];
    if (seleccion.length === 0) {
      await Swal.fire({ icon: "info", title: "Sin selección", text: "No hay casos seleccionados.", confirmButtonText: "Ok" });
      return;
    }

    const { isConfirmed } = await Swal.fire({
      icon: "question",
      title: "¿Aprobar selección?",
      html: `Se aprobarán <b>${seleccion.length}</b> caso(s).`,
      showCancelButton: true,
      confirmButtonText: "Sí, aprobar",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
      focusCancel: true,
    });
    if (!isConfirmed) return;

    const ids = new Set(seleccion.map((r) => r.id));
    const updated = rows.map((r) => ids.has(r.id) ? { ...r, estado: "Aprobado" as const } : r);

    persist(updated);
    await Swal.fire({ icon: "success", title: "Aprobados", text: "Selección aprobada correctamente.", confirmButtonText: "Listo" });
  };

  const columns: GridColDef<Row>[] = [
    { field: "ruc", headerName: "RUC", flex: 0.9, minWidth: 140 },
    { field: "nombre", headerName: "Nombre o Razón Social", flex: 1.2, minWidth: 240 },
    { field: "periodos", headerName: "Períodos (mm/aa)", flex: 0.9, minWidth: 160 },
    {
  field: "valor" as any,
  headerName: "Valor (B/.)",
  flex: 0.8,
  minWidth: 150,
  // ✅ Evita crashear si params o row aún no existen
  valueGetter: (p:any) => getValorDeFila(p?.row),
  valueFormatter: (p:any) => fmtMoney.format(toNumber(p?.value)),
},

    {
      field: "estado",
      headerName: "Estado",
      minWidth: 130,
      renderCell: (params) => {
        const value = (params.value as Row["estado"]) ?? "Pendiente";
        const aprobado = value === "Aprobado";
        return (
          <Chip
            size="small"
            label={value}
            color={aprobado ? "success" : "default"}
            variant={aprobado ? "filled" : "outlined"}
          />
        );
      },
    },
    {
      field: "acciones",
      headerName: "Acciones",
      sortable: false,
      filterable: false,
      align: "center",
      headerAlign: "center",
      minWidth: 200,
      renderCell: (params) => {
        const row = params.row as Row;
        const aprobado = (row.estado ?? "Pendiente") === "Aprobado";
        return (
          <Stack direction="row" spacing={1}>
            <Button size="small" variant="contained" onClick={() => openDetail(row)}>
              DETALLE
            </Button>
            <Button
              size="small"
              variant="contained"
              color="success"
              disabled={aprobado}
              onClick={() => aprobarUno(row)}
            >
              APROBAR
            </Button>
          </Stack>
        );
      },
    },
  ];

  const localeText = {
    ...esES.components.MuiDataGrid.defaultProps.localeText,
    toolbarQuickFilterPlaceholder: "Buscar…",
  };

  // etiqueta dinámica para el subtítulo
  const inc = inconsLabels(detailRow?.metaInconsistencia);

  return (
    <Box component={Paper} sx={{ p: 2 }}>
      <Grid container alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <Grid item><Typography variant="h6">Aprobaciones</Typography></Grid>
        <Grid item><Chip size="small" variant="outlined" color="primary" label={`Total: ${rows.length}`} /></Grid>
        <Grid item><Chip size="small" variant="outlined" label={`Seleccionados: ${selectedCount ?? 0}`} /></Grid>
        <Grid item sx={{ ml: "auto" }}>
          <Button
            size="small"
            variant="contained"
            color="success"
            onClick={aprobarSeleccion}
            disabled={selectedCount === 0}
          >
            Aprobar selección
          </Button>
        </Grid>
      </Grid>

      <DataGrid
        sx={{ height: 500 }}
        apiRef={apiRef}
        rows={rows}
        columns={columns}
        checkboxSelection
        disableRowSelectionOnClick
        onRowSelectionModelChange={(m: GridRowSelectionModel) => setSelectedCount(m.length)}
        slots={{ toolbar: CustomToolbar }}
        slotProps={{ toolbar: { showQuickFilter: true, quickFilterProps: { debounceMs: 400 } } }}
        pageSizeOptions={[5, 10, 25, 50]}
        initialState={{ pagination: { paginationModel: { page: 0, pageSize: 10 } } }}
        localeText={localeText}
      />

      {/* Modal Detalle */}
      <Dialog open={detailOpen} onClose={closeDetail} maxWidth="md" fullWidth>
        {/* ✅ TÍTULO sin “inexactos” */}
        <DialogTitle>Detalle de períodos</DialogTitle>
        <DialogContent dividers>
          {detailRow && (
            <>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={4}>
                  <Typography variant="caption">Categoría</Typography>
                  {/* ✅ privilegia metadata enviada desde Priorización */}
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
              </Grid>

              {/* ✅ Subtítulo dinámico (ej: “Cantidad de períodos omisos”) */}
              <Typography sx={{ mb: 1 }} variant="subtitle2">
                {`Cantidad de períodos ${inc.singular}`}
              </Typography>

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
          <Stack direction="row" spacing={1} sx={{ mr: "auto", pl: 1 }}>
            <Button variant="outlined" size="small">EXCEL</Button>
            <Button variant="outlined" size="small">WORD</Button>
            <Button variant="outlined" size="small">PDF</Button>
          </Stack>
          <Button variant="contained" onClick={closeDetail}>CERRAR</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Aprobaciones;
