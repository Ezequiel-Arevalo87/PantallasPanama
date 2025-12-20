import React, { useMemo, useState } from "react";
import { Box, Button, Grid, TextField, Typography, Stack } from "@mui/material";
import TablaResultadoComunicaciones, { ComunicacionRow, Decision } from "./tablaResultadoComunicaciones";


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
    // si quieres solo números:
    // if (!/^\d+$/.test(ruc)) return "El RUC debe ser numérico.";
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

    // ✅ aquí simulas la consulta
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

      {/* Encabezado tipo "pantalla" (solo si ya consultó) */}
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

      {/* Tabla: solo aparece cuando hay data */}
      <TablaResultadoComunicaciones
        rows={rows}
        onDecisionChange={onDecisionChange}
      />
    </Box>
  );
};

export default ComunicacionesForm;
