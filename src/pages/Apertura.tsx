// src/components/Apertura.tsx
import React, { useState } from 'react';
import {
  Box, Grid, TextField, MenuItem, Button, Stack
} from '@mui/material';
import { AutoApertura } from './AutoApertura';

export const Apertura = () => {
  const [formData, setFormData] = useState({
    red: '',
    categoria: '',
    periodoInicial: '',
    periodoFinal: '',
    ruc: ''
  });

  const [resultados, setResultados] = useState<any[]>([]);
  const [mostrarTabla, setMostrarTabla] = useState(false);

  const rucsPermitidos = ["123456", "678910", "11121314"];

  const todosLosDatos = [
    { categoria: 'Fiscalización Masiva', nombre: 'Empresa 1', ruc: '123456', fecha: '', accion: '' },
    { categoria: 'Grandes Contribuyentes', nombre: 'Empresa 2', ruc: '678910', fecha: '', accion: '' },
    { categoria: 'Auditoría Sectorial', nombre: 'Empresa 3', ruc: '11121314', fecha: '', accion: '' }
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleConsultar = () => {
    if (rucsPermitidos.includes(formData.ruc)) {
      const filtrado = todosLosDatos.filter(d => d.ruc === formData.ruc);
      setResultados(filtrado);
    } else {
      setResultados(todosLosDatos);
    }
    setMostrarTabla(true);
  };

  const handleLimpiar = () => {
    setFormData({ red: '', categoria: '', periodoInicial: '', periodoFinal: '', ruc: '' });
    setMostrarTabla(false);
  };

  return (
    <Box>
      <Grid container spacing={2}>
        {/* RED */}
        <Grid item xs={12} sm={3}>
          <TextField
            select
            fullWidth
            label="Red"
            name="red"
            value={formData.red}
            onChange={handleChange}
          >
            <MenuItem value="659">659</MenuItem>
            <MenuItem value="675">675</MenuItem>
          </TextField>
        </Grid>

        {/* CATEGORIA */}
        <Grid item xs={12} sm={6}>
          <TextField
            select
            fullWidth
            label="Categoría"
            name="categoria"
            value={formData.categoria}
            onChange={handleChange}
          >
            {['Todos', 'Fiscalización Masiva', 'Grandes Contribuyentes', 'Auditoría Sectorial'].map(cat => (
              <MenuItem key={cat} value={cat}>{cat}</MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* PERIODO */}
        <Grid item xs={6} sm={3}>
          <TextField
            label="Periodo Inicial"
            name="periodoInicial"
            type="date"
            value={formData.periodoInicial}
            onChange={handleChange}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <TextField
            label="Periodo Final"
            name="periodoFinal"
            type="date"
            value={formData.periodoFinal}
            onChange={handleChange}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        {/* RUC */}
        <Grid item xs={12} sm={3}>
          <TextField
            label="RUC"
            name="ruc"
            value={formData.ruc}
            onChange={handleChange}
            fullWidth
          />
        </Grid>

        {/* BOTONES */}
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

      {/* Mostrar tabla */}
      {mostrarTabla && <AutoApertura data={resultados} />}
    </Box>
  );
};
