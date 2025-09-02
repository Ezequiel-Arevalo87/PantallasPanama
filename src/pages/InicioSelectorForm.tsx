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
  Paper,
} from '@mui/material';
import { TablasResultadosSelector } from './TablasResultadosSelector';
import Swal from 'sweetalert2';

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
  // Estado unificado y con nombres consistentes
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
        // cuando cambia categoría, resetea lo que no aplica
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
  const parseISO = (s: string) => (s ? new Date(s + 'T00:00:00') : null);

const hoyYMD = () => {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
};

// Diferencia en años (aprox) usando milisegundos
const diffYears = (a: Date, b: Date) => Math.abs((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24 * 365.25));


 const handleConsultar = async () => {
  const dIni = parseISO(form.periodoInicial);
  const dFin = parseISO(form.periodoFinal);
  const hoy = parseISO(hoyYMD());

  // Si alguna fecha falta, simplemente consultar (no cambiamos tu flujo)
  if (!dIni || !dFin) {
    setMostrarResultados(true);
    return;
  }

  // 1) Inicial < Final (no iguales)
  if (!(dIni < dFin)) {
    await Swal.fire({
      title: 'Rango inválido',
      text: 'El periodo inicial debe ser estrictamente menor que el periodo final.',
      icon: 'error',
      confirmButtonText: 'Entendido',
    });
    return;
  }

  // 2) Final <= Hoy
  if (hoy && dFin.getTime() > hoy.getTime()) {
    await Swal.fire({
      title: 'Fecha final no permitida',
      text: 'El periodo final no puede ser posterior a la fecha actual del sistema.',
      icon: 'error',
      confirmButtonText: 'Ok',
    });
    return;
  }

  // 3) Más de 5 años de diferencia -> advertencia con Continuar / Cancelar
  const years = diffYears(dIni, dFin);
  if (years > 5) {
    const { isConfirmed } = await Swal.fire({
      title: 'Rango mayor a 5 años',
      text: 'No está permitido, pero puedes continuar bajo tu responsabilidad.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Continuar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
      focusCancel: true,
    });
    if (!isConfirmed) return; // cancelar
  }

  // Si pasa las validaciones (o el usuario continuó), mostrar resultados
  setMostrarResultados(true);
};


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

        {/* Grid estable: 12 columnas, con 3 cols en desktop */}
        <Grid container columnSpacing={2} rowSpacing={2}>
          {/* Fila 1 */}

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

          {/* Fila 2 */}
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
              fullWidth
              label="Tipología"
              name="tipologia"
              value={form.tipologia}
              onChange={handleChange}
              disabled={!esFM}
              placeholder="Escriba aquí..."
            />
          </Grid>

          {/* Fila 3 */}
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

          {/* Fila 4 */}
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
          <Grid item xs={12} md={4}>
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
          <Grid item xs={12} md={4}>
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
          {/* espacios para mantener cuadrícula */}
          <Grid item xs={12} md={8} />

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
      </Paper>

     {/* ...dentro del return, donde renderizas resultados */}
{mostrarResultados && (
  <Box mt={2}>
    <TablasResultadosSelector
      estado={mapEstadoToTabla(form.inconsistencia)}
      categoria={form.categoria}
      programa={form.programa}   // 👈 NUEVO
    />
  </Box>
)}

    </Box>
  );
};
