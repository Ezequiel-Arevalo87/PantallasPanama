// ==========================================
// src/pages/Home.tsx
// ==========================================
import React, { useEffect, useState } from "react";
import {
  Box, Paper, Typography, Stack, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions, Button, Grid, Chip
} from "@mui/material";

import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
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

export default function Home({ onGo }: { onGo?: (p: string) => void }) {
  const [casos, setCasos] = useState<CasoVerif[]>([]);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<CasoVerif | null>(null);

  useEffect(() => {
    const load = () => {
      try {
        const raw = localStorage.getItem(CASOS_KEY);
        const arr: CasoVerif[] = raw ? JSON.parse(raw) : [];

        const filtered = arr.filter((r) =>
          r.estadoVerif !== "Aprobado" && r.estadoVerif !== "NoProductivo"
        );

        setCasos(filtered);
      } catch {
        setCasos([]);
      }
    };

    load();
    window.addEventListener("casosAprobacion:update", load);
    return () =>
      window.removeEventListener("casosAprobacion:update", load);
  }, []);

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
      ParaAprobacion: <Chip size="small" color="info" label="Para Aprobación" />,
      Devuelto: <Chip size="small" color="warning" label="Devuelto" />,
      Ampliar: <Chip size="small" color="secondary" label="Ampliar" />,
    };

    return map[e] ?? <Chip size="small" label="Pendiente" />;
  };

  return (
    <Box sx={{ maxWidth: 1100, mx: "auto", mt: 2 }}>
      <Paper sx={{ p: 2, mb: 2 }} variant="outlined">
        <Typography variant="h6" fontWeight={700}>
          Notificación de Casos
        </Typography>
      </Paper>

      <Paper variant="outlined">
        <Box sx={{ p: 2 }}>
          <Typography fontWeight={600}>Casos pendientes ({casos.length})</Typography>

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

              {/* BOTÓN DE IR */}
              <Button
                fullWidth
                sx={{ mt: 1 }}
                variant="contained"
                onClick={() =>
                  onGo?.(
                    c.estadoVerif === "ParaAprobacion"
                      ? "APROBACIÓN"
                      : "VERIFICACIÓN"
                  )
                }
              >
                {c.estadoVerif === "ParaAprobacion"
                  ? "Ir a Aprobación"
                  : "Ir a Verificación"}
              </Button>
            </Paper>
          ))}
        </Box>
      </Paper>

      {/* DETALLE */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} fullWidth maxWidth="sm">
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
                <Typography><b>Valor:</b> B/. {selected.valor}</Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>

        <DialogActions>
          <Button variant="contained" onClick={() => setDetailOpen(false)}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
