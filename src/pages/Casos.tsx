// ==========================================
// src/pages/Casos.tsx  (VERSIÓN COMPLETA)
// ==========================================
import * as React from "react";
import {
  Box,
  Paper,
  Button,
  Chip,
  Typography,
  Grid,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
} from "@mui/material";
import { CASOS_KEY } from "../lib/aprobacionesStorage";
import Trazabilidad, { type TrazaItem } from "../components/Trazabilidad";

/* ===================== Tipos ===================== */
type Caso = {
  id: number | string;
  ruc: string;
  nombre: string;
  categoria?: string;
  metaCategoria?: string;
  auditor?: string;
  auditorAsignado?: string;
  fechaAsignacion?: string;
  fechaAuditoria?: string;
  bloquear?: boolean;
  red?: string;
  asignado?: boolean;
  trazas?: TrazaItem[];
  [k: string]: any;
};

type Props = {
  casos?: Caso[];
  auditoresUI?: string[];
  onRegresar?: () => void;
};

/* ===================== Storage helpers ===================== */
function readStorage(): Caso[] {
  try {
    const raw = localStorage.getItem(CASOS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStorage(rows: Caso[]) {
  try {
    localStorage.setItem(CASOS_KEY, JSON.stringify(rows));
    window.dispatchEvent(new Event("casosAprobacion:update"));
  } catch {}
}

function mergeWithStorage(base: Caso[], storage: Caso[]): Caso[] {
  const byKey = new Map<string, Caso>();
  for (const s of storage) {
    const k = s.id ? `id:${s.id}` : s.ruc ? `ruc:${s.ruc}` : "";
    if (k) byKey.set(k, s);
  }
  return base.map((b) => {
    const k = b.id ? `id:${b.id}` : b.ruc ? `ruc:${b.ruc}` : "";
    const s = (k && byKey.get(k)) || undefined;
    if (!s) return b;
    return {
      ...b,
      categoria: s.metaCategoria ?? s.categoria ?? b.metaCategoria ?? b.categoria,
      metaCategoria: s.metaCategoria ?? b.metaCategoria,
      auditor: s.auditorAsignado ?? s.auditor ?? b.auditor,
      auditorAsignado: s.auditorAsignado ?? b.auditorAsignado,
      fechaAsignacion: s.fechaAsignacion ?? b.fechaAsignacion,
      fechaAuditoria: s.fechaAuditoria ?? b.fechaAuditoria,
      bloquear: s.bloquear ?? b.bloquear,
      red: s.red ?? b.red,
      asignado: s.asignado ?? b.asignado,
      trazas: (s as any).trazas ?? mockTrazas(s.ruc ?? b.ruc ?? ""),
    };
  });
}

/* ===================== Funciones auxiliares ===================== */
const CATS = ["Fiscalización Masiva", "Grandes Contribuyentes", "Auditoría Sectorial"];
const DEFAULT_AUDITORES = ["Auditor 1", "Auditor 2", "Auditor 3", "Auditor 4"];

const auditorOf = (r: Caso) => r.auditorAsignado ?? r.auditor ?? "Sin auditor";
const categoriaOf = (r: Caso) => r.metaCategoria ?? r.categoria ?? "Sin categoría";

function randomFutureDate(isoStart: string, minDays = 1, maxDays = 30): string {
  const base = new Date(isoStart);
  if (Number.isNaN(base.getTime())) {
    const hoy = new Date();
    hoy.setDate(hoy.getDate() + 7);
    return hoy.toISOString().slice(0, 10);
  }
  const add = Math.floor(Math.random() * (maxDays - minDays + 1)) + minDays;
  base.setDate(base.getDate() + add);
  return base.toISOString().slice(0, 10);
}

function distribuirPorIguales(rows: Caso[], targetAuditores: string[]): Caso[] {
  const hoy = new Date().toISOString().slice(0, 10);
  const carga = new Map<string, number>();
  for (const a of targetAuditores) carga.set(a, 0);

  for (const r of rows) {
    const a = auditorOf(r);
    if (carga.has(a)) carga.set(a, (carga.get(a) ?? 0) + 1);
  }

  const pickMin = () => {
    let elegido = targetAuditores[0];
    let min = Infinity;
    for (const a of targetAuditores) {
      const c = carga.get(a) ?? 0;
      if (c < min) {
        min = c;
        elegido = a;
      }
    }
    return elegido;
  };

  return rows.map((r) => {
    const tieneAuditorValido = targetAuditores.includes(auditorOf(r));
    const estaAsignado = r.asignado === true;
    if (tieneAuditorValido && estaAsignado) return r;

    const a = pickMin();
    carga.set(a, (carga.get(a) ?? 0) + 1);
    const fechaAsignacion = r.fechaAsignacion ?? hoy;

    return {
      ...r,
      auditorAsignado: a,
      asignado: true,
      fechaAsignacion,
      fechaAuditoria: r.fechaAuditoria ?? randomFutureDate(fechaAsignacion),
    };
  });
}

/* Mock de trazas */
const mockTrazas = (ruc: string): TrazaItem[] => [
  {
    id: `${ruc}-1`,
    fechaISO: new Date(Date.now() - 86400000 * 3).toISOString(),
    actor: "Supervisor",
    accion: "Asignación",
    estado: "ASIGNADO",
  },
  {
    id: `${ruc}-2`,
    fechaISO: new Date(Date.now() - 86400000).toISOString(),
    actor: "Auditor",
    accion: "Preparación de auditoría",
    estado: "PENDIENTE",
  },
];

/* ===================== Componente ===================== */
const Casos: React.FC<Props> = ({
  casos = [],
  auditoresUI = DEFAULT_AUDITORES,
  onRegresar,
}) => {
  const [rows, setRows] = React.useState<Caso[]>([]);
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [detailAuditor, setDetailAuditor] = React.useState<string | null>(null);
  const [tab, setTab] = React.useState(0);

  const balanceDoneRef = React.useRef(false);

  const reload = React.useCallback(() => {
    const storage = readStorage();
    const base = casos.length > 0 ? casos : storage;
    setRows(mergeWithStorage(base, storage));
    balanceDoneRef.current = false;
  }, [casos]);

  React.useEffect(() => {
    reload();
  }, [reload]);

  const allAuditors = React.useMemo(
    () => Array.from(new Set([...auditoresUI])),
    [auditoresUI]
  );

  const targetAuditores = allAuditors.filter(
    (a) => a && a.trim() && a !== "Sin auditor"
  );

  React.useEffect(() => {
    if (balanceDoneRef.current) return;
    if (!rows.length || !targetAuditores.length) return;

    const needsBalance = rows.some(
      (r) => auditorOf(r) === "Sin auditor" || r.asignado !== true
    );
    if (!needsBalance) {
      balanceDoneRef.current = true;
      return;
    }

    const balanced = distribuirPorIguales(rows, targetAuditores);
    const changed = balanced.some((b, i) => {
      const a = rows[i];
      return (
        b.auditorAsignado !== a?.auditorAsignado ||
        b.fechaAsignacion !== a?.fechaAsignacion ||
        b.fechaAuditoria !== a?.fechaAuditoria ||
        b.asignado !== a?.asignado
      );
    });

    if (changed) {
      setRows(balanced);
      saveStorage(balanced);
    }

    balanceDoneRef.current = true;
  }, [rows, targetAuditores]);

  const openDetail = (aud: string) => {
    setDetailAuditor(aud);
    setTab(0);
    setDetailOpen(true);
  };
  const closeDetail = () => setDetailOpen(false);

  const detailRows = React.useMemo(
    () => rows.filter((r) => auditorOf(r) === detailAuditor),
    [rows, detailAuditor]
  );

  return (
    <Box component={Paper} sx={{ p: 2 }}>
      <Grid container alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <Grid item>
          <Typography variant="h6">Asignación automática</Typography>
        </Grid>
        <Grid item>
          <Chip
            size="small"
            color="primary"
            variant="outlined"
            label={`Total casos: ${rows.length}`}
          />
        </Grid>
      </Grid>

      {/* ================= TABLAS POR CATEGORÍA ================= */}
      {CATS.map((cat) => {
        const rowsCat = rows.filter((r) => categoriaOf(r) === cat);

        return (
          <Box key={cat} sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              {cat}
            </Typography>

            <Box
              sx={{
                border: "1px solid #CFD8DC",
                borderRadius: 1,
                overflow: "hidden",
              }}
            >
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>RUC</TableCell>
                    <TableCell>Nombre o Razón Social</TableCell>
                    <TableCell>Auditor asignado</TableCell>
                    <TableCell>Fecha asignación</TableCell>
                    <TableCell>Fecha auditoría</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Acción</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {rowsCat.map((r) => (
                    <TableRow key={String(r.id) + String(r.ruc)}>
                      <TableCell>{r.ruc}</TableCell>
                      <TableCell>{r.nombre}</TableCell>
                      <TableCell>{auditorOf(r)}</TableCell>
                      <TableCell>{r.fechaAsignacion ?? "—"}</TableCell>
                      <TableCell>{r.fechaAuditoria ?? "—"}</TableCell>
                      <TableCell>
                        {r.asignado ? "Asignado" : "Pendiente"}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => openDetail(auditorOf(r))}
                        >
                          DETALLE
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}

                  {rowsCat.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        Sin casos para esta categoría
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Box>
          </Box>
        );
      })}

      {/* === Dialog Detalle con Tabs === */}
      <Dialog open={detailOpen} onClose={closeDetail} maxWidth="lg" fullWidth>
        <DialogTitle>Detalle – {detailAuditor ?? ""}</DialogTitle>
        <DialogContent dividers>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
            <Tab label="Información" />
            <Tab label="Trazabilidad" />
          </Tabs>

          {tab === 0 && (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>RUC</TableCell>
                  <TableCell>Nombre o Razón Social</TableCell>
                  <TableCell>Categoría</TableCell>
                  <TableCell>Fecha asignación</TableCell>
                  <TableCell>Fecha auditoría</TableCell>
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
                    <TableCell>{r.fechaAuditoria ?? "—"}</TableCell>
                    <TableCell>
                      {r.asignado ? "Asignado" : "Pendiente"}
                    </TableCell>
                  </TableRow>
                ))}

                {detailRows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      Sin casos
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}

          {tab === 1 && (
            <Box sx={{ mt: 1 }}>
              <Trazabilidad rows={detailRows[0]?.trazas ?? []} height={360} />
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button variant="contained" onClick={closeDetail}>
            CERRAR
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export { Casos };
export default Casos;
