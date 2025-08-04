import React, { useState } from 'react';
import { Box, Button, Grid, TextField, Typography } from '@mui/material';
import CheckIcon from '@mui/icons-material/CheckCircleOutline';
import CloseIcon from '@mui/icons-material/HighlightOff';

const RectificativaForm = () => {
  const [mostrarCampos, setMostrarCampos] = useState(false);
  const [ajuste, setAjuste] = useState('');
  const [diferencia, setDiferencia] = useState('');

  const handleAceptar = () => {
    alert('✔️ Declaración Rectificativa Aceptada');
    setMostrarCampos(false);
  };

  const handleNoAceptar = () => {
    setMostrarCampos(true);
  };

  const handleContinuar = () => {
    alert('✅ Proceso completo');
  };

  return (
    <Box p={4}>
      <Typography align="center" variant="h6" color="error" gutterBottom>
        RECTIFICATIVA
      </Typography>

      <Grid container spacing={4} justifyContent="center" alignItems="center">
        {/* Columna de botones */}
        <Grid item>
          <Box display="flex" flexDirection="column" gap={2}>
            <Button variant="outlined" onClick={handleAceptar} color="success" startIcon={<CheckIcon />}>
              Declaración Aceptada
            </Button>
            <Button variant="outlined" onClick={handleNoAceptar} color="error" startIcon={<CloseIcon />}>
              No Aceptada
            </Button>
          </Box>
        </Grid>

       

        {/* Campos de Ajuste y Diferencia */}
        {mostrarCampos && (
          <Grid item>
            <Box border={1} borderColor="grey.300" p={2} borderRadius={2}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography fontWeight="bold">Ajuste</Typography>
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    value={ajuste}
                    onChange={(e) => setAjuste(e.target.value)}
                    fullWidth
                    size="small"
                  />
                </Grid>

                <Grid item xs={6}>
                  <Typography fontWeight="bold">Diferencia de Montos</Typography>
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    value={diferencia}
                    onChange={(e) => setDiferencia(e.target.value)}
                    fullWidth
                    size="small"
                  />
                </Grid>
              </Grid>
            </Box>
          </Grid>
        )}
      </Grid>

      <Box mt={4} display="flex" justifyContent="center">
        <Button
          variant="contained"
          onClick={handleContinuar}
          disabled={!mostrarCampos && ajuste === '' && diferencia === ''}
        >
          CONTINUAR
        </Button>
      </Box>
    </Box>
  );
};

export default RectificativaForm;
