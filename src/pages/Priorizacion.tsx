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
import PriorizacionForm from './PriorizacionForm';
import { Actividad, loadActividades } from '../services/actividadesLoader';

/** ===== Catálogos base ===== */
const CATEGORIAS = ['Fiscalización Masiva', 'Auditoría Sectorial', 'Grandes Contribuyentes', 'Todos'] as const;
const INCONSISTENCIAS = ['Omiso', 'Inexacto', 'Extemporáneo', 'Todos'] as const;

const PROGRAMAS_OMISO = [
  'Omisos VS Dividendos',
  'Omisos VS 431 (ITBMS)',
  'Omisos VS Informes 22, 23, 43, 44',
  'Omisos VS Renta',
  'Omisos VS ITBMS',
] as const;

const PROGRAMAS_INEXACTO = [
  'Gastos vs anexos',
  'Ventas vs anexos',
  'Ingresos vs anexos',
  'Costos vs anexos',
  'Gastos vs Reportes ventas de tercer',
  'Costos vs reportes ventas de tercer',
] as const;

const PROGRAMAS_EXTEMPORANEO = ['Fecha de Presentación'] as const;

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
    'Manipulación de márgenes sectoriales', // 👈 solo éste, como en tu hoja
  ],
  // Si te pasan más filas del Excel, las agregas aquí.
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
    actividadEconomica: [] as string[],  // múltiple
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
  const esFM = form.categoria === 'Fiscalización Masiva';

  /** cargar actividades (mismo patrón del componente guía) */
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

  // Programas dinámicos (si los usas luego)
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

  // Criterios EXACTOS del Excel según Categoría + Inconsistencia
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
        tipologia: value === 'Fiscalización Masiva' ? prev.tipologia : '',
        actividadEconomica: value === 'Auditoría Sectorial' ? prev.actividadEconomica : [],
      }));
      setCriterioSel('');
      setMostrarResultados(false);
      return;
    }

    if (name === 'inconsistencia') {
      setForm((prev: any) => ({
        ...prev,
        inconsistencia: value,
        programa: '',
      }));
      setCriterioSel('');
      setMostrarResultados(false);
      return;
    }

    setForm((prev: any) => ({ ...prev, [name]: value }));
    setMostrarResultados(false);
  };

  /** Actividad Económica (múltiple) — patrón guía */
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

  const handleConsultar = () => setMostrarResultados(true);

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

        {/* Valores declarados (libre) */}
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

       

        {/* Lista de condiciones */}
        <Grid item xs={12}>
          <Paper variant="outlined" sx={{ p: 1 }}>
            {condiciones.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
               
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
        />
      )}
    </Box>
  );
};

export default Priorizacion;
