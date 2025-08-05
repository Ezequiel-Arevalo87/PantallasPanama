import React, { useState, useEffect } from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";

export const Casos = ({ nuevosCasos }:any) => {
  // auditores con todo en 0
  const [auditores, setAuditores] = useState([
    { nombre: "AUDITOR 1", fm: 0, gc: 0, as: 0 },
    { nombre: "AUDITOR 2", fm: 0, gc: 0, as: 0 },
    { nombre: "AUDITOR 3", fm: 0, gc: 0, as: 0 },
  ]);

  const distribuirCasos = () => {
    const { fiscalizacionMasiva, grandesContribuyentes, auditoriaSectorial } =
      nuevosCasos;

    let lista:any = auditores.map((a) => ({ ...a })); 
    const asignar = (campo:any, cantidad:any) => {
      for (let i = 0; i < cantidad; i++) {
        lista.sort(
          (a:any, b:any) =>
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
    if (nuevosCasos) {
      distribuirCasos();
    }
    
  }, [nuevosCasos]);

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
                colSpan={5}
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
                    }}
                  >
                    {total}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};
