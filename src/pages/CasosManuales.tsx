// src/components/CasosManueales.tsx
import React, { useMemo, useState } from "react";
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  Button,
  Typography,
} from "@mui/material";
import dayjs from "dayjs";

type Props = {
  categoria: string;          // Ej: "Fiscalización Masiva"
  cantidad: number;           // Nº de filas a generar (mock)
  auditores?: string[];       // Lista de auditores (opcional)
  onRegresar?: () => void;    // Callback al presionar REGRESAR
  onAsignarRow?: (row: any) => void; // Callback al asignar (opcional)
};

type Fila = {
  id: number;
  categoria: string;
  nombre: string;
  ruc: string;
  fecha: string;
  auditor?: string;  // seleccionado en el combo
  asignado?: boolean;
};

export const CasosManueales: React.FC<Props> = ({
  categoria,
  cantidad,
  auditores = ["Auditor 1", "Auditor 2", "Auditor 3", "Auditor 4"],
  onRegresar,
  onAsignarRow,
}) => {
  // Genera filas "quemadas" según cantidad
  const filasIniciales: Fila[] = useMemo(() => {
    const hoy = dayjs();
    const out: Fila[] = [];
    for (let i = 1; i <= Math.max(0, cantidad || 0); i++) {
      const suf = String(100 + i).slice(-3);
      const ruc = `1${suf}${suf}-${(i % 9) + 1}${suf}-${String(100000 + i).slice(-6)}`;
      out.push({
        id: i,
        categoria,
        nombre: `Contribuyente ${i}`,
        ruc,
        fecha: hoy.add(i % 6, "day").format("DD/MM/YY"),
        auditor: auditores[i % auditores.length], // preseleccionado como en el mock
        asignado: false,
      });
    }
    return out;
  }, [cantidad, categoria, auditores]);

  const [filas, setFilas] = useState<Fila[]>(filasIniciales);

  const handleChangeAuditor = (id: number, value: string) => {
    setFilas(prev =>
      prev.map(f => (f.id === id ? { ...f, auditor: value } : f))
    );
  };

  const handleAsignar = (row: Fila) => {
    if (!row.auditor) {
      alert("Selecciona un auditor antes de asignar.");
      return;
    }
    const asignada = { ...row, asignado: true };
    setFilas(prev => prev.map(f => (f.id === row.id ? asignada : f)));
    onAsignarRow?.(asignada);
  };

  return (
    <Box mt={4}>

      {/* Encabezado de Categoría */}
      <Box
        mb={2}
        display="inline-flex"
        alignItems="center"
        gap={2}
        sx={{ border: "1px solid #cfd8dc", p: 1.2, borderRadius: 1, backgroundColor: "#eef3f8" }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: "bold", color: "#455a64" }}>
          CATEGORÍA
        </Typography>
        <Typography variant="subtitle2">{categoria}</Typography>
      </Box>

      <TableContainer
        component={Paper}
        sx={{ border: "1px solid #b0bec5", width: "auto" }}
      >
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: "#f7e9c9" }}>
              <TableCell sx={{ fontWeight: "bold", border: "1px solid #b0bec5" }}>Categoría</TableCell>
              <TableCell sx={{ fontWeight: "bold", border: "1px solid #b0bec5" }}>Nombre o Razón Social</TableCell>
              <TableCell sx={{ fontWeight: "bold", border: "1px solid #b0bec5" }}>RUC</TableCell>
              <TableCell sx={{ fontWeight: "bold", border: "1px solid #b0bec5" }}>Fecha</TableCell>
              <TableCell sx={{ fontWeight: "bold", border: "1px solid #b0bec5" }} align="center">Auditor</TableCell>
              <TableCell sx={{ fontWeight: "bold", border: "1px solid #b0bec5" }} align="center">Acción</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {filas.map((row) => (
              <TableRow key={row.id}>
                <TableCell sx={{ border: "1px solid #b0bec5" }}>{row.categoria}</TableCell>
                <TableCell sx={{ border: "1px solid #b0bec5" }}>{row.nombre}</TableCell>
                <TableCell sx={{ border: "1px solid #b0bec5" }}>{row.ruc}</TableCell>
                <TableCell sx={{ border: "1px solid #b0bec5" }}>{row.fecha}</TableCell>

                {/* Auditor (Select) */}
                <TableCell sx={{ border: "1px solid #b0bec5" }} align="center">
                  <Select
                    size="small"
                    value={row.auditor ?? ""}
                    onChange={(e) => handleChangeAuditor(row.id, String(e.target.value))}
                    sx={{ minWidth: 150 }}
                    disabled={row.asignado}
                  >
                    {auditores.map((a) => (
                      <MenuItem key={a} value={a}>{a}</MenuItem>
                    ))}
                  </Select>
                </TableCell>

                {/* Acción */}
                <TableCell sx={{ border: "1px solid #b0bec5" }} align="center">
                  {row.asignado ? (
                    <Button variant="contained" disabled>
                      ASIGNADO
                    </Button>
                  ) : (
                    <Button variant="contained" onClick={() => handleAsignar(row)}>
                      ASIGNAR
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>

        </Table>
      </TableContainer>

      <Box mt={2}>
        <Button variant="contained" onClick={onRegresar}>
          REGRESAR
        </Button>
      </Box>
    </Box>
  );
};
