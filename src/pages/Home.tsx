// ==========================================
// src/pages/Home.tsx
// ==========================================
import React, { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Stack,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Chip,
} from "@mui/material";

import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { CASOS_KEY } from "../lib/aprobacionesStorage";
import dayjs from "dayjs";

type CasoVerif = {
  id: string | number;
  ruc: string;
  nombre: string;
  provincia: string;
  metaInconsistencia?: string;
  valor?: number;
  fechaAsignacionISO: string;
  estadoVerif?: string;
};

export default function Home({ onGo }: { onGo?: (p: string) => void }) {
  const [casos, setCasos] = useState<CasoVerif[]>([]);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<CasoVerif | null>(null);

  // ===================== CARGAR TODOS =====================
  useEffect(() => {
    const load = () => {
      try {
        const raw = localStorage.getItem(CASOS_KEY);
        const arr = raw ? JSON.parse(raw) : [];

        // 🔥 Home solo muestra los casos que AÚN están en el flujo
        const vivos = arr.filter((c: any) =>
          ["Pendiente", "Devuelto", "Ampliar", "ParaAprobacion"].includes(
            c.estadoVerif
          )
        );

        setCasos(vivos);
      } catch {
        setCasos([]);
      }
    };

    load();
    window.addEventListener("casosAprobacion:update", load);
    return () =>
      window.removeEventListener("casosAprobacion:update", load);
  }, []);

  // ===================== SEMÁFORO =====================
  const calcularDias = (fechaISO: string) =>
    dayjs().diff(dayjs(fechaISO), "day");

  const renderSemaforo = (fechaISO: string) => {
    const d = calcularDias(fechaISO);
    const verde = d <= 1;

    return (
      <Chip
        size="small"
        color={verde ? "success" : "error"}
        label={verde ? "Día 1" : "Día 2"}
      />
    );
  };

  // ===================== BOTÓN DINÁMICO =====================
  const nextStepFor = (c: CasoVerif) => {
    switch (c.estadoVerif) {
      case "Pendiente":
      case "Devuelto":
      case "Ampliar":
        return { txt: "IR A VERIFICACIÓN", ruta: "VERIFICACIÓN" };

      case "ParaAprobacion":
        return { txt: "IR A APROBACIÓN", ruta: "APROBACIÓN" };

      default:
        return { txt: "CERRAR", ruta: null };
    }
  };

  const chipEstado = (estado?: string) => {
    switch (estado) {
      case "Aprobado":
        return <Chip size="small" color="success" label="Aprobado" />;
      case "Devuelto":
        return <Chip size="small" color="warning" label="Devuelto" />;
      case "Ampliar":
        return <Chip size="small" color="info" label="Ampliar" />;
      case "ParaAprobacion":
        return <Chip size="small" color="primary" label="Para aprobación" />;
      default:
        return <Chip size="small" label="Pendiente" />;
    }
  };

  // ===================== RENDER =====================
  return (
    <Box sx={{ maxWidth: 1100, mx: "auto", mt: 2 }}>
      <Paper sx={{ p: 2, mb: 2 }} variant="outlined">
        <Typography variant="h6" fontWeight={700}>
          Notificación de casos pendientes del flujo
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Casos provenientes de Priorización, Verificación y Aprobación.
        </Typography>
      </Paper>

      <Paper variant="outlined">
        <Box sx={{ p: 2 }}>
          <Typography fontWeight={600} sx={{ mb: 2 }}>
            Casos activos del flujo ({casos.length})
          </Typography>

          {casos.map((c) => {
            const step = nextStepFor(c);

            return (
              <Paper
                key={c.id}
                sx={{
                  p: 2,
                  mb: 2,
                  border: "1px solid #e0e0e0",
                  borderRadius: 1,
                }}
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  spacing={2}
                >
                  <Box>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography fontWeight={700}>{c.nombre}</Typography>

                      {/* SEMÁFORO */}
                      {renderSemaforo(c.fechaAsignacionISO)}

                      {/* ESTADO */}
                      {chipEstado(c.estadoVerif)}
                    </Stack>

                    <Typography variant="body2">RUC: {c.ruc}</Typography>
                    <Typography variant="body2">
                      Inconsistencia: <b>{c.metaInconsistencia || "—"}</b>
                    </Typography>
                  </Box>

                  <IconButton
                    color="primary"
                    onClick={() => {
                      setSelected(c);
                      setDetailOpen(true);
                    }}
                  >
                    <InfoOutlinedIcon />
                  </IconButton>
                </Stack>
              </Paper>
            );
          })}

          {!casos.length && (
            <Typography color="text.secondary">
              No hay casos pendientes.
            </Typography>
          )}
        </Box>
      </Paper>

      {/* === DETALLE === */}
      <Dialog
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        maxWidth="sm"
        fullWidth
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

              <Grid item xs={6}>
                <Typography>
                  <b>Valor:</b> B/.{" "}
                  {selected.valor?.toLocaleString()}
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Typography>
                  <b>Fecha asignación:</b>{" "}
                  {dayjs(selected.fechaAsignacionISO).format("DD/MM/YYYY")}
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Typography>
                  <b>Semaforización:</b>
                </Typography>
                {renderSemaforo(selected.fechaAsignacionISO)}
              </Grid>
            </Grid>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setDetailOpen(false)}>Cerrar</Button>

          {selected && (
            <Button
              variant="contained"
              onClick={() => {
                const step = nextStepFor(selected);
                if (step?.ruta) onGo?.(step.ruta);
                setDetailOpen(false);
              }}
            >
              {nextStepFor(selected).txt}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
