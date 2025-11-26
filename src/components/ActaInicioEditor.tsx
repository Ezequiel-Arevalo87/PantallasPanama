import React from "react";
import { Grid, TextField, Paper } from "@mui/material";

export default function ActaInicioForm({
  form,
  setForm,
}: {
  form: any;
  setForm: (f: any) => void;
}) {
  const handle = (e: any) =>
    setForm((p: any) => ({ ...p, [e.target.name]: e.target.value }));

  return (
    <Paper sx={{ p: 2 }} variant="outlined">
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            name="fecha"
            type="date"
            fullWidth
            label="Fecha"
            InputLabelProps={{ shrink: true }}
            value={form.fecha}
            onChange={handle}
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            name="senores"
            label="Señor(es)"
            fullWidth
            multiline
            value={form.senores}
            onChange={handle}
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            name="ruc"
            label="RUC"
            fullWidth
            value={form.ruc}
            onChange={handle}
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            name="correoAuditor"
            label="Correo del Auditor"
            fullWidth
            value={form.correoAuditor}
            onChange={handle}
          />
        </Grid>

        <Grid item xs={6}>
          <TextField
            name="telVerificacion"
            label="Teléfono Verificación"
            fullWidth
            value={form.telVerificacion}
            onChange={handle}
          />
        </Grid>

        <Grid item xs={6}>
          <TextField
            name="correoConsultas"
            label="Correo para Consultas"
            fullWidth
            value={form.correoConsultas}
            onChange={handle}
          />
        </Grid>
      </Grid>
    </Paper>
  );
}
