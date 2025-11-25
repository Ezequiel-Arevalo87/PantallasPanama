// ==========================================
// src/pages/Home.tsx (VERSIÓN FINAL CORREGIDA)
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
  Tooltip
} from "@mui/material";

import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import dayjs from "dayjs";
import { CASOS_KEY } from "../lib/aprobacionesStorage";

type CasoVerif = {
  id: string | number;
  ruc: string;
  nombre: string;
  provincia: string;
  metaInconsistencia?: string;
  valor?: number;
  fechaAsignacionISO: string;
  estadoVerif: string; 
};

export default function Home({
  onGo,
  contexto
}: {
  onGo?: (p: string) => void;
  contexto?: string;
}) {
  const [casos, setCasos] = useState<CasoVerif[]>([]);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<CasoVerif | null>(null);

  // ------------------------------------------
  // CARGA SEGÚN CONTEXTO
  // ------------------------------------------
// ------------------------------------------
// CARGA INTELIGENTE SEGÚN CONTEXTO
// ------------------------------------------
useEffect(() => {
  const load = () => {
    try {
      const raw = localStorage.getItem(CASOS_KEY);
      const arr: CasoVerif[] = raw ? JSON.parse(raw) : [];

      let filtrados: CasoVerif[] = [];

      // 🟦 VERIFICACIÓN: mostrar solo Pendientes
      if (contexto?.includes("VERIFICACION")) {
        filtrados = arr.filter(
          (r) => r.estadoVerif === "Pendiente"
        );
      }

      // 🟩 APROBACIÓN: mostrar solo los ParaAprobacion
      else if (contexto?.includes("APROBACION")) {
        filtrados = arr.filter(
          (r) => r.estadoVerif === "ParaAprobacion"
        );
      }

      // 🟧 ASIGNACIÓN: mostrar los que ya tienen aprobado
      else if (contexto?.includes("ASIGNACION")) {
        filtrados = arr.filter(
          (r) => r.estadoVerif === "Aprobado"
        );
      }

      // 🟨 HOME general: mostrar TODO lo que esté pendiente en etapa actual
      else {
        filtrados = arr.filter(
          (r) =>
            r.estadoVerif === "Pendiente" ||
            r.estadoVerif === "ParaAprobacion" ||
            r.estadoVerif === "Aprobado"
        );
      }

      setCasos(filtrados);
    } catch {
      setCasos([]);
    }
  };

  load();
  window.addEventListener("casosAprobacion:update", load);
  return () =>
    window.removeEventListener("casosAprobacion:update", load);
}, [contexto]);


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

  const chipEstado = (e: string) => {
    const map: any = {
      Pendiente: <Chip size="small" label="Pendiente" />,
      ParaAprobacion: (
        <Chip size="small" color="info" label="Para Aprobación" />
      ),
      Aprobado: <Chip size="small" color="success" label="Aprobado" />,
      Devuelto: <Chip size="small" color="warning" label="Devuelto" />,
      Rechazado: <Chip size="small" color="error" label="Rechazado" />
    };

    return map[e] ?? <Chip size="small" label="Pendiente" />;
  };

  const getDestino = () => {
    if (contexto?.includes("ASIGNACION")) {
      return "/acta-inicio/" + selected?.id;
    }
    if (selected?.estadoVerif === "ParaAprobacion") return "APROBACIÓN";
    return "VERIFICACIÓN";
  };

  return (
    <Box sx={{ maxWidth: 1100, mx: "auto", mt: 2 }}>
      <Paper sx={{ p: 2, mb: 2 }} variant="outlined">
        <Typography variant="h6" fontWeight={700}>
          {contexto?.includes("ASIGNACION")
            ? "Casos Aprobados para Asignación"
            : contexto?.includes("APROBACION")
            ? "Casos Pendientes por Aprobación"
            : "Casos Pendientes por Verificación"}
        </Typography>
      </Paper>

      <Paper variant="outlined">
        <Box sx={{ p: 2 }}>
          <Typography fontWeight={600}>
            {contexto?.includes("ASIGNACION")
              ? `Casos Aprobados (${casos.length})`
              : contexto?.includes("APROBACION")
              ? `Casos enviados por Verificación (${casos.length})`
              : `Casos enviados desde Priorización (${casos.length})`}
          </Typography>

          {casos.map((c) => (
            <Paper key={c.id} sx={{ p: 2, mb: 2 }}>
              <Stack direction="row" justifyContent="space-between">
                <Box>
                  <Stack direction="row" spacing={1}>
                    <Typography fontWeight={700}>{c.nombre}</Typography>
                    {renderSemaforo(c.fechaAsignacionISO)}
                    {chipEstado(c.estadoVerif)}
                  </Stack>

                  <Typography>RUC: {c.ruc}</Typography>
                  <Typography>
                    Inconsistencia: {c.metaInconsistencia}
                  </Typography>
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
        </Box>
      </Paper>

      {/* DETALLE */}
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

          {/* IR A LA TAREA */}
          <Tooltip title="Ir a la Tarea">
            <Button
              variant="contained"
              color="primary"
              endIcon={<ArrowForwardIosIcon />}
              onClick={() => {
                setDetailOpen(false);
                onGo?.(getDestino());
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
