import React, { useMemo, useState } from "react";
import {
  Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Stack, Typography, Tooltip
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import {
  getNextFase, avanzarCaso, FaseFlujo
} from "../lib/workflowStorage";

type Props = {
  casoId: string | number;
  currentFase?: FaseFlujo | null; // fase actual del caso
  defaultBy?: string;             // prellenar "Quién asigna"
  onGo?: (path: string) => void;  // navegar a la siguiente pantalla
  size?: "small" | "medium" | "large";
  variant?: "contained" | "outlined" | "text";
};

export const AdvanceToNext: React.FC<Props> = ({
  casoId,
  currentFase,
  defaultBy = "",
  onGo,
  size = "small",
  variant = "contained",
}) => {
  const next = useMemo(() => getNextFase(currentFase), [currentFase]);
  const [open, setOpen] = useState(false);
  const [by, setBy] = useState(defaultBy);
  const [note, setNote] = useState("");

  const openDlg = () => setOpen(true);
  const closeDlg = () => {
    setOpen(false);
    setBy(defaultBy);
    setNote("");
  };

  const confirmar = () => {
    if (!next) return;
    avanzarCaso({ id: casoId, to: next, by: by || "Sistema", note });
    closeDlg();
    onGo?.(next); // ← navega al siguiente paso
  };

  return (
    <>
      <Tooltip title={next ? `ir a ${next}` : "Flujo finalizado"}>
        <span>
          <Button
            variant={variant}
            size={size}
            endIcon={<SendIcon />}
            disabled={!next}
            onClick={openDlg}
          >
            {next ? `ir a ${next}` : "Completado"}
          </Button>
        </span>
      </Tooltip>

      <Dialog open={open} onClose={closeDlg} fullWidth maxWidth="sm">
        <DialogTitle>Enviar al siguiente paso</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <TextField
              label="Quién asigna"
              value={by}
              onChange={(e) => setBy(e.target.value)}
              autoFocus
              required
            />
            <TextField
              label="Nota (opcional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              multiline
              minRows={2}
            />
            <Typography variant="body2" color="text.secondary">
              Destino: <b>{next ?? "—"}</b>
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDlg}>Cancelar</Button>
          <Button variant="contained" onClick={confirmar} disabled={!by.trim()}>
            Enviar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AdvanceToNext;
