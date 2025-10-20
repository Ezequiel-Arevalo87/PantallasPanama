import React, { useEffect, useMemo, useState } from "react";
import {
  Box, Paper, List, ListItem, ListItemButton, ListItemText, ListItemAvatar,
  Avatar, Chip, Stack, Typography, Divider, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Tooltip
} from "@mui/material";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import SendIcon from "@mui/icons-material/Send";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import {
  readCasosOrdenados, getNextFase, avanzarCaso, FaseFlujo, CasoFlujo
} from "../lib/workflowStorage";

type DialogData = { open: boolean; caso?: CasoFlujo; next?: FaseFlujo; by: string; note: string };

export const Home: React.FC = () => {
  const [casos, setCasos] = useState<CasoFlujo[]>([]);
  const [dlg, setDlg] = useState<DialogData>({ open: false, by: "", note: "" });

  const cargar = () => setCasos(readCasosOrdenados());

  useEffect(() => {
    cargar();
    const onAny = () => cargar();
    window.addEventListener("storage", onAny);
    window.addEventListener("casosAprobacion:update", onAny as any);
    return () => {
      window.removeEventListener("storage", onAny);
      window.removeEventListener("casosAprobacion:update", onAny as any);
    };
  }, []);

  const abrirDialogo = (caso: CasoFlujo) => {
    const next = getNextFase(caso.fase ?? "SELECTOR DE CASOS Y PRIORIZACIÓN");
    if (!next) return;
    setDlg({ open: true, caso, next, by: "", note: "" });
  };

  const confirmarEnvio = () => {
    if (!dlg.caso || !dlg.next) return;
    avanzarCaso({ id: dlg.caso.id, to: dlg.next, by: dlg.by || "Sistema", note: dlg.note });
    setDlg({ open: false, by: "", note: "" });
  };

  const renderLinea = (c: CasoFlujo) => {
    const last = c.history?.[c.history.length - 1];
    const next = getNextFase(c.fase);
    return (
        
      <React.Fragment key={String(c.id)}>
        <ListItem disableGutters alignItems="flex-start">
          <ListItemAvatar>
            <Avatar>
              <MailOutlineIcon />
            </Avatar>
          </ListItemAvatar>

          <ListItemText
            primary={
              <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                <Typography fontWeight={700}>{c.nombre || "(Sin nombre)"} </Typography>
                <Typography color="text.secondary">• RUC {c.ruc || "—"}</Typography>
                <Chip size="small" label={c.fase ?? "SELECTOR DE CASOS Y PRIORIZACIÓN"} sx={{ ml: 1 }} />
                {c.estado === "Aprobado" && (
                  <Chip size="small" color="success" icon={<CheckCircleOutlineIcon />} label="Aprobado" />
                )}
              </Stack>
            }
            secondary={
              <Box mt={0.5}>
                {last ? (
                  <Typography variant="body2" color="text.secondary">
                    {last.from ? `De ${last.from} → ` : ""}
                    <b>{last.to}</b> • asignó <b>{last.by}</b> • {new Date(last.at).toLocaleString()}
                    {last.note ? ` • “${last.note}”` : ""}
                  </Typography>
                ) : (
                  <Typography variant="body2" color="text.secondary">Sin historial</Typography>
                )}
              </Box>
            }
          />

          <Stack direction="row" spacing={1} ml={2}>
            <Tooltip title={next ? `Enviar a ${next}` : "Flujo finalizado"}>
              <span>
                <Button
                  variant="contained"
                  size="small"
                  endIcon={<SendIcon />}
                  disabled={!next}
                  onClick={() => abrirDialogo(c)}
                >
                  {next ? `Enviar a ${next}` : "Completado"}
                </Button>
              </span>
            </Tooltip>
          </Stack>
        </ListItem>
        <Divider component="li" />
      </React.Fragment>
    );
  };

  const totalPorFase = useMemo(() => {
    const map = new Map<FaseFlujo, number>();
    casos.forEach((c) => {
      const f = (c.fase ?? "SELECTOR DE CASOS Y PRIORIZACIÓN") as FaseFlujo;
      map.set(f, (map.get(f) ?? 0) + 1);
    });
    return map;
  }, [casos]);

  return (
    <Box sx={{ maxWidth: 1100, mx: "auto" }}>
      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" fontWeight={700}>Bandeja de pasos</Typography>
        <Typography variant="body2" color="text.secondary">
          Aquí verás el recorrido de cada caso como si fuera un hilo de correo: quién lo asignó,
          a qué etapa pasó y cuándo.
        </Typography>
        <Stack direction="row" spacing={1} mt={1} flexWrap="wrap">
          {Array.from(totalPorFase.entries()).map(([fase, n]) => (
            <Chip key={fase} label={`${fase}: ${n}`} />
          ))}
        </Stack>
      </Paper>

      <Paper variant="outlined">
        <List disablePadding>
          {casos.length ? casos.map(renderLinea) : (
            <Box p={3}><Typography color="text.secondary">Sin casos por mostrar.</Typography></Box>
          )}
        </List>
      </Paper>

      {/* Dialogo para registrar "quién lo asigna" */}
      <Dialog open={dlg.open} onClose={() => setDlg({ open: false, by: "", note: "" })} fullWidth maxWidth="sm">
        <DialogTitle>Enviar al siguiente paso</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <TextField
              label="Quién asigna"
              value={dlg.by}
              onChange={(e) => setDlg((d) => ({ ...d, by: e.target.value }))}
              autoFocus
              required
            />
            <TextField
              label="Nota (opcional)"
              value={dlg.note}
              onChange={(e) => setDlg((d) => ({ ...d, note: e.target.value }))}
              multiline minRows={2}
            />
            <Typography variant="body2" color="text.secondary">
              Destino: <b>{dlg.next ?? "—"}</b>
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDlg({ open: false, by: "", note: "" })}>Cancelar</Button>
          <Button variant="contained" onClick={confirmarEnvio} disabled={!dlg.by.trim()}>
            Enviar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Home;
