import React from 'react';
import { Box, Grid, Typography, Button, Stack } from '@mui/material';
import { AyudaButton } from './AyudaButton'; // Importa tu componente de ayuda

type Props = {
  texto?: string;
  ayuda?: string;
};

export const ObjetoInvestigacion: React.FC<Props> = ({
  texto = 'Determinar la veracidad y exactitud de la información contenida en las declaraciones juradas de impuestos sobre la renta, ITBMS y demás tributos administrados por la Dirección General de Ingresos, verificar el cumplimiento de las obligaciones tributarias por parte del contribuyente, correspondientes a los períodos fiscales:',
  ayuda = 'Objeto de la Investigación o Auditoría [Descripción detallada del objeto de la investigación o auditoría, incluyendo los períodos y los impuestos]',
}) => {
  return (
    <Grid container alignItems="center" spacing={2}>
      {/* Caja de texto grande */}
      <Grid item xs>
        <Box sx={{ border: '1px solid #263238', borderRadius: 1, p: 1.5 }}>
          <Typography align="center">{texto}</Typography>
        </Box>
      </Grid>

      {/* Botón AYUDA + lupa que abre el diálogo */}
      <Grid item>
        <Stack spacing={1} alignItems="center">
        
          <AyudaButton titulo="Ayuda" contenido={ayuda} />
        </Stack>
      </Grid>

   
    </Grid>
  );
};
