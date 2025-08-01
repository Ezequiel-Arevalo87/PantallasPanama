import React, { useState } from 'react';
import {
  Box, Button, Grid, MenuItem, TextField, Typography, Snackbar, Alert
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import TablaResultados from './TablaResultados';
import banner from '../assets/logos/image.png';

const provinciasPanama = [
  'Bocas del Toro', 'Coclé', 'Colón', 'Chiriquí', 'Darién', 'Herrera',
  'Los Santos', 'Panamá', 'Panamá Oeste', 'Veraguas', 'Emberá', 'Guna Yala', 'Ngäbe-Buglé'
];

const camposIniciales = {
  categoria: '', ruc: '', tramite: '', resol201: '', despacho: '', cancelo: '', auditor: '',
  periodoInicial: '', periodoFinal: '', razonSocial: '', autoApertura: '',
  fechaResolucion: '', documentoResol: '', provincia: ''
};

const SolicitudResolucion = () => {
  const [campos, setCampos] = useState(camposIniciales);
  const [mostrarTabla, setMostrarTabla] = useState(false);
  const [alerta, setAlerta] = useState(false);

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setCampos((prev) => ({ ...prev, [name]: value }));
  };

  const handleBuscar = () => {
    const hayValores = Object.values(campos).some((v) => v !== '');
    if (!hayValores) {
      setAlerta(true);
      setMostrarTabla(false);
    } else {
      setMostrarTabla(true);
    }
  };

  const handleLimpiar = () => {
    setCampos(camposIniciales);
    setMostrarTabla(false);
  };

  return (
    <>
      <Box sx={{ width: '100vw' }}>
        <img src={banner} alt="Encabezado DGI" style={{ width: '100%', display: 'block' }} />
      </Box>

      <Box sx={{ p: 3, maxWidth: '100%', overflowX: 'hidden' }}>
        <Typography variant="h6" gutterBottom sx={{ color: 'orange', fontWeight: 'bold' }}>
          Solicitud otras resoluciones
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} md={4} container direction="column" gap={2}>
            <TextField fullWidth label="Categoría de Contribuyente" name="categoria" value={campos.categoria} onChange={handleInputChange} />
            <TextField fullWidth label="RUC" name="ruc" value={campos.ruc} onChange={handleInputChange} />
            <TextField fullWidth label="Número de Trámite" name="tramite" value={campos.tramite} onChange={handleInputChange} />
            <TextField fullWidth label="No. De Resol 201" name="resol201" value={campos.resol201} onChange={handleInputChange} />
            <TextField fullWidth label="Despacho Enviado (S/N)" name="despacho" value={campos.despacho} onChange={handleInputChange} />
            <TextField fullWidth label="Canceló (S/N)" name="cancelo" value={campos.cancelo} onChange={handleInputChange} />
            <TextField fullWidth label="Nombre Auditor" name="auditor" value={campos.auditor} onChange={handleInputChange} />
          </Grid>

          <Grid item xs={12} md={4} container direction="column" gap={2}>
            <TextField fullWidth type="date" label="Periodo Inicial" name="periodoInicial" value={campos.periodoInicial} InputLabelProps={{ shrink: true }} onChange={handleInputChange} />
            <TextField fullWidth label="Nombre o Razón Social" name="razonSocial" value={campos.razonSocial} onChange={handleInputChange} />
            <TextField fullWidth label="Número de Auto de Apertura" name="autoApertura" value={campos.autoApertura} onChange={handleInputChange} />
            <TextField fullWidth type="date" label="Fecha Resolución" name="fechaResolucion" value={campos.fechaResolucion} InputLabelProps={{ shrink: true }} onChange={handleInputChange} />
            <TextField fullWidth label="No. Documento Resolución" name="documentoResol" value={campos.documentoResol} onChange={handleInputChange} />
          </Grid>

          <Grid item xs={12} md={4} container direction="column" gap={2}>
            <TextField fullWidth type="date" label="Periodo Final" name="periodoFinal" value={campos.periodoFinal} InputLabelProps={{ shrink: true }} onChange={handleInputChange} />
            <TextField fullWidth select label="Provincia" name="provincia" value={campos.provincia} onChange={handleInputChange}>
              {provinciasPanama.map((provincia) => (
                <MenuItem key={provincia} value={provincia}>{provincia}</MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>

        <Box display="flex" justifyContent="center" gap={2} mt={4}>
          <Button variant="contained" color="primary" startIcon={<SearchIcon />} onClick={handleBuscar}>Buscar</Button>
          <Button variant="contained" color="secondary" startIcon={<RestartAltIcon />} onClick={handleLimpiar}>Limpiar</Button>
          <Button variant="text" color="primary" startIcon={<ArrowBackIcon />}>Regresar</Button>
        </Box>

        {mostrarTabla && <TablaResultados />}

        <Snackbar open={alerta} autoHideDuration={3000} onClose={() => setAlerta(false)}>
          <Alert severity="warning" onClose={() => setAlerta(false)}>Debe seleccionar al menos un filtro para buscar.</Alert>
        </Snackbar>
      </Box>
    </>
  );
};

export default SolicitudResolucion;
