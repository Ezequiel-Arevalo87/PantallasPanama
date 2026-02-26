import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  MenuItem,
  Switch,
  FormControlLabel,
  Typography,
  Divider,
  Stack,
} from "@mui/material";
import type { AlertaParam, FrecuenciaCorreo } from "../services/mockParamAlertas";

type Mode = "create" | "edit";

type Props = {
  open: boolean;
  mode: Mode;
  value: AlertaParam;
  onClose: () => void;
  onSubmit: (next: AlertaParam) => void;
  validateRow: (r: AlertaParam) => string | null;
  frecuenciaOptions?: FrecuenciaCorreo[];
};

const FRECUENCIAS_DEFAULT: FrecuenciaCorreo[] = ["Unica", "Diaria", "Semanal"];

function num(v: any, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export default function AlertRuleDialog({
  open,
  mode,
  value,
  onClose,
  onSubmit,
  validateRow,
  frecuenciaOptions = FRECUENCIAS_DEFAULT,
}: Props) {
  const [draft, setDraft] = useState<AlertaParam>(value);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const warn = useMemo(() => validateRow(draft), [draft, validateRow]);

  const set = <K extends keyof AlertaParam>(k: K, v: AlertaParam[K]) => {
    setDraft((p) => ({ ...p, [k]: v }));
  };

  const title = mode === "create" ? "Adicionar Parámetro de Alerta" : "Editar Parámetro de Alerta";
  const submitLabel = mode === "create" ? "Crear" : "Guardar cambios";

  const handleAskConfirm = () => {
    setConfirmOpen(true);
  };

  const handleConfirm = () => {
    setConfirmOpen(false);
    onSubmit(draft);
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>{title}</DialogTitle>

        <DialogContent dividers>
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              Define plazos, rangos y escalamiento. La validación avisa si hay inconsistencias.
            </Typography>

            <Grid container spacing={2}>
              {/* Identidad */}
              <Grid item xs={12} md={5}>
                <TextField
                  label="Actividad"
                  value={draft.actividad}
                  onChange={(e) => set("actividad", e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Producto"
                  value={draft.producto}
                  onChange={(e) => set("producto", e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  label="Rol Responsable"
                  value={draft.rolResponsable}
                  onChange={(e) => set("rolResponsable", e.target.value)}
                  fullWidth
                />
              </Grid>

              {/* Total días */}
              <Grid item xs={12} md={3}>
                <TextField
                  label="Total días permitidos"
                  type="number"
                  value={draft.totalDiasPermitidos}
                  onChange={(e) => set("totalDiasPermitidos", num(e.target.value, 0))}
                  fullWidth
                />
              </Grid>

              {/* Rangos */}
              <Grid item xs={12}>
                <Divider />
                <Typography variant="subtitle2" sx={{ mt: 1 }}>
                  Rangos (Semáforo)
                </Typography>
              </Grid>

              <Grid item xs={6} md={2}>
                <TextField
                  label="Verde desde"
                  type="number"
                  value={draft.verdeDesde}
                  onChange={(e) => set("verdeDesde", num(e.target.value))}
                  fullWidth
                />
              </Grid>
              <Grid item xs={6} md={2}>
                <TextField
                  label="Verde hasta"
                  type="number"
                  value={draft.verdeHasta}
                  onChange={(e) => set("verdeHasta", num(e.target.value))}
                  fullWidth
                />
              </Grid>

              <Grid item xs={6} md={2}>
                <TextField
                  label="Amarillo desde"
                  type="number"
                  value={draft.amarilloDesde}
                  onChange={(e) => set("amarilloDesde", num(e.target.value))}
                  fullWidth
                />
              </Grid>
              <Grid item xs={6} md={2}>
                <TextField
                  label="Amarillo hasta"
                  type="number"
                  value={draft.amarilloHasta}
                  onChange={(e) => set("amarilloHasta", num(e.target.value))}
                  fullWidth
                />
              </Grid>

              <Grid item xs={6} md={2}>
                <TextField
                  label="Rojo desde"
                  type="number"
                  value={draft.rojoDesde}
                  onChange={(e) => set("rojoDesde", num(e.target.value))}
                  fullWidth
                />
              </Grid>
              <Grid item xs={6} md={2}>
                <TextField
                  label="Rojo hasta"
                  type="number"
                  value={draft.rojoHasta}
                  onChange={(e) => set("rojoHasta", num(e.target.value))}
                  fullWidth
                />
              </Grid>

              {/* Escalamiento */}
              <Grid item xs={12}>
                <Divider />
                <Typography variant="subtitle2" sx={{ mt: 1 }}>
                  Escalamiento
                </Typography>
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  label="Esc. Amarillo (Rol 1)"
                  value={draft.escalamientoAmarilloRol1}
                  onChange={(e) => set("escalamientoAmarilloRol1", e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Esc. Rojo (Rol 1)"
                  value={draft.escalamientoRojoRol1}
                  onChange={(e) => set("escalamientoRojoRol1", e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Esc. Rojo (Rol 2)"
                  value={draft.escalamientoRojoRol2}
                  onChange={(e) => set("escalamientoRojoRol2", e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Esc. Rojo (Rol 3)"
                  value={draft.escalamientoRojoRol3 ?? ""}
                  onChange={(e) => set("escalamientoRojoRol3", e.target.value)}
                  fullWidth
                />
              </Grid>

              {/* Canales */}
              <Grid item xs={12}>
                <Divider />
                <Typography variant="subtitle2" sx={{ mt: 1 }}>
                  Canales / Indicadores
                </Typography>
              </Grid>

              <Grid item xs={12} md={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={!!draft.canalEnvioHome}
                      onChange={(e) => set("canalEnvioHome", e.target.checked)}
                    />
                  }
                  label="Canal Home"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={!!draft.canalEnvioCorreo}
                      onChange={(e) => set("canalEnvioCorreo", e.target.checked)}
                    />
                  }
                  label="Canal Correo"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Frecuencia correo"
                  select
                  value={draft.frecuenciaCorreo}
                  onChange={(e) => set("frecuenciaCorreo", e.target.value as FrecuenciaCorreo)}
                  fullWidth
                >
                  {frecuenciaOptions.map((f) => (
                    <MenuItem key={f} value={f}>
                      {f}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} md={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={!!draft.generaIndicadorConsolidado}
                      onChange={(e) => set("generaIndicadorConsolidado", e.target.checked)}
                    />
                  }
                  label="Genera indicador consolidado"
                />
              </Grid>

              {/* Observaciones */}
              <Grid item xs={12}>
                <TextField
                  label="Observaciones"
                  value={draft.observaciones ?? ""}
                  onChange={(e) => set("observaciones", e.target.value)}
                  fullWidth
                  multiline
                  minRows={2}
                />
              </Grid>
            </Grid>

            {warn ? (
              <Typography variant="body2" color="warning.main">
                ⚠ {warn}
              </Typography>
            ) : (
              <Typography variant="body2" color="success.main">
                ✓ Rangos OK
              </Typography>
            )}
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose}>Cancelar</Button>
          <Button variant="contained" onClick={handleAskConfirm}>
            {submitLabel}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmación interna */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Confirmar</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            {mode === "create"
              ? "¿Deseas crear esta nueva regla?"
              : "¿Deseas guardar los cambios de esta regla?"}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleConfirm}>
            Sí, continuar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}