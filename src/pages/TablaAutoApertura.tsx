import React, { useState } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Paper,
  Checkbox,
  IconButton,
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

export const TablaAutoApertura = () => {
  const [seleccionados, setSeleccionados] = useState({
    nombre: false,
    tramite: false,
    auto: false,
    fecha: false
  });

  const [mostrarDialogo, setMostrarDialogo] = useState(false);

  const handleChange = (campo: string) => {
    setSeleccionados((prev: any) => ({
      ...prev,
      [campo]: !prev[campo]
    }));
  };

  const handleContinuar = () => {
    setMostrarDialogo(true); // Muestra el diálogo
  };

  const handleCerrarDialogo = () => {
    setMostrarDialogo(false); // Oculta el diálogo
  };

  return (
    <Box mt={4}>
      <Typography variant="h6" color="error" align="center">
        PROGRAMACIÓN DE AUTO DE APERTURA
      </Typography>

      <TableContainer component={Paper} sx={{ maxWidth: 600, margin: 'auto', mt: 2 }}>
        <Table>
          <TableBody>
            <TableRow>
              <TableCell sx={{ backgroundColor: '#FFF1CC', fontWeight: 'bold' }}>
                Nombre o Razón Social
              </TableCell>
              <TableCell align="center">
                <Checkbox
                  checked={seleccionados.nombre}
                  onChange={() => handleChange('nombre')}
                />
              </TableCell>
              <TableCell align="center">
            
              </TableCell>
            </TableRow>

            <TableRow>
              <TableCell sx={{ backgroundColor: '#FFF1CC', fontWeight: 'bold' }}>
                Número de Trámite
              </TableCell>
              <TableCell align="center">
                <Checkbox
                  checked={seleccionados.tramite}
                  onChange={() => handleChange('tramite')}
                />
              </TableCell>
              <TableCell />
            </TableRow>

            <TableRow>
              <TableCell sx={{ backgroundColor: '#FFF1CC', fontWeight: 'bold' }}>
                Número de Auto Apertura
              </TableCell>
              <TableCell align="center">
                <Checkbox
                  checked={seleccionados.auto}
                  onChange={() => handleChange('auto')}
                />
              </TableCell>
              <TableCell />
            </TableRow>

            <TableRow>
              <TableCell sx={{ backgroundColor: '#FFF1CC', fontWeight: 'bold' }}>
                Fecha
              </TableCell>
              <TableCell align="center">
                <Checkbox
                  checked={seleccionados.fecha}
                  onChange={() => handleChange('fecha')}
                />
              </TableCell>
              <TableCell />
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      <Box mt={2} display="flex" justifyContent="center" gap={2}>
        <Button variant="contained" color="primary" onClick={handleContinuar}>
          CONTINUAR
        </Button>
        <Button variant="contained" color="primary" onClick={() => setSeleccionados({
          nombre: false, tramite: false, auto: false, fecha: false
        })}>
          LIMPIAR
        </Button>
      </Box>

      {/* Diálogo de confirmación */}
      <Dialog open={mostrarDialogo} onClose={handleCerrarDialogo}>
        <DialogTitle>Aprobación</DialogTitle>
        <DialogContent>
          <Typography>Programación exitosa</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCerrarDialogo} autoFocus color="primary" variant="contained">
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
