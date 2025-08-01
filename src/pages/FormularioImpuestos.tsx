import React, { useState, useEffect } from 'react';
import {
  Box, Grid, TextField, MenuItem, Button, Typography, IconButton, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Snackbar, Alert
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Check';
import { impuestos } from '../util/impuestos';

export const FormularioImpuestos = () => {
  const [tipoImpuesto, setTipoImpuesto] = useState('');
  const [valor, setValor] = useState('');
  const [datos, setDatos] = useState<any[]>([]);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [subtotal, setSubtotal] = useState(0);

  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [editDescripcion, setEditDescripcion] = useState('');
  const [editValor, setEditValor] = useState('');

  const impuestoSeleccionado = impuestos.find((i) => i.tipo === tipoImpuesto);

  useEffect(() => {
    if (impuestoSeleccionado) {
      setValor(impuestoSeleccionado.valor.toString());
    }
  }, [tipoImpuesto]);

  const handleAgregar = () => {
    if (!tipoImpuesto || !valor) return;

    const nuevo = {
      id: Date.now(),
      tipo: impuestoSeleccionado?.tipo || '',
      descripcion: impuestoSeleccionado?.descripcion || '',
      valor: parseFloat(valor).toFixed(2)
    };

    setDatos((prev) => [...prev, nuevo]);
    setTipoImpuesto('');
    setValor('');
  };

  const handleEliminar = (id: number) => {
    setDatos((prev) => prev.filter((item) => item.id !== id));
  };

  const handleEditar = (item: any) => {
    setEditandoId(item.id);
    setEditDescripcion(item.descripcion);
    setEditValor(item.valor);
  };

  const handleGuardar = (id: number) => {
    setDatos((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              descripcion: editDescripcion,
              valor: parseFloat(editValor).toFixed(2)
            }
          : item
      )
    );
    setEditandoId(null);
    setEditDescripcion('');
    setEditValor('');
  };

  const handleContinuar = () => {
    if (datos.length === 0) return;
    setOpenSnackbar(true);
  };

  useEffect(() => {
    const suma = datos.reduce((acc, item) => acc + parseFloat(item.valor), 0);
    const subtotalRedondeado = parseFloat(suma.toFixed(2));
    setSubtotal(subtotalRedondeado);
    localStorage.setItem('subtotalImpuestos', subtotalRedondeado.toString());
  }, [datos]);

  return (
    <Box p={2}>
      <Typography variant="h6">Formulario Impuestos</Typography>

      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={4}>
          <TextField
            select
            label="Tipo de Impuesto"
            value={tipoImpuesto}
            onChange={(e) => setTipoImpuesto(e.target.value)}
            fullWidth
          >
            {impuestos.map((imp) => (
              <MenuItem key={imp.tipo} value={imp.tipo}>
                {imp.tipo}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={12} sm={4}>
          <TextField
            label="Descripción"
            value={impuestoSeleccionado?.descripcion || ''}
            fullWidth
            disabled
          />
        </Grid>

        <Grid item xs={12} sm={2}>
          <TextField
            label="Valor $"
            type="number"
            value={valor}
            fullWidth
            disabled
          />
        </Grid>

        <Grid item xs={12} sm={2}>
          <Button variant="contained" onClick={handleAgregar} fullWidth>
            Agregar
          </Button>
        </Grid>
      </Grid>

      <Box mt={4}>
        <Typography variant="h6">Impuestos Agregados</Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Tipo</TableCell>
                <TableCell>Liquidaciones</TableCell>
                <TableCell>Valor ($)</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {datos.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.tipo}</TableCell>
                  <TableCell>
                    {editandoId === row.id ? (
                      <TextField
                        value={editDescripcion}
                        onChange={(e) => setEditDescripcion(e.target.value)}
                        fullWidth
                      />
                    ) : (
                      row.descripcion
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
                    <IconButton onClick={() => handleEliminar(row.id)}>
                      <DeleteIcon />
                    </IconButton>
                    {editandoId === row.id ? (
                      <IconButton onClick={() => handleGuardar(row.id)}>
                        <SaveIcon />
                      </IconButton>
                    ) : (
                      <IconButton onClick={() => handleEditar(row)}>
                        <EditIcon />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Box mt={2} display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">SUBTOTAL:</Typography>
          <Typography variant="h6">${subtotal.toFixed(2)}</Typography>
        </Box>

        <Box mt={3} display="flex" justifyContent="flex-end">
          <Button
            variant="contained"
            color="primary"
            onClick={handleContinuar}
            disabled={datos.length === 0}
          >
            CONTINUAR
          </Button>
        </Box>
      </Box>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={3000}
        onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" variant="filled" onClose={() => setOpenSnackbar(false)}>
          ✅ Impuestos aprobados correctamente
        </Alert>
      </Snackbar>
    </Box>
  );
};
