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
} from "../services/mockEstados";

import TablaResultadosEstado from "./TablaResultadosEstado";

// ✅ Igual que Priorización
import { Actividad, loadActividades } from "../services/actividadesLoader";

// ✅ Catálogo fijo de impuestos (Excel)
import { IMPUESTOS, type ImpuestoOpt } from "../catalogos/impuestos";

// ✅ Catálogos separados
import {
  ALL,
  ACTIVIDADES,
  TIPOS_INCONSISTENCIA,
  PROGRAMAS_OMISO,
  PROGRAMAS_INEXACTO,
  PROGRAMAS_EXTEMPORANEO,
  REDS,
  uniqCaseInsensitive,
  toProgramaOpt,
  type ProgramaOpt,
} from "../catalogos/consultasEstado.catalogos";

dayjs.extend(customParseFormat);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

// ✅ Multi-select actividad económica
type ActividadEconSel = string[]; // lista de códigos (vacía => TODOS)

const parseFecha = (f: any) => {
  const s = (f ?? "").toString().trim();
  if (!s) return null;
  const d = dayjs(s, ["YYYY-MM-DD", "YYYY-MM-DDTHH:mm:ss.SSSZ", "DD/MM/YYYY"], true);
  return d.isValid() ? d : null;
};

// ============================
// ✅ util: hash simple para seleccionar impuesto "estable" por trámite
// ============================
const hashStr = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
};

const pickImpuestoFromCatalog = (seed: string, fallbackNombre?: string) => {
  const list = Array.isArray(IMPUESTOS) ? IMPUESTOS : [];
  if (!list.length) {
    return { codigo: "", nombre: fallbackNombre ?? "" };
  }
  const idx = hashStr(seed || "seed") % list.length;
  const it = list[idx];
  return { codigo: String(it.codigo ?? "").trim(), nombre: String(it.nombre ?? "").trim() };
};

const randomMonto = (seed: string) => {
  // determinístico por seed
  const h = hashStr(seed || "seed");
  const base = 500 + (h % 9500);
  const cents = (h % 100) / 100;
  return Math.round((base + cents) * 100) / 100;
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
  // ✅ Opciones Código-Impuesto (catálogo fijo)
  // ============================
  const impuestosDisponibles = useMemo<ImpuestoOpt[]>(() => {
    return IMPUESTOS ?? [];
  }, []);

  // Si cambian opciones (o llega vacío) y la selección ya no existe -> limpiar
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
  // ✅ Enriquecer filas (FIX REAL)
  // - Garantiza relacionImpuestos con codigoImpuesto REAL del catálogo
  // - Calcula montoLiquidadoTotalRuc correcto
  // - Expone codigoImpuestoPrincipal para la tabla
  // ============================
  const filasEnriquecidas = useMemo(() => {
    const periodoInicial = desde || "";
    const periodoFinal = hasta || "";

    return (data as any[]).map((r: any) => {
      const tramite = String(r.numeroTramite ?? r.tramite ?? r.noTramite ?? "").trim();
      const seed = tramite || String(r.ruc ?? "") || JSON.stringify(r);

      const impProg = String(r.impuestoPrograma ?? r.impuesto_programa ?? "").trim();
      const programaCodigo = String(r.programaCodigo ?? r.programa_codigo ?? "").trim();

      // ✅ IMPORTANTE: el programa en tabla debe ser SOLO nombre (NO "TODOS" ni código)
      const impuestoProgramaLabel = impProg || "";

      // monto fallback si no viene
      const montoFallback = Number(r.montoLiquidado ?? r.monto_liquidado ?? 0) || randomMonto(seed);

      // relación existente
      const relIn = Array.isArray(r.relacionImpuestos) ? r.relacionImpuestos : [];

      // ✅ Si el mock trae "codigoImpuesto" = programaCodigo (error típico),
      // lo corregimos con un impuesto real del catálogo
      const elegido = pickImpuestoFromCatalog(seed, impProg);

      const relOut =
        relIn.length > 0
          ? relIn.map((it: any, idx: number) => {
              const cod = String(it?.codigoImpuesto ?? "").trim();
              const nom = String(it?.nombreImpuesto ?? "").trim();
              const monto =
                Number(it?.montoLiquidado ?? it?.monto_liquidado ?? 0) ||
                randomMonto(`${seed}|${idx}`);

              const codCorregido =
                !cod || cod === programaCodigo ? String(elegido.codigo) : cod;

              const nomCorregido =
                !nom || nom.toLowerCase() === impProg.toLowerCase()
                  ? String(elegido.nombre || nom || impProg)
                  : nom;

              return {
                codigoImpuesto: codCorregido,
                nombreImpuesto: nomCorregido,
                montoLiquidado: Math.round(Number(monto) * 100) / 100,
              };
            })
          : [
              {
                codigoImpuesto: String(elegido.codigo),
                nombreImpuesto: String(elegido.nombre || impProg),
                montoLiquidado: Math.round(Number(montoFallback) * 100) / 100,
              },
            ];

      const montoLiquidadoTotalRuc = relOut.reduce(
        (acc: number, it: any) => acc + (Number(it?.montoLiquidado) || 0),
        0
      );

      const codigoImpuestoPrincipal = String(relOut?.[0]?.codigoImpuesto ?? "").trim();

      return {
        ...r,
        tipoInconsistencia: r.tipoInconsistencia ?? r.tipo_inconsistencia ?? "",
        impuestoPrograma: impProg,
        programaCodigo,
        impuestoProgramaLabel,

        periodoInicial,
        periodoFinal,

        relacionImpuestos: relOut,
        codigoImpuestoPrincipal,

        actividadEconomica: r.actividadEconomica ?? r.actividad_economica ?? "",
        red: r.red ?? r.redDgi ?? "",
        tipoPersona: r.tipoPersona ?? r.tipo_persona ?? "Jurídica",

        montoLiquidadoTotalRuc: Math.round(Number(montoLiquidadoTotalRuc) * 100) / 100,
      } as any as FilaEstado;
    });
  }, [data, desde, hasta]);

  // ============================
  // ✅ Filtrado
  // ============================
  const filtrados = useMemo(() => {
    let rows = filasEnriquecidas as any[];

    if (tipoInc !== ALL) {
      rows = rows.filter((r) => {
        const t = String(r.tipoInconsistencia ?? r.tipo_inconsistencia ?? "").trim();
        if (!t) return true;
        return t.toLowerCase() === String(tipoInc).toLowerCase();
      });
    }

    if (actividad !== ALL) {
      rows = rows.filter((r) => String(r.estado).toLowerCase() === String(actividad).toLowerCase());
    }

    // Programa (usa codigo internamente, muestra nombre)
    if (programaSel) {
      rows = rows.filter((r) => {
        const cod = String(r.programaCodigo ?? r.programa_codigo ?? "").trim();
        if (cod) return cod === programaSel.codigo;

        const imp = String(r.impuestoPrograma ?? r.impuesto_programa ?? "").trim();
        if (!imp) return true;
        return imp.toLowerCase() === programaSel.nombre.toLowerCase();
      });
    }

    // ✅ Código-Impuesto: filtra por relaciónImpuestos.codigoImpuesto (ya corregido)
    if (impuestoSel?.codigo) {
      rows = rows.filter((r) => {
        const rel = Array.isArray(r.relacionImpuestos) ? r.relacionImpuestos : [];
        if (!rel.length) return false;
        return rel.some((it: any) => String(it?.codigoImpuesto ?? "").trim() === impuestoSel.codigo);
      });
    }

    if (actividadEcon.length > 0) {
      rows = rows.filter((r) => {
        const ae = String(r.actividadEconomica ?? r.actividad_economica ?? "").trim();
        if (!ae) return true;
        return actividadEcon.some((sel) => sel.toLowerCase() === ae.toLowerCase());
      });
    }

    if (red !== ALL) {
      rows = rows.filter((r) => {
        const rr = String(r.red ?? r.redDgi ?? "").trim();
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

  // ============================
  // ✅ Garantizar resultados
  // ============================
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

    const impProg = sel.nombre ?? "";

    // ✅ Impuesto real del catálogo
    const elegido = pickImpuestoFromCatalog(num, impProg);
    const relacionImpuestos = [
      {
        codigoImpuesto: String(elegido.codigo),
        nombreImpuesto: String(elegido.nombre || impProg),
        montoLiquidado: randomMonto(num),
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
      programaCodigo: sel.codigo ?? "",
      impuestoProgramaLabel: impProg, // ✅ SOLO nombre

      periodoInicial: desde || "",
      periodoFinal: hasta || "",

      relacionImpuestos,
      codigoImpuestoPrincipal: String(relacionImpuestos[0].codigoImpuesto),

      actividadEconomica: actividadEcon[0] || (actividades[0]?.code ?? "Servicios"),
      red: (red !== ALL ? red : "675") || "675",
      tipoPersona: "Jurídica",

      montoLiquidadoTotalRuc: relacionImpuestos.reduce(
        (a, it) => a + (Number(it.montoLiquidado) || 0),
        0
      ),
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

        {/* ✅ Programa (Autocomplete) - SOLO NOMBRE */}
        <Grid item xs={12} sm={6} md={3}>
          <Autocomplete
            options={programasDisponibles}
            value={programaSel}
            inputValue={programaInput}
            onInputChange={(_e, val, reason) => {
              if (reason === "reset" && !programaSel && (val ?? "").trim() === "") {
                setProgramaInput("TODOS");
                return;
              }
              if (!programaSel && (val ?? "").trim() === "" && reason !== "reset") {
                setProgramaInput("TODOS");
                return;
              }
              setProgramaInput(val);
            }}
            onChange={(_e, newValue) => {
              setProgramaSel(newValue);
              setProgramaInput(newValue ? newValue.nombre : "TODOS");
              setMostrarResultados(false);
            }}
            getOptionLabel={(opt) => opt?.nombre ?? ""}
            isOptionEqualToValue={(opt, val) => opt.nombre === val.nombre && opt.codigo === val.codigo}
            filterOptions={(options, state) => {
              const q = state.inputValue.trim().toLowerCase();
              if (!q || q === "todos") return options;
              return options.filter((o) => `${o.nombre} ${o.codigo}`.toLowerCase().includes(q));
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

        {/* ✅ Código-Impuesto (Autocomplete) */}
        <Grid item xs={12} sm={6} md={3}>
          <Autocomplete
            options={impuestosDisponibles}
            value={impuestoSel}
            inputValue={impuestoInput}
            onInputChange={(_e, val, reason) => {
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
              return options.filter((o) => `${o.codigo} ${o.nombre} ${o.label}`.toLowerCase().includes(q));
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

    {/* ✅ Actividad Económica (MULTI) */}
<Grid item xs={12} sm={6} md={3}>
  <TextField
    select
    fullWidth
    label="Actividad Económica"
    value={actividadEcon}
    onChange={handleActividadesChange as any}
    InputLabelProps={{ shrink: true }}   // ✅ FIX: evita que se monte con "TODOS"
    SelectProps={{
      multiple: true,
      displayEmpty: true,
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
