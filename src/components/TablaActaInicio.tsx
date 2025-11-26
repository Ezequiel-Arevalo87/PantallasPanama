// ===============================================
// src/components/TablaActaInicio.tsx
// ===============================================

import React from "react";
import {
  Table, TableHead, TableRow, TableCell,
  TableBody, IconButton, Stack, Tooltip
} from "@mui/material";

import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import EditIcon from "@mui/icons-material/Edit";
import { CasoActa } from "../pages/ActaInicio";



type Props = {
  rows: CasoActa[];
  onDetalle?: (c: CasoActa) => void;
  onEditar?: (c: CasoActa) => void;
};

export const TablaActaInicio: React.FC<Props> = ({ rows, onDetalle, onEditar }) => {
  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>RUC</TableCell>
          <TableCell>Nombre</TableCell>
          <TableCell>Auto Nº</TableCell>
          <TableCell>Categoría</TableCell>
          <TableCell>Auditor</TableCell>
          <TableCell align="center">Acciones</TableCell>
        </TableRow>
      </TableHead>

      <TableBody>
        {rows.map((c) => (
          <TableRow key={c.id}>
            <TableCell>{c.ruc}</TableCell>
            <TableCell>{c.nombre}</TableCell>
            <TableCell>{c.numeroAutoApertura ?? "—"}</TableCell>
            <TableCell>{c.categoria}</TableCell>
            <TableCell>{c.auditorAsignado}</TableCell>

            <TableCell align="center">
              <Stack direction="row" spacing={1} justifyContent="center">
                <Tooltip title="Detalle del Caso">
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => onDetalle?.(c)}
                  >
                    <InfoOutlinedIcon />
                  </IconButton>
                </Tooltip>

                <Tooltip title="Editar Acta">
                  <IconButton
                    size="small"
                    color="success"
                    onClick={() => onEditar?.(c)}
                  >
                    <EditIcon />
                  </IconButton>
                </Tooltip>
              </Stack>
            </TableCell>
          </TableRow>
        ))}

        {rows.length === 0 && (
          <TableRow>
            <TableCell colSpan={6} align="center">
              No se encontraron casos asignados
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};
