import React, { useMemo, useState } from 'react';
import {
  Box,
  Grid,
  TextField,
  Button,
  Stack,
  Typography,
  Paper,
  Divider,
} from '@mui/material';
import dayjs from 'dayjs';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

// ==== Util: formateo de fecha DD/MM/YYYY ====
const fmt = (iso: string) => (iso ? dayjs(iso).format('DD/MM/YYYY') : '');

// ==== Tabla de impuestos (puedes editar o inyectar por props si quieres) ====
const IMPUESTOS = [
  { impuesto: '102', periodo: '2021 a 2023', declaracion: 'RENTA JURÍDICA' },
  { impuesto: '105', periodo: '2008 a 2023', declaracion: 'RET-REMESAS' },
  { impuesto: '110', periodo: '2008 a 2023', declaracion: 'RET-DIVIDENDOS' },
  { impuesto: '111', periodo: '2021 a 2023', declaracion: 'COMPLEMENTARIO' },
  { impuesto: '140', periodo: '2021 a 2023', declaracion: 'AVISO DE OPERACIÓN' },
  { impuesto: '202', periodo: '2020 a 2024', declaracion: 'ITBMS' },
];

// ==== Helper: dibujar párrafos con ajuste de línea por ancho ====
function drawParagraph(opts: {
  page: any;
  text: string;
  x: number;
  y: number;
  width: number;
  font: any;
  size: number;
  lineHeight?: number;
  color?: { r: number; g: number; b: number };
}) {
  const {
    page, text, x, y, width, font, size, lineHeight = 1.35,
    color = { r: 0, g: 0, b: 0 },
  } = opts;

  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';

  const maxWidth = width;

  for (const w of words) {
    const withWord = current ? current + ' ' + w : w;
    const currentWidth = font.widthOfTextAtSize(withWord, size);
    if (currentWidth <= maxWidth) {
      current = withWord;
    } else {
      if (current) lines.push(current);
      current = w;
    }
  }
  if (current) lines.push(current);

  let cursorY = y;
  for (const line of lines) {
    page.drawText(line, {
      x,
      y: cursorY,
      size,
      font,
      color: rgb(color.r, color.g, color.b),
    });
    cursorY -= size * lineHeight;
  }
  return cursorY;
}

// ==== Helper: convertir Uint8Array a Blob seguro ====
function uint8ToBlob(u8: Uint8Array, mime = 'application/pdf') {
  const ab: any = u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength);
  return new Blob([ab], { type: mime });
}

export default function CartaFiscalizacionDigital() {
  // ===== Campos editables =====
  const [fecha, setFecha] = useState<string>(dayjs().format('YYYY-MM-DD'));
  const [senores, setSenores] = useState<string>('XXXXXXXXXXXXXXXXX');
  const [ruc, setRuc] = useState<string>('XXXXXXXXXXXXXX');
  const [correoAuditor, setCorreoAuditor] = useState<string>('XXXXXXXXXXXXXX');
  const [telefonoVerificacion, setTelefonoVerificacion] = useState<string>('XXXXXXXX');
  const [correoConsultas, setCorreoConsultas] = useState<string>('XXXXXXXXXXX');

  // ===== Textos =====
  const cuerpo1 = useMemo(
    () =>
      'La Dirección General de Ingresos, está ejecutando un Procedimiento de Fiscalización Digital de Omisos e Inexactos, para la detección de contribuyentes que presentan omisión en las declaraciones juradas; sin embargo, señalamos que en cruce de información a terceros obligados se evidencia que tiene operaciones reportadas, por lo que se le informa que debe ingresar a la plataforma eTax 2.0 con su RUC Y NIT, seleccionar en la barra de herramientas el menú -  CONSULTAS, la opción- CONSULTA PANTALLA COMUNICACIÓN FISCALIZACIÓN DIGITAL. Allí encontrará el documento de Auto de Apertura donde podrá ver, en la Sección de Cruce Pre elaborado, la cantidad reportada. También podrá encontrar los trámites pendientes que le está solicitando la Administración Tributaria, debido a que se ha detectado algunas omisiones en su (s) declaración (es) que ameritan aclaración de su parte, a continuación, se relaciona:',
    []
  );

  const opcion1 = useMemo(
    () =>
      `1. Presentar voluntariamente la declaración

Nota: Deberá presentar un borrador de la declaración jurada de renta al auditor fiscal encargado del caso, al correo ${correoAuditor}, para validar la información de los ingresos y gastos reportados, una vez verificado se le autorizara para que presente en el sistema eTax 2.0, su declaración jurada en un término máximo de 5 días hábiles.`,
    [correoAuditor]
  );

  const opcion2 = useMemo(
    () =>
      `2. Solicitar una audiencia ante la Administración Tributaria

Nota: Podrá realizar sus descargos y explicar los motivos del incumplimiento de sus obligaciones tributarias. Previa cita, el representante legal deberá apersonarse, si se trata de persona jurídica a la Dirección de Fiscalización Tributaria, a la Sección de Control Extensivo, ubicada en Avenida Balboa y Calle 41 Bellavista, PH Torre Mundial, Piso No. 1, en un horario de atención de 8:30 a.m. a 3:30 p.m. En caso de enviar a otra persona, esta deberá estar autorizada mediante poder notariado y presentar copia de ambas cédulas. Tiene un plazo máximo de 5 días hábiles.`,
    []
  );

  const cierre = useMemo(
    () =>
      `Lo invitamos a que cumpla con sus declaraciones y así formalizar sus obligaciones fiscales.

Si desea verificar la legitimidad de la presente comunicación puede llamar al teléfono ${telefonoVerificacion}. En caso de consulta en base a su caso diríjala a la dirección electrónica: ${correoConsultas}.

La presente está fundamentada en las facultades fiscalizadoras que le otorga a la Administración Tributaria el Decreto de Gabinete 109 de 1970 y las disposiciones del Código Fiscal.

Atentamente,



Camilo A. Valdés M.
Director General
Dirección General de Ingresos`,
    [telefonoVerificacion, correoConsultas]
  );

  // ===== Generación del PDF =====
  const generarPDF = async (forzarDescarga = false) => {
    const pdf = await PDFDocument.create();
    const page = pdf.addPage([595.28, 841.89]); // A4
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const fontB = await pdf.embedFont(StandardFonts.HelveticaBold);

    const margin = 56;
    const contentWidth = page.getWidth() - margin * 2;
    let y = page.getHeight() - margin;

    // Encabezado
    page.drawText(`Panamá, ${fmt(fecha)}`, { x: margin, y, size: 11, font });
    y -= 24;

    page.drawText('Señor(es)', { x: margin, y, size: 12, font: fontB });
    y -= 14;
    y = drawParagraph({
      page,
      text: senores,
      x: margin,
      y,
      width: contentWidth,
      font,
      size: 11,
    }) - 8;

    page.drawText(`Ruc ${ruc}`, { x: margin, y, size: 11, font });
    y -= 14;
    page.drawText('Presente', { x: margin, y, size: 11, font });
    y -= 22;

    page.drawText('Estimado señor(a):', { x: margin, y, size: 11, font: fontB });
    y -= 16;

    // Cuerpo 1
    y = drawParagraph({
      page,
      text: cuerpo1,
      x: margin,
      y,
      width: contentWidth,
      font,
      size: 11,
    }) - 14;

    // Tabla de impuestos
    page.drawText('Impuesto   Periodo fiscal   Declaración', {
      x: margin,
      y,
      size: 11,
      font: fontB,
    });
    y -= 16;

    const col1 = margin;
    const col2 = margin + 110;
    const col3 = margin + 250;

    for (const row of IMPUESTOS) {
      page.drawText(row.impuesto, { x: col1, y, size: 11, font });
      page.drawText(row.periodo, { x: col2, y, size: 11, font });
      page.drawText(row.declaracion, { x: col3, y, size: 11, font });
      y -= 14;
    }
    y -= 12;

    // Opciones 1 y 2
    y = drawParagraph({
      page,
      text: opcion1,
      x: margin,
      y,
      width: contentWidth,
      font,
      size: 11,
    }) - 12;

    y = drawParagraph({
      page,
      text: opcion2,
      x: margin,
      y,
      width: contentWidth,
      font,
      size: 11,
    }) - 12;

    // Cierre
    drawParagraph({
      page,
      text: cierre,
      x: margin,
      y,
      width: contentWidth,
      font,
      size: 11,
    });

    const bytes = await pdf.save();
    const blob = uint8ToBlob(bytes);

    const url = URL.createObjectURL(blob);
    window.open(url, '_blank', 'noopener,noreferrer');

    if (forzarDescarga) {
      const a = document.createElement('a');
      a.href = url;
      a.download = `Acta_de_inicio_${dayjs().format('YYYYMMDD_HHmm')}.pdf`;
      a.click();
    }
  };

  // ===== Vista previa HTML (hoja A4) =====
  const Preview = () => (
    <Paper
      variant="outlined"
      sx={{
        mx: 'auto',
        p: 4,
        width: '100%',
        maxWidth: 820, // contenedor
        bgcolor: 'background.paper',
      }}
    >
      <Box
        sx={{
          width: '100%',
          mx: 'auto',
          border: (t) => `1px solid ${t.palette.divider}`,
          boxShadow: (t) => t.shadows[0],
          bgcolor: 'white',
        }}
      >
        <Box
          sx={{
            // proporción A4 ~ 595x842pt -> 1:1.414
            p: 4,
            minHeight: 920,
            // tipografía "documento"
            '& p': { mb: 2, lineHeight: 1.6, fontSize: 14 },
          }}
        >
          <Typography sx={{ fontSize: 14, mb: 3 }}>
            Panamá, {fmt(fecha)}
          </Typography>

          <Typography sx={{ fontWeight: 700, fontSize: 15, mb: 1 }}>
            Señor(es)
          </Typography>
          <Typography sx={{ whiteSpace: 'pre-line', fontSize: 14 }}>
            {senores}
          </Typography>
          <Typography sx={{ fontSize: 14, mt: 1 }}>Ruc {ruc}</Typography>
          <Typography sx={{ fontSize: 14, mb: 3 }}>Presente</Typography>

          <Typography sx={{ fontWeight: 700, fontSize: 14, mb: 1 }}>
            Estimado señor(a):
          </Typography>

          <Typography sx={{ whiteSpace: 'pre-line' }}>{cuerpo1}</Typography>

          <Box sx={{ mt: 2, mb: 2 }}>
            <Typography sx={{ fontWeight: 700, fontSize: 14, mb: 1 }}>
              Impuesto &nbsp;&nbsp;Periodo fiscal&nbsp;&nbsp;Declaración
            </Typography>
            {IMPUESTOS.map((row) => (
              <Box
                key={`${row.impuesto}-${row.declaracion}`}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '120px 160px 1fr',
                  gap: 1,
                  fontSize: 14,
                  py: 0.3,
                }}
              >
                <span>{row.impuesto}</span>
                <span>{row.periodo}</span>
                <span>{row.declaracion}</span>
              </Box>
            ))}
          </Box>

          <Typography sx={{ whiteSpace: 'pre-line' }}>{opcion1}</Typography>
          <Typography sx={{ whiteSpace: 'pre-line', mt: 1 }}>{opcion2}</Typography>

          <Typography sx={{ whiteSpace: 'pre-line', mt: 2 }}>{cierre}</Typography>
        </Box>
      </Box>
    </Paper>
  );

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Acta de inicio (editable)
      </Typography>

      <Grid container spacing={3}>
        {/* Columna Izquierda: Form */}
        <Grid item xs={12} md={5}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Fecha"
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="RUC"
                  value={ruc}
                  onChange={(e) => setRuc(e.target.value)}
                  fullWidth
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Señor(es)"
                  value={senores}
                  onChange={(e) => setSenores(e.target.value)}
                  fullWidth
                  multiline
                />
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Correo del auditor fiscal"
                  value={correoAuditor}
                  onChange={(e) => setCorreoAuditor(e.target.value)}
                  fullWidth
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Teléfono verificación"
                  value={telefonoVerificacion}
                  onChange={(e) => setTelefonoVerificacion(e.target.value)}
                  fullWidth
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Correo para consultas"
                  value={correoConsultas}
                  onChange={(e) => setCorreoConsultas(e.target.value)}
                  fullWidth
                />
              </Grid>
            </Grid>

            <Stack direction="row" spacing={2} mt={3}>
              <Button variant="contained" onClick={() => generarPDF(false)}>
                Previsualizar PDF
              </Button>
              <Button variant="outlined" onClick={() => generarPDF(true)}>
                Descargar PDF
              </Button>
            </Stack>

            <Box mt={2}>
              <Typography variant="caption" color="text.secondary">
                El PDF se genera en tamaño A4 con márgenes, párrafos con ajuste
                de línea y la tabla de impuestos incluida.
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Columna Derecha: Vista previa del documento */}
        <Grid item xs={12} md={7}>
          <Preview />
        </Grid>
      </Grid>
    </Box>
  );
}
