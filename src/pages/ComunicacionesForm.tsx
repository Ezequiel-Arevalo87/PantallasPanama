import React, { useMemo, useState } from "react";
import {
  Box,
  Button,
  Grid,
  TextField,
  Typography,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import TablaResultadoComunicaciones, {
  ComunicacionRow,
  Decision,
} from "./TablaResultadoComunicaciones";

type FormuState = {
  ruc: string;
  dv: string;
  nombreRazonSocial: string;
};

const buildMockRows = (): ComunicacionRow[] => [
  {
    id: "1",
    impuesto: "ISR",
    monto: 9999.99,
    numeroResolucion: "201-0085 2025",
    decision: "ACEPTA",
  },
  {
    id: "2",
    impuesto: "ITBMS",
    monto: 9999.99,
    numeroResolucion: "204-0096 2025",
    decision: "RECHAZA",
  },
  {
    id: "3",
    impuesto: "DIVIDENDOS",
    monto: 9999.99,
    numeroResolucion: "201-0097 2025",
    decision: "ACEPTA",
  },
  {
    id: "4",
    impuesto: "AVISO DE OPERACION",
    monto: 9999.99,
    numeroResolucion: "",
    decision: "ACEPTA",
  },
];

const ComunicacionesForm: React.FC = () => {
  const [formulario, setFormulario] = useState<FormuState>({
    ruc: "",
    dv: "",
    nombreRazonSocial: "",
  });

  const [submitted, setSubmitted] = useState(false);
  const [rucError, setRucError] = useState<string>("");
  const [rows, setRows] = useState<ComunicacionRow[]>([]);
  const [openConfirm, setOpenConfirm] = useState(false); // ✅ NUEVO

  const numeroPropuesta = useMemo(() => "7010000008756", []);

  const handleChange =
    (field: keyof FormuState) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setFormulario((prev) => ({ ...prev, [field]: value }));
      if (field === "ruc") setRucError("");
    };

  const validar = () => {
    const ruc = formulario.ruc.trim();
    if (!ruc) return "El RUC es obligatorio.";
    if (ruc.length < 6) return "RUC inválido (muy corto).";
    return "";
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const err = validar();
    if (err) {
      setRucError(err);
      setSubmitted(false);
      setRows([]);
      return;
    }

    setRows(buildMockRows());
    setSubmitted(true);
  };

  const onLimpiar = () => {
    setFormulario({ ruc: "", dv: "", nombreRazonSocial: "" });
    setRucError("");
    setRows([]);
    setSubmitted(false);
  };

  const onDecisionChange = (id: string, decision: Decision) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, decision } : r)));
  };

  // ✅ ABRIR CONFIRMACIÓN
  const handleEnviar = () => {
    setOpenConfirm(true);
  };

  // ✅ CONFIRMAR ENVÍO
  const confirmarEnvio = () => {
    setOpenConfirm(false);

    // 👉 Aquí luego conectas tu API
    console.log("ENVIADO:", {
      formulario,
      numeroPropuesta,
      decisiones: rows,
    });

    alert("Propuesta enviada correctamente ✅");
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
        Pantalla de Respuesta Propuesta de Regularización
      </Typography>

      <Box component="form" onSubmit={onSubmit} noValidate>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              label="RUC *"
              value={formulario.ruc}
              onChange={handleChange("ruc")}
              fullWidth
              placeholder="Ingrese el RUC"
              error={!!rucError}
              helperText={rucError || "Digite el RUC y presione Consultar."}
            />
          </Grid>

          <Grid item xs={12} md={2}>
            <TextField
              label="DV"
              value={formulario.dv}
              onChange={handleChange("dv")}
              fullWidth
              placeholder="DV"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Nombre / Razón Social"
              value={formulario.nombreRazonSocial}
              onChange={handleChange("nombreRazonSocial")}
              fullWidth
              placeholder="Nombre del contribuyente"
            />
          </Grid>

          <Grid item xs={12}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <Button type="submit" variant="contained">
                Consultar
              </Button>
              <Button type="button" variant="outlined" onClick={onLimpiar}>
                Limpiar
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Box>

      {submitted && (
        <Box sx={{ mt: 3, mb: 1 }}>
          <Typography sx={{ fontWeight: 700 }}>
            RUC: {formulario.ruc || "XXXXXXXX"} &nbsp;&nbsp; DV:{" "}
            {formulario.dv || "XX"} &nbsp;&nbsp; Nombre / Razón Social:{" "}
            {formulario.nombreRazonSocial || "—"}
          </Typography>
          <Typography sx={{ fontWeight: 700 }}>
            Número de Propuesta de Regularización: {numeroPropuesta}
          </Typography>
        </Box>
      )}

      <TablaResultadoComunicaciones
        rows={rows}
        onDecisionChange={onDecisionChange}
      />

      {/* ✅ BOTÓN ENVIAR */}
      {rows.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Button variant="contained" color="success" onClick={handleEnviar}>
            Enviar
          </Button>
        </Box>
      )}

      {/* ✅ DIÁLOGO CONFIRMACIÓN */}
      <Dialog open={openConfirm} onClose={() => setOpenConfirm(false)}>
        <DialogTitle>Confirmar envío</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Está seguro que desea <b>enviar</b> la respuesta de la propuesta de
            regularización?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfirm(false)}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={confirmarEnvio}
          >
            Aceptar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ComunicacionesForm;
