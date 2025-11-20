// src/components/NoProductivoModal.tsx
import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  TextField,
  MenuItem,
  Stack,
} from "@mui/material";
import Swal from "sweetalert2";

type Props = {
  open: boolean;
  onClose: () => void;
  selected: string[];
  onSave: () => void;   // PROP DEFINIDA CORRECTAMENTE
};

const MOTIVOS = [
  "Exento",
  "Incentivo",
  "Ingresos no representativos",
  "Diferencia de monto no representativa",
  "Otro",
];

export default function NoProductivoModal({
  open,
  onClose,
  selected,
  onSave,     // 👈 RECIBIR onSave ES OBLIGATORIO
}: Props) {
  const [motivo, setMotivo] = useState("");
  const [otro, setOtro] = useState("");

  const guardar = () => {
    if (!motivo) {
      Swal.fire("Seleccione un motivo", "", "warning");
      return;
    }

    if (motivo === "Otro" && !otro.trim()) {
      Swal.fire("Ingrese el motivo", "", "warning");
      return;
    }

    // LLAMAMOS AL MÉTODO DEL PADRE
    onSave();

    Swal.fire(
      "Marcado como No Productivo",
      "El caso fue marcado correctamente.",
      "success"
    );

    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle fontWeight="bold">
        Marcar como No Productivo
      </DialogTitle>

      <DialogContent dividers>
        <Typography mb={2}>
          <b>Casos seleccionados:</b> {selected.length}
        </Typography>

        <Stack spacing={2}>
          <TextField
            select
            fullWidth
            label="Motivo"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
          >
            {MOTIVOS.map((m) => (
              <MenuItem key={m} value={m}>
                {m}
              </MenuItem>
            ))}
          </TextField>

          {motivo === "Otro" && (
            <TextField
              label="Describa el motivo"
              fullWidth
              multiline
              minRows={3}
              value={otro}
              onChange={(e) => setOtro(e.target.value)}
            />
          )}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>

        <Button
          variant="contained"
          color="warning"
          onClick={guardar}   // 👈 Aquí usamos guardar()
        >
          Aceptar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
