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
const TIPOS_INCONSISTENCIA = ["Omiso", "Inexacto", "Extemporáneo"] as const;
type TipoInconsistencia = (typeof TIPOS_INCONSISTENCIA)[number];

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

const REDS = ["675", "659"] as const;
type Red = (typeof REDS)[number];

const uniqCaseInsensitive = (items: string[]) =>
  Array.from(new Map(items.map((s) => [s.trim().toLowerCase(), s])).values()).filter(Boolean);

type ActividadSel = EstadoActividad;
type SemaforoSel = Semaforo;

// ✅ Valor real de "TODOS" (NO VACÍO)
const ALL = "__ALL__";

// ✅ Multi-select actividad económica
type ActividadEconSel = string[]; // lista de códigos (vacía => TODOS)

const parseFecha = (f: any) => {
  const s = (f ?? "").toString().trim();
  if (!s) return null;
  const d = dayjs(s, ["YYYY-MM-DD", "YYYY-MM-DDTHH:mm:ss.SSSZ", "DD/MM/YYYY"], true);
  return d.isValid() ? d : null;
};

// ============================
// ✅ Programa con CÓDIGO ÚNICO (Autocomplete + tabla)
// ============================
type ProgramaOpt = {
  codigo: string;
  nombre: string;
  label: string; // `${codigo} - ${nombre}`
};

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
  const codigo = PROGRAMA_CODIGO[nombre] ?? "";
  return { codigo, nombre, label: codigo ? `${codigo} - ${nombre}` : nombre };
};

// ============================
// ✅ Código-Impuesto (nuevo selector)
// ============================
type ImpuestoOpt = { codigo: string; nombre: string; label: string };
const makeImpuestoOpt = (codigo: string, nombre: string): ImpuestoOpt => {
  const c = String(codigo ?? "").trim();
  const n = String(nombre ?? "").trim();
  return { codigo: c, nombre: n, label: c && n ? `${c} - ${n}` : c || n || "—" };
};

const ConsultasDeEstado: React.FC = () => {
  // ✅ selects con ALL por defecto (TODOS visible)
  const [tipoInc, setTipoInc] = useState<string>(ALL);
  const [actividad, setActividad] = useState<string>(ALL);
  const [red, setRed] = useState<string>(ALL);
  const [sem, setSem] = useState<string>(ALL);

  // ✅ Autocomplete: null = TODOS
  const [programaSel, setProgramaSel] = useState<ProgramaOpt | null>(null);
  const [impuestoSel, setImpuestoSel] = useState<ImpuestoOpt | null>(null);

  // ✅ multi: [] = TODOS
  const [actividadEcon, setActividadEcon] = useState<ActividadEconSel>([]);

  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [mostrarResultados, setMostrarResultados] = useState(false);

  const [data, setData] = useState<FilaEstado[]>([]);

  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [loadingAct, setLoadingAct] = useState(true);

  // ✅ Control input de Autocomplete (para que se vea "TODOS")
  const [programaInput, setProgramaInput] = useState("TODOS");
  const [impuestoInput, setImpuestoInput] = useState("TODOS");

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

  /** ✅ Programas por tipo inconsistencia */
  const programasDisponibles = useMemo(() => {
    let base: string[] = [];
    if (tipoInc === ALL) {
      base = uniqCaseInsensitive([
        ...PROGRAMAS_OMISO,
        ...PROGRAMAS_INEXACTO,
        ...PROGRAMAS_EXTEMPORANEO,
      ]);
    } else if (tipoInc === "Omiso") base = [...PROGRAMAS_OMISO];
    else if (tipoInc === "Inexacto") base = [...PROGRAMAS_INEXACTO];
    else if (tipoInc === "Extemporáneo") base = [...PROGRAMAS_EXTEMPORANEO];

    return base.map(toProgramaOpt);
  }, [tipoInc]);

  // Si cambia tipoInc y el programa ya no existe -> limpiar
  useEffect(() => {
    if (programaSel) {
      const exists = programasDisponibles.some((p) => p.nombre === programaSel.nombre);
      if (!exists) {
        setProgramaSel(null);
        setProgramaInput("TODOS");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programasDisponibles]);

  // ============================
  // ✅ actividad económica multi
  // ============================
  const handleActividadesChange = (e: SelectChangeEvent<string[]>) => {
    const raw = e.target.value as unknown as string[];

    // Si elige TODOS
    if (raw.includes(ALL)) {
      setActividadEcon([]);
      setMostrarResultados(false);
      return;
    }

    const next = uniqCaseInsensitive(raw.filter((v) => v !== ALL));
    setActividadEcon(next);
    setMostrarResultados(false);
  };

  // ✅ FIX: si llega "__ALL__" => mostrar "TODOS"
  const renderActividadChips = (selected: any) => {
    const arr: string[] = (selected as string[]) ?? [];
    if (!arr.length || (arr.length === 1 && arr[0] === ALL)) return "TODOS";

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
  // ✅ Enriquecer filas
  // ============================
  const filasEnriquecidas = useMemo(() => {
    const periodoInicial = desde || "";
    const periodoFinal = hasta || "";

    return (data as any[]).map((r: any) => {
      const impProg = (r.impuestoPrograma ?? r.impuesto_programa ?? "").toString().trim();
      const programaCodigo = String(r.programaCodigo ?? r.programa_codigo ?? "").trim();

      const impuestoProgramaLabel =
        programaCodigo && impProg ? `${programaCodigo} - ${impProg}` : impProg;

      const impuestoNombre = String(impProg ?? "")
        .replace(/\b\d+\b/g, "")
        .replace(/\s+/g, " ")
        .trim();

      const montoLiquidadoFallback =
        Number(r.montoLiquidado ?? r.monto_liquidado ?? 0) ||
        Math.round((500 + Math.random() * 9500) * 100) / 100;

      const relacionImpuestos = Array.isArray(r.relacionImpuestos)
        ? r.relacionImpuestos
        : [
            {
              codigoImpuesto: programaCodigo || "",
              nombreImpuesto: impuestoNombre || impProg || "",
              montoLiquidado: montoLiquidadoFallback,
            },
          ];

      const montoLiquidadoTotalRuc = (relacionImpuestos as any[]).reduce(
        (acc, it) => acc + (Number(it?.montoLiquidado) || 0),
        0
      );

      return {
        ...r,
        tipoInconsistencia: r.tipoInconsistencia ?? r.tipo_inconsistencia ?? "",
        impuestoPrograma: impProg,
        programaCodigo,
        impuestoProgramaLabel,
        periodoInicial,
        periodoFinal,
        relacionImpuestos,
        actividadEconomica: r.actividadEconomica ?? r.actividad_economica ?? "",
        red: r.red ?? r.redDgi ?? "",
        tipoPersona: r.tipoPersona ?? r.tipo_persona ?? "Jurídica",
        montoLiquidadoTotalRuc,
      } as any as FilaEstado;
    });
  }, [data, desde, hasta]);

  // Opciones de Código-Impuesto desde data
  const impuestosDisponibles = useMemo(() => {
    const map = new Map<string, ImpuestoOpt>();
    for (const r of filasEnriquecidas as any[]) {
      const rel = Array.isArray(r.relacionImpuestos) ? r.relacionImpuestos : [];
      for (const it of rel) {
        const cod = String(it?.codigoImpuesto ?? "").trim();
        const nom = String(it?.nombreImpuesto ?? "").trim();
        if (!cod && !nom) continue;
        const key = `${cod}__${nom}`.toLowerCase();
        if (!map.has(key)) map.set(key, makeImpuestoOpt(cod, nom));
      }
    }
    return Array.from(map.values());
  }, [filasEnriquecidas]);

  useEffect(() => {
    if (impuestoSel) {
      const exists = impuestosDisponibles.some(
        (x) => x.codigo === impuestoSel.codigo && x.nombre === impuestoSel.nombre
      );
      if (!exists) {
        setImpuestoSel(null);
        setImpuestoInput("TODOS");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [impuestosDisponibles]);

  // ============================
  // ✅ Filtrado
  // ============================
  const filtrados = useMemo(() => {
    let rows = filasEnriquecidas as any[];

    if (tipoInc !== ALL) {
      rows = rows.filter((r) => {
        const t = (r.tipoInconsistencia ?? r.tipo_inconsistencia ?? "").toString().trim();
        if (!t) return true;
        return t.toLowerCase() === String(tipoInc).toLowerCase();
      });
    }

    if (actividad !== ALL) {
      rows = rows.filter(
        (r) => String(r.estado).toLowerCase() === String(actividad).toLowerCase()
      );
    }

    if (programaSel) {
      rows = rows.filter((r) => {
        const cod = String(r.programaCodigo ?? r.programa_codigo ?? "").trim();
        if (cod) return cod === programaSel.codigo;

        const imp = (r.impuestoPrograma ?? r.impuesto_programa ?? "").toString().trim();
        if (!imp) return true;
        return imp.toLowerCase() === programaSel.nombre.toLowerCase();
      });
    }

    if (impuestoSel) {
      rows = rows.filter((r) => {
        const rel = Array.isArray(r.relacionImpuestos) ? r.relacionImpuestos : [];
        if (!rel.length) return true;
        return rel.some((it: any) => {
          const cod = String(it?.codigoImpuesto ?? "").trim();
          const nom = String(it?.nombreImpuesto ?? "").trim();
          const codOk = impuestoSel.codigo ? cod === impuestoSel.codigo : true;
          const nomOk = impuestoSel.nombre ? nom.toLowerCase() === impuestoSel.nombre.toLowerCase() : true;
          return codOk && nomOk;
        });
      });
    }

    if (actividadEcon.length > 0) {
      rows = rows.filter((r) => {
        const ae = (r.actividadEconomica ?? r.actividad_economica ?? "").toString().trim();
        if (!ae) return true;
        return actividadEcon.some((sel) => sel.toLowerCase() === ae.toLowerCase());
      });
    }

    if (red !== ALL) {
      rows = rows.filter((r) => {
        const rr = (r.red ?? r.redDgi ?? "").toString().trim();
        if (!rr) return true;
        return rr.toLowerCase() === String(red).toLowerCase();
      });
    }

    if (sem !== ALL) {
      rows = rows.filter((r) => calcularSemaforo(r.fecha) === sem);
    }

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
  }, [filasEnriquecidas, tipoInc, actividad, programaSel, impuestoSel, actividadEcon, red, sem, desde, hasta]);

  // =========================
  // ✅ Garantizar resultados
  // =========================
  const fechaParaSemaforo = (s: string) => {
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

    const semTarget = sem === ALL ? "AMARILLO" : sem;
    const fecha = fechaDentroDeRango(fechaParaSemaforo(semTarget));

    const fallbackOpt = toProgramaOpt("Omisos vs ITBMS");
    const sel = programaSel ?? (programasDisponibles[0] ?? fallbackOpt);

    const programaCodigo = sel.codigo ?? "";
    const impProg = sel.nombre ?? "";
    const impuestoProgramaLabel = sel.label ?? `${programaCodigo} - ${impProg}`;

    const relacionImpuestos = [
      {
        codigoImpuesto: programaCodigo || "",
        nombreImpuesto: impProg,
        montoLiquidado: Math.round((500 + Math.random() * 9500) * 100) / 100,
      },
    ];

    return {
      numeroTramite: num,
      ruc: "100200999",
      contribuyente: "Contribuyente Mock (Auto)",
      categoria: "Fiscalización Masiva",
      estado: (actividad !== ALL ? actividad : "asignacion") as EstadoActividad,
      fecha,
      tipoInconsistencia: tipoInc === ALL ? "Omiso" : tipoInc,

      impuestoPrograma: impProg,
      programaCodigo,
      impuestoProgramaLabel,

      periodoInicial: desde || "",
      periodoFinal: hasta || "",
      relacionImpuestos,

      actividadEconomica: actividadEcon[0] || (actividades[0]?.code ?? "Servicios"),
      red: (red !== ALL ? red : "675") || "675",
      tipoPersona: "Jurídica",

      montoLiquidadoTotalRuc: relacionImpuestos.reduce((a, it) => a + (Number(it.montoLiquidado) || 0), 0),
    };
  };

  const consultar = () => {
    if (filtrados.length === 0) {
      setData((prev) => [crearFilaQueCumpla(), ...prev]);
    }
    setMostrarResultados(true);
  };

  const limpiar = () => {
    setTipoInc(ALL);
    setActividad(ALL);
    setRed(ALL);
    setSem(ALL);

    setProgramaSel(null);
    setProgramaInput("TODOS");
    setImpuestoSel(null);
    setImpuestoInput("TODOS");

    setActividadEcon([]);

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
              setTipoInc(e.target.value);
              setMostrarResultados(false);
            }}
            SelectProps={{
              displayEmpty: true,
              renderValue: (v) => (v === ALL ? "TODOS" : String(v)),
            }}
          >
            <MenuItem value={ALL}>TODOS</MenuItem>
            {TIPOS_INCONSISTENCIA.map((t) => (
              <MenuItem key={t} value={t}>
                {t}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* ✅ Programa (Autocomplete) - FIX reset */}
        <Grid item xs={12} sm={6} md={3}>
          <Autocomplete
            options={programasDisponibles}
            value={programaSel}
            inputValue={programaInput}
            onInputChange={(_e, val, reason) => {
              // ✅ FIX: cuando MUI resetea a "" con value=null, mantener "TODOS"
              if (reason === "reset" && !programaSel && (val ?? "").trim() === "") {
                setProgramaInput("TODOS");
                return;
              }
              // si no hay selección y queda vacío -> mostrar TODOS
              if (!programaSel && (val ?? "").trim() === "" && reason !== "reset") {
                setProgramaInput("TODOS");
                return;
              }
              setProgramaInput(val);
            }}
            onChange={(_e, newValue) => {
              setProgramaSel(newValue);
              setProgramaInput(newValue ? newValue.label : "TODOS");
              setMostrarResultados(false);
            }}
            getOptionLabel={(opt) => opt?.label ?? ""}
            isOptionEqualToValue={(opt, val) => opt.nombre === val.nombre && opt.codigo === val.codigo}
            filterOptions={(options, state) => {
              const q = state.inputValue.trim().toLowerCase();
              if (!q || q === "todos") return options;
              return options.filter((o) =>
                `${o.codigo} ${o.nombre} ${o.label}`.toLowerCase().includes(q)
              );
            }}
            renderInput={(params) => <TextField {...params} label="Programa" fullWidth />}
            onOpen={() => {
              if (!programaSel && programaInput === "TODOS") setProgramaInput("");
            }}
            onClose={() => {
              if (!programaSel && (programaInput ?? "").trim() === "") setProgramaInput("TODOS");
            }}
          />
        </Grid>

        {/* ✅ Código-Impuesto (Autocomplete) - FIX reset */}
        <Grid item xs={12} sm={6} md={3}>
          <Autocomplete
            options={impuestosDisponibles}
            value={impuestoSel}
            inputValue={impuestoInput}
            onInputChange={(_e, val, reason) => {
              // ✅ FIX: cuando MUI resetea a "" con value=null, mantener "TODOS"
              if (reason === "reset" && !impuestoSel && (val ?? "").trim() === "") {
                setImpuestoInput("TODOS");
                return;
              }
              if (!impuestoSel && (val ?? "").trim() === "" && reason !== "reset") {
                setImpuestoInput("TODOS");
                return;
              }
              setImpuestoInput(val);
            }}
            onChange={(_e, newValue) => {
              setImpuestoSel(newValue);
              setImpuestoInput(newValue ? newValue.label : "TODOS");
              setMostrarResultados(false);
            }}
            getOptionLabel={(opt) => opt?.label ?? ""}
            isOptionEqualToValue={(opt, val) => opt.codigo === val.codigo && opt.nombre === val.nombre}
            filterOptions={(options, state) => {
              const q = state.inputValue.trim().toLowerCase();
              if (!q || q === "todos") return options;
              return options.filter((o) =>
                `${o.codigo} ${o.nombre} ${o.label}`.toLowerCase().includes(q)
              );
            }}
            renderInput={(params) => <TextField {...params} label="Código-Impuesto" fullWidth />}
            onOpen={() => {
              if (!impuestoSel && impuestoInput === "TODOS") setImpuestoInput("");
            }}
            onClose={() => {
              if (!impuestoSel && (impuestoInput ?? "").trim() === "") setImpuestoInput("TODOS");
            }}
          />
        </Grid>

        {/* Actividad */}
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            select
            fullWidth
            label="Actividad"
            value={actividad}
            onChange={(e) => {
              setActividad(e.target.value);
              setMostrarResultados(false);
            }}
            SelectProps={{
              displayEmpty: true,
              renderValue: (v) => (v === ALL ? "TODOS" : String(v)),
            }}
          >
            <MenuItem value={ALL}>TODOS</MenuItem>
            {ACTIVIDADES.map((a) => (
              <MenuItem key={a} value={a}>
                {a}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* ✅ Actividad Económica (MULTI) - FIX value */}
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            select
            fullWidth
            label="Actividad Económica"
            value={actividadEcon} // ✅ FIX: no pasar [ALL]
            onChange={handleActividadesChange as any}
            SelectProps={{
              multiple: true,
              displayEmpty: true, // ✅ para que se vea "TODOS" cuando está vacío
              renderValue: renderActividadChips,
            }}
            disabled={loadingAct}
          >
            <MenuItem value={ALL}>
              <Checkbox checked={actividadEcon.length === 0} />
              <ListItemText primary="TODOS" />
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
              setRed(e.target.value);
              setMostrarResultados(false);
            }}
            SelectProps={{
              displayEmpty: true,
              renderValue: (v) => (v === ALL ? "TODOS" : String(v)),
            }}
          >
            <MenuItem value={ALL}>TODOS</MenuItem>
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
              setSem(e.target.value);
              setMostrarResultados(false);
            }}
            SelectProps={{
              displayEmpty: true,
              renderValue: (v) => (v === ALL ? "TODOS" : String(v)),
            }}
          >
            <MenuItem value={ALL}>TODOS</MenuItem>
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

      {mostrarResultados && <TablaResultadosEstado rows={filtrados} />}

      {mostrarResultados && (filtrados as any)[0] && (
        <Box mt={1} fontSize={12} color="text.secondary">
          Ejemplo formato fecha: {toDDMMYYYY((filtrados as any)[0].fecha)}
        </Box>
      )}
    </Box>
  );
};

export default ConsultasDeEstado;
