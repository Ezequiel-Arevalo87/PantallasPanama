import React, { useState } from 'react';
import {
  Grid, Paper, TextField, MenuItem, Stack, Button, Divider,
  Table, TableHead, TableRow, TableCell, TableBody, Typography
} from '@mui/material';

// Catálogos
const CATEGORIAS = [
  'Todos',
  'Grandes Contribuyentes',
  'Fiscalización Masiva',
  'Auditoría Sectorial',
] as const;

const TIPOS = ['Todos', 'Persona Física y Natural', 'Persona Jurídica'] as const;

// Mock impuestos
const IMPUESTOS = ['Renta', 'ITBMS', 'ISR', 'Dividendos'];

type Resultado = {
  ruc: string;
  contribuyente: string;
  ingresos: number;
  saldo: number;
  impuesto: string;
  ultimaFecha: string;
};

const fmtMoney = new Intl.NumberFormat('es-CO');

const AnalisisFiscal: React.FC = () => {
  const [form, setForm] = useState<any>({
    categoria: 'Grandes Contribuyentes',
    tipo: 'Persona Jurídica',
    actividad: '9609',
    ingresosMin: '',
    ingresosMax: '',
    saldosMin: '',
    saldosMax: '',
    ruc: '',
    periodoInicio: '',
    periodoFin: '',
  });

  const [resultados, setResultados] = useState<Resultado[]>([]);

  const onChange =
    (name: string) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev: any) => ({ ...prev, [name]: e.target.value }));

  const onLimpiar = () => {
    setForm({
      categoria: 'Todos',
      tipo: 'Todos',
      actividad: '',
      ingresosMin: '',
      ingresosMax: '',
      saldosMin: '',
      saldosMax: '',
      ruc: '',
      periodoInicio: '',
      periodoFin: '',
    });
    setResultados([]);
  };

  const onConsultar = () => {
    // 🔹 Datos mock
    const data: Resultado[] = [
      {
        ruc: '65545645',
        contribuyente: 'Compañía abc',
        ingresos: 5000000,
        saldo: 200000,
        impuesto: 'Renta',
        ultimaFecha: '2024-12-31',
      },
      {
        ruc: '65564512',
        contribuyente: 'Compañía def',
        ingresos: 4500000,
        saldo: 25000,
        impuesto: 'ITBMS',
        ultimaFecha: '2025-04-30',
      },
    ];
    setResultados(data);
  };

  const onDescargar = () => {
    if (!resultados.length) return;
    const headers = ['RUC','Contribuyente','Ingresos Declarados','Saldo actual cartera','Impuesto','Última fecha recaudo'];
    const rows = resultados.map(r =>
      [r.ruc, r.contribuyente, r.ingresos, r.saldo, r.impuesto, r.ultimaFecha].join(';')
    );
    const csv = [headers.join(';'), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analisis_fiscal.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Paper variant="outlined" sx={{ p: 2.5, bgcolor: '#f4f7fb' }}>
      <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
        Análisis relevancia estratégica fiscal
      </Typography>

      {/* Formulario */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <TextField
            select fullWidth size="small"
            label="Categoría de Contribuyente"
            value={form.categoria}
            onChange={onChange('categoria')}
          >
            {CATEGORIAS.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </TextField>
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            select fullWidth size="small"
            label="Tipo de Contribuyente"
            value={form.tipo}
            onChange={onChange('tipo')}
          >
            {TIPOS.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
          </TextField>
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth size="small"
            label="Actividad Económica Principal"
            value={form.actividad}
            onChange={onChange('actividad')}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2">Ingresos Declarados ISR</Typography>
          <Stack direction="row" spacing={2}>
            <TextField size="small" label="≥ $" value={form.ingresosMin} onChange={onChange('ingresosMin')} />
            <TextField size="small" label="≤ $" value={form.ingresosMax} onChange={onChange('ingresosMax')} />
          </Stack>
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2">Saldos en cartera</Typography>
          <Stack direction="row" spacing={2}>
            <TextField size="small" label="≥ $" value={form.saldosMin} onChange={onChange('saldosMin')} />
            <TextField size="small" label="≤ $" value={form.saldosMax} onChange={onChange('saldosMax')} />
          </Stack>
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField fullWidth size="small" label="RUC" value={form.ruc} onChange={onChange('ruc')} />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField fullWidth size="small" type="date" label="Periodo inicial"
            value={form.periodoInicio} onChange={onChange('periodoInicio')}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField fullWidth size="small" type="date" label="Periodo final"
            value={form.periodoFin} onChange={onChange('periodoFin')}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
      </Grid>

      <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ mt: 2 }}>
        <Button variant="outlined" color="inherit" onClick={onLimpiar}>LIMPIAR</Button>
        <Button variant="contained" onClick={onConsultar}>CONSULTAR</Button>
      </Stack>

      {/* Resultados */}
      {resultados.length > 0 && (
        <Paper variant="outlined" sx={{ mt: 3, p: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>RUC</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Contribuyente</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Ingresos Declarados</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Saldo actual cartera</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Impuesto</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Última fecha recaudo</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {resultados.map((r, idx) => (
                <TableRow key={idx} hover>
                  <TableCell>{r.ruc}</TableCell>
                  <TableCell>{r.contribuyente}</TableCell>
                  <TableCell>{fmtMoney.format(r.ingresos)}</TableCell>
                  <TableCell>{fmtMoney.format(r.saldo)}</TableCell>
                  <TableCell>{r.impuesto}</TableCell>
                  <TableCell>{new Date(r.ultimaFecha).toLocaleDateString('es-CO')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Stack direction="row" spacing={2} sx={{ mt: 2 }} justifyContent="center">
            <Button variant="contained" color="success">APROBAR</Button>
            <Button variant="outlined" onClick={onDescargar}>DESCARGAR INFORME</Button>
          </Stack>
        </Paper>
      )}
    </Paper>
  );
};

export default AnalisisFiscal;
