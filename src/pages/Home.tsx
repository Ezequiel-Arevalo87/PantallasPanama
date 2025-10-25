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
  Tabs,
  Tab,
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

// ==========================================================
//  Home con dos pestañas: "Tareas sin realizar" y "Realizadas"
//  - En "sin realizar" se muestran los casos cuyo estado !== "Aprobado"
//  - En "realizadas" se muestran los casos con estado === "Aprobado"
//  - Cuando un caso está Aprobado, el botón de ir a tarea se deshabilita
//    y se muestra un tooltip "Ya está aprobado".
// ==========================================================

type Props = {
  onGo?: (path: string) => void;
};

export const Home: React.FC<Props> = ({ onGo }) => {
  const [casos, setCasos] = useState<CasoFlujo[]>([]);
  const [tab, setTab] = useState<0 | 1>(0); // 0: pendientes, 1: realizadas
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

  const pendientes = useMemo(
    () => casos.filter((c) => c.estado !== "Aprobado"),
    [casos]
  );
  const realizadas = useMemo(
    () => casos.filter((c) => c.estado === "Aprobado"),
    [casos]
  );

  // Colección activa según la pestaña
  const activos = tab === 0 ? pendientes : realizadas;

  const renderLinea = (c: CasoFlujo) => {
    const last = c.history?.[c.history.length - 1];
    const faseActual = (c.fase ?? "SELECTOR DE CASOS Y PRIORIZACIÓN") as FaseFlujo;
    const next = getNextFase(faseActual);

    const isAprobado = c.estado === "Aprobado";

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
              {isAprobado ? (
                <Tooltip title="Ya está aprobado">
                  {/* envolver en span para que Tooltip funcione con disabled */}
                  <span>
                    <IconButton disabled>
                      <VisibilityRoundedIcon />
                    </IconButton>
                  </span>
                </Tooltip>
              ) : (
                <AdvanceToNext
                  renderAs="icon"
                  tooltip="Ir a tarea"
                  casoId={c.id}
                  currentFase={faseActual}
                  defaultBy="Home"
                  onGo={onGo}
                  registerOpen={(fn) => openersRef.current.set(c.id, fn)}
                />
              )}
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
                {isAprobado && (
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
                    <b>{last.to}</b> • asignó <b>{last.by}</b> • {new Date(last.at).toLocaleString()}
                    {last.note ? ` • “${last.note}”` : ""} {next ? ` • Siguiente: ${next}` : ` • Flujo finalizado`}
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
                        diasRestantes <= 2
                          ? "error.main" // 0-2 días: rojo
                          : diasRestantes <= 5
                          ? "warning.main" // 3-5 días: amarillo
                          : "success.main", // >5 días: verde
                    }}
                  >
                    Fecha límite:{" "}
                    <b>
                      {new Date(c.deadline).toLocaleDateString()} ({diasRestantes} días restantes)
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
    (activos || []).forEach((c) => {
      const f = (c.fase ?? "SELECTOR DE CASOS Y PRIORIZACIÓN") as FaseFlujo;
      map.set(f, (map.get(f) ?? 0) + 1);
    });
    return map;
  }, [activos]);

  // Usamos el primer caso activo (solo para conectar el botón "Ver todos")
  const primerCaso = activos[0];
  const faseActual = (primerCaso?.fase ?? "SELECTOR DE CASOS Y PRIORIZACIÓN") as FaseFlujo;

  return (
    <Box sx={{ maxWidth: 1100, mx: "auto" }}>
      {/* ======== Tabs ======== */}
      <Paper variant="outlined" sx={{ mb: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} aria-label="tabs tareas">
          <Tab label={`Tareas sin realizar (${pendientes.length})`} />
          <Tab label={`Tareas realizadas (${realizadas.length})`} />
        </Tabs>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" fontWeight={700}>
          {tab === 0 ? "Bandeja de pasos" : "Tareas realizadas"}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {tab === 0
            ? "Avanza cada caso al siguiente paso. El botón cambia automáticamente: Selector → Verificación → Aprobación → Asignación → Inicio de auditoría."
            : "Listado de casos aprobados. No es posible abrir la tarea desde aquí."}
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

          {/* 🔹 Botón versión icono con tooltip “Ver todos” en la fase del primer caso activo */}
          {primerCaso && tab === 0 && (
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
          {activos.length ? (
            activos.map(renderLinea)
          ) : (
            <Box p={3}>
              <Typography color="text.secondary">
                {tab === 0 ? "No hay tareas pendientes." : "No hay tareas realizadas."}
              </Typography>
            </Box>
          )}
        </List>
      </Paper>
    </Box>
  );
};

export default Home;
