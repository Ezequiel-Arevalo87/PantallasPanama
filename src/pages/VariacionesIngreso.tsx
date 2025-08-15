

// FluctuacionesIngresos.jsx
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
  Alert
} from "@mui/material";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

// ---------- Catálogos ----------
const CATEGORIAS = [
  "Todos",
  "Grandes Contribuyentes",
  "Fiscalización Masiva",
  "Auditoría Sectorial",
];

const TIPOS = ["Todos", "Persona Física y Natural", "Persona Jurídica"];

// Pega tu lista completa aquí.
// Mantén { code, label } donde label es "0000  Descripción..."
const ACTIVIDADES = [
  { code: "9609", label: "9609  Otras actividades de servicios, n.c.p." },
  { code: "9521", label: "9521  Reparación y mantenimiento de aparatos de consumo eléctrico" },
  { code: "9602", label: "9602  Actividades de peluquería y otros tratamientos de belleza" },
  { code: "4711", label: "4711  Venta al por menor en almacenes no especializados..." },
  { code: "6201", label: "6201  Actividades de programación informática" },
  // 👉 Agrega el resto de tu listado largo aquí
];

// 🔥 Datos quemados para pruebas
const DATA_EJEMPLO: any[] = [
  // 9521 – tres categorías
  { categoria: "Grandes Contribuyentes", tipo: "Persona Jurídica", ruc: "111000", nombre: "Electro Panamá S.A.", codActividad: "9521", impuesto: "ISR", periodos: { 2025: 450000, 2024: 400000, 2023: 350000 } },
  { categoria: "Fiscalización Masiva",  tipo: "Persona Física y Natural", ruc: "222000", nombre: "Servicios Hogar PF",     codActividad: "9521", impuesto: "ISR", periodos: { 2025:  90000, 2023:  80000, 2022:  75000 } },
  { categoria: "Auditoría Sectorial",   tipo: "Persona Jurídica",        ruc: "333000", nombre: "TecnoHome S.A.",         codActividad: "9521", impuesto: "ISR", periodos: { 2025: 250000, 2023: 210000, 2022: 200000 } },

  // 9609
  { categoria: "Grandes Contribuyentes", tipo: "Persona Jurídica", ruc: "654654", nombre: "Compañía xyz",  codActividad: "9609", impuesto: "ISR", periodos: { 2025: 1000000, 2024: 900000, 2022: 850000 } },
  // 4711
  { categoria: "Fiscalización Masiva",   tipo: "Persona Física y Natural", ruc: "789012", nombre: "Juan Pérez", codActividad: "4711", impuesto: "ISR", periodos: { 2025: 120000, 2024: 100000 } },
  // 6201
  { categoria: "Auditoría Sectorial",    tipo: "Persona Jurídica", ruc: "112233", nombre: "Inversiones ABC", codActividad: "6201", impuesto: "ISR", periodos: { 2025: 800000, 2024: 600000 } },
];


// ---------- Datos de ejemplo (tres categorías) ----------
/*
  Estructura:
  - categoria
  - tipo
  - ruc
  - nombre
  - codActividad
  - impuesto ("ISR" aquí, puedes admitir ITBMS si lo necesitas)
  - periodos: { [año]: monto }
*/


// ---------- Helpers ----------
const money = (n:any) =>
  n === undefined || n === null
    ? ""
    : n.toLocaleString("es-PA", { maximumFractionDigits: 0 });

const percent = (v:any) =>
  v === undefined || v === null
    ? ""
    : (v * 100).toLocaleString("es-PA", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }) + "%";

const getActividadCode = (label:any) => (label ? label.slice(0, 4) : "");

// ---------- Componente ----------
export default function VariacionesIngreso() {
  // Filtros
  const [categoria, setCategoria] = useState("Grandes Contribuyentes");
  const [tipo, setTipo] = useState("Persona Jurídica");
  const [actividad, setActividad] = useState(ACTIVIDADES[0]?.label || "");
  const [ruc, setRuc] = useState("");

  // Criterios (puedes fijarlos si es solo visual)
  const [pctMin, setPctMin] = useState(-15); // 15% en negativo (mostrar en rojo)
  const [pctMax, setPctMax] = useState(15); // 15% en positivo (mostrar en rojo)
  const [ingresoMayorIgual, setIngresoMayorIgual] = useState(1000000);

  // Periodos (descendentes)
  const [periodos, setPeriodos] = useState([2025, 2024]);

  // Resultado de la consulta
  const [rows, setRows] = useState<any>([]);

  // Validación descendente estricta
  const ordenDescValido = useMemo(() => {
    if (periodos.length === 0) return false;
    for (let i = 1; i < periodos.length; i++) {
      if (!(Number(periodos[i - 1]) > Number(periodos[i]))) return false;
    }
    return true;
  }, [periodos]);

  const periodosUnicos = useMemo(() => {
    return new Set(periodos).size === periodos.length;
  }, [periodos]);

  const puedeConsultar = ordenDescValido && periodosUnicos && periodos.length >= 1;

  // Acciones
  const addPeriodo = () => {
    if (periodos.length === 0) {
      setPeriodos([new Date().getFullYear()]);
      return;
    }
    const next = Number(periodos[periodos.length - 1]) - 1;
    if (!periodos.includes(next)) {
      setPeriodos([...periodos, next]);
    } else {
      // si se repite, resta uno más
      let y = next - 1;
      while (periodos.includes(y)) y--;
      setPeriodos([...periodos, y]);
    }
  };

  const updatePeriodo = (idx:any, value:any) => {
    const v = value ? Number(String(value).slice(0, 4)) : "";
    const copy:any = [...periodos];
    copy[idx] = v;
    setPeriodos(copy.filter((x:any) => x !== "")); // elimina vacíos
  };

  const removePeriodo = (idx:any) => {
    setPeriodos(periodos.filter((_, i) => i !== idx));
  };

  const limpiar = () => {
    setCategoria("Grandes Contribuyentes");
    setTipo("Persona Jurídica");
    setActividad(ACTIVIDADES[0]?.label || "");
    setRuc("");
    setPctMin(0.15);
    setPctMax(0.15);
    setIngresoMayorIgual(1000000);
    setPeriodos([2025, 2024]);
    setRows([]);
  };

// Tipos (ponlos arriba del componente o en tus types)
type PeriodosMap = Record<number, number>;
type Row = {
  ruc: string;
  nombre: string;
  impuesto: string;
  valores: Record<number, number | null>;
  B: number | null;
  pct: number | null;
  maxIngreso: number | null;
};

// Helper seguro para extraer solo números
const numbersFrom = (obj: Record<string | number, unknown>): number[] =>
  Object.values(obj).filter((v): v is number => typeof v === "number");
const consultar = () => {
  const codAct = getActividadCode(actividad);


  let data: any[] = DATA_EJEMPLO.filter((d: any) => d.impuesto === "ISR");

 
  if (categoria !== "Todos") data = data.filter((d: any) => d.categoria === categoria);
  if (tipo !== "Todos")      data = data.filter((d: any) => d.tipo === tipo);
  if (codAct)                data = data.filter((d: any) => d.codActividad === codAct);
  if (ruc.trim())            data = data.filter((d: any) => String(d.ruc).includes(ruc.trim()));


  const out = data.map((d: any) => {

    const vals: any = {};
    periodos.forEach((p: any) => {
      vals[p] = d.periodos?.[p] ?? null;
    });

    let B: any = null;
    let pct: any = null;
    if (periodos.length >= 2) {
      const p1 = periodos[0], p2 = periodos[1];
      const v1 = d.periodos?.[p1]; const v2 = d.periodos?.[p2];
      if (typeof v1 === "number" && typeof v2 === "number") {
        B = v1 - v2;
        pct = v2 !== 0 ? B / v2 : null;
      }
    }

   
    const maxIngreso = Math.max(...Object.values(d.periodos || {}).map((x: any) => Number(x) || 0));

    return {
      ruc: d.ruc,
      nombre: d.nombre,
      impuesto: d.impuesto,
      valores: vals,
      B,
      pct,
      maxIngreso: isFinite(maxIngreso) ? maxIngreso : null,
    };
  });

  setRows(out);
};

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>
        Análisis variaciones Ingresos declarados ISR
      </Typography>

      <Grid container spacing={2}>
    
        <Grid item xs={12} md={6}>
          <Grid container spacing={1}>
            <Grid item xs={6}>
              <Typography fontWeight={600}>Categoría de Contribuyente</Typography>
            </Grid>
            <Grid item xs={6}>
              <TextField
                select
                fullWidth
                size="small"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
              >
                {CATEGORIAS.map((c) => (
                  <MenuItem key={c} value={c}>
                    {c}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={6}>
              <Typography fontWeight={600}>Tipo de Contribuyente</Typography>
            </Grid>
            <Grid item xs={6}>
              <TextField
                select
                fullWidth
                size="small"
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
              >
                {TIPOS.map((t) => (
                  <MenuItem key={t} value={t}>
                    {t}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={6}>
              <Typography fontWeight={600}>RUC</Typography>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                size="small"
                value={ruc}
                onChange={(e) => setRuc(e.target.value)}
                placeholder="Opcional"
              />
            </Grid>

            <Grid item xs={6}>
              <Typography>% Mínimo - Menor igual a (-)</Typography>
            </Grid>
            <Grid item xs={6}>
              <TextField
                size="small"
                fullWidth
                type="number"
                inputProps={{ step: "0.01" }}
                value={pctMin}
                onChange={(e) => setPctMin(Number(e.target.value))}
              />
            </Grid>

            <Grid item xs={6}>
              <Typography>% Máximo - Mayor igual a (+)</Typography>
            </Grid>
            <Grid item xs={6}>
              <TextField
                size="small"
                fullWidth
                type="number"
                inputProps={{ step: "0.01" }}
                value={pctMax}
                onChange={(e) => setPctMax(Number(e.target.value))}
              />
            </Grid>

            <Grid item xs={6}>
              <Typography>Valor ingresos Mayor igual a $</Typography>
            </Grid>
            <Grid item xs={6}>
              <TextField
                size="small"
                fullWidth
                type="number"
                value={ingresoMayorIgual}
                onChange={(e) => setIngresoMayorIgual(Number(e.target.value))}
              />
            </Grid>
          </Grid>
        </Grid>

    
        <Grid item xs={12} md={6}>
          <Grid container spacing={1} alignItems="center">
            <Grid item xs={6}>
              <Typography fontWeight={600}>Actividad Económica Principal</Typography>
            </Grid>
            <Grid item xs={6}>
              <TextField
                select
                fullWidth
                size="small"
                value={actividad}
                onChange={(e) => setActividad(e.target.value)}
              >
                {ACTIVIDADES.map((a) => (
                  <MenuItem key={a.code} value={a.label}>
                    {a.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={6}>
              <Typography fontWeight={600}>Periodos a comparar:</Typography>
            </Grid>
            <Grid item xs={6}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Tooltip title="Agregar periodo (año anterior)">
                  <IconButton color="primary" onClick={addPeriodo}>
                    <AddCircleIcon />
                  </IconButton>
                </Tooltip>
                <Typography variant="body2">Agregar periodo</Typography>
              </Stack>
            </Grid>

            <Grid item xs={12}>
              <Stack spacing={1}>
                {periodos.map((p, idx) => (
                  <Stack
                    key={`${p}-${idx}`}
                    direction="row"
                    spacing={1}
                    alignItems="center"
                  >
                    <TextField
                      label={`Periodo ${idx + 1}`}
                      size="small"
                      type="number"
                      value={p}
                      onChange={(e) => updatePeriodo(idx, e.target.value)}
                      inputProps={{ min: 1900, max: 2100 }}
                    />
                    <IconButton
                      onClick={() => removePeriodo(idx)}
                      color="error"
                      size="small"
                    >
                      <DeleteOutlineIcon />
                    </IconButton>
                  </Stack>
                ))}
                {!ordenDescValido && periodos.length > 0 && (
                  <Alert severity="warning">
                    Los periodos deben estar en <b>orden descendente</b> y sin
                    empates (ej. 2025, 2024, 2023…).
                  </Alert>
                )}
                {!periodosUnicos && (
                  <Alert severity="warning">Hay años repetidos.</Alert>
                )}
              </Stack>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      <Divider sx={{ my: 2 }} />

   <Stack direction="row" spacing={1} sx={{ mt: 2, justifyContent: "flex-end" }}>
  <Button variant="contained" onClick={consultar} disabled={!puedeConsultar}>
    CONSULTAR
  </Button>
  <Button variant="outlined" color="inherit" onClick={limpiar}>
    LIMPIAR
  </Button>
</Stack>

    
      <Box sx={{ mt: 3 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell align="center" colSpan={3} sx={{ fontWeight: 700 }}>
            
              </TableCell>
              <TableCell align="center" colSpan={periodos.length} sx={{ fontWeight: 700 }}>
              
              </TableCell>
              <TableCell align="center" colSpan={2} sx={{ fontWeight: 700 }}>
                Variación
              </TableCell>
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
              <TableCell align="right">B</TableCell>
              <TableCell align="right">%</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3 + periodos.length + 2} align="center">
                  Sin resultados. Ajusta filtros y pulsa <b>Consultar</b>.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r:any) => {
         
                const excedePct =
                  r.pct !== null &&
                  (r.pct >= pctMax || r.pct <= -Math.abs(pctMin));
                const excedeIngreso = r.maxIngreso >= ingresoMayorIgual;
                const danger = excedePct || excedeIngreso;

                return (
                  <TableRow
                    key={r.ruc}
                    sx={{
                      bgcolor: danger ? "rgba(255,0,0,0.08)" : "inherit",
                    }}
                  >
                    <TableCell>{r.ruc}</TableCell>
                    <TableCell>{r.nombre}</TableCell>
                    <TableCell>{r.impuesto}</TableCell>
                    {periodos.map((y) => (
                      <TableCell key={`${r.ruc}-${y}`} align="right">
                        {money(r.valores[y])}
                      </TableCell>
                    ))}
                    <TableCell align="right">{money(r.B)}</TableCell>
                    <TableCell align="right">{percent(r.pct)}</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Box>

      {/* <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2">
          Comentarios aplicables a esta consulta
        </Typography>
        <Typography variant="body2">
          Las variaciones del ISR y del ITBMS mayores al {percent(pctMax)} o
          menores a -{percent(pctMin)} se muestran en rojo.
        </Typography>
        <Typography variant="body2">
          Los contribuyentes con ingresos mayores o iguales a ${" "}
          {money(ingresoMayorIgual)} se muestran en rojo.
        </Typography>
      </Box> */}
    </Paper>
  );
}
