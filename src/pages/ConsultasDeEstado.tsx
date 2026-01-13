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
  Autocomplete,
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

// (los mismos textos que ya tenías)
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

const uniqCaseInsensitive = (items: string[]) =>
  Array.from(new Map(items.map((s) => [s.trim().toLowerCase(), s])).values()).filter(Boolean);

type ActividadSel = EstadoActividad | "Todos" | "";
type SemaforoSel = Semaforo | "Todos" | "";

// ✅ Multi-select actividad económica (igual que Priorización)
const ALL_VALUE = "__ALL__";
type ActividadEconSel = string[];

const parseFecha = (f: any) => {
  const s = (f ?? "").toString().trim();
  if (!s) return null;
  const d = dayjs(s, ["YYYY-MM-DD", "YYYY-MM-DDTHH:mm:ss.SSSZ", "DD/MM/YYYY"], true);
  return d.isValid() ? d : null;
};

// ============================
// ✅ Programa con CÓDIGO ÚNICO (para Autocomplete + tabla)
// ============================
type ProgramaOpt = {
  codigo: string; // único
  nombre: string; // (texto original)
  label: string; // `${codigo} - ${nombre}`
};

/**
 * ⚠️ Ajusta si cambian los códigos.
 * Clave: EL CÓDIGO NO SE REPITE.
 * (Basado en tu screenshot)
 */
const PROGRAMA_CODIGO: Record<string, string> = {
  "Omisos vs retenciones 4331 ITBMS": "115",
  "Omisos vs informes": "116",
  "Omisos vs ISR Renta": "113",
  "Omisos vs ITBMS": "114",

  "Costos y gastos vs Anexos": "210",
  "Ventas e ingresos vs Anexos": "211",
  "Inexactos vs retenciones 4331 ITBMS": "212",
  "Inexactos vs ITBMS": "213",

  "Base contribuyentes VS Calendario ISR": "310",
  "Base contribuyentes VS Calendario ITBMS": "311",
  "Base contribuyentes VS Calendario retenciones ITBMS": "312",
};

const toProgramaOpt = (nombre: string): ProgramaOpt => {
  const codigo = PROGRAMA_CODIGO[nombre] ?? ""; // si faltara, no rompe
  return { codigo, nombre, label: codigo ? `${codigo} - ${nombre}` : nombre };
};

const ConsultasDeEstado: React.FC = () => {
  const [tipoInc, setTipoInc] = useState<TipoInconsistencia>("");
  const [actividad, setActividad] = useState<ActividadSel>("");

  // ✅ Autocomplete: guardamos el objeto seleccionado
  const [programaSel, setProgramaSel] = useState<ProgramaOpt | null>(null);

  // ✅ filtros
  const [actividadEcon, setActividadEcon] = useState<ActividadEconSel>([]);
  const [red, setRed] = useState<RedSel>("");

  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [sem, setSem] = useState<SemaforoSel>("");
  const [mostrarResultados, setMostrarResultados] = useState(false);

  const [data, setData] = useState<FilaEstado[]>([]);

  // ✅ catálogo actividades económicas
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [loadingAct, setLoadingAct] = useState(true);

  useEffect(() => {
    setData(buildMockEstados(250));
    setDesde(dayjs().add(-5, "day").format("YYYY-MM-DD"));
    setHasta(dayjs().add(30, "day").format("YYYY-MM-DD"));

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

  /** ✅ Programas dependen del tipo de inconsistencia (MISMA LÓGICA) */
  const programasDisponibles = useMemo(() => {
    let base: string[] = [];
    switch (tipoInc) {
      case "Omiso":
        base = [...PROGRAMAS_OMISO];
        break;
      case "Inexacto":
        base = [...PROGRAMAS_INEXACTO];
        break;
      case "Extemporáneo":
        base = [...PROGRAMAS_EXTEMPORANEO];
        break;
      case "Todos":
      default:
        base = uniqCaseInsensitive([
          ...PROGRAMAS_OMISO,
          ...PROGRAMAS_INEXACTO,
          ...PROGRAMAS_EXTEMPORANEO,
        ]);
        break;
    }
    return base.map(toProgramaOpt);
  }, [tipoInc]);

  // Si cambia tipoInc y el programa ya no existe -> limpiar (MISMO COMPORTAMIENTO)
  useEffect(() => {
    if (programaSel) {
      const exists = programasDisponibles.some((p) => p.nombre === programaSel.nombre);
      if (!exists) setProgramaSel(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programasDisponibles]);

  // ============================
  // ✅ actividad económica multi
  // ============================
  const handleActividadesChange = (e: SelectChangeEvent<string[]>) => {
    const raw = e.target.value as unknown as string[];

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

    // 3) Programa seleccionado
    // - Preferimos filtrar por programaCodigo si el row lo trae
    // - Si no lo trae (mocks/compat), filtramos por nombre
    if (programaSel) {
      rows = rows.filter((r) => {
        const cod = String(r.programaCodigo ?? r.programa_codigo ?? "").trim();
        if (cod) return cod === programaSel.codigo;

        const imp = (r.impuestoPrograma ?? r.impuesto_programa ?? "").toString().trim();
        if (!imp) return true;
        return imp.toLowerCase() === programaSel.nombre.toLowerCase();
      });
    }

    // Actividad Económica (multi)
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

    // Semáforo
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
  }, [data, tipoInc, actividad, programaSel, actividadEcon, red, sem, desde, hasta]);

  /** ✅ Inyectamos campos para la tabla (SIN romper nada) */
  const filasParaTabla = useMemo(() => {
    const periodoInicial = desde || "";
    const periodoFinal = hasta || "";

    return filtrados.map((r: any) => {
      const impProg = (r.impuestoPrograma ?? r.impuesto_programa ?? "").toString().trim() || (programaSel?.nombre ?? "");
      const programaCodigo = String(r.programaCodigo ?? r.programa_codigo ?? "").trim() || (programaSel?.codigo ?? "");

      const impuestoProgramaLabel =
        programaCodigo && impProg ? `${programaCodigo} - ${impProg}` : impProg;

      // nombre sin números (solo por estética)
      const impuestoNombre = String(impProg ?? "")
        .replace(/\b\d+\b/g, "")
        .replace(/\s+/g, " ")
        .trim();

      // ✅ relación impuestos (se mantiene)
      const montoLiquidado =
        Number(r.montoLiquidado ?? r.monto_liquidado ?? 0) ||
        Math.round((500 + Math.random() * 9500) * 100) / 100;

      const relacionImpuestos = Array.isArray(r.relacionImpuestos)
        ? r.relacionImpuestos
        : [
            {
              // acá usamos programaCodigo como “código” para mostrar en el detalle (código/impuesto)
              codigoImpuesto: programaCodigo || "",
              nombreImpuesto: impuestoNombre,
              montoLiquidado,
            },
          ];

      return {
        ...r,
        tipoInconsistencia: r.tipoInconsistencia ?? r.tipo_inconsistencia ?? tipoInc,

        // ✅ programa para tabla
        impuestoPrograma: impProg,
        programaCodigo,
        impuestoProgramaLabel,

        // detalle
        periodoInicial,
        periodoFinal,
        relacionImpuestos,

        actividadEconomica:
          r.actividadEconomica ?? r.actividad_economica ?? (actividadEcon[0] ?? ""),
        red: r.red ?? r.redDgi ?? red,
        tipoPersona: r.tipoPersona ?? r.tipo_persona ?? "Jurídica",
      };
    }) as any as FilaEstado[];
  }, [filtrados, tipoInc, programaSel, actividadEcon, red, desde, hasta]);

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
    if (d?.isValid() && h?.isValid() && d.isAfter(h, "day")) out = d.add(1, "day");

    return out.format("YYYY-MM-DD");
  };

  const crearFilaQueCumpla = (): any => {
    const now = dayjs();
    const num = `MCK-${now.format("YYMMDDHHmmss")}`;

    const fecha = fechaDentroDeRango(fechaParaSemaforo(sem));

    const fallbackOpt = toProgramaOpt("Omisos vs ITBMS");
    const sel = programaSel ?? (programasDisponibles[0] ?? fallbackOpt);

    const programaCodigo = sel.codigo ?? "";
    const impProg = sel.nombre ?? "";
    const impuestoProgramaLabel = sel.label ?? `${programaCodigo} - ${impProg}`;

    return {
      numeroTramite: num,
      ruc: "100200999",
      contribuyente: "Contribuyente Mock (Auto)",
      categoria: "Fiscalización Masiva",
      estado: (actividad && actividad !== "Todos" ? actividad : "asignacion") as EstadoActividad,
      fecha,

      tipoInconsistencia: tipoInc || "Omiso",

      impuestoPrograma: impProg,
      programaCodigo,
      impuestoProgramaLabel,

      periodoInicial: desde || "",
      periodoFinal: hasta || "",
      relacionImpuestos: [
        {
          codigoImpuesto: programaCodigo || "",
          nombreImpuesto: impProg,
          montoLiquidado: Math.round((500 + Math.random() * 9500) * 100) / 100,
        },
      ],

      actividadEconomica: actividadEcon[0] || (actividades[0]?.code ?? "Servicios"),
      red: (red && red !== "Todos" ? red : "675") || "675",
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
    setProgramaSel(null);

    setActividadEcon([]);
    setRed("");

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

        {/* ✅ Impuesto / Programa (Autocomplete: código + nombre) */}
        <Grid item xs={12} sm={6} md={3}>
          <Autocomplete
            options={programasDisponibles}
            value={programaSel}
            onChange={(_e, newValue) => {
              setProgramaSel(newValue);
              setMostrarResultados(false);
            }}
            getOptionLabel={(opt) => opt?.label ?? ""}
            isOptionEqualToValue={(opt, val) => opt.nombre === val.nombre && opt.codigo === val.codigo}
            filterOptions={(options, state) => {
              const q = state.inputValue.trim().toLowerCase();
              if (!q) return options;
              return options.filter((o) =>
                `${o.codigo} ${o.nombre} ${o.label}`.toLowerCase().includes(q)
              );
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Impuesto / Programa"
                placeholder="Buscar código o nombre"
                fullWidth
              />
            )}
          />
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

        {/* Actividad Económica (MULTI) */}
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
