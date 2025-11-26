// =======================================================
// src/pages/ActaInicio.tsx  (VERSIÓN COMPLETA Y FUNCIONAL)
// =======================================================

import React, { useState } from "react";
import {
  Box,
  Grid,
  TextField,
  MenuItem,
  Button,
  Stack,
  Paper,
  Typography,
  Dialog,
  DialogActions,
  DialogTitle,
  DialogContent,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  Tooltip,
  Divider,
} from "@mui/material";

import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import EditIcon from "@mui/icons-material/Edit";

import dayjs from "dayjs";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

import { CASOS_KEY } from "../lib/aprobacionesStorage";


// =======================================================
// 🔷 PLANTILLA DEL DOCUMENTO (extraída del Word)
// =======================================================

export const ACTA_PLANTILLA = {
  encabezado: (fecha: string) => `Panamá, ${fecha}`,

  saludo: (senores: string, ruc: string) => `
Señor(es)
${senores}
RUC: ${ruc}
Presente
`,

  cuerpo1: `
La Dirección General de Ingresos, está ejecutando un Procedimiento de Fiscalización Digital de Omisos e Inexactos,
para la detección de contribuyentes que presentan omisión en las declaraciones juradas; sin embargo, señalamos que 
en cruce de información a terceros obligados se evidencia que tiene operaciones reportadas, por lo que se le informa 
que debe ingresar a la plataforma eTax 2.0 con su RUC y NIT, seleccionar en la barra de herramientas el menú 
CONSULTAS, opción CONSULTA PANTALLA COMUNICACIÓN FISCALIZACIÓN DIGITAL.

Allí encontrará el documento de Auto de Apertura donde podrá ver, en la Sección de Cruce Pre elaborado, la cantidad
reportada. También podrá encontrar los trámites pendientes que le está solicitando la Administración Tributaria,
debido a que se ha detectado algunas omisiones en su(s) declaración(es) que ameritan aclaración de su parte, a
continuación, se relaciona:
`,

  impuestos: [
    { impuesto: "102", periodo: "2021 a 2023", declaracion: "RENTA JURÍDICA" },
    { impuesto: "105", periodo: "2008 a 2023", declaracion: "RET-REMESAS" },
    { impuesto: "110", periodo: "2008 a 2023", declaracion: "RET-DIVIDENDOS" },
    { impuesto: "111", periodo: "2021 a 2023", declaracion: "COMPLEMENTARIO" },
    { impuesto: "140", periodo: "2021 a 2023", declaracion: "AVISO DE OPERACIÓN" },
    { impuesto: "202", periodo: "2020 a 2024", declaracion: "ITBMS" },
  ],

  opcionesTitulo: `
Por las razones arriba detalladas usted cuenta con 2 opciones a elegir
(esta elección deberá realizarla en la pantalla CONSULTA PANTALLA COMUNICACIÓN FISCALIZACIÓN DIGITAL,
botón EJECUTAR ACCIÓN):
`,

  opcion1: (correoAuditor: string) => `
1. Presentar voluntariamente la declaración.

Nota: Deberá presentar un borrador de la declaración jurada de renta al auditor fiscal encargado del caso,
al correo ${correoAuditor}, para validar la información de los ingresos y gastos reportados. Una vez verificado
se le autorizará para que presente en el sistema eTax 2.0 su declaración jurada en un término máximo de
5 días hábiles.
`,

  opcion2: `
2. Solicitar una audiencia ante la Administración Tributaria.

Nota: Podrá realizar sus descargos y explicar los motivos del incumplimiento de sus obligaciones tributarias.
Previa cita, el representante legal deberá apersonarse (si se trata de persona jurídica) a la Dirección de
Fiscalización Tributaria, Sección Control Extensivo, ubicada en Avenida Balboa y Calle 41 Bellavista,
PH Torre Mundial, Piso N.º 1, en horario de 8:30 a.m. a 3:30 p.m.

En caso de enviar a otra persona, esta deberá estar autorizada mediante poder notariado y presentar copia
de ambas cédulas. Tiene un plazo máximo de 5 días hábiles.
`,

  cierre: (telefono: string, correoConsultas: string) => `
Lo invitamos a que cumpla con sus declaraciones y así formalizar sus obligaciones fiscales.

Si desea verificar la legitimidad de la presente comunicación puede llamar al teléfono ${telefono}.
En caso de consulta en base a su caso diríjala a la dirección electrónica: ${correoConsultas}.

La presente está fundamentada en las facultades fiscalizadoras que le otorga a la Administración Tributaria
el Decreto de Gabinete 109 de 1970 y las disposiciones del Código Fiscal.
`,

  firma: `
Atentamente,


Camilo A. Valdés M.
Director General
Dirección General de Ingresos
`,
};


// =======================================================
// 🔧 Normalizador
// =======================================================
const normalizeCaso = (c: any) => ({
  id: c.id,
  ruc: c.ruc,
  nombre: c.nombre,
  categoria: c.metaCategoria || c.categoria,
  inconsistencia: c.metaInconsistencia,
  programa: c.metaPrograma,
  periodoInicial: c.metaPeriodoInicial,
  periodoFinal: c.metaPeriodoFinal,
  provincia: c.provincia,
  valor: c.valorNum || c.valor,
  auditorAsignado: c.auditorAsignado,
  fechaAsignacion: c.fechaAsignacion,
  numeroAutoApertura: c.numeroAutoApertura,
  red: c.red,
  estadoVerif: c.estadoVerif,
});


// =======================================================
// 🧩 MODAL DETALLE
// =======================================================
function ModalDetalle({ caso, open, onClose }: any) {
  if (!caso) return null;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Detalle del Caso</DialogTitle>

      <DialogContent dividers>
        <Typography><b>Nombre:</b> {caso.nombre}</Typography>
        <Typography><b>RUC:</b> {caso.ruc}</Typography>
        <Typography><b>Categoría:</b> {caso.categoria}</Typography>
        <Typography><b>Auditor:</b> {caso.auditorAsignado}</Typography>
        <Typography><b>Auto Nº:</b> {caso.numeroAutoApertura}</Typography>
        <Typography><b>Provincia:</b> {caso.provincia}</Typography>
        <Typography><b>Valor:</b> B/. {caso.valor}</Typography>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
}


// =======================================================
// ✏️ MODAL EDITOR DE ACTA
// =======================================================
function EditorActa({ caso, open, onClose }: any) {
  if (!caso) return null;

  const [form, setForm] = useState({
    fecha: caso.fechaAsignacion || dayjs().format("YYYY-MM-DD"),
    senores: caso.nombre,
    ruc: caso.ruc,
    correoAuditor: "",
    telVerificacion: "",
    correoConsultas: "",
  });

  const update = (e: any) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));


  // ----------- GENERAR PDF -----------
 async function generarPDF() {
  const pdf = await PDFDocument.create();
  
  // A4 dimensions
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 56;
  const contentWidth = pageWidth - margin * 2;

  const page = pdf.addPage([pageWidth, pageHeight]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontB = await pdf.embedFont(StandardFonts.HelveticaBold);

  let y = pageHeight - margin;


  // ----------------------------------
  // 🔧 función para escribir párrafos
  // ----------------------------------
  const drawParagraph = (text: string, size = 11, bold = false, spacing = 12) => {
    const f = bold ? fontB : font;
    const words = text.replace(/\r/g, "").split(/\s+/);
    let line = "";

    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + " ";
      const testWidth = f.widthOfTextAtSize(testLine, size);

      if (testWidth > contentWidth) {
        page.drawText(line, {
          x: margin,
          y,
          size,
          font: f,
          color: rgb(0, 0, 0),
        });
        y -= spacing;
        line = words[i] + " ";
      } else {
        line = testLine;
      }
    }

    // última línea
    if (line.trim().length > 0) {
      page.drawText(line, { x: margin, y, size, font: f });
      y -= spacing;
    }
  };


  // ----------------------------------
  // 🔥 Comenzamos a dibujar el contenido
  // ----------------------------------

  // FECHA
  drawParagraph(`Panamá, ${dayjs(form.fecha).format("DD/MM/YYYY")}`, 11);

  y -= 10;

  // SALUDO
  drawParagraph("Señor(es)", 12, true);
  drawParagraph(form.senores, 11);
  drawParagraph(`RUC: ${form.ruc}`);
  drawParagraph("Presente");
  
  y -= 10;

  // CUERPO 1
  drawParagraph(ACTA_PLANTILLA.cuerpo1);

  y -= 10;

  // TABLA DE IMPUESTOS
  drawParagraph("Impuesto   Periodo fiscal   Declaración", 11, true);

  ACTA_PLANTILLA.impuestos.forEach((row) => {
    drawParagraph(`${row.impuesto}   ${row.periodo}   ${row.declaracion}`);
  });

  y -= 10;

  // OPCIONES
  drawParagraph(ACTA_PLANTILLA.opcionesTitulo);

  drawParagraph(ACTA_PLANTILLA.opcion1(form.correoAuditor));
  drawParagraph(ACTA_PLANTILLA.opcion2);

  y -= 10;

  // CIERRE
  drawParagraph(
    ACTA_PLANTILLA.cierre(form.telVerificacion, form.correoConsultas)
  );

  y -= 20;

  // FIRMA
  drawParagraph(ACTA_PLANTILLA.firma, 11);


  // exportar
  const bytes:any = await pdf.save();
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
}



  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle>Editar Acta de Inicio</DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={3}>
          
          {/* Formulario */}
          <Grid item xs={12} md={5}>
            <Paper sx={{ p: 2 }} variant="outlined">

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    label="Fecha"
                    type="date"
                    name="fecha"
                    value={form.fecha}
                    onChange={update}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    label="Señor(es)"
                    name="senores"
                    value={form.senores}
                    onChange={update}
                    fullWidth
                    multiline
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    label="RUC"
                    name="ruc"
                    value={form.ruc}
                    onChange={update}
                    fullWidth
                  />
                </Grid>

                <Divider sx={{ my: 2, width: "100%" }} />

                <Grid item xs={12}>
                  <TextField
                    label="Correo Auditor"
                    name="correoAuditor"
                    value={form.correoAuditor}
                    onChange={update}
                    fullWidth
                  />
                </Grid>

                <Grid item xs={6}>
                  <TextField
                    label="Teléfono Verificación"
                    name="telVerificacion"
                    value={form.telVerificacion}
                    onChange={update}
                    fullWidth
                  />
                </Grid>

                <Grid item xs={6}>
                  <TextField
                    label="Correo Consultas"
                    name="correoConsultas"
                    value={form.correoConsultas}
                    onChange={update}
                    fullWidth
                  />
                </Grid>
              </Grid>

              <Stack direction="row" spacing={2} mt={3}>
                <Button variant="contained" onClick={generarPDF}>
                  Generar PDF
                </Button>

                <Button onClick={onClose}>Cerrar</Button>
              </Stack>

            </Paper>
          </Grid>


          {/* Vista previa */}
          <Grid item xs={12} md={7}>
            <Paper sx={{ p: 3, minHeight: 900 }} variant="outlined">
              <Typography>{ACTA_PLANTILLA.encabezado(
                dayjs(form.fecha).format("DD/MM/YYYY")
              )}</Typography>

              <Typography whiteSpace="pre-line" mt={2}>
                {ACTA_PLANTILLA.saludo(form.senores, form.ruc)}
              </Typography>

              <Typography whiteSpace="pre-line" mt={2}>
                {ACTA_PLANTILLA.cuerpo1}
              </Typography>

              <Typography mt={2} fontWeight={700}>
                Impuesto — Periodo — Declaración
              </Typography>

              {ACTA_PLANTILLA.impuestos.map((i) => (
                <Typography key={i.impuesto}>
                  {i.impuesto} — {i.periodo} — {i.declaracion}
                </Typography>
              ))}

              <Typography whiteSpace="pre-line" mt={2}>
                {ACTA_PLANTILLA.opcionesTitulo}
              </Typography>

              <Typography whiteSpace="pre-line" mt={2}>
                {ACTA_PLANTILLA.opcion1(form.correoAuditor)}
              </Typography>

              <Typography whiteSpace="pre-line" mt={2}>
                {ACTA_PLANTILLA.opcion2}
              </Typography>

              <Typography whiteSpace="pre-line" mt={2}>
                {ACTA_PLANTILLA.cierre(
                  form.telVerificacion,
                  form.correoConsultas
                )}
              </Typography>

              <Typography whiteSpace="pre-line" mt={4}>
                {ACTA_PLANTILLA.firma}
              </Typography>
            </Paper>
          </Grid>

        </Grid>
      </DialogContent>
    </Dialog>
  );
}


// =======================================================
// 🧿 PÁGINA PRINCIPAL: ACTA INICIO
// =======================================================
export default function ActaInicio() {
  const [form, setForm] = useState({
    ruc: "",
    red: "659",
    categoria: "Todos",
  });

  const [casos, setCasos] = useState<any[]>([]);
  const [mostrar, setMostrar] = useState(false);

  const [detalle, setDetalle] = useState(null);
  const [editor, setEditor] = useState(null);


  const update = (e: any) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));


  // ---------------- CONSULTAR ----------------
  const consultar = () => {
    const raw = localStorage.getItem(CASOS_KEY);
    const arr = raw ? JSON.parse(raw) : [];

    let filtrados = arr
      .filter((r: any) => r.estadoVerif === "Asignado")
      .map((c: any) => normalizeCaso(c));

    if (form.categoria !== "Todos") {
      filtrados = filtrados.filter((c:any) => c.categoria === form.categoria);
    }

    if (form.red) {
      filtrados = filtrados.filter((c:any) => c.red === form.red);
    }

    if (form.ruc.trim() !== "") {
      filtrados = filtrados.filter((c:any) =>
        c.ruc.includes(form.ruc.trim())
      );
    }

    setCasos(filtrados);
    setMostrar(true);
  };


  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>
        Acta de Inicio – Casos Asignados
      </Typography>

      {/* FILTROS */}
      <Paper sx={{ p: 3, mb: 3 }} variant="outlined">
        <Grid container spacing={2}>

          <Grid item xs={12} sm={4}>
            <TextField
              label="RUC"
              name="ruc"
              fullWidth
              value={form.ruc}
              onChange={update}
            />
          </Grid>

          <Grid item xs={12} sm={3}>
            <TextField
              label="Red"
              select
              name="red"
              fullWidth
              value={form.red}
              onChange={update}
            >
              <MenuItem value="659">659</MenuItem>
              <MenuItem value="675">675</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} sm={5}>
            <TextField
              label="Categoría"
              select
              name="categoria"
              fullWidth
              value={form.categoria}
              onChange={update}
            >
              {[
                "Todos",
                "Fiscalización Masiva",
                "Grandes Contribuyentes",
                "Auditoría Sectorial",
              ].map((c) => (
                <MenuItem key={c} value={c}>{c}</MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12}>
            <Stack direction="row" justifyContent="flex-end" spacing={2}>
              <Button variant="contained" onClick={consultar}>
                Consultar
              </Button>
              <Button
                variant="outlined"
                onClick={() => {
                  setForm({ ruc: "", red: "659", categoria: "Todos" });
                  setMostrar(false);
                }}
              >
                Limpiar
              </Button>
            </Stack>
          </Grid>

        </Grid>
      </Paper>


      {/* TABLA DE RESULTADOS */}
      {mostrar && (
        <Paper sx={{ p: 2 }} variant="outlined">
          <Typography fontWeight={700} sx={{ mb: 2 }}>
            Resultados ({casos.length})
          </Typography>

          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>RUC</TableCell>
                <TableCell>Nombre</TableCell>
                <TableCell>Auto Nº</TableCell>
                <TableCell>Categoría</TableCell>
                <TableCell>Auditor</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {casos.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>{c.ruc}</TableCell>
                  <TableCell>{c.nombre}</TableCell>
                  <TableCell>{c.numeroAutoApertura}</TableCell>
                  <TableCell>{c.categoria}</TableCell>
                  <TableCell>{c.auditorAsignado}</TableCell>

                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">

                      <Tooltip title="Detalle">
                        <IconButton size="small" onClick={() => setDetalle(c)}>
                          <InfoOutlinedIcon />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Editar Acta">
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => setEditor(c)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>

                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>

          </Table>
        </Paper>
      )}

      {/* MODAL DETALLE */}
      <ModalDetalle
        caso={detalle}
        open={!!detalle}
        onClose={() => setDetalle(null)}
      />

      {/* MODAL EDITOR */}
      <EditorActa
        caso={editor}
        open={!!editor}
        onClose={() => setEditor(null)}
      />

    </Box>
  );
}
export type CasoActa = {
  id: number | string;
  ruc: string;
  nombre: string;
  categoria: string;
  inconsistencia: string;
  programa: string;
  zonaEspecial?: string;
  periodoInicial: string;
  periodoFinal: string;
  provincia: string;
  valor: number;
  estadoVerif: string;
  auditorAsignado?: string;
  fechaAsignacion?: string;
  fechaAuditoria?: string;
  numeroAutoApertura?: string;
  red?: string;
  trazas?: any[];
};