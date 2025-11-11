// src/components/DetalleAutoApertura.tsx
import React, { useEffect, useMemo, useState, useRef } from 'react';
import Swal from 'sweetalert2';
import {
  Box, Grid, Paper, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Typography, TextField, MenuItem, Button, IconButton, Snackbar, Alert,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

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

/** ========= VISTA DOCUMENTO (monocromática, sin controles) ========= */
const DocumentoAutoApertura = React.forwardRef<HTMLDivElement, {
  ficha: Required<FichaContribuyente>;
  investigacionObtejo: Required<ObjeticoInvestigacion> | null;
  investigacionObtejoDos: Required<ObjeticoInvestigacionDos> | null;
  docs: string[];
  isLectura: boolean;
}>(({ ficha, investigacionObtejo, investigacionObtejoDos, docs }, ref) => {
  const Row = ({ label, value }: { label: string; value?: React.ReactNode }) => (
    <TableRow>
      <TableCell sx={{ fontWeight: 700, borderColor: '#000' }}>{label}</TableCell>
      <TableCell sx={{ borderColor: '#000' }}>{value ?? '—'}</TableCell>
    </TableRow>
  );

  return (
    <Box
      ref={ref}
      sx={{
        color: '#000',
        bgcolor: '#fff',
        p: 3,
        fontSize: 12,
        // ancho A4 aproximado a ~794px (96dpi).
        maxWidth: 794,
      }}
    >
      {/* Encabezado simple (sin color) */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 800 }}>INFORME DE AUDITORIA</Typography>
        <Typography variant="body2">Dirección General – Unidad de Fiscalización</Typography>
        <Box sx={{ borderTop: '1px solid #000', mt: 1 }} />
      </Box>

      {/* Cabeceras */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <TableContainer>
            <Table size="small" sx={{ border: '1px solid #000' }}>
              <TableBody>
                <Row label="Nombre del Contribuyente" value={ficha.nombre} />
                <Row label="Identificación del Contribuyente" value={ficha.identificacion} />
                <Row label="Domicilio" value={ficha.domicilio} />
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>

        <Grid item xs={12} md={6}>
          <TableContainer>
            <Table size="small" sx={{ border: '1px solid #000' }}>
              <TableBody>
                <Row label="Número de Auto de Apertura" value={ficha.numAuto} />
                <Row label="Fecha" value={ficha.fecha} />
                <Row label="Hora" value={ficha.hora} />
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>

      {/* 1. ANTECEDENTES */}
      <Box sx={{ mt: 3 }}>
        <Typography sx={{ fontWeight: 800, mb: 1 }}>1. ANTECEDENTES PARA ESTA INVESTIGACIÓN</Typography>
        <Typography sx={{ textAlign: 'justify', whiteSpace: 'pre-wrap' }}>
          {ficha.antecedentes}
        </Typography>
      </Box>

      {/* 2. FUNDAMENTOS DE DERECHO */}
      <Box sx={{ mt: 3 }}>
        <Typography sx={{ fontWeight: 800, mb: 1 }}>2. FUNDAMENTOS DE DERECHO</Typography>
        <Typography sx={{ textAlign: 'justify', whiteSpace: 'pre-wrap' }}>
          {ficha.fundamentos}
        </Typography>
      </Box>

      {/* Normas relacionadas (plano, en negro) */}
      <Box sx={{ mt: 3 }}>
        <Typography sx={{ fontWeight: 800, mb: 1 }}>NORMAS RELACIONADAS</Typography>
        {/* Asumimos que tu componente respeta readOnly y no muestra controles */}
        <NormasRelacionadas readOnly />
      </Box>

      {/* 3. OBJETO + Períodos */}
      <Box sx={{ mt: 3 }}>
        <Typography sx={{ fontWeight: 800, mb: 1 }}>3. OBJETO DE LA INVESTIGACIÓN</Typography>
        <Typography sx={{ textAlign: 'justify', whiteSpace: 'pre-wrap' }}>
          {investigacionObtejo?.investigacion || '—'}
        </Typography>

        <Box sx={{ mt: 2 }}>
          <Typography sx={{ fontWeight: 700, mb: 1 }}>Períodos Fiscales</Typography>
          {/* Asumimos que PeriodosInvestigacion con readOnly no pinta controles */}
          <PeriodosInvestigacion readOnly />
        </Box>
      </Box>

      {/* 4. ALCANCE + Documentos solicitados (lista simple) */}
      <Box sx={{ mt: 3 }}>
        <Typography sx={{ fontWeight: 800, mb: 1 }}>4. ALCANCE DE LA INVESTIGACIÓN</Typography>
        <Typography sx={{ textAlign: 'justify', whiteSpace: 'pre-wrap' }}>
          {investigacionObtejoDos?.investigacionDos || '—'}
        </Typography>

        <Box sx={{ mt: 2 }}>
          <Typography sx={{ fontWeight: 700, mb: 1 }}>Documentos a requerir</Typography>
          <TableContainer>
            <Table size="small" sx={{ border: '1px solid #000' }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ borderColor: '#000', fontWeight: 700 }}>DOCUMENTO</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {docs.length > 0 ? (
                  docs.map(d => (
                    <TableRow key={d}>
                      <TableCell sx={{ borderColor: '#000' }}>{d}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell sx={{ borderColor: '#000' }}>—</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Box>

      {/* 5. PLAZO */}
      <Box sx={{ mt: 3 }}>
        <Typography sx={{ fontWeight: 800, mb: 1 }}>5. PLAZO PARA LA INVESTIGACIÓN O AUDITORÍA</Typography>
        <Typography variant="body2" sx={{ textAlign: 'justify' }}>
          El plazo para la presente investigación será hasta de <b>seis (6) meses</b> contados a partir de la
          notificación del presente Auto, prorrogable hasta por <b>tres (3) meses</b> adicionales, de acuerdo
          con lo dispuesto en el Código de Procedimiento Tributario.
        </Typography>
      </Box>

      {/* Pie de página simple */}
      <Box sx={{ mt: 4 }}>
        <Box sx={{ borderTop: '1px solid #000', mb: 1 }} />
        <Typography variant="caption">
          Documento generado automáticamente — {new Date().toLocaleDateString()}
        </Typography>
      </Box>
    </Box>
  );
});
DocumentoAutoApertura.displayName = 'DocumentoAutoApertura';
/** ======== FIN VISTA DOCUMENTO ======== */

export const DetalleAutoApertura: React.FC<{
  ficha: Required<FichaContribuyente>;
  investigacionObtejo: Required<ObjeticoInvestigacion> | null;
  alcance?: Required<Alcance> | null; // (no se usa dentro del PDF plano)
  investigacionObtejoDos: Required<ObjeticoInvestigacionDos> | null;
  onVolver?: () => void;
  readOnly?: boolean;
  setReadOnly?: (v: boolean) => void;
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
  const isControlled = nivelProp !== undefined && setNivelProp !== undefined;
  const [nivelLocal, setNivelLocal] = useState<Nivel>(nivelProp ?? 'AUDITOR');
  useEffect(() => { if (nivelProp !== undefined) setNivelLocal(nivelProp); }, [nivelProp]);
  const nivel: Nivel = isControlled ? (nivelProp as Nivel) : nivelLocal;
  const setNivelUnified = (n: Nivel) => { isControlled ? setNivelProp!(n) : setNivelLocal(n); };
  const isLectura = typeof readOnlyProp === 'boolean' ? readOnlyProp : nivel !== 'AUDITOR';

  const [guardadoOK, setGuardadoOK] = useState<boolean>(false);
  useEffect(() => { if (nivel === 'AUDITOR') setGuardadoOK(false); }, [nivel]);

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
    setDocSel(''); setDocOtro('');
  };
  const handleEliminarDoc = (label: string) => setDocs((prev) => prev.filter((d) => d !== label));

  const moverANivel = (destino: Nivel) => {
    setNivelUnified(destino);
    if (setReadOnly) setReadOnly(destino !== 'AUDITOR');
  };
  const siguienteTrasAprobar: Nivel | null = useMemo(() => {
    if (nivel === 'AUDITOR') return 'SUPERVISOR';
    if (nivel === 'SUPERVISOR') return 'DIRECTOR';
    return null;
  }, [nivel]);

  const textos = useMemo<Record<string, string>>(() => {
    const next = siguienteTrasAprobar;
    const aprobarTxt = next ? `Pasará a ${next} y se bloqueará la edición.` : `Se mantendrá en DIRECTOR.`;
    return {
      Aprobado: aprobarTxt,
      Devolver: 'Volverá a AUDITOR y se habilitará la edición.',
      Guardar: 'Se guardarán los cambios.',
      Editar: 'Entrará en modo edición.',
      Imprimir: 'Se generará el documento para imprimir (formato blanco y negro).',
    };
  }, [siguienteTrasAprobar]);

  // ==== NUEVO: ref del documento monocromático oculto ====
  const docRef = useRef<HTMLDivElement>(null);

  const generarPDFDesdeDocumento = async () => {
    if (!docRef.current) return;
    const node = docRef.current;
    const originalScroll = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = 'auto';
    try {
      const canvas = await html2canvas(node, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        windowWidth: node.scrollWidth,
        windowHeight: node.scrollHeight,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'pt', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        pdf.addPage();
        position = heightLeft - imgHeight;
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      pdf.save(`INFORME_DE_AUDITORIA_${ficha.identificacion}_${ficha.numAuto}.pdf`);
    } catch (e) {
      console.error(e);
      setToast('No se pudo generar el PDF');
    } finally {
      document.documentElement.style.scrollBehavior = originalScroll;
    }
  };

  const confirmarYAccionar = async (
    m: 'Aprobado' | 'Devolver' | 'Guardar' | 'Editar' | 'Imprimir'
  ) => {
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
          return undefined as any;
        },
        showCancelButton: true,
        confirmButtonText: 'Devolver',
        cancelButtonText: 'Cancelar',
        reverseButtons: true,
        focusCancel: true,
      });
      if (!isConfirmed) return;

      moverANivel('AUDITOR');
      setGuardadoOK(false);
      setToast(`Devolución registrada: ${String(value).trim()}`);
      await Swal.fire({ title: 'Hecho', text: 'Devolución registrada', icon: 'success', timer: 1200, showConfirmButton: false });
      return;
    }

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

    if (m === 'Aprobado') {
      if (nivel === 'AUDITOR' && !guardadoOK) {
        setToast('Primero debe GUARDAR antes de APROBAR.');
        return;
      }
      if (siguienteTrasAprobar) moverANivel(siguienteTrasAprobar);
      setToast('Aprobado');
    } else if (m === 'Editar') {
      if (nivel !== 'AUDITOR') return setToast('Solo AUDITOR puede editar.');
      if (setReadOnly) setReadOnly(false);
      setToast('Editar');
    } else if (m === 'Guardar') {
      setGuardadoOK(true);
      setToast('Guardado');
    } else if (m === 'Imprimir') {
      // Genera desde la versión “documento” (sin colores ni botones)
      await generarPDFDesdeDocumento();
      setToast('Documento generado');
    } else {
      setToast(m);
    }

    await Swal.fire({ title: 'Hecho', text: m, icon: 'success', timer: 1200, showConfirmButton: false });
  };

  const auditorPuedeImprimir = nivel === 'AUDITOR' ? guardadoOK : true;
  const auditorPuedeAprobar  = nivel === 'AUDITOR' ? guardadoOK : true;

  return (
    <Box mt={3}>
      <Grid container spacing={2}>
        {/* === UI NORMAL (con colores, ayudas, botones, etc.) === */}
        {/* Cabeceras */}
        <Grid item xs={12} md={6}>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableBody>
                <TableRow><TableCell sx={{ fontWeight: 'bold' }}>Nombre del Contribuyente</TableCell><TableCell>{ficha.nombre}</TableCell></TableRow>
                <TableRow><TableCell sx={{ fontWeight: 'bold' }}>Identificación del Contribuyente</TableCell><TableCell>{ficha.identificacion}</TableCell></TableRow>
                <TableRow><TableCell sx={{ fontWeight: 'bold' }}>Domicilio</TableCell><TableCell>{ficha.domicilio}</TableCell></TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>

        <Grid item xs={12} md={6}>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableBody>
                <TableRow><TableCell sx={{ fontWeight: 'bold' }}>Número de Auto de Apertura</TableCell><TableCell>{ficha.numAuto}</TableCell></TableRow>
                <TableRow><TableCell sx={{ fontWeight: 'bold' }}>Fecha</TableCell><TableCell>{ficha.fecha}</TableCell></TableRow>
                <TableRow><TableCell sx={{ fontWeight: 'bold' }}>Hora</TableCell><TableCell>{ficha.hora}</TableCell></TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>

        {/* 1. ANTECEDENTES */}
        <Grid item xs={12}>
          <Box sx={{ border: '1px solid #cfd8dc', borderRadius: 1 }}>
            <Box sx={{ bgcolor: '#ECEFF1', p: 1 }}>
              <Typography align="center" fontWeight={700}>1. ANTECEDENTES PARA ESTA INVESTIGACIÓN</Typography>
            </Box>
            <Grid container>
              <Grid item xs={12} md={9} p={2}>
                <Typography textAlign="justify">{ficha.antecedentes}</Typography>
              </Grid>
              <Grid item xs={12} md={3} p={2}>
                <AyudaButton titulo="Ayuda: Antecedentes" contenido="Antecedentes: Registre breve descripción (hasta 1000 caracteres)." />
              </Grid>
            </Grid>
          </Box>
        </Grid>

        {/* 2. FUNDAMENTOS DE DERECHO */}
        <Grid item xs={12}>
          <Box sx={{ border: '1px solid #cfd8dc', borderRadius: 1 }}>
            <Box sx={{ bgcolor: '#ECEFF1', p: 1 }}>
              <Typography align="center" fontWeight={700}>2. FUNDAMENTOS DE DERECHO</Typography>
            </Box>
            <Grid container>
              <Grid item xs={12} md={9} p={2}>
                <Typography textAlign="justify">{ficha.fundamentos}</Typography>
              </Grid>
              <Grid item xs={12} md={3} p={2}>
                <AyudaButton titulo="Ayuda: Fundamentos de Derecho" contenido="Liste las normas legales que fundamentan la apertura de la investigación o auditoría." />
              </Grid>
            </Grid>
          </Box>
        </Grid>

        {/* Normas relacionadas (editor de pantalla) */}
        <Grid item xs={12} mt={2}>
          <Typography variant="h6" fontWeight={700} mb={2}>Normas Relacionadas</Typography>
          <NormasRelacionadas readOnly={isLectura} />
        </Grid>

        {/* 3. OBJETO + Períodos */}
        <Grid item xs={12} mt={2}>
          <Grid item xs={12}>
            <Box sx={{ bgcolor: '#E3F2FD', p: 1 }}>
              <Typography align="center" fontWeight={700}>3. OBJETO DE LA INVESTIGACIÓN</Typography>
            </Box>
            <Box mt={2}>
              <ObjetoInvestigacion texto={investigacionObtejo?.investigacion} ayuda={investigacionObtejo?.fundamentos} />
            </Box>
          </Grid>
          <Typography variant="h6" fontWeight={700} mb={1}>Períodos Fiscales</Typography>
          <PeriodosInvestigacion readOnly={isLectura} />
        </Grid>

        {/* 4. ALCANCE + docs (editor de pantalla) */}
        <Grid item xs={12}>
          <Box sx={{ bgcolor: '#E3F2FD', p: 1 }}>
            <Typography align="center" fontWeight={700}>4. ALCANCE DE LA INVESTIGACIÓN</Typography>
          </Box>

          <Box mt={2}>
            <ObjetoInvestigacion texto={investigacionObtejoDos?.investigacionDos} ayuda={investigacionObtejoDos?.fundamentos} />
          </Box>

          <Grid container spacing={2} alignItems="center" sx={{ mt: 2 }}>
            <Grid item xs="auto">
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell sx={{ bgcolor: '#FFE5D0', fontWeight: 700 }}>DOCUMENTOS</TableCell>
                      <TableCell>
                        <TextField
                          select size="small" value={docSel}
                          onChange={(e) => setDocSel(e.target.value)}
                          sx={{ minWidth: 240 }} disabled={isLectura}
                        >
                          {DOC_OPCIONES.map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                        </TextField>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ bgcolor: '#FFE5D0', fontWeight: 700 }}>OTRO</TableCell>
                      <TableCell>
                        <TextField
                          size="small" placeholder="Especifique" value={docOtro}
                          onChange={(e) => setDocOtro(e.target.value)}
                          disabled={!(docSel === 'Otros Documentos') || isLectura}
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
                <Button variant="contained" sx={{ bgcolor: '#2E3A47', '&:hover': { bgcolor: '#26313B' }, height: '100%' }} onClick={handleAgregarDoc}>
                  AGREGAR
                </Button>
              </Grid>
            )}
          </Grid>

          <Box mt={2}>
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ bgcolor: '#FEF1C6', fontWeight: 700 }}>DOCUMENTOS</TableCell>
                    <TableCell align="center" sx={{ bgcolor: '#FEF1C6', fontWeight: 700 }}>Acción</TableCell>
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
            <Typography align="center" fontWeight={700}>5. PLAZO PARA LA INVESTIGACIÓN O AUDITORÍA</Typography>
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

        {/* Botonera inferior (NO sale en el PDF) */}
        {!isLectura && (
          <Grid item xs={12} display="flex" gap={2} justifyContent="center" mt={3} mb={1}>
            <Button variant="contained" onClick={() => confirmarYAccionar('Guardar')} title="Guardar cambios (requerido antes de Imprimir/Aprobar)">GUARDAR</Button>
            <Button variant="contained" onClick={() => confirmarYAccionar('Imprimir')} disabled={!auditorPuedeImprimir}
              title={auditorPuedeImprimir ? 'Imprimir documento' : 'Primero GUARDAR para habilitar'}>
              IMPRIMIR
            </Button>
            <Button variant="contained" onClick={() => confirmarYAccionar('Aprobado')} disabled={!auditorPuedeAprobar}
              title={auditorPuedeAprobar ? 'Aprobar y enviar a SUPERVISOR' : 'Primero GUARDAR para habilitar'}>
              APROBAR
            </Button>
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

      {/* ========= CONTENEDOR OCULTO: VERSIÓN DOCUMENTO (plana, sin controles) ========= */}
      <Box
        sx={{
          position: 'absolute',
          left: -99999,  // fuera de pantalla (no usar display:none)
          top: 0,
          width: 800,   // ayuda a que html2canvas tome layout consistente
          pointerEvents: 'none',
        }}
      >
        <DocumentoAutoApertura
          ref={docRef}
          ficha={ficha}
          investigacionObtejo={investigacionObtejo}
          investigacionObtejoDos={investigacionObtejoDos}
          docs={docs}
          isLectura
        />
      </Box>

      {/* Snackbar */}
      <Snackbar open={!!toast} autoHideDuration={2500} onClose={() => setToast('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert variant="filled" severity="info" onClose={() => setToast('')}>{toast}</Alert>
      </Snackbar>
    </Box>
  );
};
