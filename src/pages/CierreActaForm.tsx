import React, { useState } from 'react';
import {
  Box,
  Button,
  Grid,
  TextField,
  Typography,
  Paper,
} from '@mui/material';
import dayjs from 'dayjs';
import jsPDF from 'jspdf';

const CierreActaForm = () => {
  const [fecha, setFecha] = useState('');
  const [acta, setActa] = useState('');
  const [valorPagado, setValorPagado] = useState('');
  const [archivoCaja, setArchivoCaja] = useState('');

  const formatCurrency = (value: string) => {
    const number = parseFloat(value.replace(/[^0-9.]/g, ''));
    return isNaN(number)
      ? ''
      : new Intl.NumberFormat('es-PA', {
          style: 'currency',
          currency: 'PAB',
          minimumFractionDigits: 2,
        }).format(number);
  };

  const handleDescargarPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text('ACTA DESCARGADA', 20, 20);
    doc.setFontSize(12);

    const fechaFormateada = fecha ? dayjs(fecha).format('DD/MM/YYYY') : '';

    doc.text(`Fecha: ${fechaFormateada}`, 20, 40);
    doc.text(`Acta: ${acta}`, 20, 50);
    doc.text(`Valor Pagado: ${formatCurrency(valorPagado)}`, 20, 60);
    doc.text(`Archivo Caja: ${archivoCaja}`, 20, 70);

    doc.text(`Nombre o Razón Social: Dato de pestañas anteriores`, 20, 90);
    doc.text(`Auditor: Dato de pestañas anteriores`, 20, 100);
    doc.text(`Supervisor: Dato de pestañas anteriores`, 20, 110);
    doc.text(`Director: Dato de pestañas anteriores`, 20, 120);

    doc.save('acta-descargada.pdf');
  };

  return (
    <Box p={3}>
      <Typography align="center" variant="h6" color="error" gutterBottom>
        CIERRE
      </Typography>

      <Grid container spacing={2} justifyContent="center">
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <TextField
              label="Fecha"
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              fullWidth
              size="small"
              margin="dense"
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Acta"
              value={acta}
              onChange={(e) => setActa(e.target.value)}
              fullWidth
              size="small"
              margin="dense"
            />
            <TextField
              label="Valor Pagado"
              value={valorPagado}
              onChange={(e) => setValorPagado(e.target.value)}
              fullWidth
              size="small"
              margin="dense"
            />
            <TextField
              label="Archivo Caja"
              value={archivoCaja}
              onChange={(e) => setArchivoCaja(e.target.value)}
              fullWidth
              size="small"
              margin="dense"
            />
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Datos de Cierre (No Editables)
            </Typography>
            <Box mb={1}>
              <Typography><strong>Nombre o Razón Social:</strong> Dato de pestañas anteriores</Typography>
            </Box>
            <Box mb={1}>
              <Typography><strong>Auditor:</strong> Dato de pestañas anteriores</Typography>
            </Box>
            <Box mb={1}>
              <Typography><strong>Supervisor:</strong> Dato de pestañas anteriores</Typography>
            </Box>
            <Box>
              <Typography><strong>Director:</strong>Nombre del director</Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Box mt={4} display="flex" justifyContent="center">
        <Button variant="contained" onClick={handleDescargarPDF}>
          DESCARGAR ACTA
        </Button>
      </Box>
    </Box>
  );
};

export default CierreActaForm;
