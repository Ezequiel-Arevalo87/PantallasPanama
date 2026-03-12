import * as React from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormLabel,
  Grid,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  appendTrazabilidadComunicacion,
  type TrazabilidadCorreo,
} from "../lib/trazabilidadComunicacionesStorage";

const MAX_ASUNTO = 100;
const MAX_MENSAJE = 4000;
const MAX_MB = 10;

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onGoTrazabilidad?: (params: { ruc: string; noTramite: string }) => void;
  caso: {
    ruc: string;
    noTramite: string;
    correo?: string;
    razonSocial?: string;
  };
};

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

function buildNoDocumento(noTramite: string) {
  const limpio = noTramite.replace(/[^\d]/g, "").slice(-8) || "00000000";
  const hoy = new Date();
  return `RESP-${hoy.getFullYear()}${pad(hoy.getMonth() + 1)}${pad(hoy.getDate())}-${limpio}`;
}

const RespuestaComunicaciones: React.FC<Props> = ({
  open,
  onClose,
  onSuccess,
  onGoTrazabilidad,
  caso,
}) => {
  const [adjuntar, setAdjuntar] = React.useState<"SI" | "NO">("NO");
  const [asunto, setAsunto] = React.useState("");
  const [mensaje, setMensaje] = React.useState("");
  const [archivos, setArchivos] = React.useState<File[]>([]);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");
  const [enviando, setEnviando] = React.useState(false);

  const pesoTotalMB = React.useMemo(() => {
    const total = archivos.reduce((sum, f) => sum + f.size, 0);
    return total / (1024 * 1024);
  }, [archivos]);

  React.useEffect(() => {
    if (!open) return;

    setAdjuntar("NO");
    setAsunto(
      `Respuesta a Solicitud de Información - Trámite ${caso.noTramite}`
    );
    setMensaje("");
    setArchivos([]);
    setError("");
    setSuccess("");
    setEnviando(false);
  }, [open, caso.noTramite]);

  const validar = () => {
    if (!asunto.trim()) {
      setError("Debe ingresar el asunto.");
      return false;
    }

    if (!mensaje.trim()) {
      setError("Debe ingresar el mensaje.");
      return false;
    }

    if (asunto.length > MAX_ASUNTO) {
      setError("El asunto supera el máximo permitido (100 caracteres).");
      return false;
    }

    if (mensaje.length > MAX_MENSAJE) {
      setError("El mensaje supera el máximo permitido (4000 caracteres).");
      return false;
    }

    if (pesoTotalMB > MAX_MB) {
      setError("Los documentos superan el máximo permitido de 10 MB.");
      return false;
    }

    setError("");
    return true;
  };

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setArchivos((prev) => [...prev, ...files]);
  };

  const eliminarArchivo = (index: number) => {
    setArchivos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleEnviar = async () => {
    try {
      if (!validar()) return;

      setEnviando(true);
      setError("");
      setSuccess("");

      await new Promise((resolve) => setTimeout(resolve, 1000));

      const ahora = new Date();

      const nuevaTraza: TrazabilidadCorreo = {
        id: `resp-${Date.now()}`,
        ruc: caso.ruc,
        noTramite: caso.noTramite,
        fechaEnvio: "—",
        fechaRespuesta: formatDateTime(ahora),
        origen: "Contribuyente",
        destino: "DGI / Sistema",
        asunto,
        mensaje,
        noDocumento: buildNoDocumento(caso.noTramite),
        nombreDocumento: archivos.length
          ? archivos.map((a) => a.name).join(", ")
          : "Sin adjunto",
        diasMaxRespuesta: 0,
        diasFaltantes: 0,
        fechaLimiteRespuesta: formatDate(ahora),
        estado: "RESPONDIDO",
      };

      appendTrazabilidadComunicacion(nuevaTraza);

      setSuccess("Envío exitoso.");
      onSuccess?.();
    } catch {
      setError("No se pudo hacer el envío.");
    } finally {
      setEnviando(false);
    }
  };

  const handleIrTrazabilidad = () => {
    onClose();
    onGoTrazabilidad?.({
      ruc: caso.ruc,
      noTramite: caso.noTramite,
    });
  };

  const handleCerrar = () => {
    setError("");
    setSuccess("");
    onClose();
  };

  const yaRespondido = Boolean(success);

  return (
    <Dialog open={open} onClose={handleCerrar} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 900 }}>
        Respuesta a Solicitud de Información
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={2} sx={{ pt: 0.5 }}>
          <Grid item xs={12}>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              Trámite: {caso.noTramite}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              RUC: {caso.ruc}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              Correo: {caso.correo || "-"}
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <FormControl>
              <FormLabel>¿Desea adjuntar documentos?</FormLabel>

              <RadioGroup
                row
                value={adjuntar}
                onChange={(e) => setAdjuntar(e.target.value as "SI" | "NO")}
              >
                <FormControlLabel
                  value="SI"
                  control={<Radio />}
                  label="Sí"
                  disabled={yaRespondido}
                />
                <FormControlLabel
                  value="NO"
                  control={<Radio />}
                  label="No"
                  disabled={yaRespondido}
                />
              </RadioGroup>
            </FormControl>
          </Grid>

          {adjuntar === "SI" && (
            <Grid item xs={12}>
              <Paper
                variant="outlined"
                sx={{ p: 2, bgcolor: "grey.50", borderRadius: 2 }}
              >
                <Stack spacing={2}>
                  <Button
                    variant="outlined"
                    component="label"
                    disabled={yaRespondido}
                  >
                    Seleccionar documentos
                    <input
                      type="file"
                      hidden
                      multiple
                      onChange={handleFiles}
                    />
                  </Button>

                  <Typography variant="body2">
                    Tamaño total: {pesoTotalMB.toFixed(2)} MB / {MAX_MB} MB
                  </Typography>

                  {archivos.length > 0 && (
                    <List dense>
                      {archivos.map((file, index) => (
                        <ListItem
                          key={`${file.name}-${index}`}
                          secondaryAction={
                            !yaRespondido ? (
                              <IconButton
                                edge="end"
                                onClick={() => eliminarArchivo(index)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            ) : undefined
                          }
                        >
                          <ListItemText
                            primary={file.name}
                            secondary={`${(
                              file.size /
                              (1024 * 1024)
                            ).toFixed(2)} MB`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  )}

                  <Typography variant="body2">
                    Máximo permitido {MAX_MB} MB
                  </Typography>
                </Stack>
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
              disabled={yaRespondido}
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
              disabled={yaRespondido}
            />
          </Grid>

          <Grid item xs={12}>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontStyle: "italic" }}
            >
             Nota: Señor contribuyente recuerde que usted puede responder a través de esta plataforma de Buzon Electrónico, dispuesta por la DGI a su servicio, tenga en cuenta que los documentos no superen la capacidad de 10 MB. En caso contrario hacer llegar la documentación en físico a las Oficinas de la DGI
            </Typography>
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

              {/* <Grid item xs={12}>
                <Button variant="contained" onClick={handleIrTrazabilidad}>
                  Ver trazabilidad de comunicaciones
                </Button>
              </Grid> */}
            </>
          )}
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button variant="outlined" color="inherit" onClick={handleCerrar}>
          {yaRespondido ? "Cerrar" : "Volver"}
        </Button>

        {!yaRespondido && (
          <Button
            variant="contained"
            onClick={handleEnviar}
            disabled={enviando}
          >
            {enviando ? "Enviando..." : "Enviar"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default RespuestaComunicaciones;