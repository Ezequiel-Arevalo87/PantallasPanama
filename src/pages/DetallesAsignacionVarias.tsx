import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Grid,
  Typography,
  TextField,
  MenuItem,
  Button,
  Stack,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import dayjs from 'dayjs';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import CartaFiscalizacionDigital from '../components/CartaFiscalizacionDigital';

export type TipoRevisionIn =
  | 'REVISIÓN AUDITOR'
  | 'REVISIÓN SUPERVISOR'
  | 'REVISIÓN JEFE DE SECCIÓN';

type Props = { tipo: TipoRevisionIn };

type TipoCanonico = 'AUDITOR' | 'SUPERVISOR' | 'JEFE';
const normalize = (t: TipoRevisionIn): TipoCanonico => {
  const s = t.toUpperCase();
  if (s.includes('JEFE')) return 'JEFE';
  if (s.includes('SUPERVISOR')) return 'SUPERVISOR';
  return 'AUDITOR';
};

// === Ruta a la plantilla PDF (colócala en public/plantillas/) ===
const PLANTILLA_URL = '/plantillas/plantilla-acta-inicio.pdf';

export const DetallesAsignacionVarias: React.FC<Props> = ({ tipo }) => {
  const tipoN = normalize(tipo);

  const [fechaAsignacion, setFechaAsignacion] = useState('2025-07-31');
  const [fechaVencimiento, setFechaVencimiento] = useState('');
  const [supervisor, setSupervisor] = useState('');
  const [auditor, setAuditor] = useState('');
  const [fechaMemo, setFechaMemo] = useState('');
  const [periodo, setPeriodo] = useState('');
  const [ruc, setRuc] = useState('');
  const [numeroAuto, setNumeroAuto] = useState('');
  const [estado, setEstado] = useState<'PARCIAL' | 'TOTAL'>('PARCIAL');
  const [mensaje, setMensaje] = useState('');

  // Modal de “Devolver”
  const [openDevolver, setOpenDevolver] = useState(false);
  const [observacion, setObservacion] = useState('');

  useEffect(() => {
    if (!fechaAsignacion) { setFechaVencimiento(''); return; }
    setFechaVencimiento(dayjs(fechaAsignacion).add(180, 'day').format('YYYY-MM-DD'));
  }, [fechaAsignacion]);

  const diasParaVencer = useMemo(() => {
    if (!fechaAsignacion || !fechaVencimiento) return '';
    return dayjs(fechaVencimiento).diff(dayjs(fechaAsignacion), 'day');
  }, [fechaAsignacion, fechaVencimiento]);

  const notify = (t: string) => { setMensaje(t); setTimeout(() => setMensaje(''), 4000); };
  const handleVisualizar = () => notify('👁️ Abriendo Acta de Inicio de Fiscalización…');

  // =========================
  // Generar PDF desde plantilla
  // =========================
  const generarActaPDF = async () => {
    try {
      // 1) Cargar plantilla
      const resp = await fetch(PLANTILLA_URL);
      const arrayBuffer = await resp.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);

      // 2) Fuentes y página
      const page = pdfDoc.getPages()[0];
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      // 3) Helper para texto
      const draw = (text: string, x: number, y: number, opts?: { size?: number; bold?: boolean }) => {
        const size = opts?.size ?? 11;
        const usedFont = opts?.bold ? fontBold : font;
        page.drawText(text ?? '', {
          x, y,
          size,
          font: usedFont,
          color: rgb(0, 0, 0),
        });
      };

      // 4) Escribir campos
      draw(numeroAuto || '—', 72, 700, { bold: true });        // DOCUMENTO
      draw(estado,           260, 700, { bold: true });         // ESTADO
      draw(dayjs(fechaAsignacion || new Date()).format('DD/MM/YYYY'), 430, 700, { bold: true });

      draw('Señor(es)', 72, 655, { bold: true });
      draw('______________________________________', 72, 643);

      draw('Ruc', 72, 620, { bold: true });
      draw((ruc && ruc.trim()) ? ruc : '____________________________', 110, 620);

      draw('Referencia: Acta de Inicio de Fiscalización', 72, 595);

      if (auditor)   draw(`Auditor: ${auditor}`, 72, 140);
      if (supervisor) draw(`Supervisor: ${supervisor}`, 72, 125);

      // 5) Serializar y abrir/descargar
      const pdfBytes: any = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      window.open(url, '_blank', 'noopener,noreferrer');

      const a = document.createElement('a');
      a.href = url;
      a.download = `ActaInicio_${numeroAuto || 'sin-numero'}_${dayjs().format('YYYYMMDD_HHmm')}.pdf`;
      a.click();
      URL.revokeObjectURL(url);

      notify('📝 Acta generada correctamente.');
    } catch (err) {
      console.error(err);
      notify('⚠️ No se pudo generar el PDF. Revisa la ruta de la plantilla o los datos.');
    }
  };

  // Botones de acciones
  const acciones = () => {
    if (tipoN === 'AUDITOR') {
      return (
        <Stack direction="row" spacing={2} justifyContent="center">
          <Button variant="contained" onClick={generarActaPDF}>
          APROBAR
          </Button>
          
          <Button variant="outlined" color="warning" onClick={() => setOpenDevolver(true)}>
            DEVOLVER
          </Button>
        </Stack>
      );
    }
    if (tipoN === 'SUPERVISOR') {
      return (
        <Stack direction="row" spacing={2} justifyContent="center">
          <Button variant="contained" onClick={() => notify('✅ Aprobado por supervisor.')}>APROBAR</Button>
          <Button variant="outlined" color="warning" onClick={() => setOpenDevolver(true)}>DEVOLVER</Button>
        </Stack>
      );
    }
    return (
      <Stack direction="row" spacing={2} justifyContent="center">
        <Button variant="contained" onClick={() => notify('✅ Aprobado por jefe de sección.')}>APROBAR</Button>
        <Button variant="outlined" color="error" onClick={() => notify('❌ Rechazado por jefe de sección.')}>RECHAZAR</Button>
      </Stack>
    );
  };

  // Confirmar devolución (con observación)
  const confirmarDevolucion = () => {
    const txt = observacion.trim();
    if (!txt) {
      notify('⚠️ Debes ingresar la observación del motivo de la devolución.');
      return;
    }
    notify(`↩️ Devuelto con observación: "${txt}"`);
    setOpenDevolver(false);
    setObservacion('');
  };

  return (
    <Box mt={5}>
      {/* Bloques superiores */}
    
<CartaFiscalizacionDigital/>
      {/* (Se quitó el cuadro de Documento/Acción) */}

      {/* Botones inferiores */}
      <Stack direction="row" justifyContent="center" spacing={2} mt={3}>
        {acciones()}
      </Stack>

      {mensaje && (
        <Typography mt={2} align="center" color="green" fontWeight="bold">
          {mensaje}
        </Typography>
      )}

      {/* Modal para DEVOLVER (observación) */}
      <Dialog open={openDevolver} onClose={() => setOpenDevolver(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Observación de la Devolución</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Escribe el motivo u observación"
            fullWidth
            multiline
            minRows={3}
            value={observacion}
            onChange={(e) => setObservacion(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDevolver(false)}>Cancelar</Button>
          <Button variant="contained" onClick={confirmarDevolucion}>Confirmar devolución</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
