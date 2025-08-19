import React, { useMemo, useState } from 'react';
import {
  Autocomplete, Box, Button, Grid, IconButton, Paper, Stack, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TextField, Typography, Snackbar, Alert
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { NORMAS_CATALOGO } from '../helpers/normasCatalog';
import { NormaSeleccionada } from '../helpers/normasTypes';

const normalizar = (s: string) => s.trim().toLowerCase();

export const NormasRelacionadas = ({readOnly}:{readOnly:any}) => {
  // selección actual del usuario (form de arriba)
  const [leyNorma, setLeyNorma] = useState<string>('');
  const [vigente, setVigente] = useState<'SI' | 'NO'>('SI');
  const [desde, setDesde] = useState<string>('');
  const [rows, setRows] = useState<NormaSeleccionada[]>([]);
  const [msg, setMsg] = useState<string>('');

  // Opciones para el Autocomplete
  const opciones = useMemo(() => NORMAS_CATALOGO.map(n => n.titulo), []);

  // cuando el usuario escribe o elige una opción
  const handleChangeTitulo = (_: any, value: string | null) => {
    const titulo = (value ?? '').trim();
    setLeyNorma(titulo);

    // si existe en catálogo, autocompleta vigente y desde
    const found = NORMAS_CATALOGO.find(n => normalizar(n.titulo) === normalizar(titulo));
    if (found) {
      setVigente(found.vigente);
      setDesde(found.desde);
    }
  };

  const handleAgregar = () => {
    const titulo = leyNorma.trim();
    if (!titulo) {
      setMsg('Ingrese/seleccione una Ley o Norma.');
      return;
    }
    // evitar duplicados por título
    const yaExiste = rows.some(r => normalizar(r.titulo) === normalizar(titulo));
    if (yaExiste) {
      setMsg('Esta norma ya fue agregada.');
      return;
    }
    const base = NORMAS_CATALOGO.find(n => normalizar(n.titulo) === normalizar(titulo));
    const nueva: NormaSeleccionada = {
      id: base?.id ?? `custom-${Date.now()}`,
      titulo,
      vigente: vigente ?? 'SI',
      desde: desde || base?.desde || '',
    };
    setRows(prev => [...prev, nueva]);

    // limpiar input (deja los defaults si quieres conservarlos)
    setLeyNorma('');
    setVigente('SI');
    setDesde('');
  };

  const handleEliminar = (id: string) => {
    setRows(prev => prev.filter(r => r.id !== id));
  };

  return (
    <Box>
      {/* Encabezado */}
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12}>
          <Typography fontWeight={700}>LEY / NORMA</Typography>
        </Grid>

        {/* Input grande tipo Excel con Autocomplete */}
        <Grid item xs={12}>
          <Autocomplete
            freeSolo
            options={opciones}
            value={leyNorma}
            onInputChange={handleChangeTitulo}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Escriba o seleccione una norma del catálogo…"
                fullWidth
                sx={{
                  '& .MuiInputBase-root': { borderRadius: 0 },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#6FBF73' },
                }}
              />
            )}
          />
        </Grid>

        {/* Pequeña tabla de Vigente / Desde */}
        <Grid item xs={12} sm={6} md={4}>
          <TableContainer component={Paper} sx={{ borderRadius: 0 }}>
            <Table size="small">
              <TableBody>
                <TableRow>
                  <TableCell sx={{ bgcolor: '#FFE5D0', width: 120 }}>
                    <Typography fontWeight={700}>Vigente</Typography>
                  </TableCell>
                  <TableCell>
                    <TextField
                      select
                      SelectProps={{ native: true }}
                      size="small"
                      value={vigente}
                      onChange={(e) => setVigente(e.target.value as 'SI' | 'NO')}
                    >
                      <option value="SI">SI</option>
                      <option value="NO">NO</option>
                    </TextField>
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell sx={{ bgcolor: '#FFE5D0' }}>
                    <Typography fontWeight={700}>Desde</Typography>
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      value={desde}
                      onChange={(e) => setDesde(e.target.value)}
                      placeholder="NOV/14/2022"
                      fullWidth
                    />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>

        {/* Botón AGREGAR centrado */}
     { !readOnly &&   <Grid item xs={12}>
          <Stack alignItems="center">
            <Button
              variant="contained"
              onClick={handleAgregar}
              sx={{
                bgcolor: '#2E3A47',
                px: 5,
                py: 1.2,
                borderRadius: '10px',
                '&:hover': { bgcolor: '#26313B' }
              }}
            >
              AGREGAR
            </Button>
          </Stack>
        </Grid>}
      </Grid>

      {/* Tabla resultado */}
      <Box mt={3}>
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ bgcolor: '#FEF1C6', fontWeight: 700 }}>LEY / NORMA</TableCell>
                <TableCell align="center" sx={{ bgcolor: '#FEF1C6', fontWeight: 700 }}>VIGENTE</TableCell>
                <TableCell align="center" sx={{ bgcolor: '#FEF1C6', fontWeight: 700 }}>DESDE</TableCell>
                <TableCell align="center" sx={{ bgcolor: '#FEF1C6', fontWeight: 700, width: 90 }}>Acción</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell sx={{ whiteSpace: 'pre-wrap', maxWidth: 420 }}>{r.titulo}</TableCell>
                  <TableCell align="center">{r.vigente}</TableCell>
                  <TableCell align="center">{r.desde}</TableCell>
                  <TableCell align="center">
              {!readOnly &&      <IconButton onClick={() => handleEliminar(r.id)}>
                      <DeleteOutlineIcon />
                    </IconButton>}
                  </TableCell>
                </TableRow>
              ))}
              {/* Filas vacías para estética como en tu mock */}
              {rows.length === 0 && (
                <>
                  <TableRow><TableCell colSpan={4}>&nbsp;</TableCell></TableRow>
                  <TableRow><TableCell colSpan={4}>&nbsp;</TableCell></TableRow>
                </>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Snackbar
        open={!!msg}
        autoHideDuration={2500}
        onClose={() => setMsg('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="warning" onClose={() => setMsg('')} variant="filled">
          {msg}
        </Alert>
      </Snackbar>
    </Box>
  );
};
