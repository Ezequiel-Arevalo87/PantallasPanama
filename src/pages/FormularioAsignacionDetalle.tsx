import React, { useState } from 'react';
import { Box, Grid, Typography, TextField, MenuItem, Button, Stack } from '@mui/material';
import dayjs from 'dayjs';

export const FormularioAsignacionDetalle = () => {
  const [fechaAsignacion, setFechaAsignacion] = useState('2025-07-31');
  const [fechaVencimiento, setFechaVencimiento] = useState('2025-08-17');

  const [supervisor, setSupervisor] = useState('');
  const [auditor, setAuditor] = useState('');
  const [fechaMemo, setFechaMemo] = useState('');
  const [periodo, setPeriodo] = useState('');
  const [mensaje, setMensaje] = useState('');

  const calcularDias = () => {
    const f1 = dayjs(fechaAsignacion);
    const f2 = dayjs(fechaVencimiento);
    return f2.diff(f1, 'day');
  };

  const handleContinuar = () => {
    setMensaje('✅ La asignación ha sido registrada correctamente.');
    setTimeout(() => setMensaje(''), 4000);
  };

  return (
    <Box mt={5}>
      <Typography align="center" color="red" fontWeight="bold" mb={2}>ASIGNACIÓN</Typography>
      <Grid container spacing={2} justifyContent="center">
        {/* Fechas izquierda */}
        <Grid item xs={12} md={4}>
          <Grid container border={1}>
            <Grid item xs={6} p={1} bgcolor="#d8e3f0"><strong>Fecha de Asignación</strong></Grid>
            <Grid item xs={6} p={1}>
              <TextField
                type="date"
                fullWidth
                value={fechaAsignacion}
                onChange={(e) => setFechaAsignacion(e.target.value)}
              />
            </Grid>
            <Grid item xs={6} p={1} bgcolor="#f7d9c4"><strong>Fecha del Vencimiento</strong></Grid>
            <Grid item xs={6} p={1}>
              <TextField
                type="date"
                fullWidth
                value={fechaVencimiento}
                onChange={(e) => setFechaVencimiento(e.target.value)}
              />
            </Grid>
          </Grid>
        </Grid>

        {/* Campos derecha */}
        <Grid item xs={12} md={6}>
          <Grid container border={1}>
            <Grid item xs={6} p={1} bgcolor="#fce7da">Supervisor</Grid>
            <Grid item xs={6} p={1}>
              <TextField fullWidth select value={supervisor} onChange={(e) => setSupervisor(e.target.value)}>
                {['Supervisor 1', 'Supervisor 2', 'Supervisor 3'].map(s => (
                  <MenuItem key={s} value={s}>{s}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={6} p={1} bgcolor="#fce7da">Auditor</Grid>
            <Grid item xs={6} p={1}>
              <TextField fullWidth select value={auditor} onChange={(e) => setAuditor(e.target.value)}>
                {['Auditor 1', 'Auditor 2', 'Auditor 3'].map(a => (
                  <MenuItem key={a} value={a}>{a}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={6} p={1} bgcolor="#fce7da">Fecha de Memo Recibido</Grid>
            <Grid item xs={6} p={1}>
              <TextField type="date" fullWidth value={fechaMemo} onChange={(e) => setFechaMemo(e.target.value)} />
            </Grid>
            <Grid item xs={6} p={1} bgcolor="#fce7da">Periodo</Grid>
            <Grid item xs={6} p={1}>
              <TextField
  type="month"
  fullWidth
  label="Periodo"
  InputLabelProps={{ shrink: true }}
  value={periodo}
  onChange={(e) => setPeriodo(e.target.value)}
/>
            </Grid>
            <Grid item xs={6} p={1} bgcolor="#fce7da"><strong>Días para el vencimiento</strong></Grid>
            <Grid item xs={6} p={1} sx={{ color: 'red', fontWeight: 'bold' }}>{calcularDias()}</Grid>
          </Grid>
        </Grid>
      </Grid>

      {/* Botones y mensaje */}
      <Stack direction="row" justifyContent="center" spacing={2} mt={3}>
        <Button variant="contained" color="primary" onClick={handleContinuar}>CONTINUAR</Button>
        <Button variant="outlined" color="primary" onClick={() => {
          setSupervisor('');
          setAuditor('');
          setFechaMemo('');
          setPeriodo('');
          setFechaAsignacion('');
          setFechaVencimiento('');
          setMensaje('');
        }}>LIMPIAR</Button>
      </Stack>

      {mensaje && (
        <Typography mt={2} align="center" color="green" fontWeight="bold">{mensaje}</Typography>
      )}
    </Box>
  );
};
