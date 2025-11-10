import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Grid,
  Typography,
  TextField,
  MenuItem,
  Button,
  Stack,
  IconButton
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import dayjs from 'dayjs';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

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
  const [estado, setEstado] = useState<'PARCIAL' | 'TOTAL'>('PARCIAL'); // por si quieres variarlo
  const [mensaje, setMensaje] = useState('');

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

      // =========================================
      // 4) Escribir campos dinámicos en la plantilla
      // Nota: coordenadas aproximadas (en puntos PDF).
      //       Si necesitas ajustar, mueve x/y levemente.
      //       El (0,0) está abajo-izquierda.
      // =========================================

      // Encabezado tabla: DOCUMENTO / ESTADO / FECHA
      // (Coordenadas aproximadas para un A4)
      draw(numeroAuto || '—', 72, 700, { bold: true });        // DOCUMENTO
      draw(estado,           260, 700, { bold: true });         // ESTADO
      draw(
        dayjs(fechaAsignacion || new Date()).format('DD/MM/YYYY'),
        430, 700, { bold: true }
      ); // FECHA

      // Señor(es)
      draw('Señor(es)', 72, 655, { bold: true });
      draw('______________________________________', 72, 643);
      // Si tienes el nombre, puedes sustituir aquí:
      // draw(nombreContribuyente, 72, 643);

      // RUC
      draw('Ruc', 72, 620, { bold: true });
      draw((ruc && ruc.trim()) ? ruc : '____________________________', 110, 620);

      // Frase/Referencia (puedes personalizarla)
      draw('Referencia: Acta de Inicio de Fiscalización', 72, 595);

      // Firma/autoridad (parte inferior aprox.)
      if (auditor) {
        draw(`Auditor: ${auditor}`, 72, 140);
      }
      if (supervisor) {
        draw(`Supervisor: ${supervisor}`, 72, 125);
      }

      // 5) Serializar y abrir/descargar
      const pdfBytes:any = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      // Abrir en nueva pestaña
      window.open(url, '_blank', 'noopener,noreferrer');

      // Forzar descarga
      const a = document.createElement('a');
      a.href = url;
      const nombreArchivo = `ActaInicio_${numeroAuto || 'sin-numero'}_${dayjs().format('YYYYMMDD_HHmm')}.pdf`;
      a.download = nombreArchivo;
      a.click();
      URL.revokeObjectURL(url);

      notify('📝 Acta generada correctamente.');
    } catch (err) {
      console.error(err);
      notify('⚠️ No se pudo generar el PDF. Revisa la ruta de la plantilla o los datos.');
    }
  };

  const acciones = () => {
    if (tipoN === 'AUDITOR') {
      return (
        <Stack direction="row" spacing={2} justifyContent="center">
          <Button variant="contained" onClick={generarActaPDF}>
            GENERAR ACTA DE INICIO FISCALIZACIÓN
          </Button>
          <Button variant="outlined" onClick={() => notify('✅ La asignación ha sido registrada correctamente.')}>
            CONTINUAR
          </Button>
        </Stack>
      );
    }
    if (tipoN === 'SUPERVISOR') {
      return (
        <Stack direction="row" spacing={2} justifyContent="center">
          <Button variant="contained" onClick={() => notify('✅ Aprobado por supervisor.')}>APROBAR</Button>
          <Button variant="outlined" onClick={() => notify('↩️ Devuelto para ajustes.')}>DEVOLVER</Button>
        </Stack>
      );
    }
    return (
      <Stack direction="row" spacing={2} justifyContent="center">
        <Button variant="contained" onClick={() => notify('✅ Aprobado por jefe de sección.')}>APROBAR</Button>
        <Button variant="outlined" onClick={() => notify('❌ Rechazado por jefe de sección.')}>RECHAZAR</Button>
      </Stack>
    );
  };

  return (
    <Box mt={5}>
      <Typography align="center" color="red" fontWeight="bold" mb={2}>ASIGNACIÓN</Typography>

      {/* Bloques superiores */}
      <Grid container spacing={2} justifyContent="center">
        {/* Fechas + RUC + Número de Auto (izquierda) */}
        <Grid item xs={12} md={4}>
          <Grid container border={1}>
            <Grid item xs={6} p={1} bgcolor="#d8e3f0"><strong>Fecha de Asignación</strong></Grid>
            <Grid item xs={6} p={1}>
              <TextField
                type="date" fullWidth value={fechaAsignacion}
                onChange={(e) => setFechaAsignacion(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={6} p={1} bgcolor="#f7d9c4"><strong>Fecha del Vencimiento</strong></Grid>
            <Grid item xs={6} p={1}>
              <TextField
                type="date" fullWidth value={fechaVencimiento}
                InputProps={{ readOnly: true }}
                helperText="Se calcula automáticamente (+180 días)"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={6} p={1} bgcolor="#f7d9c4"><strong>Días para el vencimiento</strong></Grid>
            <Grid item xs={6} p={1} sx={{ color: 'red', fontWeight: 'bold' }}>
              {diasParaVencer || '-'}
            </Grid>

            <Grid item xs={6} p={1} bgcolor="#f7d9c4"><strong>RUC</strong></Grid>
            <Grid item xs={6} p={1}>
              <TextField fullWidth value={ruc} onChange={(e) => setRuc(e.target.value)} />
            </Grid>

            <Grid item xs={6} p={1} bgcolor="#f7d9c4"><strong>Número de Auto de Apertura</strong></Grid>
            <Grid item xs={6} p={1}>
              <TextField fullWidth value={numeroAuto} onChange={(e) => setNumeroAuto(e.target.value)} />
            </Grid>

            <Grid item xs={6} p={1} bgcolor="#f7d9c4"><strong>Estado</strong></Grid>
            <Grid item xs={6} p={1}>
              <TextField fullWidth select value={estado} onChange={(e) => setEstado(e.target.value as any)}>
                <MenuItem value="PARCIAL">PARCIAL</MenuItem>
                <MenuItem value="TOTAL">TOTAL</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </Grid>

        {/* Datos (derecha) */}
        <Grid item xs={12} md={6}>
          <Grid container border={1}>
            <Grid item xs={6} p={1} bgcolor="#fce7da">Jefe</Grid>
            <Grid item xs={6} p={1}>
              <TextField fullWidth value="Jefe de Secciones" InputProps={{ readOnly: true }} />
            </Grid>

            <Grid item xs={6} p={1} bgcolor="#fce7da">Supervisor</Grid>
            <Grid item xs={6} p={1}>
              <TextField fullWidth select value={supervisor} onChange={(e) => setSupervisor(e.target.value)}>
                {['Supervisor 1', 'Supervisor 2', 'Supervisor 3'].map(s => (
                  <MenuItem key={s} value={s}>{s}</MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={6} p={1} bgcolor="#fce7da">Auditor</Grid>
            <Grid item xs={6} p={1}>
              <TextField fullWidth select value={auditor} onChange={(e) => setAuditor(e.target.value)}>
                {['Auditor 1', 'Auditor 2', 'Auditor 3'].map(a => (
                  <MenuItem key={a} value={a}>{a}</MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={6} p={1} bgcolor="#fce7da">Fecha de Memo Recibido</Grid>
            <Grid item xs={6} p={1}>
              <TextField
                type="date" fullWidth value={fechaMemo}
                onChange={(e) => setFechaMemo(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={6} p={1} bgcolor="#fce7da">Período</Grid>
            <Grid item xs={6} p={1}>
              <TextField
                type="month" fullWidth label="Período" value={periodo}
                onChange={(e) => setPeriodo(e.target.value)} InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {/* Tabla Documento (SUPERVISOR y JEFE) */}
      {(tipoN === 'SUPERVISOR' || tipoN === 'JEFE') && (
        <Box mt={4}>
          <Grid container border={1}>
            <Grid item xs={8} p={1} sx={{ bgcolor: '#e6f2e6', fontWeight: 700, textAlign: 'center', borderRight: '1px solid #ddd' }}>
              Documento
            </Grid>
            <Grid item xs={4} p={1} sx={{ bgcolor: '#e6f2e6', fontWeight: 700, textAlign: 'center' }}>
              Acción
            </Grid>

            <Grid item xs={8} p={3} sx={{ borderTop: '1px solid #ddd', borderRight: '1px solid #ddd', textAlign: 'center' }}>
              Acta de Inicio de Fiscalización
            </Grid>
            <Grid item xs={4} p={2} sx={{ borderTop: '1px solid #ddd' }}>
              <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
                <IconButton aria-label="ver" onClick={handleVisualizar}>
                  <VisibilityIcon />
                </IconButton>
              </Stack>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Botones inferiores */}
      <Stack direction="row" justifyContent="center" spacing={2} mt={3}>
        {acciones()}
      </Stack>

      {mensaje && (
        <Typography mt={2} align="center" color="green" fontWeight="bold">
          {mensaje}
        </Typography>
      )}
    </Box>
  );
};
