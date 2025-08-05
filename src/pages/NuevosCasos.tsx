import React, { useState } from "react";
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
} from "@mui/material";
import { Casos } from "./Casos";

export const NuevosCasos = () => {
  const [valores, setValores] = useState<any>({
    fiscalizacionMasiva: 10,
    grandesContribuyentes: 20,
    auditoriaSectorial: 30,
  });

  const [enviarDistribucion, setEnviarDistribucion] = useState(null);

  const handleChange = (campo:any, valor:any) => {
    setValores((prev:any) => ({
      ...prev,
      [campo]: Number(valor) || 0,
    }));
  };

  const handleDistribuir = () => {
    setEnviarDistribucion(valores);
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
            </TableBody>
          </Table>
        </TableContainer>

        <Button
          variant="contained"
          color="primary"
          sx={{ height: "40px" }}
          onClick={handleDistribuir}
        >
          DISTRIBUIR
        </Button>
      </Box>

      {enviarDistribucion && <Casos nuevosCasos={enviarDistribucion} />}
    </Box>
  );
};
