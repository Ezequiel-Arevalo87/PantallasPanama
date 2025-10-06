import * as React from "react";
import {
  Box,
  Paper,
  Button,
  Chip,
  Typography,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Stack,
} from "@mui/material";
import {
  DataGrid,
  GridColDef,
  GridToolbarContainer,
  GridToolbarColumnsButton,
  GridToolbarDensitySelector,
  GridToolbarExport,
  GridToolbarQuickFilter,
  useGridApiRef,
} from "@mui/x-data-grid";
import { esES } from "@mui/x-data-grid/locales";
import Swal from "sweetalert2";
import { CASOS_KEY } from "../lib/aprobacionesStorage"; // 👈 NUEVO

/** ===== Tipos y utils compatibles con Priorización ===== */
type Operador = ">=" | "<=" | "==" | "!=";

type Row = {
  id: number | string;
  categoria: string;
  ruc: string;
  nombre: string;
  periodos: string;
  valor?: number | string | null;
  monto?: number | string | null;
  total?: number | string | null;
  estado?: "Pendiente" | "Aprobado";
};

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

/** ===== Modal de desglose (misma lógica) ===== */
const PERIODOS_FIJOS = ["dic-20", "dic-21", "dic-22", "dic-23", "dic-24", "dic-25"];
function buildBreakdown(row: Row) {
  const total = toNumber(row.valor ?? row.monto ?? row.total);
  if (!total) {
    return { items: PERIODOS_FIJOS.map((p) => ({ periodo: p, monto: 0 })), total: 0 };
  }
  const seed =
    (typeof row.id === "number"
      ? row.id
      : Number(String(row.id).replace(/\D/g, ""))) || 1;
  const weights = PERIODOS_FIJOS.map((_, i) => (i + 1) * ((Number(seed) % 7) + 3)); // 3..9
  const sumW = weights.reduce((a, b) => a + b, 0);
  const items = PERIODOS_FIJOS.map((p, i) => ({
    periodo: p,
    monto: Math.round((total * weights[i]) / sumW),
  }));
  const ajuste = total - items.reduce((a, b) => a + b.monto, 0);
  if (ajuste !== 0) items[items.length - 1].monto += ajuste;
  return { items, total };
}

/** ===== Toolbar ===== */
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

const Aprobaciones: React.FC = () => {
  const apiRef = useGridApiRef();

  /** Estado base */
  const [rows, setRows] = React.useState<Row[]>([]);
  const [selectedCount, setSelectedCount] = React.useState(0);

  /** Modal detalle */
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [detailRow, setDetailRow] = React.useState<Row | null>(null);

  const openDetail = (row: Row) => {
    setDetailRow(row);
    setDetailOpen(true);
  };
  const closeDetail = () => setDetailOpen(false);

  /** Cargar desde localStorage */
  const loadFromStorage = React.useCallback(() => {
    try {
      const texto = localStorage.getItem(CASOS_KEY);
      const data: Row[] = texto ? JSON.parse(texto) : [];
      setRows(
        data.map((r) => (r.estado ? r : { ...r, estado: "Pendiente" as const }))
      );
    } catch {
      setRows([]);
    }
  }, []);

  React.useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  // Escuchar cambios: entre pestañas (storage) y en este mismo tab (evento custom)
  React.useEffect(() => {
    const onCustom = () => loadFromStorage();
    const onStorage = (e: StorageEvent) => {
      if (e.key === CASOS_KEY) loadFromStorage();
    };
    window.addEventListener("casosAprobacion:update", onCustom); // 👈 NUEVO
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("casosAprobacion:update", onCustom);
      window.removeEventListener("storage", onStorage);
    };
  }, [loadFromStorage]);

  /** Persistir */
  const persist = (data: Row[]) => {
    localStorage.setItem(CASOS_KEY, JSON.stringify(data));
    setRows(data);
  };

  /** Aprobar individual */
  const aprobarUno = async (row: Row) => {
    const { isConfirmed } = await Swal.fire({
      icon: "question",
      title: "¿Aprobar caso?",
      html: `<b>${row.nombre}</b><br/>RUC: ${row.ruc}<br/>Valor: <b>B/. ${fmtMoney.format(
        toNumber(row.valor ?? row.monto ?? row.total)
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

    // Si prefieres eliminar el aprobado de la lista:
    // const updated = rows.filter((r) => r.id !== row.id);

    persist(updated);

    await Swal.fire({
      icon: "success",
      title: "Aprobado",
      text: "El caso fue aprobado correctamente.",
      confirmButtonText: "Listo",
    });
  };

  /** Aprobar selección */
  const aprobarSeleccion = async () => {
    const api = apiRef.current;
    if (!api) return;

    const seleccion = Array.from(api.getSelectedRows().values()) as Row[];
    if (seleccion.length === 0) {
      await Swal.fire({
        icon: "info",
        title: "Sin selección",
        text: "No hay casos seleccionados.",
        confirmButtonText: "Ok",
      });
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
    const updated = rows.map((r) =>
      ids.has(r.id) ? { ...r, estado: "Aprobado" as const } : r
    );

    // Si prefieres removerlos:
    // const updated = rows.filter((r) => !ids.has(r.id));

    persist(updated);

    await Swal.fire({
      icon: "success",
      title: "Aprobados",
      text: "Selección aprobada correctamente.",
      confirmButtonText: "Listo",
    });
  };

  /** Limpiar todo */
  const limpiarLista = async () => {
    const { isConfirmed } = await Swal.fire({
      icon: "warning",
      title: "¿Vaciar lista?",
      text: "Se eliminarán todos los casos de Aprobación.",
      showCancelButton: true,
      confirmButtonText: "Sí, vaciar",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
      focusCancel: true,
    });
    if (!isConfirmed) return;
    persist([]);
  };

  /** Columnas */
  const columns: GridColDef[] = [
    { field: "ruc", headerName: "RUC", flex: 0.9, minWidth: 140 },
    { field: "nombre", headerName: "Nombre o Razón Social", flex: 1.2, minWidth: 240 },
    { field: "periodos", headerName: "Períodos (mm/aa)", flex: 0.9, minWidth: 160 },
    {
      field: "valor",
      headerName: "Valor (B/.)",
      flex: 0.8,
      minWidth: 150,
      valueFormatter: (p:any) => fmtMoney.format(toNumber(p.value)),
    },
    {
      field: "estado",
      headerName: "Estado",
      minWidth: 130,
      renderCell: (params) => (
        <Chip
          size="small"
          label={params.value ?? "Pendiente"}
          color={params.value === "Aprobado" ? "success" : "default"}
          variant={params.value === "Aprobado" ? "filled" : "outlined"}
        />
      ),
    },
    {
      field: "acciones",
      headerName: "Acciones",
      sortable: false,
      filterable: false,
      align: "center",
      headerAlign: "center",
      minWidth: 220,
      renderCell: (params) => {
        const row = params.row as Row;
        return (
          <Stack direction="row" spacing={1}>
            <Button size="small" variant="contained" onClick={() => openDetail(row)}>
              DETALLE
            </Button>
            <Button
              size="small"
              variant="contained"
              color="success"
              disabled={row.estado === "Aprobado"}
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

  return (
    <Box component={Paper} sx={{ p: 2 }}>
      <Grid container alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <Grid item>
          <Typography variant="h6">Aprobaciones</Typography>
        </Grid>
        <Grid item>
          <Chip
            size="small"
            variant="outlined"
            color="primary"
            label={`Total: ${rows.length}`}
          />
        </Grid>
        <Grid item>
          <Chip
            size="small"
            variant="outlined"
            label={`Seleccionados: ${selectedCount}`}
          />
        </Grid>
        <Grid item sx={{ ml: "auto" }}>
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              variant="contained"
              color="success"
              onClick={ aprobarSeleccion }
              disabled={selectedCount === 0}
            >
              Aprobar selección
            </Button>
         
          </Stack>
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
        slots={{ toolbar: CustomToolbar }}
        slotProps={{
          toolbar: { showQuickFilter: true, quickFilterProps: { debounceMs: 400 } },
        }}
        pageSizeOptions={[5, 10, 25, 50]}
        initialState={{ pagination: { paginationModel: { page: 0, pageSize: 10 } } }}
        localeText={localeText}
      />

      {/* Modal Detalle */}
      <Dialog open={detailOpen} onClose={closeDetail} maxWidth="md" fullWidth>
        <DialogTitle>Detalle de periodos inexactos</DialogTitle>
        <DialogContent dividers>
          {detailRow && (
            <>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={4}>
                  <Typography variant="caption">Categoría</Typography>
                  <Box component={Paper} sx={{ p: 1 }}>{detailRow.categoria}</Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="caption">RUC</Typography>
                  <Box component={Paper} sx={{ p: 1 }}>{detailRow.ruc}</Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="caption">Nombre</Typography>
                  <Box component={Paper} sx={{ p: 1 }}>{detailRow.nombre}</Box>
                </Grid>
              </Grid>

              <Typography sx={{ mb: 1 }} variant="subtitle2">
                Cantidad periodos inexacto
              </Typography>
              {(() => {
                const bd = buildBreakdown(detailRow);
                return (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        {PERIODOS_FIJOS.map((p) => (
                          <TableCell key={p} align="right">
                            {p}
                          </TableCell>
                        ))}
                        <TableCell align="right">
                          <b>Total</b>
                        </TableCell>
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
            <Button variant="outlined" size="small">
              EXCEL
            </Button>
            <Button variant="outlined" size="small">
              WORD
            </Button>
            <Button variant="outlined" size="small">
              PDF
            </Button>
          </Stack>
          <Button variant="contained" onClick={closeDetail}>
            CERRAR
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Aprobaciones;
