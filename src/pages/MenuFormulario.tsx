// pages/MenuFormulario.tsx
import React from 'react';
import { Box, TextField, Typography, Grid } from '@mui/material';

type Props = {
  tipo: string;
};

export const MenuFormulario: React.FC<Props> = ({ tipo }) => {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>{`Formulario: ${tipo}`}</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField label="Categoría de Contribuyente" fullWidth />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField label="RUC" fullWidth />
        </Grid>
        {/* Agrega los demás campos según tu diseño actual */}
      </Grid>
    </Box>
  );
};
