// src/pages/Home.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Stack,
  Typography,
  Divider,
  Tooltip,
  IconButton,
} from "@mui/material";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import {
  readCasosOrdenados,
  getNextFase,
  FaseFlujo,
  CasoFlujo,
} from "../lib/workflowStorage";
import AdvanceToNext from "../components/AdvanceToNext";

type Props = {
  onGo?: (path: string) => void;
};

export const Home: React.FC<Props> = ({ onGo }) => {
  const [casos, setCasos] = useState<CasoFlujo[]>([]);
  const openersRef = useRef<Map<string | number, () => void>>(new Map());

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

    let diasRestantes: number | null = null;
    if (c.deadline) {
      const hoy = new Date();
      const fin = new Date(c.deadline);
      const diff = Math.ceil((fin.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
      diasRestantes = diff >= 0 ? diff : 0;
    }

    return (
      <React.Fragment key={String(c.id)}>
        <ListItem
          disableGutters
          alignItems="flex-start"
          sx={{
            pr: 1.5,
            "& .MuiListItemSecondaryAction-root": { right: 12 },
          }}
          secondaryAction={
            <Box sx={{ mr: 1 }}>
              <AdvanceToNext
                renderAs="icon"
                tooltip="Ir a tarea"
                casoId={c.id}
                currentFase={faseActual}
                defaultBy="Home"
                onGo={onGo}
                registerOpen={(fn) => openersRef.current.set(c.id, fn)}
              />
            </Box>
          }
        >
          <ListItemAvatar>
            <Avatar>
              <MailOutlineIcon />
            </Avatar>
          </ListItemAvatar>

          <ListItemText
            primary={
              <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                <Typography fontWeight={700}>{c.nombre || "(Sin nombre)"}</Typography>
                <Typography color="text.secondary">• RUC {c.ruc || "—"}</Typography>
                <Chip size="small" label={faseActual} sx={{ ml: 1 }} />
                {c.estado === "Aprobado" && (
                  <Chip
                    size="small"
                    color="success"
                    icon={<CheckCircleOutlineIcon />}
                    label="Aprobado"
                  />
                )}
              </Stack>
            }
            secondary={
              <Box mt={0.5}>
                {last ? (
                  <Typography variant="body2" color="text.secondary">
                    {last.from ? `De ${last.from} → ` : ""}
                    <b>{last.to}</b> • asignó <b>{last.by}</b> •{" "}
                    {new Date(last.at).toLocaleString()}
                    {last.note ? ` • “${last.note}”` : ""}{" "}
                    {next ? ` • Siguiente: ${next}` : ` • Flujo finalizado`}
                  </Typography>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Sin historial
                  </Typography>
                )}

                {c.deadline && diasRestantes !== null && (
                  <Typography
                    variant="body2"
                    sx={{
                      mt: 0.5,
                      color:
                        diasRestantes === 0
                          ? "error.main"
                          : diasRestantes <= 3
                          ? "warning.main"
                          : "text.secondary",
                    }}
                  >
                    Fecha límite:{" "}
                    <b>
                      {new Date(c.deadline).toLocaleDateString()} ({diasRestantes} días
                      restantes)
                    </b>
                  </Typography>
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

  // Usamos el primer caso (solo para conectar el botón "Ver todos")
  const primerCaso = casos[0];
  const faseActual = (primerCaso?.fase ?? "SELECTOR DE CASOS Y PRIORIZACIÓN") as FaseFlujo;

  return (
    <Box sx={{ maxWidth: 1100, mx: "auto" }}>
      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" fontWeight={700}>
          Bandeja de pasos
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Avanza cada caso al siguiente paso. El botón cambia automáticamente:
          Selector → Verificación → Aprobación → Asignación → Inicio de auditoría.
        </Typography>

        <Stack
          direction="row"
          spacing={1}
          mt={1}
          flexWrap="wrap"
          alignItems="center"
          justifyContent="space-between"
        >
          <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
            {Array.from(totalPorFase.entries()).map(([fase, n]) => (
              <Chip key={fase} label={`${fase}: ${n}`} />
            ))}
          </Stack>

          {/* 🔹 Mismo botón "Ir a tarea" pero versión icono con tooltip “Ver todos” */}
          {primerCaso && (
            <AdvanceToNext
              renderAs="icon"
              tooltip="Ver todos"
              casoId={primerCaso.id}
              currentFase={faseActual}
              defaultBy="Home"
              onGo={onGo}
            />
          )}
        </Stack>
      </Paper>

      <Paper variant="outlined">
        <List disablePadding>
          {casos.length ? (
            casos.map(renderLinea)
          ) : (
            <Box p={3}>
              <Typography color="text.secondary">Sin casos por mostrar.</Typography>
            </Box>
          )}
        </List>
      </Paper>
    </Box>
  );
};

export default Home;
