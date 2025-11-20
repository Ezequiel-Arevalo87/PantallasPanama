// src/components/ReporteVerificacionModal.tsx
import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
} from "@mui/material";
import dayjs from "dayjs";
import Swal from "sweetalert2";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function ReporteVerificacionModal({ open, onClose }: Props) {
  const hoy = dayjs().format("YYYY-MM-DD");

  const [inicio, setInicio] = useState(hoy);
  const [fin, setFin] = useState(hoy);

  const generar = () => {
    if (dayjs(inicio).isAfter(dayjs(fin))) {
      Swal.fire("La fecha inicial no puede ser mayor que la final", "", "warning");
      return;
    }

    Swal.fire("Reporte generado", "", "success");

    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle fontWeight="bold">Reporte de Verificación</DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              type="date"
              fullWidth
              label="Fecha Inicial"
              InputLabelProps={{ shrink: true }}
              value={inicio}
              onChange={(e) => setInicio(e.target.value)}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              type="date"
              fullWidth
              label="Fecha Final"
              InputLabelProps={{ shrink: true }}
              value={fin}
              onChange={(e) => setFin(e.target.value)}
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={generar}>
          Generar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
