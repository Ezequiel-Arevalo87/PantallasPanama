import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Grid,
  TextField,
  MenuItem,
  Button,
  Stack,
  InputAdornment,
  ListItemText,
  Checkbox,
  Chip,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import Swal from 'sweetalert2';
import PriorizacionForm from './PriorizacionForm';
import { Actividad, loadActividades } from '../services/actividadesLoader';
import { NumericFormat, type NumericFormatProps } from 'react-number-format';

/* ================= CATALOGOS BASE ================= */
const CATEGORIAS = ['Fiscalización Masiva', 'Auditoría Sectorial', 'Grandes Contribuyentes', 'Todos'] as const;
const INCONSISTENCIAS = ['Omiso', 'Inexacto', 'Extemporáneo', 'Todos'] as const;

const PROVINCIAS = [
  'Todos',
  'Panamá',
  'Colón',
  'Darién',
  'Coclé',
  'Veraguas',
  'Bocas del Toro',
  'Herrera',
  'Los Santos',
  'Chiriquí',
  'Panamá Oeste',
] as const;

/* ===== HU: Zonas especiales ===== */
const ZONAS_ESPECIALES = [
  'Ninguna',
  'Panamá Pacífico',
  'Zona Franca',
  'SEM',
] as const;

/* ===== Programas ===== */
const PROGRAMAS_OMISO = [
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

const OPERADORES = ['>=', '<=', '==', '!='] as const;

const ALL_VALUE = '__ALL__';
const uniqCaseInsensitive = (items: string[]) =>
  Array.from(new Map(items.map((s) => [s.trim().toLowerCase(), s])).values());

/* ================= Input numérico ================= */
const NumericFormatCustom = React.forwardRef<HTMLInputElement, NumericFormatProps>(
  function NumericFormatCustom(props, ref) {
    const { onChange, ...rest } = props as any;
    return (
      <NumericFormat
        {...rest}
        getInputRef={ref}
        thousandSeparator
        decimalScale={2}
        allowNegative={false}
        onValueChange={(values) => {
          onChange?.({
            target: { name: props.name, value: values.value },
          });
        }}
      />
    );
  }
);

/* =============================================================================
 * COMPONENTE PRINCIPAL
 * ============================================================================= */
export const Priorizacion: React.FC = () => {

  const [form, setForm] = useState<any>({
    categoria: 'Fiscalización Masiva',
    inconsistencia: 'Inexacto',
    provincia: 'Todos',
    impuesto: 'Todos',
    zonaEspecial: 'Ninguna',
    actividadEconomica: [] as string[],
    programa: '',
    operador: '>=',
    valorMin: '',
    valorMax: '',
    periodoInicial: '',
    periodoFinal: '',
  });

  const [mostrarResultados, setMostrarResultados] = useState(false);

  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [loadingAct, setLoadingAct] = useState<boolean>(true);

  const esAS = form.categoria === 'Auditoría Sectorial';

  /* ================= LOAD ACTIVIDADES ================= */
  useEffect(() => {
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

  /* ================= HANDLERS ================= */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === 'categoria') {
      setForm((prev: any) => ({
        ...prev,
        categoria: value,
        actividadEconomica:
          value === 'Auditoría Sectorial' ? prev.actividadEconomica : [],
      }));
      setMostrarResultados(false);
      return;
    }

    setForm((prev: any) => ({ ...prev, [name]: value }));
    setMostrarResultados(false);
  };

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

  /* ================= VALIDACIONES ================= */
  const parseISO = (s: string) => (s ? new Date(s + 'T00:00:00') : null);

  const handleConsultar = async () => {
    const dIni = parseISO(form.periodoInicial);
    const dFin = parseISO(form.periodoFinal);

    if (!dIni || !dFin) {
      await Swal.fire('Fechas requeridas', 'Ambas fechas son obligatorias.', 'error');
      return;
    }

    if (!(dIni < dFin)) {
      await Swal.fire('Rango inválido', 'La fecha inicial debe ser menor que la final.', 'error');
      return;
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    if (dFin.getTime() > hoy.getTime()) {
      await Swal.fire('Fecha no permitida', 'La fecha final no puede ser mayor que hoy.', 'error');
      return;
    }

    const diffYears = Math.abs((dFin.getTime() - dIni.getTime()) / 31557600000);
    if (diffYears > 5) {
      const { isConfirmed } = await Swal.fire({
        title: 'Advertencia',
        text: 'El período supera 5 años. ¿Continuar?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí',
        cancelButtonText: 'Cancelar',
        reverseButtons: true,
      });
      if (!isConfirmed) return;
    }

    setMostrarResultados(true);
  };

  const handleLimpiar = () => {
    setForm({
      categoria: 'Fiscalización Masiva',
      inconsistencia: 'Inexacto',
      provincia: 'Todos',
      impuesto: 'Todos',
      zonaEspecial: 'Ninguna',
      actividadEconomica: [] as string[],
      programa: '',
      operador: '>=',
      valorMin: '',
      valorMax: '',
      periodoInicial: '',
      periodoFinal: '',
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

  /* =============================================================================
   * RENDER
   * ============================================================================= */
  return (
    <Box>
      <Grid container spacing={2}>

        {/* Categoría */}
        <Grid item xs={12} sm={6}>
          <TextField
            select fullWidth
            label="Categoría"
            name="categoria"
            value={form.categoria}
            onChange={handleChange}
          >
            {CATEGORIAS.map((c) => (
              <MenuItem key={c} value={c}>{c}</MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* Inconsistencia */}
        <Grid item xs={12} sm={6}>
          <TextField
            select fullWidth
            label="Tipo de Inconsistencia"
            name="inconsistencia"
            value={form.inconsistencia}
            onChange={handleChange}
          >
            {INCONSISTENCIAS.map((t) => (
              <MenuItem key={t} value={t}>{t}</MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* Provincia */}
        <Grid item xs={12} sm={6}>
          <TextField
            select fullWidth
            label="Provincia"
            name="provincia"
            value={form.provincia}
            onChange={handleChange}
          >
            {PROVINCIAS.map((p) => (
              <MenuItem key={p} value={p}>{p}</MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* Zona Especial */}
        <Grid item xs={12} sm={6}>
          <TextField
            select fullWidth
            label="Zona Especial"
            name="zonaEspecial"
            value={form.zonaEspecial}
            onChange={handleChange}
          >
            {ZONAS_ESPECIALES.map((z) => (
              <MenuItem key={z} value={z}>{z}</MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* Programa */}
        <Grid item xs={12} sm={6}>
          <TextField
            select fullWidth
            label="Impuesto"
            name="programa"
            value={form.programa}
            onChange={handleChange}
            disabled={programasDisponibles.length === 0}
          >
            {programasDisponibles.map((p) => (
              <MenuItem key={p} value={p}>{p}</MenuItem>
            ))}
          </TextField>
        </Grid>

     {/* Actividad Económica */}

  <Grid item xs={12} md={6}>
    <TextField
      select
      fullWidth
      label="Actividad Económica"
      name="actividadEconomica"
      value={form.actividadEconomica}
      onChange={handleActividadesChange as any}
      SelectProps={{ multiple: true, renderValue: renderActividadChips }}
      disabled={loadingAct}
    >
      <MenuItem value={ALL_VALUE}>
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



        {/* Operador */}
        <Grid item xs={6} md={3}>
          <TextField
            select fullWidth
            label="Operador"
            name="operador"
            value={form.operador}
            onChange={handleChange}
          >
            {OPERADORES.map((op) => (
              <MenuItem key={op} value={op}>{op}</MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* Valor MIN */}
        <Grid item xs={6} md={3}>
          <TextField
            fullWidth
            label="Valor  (B/.)"
            name="valorMin"
            value={form.valorMin}
            onChange={handleChange}
            InputProps={{
              startAdornment: <InputAdornment position="start">B/.</InputAdornment>,
              inputComponent: NumericFormatCustom as any,
            }}
          />
        </Grid>

 

        {/* Fechas */}
        <Grid item xs={6} md={3}>
          <TextField
            fullWidth type="date"
            label="Fecha Inicial"
            name="periodoInicial"
            value={form.periodoInicial}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        <Grid item xs={6} md={3}>
          <TextField
            fullWidth type="date"
            label="Fecha Final"
            name="periodoFinal"
            value={form.periodoFinal}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        {/* Acciones */}
        <Grid item xs={12}>
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button variant="contained" onClick={handleConsultar}>CONSULTAR</Button>
            <Button variant="contained" color="inherit" onClick={handleLimpiar}>LIMPIAR</Button>
          </Stack>
        </Grid>

      </Grid>

      {/* RESULTADOS */}
      {mostrarResultados && (
        <PriorizacionForm
          categoria={form.categoria}
          inconsistencia={form.inconsistencia}
          actividadEconomica={esAS ? form.actividadEconomica : []}
          impuesto={form.programa}
          zonaEspecial={form.zonaEspecial}
          programa={form.programa}
          periodoInicial={form.periodoInicial}
          periodoFinal={form.periodoFinal}
          operador={form.operador}
          valorMin={form.valorMin}
          valorMax={form.valorMax}
          provincia={form.provincia}
        />
      )}

    </Box>
  );
};

export default Priorizacion;
