import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Grid,
  TextField,
  MenuItem,
  Button,
  Stack,
  Typography,
  Paper,
  Chip,
  Checkbox,
  ListItemText,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import { TablasResultadosSelector } from './TablasResultadosSelector';
import Swal from 'sweetalert2';
import { Actividad, loadActividades } from '../services/actividadesLoader';

const CATEGORIAS = ['Fiscalización Masiva', 'Auditoría Sectorial', 'Grandes Contribuyentes', 'Todos'] as const;
const INCONSISTENCIAS = ['Omiso', 'Inexacto', 'Extemporáneo', 'Todos'] as const;

// --- Catálogos ---
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
const TIPOLOGIAS_FM = ['ITBMS', 'Dividendos', 'Patrimonio', 'Ingresos'] as const;
const PROGRAMAS_EXTEMPORANEO = [
  'Base contribuyentes VS Calendario ISR',
  'Base contribuyentes VS Calendario ITBMS',
  'Base contribuyentes VS Calendario retenciones ITBMS',
] as const;

// --- Helper para deduplicar (case-insensitive, mantiene el primer orden) ---
const uniqCaseInsensitive = (items: string[]) =>
  Array.from(new Map(items.map(s => [s.trim().toLowerCase(), s])).values());

const ALL_VALUE = '__ALL__';

export const InicioSelectorForm: React.FC = () => {
  const [form, setForm] = useState<any>({
    periodoInicial: '',
    periodoFinal: '',
    categoria: 'Fiscalización Masiva',
    inconsistencia: 'Inexacto',
    actividadEconomica: [] as string[],  // 👈 ahora es array para selección múltiple
    tipologia: '',
    programa: '',
    valoresDeclarados: '',
  });

  const [mostrarResultados, setMostrarResultados] = useState(false);
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [loadingAct, setLoadingAct] = useState<boolean>(true);

  useEffect(() => {
    loadActividades().then((arr: Actividad[]) => {
      setActividades(arr ?? []);
      setLoadingAct(false);
    });
  }, []);

  const esAS = form.categoria === 'Auditoría Sectorial';
  const esFM = form.categoria === 'Fiscalización Masiva';

  const requiereFechasFlag = form.inconsistencia === 'Omiso' || form.inconsistencia === 'Inexacto';

  const actividadesMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const a of actividades) m.set(a.code, a.label);
    return m;
  }, [actividades]);

  // Memo de programasDisponibles (dedup en "Todos")
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

  useEffect(() => {
    if (form.programa && !programasDisponibles.includes(form.programa)) {
      setForm((prev: any) => ({ ...prev, programa: '' }));
    }
  }, [programasDisponibles, form.programa]);

  const mapEstadoToTabla = (v: string) => {
    switch (v) {
      case 'Omiso': return 'omiso';
      case 'Inexacto': return 'inexacto';
      case 'Extemporáneo': return 'Extemporáneo';
      case 'Todos': return 'Todos';
      default: return v;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === 'inconsistencia') {
      setForm((prev: any) => ({
        ...prev,
        inconsistencia: value,
        programa: '', // reset al cambiar la inconsistencia
      }));
      setMostrarResultados(false);
      return;
    }

    if (name === 'categoria') {
      // ✅ actividadEconomica se usa en Auditoría Sectorial (AS)
      // ✅ tipologia (Impuesto) se usa en Fiscalización Masiva (FM)
      setForm((prev: any) => ({
        ...prev,
        categoria: value,
        actividadEconomica: value === 'Auditoría Sectorial' ? prev.actividadEconomica : [],
        tipologia: value === 'Fiscalización Masiva' ? prev.tipologia : '',
      }));
      setMostrarResultados(false);
      return;
    }

    setForm((prev: any) => ({ ...prev, [name]: value }));
    setMostrarResultados(false);
  };

  const handleActividadesChange = (e: SelectChangeEvent<string[]>) => {
    const raw = e.target.value as unknown as string[]; // MUI típicamente entrega string[] en multiple
    // Si el usuario elige "Todas", limpiamos la selección
    if (raw.includes(ALL_VALUE)) {
      setForm((prev: any) => ({ ...prev, actividadEconomica: [] }));
      setMostrarResultados(false);
      return;
    }

    const next = uniqCaseInsensitive(raw.filter(v => v !== ALL_VALUE));
    setForm((prev: any) => ({ ...prev, actividadEconomica: next }));
    setMostrarResultados(false);
  };

  const handleConsultar = async () => {
    const requiereFechas = form.inconsistencia === 'Omiso' || form.inconsistencia === 'Inexacto';

    if (!requiereFechas) {
      setMostrarResultados(true);
      return;
    }

    const parseISO = (s: string) => (s ? new Date(s + 'T00:00:00') : null);
    const dIni = parseISO(form.periodoInicial);
    const dFin = parseISO(form.periodoFinal);

    if (!dIni || !dFin) {
      await Swal.fire({
        title: 'Fechas requeridas',
        text: 'Para la inconsistencia seleccionada, la Fecha Inicial y la Fecha Final son obligatorias.',
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

    setMostrarResultados(true);
  };

  const handleLimpiar = () => {
    setForm({
      periodoInicial: '',
      periodoFinal: '',
      categoria: 'Fiscalización Masiva',
      inconsistencia: 'Inexacto',
      actividadEconomica: [] as string[],
      tipologia: '',
      programa: '',
      valoresDeclarados: '',
    });
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

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
          DGI - Dirección General de Ingresos
        </Typography>

        <Grid container columnSpacing={2} rowSpacing={2}>
          <Grid item xs={12} md={6}>
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

          <Grid item xs={12} md={6}>
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

          {/* ---- Actividad Económica (AS) - múltiple ---- */}
          <Grid item xs={12} md={6}>
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
              
              </MenuItem>
              {actividades.map((a) => (
                <MenuItem key={a.code} value={a.code}>
                  <Checkbox checked={form.actividadEconomica.includes(a.code)} />
                  <ListItemText primary={`${a.code} — ${a.label}`} />
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* ---- Impuesto (FM) ---- */}
          <Grid item xs={12} md={6}>
            <TextField
              select
              fullWidth
              label="Impuesto"
              name="tipologia"
              value={form.tipologia}
              onChange={handleChange}
              disabled={!esFM}
              placeholder="Seleccione…"
            >
              {TIPOLOGIAS_FM.map((t) => (
                <MenuItem key={t} value={t}>
                  {t}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12}>
            <TextField
              select
              fullWidth
              label="Programa"
              name="programa"
              value={form.programa ?? ''}
              onChange={handleChange}
              disabled={programasDisponibles.length === 0}
            >
              {programasDisponibles.map((p) => (
                <MenuItem key={p.toLowerCase()} value={p}>
                  {p}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Valores Declarados"
              name="valoresDeclarados"
              type="number"
              value={form.valoresDeclarados}
              onChange={handleChange}
            />
          </Grid>

          {/* === Fechas con requerimiento condicional === */}
          <Grid item xs={12} md={4}>
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
              helperText={
                requiereFechasFlag && !form.periodoInicial ? 'Obligatoria para la inconsistencia seleccionada' : ''
              }
            />
          </Grid>
          <Grid item xs={12} md={4}>
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
              helperText={
                requiereFechasFlag && !form.periodoFinal ? 'Obligatoria para la inconsistencia seleccionada' : ''
              }
            />
          </Grid>

          <Grid item xs={12}>
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button variant="contained" onClick={handleConsultar}>
                CONSULTAR
              </Button>
              <Button variant="contained" color="inherit" onClick={handleLimpiar}>
                LIMPIAR
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {mostrarResultados && (
        <Box mt={2}>
          <TablasResultadosSelector
            estado={mapEstadoToTabla(form.inconsistencia)}
            categoria={form.categoria}
            tipologia={form.tipologia}
            programa={form.programa}
          />
        </Box>
      )}
    </Box>
  );
};
