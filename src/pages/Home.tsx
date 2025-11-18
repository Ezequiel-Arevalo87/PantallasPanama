import React, { useEffect, useMemo, useState } from "react";
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
  Button,
} from "@mui/material";

import MailOutlineIcon from "@mui/icons-material/MailOutline";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";

import {
  readCasosOrdenados,
  uuid,
  CasoFlujo,
  FaseFlujo,
} from "../lib/workflowStorage";

/* ==========================================================
   Home
   ========================================================== */

type Props = {
  onGo?: (path: string) => void;
};

const UNREAD_KEY = "casosUnread";

const mkDeadline = (daysFromNow: number) => {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString();
};

// ================= DEMO ==================
const demoCasos: CasoFlujo[] = [
  {
    id: "A-001",
    nombre: "Panamá Retail S.A.",
    ruc: "RUC-100200",
    provincia: "Panamá",
    fase: "INICIO DE AUDITORIA",
    estado: "Pendiente",
    deadline: mkDeadline(7),
    history: [
      {
        idPaso: uuid(),
        from: "ASIGNACIÓN",
        to: "INICIO DE AUDITORIA",
        by: "Sistema",
        at: new Date().toISOString(),
      },
    ],
  },
  {
    id: "A-002",
    nombre: "Construcciones Istmo S.A.",
    ruc: "RUC-100201",
    provincia: "Panamá Oeste",
    fase: "INICIO DE AUDITORIA",
    estado: "Pendiente",
    deadline: mkDeadline(2),
    history: [
      {
        idPaso: uuid(),
        from: "ASIGNACIÓN",
        to: "INICIO DE AUDITORIA",
        by: "J. Supervisor",
        at: new Date().toISOString(),
      },
    ],
  },

  {
    id: "N-301",
    nombre: "GlobalTech S.A.",
    ruc: "RUC-400500",
    provincia: "Colón",
    fase: "NOTIFICACIÓN ACTA DE INICIO",
    estado: "Por Notificar",
    deadline: mkDeadline(1),
    history: [
      {
        idPaso: uuid(),
        from: "ASIGNACIÓN",
        to: "NOTIFICACIÓN ACTA DE INICIO",
        by: "Sistema",
        at: new Date().toISOString(),
      },
    ],
  },
];

// ================ Helpers ======================
function loadUnread(): Set<string> {
  try {
    const raw = localStorage.getItem(UNREAD_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

export const Home: React.FC<Props> = ({ onGo }) => {
  const [tab, setTab] = useState<0 | 1 | 2 | 3>(0);
  const [casos, setCasos] = useState<CasoFlujo[]>([]);
  const [modoDemo, setModoDemo] = useState(false);

  useEffect(() => {
    if (!modoDemo) setCasos(readCasosOrdenados());
  }, [modoDemo]);

  const getDiasRestantes = (c: CasoFlujo): number | null => {
    if (!c.deadline) return null;
    const hoy = new Date();
    const fin = new Date(c.deadline);
    return Math.ceil((fin.getTime() - hoy.getTime()) / 86400000);
  };

  const pendientes = casos.filter((c) => c.estado === "Pendiente");
  const realizadas = casos.filter((c) => c.estado === "Aprobado");
  const casosNotificar = casos.filter((c) => c.estado === "Por Notificar");

  const proximosAVencer = pendientes
    .filter((c) => {
      const d = getDiasRestantes(c);
      return d !== null && d <= 2;
    })
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime());

  const activos =
    tab === 0
      ? pendientes
      : tab === 1
      ? realizadas
      : tab === 2
      ? proximosAVencer
      : casosNotificar;

  // ============= LÍNEA DE CADA CASO (CON IR A LA TAREA + PROVINCIA) =============
  const renderLinea = (c: CasoFlujo) => {
    const last = c.history?.[c.history.length - 1];
    const diasRestantes = getDiasRestantes(c);

    const colorTexto =
      c.estado === "Por Notificar"
        ? diasRestantes !== null && diasRestantes <= 0
          ? "error.main"
          : "success.main"
        : diasRestantes !== null && diasRestantes <= 2
        ? "error.main"
        : diasRestantes !== null && diasRestantes <= 5
        ? "warning.main"
        : "success.main";

    return (
      <React.Fragment key={String(c.id)}>
        <ListItem
          disableGutters
          alignItems="flex-start"
          sx={{
            pr: 1.5,
            display: "flex",
          }}
        >
          <ListItemAvatar>
            <Avatar>
              <MailOutlineIcon />
            </Avatar>
          </ListItemAvatar>

          {/* INFO PRINCIPAL */}
          <ListItemText
            primary={
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Typography fontWeight={700}>{c.nombre}</Typography>
                <Typography color="text.secondary">• {c.ruc}</Typography>

                {/* 🔵 PROVINCIA */}
                <Typography color="text.secondary">• {c.provincia}</Typography>

                {c.estado === "Por Notificar" && (
                  <Chip size="small" color="warning" label="Por Notificar" />
                )}
              </Stack>
            }
            secondary={
              <Box mt={0.5}>
                {last && (
                  <Typography variant="body2" color="text.secondary">
                    {last.from ? `De ${last.from} → ` : ""}
                    <b>{last.to}</b> • asignó <b>{last.by}</b> •{" "}
                    {new Date(last.at).toLocaleString()}
                  </Typography>
                )}

                {diasRestantes !== null && (
                  <Typography variant="body2" sx={{ mt: 0.5, color: colorTexto }}>
                    Fecha límite:{" "}
                    <b>
                      {new Date(c.deadline!).toLocaleDateString()} ({diasRestantes} días)
                    </b>
                  </Typography>
                )}
              </Box>
            }
          />

          {/* 🔥 BOTÓN IR A LA TAREA – DINÁMICO POR FASE */}
          <Box sx={{ ml: "auto" }}>
            <Tooltip title="Ir a la tarea">
              <IconButton
                color="primary"
                onClick={() => onGo?.(c.fase ?? "HOME")}
              >
                <VisibilityRoundedIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </ListItem>

        <Divider component="li" />
      </React.Fragment>
    );
  };

  return (
    <Box sx={{ maxWidth: 1100, mx: "auto" }}>
      {/* Modo demo */}
      <Stack direction="row" justifyContent="flex-end" mb={1}>
        {!modoDemo ? (
          <Button
            size="small"
            variant="outlined"
            onClick={() => {
              setModoDemo(true);
              setCasos(demoCasos);
            }}
          >
            Cargar demo
          </Button>
        ) : (
          <Button
            size="small"
            variant="outlined"
            onClick={() => {
              setModoDemo(false);
              setCasos(readCasosOrdenados());
            }}
          >
            Salir de demo
          </Button>
        )}
      </Stack>

      {/* Tabs */}
      <Paper variant="outlined" sx={{ mb: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label={`Tareas sin realizar (${pendientes.length})`} />
          <Tab label={`Tareas realizadas (${realizadas.length})`} />
          <Tab label={`Próximos a vencer (≤2 días) (${proximosAVencer.length})`} />
          <Tab label={`Casos por notificar (${casosNotificar.length})`} />
        </Tabs>
      </Paper>

      {/* Lista */}
      <Paper variant="outlined">
        <List disablePadding>
          {activos.length ? (
            activos.map(renderLinea)
          ) : (
            <Box p={3}>
              <Typography align="center" color="text.secondary">
                {tab === 3
                  ? "No hay casos por notificar."
                  : tab === 2
                  ? "No hay próximos a vencer."
                  : tab === 1
                  ? "No hay tareas realizadas."
                  : "No hay tareas pendientes."}
              </Typography>
            </Box>
          )}
        </List>
      </Paper>
    </Box>
  );
};

export default Home;
