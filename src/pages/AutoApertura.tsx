// src/components/AutoApertura.tsx
import React, { useState } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Typography,
  Paper,
  Checkbox
} from '@mui/material';
import jsPDF from 'jspdf';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

interface Props {
  data: { categoria: string; nombre: string; ruc: string; fecha: string; accion: string }[];
}

export const AutoApertura: React.FC<Props> = ({ data }) => {
  const [seleccionados, setSeleccionados] = useState<number[]>([]);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const generarPDF = (index: number) => {
    const doc = new jsPDF();
    const numero = (index + 1).toString().padStart(4, '0');
    doc.text(`Auto de apertura ${numero}`, 20, 20);
    doc.save(`auto_apertura_${numero}.pdf`);
  };

  const handleCheckboxChange = (index: number) => {
    setSeleccionados(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const handleContinuar = () => {
    const categoriasSeleccionadas = seleccionados.map(i => data[i].categoria);
    setMensaje(`Apertura realizada con éxito. Categorías: ${categoriasSeleccionadas.join(', ')}`);

    setTimeout(() => {
      setMensaje(null);
    }, 4000);
  };

  return (
    <Box mt={3}>
      <Typography variant="h6" color="error" align="center">
        AUTO DE APERTURA
      </Typography>

     

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow style={{ backgroundColor: '#f4e3b2' }}>
              <TableCell></TableCell> {/* Checkbox */}
              <TableCell>Categoría</TableCell>
              <TableCell>Nombre o Razón Social</TableCell>
              <TableCell>RUC</TableCell>
              <TableCell>Fecha</TableCell>
              <TableCell>Acción</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Checkbox
                    checked={seleccionados.includes(index)}
                    onChange={() => handleCheckboxChange(index)}
                  />
                </TableCell>
                <TableCell>{row.categoria}</TableCell>
                <TableCell>{row.nombre}</TableCell>
                <TableCell>{row.ruc}</TableCell>
                <TableCell>{row.fecha || 'dd/mm/aa'}</TableCell>
                <TableCell>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => generarPDF(index)}
                  >
                    Generar Auto de Apertura
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box display="flex" justifyContent="center" mt={2}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleContinuar}
          disabled={seleccionados.length === 0}
        >
          CONTINUAR
        </Button>
      </Box>
       {mensaje && (
        <Box display="flex" alignItems="center" mt={2} mb={2} color="green">
          <CheckCircleIcon sx={{ mr: 1 }} />
          <Typography fontWeight="bold">{mensaje}</Typography>
        </Box>
      )}
    </Box>
  );
};
