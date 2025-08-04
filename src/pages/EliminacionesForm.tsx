import React, { useState } from 'react';
import {
  Box, Grid, TextField, MenuItem, Button, Typography, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton,
  Snackbar,
  Alert
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';

const opcionesEliminaciones = [
  'ELIMINACIÓN IMTO RENTA',
  'ELIMINACIÓN IMTO RETENIDO',
  'ELIMINACIÓN IMTO PAGADO SOBRE DIVIDENDO',
  'ELIMINACIÓN DE CRÉDITO DIVIDENDOS',
  'DISMINUCIÓN DE CRÉDITO ITBMS'
];


export const EliminacionesForm = () => {
  const [tipoEliminacion, setTipoEliminacion] = useState('');
  const [valor, setValor] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [editId, setEditId] = useState<number | null>(null);
  const [editTipo, setEditTipo] = useState('');
  const [editValor, setEditValor] = useState('');
    const [openSnackbar, setOpenSnackbar] = useState(false);

  const subtotal = items.reduce((acc, item) => acc + parseFloat(item.valor), 0);

  const handleAgregar = () => {
    if (!tipoEliminacion || !valor) return;

    setItems([
      ...items,
      {
        id: Date.now(),
        tipo: tipoEliminacion,
        valor: parseFloat(valor).toFixed(2)
      }
    ]);

    setTipoEliminacion('');
    setValor('');
  };

  const handleEliminar = (id: number) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleEditar = (item: any) => {
    setEditId(item.id);
    setEditTipo(item.tipo);
    setEditValor(item.valor);
  };

  const handleGuardar = (id: number) => {
    setItems(items.map(item =>
      item.id === id ? { ...item, tipo: editTipo, valor: parseFloat(editValor).toFixed(2) } : item
    ));
    setEditId(null);
    setEditTipo('');
    setEditValor('');
  };

  const handleCancelar = () => {
    setEditId(null);
    setEditTipo('');
    setEditValor('');
  };

  return (
    <Box mt={4}>
      <Typography variant="h6" color="error" gutterBottom>ELIMINACIONES</Typography>

      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={6}>
          <TextField
            select
            label="Eliminaciones"
            value={tipoEliminacion}
            onChange={(e) => setTipoEliminacion(e.target.value)}
            fullWidth
          >
            {opcionesEliminaciones.map((op) => (
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

        <Grid item xs={12}>
          <Button variant="contained" onClick={handleAgregar}>AGREGAR</Button>
        </Grid>
      </Grid>

      <Box mt={4}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#e3f0e0' }}>
                <TableCell>#</TableCell>
                <TableCell>Eliminaciones</TableCell>
                <TableCell>Valor</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>
                    {editId === item.id ? (
                      <TextField
                        select
                        fullWidth
                        value={editTipo}
                        onChange={(e) => setEditTipo(e.target.value)}
                      >
                        {opcionesEliminaciones.map((op) => (
                          <MenuItem key={op} value={op}>{op}</MenuItem>
                        ))}
                      </TextField>
                    ) : item.tipo}
                  </TableCell>
                  <TableCell>
                    {editId === item.id ? (
                      <TextField
                        type="number"
                        fullWidth
                        value={editValor}
                        onChange={(e) => setEditValor(e.target.value)}
                      />
                    ) : `$${item.valor}`}
                  </TableCell>
                  <TableCell>
                    {editId === item.id ? (
                      <>
                        <IconButton onClick={() => handleGuardar(item.id)}><SaveIcon /></IconButton>
                        <IconButton onClick={handleCancelar}><CancelIcon /></IconButton>
                      </>
                    ) : (
                      <>
                        <IconButton onClick={() => handleEliminar(item.id)}><DeleteIcon /></IconButton>
                        <IconButton onClick={() => handleEditar(item)}><EditIcon /></IconButton>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Box mt={2} display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">SUBTOTAL ELIMINACIONES:</Typography>
          <Typography variant="h6">${subtotal.toFixed(2)}</Typography>
        </Box>

          <Box mt={3} display="flex" justifyContent="flex-end">
                  <Button variant="contained" color="primary" onClick={() => {setOpenSnackbar(true)}}>CONTINUAR</Button>
                </Box>
              </Box>
               <Snackbar
                      open={openSnackbar}
                      autoHideDuration={3000}
                      onClose={() => setOpenSnackbar(false)}
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                    >
                      <Alert severity="success" variant="filled" onClose={() => setOpenSnackbar(false)}>
                        ✅ Eliminación correctamente
                      </Alert>
                      </Snackbar>
      </Box>
    
  );
};
