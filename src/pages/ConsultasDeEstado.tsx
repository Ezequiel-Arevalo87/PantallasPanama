// src/pages/ConsultasDeEstado.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Grid,
  TextField,
  MenuItem,
  Button,
  Stack,
  Checkbox,
  ListItemText,
  Chip,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";
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

// ✅ Igual que Priorización
import { Actividad, loadActividades } from "../services/actividadesLoader";

dayjs.extend(customParseFormat);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

/** ✅ Actividades (incluye AN1/AN2) */
const ACTIVIDADES: EstadoActividad[] = [
  "asignacion",
  "acta de inicio",
  "notificacion acta de inicio",
  "informe auditoria",
  "propuesta de regularizacion",
  "Revisión Análisis Normativo 1",
  "Revisión Análisis Normativo 2",
  "notificación propuesta de regularizacion",
  "aceptacion total",
  "aceptacion parcial",
  "rechazo",
  "resolucion en firme",
  "notificación de resolución",
  "cierre y archivo",
];

/* ================== Catálogos ================== */
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

const REDS = ["Todos", "675", "659"] as const;
type RedSel = (typeof REDS)[number] | "";

const CATEG_CONTRIB = ["Todos", "Grande", "Medio", "Pequeño"] as const;
type CategoriaContribSel = (typeof CATEG_CONTRIB)[number] | "";

const uniqCaseInsensitive = (items: string[]) =>
  Array.from(new Map(items.map((s) => [s.trim().toLowerCase(), s])).values()).filter(Boolean);

type ImpuestoProgramaSel = string | "";
type ActividadSel = EstadoActividad | "Todos" | "";
type SemaforoSel = Semaforo | "Todos" | "";
type CodigoImpuestoSel = string | "";

// ✅ Multi-select actividad económica (igual que Priorización)
const ALL_VALUE = "__ALL__";

type ActividadEconSel = string[]; // ahora es array

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

  // ✅ filtros
  const [actividadEcon, setActividadEcon] = useState<ActividadEconSel>([]); // ✅ multi
  const [red, setRed] = useState<RedSel>("");
  const [categoriaContrib, setCategoriaContrib] = useState<CategoriaContribSel>("");
  const [codigoImpuesto, setCodigoImpuesto] = useState<CodigoImpuestoSel>("");

  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [sem, setSem] = useState<SemaforoSel>("");
  const [mostrarResultados, setMostrarResultados] = useState(false);

  const [data, setData] = useState<FilaEstado[]>([]);

  // ✅ catálogo actividades económicas desde loader (igual Priorización)
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [loadingAct, setLoadingAct] = useState(true);

  useEffect(() => {
    // ✅ data
    setData(buildMockEstados(250));
    setDesde(dayjs().add(-5, "day").format("YYYY-MM-DD"));
    setHasta(dayjs().add(30, "day").format("YYYY-MM-DD"));

    // ✅ actividades económicas
    loadActividades().then((arr) => {
      setActividades(arr ?? []);
      setLoadingAct(false);
    });
  }, []);

  const actividadesMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const a of actividades) m.set(a.code, a.label);
    return m;
  }, [actividades]);

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
        return uniqCaseInsensitive([
          ...PROGRAMAS_OMISO,
          ...PROGRAMAS_INEXACTO,
          ...PROGRAMAS_EXTEMPORANEO,
        ]);
    }
  }, [tipoInc]);

  useEffect(() => {
    if (impuestoPrograma && !programasDisponibles.includes(impuestoPrograma)) {
      setImpuestoPrograma("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programasDisponibles]);

  // ✅ códigos de impuesto para el select
  const codigosImpuestoDisponibles = useMemo(() => {
    const fromData = uniqCaseInsensitive(
      (data as any[]).flatMap((r) => {
        const v =
          (r as any).codigoImpuesto ??
          (r as any).codigo_impuesto ??
          (r as any).impuestoCodigo ??
          (r as any).codigo_impuesto_programa ??
          "";
        return String(v)
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean);
      })
    );
    const fallback = ["4331", "ITBMS", "ISR", "INFORMES"];
    return uniqCaseInsensitive([...fromData, ...fallback]);
  }, [data]);

  // ============================
  // ✅ actividad económica multi
  // ============================
  const handleActividadesChange = (e: SelectChangeEvent<string[]>) => {
    const raw = e.target.value as unknown as string[];

    // "Todas"
    if (raw.includes(ALL_VALUE)) {
      setActividadEcon([]);
      setMostrarResultados(false);
      return;
    }

    const next = uniqCaseInsensitive(raw.filter((v) => v !== ALL_VALUE));
    setActividadEcon(next);
    setMostrarResultados(false);
  };

  const renderActividadChips = (selected: any) => {
    const arr: string[] = selected as string[];
    if (!arr?.length) return "Todas";

    // solo mostramos el primero como chip (igual Priorización)
    const first = arr[0];
    const label = actividadesMap.get(first) ?? first;

    return (
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
        <Chip key={first} size="small" label={label} />
        {arr.length > 1 && <Chip size="small" variant="outlined" label={`+${arr.length - 1}`} />}
      </Box>
    );
  };

  // ============================
  // ✅ Filtrado
  // ============================
  const filtrados = useMemo(() => {
    let rows = data as any[];

    // 1) Tipo inconsistencia
    if (tipoInc && tipoInc !== "Todos") {
      rows = rows.filter((r) => {
        const t = (r.tipoInconsistencia ?? r.tipo_inconsistencia ?? "").toString().trim();
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

    // 3) Impuesto / Programa
    if (impuestoPrograma) {
      rows = rows.filter((r) => {
        const imp = (r.impuestoPrograma ?? r.impuesto_programa ?? "").toString().trim();
        if (!imp) return true;
        return imp.toLowerCase() === impuestoPrograma.toLowerCase();
      });
    }

    // ✅ Actividad Económica (multi)
    // Si el mock no trae actividadEconomica, no matamos filas.
    if (actividadEcon.length > 0) {
      rows = rows.filter((r) => {
        const ae = (r.actividadEconomica ?? r.actividad_economica ?? "").toString().trim();
        if (!ae) return true;
        return actividadEcon.some((sel) => sel.toLowerCase() === ae.toLowerCase());
      });
    }

    // Red
    if (red && red !== "Todos") {
      rows = rows.filter((r) => {
        const rr = (r.red ?? r.redDgi ?? "").toString().trim();
        if (!rr) return true;
        return rr.toLowerCase() === String(red).toLowerCase();
      });
    }

    // Categoría contribuyente
    if (categoriaContrib && categoriaContrib !== "Todos") {
      rows = rows.filter((r) => {
        const c = (r.categoriaContribuyente ?? r.categoria_contribuyente ?? "").toString().trim();
        if (!c) return true;
        return c.toLowerCase() === String(categoriaContrib).toLowerCase();
      });
    }

    // Código Impuesto
    if (codigoImpuesto && codigoImpuesto !== "Todos") {
      rows = rows.filter((r) => {
        const v =
          r.codigoImpuesto ??
          r.codigo_impuesto ??
          r.impuestoCodigo ??
          r.codigo_impuesto_programa ??
          "";
        const s = String(v).trim();
        if (!s) return true;

        const parts = s
          .split(",")
          .map((x) => x.trim().toLowerCase())
          .filter(Boolean);

        return parts.length
          ? parts.includes(String(codigoImpuesto).toLowerCase())
          : s.toLowerCase() === String(codigoImpuesto).toLowerCase();
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
  }, [
    data,
    tipoInc,
    actividad,
    impuestoPrograma,
    actividadEcon,
    red,
    categoriaContrib,
    codigoImpuesto,
    sem,
    desde,
    hasta,
  ]);

  /** ✅ Inyectamos campos para la tabla */
  const filasParaTabla = useMemo(() => {
    return filtrados.map((r: any) => ({
      ...r,
      tipoInconsistencia: r.tipoInconsistencia ?? r.tipo_inconsistencia ?? tipoInc,
      impuestoPrograma: r.impuestoPrograma ?? r.impuesto_programa ?? impuestoPrograma,

      // para display/compat
      actividadEconomica:
        r.actividadEconomica ?? r.actividad_economica ?? (actividadEcon[0] ?? ""),
      red: r.red ?? r.redDgi ?? red,
      categoriaContribuyente:
        r.categoriaContribuyente ?? r.categoria_contribuyente ?? categoriaContrib,
      codigoImpuesto:
        r.codigoImpuesto ?? r.codigo_impuesto ?? r.impuestoCodigo ?? codigoImpuesto,

      tipoPersona: r.tipoPersona ?? r.tipo_persona ?? "Jurídica",
    })) as any as FilaEstado[];
  }, [filtrados, tipoInc, impuestoPrograma, actividadEcon, red, categoriaContrib, codigoImpuesto]);

  // =========================
  // ✅ GARANTIZAR RESULTADOS
  // =========================
  const fechaParaSemaforo = (s: SemaforoSel) => {
    const hoy = dayjs();
    if (s === "VERDE") return hoy.add(20, "day").format("YYYY-MM-DD");
    if (s === "AMARILLO") return hoy.add(6, "day").format("YYYY-MM-DD");
    if (s === "ROJO") return hoy.add(1, "day").format("YYYY-MM-DD");
    return hoy.add(6, "day").format("YYYY-MM-DD");
  };

  const fechaDentroDeRango = (fechaBase: string) => {
    const base = dayjs(fechaBase, "YYYY-MM-DD", true);
    const d = desde ? dayjs(desde, "YYYY-MM-DD", true) : null;
    const h = hasta ? dayjs(hasta, "YYYY-MM-DD", true) : null;

    if (!base.isValid()) return dayjs().add(6, "day").format("YYYY-MM-DD");
    let out = base;

    if (d?.isValid() && out.isBefore(d, "day")) out = d.add(1, "day");
    if (h?.isValid() && out.isAfter(h, "day")) out = h.subtract(1, "day");

    if (d?.isValid() && h?.isValid() && d.isAfter(h, "day")) {
      out = d.add(1, "day");
    }
    return out.format("YYYY-MM-DD");
  };

  const crearFilaQueCumpla = (): any => {
    const now = dayjs();
    const num = `MCK-${now.format("YYMMDDHHmmss")}`;

    const f1 = fechaParaSemaforo(sem);
    const fecha = fechaDentroDeRango(f1);

    return {
      numeroTramite: num,
      ruc: "100200999",
      contribuyente: "Contribuyente Mock (Auto)",
      categoria: "Fiscalización Masiva",
      estado: (actividad && actividad !== "Todos" ? actividad : "asignacion") as EstadoActividad,
      fecha,

      tipoInconsistencia: tipoInc || "Omiso",
      impuestoPrograma: impuestoPrograma || "Omisos vs ITBMS",
      codigoImpuesto: codigoImpuesto || "ITBMS",

      // ✅ aquí usamos la primera seleccionada si hay
      actividadEconomica: actividadEcon[0] || (actividades[0]?.code ?? "Servicios"),

      red: (red && red !== "Todos" ? red : "675") || "675",
      categoriaContribuyente:
        (categoriaContrib && categoriaContrib !== "Todos" ? categoriaContrib : "Grande") || "Grande",
      tipoPersona: "Jurídica",
    };
  };

  const consultar = () => {
    if (filasParaTabla.length === 0) {
      setData((prev) => [crearFilaQueCumpla(), ...prev]);
    }
    setMostrarResultados(true);
  };

  const limpiar = () => {
    setTipoInc("");
    setActividad("");
    setImpuestoPrograma("");

    setActividadEcon([]); // ✅ multi reset
    setRed("");
    setCategoriaContrib("");
    setCodigoImpuesto("");

    setSem("");
    setDesde(dayjs().add(-5, "day").format("YYYY-MM-DD"));
    setHasta(dayjs().add(30, "day").format("YYYY-MM-DD"));
    setMostrarResultados(false);
  };

  return (
    <Box>
      <Grid container spacing={2}>
        {/* Tipo inconsistencia */}
        <Grid item xs={12} sm={6} md={3}>
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

        {/* Estado / Actividad */}
        <Grid item xs={12} sm={6} md={3}>
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

        {/* Impuesto / Programa */}
        <Grid item xs={12} sm={6} md={3}>
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

        {/* ✅ Actividad Económica (MULTI igual Priorización) */}
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            select
            fullWidth
            label="Actividad Económica"
            value={actividadEcon}
            onChange={handleActividadesChange as any}
            SelectProps={{ multiple: true, renderValue: renderActividadChips }}
            disabled={loadingAct}
          >
            <MenuItem value={ALL_VALUE}>
              <Checkbox checked={actividadEcon.length === 0} />
              <ListItemText primary="Todas" />
            </MenuItem>

            {actividades.map((a) => (
              <MenuItem key={a.code} value={a.code}>
                <Checkbox checked={actividadEcon.includes(a.code)} />
                <ListItemText primary={`${a.code} — ${a.label}`} />
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* Red */}
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            select
            fullWidth
            label="Red"
            value={red}
            onChange={(e) => {
              setRed(e.target.value as RedSel);
              setMostrarResultados(false);
            }}
          >
            <MenuItem value="">— Todos —</MenuItem>
            {REDS.map((r) => (
              <MenuItem key={r} value={r}>
                {r}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* Categoría Contribuyente */}
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            select
            fullWidth
            label="Categoría Contribuyente"
            value={categoriaContrib}
            onChange={(e) => {
              setCategoriaContrib(e.target.value as CategoriaContribSel);
              setMostrarResultados(false);
            }}
          >
            <MenuItem value="">— Todos —</MenuItem>
            {CATEG_CONTRIB.map((c) => (
              <MenuItem key={c} value={c}>
                {c}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* Código de Impuesto */}
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            select
            fullWidth
            label="Código de Impuesto"
            value={codigoImpuesto}
            onChange={(e) => {
              setCodigoImpuesto(e.target.value as CodigoImpuestoSel);
              setMostrarResultados(false);
            }}
          >
            <MenuItem value="">— Todos —</MenuItem>
            <MenuItem value="Todos">Todos</MenuItem>
            {codigosImpuestoDisponibles.map((op) => (
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
            <Button variant="contained" onClick={consultar}>
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
          Ejemplo formato fecha: {toDDMMYYYY((filasParaTabla as any)[0].fecha)}
        </Box>
      )}
    </Box>
  );
};

export default ConsultasDeEstado;
