import * as React from "react";
import {
  Box,
  Paper,
  Grid,
  Typography,
  Button,
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
  GridToolbarColumnsButton,
  GridToolbarContainer,
  GridToolbarDensitySelector,
  GridToolbarExport,
  GridToolbarQuickFilter,
  useGridApiRef,
} from "@mui/x-data-grid";
import { esES } from "@mui/x-data-grid/locales";
import Swal from "sweetalert2";

// 🔥 IMPORTANTE PARA RESTAURAR EL FLUJO DEL HOME
import { saveCasoFlujo, uuid } from "../lib/workflowStorage";

import { CASOS_KEY, notifyAprobaciones } from "../lib/aprobacionesStorage";
import Trazabilidad, { type TrazaItem } from "../components/Trazabilidad";

/* ===================== Tipos ===================== */
type Operador = ">=" | "<=" | "==" | "!=";
type Condicion = { criterio: string; operador: Operador; valorBalboas: number };

type Props = {
  condiciones?: Condicion[];
  categoria?: string;
  inconsistencia?: string;
  actividadEconomica?: string[];
  valoresDeclarados?: number | string;
  programa?: string | null;
  periodoInicial?: string | null;
  periodoFinal?: string | null;
  operadorFiltro?: Operador;
  valorFiltro?: number | string;
  provincia?: string; 
};

type RawRow = {
  id: number;
  categoria: string;
  ruc: string;
  nombre: string;
  periodos: string;
  valor: number;
  provincia: string;
};

type Row = {
  id: number | string;
  categoria: string;
  ruc: string;
  nombre: string;
  periodos: string;
  valor: number;
  valorInt: number;
  monto?: number | string | null;
  total?: number | string | null;
  provincia: string;
  trazas?: TrazaItem[];
};

export type RowAprobacion = Row & {
  metaCategoria?: string;
  metaInconsistencia?: string;
  metaPrograma?: string | null;
  metaActividadEconomica?: string[];
  metaPeriodoInicial?: string | null;
  metaPeriodoFinal?: string | null;
};

/* ===================== Utils ===================== */
const toNumber = (v: any): number => {
  if (v == null) return 0;
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  let s = String(v).trim();
  if (!s) return 0;
  s = s.replace(/\s+/g, "").replace(/[^\d.,\-]/g, "");
  const lastDot = s.lastIndexOf(".");
  const lastComma = s.lastIndexOf(",");
  let decimalSep: "." | "," | null = null;
  if (lastDot !== -1 || lastComma !== -1) {
    decimalSep = lastComma > lastDot ? "," : ".";
  }
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

const toInt = (v: any): number =>
  Math.trunc(typeof v === "number" ? v : toNumber(v));

const fmtMoney = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/* ===================== Datos MOCK ===================== */
const rawRows: RawRow[] = [
  { id: 1, categoria: "Fiscalización Masiva", ruc: "8-123-456", nombre: "Individual", periodos: "06/25", valor: 1250000, provincia: "Darién" },
  { id: 2, categoria: "Fiscalización Masiva", ruc: "8-654-321", nombre: "Individual", periodos: "05/25", valor: 236.23, provincia: "Darién" },
  { id: 3, categoria: "Fiscalización Masiva", ruc: "100200", nombre: "Panamá Retail S.A.", periodos: "04/25", valor: 2980000, provincia: "Panamá" },
  { id: 4, categoria: "Fiscalización Masiva", ruc: "100201", nombre: "Construcciones Istmo S.A.", periodos: "03/25", valor: 1745320, provincia: "Panamá Oeste" },
  { id: 5, categoria: "Fiscalización Masiva", ruc: "100202", nombre: "Servicios Canal S.A.", periodos: "02/25", valor: 695, provincia: "Colón" },
  { id: 6, categoria: "Fiscalización Masiva", ruc: "100203", nombre: "Agroexport Delta", periodos: "01/25", valor: 1100000, provincia: "Veraguas" },
  { id: 7, categoria: "Fiscalización Masiva", ruc: "100204", nombre: "Tecno Sur S.A.", periodos: "12/24", valor: 8547, provincia: "Coclé" },
  { id: 8, categoria: "Fiscalización Masiva", ruc: "100205", nombre: "Transporte Caribe", periodos: "11/24", valor: 2300000, provincia: "Chiriquí" },
  { id: 9, categoria: "Fiscalización Masiva", ruc: "100206", nombre: "Hoteles del Istmo", periodos: "10/24", valor: 978, provincia: "Bocas del Toro" },
  { id: 10, categoria: "Fiscalización Masiva", ruc: "100207", nombre: "Textiles del Istmo", periodos: "09/24", valor: 1505000, provincia: "Los Santos" },

  { id: 11, categoria: "Grandes Contribuyentes", ruc: "200300", nombre: "Comercial ABC S.A.", periodos: "06/25", valor: 654, provincia: "Panamá" },
  { id: 12, categoria: "Grandes Contribuyentes", ruc: "200301", nombre: "Energía Nacional S.A.", periodos: "05/25", valor: 4123000.21, provincia: "Colón" },
  { id: 13, categoria: "Grandes Contribuyentes", ruc: "200302", nombre: "Telecom Panavisión", periodos: "04/25", valor: 158, provincia: "Panamá Oeste" },
  { id: 14, categoria: "Grandes Contribuyentes", ruc: "200303", nombre: "Aviación del Istmo", periodos: "03/25", valor: 2060000.45, provincia: "Chiriquí" },
  { id: 15, categoria: "Grandes Contribuyentes", ruc: "200304", nombre: "Finanzas Canal Group", periodos: "02/25", valor: 657, provincia: "Herrera" },
  { id: 16, categoria: "Grandes Contribuyentes", ruc: "200305", nombre: "Minería del Pacífico", periodos: "01/25", valor: 3100450.23, provincia: "Veraguas" },
  { id: 17, categoria: "Grandes Contribuyentes", ruc: "200306", nombre: "Alimentos Global S.A.", periodos: "12/24", valor: 236, provincia: "Panamá" },
  { id: 18, categoria: "Grandes Contribuyentes", ruc: "200307", nombre: "Logística Intermodal", periodos: "11/24", valor: 1299000, provincia: "Coclé" },
  { id: 19, categoria: "Grandes Contribuyentes", ruc: "200308", nombre: "Farmacéutica Panamericana", periodos: "10/24", valor: 2365, provincia: "Bocas del Toro" },
  { id: 20, categoria: "Grandes Contribuyentes", ruc: "200309", nombre: "Seguros del Istmo", periodos: "09/24", valor: 1080000, provincia: "Los Santos" },

  { id: 21, categoria: "Auditoría Sectorial", ruc: "300400", nombre: "Servicios XYZ", periodos: "06/25", valor: 158, provincia: "Panamá" },
  { id: 22, categoria: "Auditoría Sectorial", ruc: "300401", nombre: "AgroPanamá Ltda.", periodos: "05/25", valor: 1025, provincia: "Herrera" },
  { id: 23, categoria: "Auditoría Sectorial", ruc: "300402", nombre: "Turismo & Viajes S.A.", periodos: "04/25", valor: 1350000, provincia: "Chiriquí" },
  { id: 24, categoria: "Auditoría Sectorial", ruc: "300403", nombre: "Educación Privada del Sur", periodos: "03/25", valor: 2450000, provincia: "Coclé" },
  { id: 25, categoria: "Auditoría Sectorial", ruc: "300404", nombre: "Salud Integral S.A.", periodos: "02/25", valor: 695, provincia: "Veraguas" },
  { id: 26, categoria: "Auditoría Sectorial", ruc: "300405", nombre: "Tecnología Andina", periodos: "01/25", valor: 1789000, provincia: "Panamá" },
  { id: 27, categoria: "Auditoría Sectorial", ruc: "300406", nombre: "Arquitectura Moderna", periodos: "12/24", valor: 320, provincia: "Bocas del Toro" },
  { id: 28, categoria: "Auditoría Sectorial", ruc: "300407", nombre: "Transporte Urbano S.A.", periodos: "11/24", valor: 1250000, provincia: "Panamá Oeste" },
  { id: 29, categoria: "Auditoría Sectorial", ruc: "300408", nombre: "Comercial Marítima", periodos: "10/24", valor: 236, provincia: "Colón" },
  { id: 30, categoria: "Auditoría Sectorial", ruc: "300409", nombre: "Consultores del Istmo", periodos: "09/24", valor: 2110000, provincia: "Los Santos" },
];

const BASE_ROWS: Row[] = rawRows.map((r, index) => {
  const tieneProceso = index % 2 === 0;

  const trazas: TrazaItem[] = tieneProceso
    ? [
        {
          id: `${r.ruc}-1`,
          fechaISO: new Date().toISOString(),
          actor: "Supervisor A",
          accion: "Creación",
          estado: "PENDIENTE",
        },
        {
          id: `${r.ruc}-2`,
          fechaISO: new Date().toISOString(),
          actor: "Auditor B",
          accion: "Revisión",
          estado: "APROBADO",
        },
      ]
    : [];

  return {
    ...r,
    valorInt: toInt(r.valor),
    provincia: r.provincia,
    trazas,
  };
});

/* ===================== Componente ===================== */
export default function PriorizacionForm({
  condiciones = [],
  categoria,
  inconsistencia,
  actividadEconomica,
  valoresDeclarados,
  programa,
  periodoInicial,
  periodoFinal,
  operadorFiltro,
  valorFiltro,
  provincia,
}: Props) {
  const apiRef = useGridApiRef();

  const rows = React.useMemo<Row[]>(() => {
    let base = BASE_ROWS;

    if (provincia && provincia !== "Todos") {
      base = base.filter((r) => r.provincia === provincia);
    }

    if (valorFiltro !== undefined && valorFiltro !== "" && operadorFiltro) {
      const objetivo = toInt(valorFiltro);
      base = base.filter((r) => evalCond(r.valorInt, operadorFiltro, objetivo));
    }
    return base;
  }, [condiciones, operadorFiltro, valorFiltro, provincia]);

  const [paginationModel, setPaginationModel] = React.useState({
    page: 0,
    pageSize: 5,
  });
  const [selectedCount, setSelectedCount] = React.useState(0);

  const [detailOpen, setDetailOpen] = React.useState(false);
  const [detailRow, setDetailRow] = React.useState<Row | null>(null);
  const [tabSel, setTabSel] = React.useState(0);

  const openDetail = (row: Row) => {
    setDetailRow(row);
    setDetailOpen(true);
    setTabSel(0);
  };
  const closeDetail = () => setDetailOpen(false);

  const columns: GridColDef[] = [
    { field: "ruc", headerName: "RUC", flex: 0.9, minWidth: 140 },
    { field: "nombre", headerName: "Nombre o Razón Social", flex: 1.2, minWidth: 240 },
    { field: "provincia", headerName: "Provincia", flex: 0.9, minWidth: 140 },
    {
      field: "valorInt",
      headerName: "Valor (B/.)",
      type: "number",
      flex: 0.8,
      minWidth: 160,
      renderCell: (params) => fmtMoney.format((params.row as Row).valorInt),
    },
    {
      field: "acciones",
      headerName: "Acciones",
      sortable: false,
      filterable: false,
      align: "center",
      headerAlign: "center",
      minWidth: 140,
      renderCell: (params) => {
        const row = params.row as Row;

        return (
          <Button
            size="small"
            variant="contained"
            onClick={() => openDetail(row)}
          >
            DETALLE
          </Button>
        );
      },
    },
  ];

  const localeText = {
    ...esES.components.MuiDataGrid.defaultProps.localeText,
    toolbarQuickFilterPlaceholder: "Buscar…",
  };

  /* ===========================================
     🔥 PASAR A VERIFICACIÓN + ENVIAR AL HOME
     =========================================== */
  const handleAprobar = async () => {
    const api = apiRef.current;
    if (!api) return;
    const selected = Array.from(api.getSelectedRows().values()) as Row[];

    if (selected.length === 0) {
      await Swal.fire({
        icon: "info",
        title: "Sin selección",
        text: "No hay casos seleccionados para pasar a Verificación.",
        confirmButtonText: "Ok",
      });
      return;
    }

    const { isConfirmed } = await Swal.fire({
      icon: "question",
      title: "¿Pasar a Verificación?",
      html: `Se enviarán <b>${selected.length}</b> caso(s).`,
      showCancelButton: true,
      confirmButtonText: "Sí, confirmar",
      cancelButtonText: "Cancelar",
    });
    if (!isConfirmed) return;

    const conMeta: RowAprobacion[] = selected.map((r) => ({
      ...r,
      metaCategoria: categoria ?? r.categoria,
      metaInconsistencia: inconsistencia ?? undefined,
      metaPrograma: programa ?? null,
      metaActividadEconomica: actividadEconomica ?? [],
      metaPeriodoInicial: periodoInicial ?? null,
      metaPeriodoFinal: periodoFinal ?? null,
    }));

    // Guardar en Aprobaciones
    localStorage.setItem(CASOS_KEY, JSON.stringify(conMeta));
    notifyAprobaciones();

    // 🔥 GUARDAR TAMBIÉN PARA EL HOME
    conMeta.forEach((c) => {
      saveCasoFlujo({
        id: `${c.ruc}-${Date.now()}`, 
        nombre: c.nombre,
        ruc: c.ruc,
        fase: "INICIO DE AUDITORIA",
        estado: "Pendiente",
        deadline: new Date().toISOString(),
        history: [
          {
            idPaso: uuid(),
            
            to: "INICIO DE AUDITORIA",
            by: "Sistema",
            at: new Date().toISOString(),
          },
        ],
      });
    });

    await Swal.fire({
      icon: "success",
      title: "Guardado",
      text: `Se enviaron ${selected.length} caso(s) a Verificación.`,
      confirmButtonText: "Listo",
    });
  };

  return (
    <Box component={Paper} sx={{ mt: 2, pb: 1 }}>
      <DataGrid
        sx={{ height: 420 }}
        apiRef={apiRef}
        rows={rows}
        columns={columns}
        checkboxSelection
        disableRowSelectionOnClick
        isRowSelectable={(params) => !hasEstados(params.row as Row)}
        onRowSelectionModelChange={(m: any) => setSelectedCount(m.length)}
        slots={{ toolbar: CustomToolbar }}
        localeText={localeText}
        pagination
        pageSizeOptions={[5, 10, 25, 50]}
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
      />

      {/* Dialog de Detalle */}
      <Dialog open={detailOpen} onClose={closeDetail} maxWidth="md" fullWidth>
        <DialogTitle>Detalle del caso</DialogTitle>
        <DialogContent dividers>
          {detailRow && (
            <>
              <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                <Stack direction="row" spacing={2}>
                  <Button
                    onClick={() => setTabSel(0)}
                    variant={tabSel === 0 ? "contained" : "text"}
                  >
                    Información
                  </Button>
                  <Button
                    onClick={() => setTabSel(1)}
                    variant={tabSel === 1 ? "contained" : "text"}
                  >
                    Trazabilidad
                  </Button>
                </Stack>
              </Box>

              {tabSel === 0 && (
                <Box sx={{ mt: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <Typography variant="caption">Categoría</Typography>
                      <Box component={Paper} sx={{ p: 1 }}>
                        {categoria || detailRow.categoria}
                      </Box>
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <Typography variant="caption">Inconsistencia</Typography>
                      <Box component={Paper} sx={{ p: 1 }}>
                        {inconsistencia || "—"}
                      </Box>
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <Typography variant="caption">Provincia</Typography>
                      <Box component={Paper} sx={{ p: 1 }}>
                        {detailRow.provincia}
                      </Box>
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <Typography variant="caption">RUC</Typography>
                      <Box component={Paper} sx={{ p: 1 }}>
                        {detailRow.ruc}
                      </Box>
                    </Grid>

                    <Grid item xs={12} md={8}>
                      <Typography variant="caption">Nombre</Typography>
                      <Box component={Paper} sx={{ p: 1 }}>
                        {detailRow.nombre}
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              )}

              {tabSel === 1 && (
                <Box sx={{ mt: 2 }}>
                  <Trazabilidad rows={detailRow.trazas ?? []} height={360} />
                </Box>
              )}
            </>
          )}
        </DialogContent>

        <DialogActions>
          <Button variant="contained" onClick={closeDetail}>
            CERRAR
          </Button>
        </DialogActions>
      </Dialog>

      <Box sx={{ px: 2, py: 1 }}>
        <Button
          size="small"
          variant="contained"
          color="success"
          onClick={handleAprobar}
          disabled={selectedCount === 0}
        >
          Pasar a Verificación
        </Button>
      </Box>
    </Box>
  );
}

/* ===================== Toolbar ===================== */
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

const evalCond = (valor: number, operador: Operador, objetivo: number) => {
  switch (operador) {
    case ">=": return valor >= objetivo;
    case "<=": return valor <= objetivo;
    case "==": return valor === objetivo;
    case "!=": return valor !== objetivo;
    default: return true;
  }
};

const hasEstados = (row: Row) => !!row.trazas && row.trazas.length > 0;
