// src/pages/TablaResultadosEstado.tsx
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
  Grid,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import CloseIcon from "@mui/icons-material/Close";
import VisibilityIcon from "@mui/icons-material/Visibility";

import * as XLSX from "xlsx";
import { calcularSemaforo, diasRestantes, toDDMMYYYY, type FilaEstado } from "../services/mockEstados";

import Trazabilidad, { type TrazaItem } from "../components/Trazabilidad";
import { buildMockTrazas } from "../services/mockTrazas";

type Props = { rows: FilaEstado[] };
type Semaforo = "VERDE" | "AMARILLO" | "ROJO";

type RelacionImpuestoRow = {
  codigoImpuesto: string;
  nombreImpuesto: string;
  montoLiquidado: number;
  respuestaContribuyente: string;
  resolucion: string;
};

const colorDeSemaforo = (s: Semaforo) =>
  s === "VERDE" ? "success" : s === "AMARILLO" ? "warning" : "error";

const money = (n: any) =>
  Number(n ?? 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const safeStr = (v: any) => String(v ?? "").trim();

/** ===================== IMPUESTO PRINCIPAL ===================== */
const getCodigoImpuestoPrincipal = (fila: any): string => {
  // ✅ viene de ConsultasDeEstado (codigoImpuestoPrincipal)
  const direct = safeStr(fila?.codigoImpuestoPrincipal);
  if (direct) return direct;

  // ✅ fallback: primer item de relacionImpuestos
  const rel = Array.isArray(fila?.relacionImpuestos) ? fila.relacionImpuestos : [];
  const cod = safeStr(rel?.[0]?.codigoImpuesto);
  return cod;
};

const getNombreImpuestoPrincipal = (fila: any): string => {
  // Si viene en relacionImpuestos, tomamos el primero (mismo criterio del código)
  const rel = Array.isArray(fila?.relacionImpuestos) ? fila.relacionImpuestos : [];
  const nom = safeStr(rel?.[0]?.nombreImpuesto);
  return nom;
};

const formatCodigoNombreImpuesto = (codigo?: string, nombre?: string) => {
  const c = safeStr(codigo);
  const n = safeStr(nombre);
  if (c && n) return `${c} - ${n}`;
  return n || c || "—";
};

/** ===================== QUEMADO SIN XXX (MÁS EJEMPLOS, DETERMINÍSTICO) ===================== */
const hashSeed = (seed: string) => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h;
};

const pickFrom = <T,>(arr: readonly T[], seed: string) => {
  const h = hashSeed(seed);
  return arr[h % arr.length];
};

const RESPUESTAS_EJEMPLO = [
  "Acepta",
  "Rechazo",
  "Presentación Voluntaria",
  "Solicita Reconsideración",
  "Aporta Sustento / Pruebas",
  "No contesta",
  "Acepta Parcial",
  "Rectifica Declaración",
  "Solicita Prórroga",
  "Pago Parcial",
] as const;

const SERIE_RESOLUCION = [
  (h: number) => `R${20250000 + (h % 9999)}`, // R2025xxxx
  (h: number) => `RES-${2025}${String(h % 9999).padStart(4, "0")}`, // RES-2025xxxx
  (h: number) => `RJ-${2025}-${String(h % 999).padStart(3, "0")}`, // RJ-2025-xxx
  (h: number) => `R${20240000 + (h % 9999)}`, // R2024xxxx
] as const;

const fallbackRespuesta = (seed: string) => pickFrom(RESPUESTAS_EJEMPLO, seed);

const fallbackResolucion = (seed: string) => {
  const h = hashSeed(seed);
  const gen = SERIE_RESOLUCION[h % SERIE_RESOLUCION.length];
  return gen(h);
};

/** ===================== RELACIÓN DE IMPUESTOS (CON RESPUESTA + RESOLUCIÓN) ===================== */
const getRelacionImpuestos = (fila: any): RelacionImpuestoRow[] => {
  const rel = Array.isArray(fila?.relacionImpuestos) ? fila.relacionImpuestos : [];

  return rel.map((x: any) => {
    const codigoImpuesto = safeStr(x?.codigoImpuesto);
    const nombreImpuesto = safeStr(x?.nombreImpuesto);
    const montoLiquidado = Number(x?.montoLiquidado ?? 0);

    // semilla estable por fila (no cambia si cambia el orden)
    const seed = `${codigoImpuesto}|${nombreImpuesto}`.toLowerCase();

    // soportar posibles nombres del backend
    const respuestaRaw =
      x?.respuestaContribuyente ??
      x?.respuesta ??
      x?.respuesta_contribuyente ??
      x?.respuestaContrib ??
      "";

    const resolucionRaw =
      x?.resolucion ??
      x?.numeroResolucion ??
      x?.resolucionNumero ??
      x?.resolucion_numero ??
      "";

    const respuestaContribuyente = safeStr(respuestaRaw) || fallbackRespuesta(seed);
    const resolucion = safeStr(resolucionRaw) || fallbackResolucion(seed);

    return {
      codigoImpuesto,
      nombreImpuesto,
      montoLiquidado,
      respuestaContribuyente,
      resolucion,
    };
  });
};

const TablaResultadosEstado: React.FC<Props> = ({ rows }) => {
  const [openTraza, setOpenTraza] = useState(false);
  const [trazasSeleccionadas, setTrazasSeleccionadas] = useState<TrazaItem[]>([]);
  const [tramiteActual, setTramiteActual] = useState<string | number | null>(null);

  const [detalleHeader, setDetalleHeader] = useState<{
    numeroTramite?: string | number;
    ruc?: string;
    contribuyente?: string;
    actividadActual?: string;

    impuestoProgramaLabel?: string;

    periodoInicial?: string;
    periodoFinal?: string;

    codigoImpuesto?: string;
    nombreImpuesto?: string;
    impuestoPrincipalLabel?: string;

    relacionImpuestos?: RelacionImpuestoRow[];

    montoLiquidadoTotalRuc?: number;
  } | null>(null);

  const [semaforoSeleccionado, setSemaforoSeleccionado] = useState<Semaforo | "">("");

  const handleToggleFiltroSemaforo = useCallback((s: Semaforo) => {
    setSemaforoSeleccionado((prev) => (prev === s ? "" : s));
  }, []);

  const handleVerTrazas = useCallback((fila: FilaEstado) => {
    const anyFila = fila as any;
    const ruc = anyFila?.ruc ?? "";
    const tramite = anyFila?.numeroTramite ?? "";
    const key = `${ruc}|${tramite}`;

    const actividadActual = anyFila?.estado ?? anyFila?.actividadActual ?? "";
    const periodoInicial = anyFila?.periodoInicial ?? "";
    const periodoFinal = anyFila?.periodoFinal ?? "";

    const relacionImpuestos = getRelacionImpuestos(anyFila);

    const codigoImpuesto = getCodigoImpuestoPrincipal(anyFila);
    const nombreImpuesto = getNombreImpuestoPrincipal(anyFila);
    const impuestoPrincipalLabel = formatCodigoNombreImpuesto(codigoImpuesto, nombreImpuesto);

    const impuestoProgramaLabel = safeStr(anyFila?.impuestoProgramaLabel ?? anyFila?.impuestoPrograma ?? "");

    const montoLiquidadoTotalRuc = Number(anyFila?.montoLiquidadoTotalRuc ?? 0);

    setDetalleHeader({
      numeroTramite: tramite ?? "",
      ruc: ruc ?? "",
      contribuyente: anyFila?.contribuyente ?? "",
      actividadActual,
      impuestoProgramaLabel,
      periodoInicial,
      periodoFinal,
      codigoImpuesto,
      nombreImpuesto,
      impuestoPrincipalLabel,
      relacionImpuestos,
      montoLiquidadoTotalRuc,
    });

    setTramiteActual(tramite || "");
    setTrazasSeleccionadas(buildMockTrazas(key));
    setOpenTraza(true);
  }, []);

  const handleCerrarTrazas = useCallback(() => {
    setOpenTraza(false);
    setTramiteActual(null);
    setTrazasSeleccionadas([]);
    setDetalleHeader(null);
  }, []);

  /** ===================== GRID: NORMALIZACIÓN ===================== */
  const gridRowsBase = useMemo(() => {
    return rows.map((r, i) => {
      const anyR = r as any;

      const tipoPersona = anyR.tipoPersona ?? anyR.tipo_persona ?? "";
      const impuestoProgramaLabel = anyR.impuestoProgramaLabel ?? anyR.impuestoPrograma ?? "";

      const codigoImpuestoPrincipal = getCodigoImpuestoPrincipal(anyR);
      const nombreImpuestoPrincipal = getNombreImpuestoPrincipal(anyR);
      const impuestoPrincipalLabel = formatCodigoNombreImpuesto(codigoImpuestoPrincipal, nombreImpuestoPrincipal);

      const montoLiquidadoTotalRuc = Number(anyR.montoLiquidadoTotalRuc ?? 0);

      return {
        id: i,
        ...r,
        tipoPersona,
        impuestoProgramaLabel,
        codigoImpuestoPrincipal,
        nombreImpuestoPrincipal,
        impuestoPrincipalLabel,
        montoLiquidadoTotalRuc,
      };
    });
  }, [rows]);

  /** ===================== GRID: FILTRO POR SEMÁFORO ===================== */
  const gridRows = useMemo(() => {
    if (!semaforoSeleccionado) return gridRowsBase;

    return gridRowsBase.filter((r: any) => {
      const f = r?.fecha;
      if (!f) return false;
      return (calcularSemaforo(f) as Semaforo) === semaforoSeleccionado;
    });
  }, [gridRowsBase, semaforoSeleccionado]);

  /** ===================== RESUMEN ===================== */
  const resumenSemaforos = useMemo(() => {
    let rojo = 0;
    let amarillo = 0;
    let verde = 0;

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

  /** ===================== EXCEL GENERAL ===================== */
  const exportar = () => {
    const data = (gridRows as any[]).map((r) => ({
      "No Trámite": r.numeroTramite ?? "",
      RUC: r.ruc ?? "",
      "Nombre / Razón Social": r.contribuyente ?? "",
      "Tipo de Persona": r.tipoPersona ?? "",
      Estado: r.estado ?? "",
      "Código-Impuesto": r.impuestoPrincipalLabel ?? "",
      Programa: r.impuestoProgramaLabel ?? "",
      "Periodo Inicial": r.periodoInicial ?? "",
      "Periodo Final": r.periodoFinal ?? "",
      Fecha: toDDMMYYYY(r.fecha ?? ""),
      Semáforo: r.fecha ? calcularSemaforo(r.fecha) : "",
      "Días restantes": r.fecha ? diasRestantes(r.fecha) : "",
      "Monto liquidado (RUC)": Number(r.montoLiquidadoTotalRuc ?? 0),
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Resultados");
    XLSX.writeFile(wb, "consulta_estado.xlsx");
  };

  /** ===================== EXCEL DETALLE ===================== */
  const exportarDetalle = () => {
    if (!detalleHeader) return;

    const encabezado = [
      {
        "No Trámite": detalleHeader.numeroTramite ?? "",
        RUC: detalleHeader.ruc ?? "",
        Contribuyente: detalleHeader.contribuyente ?? "",
        "Actividad Actual": detalleHeader.actividadActual ?? "",
        "Código Impuesto": detalleHeader.impuestoPrincipalLabel ?? "",
        Programa: detalleHeader.impuestoProgramaLabel ?? "",
        "Periodo Inicial": detalleHeader.periodoInicial ?? "",
        "Periodo Final": detalleHeader.periodoFinal ?? "",
        "Monto liquidado (RUC)": Number(detalleHeader.montoLiquidadoTotalRuc ?? 0),
      },
    ];

    const relacion = (detalleHeader.relacionImpuestos ?? []).map((x) => ({
      Código: safeStr(x.codigoImpuesto),
      Impuesto: safeStr(x.nombreImpuesto),
      "Monto liquidado": Number(x.montoLiquidado ?? 0),
      "Respuesta Contribuyente": safeStr(x.respuestaContribuyente),
      Resolución: safeStr(x.resolucion),
    }));

    const ws1 = XLSX.utils.json_to_sheet(encabezado);
    const ws2 = XLSX.utils.json_to_sheet(
      relacion.length
        ? relacion
        : [{ Código: "", Impuesto: "", "Monto liquidado": "", "Respuesta Contribuyente": "", Resolución: "" }]
    );

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws1, "Encabezado");
    XLSX.utils.book_append_sheet(wb, ws2, "RelacionImpuestos");

    const num = String(detalleHeader.numeroTramite ?? "sin_numero").replace(/[^\w-]/g, "_");
    XLSX.writeFile(wb, `detalle_tramite_${num}.xlsx`);
  };

  /** ===================== COLUMNAS GRID ===================== */
  const columns = useMemo<GridColDef[]>(
    () => [
      { field: "numeroTramite", headerName: "No Trámite", width: 140 },
      { field: "ruc", headerName: "RUC", width: 140 },
      {
        field: "contribuyente",
        headerName: "Nombre / Razón Social",
        flex: 1,
        minWidth: 260,
      },
      { field: "tipoPersona", headerName: "Tipo de Persona", width: 160 },
      { field: "estado", headerName: "Estado", width: 220 },

      {
        field: "impuestoPrincipalLabel",
        headerName: "Código Impuesto",
        width: 260,
        renderCell: (p: any) => {
          const label = safeStr(p?.row?.impuestoPrincipalLabel);
          return label || "—";
        },
      },

      {
        field: "impuestoProgramaLabel",
        headerName: "Programa",
        width: 420,
        renderCell: (p: any) => {
          const nom = safeStr(p?.row?.impuestoProgramaLabel);
          return nom || "—";
        },
      },

      {
        field: "montoLiquidadoTotalRuc",
        headerName: "Monto liquidado",
        type: "number",
        width: 170,
      },

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

      {
        field: "semaforo",
        headerName: "Semáforo",
        width: 170,
        sortable: false,
        filterable: false,
        renderCell: (p) => {
          const f = (p as any)?.row?.fecha as string | undefined;
          if (!f) return null;
          const s = calcularSemaforo(f) as Semaforo;
          const d = diasRestantes(f);
          return <Chip label={`${d} días`} color={colorDeSemaforo(s)} size="small" variant="filled" />;
        },
      },

      {
        field: "accion",
        headerName: "Ver",
        width: 90,
        sortable: false,
        filterable: false,
        align: "center",
        headerAlign: "center",
        renderCell: (params) => {
          const fila = params.row as FilaEstado;
          return (
            <Tooltip title="Ver detalle">
              <IconButton
                size="small"
                color="primary"
                onClick={() => handleVerTrazas(fila)}
                aria-label="Ver detalle"
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

  return (
    <Box>
      <br />
      <br />

      {/* Resumen + chips */}
      <Box display="flex" alignItems="center" justifyContent="space-between" gap={2} mb={1} flexWrap="wrap">
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          <Typography variant="body2" sx={{ mr: 1 }}>
            Filtro: <b>{semaforoSeleccionado || "TODOS"}</b> | Total: <b>{resumenSemaforos.total}</b>
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

          {semaforoSeleccionado ? (
            <Button size="small" variant="text" onClick={() => setSemaforoSeleccionado("")}>
              Ver TODOS
            </Button>
          ) : null}
        </Stack>

        <Button variant="outlined" onClick={exportar}>
          Descargar Excel
        </Button>
      </Box>

      <div style={{ height: 520, width: "100%" }}>
        <DataGrid
          rows={gridRows}
          columns={columns}
          density="compact"
          disableRowSelectionOnClick
          pageSizeOptions={[10, 25, 50]}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
        />
      </div>

      {/* Dialog Ver */}
      <Dialog open={openTraza} onClose={handleCerrarTrazas} maxWidth="md" fullWidth>
        <DialogTitle sx={{ m: 0, p: 2 }}>
          Detalle

          {/* ✅ Botón Excel Detalle */}
          <Stack direction="row" spacing={1} sx={{ position: "absolute", right: 52, top: 10 }}>
            <Button size="small" variant="outlined" onClick={exportarDetalle}>
              Descargar Excel (Detalle)
            </Button>
          </Stack>

          <IconButton aria-label="close" onClick={handleCerrarTrazas} sx={{ position: "absolute", right: 8, top: 8 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          {detalleHeader && (
            <Box mb={2}>
              <Grid container spacing={1}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2">
                    <b>No Trámite:</b> {detalleHeader.numeroTramite ?? ""}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2">
                    <b>RUC:</b> {detalleHeader.ruc ?? ""}
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="body2">
                    <b>Nombre / Razón Social:</b> {detalleHeader.contribuyente ?? ""}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="body2">
                    <b>Código Impuesto :</b> {detalleHeader.impuestoPrincipalLabel || "—"}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="body2">
                    <b>Programa:</b> {detalleHeader.impuestoProgramaLabel || "—"}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="body2">
                    <b>Periodo Inicial:</b> {detalleHeader.periodoInicial || "—"}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2">
                    <b>Periodo Final:</b> {detalleHeader.periodoFinal || "—"}
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="body2">
                    <b>Actividad Actual:</b> {detalleHeader.actividadActual ?? ""}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="body2">
                    <b>Monto liquidado (RUC):</b> {money(detalleHeader.montoLiquidadoTotalRuc ?? 0)}
                  </Typography>
                </Grid>

                {/* Relación de impuestos (como el HTML) */}
                <Grid item xs={12}>
                  <Paper variant="outlined" sx={{ mt: 1, p: 1.5, borderRadius: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, textAlign: "center", fontWeight: 700 }}>
                      Relación de impuestos
                    </Typography>

                    <Table
                      size="small"
                      sx={{
                        border: "1px solid #000",
                        "& th, & td": { borderBottom: "1px solid #000" },
                        "& th": { fontWeight: 700 },
                      }}
                    >
                      <TableHead>
                        <TableRow>
                          <TableCell>Código</TableCell>
                          <TableCell>Impuesto</TableCell>
                          <TableCell align="right">Monto liquidado</TableCell>
                          <TableCell>Respuesta Contribuyente</TableCell>
                          <TableCell>Resolución</TableCell>
                        </TableRow>
                      </TableHead>

                      <TableBody>
                        {(detalleHeader.relacionImpuestos ?? []).length ? (
                          (detalleHeader.relacionImpuestos ?? []).map((x, idx) => {
                            const cod = safeStr(x.codigoImpuesto) || "—";
                            const imp = safeStr(x.nombreImpuesto) || "—";
                            const resp = safeStr(x.respuestaContribuyente) || fallbackRespuesta(`${cod}|${imp}`.toLowerCase());
                            const res = safeStr(x.resolucion) || fallbackResolucion(`${cod}|${imp}`.toLowerCase());

                            return (
                              <TableRow key={idx}>
                                <TableCell>{cod}</TableCell>
                                <TableCell>{imp}</TableCell>
                                <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                                  {money(x.montoLiquidado)}
                                </TableCell>
                                <TableCell>{resp}</TableCell>
                                <TableCell>{res}</TableCell>
                              </TableRow>
                            );
                          })
                        ) : (
                          <TableRow>
                            <TableCell colSpan={5}>—</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}

          {trazasSeleccionadas && trazasSeleccionadas.length > 0 ? (
            <Trazabilidad rows={trazasSeleccionadas} height={420} />
          ) : (
            <Typography variant="body2">No hay trazabilidad registrada para este trámite.</Typography>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default TablaResultadosEstado;
