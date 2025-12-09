import React from 'react';
import {
  Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button
} from '@mui/material';
import { CASOS } from '../helpers/data';

export const TablaCasosAsignados: React.FC<{
  onAutoApertura: (ruc: string) => void;
}> = ({ onAutoApertura }) => (
  <TableContainer component={Paper}>
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell align="center" sx={{ fontWeight: 'bold' }}>Categoría</TableCell>
          <TableCell align="center" sx={{ fontWeight: 'bold' }}>Nombre o Razón Social</TableCell>
          <TableCell align="center" sx={{ fontWeight: 'bold' }}>RUC</TableCell>
          <TableCell align="center" sx={{ fontWeight: 'bold' }}>Fecha</TableCell>
          <TableCell align="center" sx={{ fontWeight: 'bold' }}>Acción</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {CASOS.map((c) => (
          <TableRow key={c.id} hover>
            <TableCell>{c.categoria}</TableCell>
            <TableCell>{c.nombre}</TableCell>
            <TableCell>{c.ruc}</TableCell>
            <TableCell>{c.fecha}</TableCell>
            <TableCell align="center">
              <Button variant="contained" color="success" onClick={() => onAutoApertura(c.ruc)}>
                Generar Informe de Auditoria
              </Button>
            </TableCell>
          </TableRow>
        ))}
        {[0, 1].map((i) => (
          <TableRow key={`empty-${i}`}>
            <TableCell colSpan={5}>&nbsp;</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);
