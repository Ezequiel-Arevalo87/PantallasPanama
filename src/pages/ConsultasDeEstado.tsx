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

const TIPOS_INCONSISTENCIA = ["Omiso", "Inexacto", "Extemporáneo", "Todos"] as const;
type TipoInconsistencia = (typeof TIPOS_INCONSISTENCIA)[number] | "";

const IMPUESTO_PROGRAMA_OPCIONES = [
  "Costos y gastos vs Anexos",
  "Ventas e ingresos vs Anexos",
  "Inexactos vs retenciones 4331 ITBMS",
  "Inexactos vs ITBMS",
] as const;

type ImpuestoProgramaSel = (typeof IMPUESTO_PROGRAMA_OPCIONES)[number] | "";
type ActividadSel = EstadoActividad | "Todos" | "";
type SemaforoSel = Semaforo | "Todos" | "";

// ✅ Parse robusto: ISO / YYYY-MM-DD / DD/MM/YYYY
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

  const filtrados = useMemo(() => {
    let rows = data as any[];

    // 1) Tipo inconsistencia (no mates filas si el mock no trae el campo)
    if (tipoInc && tipoInc !== "Todos") {
      rows = rows.filter((r) => {
        const t = (r.tipoInconsistencia ?? tipoInc).toString(); // fallback
        return t.toLowerCase() === tipoInc.toLowerCase();
      });
    }

    // 2) Estado / Actividad
    if (actividad && actividad !== "Todos") {
      rows = rows.filter(
        (r) => String(r.estado).toLowerCase() === String(actividad).toLowerCase()
      );
    }

    // 3) Impuesto / Programa (no mates filas si el mock no trae el campo)
    if (impuestoPrograma) {
      rows = rows.filter((r) => {
        const imp = (
          r.impuestoPrograma ??
          r.impuesto_programa ??
          impuestoPrograma
        ).toString();
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

  // ✅ Inyectamos impuesto/tipo para que la tabla siempre muestre
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
            onChange={(e) => setTipoInc(e.target.value as TipoInconsistencia)}
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

        {/* 3) Impuesto / Programa */}
        <Grid item xs={12} sm={6} md={4}>
          <TextField
            select
            fullWidth
            label="Impuesto / Programa"
            value={impuestoPrograma}
            onChange={(e) => setImpuestoPrograma(e.target.value as ImpuestoProgramaSel)}
          >
            <MenuItem value="">— Todos —</MenuItem>
            {IMPUESTO_PROGRAMA_OPCIONES.map((op) => (
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
            onChange={(e) => setDesde(e.target.value)}
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
            onChange={(e) => setHasta(e.target.value)}
          />
        </Grid>

        {/* Semáforo */}
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            select
            fullWidth
            label="Semáforo"
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
