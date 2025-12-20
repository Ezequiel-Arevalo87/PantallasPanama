import React from "react";
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  Radio,
  RadioGroup,
  FormControlLabel,
} from "@mui/material";

export type Decision = "ACEPTA" | "RECHAZA";

export type ComunicacionRow = {
  id: string;
  impuesto: string;
  monto: number;
  numeroResolucion: string;
  decision: Decision;
};

type Props = {
  rows: ComunicacionRow[];
  onDecisionChange: (id: string, decision: Decision) => void;
};

const money = (n: number) =>
  n.toLocaleString("es-PA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const TablaResultadoComunicaciones: React.FC<Props> = ({
  rows,
  onDecisionChange,
}) => {
  if (!rows.length) return null;

  return (
    <Paper sx={{ mt: 2, p: 2 }}>
      <Typography sx={{ fontWeight: 700, mb: 1 }}>
        Resultados
      </Typography>

      <Box sx={{ overflowX: "auto" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Impuesto</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Monto</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Número de Resolución</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Decisión</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id} hover>
                <TableCell>{r.impuesto}</TableCell>
                <TableCell>{money(r.monto)}</TableCell>
                <TableCell>{r.numeroResolucion || "—"}</TableCell>
                <TableCell>
                  <RadioGroup
                    row
                    value={r.decision}
                    onChange={(e) =>
                      onDecisionChange(r.id, e.target.value as Decision)
                    }
                  >
                    <FormControlLabel
                      value="ACEPTA"
                      control={<Radio />}
                      label="Acepta"
                    />
                    <FormControlLabel
                      value="RECHAZA"
                      control={<Radio />}
                      label="Rechaza"
                    />
                  </RadioGroup>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </Paper>
  );
};

export default TablaResultadoComunicaciones;
