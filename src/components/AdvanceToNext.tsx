import React, { useMemo, useState, useEffect } from "react";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  Typography,
  Tooltip,
  IconButton,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import { getNextFase, avanzarCaso, FaseFlujo } from "../lib/workflowStorage";

type Props = {
  casoId: string | number;
  currentFase?: FaseFlujo | null;
  defaultBy?: string;
  onGo?: (path: string) => void;
  size?: "small" | "medium" | "large";
  variant?: "contained" | "outlined" | "text";
  renderAs?: "button" | "icon";
  tooltip?: string;
  iconNode?: React.ReactNode;
  ariaLabel?: string;
  registerOpen?: (fn: () => void) => void;
};

export const AdvanceToNext: React.FC<Props> = ({
  casoId,
  currentFase,
  defaultBy = "",
  onGo,
  size = "small",
  variant = "contained",
  renderAs = "button",
  tooltip,
  iconNode,
  ariaLabel = "Ir a tarea",
  registerOpen,
}) => {
  const next = useMemo(() => getNextFase(currentFase), [currentFase]);
  const [open, setOpen] = useState(false);
  const [by, setBy] = useState(defaultBy);
  const [note, setNote] = useState("");
  const [deadline, setDeadline] = useState(""); // 🕒 nueva fecha límite

  const openDlg = () => setOpen(true);
  const closeDlg = () => {
    setOpen(false);
    setBy(defaultBy);
    setNote("");
    setDeadline("");
  };

  const confirmar = () => {
    if (!next) return;
    avanzarCaso({
      id: casoId,
      to: next,
      by: by || "Sistema",
      note,
      deadline: deadline || null, // guarda el plazo si existe
    });
    closeDlg();
    onGo?.(next);
  };

  useEffect(() => {
    registerOpen?.(openDlg);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const computedTooltip = tooltip ?? (next ? `Ir a ${next}` : "Flujo finalizado");

  // 🧮 Calcular días restantes si ya se eligió fecha
  const diasRestantes = useMemo(() => {
    if (!deadline) return null;
    const hoy = new Date();
    const fin = new Date(deadline);
    const diff = Math.ceil((fin.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
    return diff >= 0 ? diff : 0;
  }, [deadline]);

  return (
    <>
      {renderAs === "icon" ? (
        <Tooltip title={computedTooltip}>
          <span>
            <IconButton
              color="primary"
              aria-label={ariaLabel}
              onClick={openDlg}
              disabled={!next}
              size="small"
            >
              {iconNode ?? <PlayArrowRoundedIcon />}
            </IconButton>
          </span>
        </Tooltip>
      ) : (
        <Tooltip title={computedTooltip}>
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
      )}

      {/* ===== Diálogo ===== */}
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
            <TextField
              type="date"
              label="Plazo de ejecución"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            {deadline && (
              <Typography variant="body2" color="text.secondary">
                ⏳ Tiempo restante: <b>{diasRestantes} días</b>
              </Typography>
            )}
            <Typography variant="body2" color="text.secondary">
              Destino: <b>{next ?? "—"}</b>
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDlg}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={confirmar}
            disabled={!by.trim()}
          >
            Enviar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AdvanceToNext;
