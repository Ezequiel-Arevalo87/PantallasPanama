import React from 'react';
import {
  Box,
} from '@mui/material';

import CartaFiscalizacionDigital from '../components/CartaFiscalizacionDigital';
export const DetallesAsignacionVarias = ({tipo}:{tipo:any}) => {
  return (
    <Box mt={5}>
      <CartaFiscalizacionDigital />
    </Box>
  );
};
