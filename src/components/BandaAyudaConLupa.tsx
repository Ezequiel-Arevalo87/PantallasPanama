import React from 'react';
import { Box, Typography } from '@mui/material';
import { AyudaButton } from './AyudaButton';

type Props = {
  texto: string;              // texto que se ve en la banda
  tituloModal: string;        // título del modal
  contenidoModal?: string;    // contenido del modal (por defecto = texto)
};

export const BandaAyudaConLupa: React.FC<Props> = ({
  texto,
  tituloModal,
  contenidoModal,
}) => {
  return (
    <Box sx={{ position: 'relative', mb: 2 }}>
      {/* Banda a lo ancho */}
      <Box
        sx={{
          border: '1px solid #90A4AE',
          borderRadius: 1,
          p: 1.25,
          pr: 8,                // espacio para la lupa a la derecha
          width: '100%',
        }}
      >
        <Typography variant="body2">{texto}</Typography>
      </Box>

      {/* Pico del globo, pegado a la banda y apuntando a la lupa */}
      <Box
        sx={{
          position: 'absolute',
          right: 44,            // ajusta este valor para centrar con tu lupa (40–50)
          top: '50%',
          transform: 'translateY(-50%) rotate(45deg)',
          width: 14,
          height: 14,
          bgcolor: 'background.paper',
          borderRight: '1px solid #90A4AE',
          borderBottom: '1px solid #90A4AE',
        }}
      />

      {/* Lupa que abre el modal */}
      <Box
        sx={{
          position: 'absolute',
          right: 4,
          top: '50%',
          transform: 'translateY(-50%)',
        }}
      >
        <AyudaButton
          titulo={tituloModal}
          contenido={contenidoModal ?? texto}
        />
      </Box>
    </Box>
  );
};
