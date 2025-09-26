import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Grid,
  TextField,
  MenuItem,
  Button,
  Stack,
  Divider,
  Typography,
  Chip,
  Paper,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  Checkbox,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import Swal from 'sweetalert2';
import PriorizacionForm from './PriorizacionForm';
import { Actividad, loadActividades } from '../services/actividadesLoader';

/** ===== Catálogos base ===== */
const CATEGORIAS = ['Fiscalización Masiva', 'Auditoría Sectorial', 'Grandes Contribuyentes', 'Todos'] as const;
const INCONSISTENCIAS = ['Omiso', 'Inexacto', 'Extemporáneo', 'Todos'] as const;

/** ===== Programas unificados ===== */
const PROGRAMAS_OMISO = [
  'Omisos vs Dividendos',
  'Omisos vs retenciones 4331 ITBMS',
  'Omisos vs informes',
  'Omisos vs ISR Renta',
  'Omisos vs ITBMS',
] as const;

const PROGRAMAS_INEXACTO = [
  'Costos y gastos vs Anexos',
  'Ventas e ingresos vs Anexos',
  'Inexactos vs retenciones 4331 ITBMS',
  'Inexactos vs ITBMS',
] as const;

const PROGRAMAS_EXTEMPORANEO = [
  'Base contribuyentes VS Calendario ISR',
  'Base contribuyentes VS Calendario ITBMS',
  'Base contribuyentes VS Calendario retenciones ITBMS',
] as const;

/** ===== Operadores de condición ===== */
const OPERADORES = ['>=', '<=', '==', '!='] as const;

/** ===== EXACTO al Excel: Categoria + Inconsistencia → Lista de selección ===== */
const CRITERIOS_EXCEL: Record<string, string[]> = {
  // Grandes Contribuyentes
  'Grandes Contribuyentes|Omiso': [
    'Alto volumen de operaciones',
    'Reincidencia de omisión',
  ],
  'Grandes Contribuyentes|Inexacto': [
    'Subdeclaración sistemática',
    'Uso excesivo de gastos no deducibles',
  ],
  // Auditoría Sectorial
  'Auditoría Sectorial|Inexacto': [
    'Manipulación de márgenes sectoriales',
  ],
  // Agrega más filas si tu Excel crece
};

type Operador = (typeof OPERADORES)[number];

type Condicion = {
  criterio: string;
  operador: Operador;
  valorBalboas: number;
};

const ALL_VALUE = '__ALL__';
const uniqCaseInsensitive = (items: string[]) =>
  Array.from(new Map(items.map((s) => [s.trim().toLowerCase(), s])).values());

export const Priorizacion: React.FC = () => {
  const [form, setForm] = useState<any>({
    periodo: '',
    categoria: 'Fiscalización Masiva',
    inconsistencia: 'Inexacto',
    actividadEconomica: [] as string[], // múltiple
    tipologia: '',
    programa: '',
    valoresDeclarados: '',
    periodoInicial: '',
    periodoFinal: '',
  });

  const [mostrarResultados, setMostrarResultados] = useState(false);

  // construcción de condición
  const [criterioSel, setCriterioSel] = useState<string>('');
  const [operadorSel, setOperadorSel] = useState<Operador>('>=');
  const [valorBalboas, setValorBalboas] = useState<string>('');

  // actividades económicas
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [loadingAct, setLoadingAct] = useState<boolean>(true);

  // condiciones agregadas
  const [condiciones, setCondiciones] = useState<Condicion[]>([]);

  const esAS = form.categoria === 'Auditoría Sectorial';

  /** cargar actividades */
  useEffect(() => {
    loadActividades().then((arr) => {
      setActividades(arr ?? []);
      setLoadingAct(false);
    });
  }, []);

  /** Mapa code->label para chips */
  const actividadesMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const a of actividades) m.set(a.code, a.label);
    return m;
  }, [actividades]);

  /** Programas dinámicos por inconsistencia */
  const programasDisponibles = useMemo(() => {
    switch (form.inconsistencia) {
      case 'Omiso':
        return [...PROGRAMAS_OMISO];
      case 'Inexacto':
        return [...PROGRAMAS_INEXACTO];
      case 'Extemporáneo':
        return [...PROGRAMAS_EXTEMPORANEO];
      case 'Todos':
        return uniqCaseInsensitive([
          ...PROGRAMAS_OMISO,
          ...PROGRAMAS_INEXACTO,
          ...PROGRAMAS_EXTEMPORANEO,
        ]);
      default:
        return [];
    }
  }, [form.inconsistencia]);

  /** Si cambia inconsistencia y el programa ya no aplica, se limpia */
  useEffect(() => {
    if (form.programa && !programasDisponibles.includes(form.programa)) {
      setForm((prev: any) => ({ ...prev, programa: '' }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programasDisponibles]);

  /** Criterios EXACTOS del Excel según Categoría + Inconsistencia */
  const criteriosDisponibles = useMemo(() => {
    const key = `${form.categoria}|${form.inconsistencia}`;
    return CRITERIOS_EXCEL[key] ?? [];
  }, [form.categoria, form.inconsistencia]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === 'categoria') {
      setForm((prev: any) => ({
        ...prev,
        categoria: value,
        // mantiene lo demás; aquí no usamos tipologia en esta pantalla
      }));
      setCriterioSel('');
      setMostrarResultados(false);
      return;
    }

    if (name === 'inconsistencia') {
      setForm((prev: any) => ({
        ...prev,
        inconsistencia: value,
        programa: '', // reset al cambiar el tipo de inconsistencia
      }));
      setCriterioSel('');
      setMostrarResultados(false);
      return;
    }

    setForm((prev: any) => ({ ...prev, [name]: value }));
    setMostrarResultados(false);
  };

  /** Actividad Económica (múltiple) */
  const handleActividadesChange = (e: SelectChangeEvent<string[]>) => {
    const raw = e.target.value as unknown as string[];
    if (raw.includes(ALL_VALUE)) {
      setForm((prev: any) => ({ ...prev, actividadEconomica: [] }));
      setMostrarResultados(false);
      return;
    }
    const next = uniqCaseInsensitive(raw.filter((v) => v !== ALL_VALUE));
    setForm((prev: any) => ({ ...prev, actividadEconomica: next }));
    setMostrarResultados(false);
  };

  /** Agregar condición (criterio + operador + monto B/.) */
  const handleAgregarCondicion = () => {
    const monto = Number(valorBalboas);
    if (!criterioSel) return;
    if (!OPERADORES.includes(operadorSel)) return;
    if (Number.isNaN(monto) || monto < 0) return;

    const nueva: Condicion = { criterio: criterioSel, operador: operadorSel, valorBalboas: monto };
    const yaExiste = condiciones.some(
      (c) => c.criterio === nueva.criterio && c.operador === nueva.operador && c.valorBalboas === nueva.valorBalboas
    );
    if (yaExiste) return;

    setCondiciones((prev) => [...prev, nueva]);
    setValorBalboas('');
  };

  const handleEliminarCondicion = (idx: number) => {
    setCondiciones((prev) => prev.filter((_, i) => i !== idx));
  };

  /** === Validaciones de fechas & confirmación CPT === */
  const requiereFechas = form.inconsistencia !== ''; // igual que tu otro form

  const parseISO = (s: string) => (s ? new Date(s + 'T00:00:00') : null);

  const handleConsultar = async () => {
    if (requiereFechas) {
      const dIni = parseISO(form.periodoInicial);
      const dFin = parseISO(form.periodoFinal);

      if (!dIni || !dFin) {
        await Swal.fire({
          title: 'Fechas requeridas',
          text: 'La Fecha Inicial y la Fecha Final son obligatorias.',
          icon: 'error',
          confirmButtonText: 'Entendido',
        });
        return;
      }

      if (!(dIni < dFin)) {
        await Swal.fire({
          title: 'Rango inválido',
          text: 'La fecha inicial debe ser estrictamente menor que la fecha final.',
          icon: 'error',
          confirmButtonText: 'Entendido',
        });
        return;
      }

      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      if (dFin.getTime() > hoy.getTime()) {
        await Swal.fire({
          title: 'Fecha No Permitida',
          text: 'La fecha final no puede ser posterior a la fecha actual del sistema.',
          icon: 'error',
          confirmButtonText: 'Ok',
        });
        return;
      }

      const diffYears = (a: Date, b: Date) =>
        Math.abs((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24 * 365.25));

      const years = diffYears(dIni, dFin);
      if (years > 5) {
        const { isConfirmed } = await Swal.fire({
          title:
            'Señor auditor de fiscalización, el período seleccionado supera los cinco años permitidos por el CPT',
          text: '¿Desea continuar con el proceso?',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Continuar',
          cancelButtonText: 'Cancelar',
          reverseButtons: true,
          focusCancel: true,
        });
        if (!isConfirmed) return;
      }
    }

    setMostrarResultados(true);
  };

  const handleLimpiar = () => {
    setForm({
      periodo: '',
      categoria: 'Fiscalización Masiva',
      inconsistencia: 'Inexacto',
      actividadEconomica: [] as string[],
      tipologia: '',
      programa: '',
      valoresDeclarados: '',
      periodoInicial: '',
      periodoFinal: '',
    });
    setCriterioSel('');
    setOperadorSel('>=');
    setValorBalboas('');
    setCondiciones([]);
    setMostrarResultados(false);
  };

  const renderActividadChips = (selected: any) => {
    const arr: string[] = selected as string[];
    if (!arr?.length) return 'Todas';
    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
        {arr.map((code) => (
          <Chip key={code} size="small" label={actividadesMap.get(code) ?? code} />
        ))}
      </Box>
    );
  };

  const requiereFechasFlag = requiereFechas;

  return (
    <Box>
      <Grid container spacing={2}>
        {/* Categoría */}
        <Grid item xs={12} sm={6}>
          <TextField
            select
            fullWidth
            label="Categoría"
            name="categoria"
            value={form.categoria}
            onChange={handleChange}
          >
            {CATEGORIAS.map((c) => (
              <MenuItem key={c} value={c}>
                {c}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* Tipo de Inconsistencia */}
        <Grid item xs={12} sm={6}>
          <TextField
            select
            fullWidth
            label="Tipo de Inconsistencia"
            name="inconsistencia"
            value={form.inconsistencia}
            onChange={handleChange}
          >
            {INCONSISTENCIAS.map((t) => (
              <MenuItem key={t} value={t}>
                {t}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* Programa dependiente de Inconsistencia */}
        <Grid item xs={12}>
          <TextField
            select
            fullWidth
            label="Programa"
            name="programa"
            value={form.programa ?? ''}
            onChange={handleChange}
            disabled={programasDisponibles.length === 0}
            helperText={programasDisponibles.length === 0 ? 'Seleccione primero un Tipo de Inconsistencia' : ''}
          >
            {programasDisponibles.map((p) => (
              <MenuItem key={p.toLowerCase()} value={p}>
                {p}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* Actividad Económica (múltiple, solo AS) */}
        <Grid item xs={12} md={8}>
          <TextField
            select
            fullWidth
            label="Actividad Económica"
            name="actividadEconomica"
            value={form.actividadEconomica}
            onChange={handleActividadesChange as any}
            disabled={!esAS || loadingAct}
            helperText={!esAS ? 'Disponible en Auditoría Sectorial' : ''}
            SelectProps={{
              multiple: true,
              renderValue: renderActividadChips,
            }}
          >
            <MenuItem value={ALL_VALUE} disabled={loadingAct}>
              <Checkbox checked={form.actividadEconomica.length === 0} />
              <ListItemText primary="Todas" />
            </MenuItem>
            {actividades.map((a) => (
              <MenuItem key={a.code} value={a.code}>
                <Checkbox checked={form.actividadEconomica.includes(a.code)} />
                <ListItemText primary={`${a.code} — ${a.label}`} />
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* Valores declarados */}
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Valores Declarados"
            name="valoresDeclarados"
            type="number"
            value={form.valoresDeclarados}
            onChange={handleChange}
            InputProps={{ startAdornment: <InputAdornment position="start">B/.</InputAdornment> }}
          />
        </Grid>

        {/* Criterio — SOLO lo del Excel */}
        <Grid item xs={12} md={6}>
          <TextField
            select
            fullWidth
            label="Criterio"
            value={criterioSel}
            onChange={(e) => setCriterioSel(e.target.value)}
            disabled={criteriosDisponibles.length === 0}
            helperText={
              criteriosDisponibles.length === 0
                ? 'No hay criterios para esta combinación de Categoría + Inconsistencia'
                : ''
            }
          >
            {criteriosDisponibles.map((c) => (
              <MenuItem key={c} value={c}>
                {c}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* Operador */}
        <Grid item xs={6} md={3}>
          <TextField
            select
            fullWidth
            label="Operador"
            value={operadorSel}
            onChange={(e) => setOperadorSel(e.target.value as Operador)}
          >
            {OPERADORES.map((op) => (
              <MenuItem key={op} value={op}>
                {op}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* Valor en B/. */}
        <Grid item xs={6} md={3}>
          <TextField
            fullWidth
            label="Valor (B/.)"
            type="number"
            value={valorBalboas}
            onChange={(e) => setValorBalboas(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start">B/.</InputAdornment>,
              inputProps: { min: 0, step: '0.01' },
            }}
          />
        </Grid>

        {/* === Fechas === */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type="date"
            label="Fecha Inicial"
            name="periodoInicial"
            value={form.periodoInicial}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
            required={requiereFechasFlag}
            error={requiereFechasFlag && !form.periodoInicial}
            helperText={requiereFechasFlag && !form.periodoInicial ? 'Obligatoria' : ''}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type="date"
            label="Fecha Final"
            name="periodoFinal"
            value={form.periodoFinal}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
            required={requiereFechasFlag}
            error={requiereFechasFlag && !form.periodoFinal}
            helperText={requiereFechasFlag && !form.periodoFinal ? 'Obligatoria' : ''}
          />
        </Grid>

        {/* Lista de condiciones */}
        <Grid item xs={12}>
          <Paper variant="outlined" sx={{ p: 1 }}>
            {condiciones.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Agrega condiciones con el Criterio / Operador / Valor y presiona “+”.
              </Typography>
            ) : (
              <List dense>
                {condiciones.map((c, idx) => (
                  <ListItem
                    key={`${c.criterio}-${c.operador}-${c.valorBalboas}-${idx}`}
                    secondaryAction={
                      <IconButton edge="end" aria-label="delete" onClick={() => handleEliminarCondicion(idx)}>
                        <DeleteOutlineIcon />
                      </IconButton>
                    }
                  >
                    <ListItemText
                      primary={c.criterio}
                      secondary={`Regla: ${c.operador} B/. ${c.valorBalboas.toLocaleString('es-PA', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}`}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>

        {/* Acciones */}
        <Grid item xs={12}>
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            {/* Botón para agregar condición */}
            <Button
              variant="outlined"
              onClick={handleAgregarCondicion}
              disabled={!criterioSel || !valorBalboas}
            >
              + Condición
            </Button>

            <Button variant="contained" onClick={handleConsultar}>
              CONSULTAR
            </Button>
            <Button variant="contained" color="inherit" onClick={handleLimpiar}>
              LIMPIAR
            </Button>
          </Stack>
        </Grid>
      </Grid>

      {mostrarResultados && (
        <PriorizacionForm
          condiciones={condiciones}
          categoria={form.categoria}
          inconsistencia={form.inconsistencia}
          actividadEconomica={form.actividadEconomica}
          valoresDeclarados={form.valoresDeclarados}
          /* nuevos props útiles para el backend / reporte */
          programa={form.programa}
          periodoInicial={form.periodoInicial}
          periodoFinal={form.periodoFinal}
        />
      )}
    </Box>
  );
};

export default Priorizacion;
