import React, { useEffect, useState } from 'react';
import {
  Box, Grid, TextField, MenuItem, Typography, Button, Stack
} from '@mui/material';
import dayjs from 'dayjs';
import { NuevosCasos } from './NuevosCasos';

export const Aprobacion = () => {
  const [fecha, setFecha] = useState('');
  const [formData, setFormData] = useState({
    red: '',
    categoria: ''
  });
  const [mostrarNuevosCasos, setMostrarNuevosCasos] = useState(false);

  useEffect(() => {
    setFecha(dayjs().format('DD/MM/YY'));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleLimpiar = () => {
    setFormData({
      red: '',
      categoria: ''
    });
    setMostrarNuevosCasos(false);
  };

  const handleConsultar = () => {
    setMostrarNuevosCasos(true);
  };

  return (
    <Box>
   

      <Grid container spacing={2}>
     
        <Grid item xs={12} sm={6}>
          <TextField
            label="SUPERVISOR"
            value="Nombre del Supervisor"
            fullWidth
            InputProps={{ readOnly: true }}
            sx={{ backgroundColor: '#fde9e0' }}
          />
        </Grid>

  
        <Grid item xs={12} sm={6}>
          <TextField
            label="FECHA"
            value={fecha}
            fullWidth
            InputProps={{ readOnly: true }}
            sx={{ backgroundColor: '#fde9e0' }}
          />
        </Grid>

      
        {/* <Grid item xs={12} sm={6}>
          <TextField
            select
            label="RED"
            name="red"
            value={formData.red}
            onChange={handleChange}
            fullWidth
            sx={{ backgroundColor: '#e4ebf3' }}
          >
            <MenuItem value="659">659</MenuItem>
            <MenuItem value="675">675</MenuItem>
          </TextField>
        </Grid>

  
        <Grid item xs={12} sm={6}>
          <TextField
            select
            label="CATEGORÍA"
            name="categoria"
            value={formData.categoria}
            onChange={handleChange}
            fullWidth
            sx={{ backgroundColor: '#e4ebf3' }}
          >
            <MenuItem value="Todos">Todos</MenuItem>
            <MenuItem value="Fiscalización Masiva">Fiscalización Masiva</MenuItem>
            <MenuItem value="Grandes Contribuyentes">Grandes Contribuyentes</MenuItem>
            <MenuItem value="Auditoría Sectorial">Auditoría Sectorial</MenuItem>
          </TextField>
        </Grid> */}

   
        <Grid item xs={12}>
          <Stack direction="row" justifyContent="flex-end" spacing={2}>
            <Button variant="contained" color="primary" onClick={handleConsultar}>
              Consultar
            </Button>
            <Button variant="contained" color="primary" onClick={handleLimpiar}>
              Limpiar
            </Button>
          </Stack>
        </Grid>
      </Grid>

 
      {mostrarNuevosCasos && (
        <Box mt={4}>
          <NuevosCasos />
        </Box>
      )}
    </Box>
  );
};
