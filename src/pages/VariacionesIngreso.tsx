// VariacionesIngreso.tsx
import React, { useMemo, useState } from "react";
import {
  Box,
  Grid,
  Paper,
  Typography,
  TextField,
  MenuItem,
  IconButton,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Stack,
  Tooltip,
  Divider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import Swal from "sweetalert2";

// ---------- Catálogos ----------
const CATEGORIAS = [
  "Todos",
  "Grandes Contribuyentes",
  "Fiscalización Masiva",
  "Auditoría Sectorial",
] as const;

const TIPOS = ["Todos", "Persona Física y Natural", "Persona Jurídica"] as const;

type Actividad = { code: string; label: string };
const ACTIVIDADES: Actividad[] = [
  { code: "9609", label: "9609  Otras actividades de servicios, n.c.p." },
  { code: "9521", label: "9521  Reparación y mantenimiento de aparatos de consumo eléctrico" },
  { code: "9602", label: "9602  Actividades de peluquería y otros tratamientos de belleza" },
  { code: "4711", label: "4711  Venta al por menor en almacenes no especializados..." },
  { code: "6201", label: "6201  Actividades de programación informática" },
];

// 🔥 Datos quemados (a propósito en any)
const DATA_EJEMPLO: any[] = [
  { categoria: "Grandes Contribuyentes", tipo: "Persona Jurídica", ruc: "111000", nombre: "Electro Panamá S.A.", codActividad: "9521", impuesto: "ISR", periodos: { 2025: 450000, 2024: 400000, 2023: 350000 } },
  { categoria: "Fiscalización Masiva", tipo: "Persona Física y Natural", ruc: "222000", nombre: "Servicios Hogar PF", codActividad: "9521", impuesto: "ISR", periodos: { 2025: 90000, 2023: 80000, 2022: 75000 } },
  { categoria: "Auditoría Sectorial", tipo: "Persona Jurídica", ruc: "333000", nombre: "TecnoHome S.A.", codActividad: "9521", impuesto: "ISR", periodos: { 2025: 250000, 2023: 210000, 2022: 200000 } },
  { categoria: "Grandes Contribuyentes", tipo: "Persona Jurídica", ruc: "654654", nombre: "Compañía xyz", codActividad: "9609", impuesto: "ISR", periodos: { 2025: 1000000, 2024: 900000, 2023: 850000, 2022: 200000 } },
  { categoria: "Fiscalización Masiva", tipo: "Persona Física y Natural", ruc: "789012", nombre: "Juan Pérez", codActividad: "4711", impuesto: "ISR", periodos: { 2025: 120000, 2024: 100000 } },
  { categoria: "Auditoría Sectorial", tipo: "Persona Jurídica", ruc: "112233", nombre: "Inversiones ABC", codActividad: "6201", impuesto: "ISR", periodos: { 2025: 800000, 2024: 600000 } },
];

// ---------- Tipos ----------
type PeriodoValores = Record<number, number | null>;

type ParDetalle = {
  p1: number; p2: number;
  v1: number; v2: number;
  B: number;
  pct: number | null;
};

type Row = {
  ruc: string;
  nombre: string;
  impuesto: string;
  valores: PeriodoValores;
  B: number | null;
  pct: number | null;
  promedioB: number | null;
  detalles: ParDetalle[];
  maxIngreso: number | null;
};

// ---------- Helpers ----------
const money = (n: number | null | undefined): string =>
  n === undefined || n === null ? "" : n.toLocaleString("es-PA", { maximumFractionDigits: 0 });

const percent = (v: number | null | undefined): string =>
  v === undefined || v === null ? "" :
    (v * 100).toLocaleString("es-PA", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "%";

const getActividadCode = (label: string): string => (label ? label.slice(0, 4) : "");

// ---------- Componente ----------
export default function VariacionesIngreso() {
  // Filtros
  const [categoria, setCategoria] = useState<(typeof CATEGORIAS)[number]>("Grandes Contribuyentes");
  const [tipo, setTipo] = useState<(typeof TIPOS)[number]>("Persona Jurídica");
  const [actividad, setActividad] = useState<string>(ACTIVIDADES[0]?.label || "");
  const [ruc, setRuc] = useState<string>("");

  // Criterios
  const [pctMin, setPctMin] = useState<number>(-15);
  const [pctMax, setPctMax] = useState<number>(15);
  const [ingresoMayorIgual, setIngresoMayorIgual] = useState<number>(1000000);

  // Periodos (desc)
  const [periodos, setPeriodos] = useState<number[]>([2025, 2024]);

  // Resultado
  const [rows, setRows] = useState<Row[]>([]);

  // Modal Variaciones
  const [dlgOpen, setDlgOpen] = useState<boolean>(false);
  const [dlgData, setDlgData] = useState<{ ruc: string; nombre: string; detalles: ParDetalle[] } | null>(null);

  // Validaciones
  const ordenDescValido = useMemo(() => {
    if (periodos.length === 0) return false;
    for (let i = 1; i < periodos.length; i++) {
      if (!(Number(periodos[i - 1]) > Number(periodos[i]))) return false;
    }
    return true;
  }, [periodos]);

  const periodosUnicos = useMemo(() => new Set(periodos).size === periodos.length, [periodos]);
  const puedeConsultar = ordenDescValido && periodosUnicos && periodos.length >= 1;

  // Acciones periodos
  const addPeriodo = () => {
    if (periodos.length === 0) { setPeriodos([new Date().getFullYear()]); return; }
    const next = Number(periodos[periodos.length - 1]) - 1;
    if (!periodos.includes(next)) setPeriodos([...periodos, next]);
    else { let y = next - 1; while (periodos.includes(y)) y--; setPeriodos([...periodos, y]); }
  };

  const updatePeriodo = (idx: number, value: string) => {
    const v = Number(String(value).slice(0, 4));
    const copy = [...periodos];
    if (Number.isFinite(v)) { copy[idx] = v; setPeriodos(copy); }
    else { setPeriodos(copy.filter((_, i) => i !== idx)); }
  };

  const removePeriodo = (idx: number) => setPeriodos(periodos.filter((_, i) => i !== idx));

  const limpiar = () => {
    setCategoria("Grandes Contribuyentes");
    setTipo("Persona Jurídica");
    setActividad(ACTIVIDADES[0]?.label || "");
    setRuc("");
    setPctMin(-15);
    setPctMax(15);
    setIngresoMayorIgual(1000000);
    setPeriodos([2025, 2024]);
    setRows([]);
  };

  // ---------------- CONSULTAR ----------------
  const consultar = () => {
    const codAct = getActividadCode(actividad);

    let data = DATA_EJEMPLO.filter((d) => d.impuesto === "ISR");
    if (categoria !== "Todos") data = data.filter((d) => d.categoria === categoria);
    if (tipo !== "Todos") data = data.filter((d) => d.tipo === tipo);
    if (codAct) data = data.filter((d) => d.codActividad === codAct);
    if (ruc.trim()) data = data.filter((d) => String(d.ruc).includes(ruc.trim()));

    const out: Row[] = data.map((d) => {
      const pmap = d.periodos as Record<number, number>;

      const vals: PeriodoValores = {};
      periodos.forEach((p) => { vals[p] = pmap?.[p] ?? null; });

      const pares: ParDetalle[] = [];
      for (let i = 0; i < periodos.length - 1; i++) {
        const p1 = periodos[i], p2 = periodos[i + 1];
        const v1 = pmap?.[p1], v2 = pmap?.[p2];
        if (typeof v1 === "number" && typeof v2 === "number") {
          const B = v1 - v2;
          const pct = v2 !== 0 ? B / v2 : null;
          pares.push({ p1, p2, v1, v2, B, pct });
        }
      }

      let B: number | null = null, pct: number | null = null;
      if (pares.length > 0) { B = pares[0].B; pct = pares[0].pct; }

      const promedioB = pares.length > 0
        ? Math.round(pares.reduce((acc, it) => acc + it.B, 0) / pares.length)
        : null;

      const maxIngreso = Math.max(...Object.values(pmap || {}).map((x) => Number(x) || 0));

      return {
        ruc: d.ruc as string,
        nombre: d.nombre as string,
        impuesto: d.impuesto as string,
        valores: vals,
        B, pct,
        promedioB,
        detalles: pares,
        maxIngreso: isFinite(maxIngreso) ? maxIngreso : null,
      };
    });

    setRows(out);
  };

  const confirmarYAccionar = async (m: "Aprobado" | "Rechazar" | "Descargar") => {
    const textos: Record<"Aprobado" | "Rechazar" | "Descargar", string> = {
      Aprobado: "Se aprobaron.", Rechazar: "Se Rechazo.", Descargar: "Se generará el documento.",
    };

    const { isConfirmed } = await Swal.fire({
      title: "¿Está seguro?", text: textos[m], icon: "warning",
      showCancelButton: true, confirmButtonText: "Sí", cancelButtonText: "Cancelar",
      reverseButtons: true, focusCancel: true,
    });
    if (!isConfirmed) return;

    await Swal.fire({ title: "Hecho", text: m, icon: "success", timer: 1200, showConfirmButton: false });
  };

  // Umbrales en fracción
  const minFrac = pctMin / 100;
  const maxFrac = pctMax / 100;

  // Abrir modal
  const verVariaciones = (row: Row) => {
    setDlgData({ ruc: row.ruc, nombre: row.nombre, detalles: row.detalles });
    setDlgOpen(true);
  };

  return (
    <Paper sx={{ p: 2 }}>
      {/* <Typography variant="h6" sx={{ mb: 1 }}>
        Análisis variaciones Ingresos declarados ISR
      </Typography> */}

      {/* filtros */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Grid container spacing={1}>
            <Grid item xs={6}><Typography fontWeight={600}>Categoría de Contribuyente</Typography></Grid>
            <Grid item xs={6}>
              <TextField select fullWidth size="small" value={categoria}
                onChange={(e) => setCategoria(e.target.value as (typeof CATEGORIAS)[number])}>
                {CATEGORIAS.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </TextField>
            </Grid>

            <Grid item xs={6}><Typography fontWeight={600}>Tipo de Contribuyente</Typography></Grid>
            <Grid item xs={6}>
              <TextField select fullWidth size="small" value={tipo}
                onChange={(e) => setTipo(e.target.value as (typeof TIPOS)[number])}>
                {TIPOS.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </TextField>
            </Grid>

            <Grid item xs={6}><Typography fontWeight={600}>RUC</Typography></Grid>
            <Grid item xs={6}>
              <TextField fullWidth size="small" value={ruc} onChange={(e) => setRuc(e.target.value)} placeholder="Opcional" />
            </Grid>
            <Grid item xs={6}><Typography>Valor ingresos Mayor igual a $</Typography></Grid>
            <Grid item xs={6}>
              <TextField size="small" fullWidth type="number" value={ingresoMayorIgual}
                onChange={(e) => setIngresoMayorIgual(Number(e.target.value))} />
            </Grid>
            <Grid item xs={6}><Typography>% Mínimo - Menor igual a (-)</Typography></Grid>
            <Grid item xs={6}>
              <TextField size="small" fullWidth type="number" inputProps={{ step: "0.01" }}
                value={pctMin} onChange={(e) => setPctMin(Number(e.target.value))} />
            </Grid>

            <Grid item xs={6}><Typography>% Máximo - Mayor igual a (+)</Typography></Grid>
            <Grid item xs={6}>
              <TextField size="small" fullWidth type="number" inputProps={{ step: "0.01" }}
                value={pctMax} onChange={(e) => setPctMax(Number(e.target.value))} />
            </Grid>


          </Grid>
        </Grid>

        <Grid item xs={12} md={6}>
          <Grid container spacing={1} alignItems="center">
            <Grid item xs={6}><Typography fontWeight={600}>Actividad Económica Principal</Typography></Grid>
            <Grid item xs={6}>
              <TextField select fullWidth size="small" value={actividad} onChange={(e) => setActividad(e.target.value)}>
                {ACTIVIDADES.map((a) => <MenuItem key={a.code} value={a.label}>{a.label}</MenuItem>)}
              </TextField>
            </Grid>

            <Grid item xs={6}><Typography fontWeight={600}>Periodos a comparar:</Typography></Grid>
            <Grid item xs={6}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Tooltip title="Agregar periodo (año anterior)">
                  <IconButton color="primary" onClick={addPeriodo}><AddCircleIcon /></IconButton>
                </Tooltip>
                <Typography variant="body2">Agregar periodo</Typography>
              </Stack>
            </Grid>

            <Grid item xs={12}>
              <Stack spacing={1}>
                {periodos.map((p, idx) => (
                  <Stack key={`${p}-${idx}`} direction="row" spacing={1} alignItems="center">
                    <TextField label={`Periodo ${idx + 1}`} size="small" type="number" value={p}
                      onChange={(e) => updatePeriodo(idx, e.target.value)} inputProps={{ min: 1900, max: 2100 }} />
                    <IconButton onClick={() => removePeriodo(idx)} color="error" size="small"><DeleteOutlineIcon /></IconButton>
                  </Stack>
                ))}
                {!ordenDescValido && periodos.length > 0 && (
                  <Alert severity="warning">Los periodos deben estar en <b>orden descendente</b> y sin empates (ej. 2025, 2024, 2023…).</Alert>
                )}
                {!periodosUnicos && <Alert severity="warning">Hay años repetidos.</Alert>}
              </Stack>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      <Divider sx={{ my: 2 }} />

      <Stack direction="row" spacing={1} sx={{ mt: 2, justifyContent: "flex-end" }}>
        <Button variant="contained" onClick={consultar} disabled={!puedeConsultar}>CONSULTAR</Button>
        <Button variant="outlined" color="inherit" onClick={limpiar}>LIMPIAR</Button>
      </Stack>

      {/* Tabla principal */}
      <Box sx={{ mt: 3 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell align="center" colSpan={3} sx={{ fontWeight: 700 }} />
              <TableCell align="center" colSpan={periodos.length} sx={{ fontWeight: 700 }} />
              <TableCell align="center" sx={{ fontWeight: 700 }}>
                PROMEDIO VARIACIONES
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>
                {/* Columna del botón */}
              </TableCell>
              {/* 🔻 Se elimina el grupo “Variación” (B y %) */}
            </TableRow>
            <TableRow>
              <TableCell>RUC</TableCell>
              <TableCell>Nombre Contribuyente</TableCell>
              <TableCell>Ingresos declarados</TableCell>
              {periodos.map((y) => (
                <TableCell key={`h-${y}`} align="right">
                  {y}
                </TableCell>
              ))}
              <TableCell align="right">$</TableCell>
              <TableCell align="center">{/* botón */}</TableCell>
              {/* 🔻 Se quitan cabeceras B y % */}
            </TableRow>
          </TableHead>

          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                {/* 3 fijas + N periodos + 1 promedio + 1 botón = 5 + N */}
                <TableCell colSpan={5 + periodos.length} align="center">
                  Sin resultados. Ajusta filtros y pulsa <b>Consultar</b>.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => {
                const minFrac = pctMin / 100;
                const maxFrac = pctMax / 100;
                const excedePct = r.pct !== null && (r.pct >= maxFrac || r.pct <= -Math.abs(minFrac));
                const excedeIngreso = (r.maxIngreso ?? 0) >= ingresoMayorIgual;
                const danger = excedePct || excedeIngreso;

                return (
                  <TableRow key={r.ruc} sx={{ bgcolor: danger ? "rgba(255,0,0,0.08)" : "inherit" }}>
                    <TableCell>{r.ruc}</TableCell>
                    <TableCell>{r.nombre}</TableCell>
                    <TableCell>{r.impuesto}</TableCell>
                    {periodos.map((y) => (
                      <TableCell key={`${r.ruc}-${y}`} align="right">
                        {money(r.valores[y])}
                      </TableCell>
                    ))}
                    <TableCell align="right">{money(r.promedioB)}</TableCell>
                    <TableCell align="center">
                      <Button size="small" variant="contained" onClick={() => verVariaciones(r)}>
                        VER VARIACIONES
                      </Button>
                    </TableCell>
                    {/* 🔻 Ya no se muestran B ni % aquí */}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Box>


      <Grid item xs={12} display="flex" gap={2} justifyContent="center" mt={3} mb={1}>
        <Button variant="contained" onClick={() => confirmarYAccionar("Aprobado")}>APROBAR</Button>
        <Button variant="contained" onClick={() => confirmarYAccionar("Rechazar")}>RECHAZAR</Button>
        <Button variant="contained" onClick={() => confirmarYAccionar("Descargar")}>DESCARGAR REPORTE</Button>
      </Grid>

      {/* Modal de variaciones */}
      <Dialog open={dlgOpen} onClose={() => setDlgOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Variaciones — {dlgData?.ruc} • {dlgData?.nombre}
        </DialogTitle>
        <DialogContent dividers>
          {dlgData && dlgData.detalles.length > 0 ? (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell align="center" width={60}>#</TableCell>
                  <TableCell>Descripción</TableCell>
                  <TableCell align="right">PERIODO 1</TableCell>
                  <TableCell align="right">PERIODO 2</TableCell>
                  <TableCell align="right">B</TableCell>
                  <TableCell align="right">%</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dlgData.detalles.map((d, i) => (
                  <TableRow key={`${d.p1}-${d.p2}-${i}`}>
                    <TableCell align="center">{i + 1}</TableCell>
                    <TableCell>{`Variación ${d.p1} - ${d.p2}`}</TableCell>
                    <TableCell align="right">{money(d.v1)}</TableCell>
                    <TableCell align="right">{money(d.v2)}</TableCell>
                    <TableCell align="right">{money(d.B)}</TableCell>
                    <TableCell align="right">{percent(d.pct)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Typography variant="body2">No hay pares de periodos suficientes para calcular variaciones.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDlgOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
