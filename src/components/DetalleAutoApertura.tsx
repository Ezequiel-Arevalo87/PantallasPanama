// src/components/DetalleAutoApertura.tsx
import React, { useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import {
  Box, Grid, Paper, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Typography, TextField, MenuItem, Button, IconButton, Snackbar, Alert,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

import { AyudaButton } from './AyudaButton';
import { NormasRelacionadas } from './NormasRelacionadas';
import { PeriodosInvestigacion } from './PeriodosInvestigacion';
import { ObjetoInvestigacion } from './ObjetoInvestigacion';
import { Alcance, FichaContribuyente, ObjeticoInvestigacion, ObjeticoInvestigacionDos } from '../helpers/types';

type Nivel = 'AUDITOR' | 'SUPERVISOR' | 'DIRECTOR';

// catálogo de documentos
const DOC_OPCIONES = [
  'Registros Contables',
  'Documentos Soporte',
  'Libros de Contabilidad',
  'Facturas',
  'Contratos',
  'Otros Documentos',
] as const;

export const DetalleAutoApertura: React.FC<{
  ficha: Required<FichaContribuyente>;
  investigacionObtejo: Required<ObjeticoInvestigacion> | null;
  alcance?: Required<Alcance> | null;
  investigacionObtejoDos: Required<ObjeticoInvestigacionDos> | null;
  onVolver?: () => void;

  /** Soporte legacy: si ya usabas readOnly/setReadOnly, siguen funcionando */
  readOnly?: boolean;
  setReadOnly?: (v: boolean) => void;

  /** Nuevo (opcional pero recomendado): nivel y setter para controlar el flujo AUDITOR→SUPERVISOR→DIRECTOR */
  nivel?: Nivel;
  setNivel?: (n: Nivel) => void;
}> = ({
  ficha,
  investigacionObtejo,
  alcance,
  investigacionObtejoDos,
  onVolver,

  readOnly: readOnlyProp,
  setReadOnly,

  nivel: nivelProp,
  setNivel: setNivelProp,
}) => {
  // Estado interno si no te pasan nivel desde arriba
  const [nivelLocal, setNivelLocal] = useState<Nivel>(nivelProp ?? 'AUDITOR');
  const nivel = nivelProp ?? nivelLocal;
  const setNivel = setNivelProp ?? setNivelLocal;

  // Derivar modo lectura:
  // - Si te pasan readOnly explícito, lo respeto.
  // - Si no, lo infiero del nivel (solo AUDITOR edita).
  const isLectura = typeof readOnlyProp === 'boolean'
    ? readOnlyProp
    : nivel !== 'AUDITOR';

  // --- Estado local para "Alcance / Documentos"
  const [docSel, setDocSel] = useState<string>('');
  const [docOtro, setDocOtro] = useState<string>('');
  const [docs, setDocs] = useState<string[]>([]);
  const [toast, setToast] = useState<string>('');

  const esOtros = docSel === 'Otros Documentos';

  const handleAgregarDoc = () => {
    if (!docSel) return setToast('Seleccione un tipo de documento.');
    if (esOtros && !docOtro.trim()) return setToast('Indique el documento en el campo OTRO.');
    const etiqueta = esOtros ? docOtro.trim() : docSel;
    if (docs.includes(etiqueta)) return setToast('Ese documento ya fue agregado.');
    setDocs((prev) => [...prev, etiqueta]);
    setDocSel('');
    setDocOtro('');
  };

  const handleEliminarDoc = (label: string) => {
    setDocs((prev) => prev.filter((d) => d !== label));
  };

  /** Cambia nivel y sincroniza readOnly legacy si te lo pasaron */
  const moverANivel = (destino: Nivel) => {
    setNivel(destino);
    if (setReadOnly) setReadOnly(destino !== 'AUDITOR');
  };

  const siguienteTrasAprobar: Nivel | null = useMemo(() => {
    if (nivel === 'AUDITOR') return 'SUPERVISOR';
    if (nivel === 'SUPERVISOR') return 'DIRECTOR';
    return null; // DIRECTOR es el último
  }, [nivel]);

  const textos = useMemo<Record<string, string>>(() => {
    const next = siguienteTrasAprobar;
    const aprobarTxt = next
      ? `Pasará a ${next} y se bloqueará la edición.`
      : `Se mantendrá en DIRECTOR.`;
    return {
      Aprobado: aprobarTxt,
      Devolver: 'Volverá a AUDITOR y se habilitará la edición.',
      Guardar: 'Se guardarán los cambios.',
      Editar: 'Entrará en modo edición.',
      Imprimir: 'Se generará el documento para imprimir.',
    };
  }, [siguienteTrasAprobar]);

  const confirmarYAccionar = async (
    m: 'Aprobado' | 'Devolver' | 'Guardar' | 'Editar' | 'Imprimir'
  ) => {
    // Caso especial: DEVOLVER (siempre a AUDITOR)
    if (m === 'Devolver') {
      const { value, isConfirmed } = await Swal.fire({
        title: 'Devolver a AUDITOR',
        text: 'Indique el motivo de la devolución.',
        input: 'textarea',
        inputLabel: 'Observación',
        inputPlaceholder: 'Explique brevemente el motivo...',
        inputAttributes: { 'aria-label': 'Observación de devolución' },
        inputValidator: (v) => {
          if (!v || !v.trim()) return 'La observación es obligatoria';
          if (v.trim().length > 500) return 'Máximo 500 caracteres';
          return undefined;
        },
        showCancelButton: true,
        confirmButtonText: 'Devolver',
        cancelButtonText: 'Cancelar',
        reverseButtons: true,
        focusCancel: true,
      });
      if (!isConfirmed) return;

      moverANivel('AUDITOR');
      setToast(`Devolución registrada: ${String(value).trim()}`);

      await Swal.fire({
        title: 'Hecho',
        text: 'Devolución registrada',
        icon: 'success',
        timer: 1200,
        showConfirmButton: false,
      });
      return;
    }

    // Confirmación general
    const { isConfirmed } = await Swal.fire({
      title: '¿Está seguro?',
      text: textos[m] ?? '¿Desea continuar con esta acción?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
      focusCancel: true,
    });
    if (!isConfirmed) return;

    // Acción
    if (m === 'Aprobado') {
      if (siguienteTrasAprobar) moverANivel(siguienteTrasAprobar);
      setToast('Aprobado');
    } else if (m === 'Editar') {
      // Sólo permitirá editar si estás en AUDITOR
      if (nivel !== 'AUDITOR') return setToast('Solo AUDITOR puede editar.');
      if (setReadOnly) setReadOnly(false);
      setToast('Editar');
    } else {
      setToast(m);
    }

    await Swal.fire({
      title: 'Hecho',
      text: m,
      icon: 'success',
      timer: 1200,
      showConfirmButton: false,
    });
  };

  return (
    <Box mt={3}>
      <Grid container spacing={2}>
        {/* Cabeceras */}
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
          <NormasRelacionadas readOnly={isLectura} />
        </Grid>

        {/* 3. OBJETO + Períodos */}
        <Grid item xs={12} mt={2}>
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
          <PeriodosInvestigacion readOnly={isLectura} />
        </Grid>

        {/* 4. ALCANCE */}
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

          {/* Documentos + OTRO + AGREGAR */}
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
                          disabled={isLectura}
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
                          disabled={! (docSel === 'Otros Documentos') || isLectura}
                          sx={{ minWidth: 240 }}
                        />
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>

            {!isLectura && (
              <Grid item xs="auto">
                <Button
                  variant="contained"
                  sx={{ bgcolor: '#2E3A47', '&:hover': { bgcolor: '#26313B' }, height: '100%' }}
                  onClick={handleAgregarDoc}
                >
                  AGREGAR
                </Button>
              </Grid>
            )}
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
                        {!isLectura && (
                          <IconButton onClick={() => handleEliminarDoc(d)}>
                            <DeleteOutlineIcon />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {docs.length === 0 && (
                    <>
                      <TableRow><TableCell colSpan={2}>&nbsp;</TableCell></TableRow>
                      <TableRow><TableCell colSpan={2}>&nbsp;</TableCell></TableRow>
                    </>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Grid>

        {/* 5. PLAZO */}
        <Grid item xs={12}>
          <Box sx={{ bgcolor: '#E3F2FD', p: 1 }}>
            <Typography align="center" fontWeight={700}>
              5. PLAZO PARA LA INVESTIGACIÓN O AUDITORÍA
            </Typography>
          </Box>
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
        {!isLectura && (
          <Grid item xs={12} display="flex" gap={2} justifyContent="center" mt={3} mb={1}>
            <Button variant="contained" onClick={() => confirmarYAccionar('Guardar')}>GUARDAR</Button>
            <Button variant="contained" onClick={() => confirmarYAccionar('Editar')}>EDITAR</Button>
            <Button variant="contained" onClick={() => confirmarYAccionar('Imprimir')}>IMPRIMIR</Button>
            <Button variant="contained" onClick={() => confirmarYAccionar('Aprobado')}>APROBAR</Button>
          </Grid>
        )}

        {isLectura && (
          <Grid item xs={12} display="flex" gap={2} justifyContent="center" mt={3} mb={1}>
            <Button variant="contained" onClick={() => confirmarYAccionar('Imprimir')}>IMPRIMIR</Button>
            <Button variant="contained" onClick={() => confirmarYAccionar('Aprobado')}>APROBAR</Button>
            <Button variant="contained" onClick={() => confirmarYAccionar('Devolver')}>DEVOLVER</Button>
          </Grid>
        )}
      </Grid>

      {/* Snackbar */}
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
