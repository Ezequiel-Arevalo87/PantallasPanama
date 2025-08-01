import React, { useState } from 'react';
import {
  Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, TextField, FormGroup, FormControlLabel, Checkbox
} from '@mui/material';

const datosMock = [
  { id: 1, ruc: '1234567-8-999999', nombre: 'Empresa XYZ', provincia: 'Panamá', resolucion: '201-123' },
  { id: 2, ruc: '2345678-9-888888', nombre: 'ABC S.A.', provincia: 'Chiriquí', resolucion: '201-456' },
  { id: 3, ruc: '3456789-0-777777', nombre: 'Importadora Pérez', provincia: 'Colón', resolucion: '201-789' }
];

const TablaResultados = () => {
  const [filtro, setFiltro] = useState('');
  const [columnasVisibles, setColumnasVisibles] = useState({
    ruc: true,
    nombre: true,
    provincia: true,
    resolucion: true
  });

  const handleToggleColumna = (col: keyof typeof columnasVisibles) => {
    setColumnasVisibles((prev) => ({ ...prev, [col]: !prev[col] }));
  };

  const datosFiltrados = datosMock.filter((item) =>
    Object.values(item).some((valor) =>
      String(valor).toLowerCase().includes(filtro.toLowerCase())
    )
  );

  return (
    <Box mt={4} maxWidth="100%" overflow="auto">
        <br />
      <TextField
        fullWidth label="Filtrar resultados" variant="outlined"
        value={filtro} onChange={(e) => setFiltro(e.target.value)}
        sx={{ mb: 2 }}
      />

      <FormGroup row sx={{ mb: 2 }}>
        {Object.entries(columnasVisibles).map(([col, visible]) => (
          <FormControlLabel
            key={col}
            control={
              <Checkbox
                checked={visible}
                onChange={() => handleToggleColumna(col as keyof typeof columnasVisibles)}
              />
            }
            label={col.charAt(0).toUpperCase() + col.slice(1)}
          />
        ))}
      </FormGroup>

      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
            <TableRow>
              {columnasVisibles.ruc && <TableCell>RUC</TableCell>}
              {columnasVisibles.nombre && <TableCell>Nombre / Razón Social</TableCell>}
              {columnasVisibles.provincia && <TableCell>Provincia</TableCell>}
              {columnasVisibles.resolucion && <TableCell>Resolución</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {datosFiltrados.length > 0 ? (
              datosFiltrados.map((fila) => (
                <TableRow key={fila.id}>
                  {columnasVisibles.ruc && <TableCell>{fila.ruc}</TableCell>}
                  {columnasVisibles.nombre && <TableCell>{fila.nombre}</TableCell>}
                  {columnasVisibles.provincia && <TableCell>{fila.provincia}</TableCell>}
                  {columnasVisibles.resolucion && <TableCell>{fila.resolucion}</TableCell>}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} align="center">No se encontraron resultados.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default TablaResultados;
