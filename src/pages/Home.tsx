// ==========================================
// src/pages/Home.tsx (VERSIÓN FINAL COMPLETA CON 10 TABS)
// ==========================================
import React, { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Stack,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Chip,
  Tooltip,
  Tabs,
  Tab,
} from "@mui/material";

import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import dayjs from "dayjs";
import { CASOS_KEY } from "../lib/aprobacionesStorage";

/* ==========================================
   TIPOS
========================================== */
type CasoVerif = {
  id: string | number;
  ruc: string;
  nombre: string;
  provincia: string;
  metaInconsistencia?: string;
  valor?: number;
  fechaAsignacionISO: string;
  estadoVerif: string;
  numeroAutoApertura?: string;
};

/* ==========================================
   TAB PANEL
========================================== */
function TabPanel(props: any) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      {...other}
      style={{ width: "100%" }}
    >
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

/* ==========================================
   COMPONENTE HOME
========================================== */
export default function Home({
  onGo,
  contexto,
}: {
  onGo?: (p: string) => void;
  contexto?: string;
}) {
  const [casos, setCasos] = useState<CasoVerif[]>([]);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<CasoVerif | null>(null);

  const [tab, setTab] = useState(0);

  /* ==========================================
     CARGA ORIGINAL (SE MANTIENE)
  ========================================== */
  useEffect(() => {
    const load = () => {
      try {
        const raw = localStorage.getItem(CASOS_KEY);
        const arr: CasoVerif[] = raw ? JSON.parse(raw) : [];
        setCasos(arr);
      } catch {
        setCasos([]);
      }
    };

    load();
    window.addEventListener("casosAprobacion:update", load);
    return () => window.removeEventListener("casosAprobacion:update", load);
  }, []);

  /* ==========================================
     SEMÁFORO
  ========================================== */
  const calcularDias = (f: string) => dayjs().diff(dayjs(f), "day");

  const renderSemaforo = (f: string) => {
    const d = calcularDias(f);
    return (
      <Chip
        size="small"
        color={d <= 1 ? "success" : "error"}
        label={d <= 1 ? "Día 1" : "Día 2"}
      />
    );
  };

  /* ==========================================
     CHIP DE ESTADO
  ========================================== */
  const chipEstado = (e: string) => {
    const map: any = {
      Pendiente: <Chip size="small" label="Pendiente" />,
      ParaAprobacion: (
        <Chip size="small" color="info" label="Para Aprobación" />
      ),
      Aprobado: <Chip size="small" color="success" label="Aprobado" />,
      Asignado: <Chip size="small" color="secondary" label="Asignado" />,
      Devuelto: <Chip size="small" color="warning" label="Devuelto" />,
      Rechazado: <Chip size="small" color="error" label="Rechazado" />,
    };

    return map[e] ?? <Chip size="small" label="Pendiente" />;
  };

  /* ==========================================
     DESTINO SEGÚN ESTADO
  ========================================== */
  const destinoPorEstado = (estado: string) => {
    if (estado === "ParaAprobacion") return "APROBACIÓN";
    if (estado === "Aprobado") return "ASIGNACIÓN";
    if (estado === "Asignado") return "ACTA DE INICIO";
    return "VERIFICACIÓN";
  };

  /* ==========================================
     FUNCIÓN PARA RENDERIZAR LA LISTA
  ========================================== */
  const renderLista = (lista: CasoVerif[]) => (
    <>
      {lista.map((c) => (
        <Paper key={c.id} sx={{ p: 2, mb: 2 }}>
          <Stack direction="row" justifyContent="space-between">
            <Box>
              <Stack direction="row" spacing={1}>
                <Typography fontWeight={700}>{c.nombre}</Typography>
                {renderSemaforo(c.fechaAsignacionISO)}
                {chipEstado(c.estadoVerif)}
              </Stack>

              <Typography>RUC: {c.ruc}</Typography>

              {c.numeroAutoApertura && (
                <Typography>
                  AUTO Nº: <b>{c.numeroAutoApertura}</b>
                </Typography>
              )}

              <Typography>Inconsistencia: {c.metaInconsistencia}</Typography>
            </Box>

            <IconButton
              onClick={() => {
                setSelected(c);
                setDetailOpen(true);
              }}
            >
              <InfoOutlinedIcon />
            </IconButton>
          </Stack>
        </Paper>
      ))}
    </>
  );

  /* ==========================================
     FILTROS POR TABS (DE MOMENTO VACÍOS)
     Luego tú agregas tus filtros reales
  ========================================== */
  const tabsData = [
    { label: "Verificación", data: casos }, // reemplazar filtro después
    { label: "Devolución Aprobación", data: casos },
    { label: "Aprobación", data: casos },
    { label: "Asignación", data: casos },
    { label: "Revisión Acta Inicio", data: casos },
    { label: "Rev Informe Auditoría", data: casos },
    { label: "Dev Informe Auditoría", data: casos },
    { label: "Rev Propuesta Regularización", data: casos },
    { label: "Dev Propuesta Regularización", data: casos },
    { label: "Revisión Resolución", data: casos },
  ];

  /* ==========================================
     RENDER PRINCIPAL
  ========================================== */
  return (
    <Box sx={{ maxWidth: 1100, mx: "auto", mt: 2 }}>
      {/* TÍTULO */}
      <Paper sx={{ p: 2, mb: 2 }} variant="outlined">
        <Typography variant="h6" fontWeight={700}>
          Panel de Casos
        </Typography>
      </Paper>

      {/* TABS */}
      <Paper variant="outlined">
        <Tabs
          value= {tab}
          onChange={(e, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
        >
          {tabsData.map((t, i) => (
            <Tab key={i} label={t.label} />
          ))}
        </Tabs>

        {/* CONTENIDO SEGÚN TAB */}
        {tabsData.map((t, i) => (
          <TabPanel key={i} value={tab} index={i}>
            <Typography fontWeight={600} sx={{ mb: 2 }}>
              {t.label} ({t.data.length})
            </Typography>

            {renderLista(t.data)}
          </TabPanel>
        ))}
      </Paper>

      {/* DIALOG DETALLE */}
      <Dialog
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Detalle del caso</DialogTitle>

        <DialogContent dividers>
          {selected && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography>
                  <b>Nombre:</b> {selected.nombre}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography>
                  <b>RUC:</b> {selected.ruc}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography>
                  <b>Provincia:</b> {selected.provincia}
                </Typography>
              </Grid>

              {selected.numeroAutoApertura && (
                <Grid item xs={12}>
                  <Typography>
                    <b>AUTO Nº:</b> {selected.numeroAutoApertura}
                  </Typography>
                </Grid>
              )}

              <Grid item xs={6}>
                <Typography>
                  <b>Valor:</b> B/. {selected.valor ?? 0}
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>

        <DialogActions>
          <Button variant="contained" onClick={() => setDetailOpen(false)}>
            Cerrar
          </Button>

          <Tooltip title="Ir a la Tarea">
            <Button
              variant="contained"
              color="primary"
              endIcon={<ArrowForwardIosIcon />}
              onClick={() => {
                setDetailOpen(false);
                if (selected) onGo?.(destinoPorEstado(selected.estadoVerif));
              }}
            >
              Ir a la tarea
            </Button>
          </Tooltip>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
