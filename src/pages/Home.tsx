// src/pages/Home.tsx
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

  // ================================
  // CARGAR CASOS QUE VAN A VERIFICACIÓN
  // ================================
  useEffect(() => {
    const load = () => {
      try {
        const raw = localStorage.getItem(CASOS_KEY);
        const arr = raw ? JSON.parse(raw) : [];

        // Filtramos solo casos que aun estén en verificación
        const pending = arr.filter((r: any) => 
          !r.estadoVerif || r.estadoVerif === "Pendiente"
        );

        setCasos(pending);
      } catch {
        setCasos([]);
      }
    };

    load();
    window.addEventListener("casosAprobacion:update", load);
    return () => window.removeEventListener("casosAprobacion:update", load);
  }, []);

  // ================================
  // SEMÁFORO (Día 1 / Día 2)
  // ================================
  const calcularDias = (fechaISO: string) => {
    return dayjs().diff(dayjs(fechaISO), "day");
  };

  const renderSemaforo = (fechaISO: string) => {
    const d = calcularDias(fechaISO);
    return (
      <Chip
        size="small"
        color={d <= 1 ? "success" : "error"}
        label={d <= 1 ? "Día 1" : "Día 2"}
      />
    );
  };

  // ================================
  // RENDER
  // ================================
  return (
    <Box sx={{ maxWidth: 1100, mx: "auto", mt: 2 }}>
      {/* TITULO */}
      <Paper sx={{ p: 2, mb: 2 }} variant="outlined">
        <Typography variant="h6" fontWeight={700}>
          Notificación de casos pendientes de verificación
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Estos casos han sido enviados desde el Selector y requieren verificación.
        </Typography>
      </Paper>

      {/* LISTA */}
      <Paper variant="outlined">
        <Box sx={{ p: 2 }}>
          <Typography fontWeight={600} sx={{ mb: 2 }}>
            Casos pendientes ({casos.length})
          </Typography>

          {casos.map((c) => (
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
                    {renderSemaforo(c.fechaAsignacionISO)}
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
          ))}

          {!casos.length && (
            <Typography color="text.secondary">No hay casos pendientes.</Typography>
          )}
        </Box>
      </Paper>

      {/* DIALOG DETALLE */}
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
                <Typography><b>Nombre:</b> {selected.nombre}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography><b>RUC:</b> {selected.ruc}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography><b>Provincia:</b> {selected.provincia}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography><b>Inconsistencia:</b> {selected.metaInconsistencia}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography><b>Valor:</b> B/. {selected.valor?.toLocaleString()}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography>
                  <b>Fecha asignación:</b> {dayjs(selected.fechaAsignacionISO).format("DD/MM/YYYY")}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography><b>Semaforización:</b></Typography>
                {renderSemaforo(selected.fechaAsignacionISO)}
              </Grid>
            </Grid>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setDetailOpen(false)}>Cerrar</Button>

          <Button
            variant="contained"
            onClick={() => {
              setDetailOpen(false);
              if (onGo) onGo("PROCESOS DE AUDITORIAS/AUDITOR/VERIFICACIÓN");
            }}
          >
            Ir a Verificación
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
