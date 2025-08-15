import React, { useMemo, useState } from "react";
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
} from "@mui/material";
import dayjs from "dayjs";
import { Casos } from "./Casos";

// =================== Modal de Detalle ===================
type DetalleItem = {
  id: number;
  nombre: string;
  ruc: string;
  fecha: string;
};

type DetalleModalProps = {
  open: boolean;
  onClose: () => void;
  titulo: string;
  cantidad: number;
};

const DetalleModal: React.FC<DetalleModalProps> = ({ open, onClose, titulo, cantidad }) => {
  // Generador de datos "quemados" según cantidad
  const data: DetalleItem[] = useMemo(() => {
    const hoy = dayjs();
    const items: DetalleItem[] = [];
    for (let i = 1; i <= Math.max(0, cantidad || 0); i++) {
      const suf = String(1000 + i).slice(-3); // 3 dígitos
      const ruc = `1${suf}${suf}-${(i % 9) + 1}${suf}-${String(100000 + i).slice(-6)}`;
      items.push({
        id: i,
        nombre: `Contribuyente ${i} (${titulo})`,
        ruc,
        fecha: hoy.add(i % 5, "day").format("DD/MM/YY"),
      });
    }
    return items;
  }, [cantidad, titulo]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>
        {titulo} — Detalle ({cantidad})
      </DialogTitle>
      <DialogContent dividers>
        {data.length === 0 ? (
          <Typography>No hay casos para mostrar.</Typography>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell align="center" sx={{ fontWeight: "bold" }}>#</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Nombre o Razón Social</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>RUC</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Fecha</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell align="center">{row.id}</TableCell>
                    <TableCell>{row.nombre}</TableCell>
                    <TableCell>{row.ruc}</TableCell>
                    <TableCell>{row.fecha}</TableCell>
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

// =================== Vista principal ===================
export const NuevosCasos: React.FC = () => {
  const [valores, setValores] = useState<any>({
    fiscalizacionMasiva: 10,
    grandesContribuyentes: 20,
    auditoriaSectorial: 30,
  });

  const [enviarDistribucion, setEnviarDistribucion] = useState<any>(null);
  const [enviarDistribucionManual, setEnviarDistribucionManual] = useState<any>(null);

  const [modal, setModal] = useState<{
    open: boolean;
    titulo: string;
    cantidad: number;
  }>({ open: false, titulo: "", cantidad: 0 });

  const handleChange = (campo: any, valor: any) => {
    const n = Math.max(0, Number(valor) || 0);
    setValores((prev: any) => ({ ...prev, [campo]: n }));
  };

  const handleDistribuir = () => {
    setEnviarDistribucion(valores);
  };
  const handleDistribuirManual = () => {
    setEnviarDistribucionManual(valores);
  };

  const abrirDetalle = (titulo: string, cantidad: number) => {
    setModal({ open: true, titulo, cantidad });
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={3}>
        <TableContainer
          component={Paper}
          sx={{ width: "auto", border: "1px solid black" }}
        >
          <Table>
            <TableHead>
              <TableRow>
                <TableCell
                  colSpan={3}
                  align="center"
                  sx={{
                    color: "red",
                    fontWeight: "bold",
                    border: "1px solid black",
                  }}
                >
                  NUEVOS CASOS
                </TableCell>
              </TableRow>
              <TableRow sx={{ backgroundColor: "#d9ead3" }}>
                <TableCell
                  align="center"
                  sx={{ fontWeight: "bold", border: "1px solid black" }}
                >
                  FISCALIZACIÓN MASIVA
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ fontWeight: "bold", border: "1px solid black" }}
                >
                  GRANDES CONTRIBUYENTES
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ fontWeight: "bold", border: "1px solid black" }}
                >
                  AUDITORIA SECTORIAL
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {/* Fila de inputs */}
              <TableRow>
                <TableCell align="center" sx={{ border: "1px solid black" }}>
                  <TextField
                    type="number"
                    value={valores.fiscalizacionMasiva}
                    onChange={(e) =>
                      handleChange("fiscalizacionMasiva", e.target.value)
                    }
                    inputProps={{ min: 0, style: { textAlign: "center" } }}
                    variant="standard"
                  />
                </TableCell>

                <TableCell align="center" sx={{ border: "1px solid black" }}>
                  <TextField
                    type="number"
                    value={valores.grandesContribuyentes}
                    onChange={(e) =>
                      handleChange("grandesContribuyentes", e.target.value)
                    }
                    inputProps={{ min: 0, style: { textAlign: "center" } }}
                    variant="standard"
                  />
                </TableCell>

                <TableCell align="center" sx={{ border: "1px solid black" }}>
                  <TextField
                    type="number"
                    value={valores.auditoriaSectorial}
                    onChange={(e) =>
                      handleChange("auditoriaSectorial", e.target.value)
                    }
                    inputProps={{ min: 0, style: { textAlign: "center" } }}
                    variant="standard"
                  />
                </TableCell>
              </TableRow>

              {/* Fila de botones DETALLE */}
              <TableRow>
                <TableCell align="center" sx={{ border: "1px solid black" }}>
                  <Button
                    variant="contained"
                    onClick={() =>
                      abrirDetalle("FISCALIZACIÓN MASIVA", valores.fiscalizacionMasiva)
                    }
                  >
                    DETALLE
                  </Button>
                </TableCell>
                <TableCell align="center" sx={{ border: "1px solid black" }}>
                  <Button
                    variant="contained"
                    onClick={() =>
                      abrirDetalle("GRANDES CONTRIBUYENTES", valores.grandesContribuyentes)
                    }
                  >
                    DETALLE
                  </Button>
                </TableCell>
                <TableCell align="center" sx={{ border: "1px solid black" }}>
                  <Button
                    variant="contained"
                    onClick={() =>
                      abrirDetalle("AUDITORIA SECTORIAL", valores.auditoriaSectorial)
                    }
                  >
                    DETALLE
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        <Button
          variant="contained"
          color="primary"
          sx={{ height: "40px" }}
          onClick={handleDistribuir}
        >
          ASIGNACIÓN AUTOMÁTICA
        </Button>

        <Button
          variant="contained"
          color="primary"
          sx={{ height: "40px" }}
          onClick={handleDistribuirManual}
        >
          ASIGNACIÓN MANUAL
        </Button>
      </Box>

      {/* Aquí seguiría tu componente de destino si lo usas */}
      {enviarDistribucion && (
        <Box mt={2}>
       {enviarDistribucion && (
  <Casos
    nuevosCasos={enviarDistribucion}
    onRegresar={() => setEnviarDistribucion(null)}
  />

  
)}
       {enviarDistribucionManual && (
  <Casos
    nuevosCasos={enviarDistribucionManual}
    onRegresar={() => setEnviarDistribucion(null)}
  />

  
)}
  
        </Box>
      )}

      {/* Modal de detalle */}
      <DetalleModal
        open={modal.open}
        onClose={() => setModal((m) => ({ ...m, open: false }))}
        titulo={modal.titulo}
        cantidad={modal.cantidad}
      />
      
    </Box>
  );
};
