import React, { useMemo, useState } from 'react';
import {
  Box,
  Grid,
  TextField,
  MenuItem,
  Button,
  Stack,
  Divider,
  Typography,
} from '@mui/material';
import { TablasResultadosSelector } from './TablasResultadosSelector';

// --- Catálogos ---
const CATEGORIAS = ['Fiscalización Masiva', 'Auditoría Sectorial', 'Grandes Contribuyentes', 'Todos'] as const;
const INCONSISTENCIAS = ['Omiso', 'Inexacto', 'Extemporáneo', 'Todos'] as const;

const PROGRAMAS_OMISO = [
  'Omisos VS Dividendos',
  'Omisos VS 431 (ITBMS)',
  'Omisos VS Informes 22, 23, 43, 44',
  'Omisos VS Renta',
  'Omisos VS ITBMS',
];

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
    periodo: '',
    categoria: 'Fiscalización Masiva',
    inconsistencia: 'Inexacto',
    actividadEconomica: '',
    tipologia: '',
    programa: '',
    valoresDeclarados: '',
    periodoInicial: '',
    periodoFinal: '',
  });

  const [mostrarResultados, setMostrarResultados] = useState(false);

  const esAS = form.categoria === 'Auditoría Sectorial';
  const esFM = form.categoria === 'Fiscalización Masiva';

  // Programas dinámicos según inconsistencia
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
    case 'Extemporáneo': return 'Extemporáneo'; // así lo espera tu tabla
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
        tipologia: value === 'Auditoría Sectorial' ? '' : prev.tipologia,
        actividadEconomica: value === 'Fiscalización Masiva' ? '' : prev.actividadEconomica,
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

  const handleConsultar = () => setMostrarResultados(true);

  const handleLimpiar = () => {
    setForm({
      periodo: '',
      categoria: 'Fiscalización Masiva',
      inconsistencia: 'Inexacto',
      actividadEconomica: '',
      tipologia: '',
      programa: '',
      valoresDeclarados: '',
      periodoInicial: '',
      periodoFinal: '',
    });
    setMostrarResultados(false);
  };

  return (
    <Box>
      <Grid container spacing={2}>
        {/* 1. PERIODO */}
        <Grid item xs={12} sm={3}>
          <TextField
            fullWidth
            type="date"
            label="Periodo"
            name="periodo"
            value={form.periodo}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        {/* 2. CATEGORÍA */}
        <Grid item xs={12} sm={5}>
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

        {/* 3. Tipo de Inconsistencia */}
        <Grid item xs={12} sm={4}>
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

        {/* Actividad Económica */}
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

        {/* Tipología */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Tipología"
            name="tipologia"
            value={form.tipologia}
            onChange={handleChange}
            disabled={!esFM}
            placeholder="Escriba aquí..."
          />
        </Grid>

        {/* Programa dinámico */}
        <Grid item xs={12}>
          <Divider sx={{ my: 1 }} />
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

        {/* Valores declarados */}
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

        {/* Periodo Inicial / Final */}
        <Grid item xs={6} md={2.5}>
          <TextField
            fullWidth
            type="date"
            label="Periodo Inicial"
            name="periodoInicial"
            value={form.periodoInicial}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={6} md={2.5}>
          <TextField
            fullWidth
            type="date"
            label="Periodo Final"
            name="periodoFinal"
            value={form.periodoFinal}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        {/* Botones */}
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

 {mostrarResultados && (
  <Box mt={2}>
    <TablasResultadosSelector
      estado={mapEstadoToTabla(form.inconsistencia)}
      categoria={form.categoria}
    />
  </Box>
)}
    </Box>
  );
};
