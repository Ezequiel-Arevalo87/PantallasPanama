import React, { useMemo, useState } from "react";
import {
  Box,
  Grid,
  TextField,
  Typography,
  FormControlLabel,
  Checkbox,
  Button,
  Paper,
  Stack,
  Snackbar,
  Alert,
  CircularProgress,
  Divider,
} from "@mui/material";

type Props = {
  tipo?: any;
  fetchContribuyente?: (ruc: string) => Promise<{
    numeroTramite: string;
    nombreContribuyente: string;
  }>;
};

type FormState = {
  ruc: string;
  numeroTramite: string;
  nombreContribuyente: string;
  fechaNotificacion: string;
  esPresencial: boolean;
  receptorNombre: string;
  receptorCargo: string;
  motivoNoNotificacion: string;
  correoNotificacion: string;
};

const addDays = (isoDate: string, days: number) => {
  if (!isoDate) return "";
  const d = new Date(isoDate + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

// Mock (reemplaza por tu API si quieres pasándola por props)
async function mockFetchByRUC(ruc: string) {
  await new Promise((r) => setTimeout(r, 600));
  const rand = Math.floor(10000 + Math.random() * 90000);
  return {
    numeroTramite: `TRM-2025-${rand}`,
    nombreContribuyente: "EMPRESA PANAMEÑA S.A.",
  };
}

const PantallaControNotificacion: React.FC<Props> = ({ tipo, fetchContribuyente }) => {
  const [form, setForm] = useState<FormState>({
    ruc: "",
    numeroTramite: "",
    nombreContribuyente: "",
    fechaNotificacion: "",
    esPresencial: false,
    receptorNombre: "",
    receptorCargo: "",
    motivoNoNotificacion: "",
    correoNotificacion: "",
  });

  const [loading, setLoading] = useState(false);
  const [hasData, setHasData] = useState(false);
  const [rucError, setRucError] = useState<string | null>(null);

  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMsg, setSnackMsg] = useState("");
  const [snackType, setSnackType] = useState<"success" | "error">("success");

  const fechaLimite = useMemo(
    () => addDays(form.fechaNotificacion, 180),
    [form.fechaNotificacion]
  );

  const handleChange =
    (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = field === "esPresencial" ? (e.target as any).checked : e.target.value;

      setForm((prev) => ({
        ...prev,
        [field]: value,
        ...(field === "esPresencial" && (e.target as any).checked
          ? { motivoNoNotificacion: "", correoNotificacion: "" }
          : {}),
        ...(field === "esPresencial" && !(e.target as any).checked
          ? { receptorNombre: "", receptorCargo: "" }
          : {}),
      }));

      if (field === "ruc") {
        setHasData(false);
        setRucError(null);
        setForm((prev) => ({
          ...prev,
          numeroTramite: "",
          nombreContribuyente: "",
        }));
      }
    };

  const buscarPorRUC = async () => {
    setRucError(null);
    if (!form.ruc.trim()) {
      setRucError("Ingrese un RUC para buscar.");
      return;
    }
    setLoading(true);
    try {
      const fetcher = fetchContribuyente ?? mockFetchByRUC;
      const data = await fetcher(form.ruc.trim());
      setForm((prev) => ({
        ...prev,
        numeroTramite: data.numeroTramite,
        nombreContribuyente: data.nombreContribuyente,
      }));
      setHasData(true);
    } catch (err: any) {
      setHasData(false);
      setRucError(err?.message || "Error buscando por RUC.");
    } finally {
      setLoading(false);
    }
  };

  const validate = () => {
    const errors: string[] = [];
    if (!form.ruc.trim()) errors.push("El RUC es obligatorio.");
    if (!hasData) errors.push("Debe buscar y cargar los datos del RUC.");
    if (!form.fechaNotificacion) errors.push("La fecha de notificación es obligatoria.");

    if (form.esPresencial) {
      if (!form.receptorNombre.trim()) errors.push("Nombre de quien recibió es obligatorio.");
      if (!form.receptorCargo.trim()) errors.push("Cargo de quien recibió es obligatorio.");
    } else {
      if (!form.motivoNoNotificacion.trim()) errors.push("Motivo de no notificación es obligatorio.");
      if (!form.correoNotificacion.trim()) errors.push("Correo para notificación es obligatorio.");
      else if (!isEmail(form.correoNotificacion)) errors.push("El correo para notificación no es válido.");
    }
    return errors;
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validate();
    if (errors.length) {
      setSnackType("error");
      setSnackMsg(errors[0]);
      setSnackOpen(true);
      return;
    }

    console.log("Payload a enviar:", { ...form, fechaLimite, tipo });
    setSnackType("success");
    setSnackMsg("Notificación registrada correctamente.");
    setSnackOpen(true);
  };

  return (
    <>
      
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
          Notificación de Acta de Inicio
        </Typography>
        <Divider sx={{ mb: 3 }} />

        <form onSubmit={onSubmit} noValidate>
          <Grid container spacing={2}>
            {/* Fila 1: RUC + Buscar (compacto y alineado) */}
            <Grid item xs={12} md={6}>
              <TextField
                label="RUC *"
                value={form.ruc}
                onChange={handleChange("ruc")}
                fullWidth
                placeholder="Ingrese el RUC"
                error={!!rucError}
                helperText={rucError || "Digite el RUC y presione Buscar."}
              />
            </Grid>
            <Grid item xs={12} md={2} sx={{ display: "flex", alignItems: "flex-end" }}>
              <Button
                variant="outlined"
                onClick={buscarPorRUC}
                disabled={loading || !form.ruc.trim()}
                startIcon={loading ? <CircularProgress size={18} /> : undefined}
                size="medium"
                sx={{ minWidth: 120 }}
              >
                {loading ? "Buscando..." : "Buscar"}
              </Button>
            </Grid>
            <Grid item xs={12} md={4} /> {/* espacio para equilibrar la fila en desktop */}

            {/* Fila 2: Trámite / Contribuyente */}
            <Grid item xs={12} md={6}>
              <TextField
                label="Número de trámite"
                value={form.numeroTramite}
                fullWidth
                disabled
                placeholder="(pendiente de búsqueda por RUC)"
                helperText="Valor obtenido del sistema."
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Nombre del Contribuyente"
                value={form.nombreContribuyente}
                fullWidth
                disabled
                placeholder="(pendiente de búsqueda por RUC)"
                helperText="Valor obtenido del sistema."
              />
            </Grid>

            {/* Fila 3: Fecha / +180 días / Presencial */}
            <Grid item xs={12} md={4}>
              <TextField
                label="Fecha de Notificación *"
                type="date"
                value={form.fechaNotificacion}
                onChange={handleChange("fechaNotificacion")}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            {/* <Grid item xs={12} md={4}>
              <TextField
                label="Fecha límite (+180 días)"
                value={fechaLimite}
                fullWidth
                InputProps={{ readOnly: true }}
                placeholder="—"
              />
            </Grid> */}
            <Grid item xs={12} md={6} sx={{ display: "flex", alignItems: "center" }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={form.esPresencial}
                    onChange={handleChange("esPresencial")}
                  />
                }
                label="Notificación presencial"
              />
            </Grid>

            {/* Fila 4: Condicional */}
          
              <>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Nombre de quien recibió *"
                    value={form.receptorNombre}
                    onChange={handleChange("receptorNombre")}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Cargo de quien recibió *"
                    value={form.receptorCargo}
                    onChange={handleChange("receptorCargo")}
                    fullWidth
                  />
                </Grid>
              </>
           
              <>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Motivo de no notificación *"
                    value={form.motivoNoNotificacion}
                    onChange={handleChange("motivoNoNotificacion")}
                    fullWidth
                    multiline
                    minRows={2}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Correo para notificación *"
                    value={form.correoNotificacion}
                    onChange={handleChange("correoNotificacion")}
                    fullWidth
                    placeholder="correo@dominio.com"
                  />
                </Grid>
              </>
            

            {/* Fila 5: Botones */}
            <Grid item xs={12}>
              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button variant="contained" type="submit" disabled={!hasData}>
                  ENVIAR
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setForm({
                      ruc: "",
                      numeroTramite: "",
                      nombreContribuyente: "",
                      fechaNotificacion: "",
                      esPresencial: false,
                      receptorNombre: "",
                      receptorCargo: "",
                      motivoNoNotificacion: "",
                      correoNotificacion: "",
                    });
                    setHasData(false);
                    setRucError(null);
                  }}
                >
                  LIMPIAR
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </form>
     

      <Snackbar
        open={snackOpen}
        autoHideDuration={4000}
        onClose={() => setSnackOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackOpen(false)}
          severity={snackType}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackMsg}
        </Alert>
      </Snackbar>
   </>
  );
};

export default PantallaControNotificacion;
