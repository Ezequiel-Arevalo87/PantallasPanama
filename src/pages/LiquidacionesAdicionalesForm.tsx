import React, { useState, useEffect } from 'react';
import {
  Box, Grid, TextField, MenuItem, Button, Typography, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper, IconButton,
  Snackbar,
  Alert
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';

const opcionesLiquidaciones = [
  'GRAVAMENRENTA102',
  'ZONA LIBRE 103',
  'RETENCION DE SALARIO 104',
  'REMESAS105',
  'DIVIDENDOS110',
  'LIR. ADIC. COMPL.111',
  'GRAVAMEN COMPL.111',
  'AVISO DE OPERACIÓN140'
];

export const LiquidacionesAdicionalesForm = () => {
  const [tipoLiquidacion, setTipoLiquidacion] = useState('');
  const [valor, setValor] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [subtotalImpuestos, setSubtotalImpuestos] = useState(0);

  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [editTipo, setEditTipo] = useState('');
  const [editValor, setEditValor] = useState('');
    const [openSnackbar, setOpenSnackbar] = useState(false);

  const subtotalLiquidaciones = items.reduce((acc, item) => acc + parseFloat(item.valor), 0);
  const total = subtotalImpuestos + subtotalLiquidaciones;

  useEffect(() => {
    const stored = localStorage.getItem('subtotalImpuestos');
    setSubtotalImpuestos(stored ? parseFloat(stored) : 0);
  }, []);

  const handleAgregar = () => {
    if (!tipoLiquidacion || !valor) return;

    setItems([...items, {
      id: Date.now(),
      tipo: tipoLiquidacion,
      valor: parseFloat(valor).toFixed(2)
    }]);

    setTipoLiquidacion('');
    setValor('');
  };

  const handleEliminar = (id: number) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleEditar = (item: any) => {
    setEditandoId(item.id);
    setEditTipo(item.tipo);
    setEditValor(item.valor);
  };

  const handleGuardar = (id: number) => {
    const actualizado = items.map(item =>
      item.id === id ? { ...item, tipo: editTipo, valor: parseFloat(editValor).toFixed(2) } : item
    );
    setItems(actualizado);
    setEditandoId(null);
  };

  const handleCancelar = () => {
    setEditandoId(null);
  };

  return (
    <Box mt={4}>
      <Typography variant="h6" color="error" gutterBottom>LIQUIDACIONES ADICIONALES</Typography>

      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={6}>
          <TextField
            select
            label="Liquidaciones"
            value={tipoLiquidacion}
            onChange={(e) => setTipoLiquidacion(e.target.value)}
            fullWidth
          >
            {opcionesLiquidaciones.map((op) => (
              <MenuItem key={op} value={op}>{op}</MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={6} sm={3}>
          <TextField
            label="Valor"
            type="number"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            fullWidth
          />
        </Grid>

        <Grid item xs={6} sm={3}>
          <TextField
            label="SUBTOTAL IMPUESTOS"
            value={subtotalImpuestos.toFixed(2)}
            InputProps={{ readOnly: true }}
            fullWidth
          />
        </Grid>

        <Grid item xs={12}>
          <Button variant="contained" onClick={handleAgregar}>AGREGAR</Button>
        </Grid>
      </Grid>

      <Box mt={4}>
        <Typography variant="h6" color="error">LIQUIDACIONES</Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>RUC</TableCell>
                <TableCell>Liquidaciones</TableCell>
                <TableCell>Valor</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((row, index) => (
                <TableRow key={row.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>
                    {editandoId === row.id ? (
                      <TextField
                        select
                        value={editTipo}
                        onChange={(e) => setEditTipo(e.target.value)}
                        fullWidth
                      >
                        {opcionesLiquidaciones.map((op) => (
                          <MenuItem key={op} value={op}>{op}</MenuItem>
                        ))}
                      </TextField>
                    ) : (
                      row.tipo
                    )}
                  </TableCell>
                  <TableCell>
                    {editandoId === row.id ? (
                      <TextField
                        type="number"
                        value={editValor}
                        onChange={(e) => setEditValor(e.target.value)}
                        fullWidth
                      />
                    ) : (
                      `$${row.valor}`
                    )}
                  </TableCell>
                  <TableCell>
                    {editandoId === row.id ? (
                      <>
                        <IconButton onClick={() => handleGuardar(row.id)}><SaveIcon /></IconButton>
                        <IconButton onClick={handleCancelar}><CancelIcon /></IconButton>
                      </>
                    ) : (
                      <>
                        <IconButton onClick={() => handleEditar(row)}><EditIcon /></IconButton>
                        <IconButton onClick={() => handleEliminar(row.id)}><DeleteIcon /></IconButton>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Box mt={2} display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">SUBTOTAL LIQUIDACIONES:</Typography>
          <Typography variant="h6">${subtotalLiquidaciones.toFixed(2)}</Typography>
        </Box>

        <Box mt={2} display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">TOTAL:</Typography>
          <Typography variant="h6">${total.toFixed(2)}</Typography>
        </Box>

        <Box mt={3} display="flex" justifyContent="flex-end">
          <Button variant="contained" color="primary">CONTINUAR</Button>
        </Box>
      </Box>
       <Snackbar
              open={openSnackbar}
              autoHideDuration={3000}
              onClose={() => setOpenSnackbar(false)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
              <Alert severity="success" variant="filled" onClose={() => setOpenSnackbar(false)}>
                ✅ Liquidación aprobados correctamente
              </Alert>
            </Snackbar>
    </Box>
  );
};
