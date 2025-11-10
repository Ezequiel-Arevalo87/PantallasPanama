// src/pages/ProgramacionAutoAperturaForm.tsx
import React, { useState } from 'react';
import {
  Box, Grid, TextField, MenuItem, Button, Stack
} from '@mui/material';

import AutoAperturaFlow from '../components/AutoAperturaFlow';

// Mantén el mismo tipo de nivel que usas en Layout / DetalleAutoApertura
export type Nivel = 'AUDITOR' | 'SUPERVISOR' | 'DIRECTOR';

type Props = {
  readOnly?: boolean;
  setReadOnly?: (v: boolean) => void;

  // 👇 nuevas props para control del flujo
  nivel?: Nivel;
  setNivel?: React.Dispatch<React.SetStateAction<Nivel>>;
};

export const ProgramacionAutoAperturaForm: React.FC<Props> = ({
  readOnly,
  setReadOnly,
  nivel,
  setNivel,
}) => {
  const [formData, setFormData] = useState({
    red: '659',
    categoria: 'Fiscalización Masiva',
    estado: 'Todos',
    programa: '',
    periodoInicial: '',
    periodoFinal: '',
    ruc: '',
  });

  const [mostrarResultados, setMostrarResultados] = useState(false);

  const opcionesPrograma: Record<string, string[]> = {
    Todos: [
      'omisos vs compras',
      'omisos vs dividendos',
      'omisos vs 431',
      'omisos vs renta',
      'omisos vs ITBMS',
      'ingresos ITBMS vs Ingresos Renta',
      'compras ITBMS vs compras',
      'gastos vs compras',
      'Fecha de Presentación',
    ],
    omiso: [
      'omisos vs compras',
      'omisos vs dividendos',
      'omisos vs 431',
      'omisos vs renta',
      'omisos vs ITBMS',
    ],
    inexacto: [
      'ingresos ITBMS vs Ingresos Renta',
      'compras ITBMS vs compras',
      'gastos vs compras',
    ],
    Extemporáneo: ['Fecha de Presentación'],
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'estado' && { programa: '' }),
    }));
    setMostrarResultados(false);
  };

  const programas = opcionesPrograma[formData.estado] || [];

  return (
    <Box>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={3}>
          <TextField
            select fullWidth label="Red" name="red"
            value={formData.red}
            onChange={handleChange}
          >
            <MenuItem value="659">659</MenuItem>
            <MenuItem value="675">675</MenuItem>
          </TextField>
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            select fullWidth label="Categoría" name="categoria"
            value={formData.categoria}
            onChange={handleChange}
          >
            {['Todos', 'Fiscalización Masiva', 'Grandes Contribuyentes', 'Auditoría Sectorial'].map(cat => (
              <MenuItem key={cat} value={cat}>{cat}</MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={12} sm={3}>
          <TextField
            select fullWidth label="Estado" name="estado"
            value={formData.estado}
            onChange={handleChange}
          >
            {['Todos', 'omiso', 'inexacto', 'Extemporáneo'].map(estado => (
              <MenuItem key={estado} value={estado}>{estado}</MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            select fullWidth label="Programa" name="programa"
            value={formData.programa}
            onChange={handleChange}
            disabled={programas.length === 0}
          >
            {programas.map(p => (
              <MenuItem key={p} value={p}>{p}</MenuItem>
            ))}
          </TextField>
        </Grid>

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

        <Grid item xs={12} sm={3}>
          <TextField
            label="RUC"
            name="ruc"
            value={formData.ruc}
            onChange={handleChange}
            fullWidth
          />
        </Grid>

        <Grid item xs={12}>
          <Stack direction="row" justifyContent="flex-end" spacing={2}>
            <Button variant="contained" color="primary" onClick={() => setMostrarResultados(true)}>
              Consultar
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={() =>
                setFormData({
                  red: '',
                  categoria: '',
                  estado: '',
                  programa: '',
                  periodoInicial: '',
                  periodoFinal: '',
                  ruc: '',
                })
              }
            >
              Limpiar
            </Button>
          </Stack>
        </Grid>
      </Grid>

      {mostrarResultados && (
        <AutoAperturaFlow
          readOnly={readOnly}
          setReadOnly={setReadOnly}
          // 👇 Reexpedimos las props nuevas al flujo
          nivel={nivel}
          setNivel={setNivel ? (n:any) => setNivel(n) : undefined}
        />
      )}
    </Box>
  );
};
