import React, { useEffect, useMemo, useState } from "react";
import {
  Box, Grid, TextField, MenuItem, Button, Stack, Chip, InputAdornment,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";

import {
  buildMockEstados,
  calcularSemaforo,
  toDDMMYYYY,
  type Categoria,
  type EstadoActividad,
  type FilaEstado,
  type Semaforo,
} from "../services/mockEstados";
import TablaResultadosEstado from "./TablaResultadosEstado";

// 👇 habilita plugins de comparación
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

// --------- Catálogos ---------
const CATEGORIAS: Categoria[] = [
  "Fiscalización Masiva",
  "Auditoría Sectorial",
  "Grandes Contribuyentes",
  "Todos",
];

const ACTIVIDADES: EstadoActividad[] = [
  "asignacion",
  "acta de inicio",
  "notificacion acta de inicio",
  "notificacion",
  "informe auditoria",
  "propuesta de regularizacion",
  "notificación propuesta de regularizacion",
  "aceptacion total",
  "aceptacion parcial",
  "rechazo",
  "resolucion en firme",
  "notificación de resolución",
  "cierre y archivo",
];

type CategoriaSel = Categoria | "";                   // ← permite vacío
type ActividadSel = EstadoActividad | "Todos" | "";   // ← permite vacío
type SemaforoSel  = Semaforo | "Todos" | "";          // ← permite vacío

// ⚠️ Ajusta la ruta según dónde tengas el componente

// Si lo tienes en la misma carpeta, usa: "./TablaResultadosEstado"

const ConsultasDeEstado: React.FC = () => {
  // -------- Estado UI seguro (vacíos por defecto) --------
  const [query, setQuery] = useState("");
  const [categoria, setCategoria] = useState<CategoriaSel>("");           // ← vacío
  const [actividad, setActividad] = useState<ActividadSel>("");           // ← vacío
  const [sem, setSem]             = useState<SemaforoSel>("");            // ← vacío
  const [desde, setDesde]         = useState("");                         // yyyy-mm-dd
  const [hasta, setHasta]         = useState("");
  const [mostrarResultados, setMostrarResultados] = useState(false);

  // -------- Data (mock) --------
  const [data, setData] = useState<FilaEstado[]>([]);
  useEffect(() => {
    setData(buildMockEstados());

    // Rango por defecto para no dejar la tabla vacía al abrir:
    const dftDesde = dayjs().add(-5, "day").format("YYYY-MM-DD");
    const dftHasta = dayjs().add(30, "day").format("YYYY-MM-DD");
    setDesde(dftDesde);
    setHasta(dftHasta);
  }, []);

  // -------- Filtro robusto --------
  const filtrados = useMemo(() => {
    let rows = data;

    if (categoria && categoria !== "Todos") {
      rows = rows.filter((r) => r.categoria === categoria);
    }
    if (actividad && actividad !== "Todos") {
      rows = rows.filter((r) => r.estado === actividad);
    }
    if (sem && sem !== "Todos") {
      rows = rows.filter((r) => calcularSemaforo(r.fecha) === sem);
    }
    if (desde) {
      const d = dayjs(desde);
      if (d.isValid()) rows = rows.filter((r) => dayjs(r.fecha).isSameOrAfter(d, "day"));
    }
    if (hasta) {
      const h = dayjs(hasta);
      if (h.isValid()) rows = rows.filter((r) => dayjs(r.fecha).isSameOrBefore(h, "day"));
    }
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      rows = rows.filter(
        (r) =>
          r.ruc.toLowerCase().includes(q) ||
          r.contribuyente.toLowerCase().includes(q) ||
          r.numeroTramite.toLowerCase().includes(q)
      );
    }
    return rows;
  }, [data, categoria, actividad, sem, desde, hasta, query]);

  const limpiar = () => {
    setQuery("");
    setCategoria("");
    setActividad("");
    setSem("");
    setDesde(dayjs().add(-5, "day").format("YYYY-MM-DD"));
    setHasta(dayjs().add(30, "day").format("YYYY-MM-DD"));
    setMostrarResultados(false);
  };

  return (
    <Box>
      <Grid container spacing={2}>
        {/* Categoría */}
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            select fullWidth label="Categoría"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value as CategoriaSel)}
          >
            <MenuItem value="">— Todos —</MenuItem>
            {CATEGORIAS.map((c) => (
              <MenuItem key={c} value={c}>
                {c}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* Estado / Actividad */}
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            select fullWidth label="Estado / Actividad"
            value={actividad}
            onChange={(e) => setActividad(e.target.value as ActividadSel)}
          >
            <MenuItem value="">— Todos —</MenuItem>
            <MenuItem value="Todos">Todos</MenuItem>
            {ACTIVIDADES.map((a) => (
              <MenuItem key={a} value={a}>
                {a}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* Semáforo */}
        <Grid item xs={12} sm={6} md={2}>
          <TextField
            select fullWidth label="Semáforo"
            value={sem}
            onChange={(e) => setSem(e.target.value as SemaforoSel)}
          >
            <MenuItem value="">— Todos —</MenuItem>
            <MenuItem value="Todos">Todos</MenuItem>
            <MenuItem value="VERDE">VERDE</MenuItem>
            <MenuItem value="AMARILLO">AMARILLO</MenuItem>
            <MenuItem value="ROJO">ROJO</MenuItem>
          </TextField>
        </Grid>

        {/* Desde */}
        <Grid item xs={12} sm={6} md={2}>
          <TextField
            fullWidth type="date" label="Desde" InputLabelProps={{ shrink: true }}
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
          />
        </Grid>

        {/* Hasta */}
        <Grid item xs={12} sm={6} md={2}>
          <TextField
            fullWidth type="date" label="Hasta" InputLabelProps={{ shrink: true }}
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
          />
        </Grid>


        {/* Acciones */}
        <Grid item xs={12} md="auto">
          <Stack direction="row" spacing={1}>
            <Button variant="contained" onClick={() => setMostrarResultados(true)}>
              Consultar
            </Button>
            <Button variant="outlined" onClick={limpiar}>
              Limpiar
            </Button>
          </Stack>
        </Grid>
      </Grid>

      {/* Leyenda */}
      <Stack direction="row" spacing={1} mt={2}>
        <Chip label="Verde: >10 días" color="success" size="small" />
        <Chip label="Amarillo: 3–10 días" color="warning" size="small" />
        <Chip label="Rojo: ≤2 días / vencido" color="error" size="small" />
      </Stack>

      {mostrarResultados && <TablaResultadosEstado rows={filtrados} />}

      {mostrarResultados && filtrados[0] && (
        <Box mt={1} fontSize={12} color="text.secondary">
          Ejemplo formato fecha: {toDDMMYYYY(filtrados[0].fecha)}
        </Box>
      )}
    </Box>
  );
};

export default ConsultasDeEstado;
