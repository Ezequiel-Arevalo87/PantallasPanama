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
  Button,
  Grid,
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
  uuid, // ⬅️ importante para idPaso
} from "../lib/workflowStorage";
import AdvanceToNext from "../components/AdvanceToNext";

/* ==========================================================
   Home con:
   - Pestañas: "Tareas sin realizar" y "Tareas realizadas"
   - Sistema de "No leídos" (localStorage: casosUnread)
   - Modo DEMO para cargar casos ejemplo (Auditor→Supervisor→Director)
   ========================================================== */

type Props = {
  onGo?: (path: string) => void;
};

const UNREAD_KEY = "casosUnread";
const asKey = (id: string | number) => String(id);

// === DEMO: helpers para deadlines y casos ===
const mkDeadline = (daysFromNow: number) => {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString();
};

const demoCasos: CasoFlujo[] = [
  // AUDITOR (INICIO DE AUDITORIA)
  {
    id: "A-001",
    nombre: "Panamá Retail S.A.",
    ruc: "RUC-100200",
    fase: "INICIO DE AUDITORIA",
    estado: "Pendiente",
    deadline: mkDeadline(7), // VERDE
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
    deadline: mkDeadline(2), // ROJO
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

  // SUPERVISOR (REVISIÓN SUPERVISOR)
  {
    id: "S-101",
    nombre: "Servicios del Istmo",
    ruc: "8-654-321",
    fase: "REVISIÓN SUPERVISOR",
    estado: "Pendiente",
    deadline: mkDeadline(4), // AMARILLO
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

  // DIRECTOR (REVISIÓN JEFE DE SECCIÓN)
  {
    id: "D-201",
    nombre: "TransLog S.A.",
    ruc: "8-123-456",
    fase: "REVISIÓN JEFE DE SECCIÓN",
    estado: "Pendiente",
    deadline: mkDeadline(1), // ROJO
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

  // Aprobados (para la pestaña "Realizadas")
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
];

function loadUnread(): Set<string> {
  try {
    const raw = localStorage.getItem(UNREAD_KEY);
    if (!raw) return new Set<string>();
    const arr = JSON.parse(raw) as string[];
    return new Set(arr);
  } catch {
    return new Set<string>();
  }
}
function saveUnread(s: Set<string>) {
  localStorage.setItem(UNREAD_KEY, JSON.stringify(Array.from(s)));
}

export const Home: React.FC<Props> = ({ onGo }) => {
  const [casos, setCasos] = useState<CasoFlujo[]>([]);
  const [tab, setTab] = useState<0 | 1>(0); // 0: pendientes, 1: realizadas
  const openersRef = useRef<Map<string | number, () => void>>(new Map());

  // No leídos
  const [unread, setUnread] = useState<Set<string>>(loadUnread());
  const [mostrarTodosPendientes, setMostrarTodosPendientes] = useState(false);

  // DEMO
  const [modoDemo, setModoDemo] = useState(false);

  const cargar = () => {
    if (modoDemo) return; // en demo no pisar
    setCasos(readCasosOrdenados());
  };

  useEffect(() => {
    cargar();
    const onAny = () => cargar();
    window.addEventListener("storage", onAny);
    window.addEventListener("casosAprobacion:update", onAny as any);
    return () => {
      window.removeEventListener("storage", onAny);
      window.removeEventListener("casosAprobacion:update", onAny as any);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modoDemo]);

  // Mantiene "no leídos" sincronizado con los casos cargados
  useEffect(() => {
    if (!casos.length) return;

    const next = new Set(unread);
    for (const c of casos) {
      const key = asKey(c.id);
      if (c.estado !== "Aprobado") {
        if (!next.has(key)) next.add(key); // nuevo pendiente => no leído
      } else {
        next.delete(key); // aprobados salen de no leídos
      }
    }
    if (next.size !== unread.size) {
      setUnread(next);
      saveUnread(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [casos]);

  const marcarLeido = (id: string | number) => {
    const next = new Set(unread);
    next.delete(asKey(id));
    setUnread(next);
    saveUnread(next);
  };

  const pendientes = useMemo(
    () => casos.filter((c) => c.estado !== "Aprobado"),
    [casos]
  );
  const realizadas = useMemo(
    () => casos.filter((c) => c.estado === "Aprobado"),
    [casos]
  );

  // En pestaña "pendientes": por defecto solo NO LEÍDOS (si el toggle está apagado)
  const pendientesFiltrados = useMemo(() => {
    if (mostrarTodosPendientes) return pendientes;
    return pendientes.filter((c) => unread.has(asKey(c.id)));
  }, [pendientes, mostrarTodosPendientes, unread]);

  // Colección activa según la pestaña
  const activos = tab === 0 ? pendientesFiltrados : realizadas;

  const getDiasRestantes = (c: CasoFlujo): number | null => {
    if (!c.deadline) return null;
    const hoy = new Date();
    const fin = new Date(c.deadline);
    const diff = Math.ceil((fin.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
    return diff >= 0 ? diff : 0;
  };

  const renderLinea = (c: CasoFlujo) => {
    const last = c.history?.[c.history.length - 1];
    const faseActual = (c.fase ?? "SELECTOR DE CASOS Y PRIORIZACIÓN") as FaseFlujo;
    const next = getNextFase(faseActual);
    const isAprobado = c.estado === "Aprobado";
    const diasRestantes = getDiasRestantes(c);
    const esNoLeido = unread.has(asKey(c.id));

    return (
      <React.Fragment key={String(c.id)}>
        <ListItem
          disableGutters
          alignItems="flex-start"
          sx={{
            pr: 1.5,
            "& .MuiListItemSecondaryAction-root": { right: 12 },
            bgcolor: esNoLeido ? "rgba(25, 118, 210, 0.06)" : undefined, // highlight no leído
          }}
          secondaryAction={
            <Box sx={{ mr: 1 }}>
              {isAprobado ? (
                <Tooltip title="Ya está aprobado">
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
                  onGo={(path) => {
                    marcarLeido(c.id); // marcar como leído al abrir
                    onGo?.(path);
                  }}
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
                {unread.has(asKey(c.id)) && <Chip size="small" color="info" label="No leído" />}
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

                {diasRestantes !== null && (
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
                      {new Date(c.deadline!).toLocaleDateString()} ({diasRestantes} días restantes)
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

  // Contadores de no leídos / leídos en pendientes
  const pendientesNoLeidos = pendientes.filter((c) => unread.has(asKey(c.id))).length;
  const pendientesLeidos = pendientes.length - pendientesNoLeidos;

  return (
    <Box sx={{ maxWidth: 1100, mx: "auto" }}>
      {/* ======== Controles de DEMO ======== */}
      <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mb: 1 }}>
        {!modoDemo ? (
          <Tooltip title="Cargar casos de ejemplo (Auditor → Supervisor → Director)">
            <Button
              size="small"
              variant="outlined"
              onClick={() => {
                setModoDemo(true);

                // Marcar como no leídos todos los demo que no estén aprobados
                const allIds = demoCasos
                  .filter((c) => c.estado !== "Aprobado")
                  .map((c) => String(c.id));
                localStorage.setItem(UNREAD_KEY, JSON.stringify(allIds));
                setUnread(new Set(allIds));

                // Normaliza history para garantizar idPaso en todos los steps
                const demoConIds = demoCasos.map((c:any) => ({
                  ...c,
                  history: (c.history ?? []).map((h:any) => ({
                    idPaso: h.idPaso ?? uuid(),
                    ...h,
                  })),
                }));

                // Sobreescribir lista activa con demo
                setCasos(demoConIds);
                setTab(0);
              }}
            >
              Cargar demo
            </Button>
          </Tooltip>
        ) : (
          <Tooltip title="Volver a los datos reales (storage)">
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
          </Tooltip>
        )}
      </Stack>

      {/* ======== Tabs ======== */}
      <Paper variant="outlined" sx={{ mb: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} aria-label="tabs tareas">
          <Tab label={`Tareas sin realizar (${pendientes.length}) • No leídos ${pendientesNoLeidos}`} />
          <Tab label={`Tareas realizadas (${realizadas.length})`} />
        </Tabs>
      </Paper>

      {tab === 0 && (
        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            alignItems={{ xs: "flex-start", sm: "center" }}
            justifyContent="space-between"
            spacing={1}
          >
            <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
              <Typography variant="h6" fontWeight={700}>
                Bandeja de pasos
              </Typography>
              <Chip size="small" label={`No leídos: ${pendientesNoLeidos}`} color="info" />
              <Chip size="small" label={`Leídos: ${pendientesLeidos}`} />
            </Stack>

            <FormControlLabel
              control={
                <Switch
                  checked={mostrarTodosPendientes}
                  onChange={(_, v) => setMostrarTodosPendientes(v)}
                />
              }
              label={mostrarTodosPendientes ? "Mostrar TODOS" : "Solo NO leídos"}
            />
          </Stack>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {mostrarTodosPendientes
              ? "Mostrando todas las tareas pendientes."
              : "Mostrando únicamente tareas pendientes no leídas."}
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

            {/* “Ver todos” en la fase del primer caso activo */}
            {primerCaso && (
              <AdvanceToNext
                renderAs="icon"
                tooltip="Ver todos"
                casoId={primerCaso.id}
                currentFase={faseActual}
                defaultBy="Home"
                onGo={(path) => {
                  marcarLeido(primerCaso.id);
                  onGo?.(path);
                }}
              />
            )}
          </Stack>
        </Paper>
      )}

      {tab === 1 && (
        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" fontWeight={700}>
            Tareas realizadas
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Listado de casos aprobados. No es posible abrir la tarea desde aquí.
          </Typography>
        </Paper>
      )}

      <Paper variant="outlined">
        <List disablePadding>
          {activos.length ? (
            activos.map(renderLinea)
          ) : (
            <Box p={3}>
              <Typography color="text.secondary">
                {tab === 0
                  ? mostrarTodosPendientes
                    ? "No hay tareas pendientes."
                    : "No hay tareas pendientes no leídas."
                  : "No hay tareas realizadas."}
              </Typography>
            </Box>
          )}
        </List>
      </Paper>
    </Box>
  );
};

export default Home;
