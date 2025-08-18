import React, { useState } from 'react';
import {
  Box, Button, Grid, IconButton, MenuItem, Paper,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, Snackbar, Alert, Typography
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { PERIODOS_CATALOGO } from '../helpers/periodosCatalog';
import { AyudaButton } from './AyudaButton';

export const PeriodosInvestigacion = ({readOnly}: {readOnly:any}) => {
  const [periodo, setPeriodo] = useState<number | ''>('');
  const [lista, setLista] = useState<number[]>([]);
  const [msg, setMsg] = useState('');

  const handleAgregar = () => {
    if (!periodo) { setMsg('Seleccione un periodo.'); return; }
    if (lista.includes(periodo)) { setMsg('Este periodo ya fue agregado.'); return; }
    setLista(prev => [...prev, periodo]);
    setPeriodo('');
  };
  const handleEliminar = (p: number) => setLista(prev => prev.filter(e => e !== p));

  return (
    <Box>
    
      <Grid container spacing={2} alignItems="center">
        <Grid item xs="auto">
          <TableContainer component={Paper}>
            <Table size="small">
              <TableBody>
                <TableRow>
                  <TableCell sx={{ bgcolor: '#FFE5D0', fontWeight: 700 }}>PERIODO</TableCell>
                  <TableCell>
                    <TextField
                      select size="small" value={periodo}
                      onChange={(e) => setPeriodo(Number(e.target.value))}
                      sx={{ minWidth: 120 }}
                    >
                      {PERIODOS_CATALOGO.map(a => (
                        <MenuItem key={a} value={a}>{a}</MenuItem>
                      ))}
                    </TextField>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>

   {!readOnly &&  <Grid item xs="auto">
          <Button
            variant="contained"
            sx={{ bgcolor: '#2E3A47', '&:hover': { bgcolor: '#26313B' }, height: '100%' }}
            onClick={handleAgregar}
          >
            AGREGAR
          </Button>
        </Grid>}
      </Grid>

      {/* Tabla de periodos */}
      <Box mt={3}>
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ bgcolor: '#FEF1C6', fontWeight: 700 }}>PERIODO</TableCell>
                <TableCell align="center" sx={{ bgcolor: '#FEF1C6', fontWeight: 700 }}>Acción</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {lista.map(p => (
                <TableRow key={p}>
                  <TableCell>{p}</TableCell>
                  <TableCell align="center">
                    <IconButton onClick={() => handleEliminar(p)}><DeleteOutlineIcon /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {lista.length === 0 && (
                <>
                  <TableRow><TableCell colSpan={2}>&nbsp;</TableCell></TableRow>
                  <TableRow><TableCell colSpan={2}>&nbsp;</TableCell></TableRow>
                </>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Mensajes */}
      <Snackbar
        open={!!msg}
        autoHideDuration={2500}
        onClose={() => setMsg('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="warning" variant="filled" onClose={() => setMsg('')}>
          {msg}
        </Alert>
      </Snackbar>
    </Box>
  );
};
