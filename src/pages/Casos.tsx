import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
} from "@mui/material";
import dayjs from "dayjs";

type Auditor = { nombre: string; fm: number; gc: number; as: number };

type Props = {
  nuevosCasos: any; // { fiscalizacionMasiva, grandesContribuyentes, auditoriaSectorial }
  onRegresar?: () => void;
};

// -------------------- Modal de Detalle --------------------
type DetalleItem = {
  id: number;
  tipo: "FISCALIZACIÓN MASIVA" | "GRANDES CONTRIBUYENTES" | "AUDITORIA SECTORIAL";
  nombre: string;
  ruc: string;
  fecha: string;
};

const DetalleModal: React.FC<{
  open: boolean;
  onClose: () => void;
  titulo: string; // "AUDITOR 1 (Total: 60)"
  items: DetalleItem[];
}> = ({ open, onClose, titulo, items }) => {
  return (
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
                  <TableCell align="center" sx={{ fontWeight: "bold" }}>#</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Tipo</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Nombre o Razón Social</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>RUC</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Fecha</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((it) => (
                  <TableRow key={it.id}>
                    <TableCell align="center">{it.id}</TableCell>
                    <TableCell>{it.tipo}</TableCell>
                    <TableCell>{it.nombre}</TableCell>
                    <TableCell>{it.ruc}</TableCell>
                    <TableCell>{it.fecha}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={onClose}>
          REGRESAR
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// -------------------- Tabla de Casos --------------------
export const Casos: React.FC<Props> = ({ nuevosCasos, onRegresar }) => {
  // auditores con todo en 0
  const [auditores, setAuditores] = useState<Auditor[]>([
    { nombre: "AUDITOR 1", fm: 0, gc: 0, as: 0 },
    { nombre: "AUDITOR 2", fm: 0, gc: 0, as: 0 },
    { nombre: "AUDITOR 3", fm: 0, gc: 0, as: 0 },
  ]);

  // Estado del modal
  const [modal, setModal] = useState<{
    open: boolean;
    titulo: string;
    items: DetalleItem[];
  }>({ open: false, titulo: "", items: [] });

  const distribuirCasos = () => {
    const { fiscalizacionMasiva, grandesContribuyentes, auditoriaSectorial } =
      nuevosCasos;

    // clonar para trabajar
    const lista: any = auditores.map((a) => ({ ...a }));

    const asignar = (campo: "fm" | "gc" | "as", cantidad: number) => {
      for (let i = 0; i < (cantidad || 0); i++) {
        // ordenar por total y luego por la columna específica (balanceo)
        lista.sort(
          (a: any, b: any) =>
            a.fm + a.gc + a.as - (b.fm + b.gc + b.as) ||
            a[campo] - b[campo]
        );
        lista[0][campo] += 1;
      }
    };

    asignar("fm", fiscalizacionMasiva);
    asignar("gc", grandesContribuyentes);
    asignar("as", auditoriaSectorial);

    setAuditores(lista);
  };

  useEffect(() => {
    if (nuevosCasos) distribuirCasos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nuevosCasos]);

  // Generador de "detalle" por auditor a partir de sus cantidades (fm/gc/as)
  const generarDetalleAuditor = (aud: Auditor): DetalleItem[] => {
    const hoy = dayjs();
    const out: DetalleItem[] = [];
    const pushItems = (
      cantidad: number,
      tipo: DetalleItem["tipo"],
      offsetBase: number
    ) => {
      for (let i = 1; i <= (cantidad || 0); i++) {
        const idx = out.length + 1;
        const suf = String(100 + idx + offsetBase).slice(-3);
        const ruc = `1${suf}${suf}-${(idx % 9) + 1}${suf}-${String(100000 + idx).slice(-6)}`;
        out.push({
          id: idx,
          tipo,
          nombre: `Contribuyente ${idx} (${tipo})`,
          ruc,
          fecha: hoy.add(idx % 7, "day").format("DD/MM/YY"),
        });
      }
    };

    // Concatenamos en orden FM -> GC -> AS
    pushItems(aud.fm, "FISCALIZACIÓN MASIVA", 0);
    pushItems(aud.gc, "GRANDES CONTRIBUYENTES", 200);
    pushItems(aud.as, "AUDITORIA SECTORIAL", 400);

    return out;
  };

  const abrirDetalle = (aud: Auditor) => {
    const total = aud.fm + aud.gc + aud.as;
    const items = generarDetalleAuditor(aud);
    setModal({
      open: true,
      titulo: `${aud.nombre} — Detalle (Total: ${total})`,
      items,
    });
  };

  const cerrarDetalle = () =>
    setModal((m) => ({ ...m, open: false }));

  return (
    <Box mt={3}>
      <TableContainer
        component={Paper}
        sx={{ border: "1px solid black", width: "auto" }}
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableCell
                colSpan={6}
                align="center"
                sx={{
                  color: "red",
                  fontWeight: "bold",
                  border: "1px solid black",
                }}
              >
                CASOS
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ border: "1px solid black" }}></TableCell>
              <TableCell
                align="center"
                sx={{
                  fontWeight: "bold",
                  backgroundColor: "#d9ead3",
                  border: "1px solid black",
                }}
              >
                FISCALIZACIÓN MASIVA
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  fontWeight: "bold",
                  backgroundColor: "#d9ead3",
                  border: "1px solid black",
                }}
              >
                GRANDES CONTRIBUYENTES
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  fontWeight: "bold",
                  backgroundColor: "#d9ead3",
                  border: "1px solid black",
                }}
              >
                AUDITORIA SECTORIAL
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  fontWeight: "bold",
                  backgroundColor: "#fce5cd",
                  border: "1px solid black",
                }}
              >
                TOTAL
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  fontWeight: "bold",
                  backgroundColor: "#dde2f1",
                  border: "1px solid black",
                }}
              >
                ACCIÓN
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {auditores.map((aud) => {
              const total = aud.fm + aud.gc + aud.as;
              return (
                <TableRow key={aud.nombre}>
                  <TableCell
                    sx={{
                      backgroundColor: "#cfe2f3",
                      fontWeight: "bold",
                      border: "1px solid black",
                    }}
                  >
                    {aud.nombre}
                  </TableCell>

                  <TableCell align="center" sx={{ border: "1px solid black" }}>
                    {aud.fm}
                  </TableCell>

                  <TableCell align="center" sx={{ border: "1px solid black" }}>
                    {aud.gc}
                  </TableCell>

                  <TableCell align="center" sx={{ border: "1px solid black" }}>
                    {aud.as}
                  </TableCell>

                  <TableCell
                    align="center"
                    sx={{
                      backgroundColor: "#fce5cd",
                      border: "1px solid black",
                      fontWeight: "bold",
                    }}
                  >
                    {total}
                  </TableCell>

                  <TableCell align="center" sx={{ border: "1px solid black" }}>
                    <Button
                      variant="contained"
                      onClick={() => abrirDetalle(aud)}
                    >
                      DETALLE
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Box mt={2} display="flex" gap={2}>
        <Button variant="contained" onClick={onRegresar}>
          REGRESAR
        </Button>
      </Box>

      {/* Modal de detalle */}
      <DetalleModal
        open={modal.open}
        onClose={cerrarDetalle}
        titulo={modal.titulo}
        items={modal.items}
      />
    </Box>
  );
};
