import * as React from "react";
import {
  Box,
  Paper,
  Button,
  Typography,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Tabs,
  Tab,
} from "@mui/material";

import Trazabilidad, { type TrazaItem } from "../components/Trazabilidad";

const fmtMoneyUS = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

// Periodos estáticos como el archivo original
const PERIODOS_FIJOS = ["dic-20", "dic-21", "dic-22", "dic-23", "dic-24", "dic-25"];

// Calcula montos por periodo según total
function buildBreakdown(valor: number) {
  const total = valor || 0;
  const cant = PERIODOS_FIJOS.length;

  return {
    items: PERIODOS_FIJOS.map((p) => ({
      periodo: p,
      monto: total / cant,
    })),
    total,
  };
}

type Props = {
  open: boolean;
  onClose: () => void;
  caso: any;
};

export default function DetalleCasoModal({ open, onClose, caso }: Props) {
  const [tab, setTab] = React.useState(0);

  if (!caso) return null;

  const detalle = {
    categoria: caso.metaCategoria ?? caso.categoria ?? "—",
    inconsistencia: caso.metaInconsistencia ?? caso.inconsistencia ?? "—",
    provincia: caso.provincia ?? "—",
    impuesto: caso.metaImpuesto ?? caso.impuesto ?? "—",
    zona: caso.metaZonaEspecial ?? caso.zona ?? "—",
    actividad:
      caso.metaActividadEconomica?.length
        ? caso.metaActividadEconomica.join(", ")
        : caso.actividad ?? "—",
    periodoInicial: caso.metaPeriodoInicial ?? "—",
    periodoFinal: caso.metaPeriodoFinal ?? "—",
    valorNum: caso.valor ?? caso.valorNum ?? 0,
    trazas: caso.trazas ?? [],
  };

  const breakdown = buildBreakdown(detalle.valorNum);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Detalle del caso</DialogTitle>

      <DialogContent dividers>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
          <Tab label="Información" />
          <Tab label="Trazabilidad" />
        </Tabs>

        {/* ====================== TAB INFORMACIÓN ======================= */}
        {tab === 0 && (
          <Grid container spacing={2}>
            {/* CATEGORÍA */}
            <Grid item xs={12} md={4}>
              <Typography variant="caption">Categoría</Typography>
              <Paper sx={{ p: 1 }}>{detalle.categoria}</Paper>
            </Grid>

            {/* INCONSISTENCIA */}
            <Grid item xs={12} md={4}>
              <Typography variant="caption">Inconsistencia</Typography>
              <Paper sx={{ p: 1 }}>{detalle.inconsistencia}</Paper>
            </Grid>

            {/* PROVINCIA */}
            <Grid item xs={12} md={4}>
              <Typography variant="caption">Provincia</Typography>
              <Paper sx={{ p: 1 }}>{detalle.provincia}</Paper>
            </Grid>

            {/* IMPUESTO */}
            <Grid item xs={12} md={4}>
              <Typography variant="caption">Impuesto</Typography>
              <Paper sx={{ p: 1 }}>{detalle.impuesto}</Paper>
            </Grid>

            {/* ZONA ESPECIAL */}
            <Grid item xs={12} md={4}>
              <Typography variant="caption">Zona Especial</Typography>
              <Paper sx={{ p: 1 }}>{detalle.zona}</Paper>
            </Grid>

            {/* ACTIVIDAD */}
            <Grid item xs={12}>
              <Typography variant="caption">Actividad Económica</Typography>
              <Paper sx={{ p: 1 }}>{detalle.actividad}</Paper>
            </Grid>

            {/* PERIODO INICIAL */}
            <Grid item xs={12} md={6}>
              <Typography variant="caption">Período Inicial</Typography>
              <Paper sx={{ p: 1 }}>{detalle.periodoInicial}</Paper>
            </Grid>

            {/* PERIODO FINAL */}
            <Grid item xs={12} md={6}>
              <Typography variant="caption">Período Final</Typography>
              <Paper sx={{ p: 1 }}>{detalle.periodoFinal}</Paper>
            </Grid>

            {/* TABLA DE MONTOS */}
            <Grid item xs={12}>
              <Typography sx={{ mt: 2 }} variant="subtitle2">
                Distribución por períodos
              </Typography>

              <Table size="small" sx={{ mt: 1 }}>
                <TableHead>
                  <TableRow>
                    {breakdown.items.map((it) => (
                      <TableCell key={it.periodo} align="right">
                        {it.periodo}
                      </TableCell>
                    ))}
                    <TableCell align="right">
                      <b>Total</b>
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  <TableRow>
                    {breakdown.items.map((it) => (
                      <TableCell key={it.periodo} align="right">
                        {fmtMoneyUS.format(it.monto)}
                      </TableCell>
                    ))}
                    <TableCell align="right">
                      <b>{fmtMoneyUS.format(breakdown.total)}</b>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Grid>
          </Grid>
        )}

        {/* ====================== TAB TRAZABILIDAD ======================= */}
        {tab === 1 && (
          <Trazabilidad rows={detalle.trazas} height={360} />
        )}
      </DialogContent>

      <DialogActions>
        <Button variant="contained" onClick={onClose}>
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
