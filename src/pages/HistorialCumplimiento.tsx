import React, { useEffect, useMemo, useState } from 'react';
import {
  Grid, Paper, TextField, MenuItem, Stack, Button, Divider,
  Table, TableHead, TableRow, TableCell, TableBody, Typography, Snackbar
} from '@mui/material';
import { loadActividades } from '../services/actividadesLoader';

const CATEGORIAS = [
  'Todos',
  'Grandes Contribuyentes',
  'Fiscalización Masiva',
  'Auditoría Sectorial',
] as const;

const TIPOS = ['Todos', 'Persona Física y Natural', 'Persona Jurídica'] as const;

type Actividad = { code: string; label: string };
type Impuesto = { code: number; label: string };

const IMPUESTOS: Impuesto[] = [
  { code: 22,  label: 'InformarPAT' },
  { code: 101, label: 'Renta Natural' },
  { code: 102, label: 'Renta Juridica' },
  { code: 120, label: 'Transf. Inmuebles' },
  { code: 130, label: 'Inmuebles' },
  { code: 140, label: 'Aviso de Operación' },
  { code: 201, label: 'ITBMS Importación' },
  { code: 202, label: 'ITBMS' },
  { code: 250, label: 'Retención ITBMS' },
  { code: 280, label: 'Suerte y Azar' },
];

// utilidades de formato
const fmtMoney = new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0 });
const fmtDate = (iso: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2,'0');
  const mm = String(d.getMonth()+1).padStart(2,'0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};
const daysDiff = (aISO: string, bISO: string) => {
  // a - b en días (negativo si a < b)
  const a = new Date(aISO).getTime();
  const b = new Date(bISO).getTime();
  const diff = Math.round((a - b) / (1000*60*60*24));
  return diff;
};

const HistorialCumplimiento: React.FC = () => {
  const [form, setForm] = useState<any>({
    categoria: 'Grandes Contribuyentes',
    tipo: 'Todos',
    actividad: '9609',
    impuesto: 102,
    ingresosMin: '',
    ingresosMax: '',
    saldosMin: '',
    saldosMax: '',
    ruc: '123456',
    periodoInicio: '2024-01-01',
    periodoFin: '2024-12-31',
  });

  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [loadingAct, setLoadingAct] = useState<boolean>(true);

  // resultado simulado
  const [resultado, setResultado] = useState<any | null>(null);
  const [snack, setSnack] = useState<string>('');

  useEffect(() => {
    loadActividades().then((arr: any) => {
      setActividades(arr);
      setLoadingAct(false);
    });
  }, []);

  const actividadSeleccionada = useMemo(
    () => actividades.find(a => a.code === form.actividad)?.label ?? '',
    [form.actividad, actividades]
  );

  const onChange =
    (name: string) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev: any) => ({ ...prev, [name]: e.target.value }));

  const onChangeNumero =
    (name: string) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev: any) => ({ ...prev, [name]: e.target.value.replace(/[^\d]/g, '') }));

  const onLimpiar = () => {
    setForm({
      categoria: 'Todos',
      tipo: 'Todos',
      actividad: '',
      impuesto: 102,
      ingresosMin: '',
      ingresosMax: '',
      saldosMin: '',
      saldosMax: '',
      ruc: '',
      periodoInicio: '',
      periodoFin: '',
    });
    setResultado(null);
  };

  const onConsultar = () => {
    // === Datos MOCK de ejemplo (puedes sustituirlos por los del backend) ===
    const fecPresentacion = '2025-03-31';
    const fecPresentada   = '2025-04-15';
    const fechaVenPago    = '2025-03-31';
    const fechaPago       = '2025-06-01';
    const vrPagar = 250000;
    const vrPagado = 240000;
    const saldo = vrPagar - vrPagado;

    const diasExtempo = daysDiff(fecPresentada, fecPresentacion);  // -15
    const diasMora    = daysDiff(fechaPago, fechaVenPago);         // -62

    // años (muestra solo YYYY)
    const perIni = form.periodoInicio ? new Date(form.periodoInicio).getFullYear() : '';
    const perFin = form.periodoFin ? new Date(form.periodoFin).getFullYear() : '';

    const impuestoSel = IMPUESTOS.find(i => i.code === Number(form.impuesto));

    setResultado({
      ruc: form.ruc || '—',
      nombre: 'Compañía xyz',
      impuesto: impuestoSel ? `${impuestoSel.code} ${impuestoSel.label}` : form.impuesto,
      periodoInicial: perIni,
      periodoFinal: perFin,
      fecPresentacion, fecPresentada, diasExtempo,
      fechaVenPago, fechaPago, diasMora,
      vrPagar, vrPagado, saldo
    });
  };

  const onAprobar = () => setSnack('Aprobado');
  const onDescargar = () => {
    if (!resultado) return;
    const headers = [
      'RUC','Nombre contribuyente','','Tipo de Impuesto','PERIODO INICIAL','PERIODO FINAL','FEC PRESENTACION','FEC PRESENTADA','DIAS EXTEMPO','FECHA VEN PAGO','FECHA PAGO','DIAS MORA','VR A PAGAR','VR PAGADO','SALDO'
    ];
    const row1 = [resultado.ruc, resultado.nombre];
    const row2 = [
      '', '', '',
      resultado.impuesto, resultado.periodoInicial, resultado.periodoFinal,
      fmtDate(resultado.fecPresentacion), fmtDate(resultado.fecPresentada), resultado.diasExtempo,
      fmtDate(resultado.fechaVenPago), fmtDate(resultado.fechaPago), resultado.diasMora,
      fmtMoney.format(resultado.vrPagar), fmtMoney.format(resultado.vrPagado), fmtMoney.format(resultado.saldo)
    ];
    const csv = [headers.join(';'), row1.join(';'), row2.join(';')].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `informe_${resultado.ruc}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Paper variant="outlined" sx={{ p: 2.5, bgcolor: '#f4f7fb' }}>
      {/* Fila 1: Categoría / Tipo / Actividad */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <TextField
            select fullWidth size="small"
            label="Categoría de Contribuyente"
            value={form.categoria}
            onChange={onChange('categoria')}
          >
            {CATEGORIAS.map((c) => (
              <MenuItem key={c} value={c}>{c}</MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            select fullWidth size="small"
            label="Tipo de Contribuyente"
            value={form.tipo}
            onChange={onChange('tipo')}
          >
            {TIPOS.map((t) => (
              <MenuItem key={t} value={t}>{t}</MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            select fullWidth size="small"
            label="Actividad Económica Principal"
            value={form.actividad}
            onChange={onChange('actividad')}
          >
            <MenuItem value="">Todos</MenuItem>
            {actividades.map((a) => (
              <MenuItem key={a.code} value={a.code}>{a.label}</MenuItem>
            ))}
          </TextField>
        </Grid>
      </Grid>

      <Divider sx={{ my: 2 }} />

      {/* Fila 2: RUC / Periodos / Impuesto */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth size="small" label="RUC"
            value={form.ruc}
            onChange={onChangeNumero('ruc')}
            placeholder="########-#-#######"
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth size="small"
            label="Periodo Inicial"
            type="date"
            value={form.periodoInicio}
            onChange={onChange('periodoInicio')}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth size="small"
            label="Periodo Final"
            type="date"
            value={form.periodoFin}
            onChange={onChange('periodoFin')}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        <Grid item xs={12} md={8}>
          <TextField
            select fullWidth size="small"
            label="Tipo de Impuesto"
            value={form.impuesto}
            onChange={onChange('impuesto')}
          >
            {IMPUESTOS.map((i) => (
              <MenuItem key={i.code} value={i.code}>
                {i.code} &nbsp; {i.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
      </Grid>

      <Divider sx={{ my: 2 }} />

      {/* Botones */}
      <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ mt: 2 }}>
        <Button variant="outlined" color="inherit" onClick={onLimpiar}>LIMPIAR</Button>
        <Button variant="contained" onClick={onConsultar}>CONSULTAR</Button>
      </Stack>

      {/* ====== RESULTADO ====== */}
      {resultado && (
  <Paper variant="outlined" sx={{ p: 2, mt: 3 }}>
          <TableBody>
        <TableRow>
          <TableCell sx={{ fontWeight: 700 }}>RUC</TableCell>
          <TableCell colSpan={11}>{resultado.ruc}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell sx={{ fontWeight: 700 }}>Nombre contribuyente</TableCell>
          <TableCell colSpan={11}>{resultado.nombre}</TableCell>
        </TableRow>
      </TableBody>
    <Table size="small">


      <TableHead>
        <TableRow>
          <TableCell sx={{ fontWeight: 700 }}>Tipo de Impuesto</TableCell>
          <TableCell sx={{ fontWeight: 700 }}>PERIODO INICIAL</TableCell>
          <TableCell sx={{ fontWeight: 700 }}>PERIODO FINAL</TableCell>
          <TableCell sx={{ fontWeight: 700 }}>FEC PRESENTACION</TableCell>
          <TableCell sx={{ fontWeight: 700 }}>FEC PRESENTADA</TableCell>
          <TableCell sx={{ fontWeight: 700 }}>DIAS EXTEMPO</TableCell>
          <TableCell sx={{ fontWeight: 700 }}>FECHA VEN PAGO</TableCell>
          <TableCell sx={{ fontWeight: 700 }}>FECHA PAGO</TableCell>
          <TableCell sx={{ fontWeight: 700 }}>DIAS MORA</TableCell>
          <TableCell sx={{ fontWeight: 700 }}>VR A PAGAR</TableCell>
          <TableCell sx={{ fontWeight: 700 }}>VR PAGADO</TableCell>
          <TableCell sx={{ fontWeight: 700 }}>SALDO</TableCell>
        </TableRow>
      </TableHead>

      <TableBody>
        <TableRow hover>
          <TableCell>{resultado.impuesto}</TableCell>
          <TableCell>{resultado.periodoInicial}</TableCell>
          <TableCell>{resultado.periodoFinal}</TableCell>
          <TableCell>{fmtDate(resultado.fecPresentacion)}</TableCell>
          <TableCell>{fmtDate(resultado.fecPresentada)}</TableCell>
          <TableCell>{resultado.diasExtempo}</TableCell>
          <TableCell>{fmtDate(resultado.fechaVenPago)}</TableCell>
          <TableCell>{fmtDate(resultado.fechaPago)}</TableCell>
          <TableCell>{resultado.diasMora}</TableCell>
          <TableCell>{fmtMoney.format(resultado.vrPagar)}</TableCell>
          <TableCell>{fmtMoney.format(resultado.vrPagado)}</TableCell>
          <TableCell>{fmtMoney.format(resultado.saldo)}</TableCell>
        </TableRow>
      </TableBody>
    </Table>

    <Stack direction="row" spacing={2} sx={{ mt: 2 }} justifyContent="center">
      <Button variant="contained" color="success" onClick={onAprobar}>APROBAR</Button>
      <Button variant="outlined" onClick={onDescargar}>DESCARGAR INFORME</Button>
    </Stack>
  </Paper>
)}

      <Snackbar
        open={!!snack}
        autoHideDuration={2000}
        onClose={() => setSnack('')}
        message={snack}
      />
    </Paper>
  );
};

export default HistorialCumplimiento;
