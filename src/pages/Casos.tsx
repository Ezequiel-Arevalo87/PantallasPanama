// src/pages/Casos.tsx
import * as React from "react";
import {
  Box, Paper, Button, Chip, Typography, Grid,
  Table, TableHead, TableRow, TableCell, TableBody,
  Dialog, DialogTitle, DialogContent, DialogActions
} from "@mui/material";
import { CASOS_KEY } from "../lib/aprobacionesStorage";

type Caso = {
  id: number | string;
  ruc: string;
  nombre: string;
  categoria?: string;
  metaCategoria?: string;
  auditor?: string;
  auditorAsignado?: string;
  fechaAsignacion?: string;
  asignado?: boolean;
  [k: string]: any;
};

type Props = {
  casos?: Caso[];              // Lista que te llega (opcional)
  auditoresUI?: string[];      // Auditores a mostrar (opcional)
  onRegresar?: () => void;
};

// === Helpers storage ===
function readStorage(): Caso[] {
  try {
    const raw = localStorage.getItem(CASOS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function mergeWithStorage(base: Caso[], storage: Caso[]): Caso[] {
  const byKey = new Map<string, Caso>();
  for (const s of storage) {
    const k = s.id != null ? `id:${String(s.id)}` : s.ruc ? `ruc:${String(s.ruc)}` : "";
    if (k) byKey.set(k, s);
  }
  return base.map((b) => {
    const k = b.id != null ? `id:${String(b.id)}` : b.ruc ? `ruc:${String(b.ruc)}` : "";
    const s = (k && byKey.get(k)) || undefined;
    if (!s) return b;
    return {
      ...b,
      categoria: s.metaCategoria ?? s.categoria ?? b.metaCategoria ?? b.categoria,
      metaCategoria: s.metaCategoria ?? b.metaCategoria,
      auditor: s.auditorAsignado ?? s.auditor ?? b.auditor,
      auditorAsignado: s.auditorAsignado ?? b.auditorAsignado,
      fechaAsignacion: s.fechaAsignacion ?? b.fechaAsignacion,
      asignado: s.asignado ?? b.asignado,
    };
  });
}

// === Cálculos ===
const CATS = ["Fiscalización Masiva", "Grandes Contribuyentes", "Auditoría Sectorial"];

function auditorOf(r: Caso) {
  return r.auditorAsignado ?? r.auditor ?? "Sin auditor";
}
function categoriaOf(r: Caso) {
  return r.metaCategoria ?? r.categoria ?? "Sin categoría";
}

function buildCounters(rows: Caso[]) {
  const counters = new Map<string, { [cat: string]: number; total: number }>();
  for (const r of rows) {
    const aud = auditorOf(r);
    const cat = categoriaOf(r);
    const row = counters.get(aud) ?? { total: 0 };
    row[cat] = (row[cat] ?? 0) + 1;
    row.total += 1;
    counters.set(aud, row);
  }
  // normaliza columnas
  for (const [, row] of counters) {
    for (const c of CATS) if (row[c] == null) row[c] = 0;
  }
  return counters;
}

const DEFAULT_AUDITORES = ["Auditor 1", "Auditor 2", "Auditor 3", "Auditor 4"];

const Casos: React.FC<Props> = ({ casos = [], auditoresUI = DEFAULT_AUDITORES, onRegresar }) => {
  const [rows, setRows] = React.useState<Caso[]>([]);
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [detailAuditor, setDetailAuditor] = React.useState<string | null>(null);

  const reload = React.useCallback(() => {
    const storage = readStorage();
    const base = casos.length > 0 ? casos : storage; // si no te pasan props, usa storage
    const merged = mergeWithStorage(base, storage);
    setRows(merged);
  }, [casos]);

  React.useEffect(() => { reload(); }, [reload]);

  // 🔔 Actualiza cuando manual dispara notifyAprobaciones()
  React.useEffect(() => {
    const onUpdate = () => reload();
    window.addEventListener("casosAprobacion:update", onUpdate);
    return () => window.removeEventListener("casosAprobacion:update", onUpdate);
  }, [reload]);

  const counters = React.useMemo(() => buildCounters(rows), [rows]);

  // auditores para mostrar (UI + los que realmente existen en data)
  const allAuditors = React.useMemo(() => {
    const found = Array.from(counters.keys());
    const set = new Set([...auditoresUI, ...found]);
    return Array.from(set);
  }, [counters, auditoresUI]);

  // === Detalle ===
  const openDetail = (aud: string) => {
    setDetailAuditor(aud);
    setDetailOpen(true);
  };
  const closeDetail = () => setDetailOpen(false);

  const detailRows = React.useMemo(() => {
    if (!detailAuditor) return [];
    return rows.filter((r) => auditorOf(r) === detailAuditor);
  }, [rows, detailAuditor]);

  return (
    <Box component={Paper} sx={{ p: 2 }}>
      <Grid container alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <Grid item><Typography variant="h6">Asignación automática</Typography></Grid>
        <Grid item><Chip size="small" variant="outlined" color="primary" label={`Total casos: ${rows.length}`} /></Grid>
      </Grid>

      <Box sx={{ border: "1px solid #CFD8DC", borderRadius: 1, overflow: "hidden" }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Auditor</TableCell>
              {CATS.map((c) => <TableCell key={c} align="center">{c}</TableCell>)}
              <TableCell align="center">TOTAL</TableCell>
              <TableCell align="center">ACCIÓN</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {allAuditors.map((aud) => {
              const row = counters.get(aud) ?? { total: 0, [CATS[0]]: 0, [CATS[1]]: 0, [CATS[2]]: 0 };
              return (
                <TableRow key={aud}>
                  <TableCell>{aud}</TableCell>
                  {CATS.map((c) => (
                    <TableCell key={c} align="center">{row[c] ?? 0}</TableCell>
                  ))}
                  <TableCell align="center">{row.total ?? 0}</TableCell>
                  <TableCell align="center">
                    <Button size="small" variant="contained" onClick={() => openDetail(aud)}>
                      DETALLE
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Box>

      <Box mt={2}>
        <Button variant="contained" onClick={onRegresar}>REGRESAR</Button>
      </Box>

      {/* === Dialog Detalle por Auditor === */}
      <Dialog open={detailOpen} onClose={closeDetail} maxWidth="md" fullWidth>
        <DialogTitle>Detalle – {detailAuditor ?? ""}</DialogTitle>
        <DialogContent dividers>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>RUC</TableCell>
                <TableCell>Nombre o Razón Social</TableCell>
                <TableCell>Categoría</TableCell>
                <TableCell>Fecha asignación</TableCell>
                <TableCell>Estado</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {detailRows.map((r) => (
                <TableRow key={String(r.id) + String(r.ruc)}>
                  <TableCell>{r.ruc}</TableCell>
                  <TableCell>{r.nombre}</TableCell>
                  <TableCell>{categoriaOf(r)}</TableCell>
                  <TableCell>{r.fechaAsignacion ?? "—"}</TableCell>
                  <TableCell>{r.asignado ? "Asignado" : "Pendiente"}</TableCell>
                </TableRow>
              ))}
              {detailRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center">Sin casos para este auditor</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={closeDetail}>CERRAR</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export { Casos };
export default Casos;
