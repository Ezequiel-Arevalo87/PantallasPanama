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
  Button,
  Switch,
  FormControlLabel,
} from "@mui/material";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import {
  readCasosOrdenados,
  getNextFase,
  FaseFlujo,
  CasoFlujo,
  uuid,
} from "../lib/workflowStorage";
import AdvanceToNext from "../components/AdvanceToNext";

/* ==========================================================
   Home con:
   - Pestañas: "Tareas sin realizar", "Tareas realizadas",
               "Próximos a vencer (≤2 días)" y "Casos por notificar"
   ========================================================== */

type Props = {
  onGo?: (path: string) => void;
};

const UNREAD_KEY = "casosUnread";
const asKey = (id: string | number) => String(id);

const mkDeadline = (daysFromNow: number) => {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString();
};

// 🔹 Todos los ejemplos, incluyendo los nuevos "Por Notificar"
const demoCasos: CasoFlujo[] = [
  // AUDITOR
  {
    id: "A-001",
    nombre: "Panamá Retail S.A.",
    ruc: "RUC-100200",
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
        note: "Prioridad alta",
      },
    ],
  },

  // SUPERVISOR
  {
    id: "S-101",
    nombre: "Servicios del Istmo",
    ruc: "8-654-321",
    fase: "REVISIÓN SUPERVISOR",
    estado: "Pendiente",
    deadline: mkDeadline(4),
    history: [
      {
        idPaso: uuid(),
        from: "INICIO DE AUDITORIA",
        to: "REVISIÓN SUPERVISOR",
        by: "Auditor A. Pérez",
        at: new Date().toISOString(),
      },
    ],
  },

  // DIRECTOR
  {
    id: "D-201",
    nombre: "TransLog S.A.",
    ruc: "8-123-456",
    fase: "REVISIÓN JEFE DE SECCIÓN",
    estado: "Pendiente",
    deadline: mkDeadline(1),
    history: [
      {
        idPaso: uuid(),
        from: "REVISIÓN SUPERVISOR",
        to: "REVISIÓN JEFE DE SECCIÓN",
        by: "Supervisor M. Lara",
        at: new Date().toISOString(),
      },
    ],
  },

  // APROBADOS
  {
    id: "OK-01",
    nombre: "Café del Barrio",
    ruc: "RUC-200300",
    fase: "CIERRE",
    estado: "Aprobado",
    deadline: mkDeadline(10),
    history: [
      {
        idPaso: uuid(),
        from: "REVISIÓN JEFE DE SECCIÓN",
        to: "CIERRE",
        by: "Director L. Gómez",
        at: new Date().toISOString(),
        note: "Aprobado",
      },
    ],
  },
  {
    id: "OK-02",
    nombre: "Electro Hogar",
    ruc: "RUC-300400",
    fase: "CIERRE",
    estado: "Aprobado",
    deadline: mkDeadline(12),
    history: [
      {
        idPaso: uuid(),
        from: "REVISIÓN SUPERVISOR",
        to: "CIERRE",
        by: "Director L. Gómez",
        at: new Date().toISOString(),
        note: "Aprobado sin observaciones",
      },
    ],
  },

  // 🟢 NUEVOS: CASOS POR NOTIFICAR (plazo 1 día)
  {
    id: "N-301",
    nombre: "GlobalTech S.A.",
    ruc: "RUC-400500",
    fase: "NOTIFICACIÓN ACTA DE INICIO" as FaseFlujo,
    estado: "Por Notificar",
    deadline: mkDeadline(1), // día actual → verde
    history: [
      {
        idPaso: uuid(),
        from: "ASIGNACIÓN" as FaseFlujo,
        to: "NOTIFICACIÓN ACTA DE INICIO" as FaseFlujo,
        by: "Sistema",
        at: new Date().toISOString(),
      },
    ],
  },
  {
    id: "N-302",
    nombre: "Alimentos del Norte S.A.",
    ruc: "RUC-400501",
    fase: "NOTIFICACIÓN ACTA DE INICIO" as FaseFlujo,
    estado: "Por Notificar",
    deadline: mkDeadline(-1), // ya vencido → rojo
    history: [
      {
        idPaso: uuid(),
        from: "ASIGNACIÓN" as FaseFlujo,
        to: "NOTIFICACIÓN ACTA DE INICIO" as FaseFlujo,
        by: "Supervisor M. Lara",
        at: new Date().toISOString(),
        note: "No contactado",
      },
    ],
  },
];

function loadUnread(): Set<string> {
  try {
    const raw = localStorage.getItem(UNREAD_KEY);
    if (!raw) return new Set<string>();
    return new Set(JSON.parse(raw));
  } catch {
    return new Set<string>();
  }
}
function saveUnread(s: Set<string>) {
  localStorage.setItem(UNREAD_KEY, JSON.stringify(Array.from(s)));
}

export const Home: React.FC<Props> = ({ onGo }) => {
  const [tab, setTab] = useState<0 | 1 | 2 | 3>(0);
  const [casos, setCasos] = useState<CasoFlujo[]>([]);
  const [modoDemo, setModoDemo] = useState(false);
  const [unread, setUnread] = useState<Set<string>>(loadUnread());

  const getDiasRestantes = (c: CasoFlujo): number | null => {
    if (!c.deadline) return null;
    const hoy = new Date();
    const fin = new Date(c.deadline);
    return Math.ceil((fin.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
  };

  const pendientes = useMemo(
    () => casos.filter((c) => c.estado === "Pendiente"),
    [casos]
  );
  const realizadas = useMemo(
    () => casos.filter((c) => c.estado === "Aprobado"),
    [casos]
  );
  const casosPorNotificar = useMemo(
    () => casos.filter((c) => c.estado === "Por Notificar"),
    [casos]
  );

  const proximosAVencer = useMemo(() => {
    const list = pendientes.filter((c) => {
      const d = getDiasRestantes(c);
      return d !== null && d <= 2;
    });
    return list.sort(
      (a, b) =>
        new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime()
    );
  }, [pendientes]);

  const activos =
    tab === 0
      ? pendientes
      : tab === 1
      ? realizadas
      : tab === 2
      ? proximosAVencer
      : casosPorNotificar;

  const renderLinea = (c: CasoFlujo) => {
    const last = c.history?.[c.history.length - 1];
    const diasRestantes = getDiasRestantes(c);

    // 🔹 Color especial para los casos por notificar
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
        <ListItem disableGutters alignItems="flex-start" sx={{ pr: 1.5 }}>
          <ListItemAvatar>
            <Avatar>
              <MailOutlineIcon />
            </Avatar>
          </ListItemAvatar>
          <ListItemText
            primary={
              <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                <Typography fontWeight={700}>{c.nombre}</Typography>
                <Typography color="text.secondary">• {c.ruc}</Typography>
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
                    {last.note ? ` • “${last.note}”` : ""}
                  </Typography>
                )}

                {diasRestantes !== null && (
                  <Typography variant="body2" sx={{ mt: 0.5, color: colorTexto }}>
                    Fecha límite:{" "}
                    <b>
                      {new Date(c.deadline!).toLocaleDateString()} (
                      {diasRestantes} días restantes)
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

  return (
    <Box sx={{ maxWidth: 1100, mx: "auto" }}>
      {/* DEMO */}
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
          <Tab label={`Casos por notificar (${casosPorNotificar.length})`} />
        </Tabs>
      </Paper>

      {tab === 3 && (
        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" fontWeight={700}>
            Casos por notificar
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Estos casos tienen 1 día de plazo.  
            <b style={{ color: "green" }}> Verde</b> = dentro del día.  
            <b style={{ color: "red" }}> Rojo</b> = vencido.
          </Typography>
        </Paper>
      )}

      <Paper variant="outlined">
        <List disablePadding>
          {activos.length ? (
            activos.map(renderLinea)
          ) : (
            <Box p={3}>
              <Typography color="text.secondary" align="center">
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
