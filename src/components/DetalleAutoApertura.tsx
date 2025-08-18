// src/components/DetalleAutoApertura.tsx
import React, { useState } from 'react';
import {
  Box,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  TextField,
  MenuItem,
  Button,
  IconButton,
  Snackbar,
  Alert,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

import { AyudaButton } from './AyudaButton';
import { NormasRelacionadas } from './NormasRelacionadas';
import { PeriodosInvestigacion } from './PeriodosInvestigacion';
import { ObjetoInvestigacion } from './ObjetoInvestigacion';
import { Alcance, FichaContribuyente, ObjeticoInvestigacion, ObjeticoInvestigacionDos } from '../helpers/types';

// catálogo de documentos
const DOC_OPCIONES = [
  'Registros Contables',
  'Documentos Soporte',
  'Libros de Contabilidad',
  'Facturas',
  'Contratos',
  'Otros Documentos', // si se elige, aparece el campo OTRO
] as const;

export const DetalleAutoApertura: React.FC<{
  ficha: Required<FichaContribuyente>;
  investigacionObtejo: Required<ObjeticoInvestigacion> | null;
  alcance?: Required<Alcance> | null; // opcional
  investigacionObtejoDos: Required<ObjeticoInvestigacionDos> | null;
  onVolver?: () => void;
  readOnly:any;
  setReadOnly:any;
}> = ({ ficha, investigacionObtejo, alcance, investigacionObtejoDos,  readOnly,
  setReadOnly }) => {
  // --- Estado local para "Alcance / Documentos"
  const [docSel, setDocSel] = useState<string>('');
  const [docOtro, setDocOtro] = useState<string>('');
  const [docs, setDocs] = useState<string[]>([]);
  const [toast, setToast] = useState<string>('');

  const esOtros = docSel === 'Otros Documentos';

  const handleAgregarDoc = () => {
    if (!docSel) {
      setToast('Seleccione un tipo de documento.');
      return;
    }
    if (esOtros && !docOtro.trim()) {
      setToast('Indique el documento en el campo OTRO.');
      return;
    }
    const etiqueta = esOtros ? docOtro.trim() : docSel;
    if (docs.includes(etiqueta)) {
      setToast('Ese documento ya fue agregado.');
      return;
    }
    setDocs((prev) => [...prev, etiqueta]);
    setDocSel('');
    setDocOtro('');
  };

  const handleEliminarDoc = (label: string) => {
    setDocs((prev) => prev.filter((d) => d !== label));
  };


  const accionMsg = (m: string) =>{  
      
  setToast(m);
  if(m==='Aprobado' ){
  setReadOnly(true)
  }


}
  return (
    <Box mt={3}>
      <Grid container spacing={2}>
        {/* Datos del contribuyente (columna izquierda) */}
        <Grid item xs={12} md={6}>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Nombre del Contribuyente</TableCell>
                  <TableCell>{ficha.nombre}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Identificación del Contribuyente</TableCell>
                  <TableCell>{ficha.identificacion}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Domicilio</TableCell>
                  <TableCell>{ficha.domicilio}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>

        {/* Datos del auto (columna derecha) */}
        <Grid item xs={12} md={6}>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Número de Auto de Apertura</TableCell>
                  <TableCell>{ficha.numAuto}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Fecha</TableCell>
                  <TableCell>{ficha.fecha}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Hora</TableCell>
                  <TableCell>{ficha.hora}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>

        {/* 1. ANTECEDENTES */}
        <Grid item xs={12}>
          <Box sx={{ border: '1px solid #cfd8dc', borderRadius: 1 }}>
            <Box sx={{ bgcolor: '#ECEFF1', p: 1 }}>
              <Typography align="center" fontWeight={700}>
                1. ANTECEDENTES PARA ESTA INVESTIGACIÓN
              </Typography>
            </Box>
            <Grid container>
              <Grid item xs={12} md={9} p={2}>
                <Typography textAlign="justify">{ficha.antecedentes}</Typography>
              </Grid>
              <Grid item xs={12} md={3} p={2}>
                <AyudaButton
                  titulo="Ayuda: Antecedentes"
                  contenido="Antecedentes: Registre breve descripción (hasta 1000 caracteres)."
                />
              </Grid>
            </Grid>
          </Box>
        </Grid>

        {/* 2. FUNDAMENTOS DE DERECHO */}
        <Grid item xs={12}>
          <Box sx={{ border: '1px solid #cfd8dc', borderRadius: 1 }}>
            <Box sx={{ bgcolor: '#ECEFF1', p: 1 }}>
              <Typography align="center" fontWeight={700}>
                2. FUNDAMENTOS DE DERECHO
              </Typography>
            </Box>
            <Grid container>
              <Grid item xs={12} md={9} p={2}>
                <Typography textAlign="justify">{ficha.fundamentos}</Typography>
              </Grid>
              <Grid item xs={12} md={3} p={2}>
                <AyudaButton
                  titulo="Ayuda: Fundamentos de Derecho"
                  contenido="Liste las normas legales que fundamentan la apertura de la investigación o auditoría."
                />
              </Grid>
            </Grid>
          </Box>
        </Grid>

      

        {/* Normas relacionadas */}
        <Grid item xs={12} mt={2}>
          <Typography variant="h6" fontWeight={700} mb={2}>
            Normas Relacionadas
          </Typography>
          <NormasRelacionadas readOnly = {readOnly} />
        </Grid>

        {/* Períodos Fiscales */}
        <Grid item xs={12} mt={2}>
           {/* 3. OBJETO DE LA INVESTIGACIÓN */}
        <Grid item xs={12}>
          <Box sx={{ bgcolor: '#E3F2FD', p: 1 }}>
            <Typography align="center" fontWeight={700}>
              3. OBJETO DE LA INVESTIGACIÓN
            </Typography>
          </Box>
          <Box mt={2}>
            <ObjetoInvestigacion
              texto={investigacionObtejo?.investigacion}
              ayuda={investigacionObtejo?.fundamentos}
            />
          </Box>
        </Grid>
          <Typography variant="h6" fontWeight={700} mb={1}>
            Períodos Fiscales
          </Typography>
          <PeriodosInvestigacion  readOnly = {readOnly} />
        </Grid>

           {/* 4. ALCANCE DE LA INVESTIGACIÓN */}
        <Grid item xs={12}>
          <Box sx={{ bgcolor: '#E3F2FD', p: 1 }}>
            <Typography align="center" fontWeight={700}>
              4. ALCANCE DE LA INVESTIGACIÓN
            </Typography>
          </Box>
              <Box mt={2}>
            <ObjetoInvestigacion
              texto={investigacionObtejoDos?.investigacionDos}
              ayuda={investigacionObtejoDos?.fundamentos}
            />
          </Box>

          {/* Formulario Documentos + OTRO + AGREGAR */}
          <Grid container spacing={2} alignItems="center" sx={{ mt: 2 }}>
            <Grid item xs="auto">
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell sx={{ bgcolor: '#FFE5D0', fontWeight: 700 }}>DOCUMENTOS</TableCell>
                      <TableCell>
                        <TextField
                          select
                          size="small"
                          value={docSel}
                          onChange={(e) => setDocSel(e.target.value)}
                          sx={{ minWidth: 240 }}
                        >
                          {DOC_OPCIONES.map((o) => (
                            <MenuItem key={o} value={o}>
                              {o}
                            </MenuItem>
                          ))}
                        </TextField>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ bgcolor: '#FFE5D0', fontWeight: 700 }}>OTRO</TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          placeholder="Especifique"
                          value={docOtro}
                          onChange={(e) => setDocOtro(e.target.value)}
                          disabled={!esOtros}
                          sx={{ minWidth: 240 }}
                        />
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>

           { !readOnly && <Grid item xs="auto">
              <Button
                variant="contained"
                sx={{ bgcolor: '#2E3A47', '&:hover': { bgcolor: '#26313B' }, height: '100%' }}
                onClick={handleAgregarDoc}
              >
                AGREGAR
              </Button>
            </Grid>}
          </Grid>

          {/* Tabla de documentos agregados */}
          <Box mt={2}>
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ bgcolor: '#FEF1C6', fontWeight: 700 }}>DOCUMENTOS</TableCell>
                    <TableCell align="center" sx={{ bgcolor: '#FEF1C6', fontWeight: 700 }}>
                      Acción
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {docs.map((d) => (
                    <TableRow key={d}>
                      <TableCell>{d}</TableCell>
                      <TableCell align="center">
                        <IconButton onClick={() => handleEliminarDoc(d)}>
                          <DeleteOutlineIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {docs.length === 0 && (
                    <>
                      <TableRow>
                        <TableCell colSpan={2}>&nbsp;</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={2}>&nbsp;</TableCell>
                      </TableRow>
                    </>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Grid>

                {/* 5. PLAZO PARA LA INVESTIGACIÓN O AUDITORÍA */}
        <Grid item xs={12}>
          <Box sx={{ bgcolor: '#E3F2FD', p: 1 }}>
            <Typography align="center" fontWeight={700}>
              5. PLAZO PARA LA INVESTIGACIÓN O AUDITORÍA
            </Typography>
          </Box>

          {/* Banda de texto + ayuda */}
          <Grid container alignItems="center" spacing={2} sx={{ mt: 1 }}>
            <Grid item xs>
              <Box sx={{ border: '1px solid #B0BEC5', borderRadius: 1, p: 2 }}>
                <Typography variant="body2">
                  El plazo para la presente investigación será hasta de <b>seis (6) meses</b> contados a partir de la
                  notificación del presente Auto, prorrogable hasta por <b>tres (3) meses</b> adicionales, de acuerdo
                  con lo dispuesto en el Código de Procedimiento Tributario.
                </Typography>
              </Box>
            </Grid>
            <Grid item>
              <AyudaButton
                titulo="Ayuda: Plazo para la investigación o auditoría"
                contenido="Plazo para la investigación o auditoría [establecimiento del plazo para la realización de la investigación o auditoría]"
              />
            </Grid>
          </Grid>
        </Grid>

        {/* Botonera inferior */}
      { !readOnly &&
       (<Grid item xs={12} display="flex" gap={2} justifyContent="center" mt={3} mb={1}>
          <Button variant="contained" onClick={() => accionMsg('Guardado')}>
            GUARDAR
          </Button>
          <Button variant="contained" onClick={() => accionMsg('Editado')}>
            EDITAR
          </Button>
          <Button variant="contained" onClick={() => accionMsg('Imprimiendo')}>
            IMPRIMIR
          </Button>
          <Button variant="contained" onClick={() => accionMsg('Aprobado')}>
            APROBAR
          </Button>
        </Grid>)}

  { readOnly &&     <Grid item xs={12} display="flex" gap={2} justifyContent="center" mt={3} mb={1}>
    
          <Button variant="contained" onClick={() => accionMsg('Imprimiendo')}>
            IMPRIMIR
          </Button>
          <Button variant="contained" onClick={() => accionMsg('Aprobado')}>
            APROBAR
          </Button>
                 <Button variant="contained" onClick={() => accionMsg('Devolver')}>
            DEVOLVER
          </Button>
        </Grid>}
      </Grid>

      {/* Snackbar de mensajes (agregar, errores y botones azules) */}
      <Snackbar
        open={!!toast}
        autoHideDuration={2500}
        onClose={() => setToast('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert variant="filled" severity="info" onClose={() => setToast('')}>
          {toast}
        </Alert>
      </Snackbar>
    </Box>
  );
};


