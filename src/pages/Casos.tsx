import React, { useEffect, useMemo, useState } from "react";
import {
  Box, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, Typography
} from "@mui/material";

type Caso = {
  id: number | string;
  nombre: string;
  ruc: string;
  categoria?: string;
  metaCategoria?: string;
};

type Auditor = { nombre: string; fm: number; gc: number; as: number };

type Props = {
  // Si viene 'casos', los distribuye equitativamente entre auditores.
  casos?: Caso[];
  onRegresar?: () => void;
};

type DetalleItem = {
  id: number | string;
  tipo: "FISCALIZACIÓN MASIVA" | "GRANDES CONTRIBUYENTES" | "AUDITORÍA SECTORIAL";
  nombre: string;
  ruc: string;
};

const toTipo = (c: string | undefined): DetalleItem["tipo"] => {
  const s = (c || "").toLowerCase();
  if (s.includes("grande")) return "GRANDES CONTRIBUYENTES";
  if (s.includes("sector")) return "AUDITORÍA SECTORIAL";
  return "FISCALIZACIÓN MASIVA";
};

const DetalleModal: React.FC<{
  open: boolean;
  onClose: () => void;
  titulo: string; // "AUDITOR x (Total: n)"
  items: DetalleItem[];
}> = ({ open, onClose, titulo, items }) => (
  <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
    <DialogTitle>{titulo}</DialogTitle>
    <DialogContent dividers>
      {items.length === 0 ? (
        <Typography>No hay casos para mostrar.</Typography>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: "bold" }}>Tipo</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Nombre o Razón Social</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>RUC</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((it) => (
                <TableRow key={String(it.id)}>
                  <TableCell>{it.tipo}</TableCell>
                  <TableCell>{it.nombre}</TableCell>
                  <TableCell>{it.ruc}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </DialogContent>
    <DialogActions>
      <Button variant="contained" onClick={onClose}>REGRESAR</Button>
    </DialogActions>
  </Dialog>
);

export const Casos: React.FC<Props> = ({ casos = [], onRegresar }) => {
  // 3 auditores por defecto
  const [auditores, setAuditores] = useState<Auditor[]>([
    { nombre: "AUDITOR 1", fm: 0, gc: 0, as: 0 },
    { nombre: "AUDITOR 2", fm: 0, gc: 0, as: 0 },
    { nombre: "AUDITOR 3", fm: 0, gc: 0, as: 0 },
  ]);

  // Asignación: round-robin equitativo
  const asignaciones = useMemo(() => {
    const map: Record<string, DetalleItem[]> = {};
    auditores.forEach((a) => (map[a.nombre] = []));
    casos.forEach((c, i) => {
      const auditor = auditores[i % auditores.length].nombre;
      map[auditor].push({
        id: c.id,
        nombre: c.nombre,
        ruc: c.ruc,
        tipo: toTipo(c.metaCategoria ?? c.categoria),
      });
    });
    return map;
  }, [casos, auditores]);

  // Totales por auditor y categoría
  useEffect(() => {
    const nuevo = auditores.map((a) => {
      const items = asignaciones[a.nombre] || [];
      const fm = items.filter((x) => x.tipo === "FISCALIZACIÓN MASIVA").length;
      const gc = items.filter((x) => x.tipo === "GRANDES CONTRIBUYENTES").length;
      const as = items.filter((x) => x.tipo === "AUDITORÍA SECTORIAL").length;
      return { ...a, fm, gc, as };
    });
    setAuditores(nuevo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [casos]);

  // Modal detalle
  const [modal, setModal] = useState<{ open: boolean; titulo: string; items: DetalleItem[] }>({
    open: false, titulo: "", items: []
  });

  const abrirDetalle = (a: Auditor) => {
    const items = asignaciones[a.nombre] || [];
    const total = items.length;
    setModal({ open: true, titulo: `${a.nombre} — Detalle (Total: ${total})`, items });
  };

  const cerrarDetalle = () => setModal((m) => ({ ...m, open: false }));

  return (
    <Box mt={3}>
      <TableContainer component={Paper} sx={{ width: "auto" }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell></TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold" }}>FISCALIZACIÓN MASIVA</TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold" }}>GRANDES CONTRIBUYENTES</TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold" }}>AUDITORÍA SECTORIAL</TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold" }}>TOTAL</TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold" }}>ACCIÓN</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {auditores.map((a) => {
              const total = a.fm + a.gc + a.as;
              return (
                <TableRow key={a.nombre}>
                  <TableCell sx={{ fontWeight: "bold" }}>{a.nombre}</TableCell>
                  <TableCell align="center">{a.fm}</TableCell>
                  <TableCell align="center">{a.gc}</TableCell>
                  <TableCell align="center">{a.as}</TableCell>
                  <TableCell align="center" style={{ fontWeight: "bold" }}>{total}</TableCell>
                  <TableCell align="center">
                    <Button variant="contained" onClick={() => abrirDetalle(a)}>DETALLE</Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Box mt={2} display="flex" gap={2}>
        <Button variant="contained" onClick={onRegresar}>REGRESAR</Button>
      </Box>

      <DetalleModal open={modal.open} onClose={cerrarDetalle} titulo={modal.titulo} items={modal.items} />
    </Box>
  );
};
