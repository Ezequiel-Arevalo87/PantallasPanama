import React, { useMemo, useState } from 'react';
import {
  Box,
  Grid,
  TextField,
  MenuItem,
  Button,
  Stack,
  Typography,
  Paper,
} from '@mui/material';
import { TablasResultadosSelector } from './TablasResultadosSelector';
import Swal from 'sweetalert2';

const CATEGORIAS = ['Fiscalización Masiva', 'Auditoría Sectorial', 'Grandes Contribuyentes', 'Todos'] as const;
const INCONSISTENCIAS = ['Omiso', 'Inexacto', 'Extemporáneo', 'Todos'] as const;

const PROGRAMAS_OMISO = [
  'Omisos VS Dividendos',
  'Omisos VS 431 (ITBMS)',
  'Omisos VS Informes 22, 23, 43, 44',
  'Omisos VS Renta',
  'Omisos VS ITBMS',
];
const TIPOLOGIAS_FM = ['ITBMS', 'Dividendos', 'Patrimonio', 'Ingresos'] as const;


const PROGRAMAS_INEXACTO = [
  'Gastos vs anexos',
  'Ventas vs anexos',
  'Ingresos vs anexos',
  'Costos vs anexos',
  'Gastos vs Reportes ventas de tercer',
  'Costos vs reportes ventas de tercer',
];

const PROGRAMAS_EXTEMPORANEO = ['Fecha de Presentación'];

export const InicioSelectorForm: React.FC = () => {
  const [form, setForm] = useState<any>({
    periodoInicial: '',
    periodoFinal: '',
    categoria: 'Fiscalización Masiva',
    inconsistencia: 'Inexacto',
    actividadEconomica: '',
    tipologia: '',
    programa: '',
    valoresDeclarados: '',
  });

  const [mostrarResultados, setMostrarResultados] = useState(false);

  const esAS = form.categoria === 'Auditoría Sectorial';
  const esFM = form.categoria === 'Fiscalización Masiva';

  const requiereFechas = form.inconsistencia === 'Omiso';

  const programasDisponibles = useMemo(() => {
    switch (form.inconsistencia) {
      case 'Omiso':
        return PROGRAMAS_OMISO;
      case 'Inexacto':
        return PROGRAMAS_INEXACTO;
      case 'Extemporáneo':
        return PROGRAMAS_EXTEMPORANEO;
      case 'Todos':
        return [...PROGRAMAS_OMISO, ...PROGRAMAS_INEXACTO, ...PROGRAMAS_EXTEMPORANEO];
      default:
        return [];
    }
  }, [form.inconsistencia]);

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

    if (name === 'categoria') {
      setForm((prev: any) => ({
        ...prev,
        categoria: value,
        tipologia: value === 'Auditoría Sectorial' ? prev.tipologia : '',
        actividadEconomica: value === 'Fiscalización Masiva' ? prev.actividadEconomica : '',
      }));
      setMostrarResultados(false);
      return;
    }

    if (name === 'inconsistencia') {
      setForm((prev: any) => ({
        ...prev,
        inconsistencia: value,
        programa: '',
      }));
      setMostrarResultados(false);
      return;
    }

    setForm((prev: any) => ({ ...prev, [name]: value }));
    setMostrarResultados(false);
  };




const handleConsultar = async () => {
  const requiereFechas = form.inconsistencia === 'Omiso';

  // Si NO es Omiso, no validamos periodos en absoluto
  if (!requiereFechas) {
    setMostrarResultados(true);
    return;
  }

  // === Desde acá, solo para Omiso ===
  const parseISO = (s: string) => (s ? new Date(s + 'T00:00:00') : null);
  const dIni = parseISO(form.periodoInicial);
  const dFin = parseISO(form.periodoFinal);

  if (!dIni || !dFin) {
    await Swal.fire({
      title: 'Fechas requeridas',
      text: 'Para la inconsistencia "Omiso", la Fecha Inicial y la Fecha Final son obligatorias.',
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


  console.log('sdsd', form.tipologia)
  const handleLimpiar = () => {
    setForm({
      periodoInicial: '',
      periodoFinal: '',
      categoria: 'Fiscalización Masiva',
      inconsistencia: 'Inexacto',
      actividadEconomica: '',
      tipologia: '',
      programa: '',
      valoresDeclarados: '',
    });
    setMostrarResultados(false);
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

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Actividad Económica"
              name="actividadEconomica"
              value={form.actividadEconomica}
              onChange={handleChange}
              disabled={!esAS}
              placeholder="Escriba aquí..."
            />
          </Grid>
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
              value={form.programa}
              onChange={handleChange}
              disabled={programasDisponibles.length === 0}
            >
              {programasDisponibles.map((p) => (
                <MenuItem key={p} value={p}>
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

          {/* === Fechas con requerimiento condicional para Omiso === */}
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              type="date"
              label="Fecha Inicial"
              name="periodoInicial"
              value={form.periodoInicial}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
              required={requiereFechas}
              error={requiereFechas && !form.periodoInicial}
              helperText={
                requiereFechas && !form.periodoInicial ? 'Obligatoria para Omiso' : ''
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
              required={requiereFechas}
              error={requiereFechas && !form.periodoFinal}
              helperText={
                requiereFechas && !form.periodoFinal ? 'Obligatoria para Omiso' : ''
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
