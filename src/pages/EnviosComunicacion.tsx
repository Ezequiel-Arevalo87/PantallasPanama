import * as React from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  FormLabel,
  Grid,
  List,
  ListItemButton,
  ListItemText,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { CasoInfo } from "./TablaResultadosComunicacion";
import {
  appendTrazabilidadComunicacion,
  type TrazabilidadCorreo,
} from "../lib/trazabilidadComunicacionesStorage";

type Props = {
  caso: CasoInfo;
  onClose: () => void;
  onGoTrazabilidad?: (params: { ruc: string; noTramite: string }) => void;
};

type TipoComunicacion =
  | "NOTIFICACION_ACTA_INICIO"
  | "NOTIFICACION_ACTA_CIERRE"
  | "SOLICITUD_INFORMACION";

type DocumentoMock = {
  id: string;
  nombre: string;
  tipo: string;
  fecha: string;
  tamanoMb: number;
};

const DOCUMENTOS_MOCK: DocumentoMock[] = [
  {
    id: "1",
    nombre: "Acta de Inicio.pdf",
    tipo: "ACTA",
    fecha: "09/03/2026",
    tamanoMb: 1.8,
  },
  {
    id: "2",
    nombre: "Acta de Cierre.pdf",
    tipo: "ACTA",
    fecha: "09/03/2026",
    tamanoMb: 2.2,
  },
  {
    id: "3",
    nombre: "Solicitud de Información.pdf",
    tipo: "OFICIO",
    fecha: "09/03/2026",
    tamanoMb: 0.9,
  },
  {
    id: "4",
    nombre: "Anexo Tributario.xlsx",
    tipo: "ANEXO",
    fecha: "08/03/2026",
    tamanoMb: 3.1,
  },
];

const MAX_ASUNTO = 100;
const MAX_MENSAJE = 4000;
const MAX_MB = 10;

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function formatDateTime(d: Date) {
  const dd = pad(d.getDate());
  const mm = pad(d.getMonth() + 1);
  const yyyy = d.getFullYear();
  const hh = d.getHours();
  const min = pad(d.getMinutes());

  const ampm = hh >= 12 ? "p. m." : "a. m.";
  const hour12 = hh % 12 === 0 ? 12 : hh % 12;

  return `${dd}/${mm}/${yyyy}, ${pad(hour12)}:${min} ${ampm}`;
}

function formatDate(d: Date) {
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function addDays(base: Date, days: number) {
  const copy = new Date(base);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function buildAsunto(tipo: TipoComunicacion | "", noTramite: string) {
  switch (tipo) {
    case "NOTIFICACION_ACTA_INICIO":
      return `Notificación Acta de Inicio - Trámite ${noTramite}`;
    case "NOTIFICACION_ACTA_CIERRE":
      return `Notificación Acta de Cierre - Trámite ${noTramite}`;
    case "SOLICITUD_INFORMACION":
      return `Solicitud de Información - Trámite ${noTramite}`;
    default:
      return "";
  }
}

function buildMensajeBase(caso: CasoInfo, tipo: TipoComunicacion | "") {
  switch (tipo) {
    case "NOTIFICACION_ACTA_INICIO":
      return `Se envía notificación del Acta de Inicio asociada al trámite ${caso.noTramite}.`;
    case "NOTIFICACION_ACTA_CIERRE":
      return `Se envía notificación del Acta de Cierre asociada al trámite ${caso.noTramite}.`;
    case "SOLICITUD_INFORMACION":
      return `Se solicita información asociada al trámite ${caso.noTramite}.`;
    default:
      return "";
  }
}

function buildNoDocumento(noTramite: string) {
  const limpio = noTramite.replace(/[^\d]/g, "").slice(-8) || "00000000";
  const hoy = new Date();
  return `DOC-${hoy.getFullYear()}${pad(hoy.getMonth() + 1)}${pad(hoy.getDate())}-${limpio}`;
}

function buildNombreDocumento(noTramite: string) {
  return `Correo_${noTramite}.pdf`;
}

const InfoItem = ({
  label,
  value,
}: {
  label: string;
  value?: React.ReactNode;
}) => (
  <Box>
    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
      {label}
    </Typography>
    <Typography variant="body2" sx={{ fontWeight: 600 }}>
      {value || "-"}
    </Typography>
  </Box>
);

const EnviosComunicacion: React.FC<Props> = ({
  caso,
  onClose,
  onGoTrazabilidad,
}) => {
  const correosDisponibles: string[] =
    Array.isArray(caso.correos) && caso.correos.length > 0
      ? caso.correos
      : caso.correo
      ? [caso.correo]
      : [];

  const correoDestino = correosDisponibles[0] ?? "";

  const [tipoComunicacion, setTipoComunicacion] = React.useState<TipoComunicacion | "">("");
  const [adjuntar, setAdjuntar] = React.useState<"SI" | "NO">("NO");
  const [documentoSeleccionado, setDocumentoSeleccionado] = React.useState<string>("");
  const [asunto, setAsunto] = React.useState<string>("");
  const [mensaje, setMensaje] = React.useState<string>("");
  const [diasMaxRespuesta, setDiasMaxRespuesta] = React.useState<number>(5);

  const [error, setError] = React.useState<string>("");
  const [success, setSuccess] = React.useState<string>("");
  const [enviando, setEnviando] = React.useState<boolean>(false);
  const [previewOpen, setPreviewOpen] = React.useState<boolean>(false);

  const documentosDisponibles = React.useMemo(() => {
    if (tipoComunicacion === "NOTIFICACION_ACTA_INICIO") {
      return DOCUMENTOS_MOCK.filter((d) => d.nombre.includes("Inicio"));
    }
    if (tipoComunicacion === "NOTIFICACION_ACTA_CIERRE") {
      return DOCUMENTOS_MOCK.filter((d) => d.nombre.includes("Cierre"));
    }
    if (tipoComunicacion === "SOLICITUD_INFORMACION") {
      return DOCUMENTOS_MOCK.filter(
        (d) =>
          d.nombre.includes("Solicitud") ||
          d.tipo === "ANEXO" ||
          d.tipo === "OFICIO"
      );
    }
    return DOCUMENTOS_MOCK;
  }, [tipoComunicacion]);

  const documentoActual = documentosDisponibles.find(
    (d) => d.id === documentoSeleccionado
  );
  const pesoTotal = documentoActual ? documentoActual.tamanoMb : 0;

  const noDocumentoPreview = buildNoDocumento(caso.noTramite);
  const nombreDocumentoPreview = buildNombreDocumento(caso.noTramite);

  const nombreUsuarioPreview = "JUAN PEREZ GÓMEZ";
  const rucConDvPreview = caso.ruc || "-";
  const nombreContribuyentePreview = caso.razonSocial || "-";
  const representantePreview = caso.representanteLegal || "-";
  const correoPreview = correoDestino || caso.correo || "-";

  React.useEffect(() => {
    if (!tipoComunicacion) return;

    setAsunto(buildAsunto(tipoComunicacion, caso.noTramite));
    setMensaje(buildMensajeBase(caso, tipoComunicacion));
    setDocumentoSeleccionado("");
    setSuccess("");
    setError("");

    if (tipoComunicacion === "SOLICITUD_INFORMACION") {
      setDiasMaxRespuesta(5);
    } else {
      setDiasMaxRespuesta(3);
    }
  }, [tipoComunicacion, caso]);

  const validarFormulario = () => {
    if (!correoDestino) {
      setError("No hay correo electrónico disponible para el contribuyente.");
      return false;
    }

    if (!tipoComunicacion) {
      setError("Debe seleccionar el tipo de comunicación.");
      return false;
    }

    if (!asunto.trim()) {
      setError("Debe ingresar el asunto.");
      return false;
    }

    if (!mensaje.trim()) {
      setError("Debe ingresar el mensaje.");
      return false;
    }

    if (asunto.length > MAX_ASUNTO || mensaje.length > MAX_MENSAJE) {
      setError("El número de caracteres supera el límite permitido.");
      return false;
    }

    if (adjuntar === "SI" && !documentoSeleccionado) {
      setError("Debe seleccionar un documento para adjuntar.");
      return false;
    }

    if (pesoTotal > MAX_MB) {
      setError("El tamaño total del correo supera el máximo permitido de 10 MB.");
      return false;
    }

    if (diasMaxRespuesta < 1 || diasMaxRespuesta > 30) {
      setError("Los días máximos de respuesta deben estar entre 1 y 30.");
      return false;
    }

    setError("");
    return true;
  };

  const handleOpenPreview = () => {
    setSuccess("");
    if (!validarFormulario()) return;
    setPreviewOpen(true);
  };

  const handleIrTrazabilidad = () => {
    setPreviewOpen(false);
    onGoTrazabilidad?.({
      ruc: caso.ruc,
      noTramite: caso.noTramite,
    });
  };

  const handleEnviar = async () => {
    if (!validarFormulario()) return;

    setEnviando(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setEnviando(false);

    const ahora = new Date();
    const fechaLimite = addDays(ahora, diasMaxRespuesta);

    const nuevaTraza: TrazabilidadCorreo = {
      id: `mail-${Date.now()}`,
      ruc: caso.ruc,
      noTramite: caso.noTramite,
      fechaEnvio: formatDateTime(ahora),
      fechaRespuesta: "—",
      origen: "Sistema",
      destino: correoDestino || "Correo registrado",
      asunto,
      mensaje,
      noDocumento: noDocumentoPreview,
      nombreDocumento: nombreDocumentoPreview,
      diasMaxRespuesta,
      diasFaltantes: diasMaxRespuesta,
      fechaLimiteRespuesta: formatDate(fechaLimite),
      estado: "ENVIADO",
    };

    appendTrazabilidadComunicacion(nuevaTraza);

    setPreviewOpen(false);
    setSuccess(
      `Comunicación enviada exitosamente. Se otorgaron ${diasMaxRespuesta} día(s) de respuesta.`
    );
  };

  const handleLimpiar = () => {
    setMensaje("");
    setAsunto("");
    setError("");
    setSuccess("");
    setDocumentoSeleccionado("");
    setAdjuntar("NO");
  };

  return (
    <Box sx={{ py: 1 }}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Typography sx={{ fontWeight: 900, mb: 1.5 }}>
              Información del Contribuyente / Caso
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} md={5}>
                <InfoItem label="Razón Social" value={caso.razonSocial} />
              </Grid>
              <Grid item xs={12} md={2}>
                <InfoItem label="Trámite" value={caso.noTramite} />
              </Grid>
              <Grid item xs={12} md={2}>
                <InfoItem label="RUC" value={caso.ruc} />
              </Grid>
              <Grid item xs={12} md={3}>
                <InfoItem label="No. Acta de Inicio" value={caso.actaInicio} />
              </Grid>
              <Grid item xs={12} md={6}>
                <InfoItem
                  label="Representante Legal"
                  value={caso.representanteLegal}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <InfoItem label="Correo" value={correoDestino || caso.correo} />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Card variant="outlined" sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 900, mb: 2 }}>
                Envío de Comunicación
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    select
                    fullWidth
                    label="Tipo de comunicación"
                    value={tipoComunicacion}
                    onChange={(e) =>
                      setTipoComunicacion(e.target.value as TipoComunicacion)
                    }
                  >
                    <MenuItem value="NOTIFICACION_ACTA_INICIO">
                      Notificación Acta de Inicio
                    </MenuItem>
                    <MenuItem value="NOTIFICACION_ACTA_CIERRE">
                      Notificación Acta de Cierre
                    </MenuItem>
                    <MenuItem value="SOLICITUD_INFORMACION">
                      Solicitud de Información
                    </MenuItem>
                  </TextField>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Días máximos de respuesta"
                    value={diasMaxRespuesta}
                    onChange={(e) =>
                      setDiasMaxRespuesta(Number(e.target.value || 0))
                    }
                    inputProps={{ min: 1, max: 30 }}
                    helperText="Plazo otorgado al contribuyente"
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControl>
                    <FormLabel>Adjuntar documento</FormLabel>
                    <RadioGroup
                      row
                      value={adjuntar}
                      onChange={(e) =>
                        setAdjuntar(e.target.value as "SI" | "NO")
                      }
                    >
                      <FormControlLabel
                        value="SI"
                        control={<Radio />}
                        label="Sí"
                      />
                      <FormControlLabel
                        value="NO"
                        control={<Radio />}
                        label="No"
                      />
                    </RadioGroup>
                  </FormControl>
                </Grid>

                {adjuntar === "SI" && (
                  <Grid item xs={12}>
                    <Paper
                      variant="outlined"
                      sx={{ p: 1.5, borderRadius: 2, bgcolor: "grey.50" }}
                    >
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: 800, mb: 1 }}
                      >
                        Documentos disponibles del caso (simulación BPM)
                      </Typography>

                      <List dense sx={{ py: 0 }}>
                        {documentosDisponibles.map((doc) => {
                          const selected = documentoSeleccionado === doc.id;

                          return (
                            <ListItemButton
                              key={doc.id}
                              selected={selected}
                              onClick={() => setDocumentoSeleccionado(doc.id)}
                              sx={{ borderRadius: 2, mb: 0.5 }}
                            >
                              <ListItemText
                                primary={doc.nombre}
                                secondary={`Tipo: ${doc.tipo} · Fecha: ${doc.fecha} · Tamaño: ${doc.tamanoMb} MB`}
                              />
                              {selected && (
                                <Chip
                                  label="Seleccionado"
                                  color="primary"
                                  size="small"
                                />
                              )}
                            </ListItemButton>
                          );
                        })}
                      </List>
                    </Paper>
                  </Grid>
                )}

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Asunto"
                    value={asunto}
                    onChange={(e) => setAsunto(e.target.value)}
                    helperText={`${asunto.length}/${MAX_ASUNTO} caracteres`}
                    error={asunto.length > MAX_ASUNTO}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    minRows={6}
                    label="Mensaje"
                    value={mensaje}
                    onChange={(e) => setMensaje(e.target.value)}
                    helperText={`${mensaje.length}/${MAX_MENSAJE} caracteres`}
                    error={mensaje.length > MAX_MENSAJE}
                  />
                </Grid>

                {error && (
                  <Grid item xs={12}>
                    <Alert severity="error">{error}</Alert>
                  </Grid>
                )}

                {success && (
                  <>
                    <Grid item xs={12}>
                      <Alert severity="success">{success}</Alert>
                    </Grid>

                    {onGoTrazabilidad && (
                      <Grid item xs={12}>
                        <Button
                          variant="contained"
                          onClick={handleIrTrazabilidad}
                        >
                          Ver trazabilidad de comunicaciones
                        </Button>
                      </Grid>
                    )}
                  </>
                )}

                <Grid item xs={12}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "flex-end",
                      width: "100%",
                    }}
                  >
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      spacing={1.2}
                    >
                      <Button
                        variant="outlined"
                        color="inherit"
                        onClick={handleLimpiar}
                      >
                        Limpiar
                      </Button>

                      <Button
                        variant="outlined"
                        color="inherit"
                        onClick={onClose}
                      >
                        Cerrar
                      </Button>

                      <Button variant="contained" onClick={handleOpenPreview}>
                        Vista previa
                      </Button>
                    </Stack>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 900 }}>
          Vista previa del correo
        </DialogTitle>

        <DialogContent dividers>
          <Paper
            variant="outlined"
            sx={{ p: 3, borderRadius: 2, bgcolor: "#fcfcfc" }}
          >
            <Stack spacing={2}>
              <Divider />

              <Box
                sx={{
                  whiteSpace: "pre-wrap",
                  fontSize: 14,
                  lineHeight: 1.8,
                  p: 2.5,
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2,
                  bgcolor: "#fff",
                  minHeight: 260,
                }}
              >
                <Typography variant="body2">Señor Contribuyente</Typography>
                <Typography variant="body2">
                  {nombreContribuyentePreview}
                </Typography>
                <Typography variant="body2">
                  No. RUC Dv: {rucConDvPreview}-{13}
                </Typography>
                <Typography variant="body2">{representantePreview}</Typography>
                <Typography variant="body2">REPRESENTANTE LEGAL</Typography>
                <Typography variant="body2" sx={{ mb: 3 }}>
                  {correoPreview}
                </Typography>

                <Typography variant="body2" sx={{ mb: 3 }}>
                  {mensaje ||
                    "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"}
                </Typography>

                <Typography variant="body2" sx={{ mt: 4 }}>
                  {nombreUsuarioPreview}
                </Typography>
                <Typography variant="body2" sx={{ mb: 3 }}>
                  Sección Auditoría Fiscal
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontStyle: "italic" }}
                >
                  Nota: Señor contribuyente usted puede responder a través de la
                  plataforma de Buzón de Correo Electrónico, dispuesta por la
                  DGI a su servicio.
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            variant="outlined"
            color="inherit"
            onClick={() => setPreviewOpen(false)}
          >
            Volver
          </Button>

          <Button
            variant="contained"
            onClick={handleEnviar}
            disabled={enviando}
          >
            {enviando ? "Enviando..." : "Enviar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EnviosComunicacion;