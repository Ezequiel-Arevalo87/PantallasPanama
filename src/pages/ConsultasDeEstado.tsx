// src/pages/ConsultasDeEstado.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Box, Grid, TextField, MenuItem, Button, Stack } from "@mui/material";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";

import {
  buildMockEstados,
  calcularSemaforo,
  toDDMMYYYY,
  type EstadoActividad,
  type FilaEstado,
  type Semaforo,
} from "../services/mockEstados";
import TablaResultadosEstado from "./TablaResultadosEstado";

dayjs.extend(customParseFormat);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const ACTIVIDADES: EstadoActividad[] = [
  "asignacion",
  "acta de inicio",
  "notificacion acta de inicio",
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

/* ================== Catálogos (igual lógica que Priorización) ================== */
const TIPOS_INCONSISTENCIA = ["Omiso", "Inexacto", "Extemporáneo", "Todos"] as const;
type TipoInconsistencia = (typeof TIPOS_INCONSISTENCIA)[number] | "";

const PROGRAMAS_OMISO = [
  "Omisos vs retenciones 4331 ITBMS",
  "Omisos vs informes",
  "Omisos vs ISR Renta",
  "Omisos vs ITBMS",
] as const;

const PROGRAMAS_INEXACTO = [
  "Costos y gastos vs Anexos",
  "Ventas e ingresos vs Anexos",
  "Inexactos vs retenciones 4331 ITBMS",
  "Inexactos vs ITBMS",
] as const;

const PROGRAMAS_EXTEMPORANEO = [
  "Base contribuyentes VS Calendario ISR",
  "Base contribuyentes VS Calendario ITBMS",
  "Base contribuyentes VS Calendario retenciones ITBMS",
] as const;

const uniqCaseInsensitive = (items: string[]) =>
  Array.from(new Map(items.map((s) => [s.trim().toLowerCase(), s])).values());

type ImpuestoProgramaSel = string | "";
type ActividadSel = EstadoActividad | "Todos" | "";
type SemaforoSel = Semaforo | "Todos" | "";

/** Parse robusto: ISO / YYYY-MM-DD / DD/MM/YYYY */
const parseFecha = (f: any) => {
  const s = (f ?? "").toString().trim();
  if (!s) return null;
  const d = dayjs(s, ["YYYY-MM-DD", "YYYY-MM-DDTHH:mm:ss.SSSZ", "DD/MM/YYYY"], true);
  return d.isValid() ? d : null;
};

const ConsultasDeEstado: React.FC = () => {
  // orden: 1) tipoInc 2) actividad 3) impuestoPrograma
  const [tipoInc, setTipoInc] = useState<TipoInconsistencia>("");
  const [actividad, setActividad] = useState<ActividadSel>("");
  const [impuestoPrograma, setImpuestoPrograma] = useState<ImpuestoProgramaSel>("");

  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [sem, setSem] = useState<SemaforoSel>("");
  const [mostrarResultados, setMostrarResultados] = useState(false);

  const [data, setData] = useState<FilaEstado[]>([]);

  useEffect(() => {
    setData(buildMockEstados());
    setDesde(dayjs().add(-5, "day").format("YYYY-MM-DD"));
    setHasta(dayjs().add(30, "day").format("YYYY-MM-DD"));
  }, []);

  /** ✅ Programas dependen del tipo de inconsistencia */
  const programasDisponibles = useMemo(() => {
    switch (tipoInc) {
      case "Omiso":
        return [...PROGRAMAS_OMISO];
      case "Inexacto":
        return [...PROGRAMAS_INEXACTO];
      case "Extemporáneo":
        return [...PROGRAMAS_EXTEMPORANEO];
      case "Todos":
        return uniqCaseInsensitive([
          ...PROGRAMAS_OMISO,
          ...PROGRAMAS_INEXACTO,
          ...PROGRAMAS_EXTEMPORANEO,
        ]);
      default:
        // si no ha escogido tipo, por UX le mostramos todo
        return uniqCaseInsensitive([
          ...PROGRAMAS_OMISO,
          ...PROGRAMAS_INEXACTO,
          ...PROGRAMAS_EXTEMPORANEO,
        ]);
    }
  }, [tipoInc]);

  /** ✅ Si cambias tipoInc y el programa ya no aplica, lo reseteamos */
  useEffect(() => {
    if (impuestoPrograma && !programasDisponibles.includes(impuestoPrograma)) {
      setImpuestoPrograma("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programasDisponibles]);

  const filtrados = useMemo(() => {
    let rows = data as any[];

    // 1) Tipo inconsistencia (si el mock no trae el campo, NO mates filas)
    if (tipoInc && tipoInc !== "Todos") {
      rows = rows.filter((r) => {
        const t = (r.tipoInconsistencia ?? "").toString().trim();
        // si no existe, dejamos pasar (para no quedarte en blanco con mocks)
        if (!t) return true;
        return t.toLowerCase() === tipoInc.toLowerCase();
      });
    }

    // 2) Estado / Actividad
    if (actividad && actividad !== "Todos") {
      rows = rows.filter(
        (r) => String(r.estado).toLowerCase() === String(actividad).toLowerCase()
      );
    }

    // 3) Impuesto / Programa (si el mock no trae el campo, NO mates filas)
    if (impuestoPrograma) {
      rows = rows.filter((r) => {
        const imp = (r.impuestoPrograma ?? r.impuesto_programa ?? "").toString().trim();
        if (!imp) return true;
        return imp.toLowerCase() === impuestoPrograma.toLowerCase();
      });
    }

    // Semáforo (select)
    if (sem && sem !== "Todos") {
      rows = rows.filter((r) => calcularSemaforo(r.fecha) === sem);
    }

    // Fechas robustas
    const d = desde ? dayjs(desde, "YYYY-MM-DD", true) : null;
    const h = hasta ? dayjs(hasta, "YYYY-MM-DD", true) : null;

    if (d?.isValid()) {
      rows = rows.filter((r) => {
        const fr = parseFecha(r.fecha);
        return fr ? fr.isSameOrAfter(d, "day") : true;
      });
    }
    if (h?.isValid()) {
      rows = rows.filter((r) => {
        const fr = parseFecha(r.fecha);
        return fr ? fr.isSameOrBefore(h, "day") : true;
      });
    }

    return rows as FilaEstado[];
  }, [data, tipoInc, actividad, impuestoPrograma, sem, desde, hasta]);

  /** ✅ Inyectamos tipo/programa para que la tabla SIEMPRE muestre columnas aunque el mock no lo traiga */
  const filasParaTabla = useMemo(() => {
    return filtrados.map((r: any) => ({
      ...r,
      tipoInconsistencia: r.tipoInconsistencia ?? tipoInc,
      impuestoPrograma: r.impuestoPrograma ?? r.impuesto_programa ?? impuestoPrograma,
    })) as FilaEstado[];
  }, [filtrados, tipoInc, impuestoPrograma]);

  const limpiar = () => {
    setTipoInc("");
    setActividad("");
    setImpuestoPrograma("");
    setSem("");
    setDesde(dayjs().add(-5, "day").format("YYYY-MM-DD"));
    setHasta(dayjs().add(30, "day").format("YYYY-MM-DD"));
    setMostrarResultados(false);
  };

  return (
    <Box>
      <Grid container spacing={2}>
        {/* 1) Tipo inconsistencia */}
        <Grid item xs={12} sm={6} md={4}>
          <TextField
            select
            fullWidth
            label="Tipo de Inconsistencia"
            value={tipoInc}
            onChange={(e) => {
              setTipoInc(e.target.value as TipoInconsistencia);
              setMostrarResultados(false);
            }}
          >
            <MenuItem value="">— Todos —</MenuItem>
            {TIPOS_INCONSISTENCIA.map((t) => (
              <MenuItem key={t} value={t}>
                {t}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* 2) Estado / Actividad */}
        <Grid item xs={12} sm={6} md={4}>
          <TextField
            select
            fullWidth
            label="Estado / Actividad"
            value={actividad}
            onChange={(e) => {
              setActividad(e.target.value as ActividadSel);
              setMostrarResultados(false);
            }}
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

        {/* 3) Impuesto / Programa (dependiente del tipoInc) */}
        <Grid item xs={12} sm={6} md={4}>
          <TextField
            select
            fullWidth
            label="Impuesto / Programa"
            value={impuestoPrograma}
            onChange={(e) => {
              setImpuestoPrograma(e.target.value as ImpuestoProgramaSel);
              setMostrarResultados(false);
            }}
            disabled={programasDisponibles.length === 0}
          >
            <MenuItem value="">— Todos —</MenuItem>
            {programasDisponibles.map((op) => (
              <MenuItem key={op} value={op}>
                {op}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* Desde */}
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            type="date"
            label="Desde"
            InputLabelProps={{ shrink: true }}
            value={desde}
            onChange={(e) => {
              setDesde(e.target.value);
              setMostrarResultados(false);
            }}
          />
        </Grid>

        {/* Hasta */}
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            type="date"
            label="Hasta"
            InputLabelProps={{ shrink: true }}
            value={hasta}
            onChange={(e) => {
              setHasta(e.target.value);
              setMostrarResultados(false);
            }}
          />
        </Grid>

        {/* Semáforo */}
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            select
            fullWidth
            label="Semáforo"
            value={sem}
            onChange={(e) => {
              setSem(e.target.value as SemaforoSel);
              setMostrarResultados(false);
            }}
          >
            <MenuItem value="">— Todos —</MenuItem>
            <MenuItem value="Todos">Todos</MenuItem>
            <MenuItem value="VERDE">VERDE</MenuItem>
            <MenuItem value="AMARILLO">AMARILLO</MenuItem>
            <MenuItem value="ROJO">ROJO</MenuItem>
          </TextField>
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

      {mostrarResultados && <TablaResultadosEstado rows={filasParaTabla} />}

      {mostrarResultados && filasParaTabla[0] && (
        <Box mt={1} fontSize={12} color="text.secondary">
          Ejemplo formato fecha: {toDDMMYYYY(filasParaTabla[0].fecha)}
        </Box>
      )}
    </Box>
  );
};

export default ConsultasDeEstado;
