import React, { useEffect, useMemo, useState } from "react";
import {
  Box, Paper, List, ListItem, ListItemText, ListItemAvatar,
  Avatar, Chip, Stack, Typography, Divider
} from "@mui/material";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import {
  readCasosOrdenados, getNextFase, FaseFlujo, CasoFlujo
} from "../lib/workflowStorage";
import AdvanceToNext from "../components/AdvanceToNext";

type Props = {
  onGo?: (path: string) => void; // callback para navegar
};

export const Home: React.FC<Props> = ({ onGo }) => {
  const [casos, setCasos] = useState<CasoFlujo[]>([]);

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

  const renderLinea = (c: CasoFlujo) => {
    const last = c.history?.[c.history.length - 1];
    const faseActual = (c.fase ?? "SELECTOR DE CASOS Y PRIORIZACIÓN") as FaseFlujo;
    const next = getNextFase(faseActual);

    return (
      <React.Fragment key={String(c.id)}>
        <ListItem disableGutters alignItems="flex-start"
          secondaryAction={
            <AdvanceToNext
              casoId={c.id}
              currentFase={faseActual}
              defaultBy="Home"
              onGo={onGo}
            />
          }
        >
          <ListItemAvatar>
            <Avatar><MailOutlineIcon /></Avatar>
          </ListItemAvatar>

          <ListItemText
            primary={
              <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                <Typography fontWeight={700}>{c.nombre || "(Sin nombre)"} </Typography>
                <Typography color="text.secondary">• RUC {c.ruc || "—"}</Typography>
                <Chip size="small" label={faseActual} sx={{ ml: 1 }} />
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
                    {next ? ` • Siguiente: ${next}` : ` • Flujo finalizado`}
                  </Typography>
                ) : (
                  <Typography variant="body2" color="text.secondary">Sin historial</Typography>
                )}
              </Box>
            }
          />
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
          Avanza cada caso al siguiente paso. El botón cambia automáticamente:
          Selector → Verificación → Aprobación → Asignación → Inicio de auditoría.
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
    </Box>
  );
};

export default Home;
