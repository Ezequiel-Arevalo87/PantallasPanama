// src/components/ChipSemaforo.tsx
import React from "react";
import { Chip } from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";

type Props = {
  dias: number;
};

export default function ChipSemaforo({ dias }: Props) {
  // HU: día 1 = verde, día 2 = rojo
  const color = dias <= 1 ? "success" : "error";
  const label = dias <= 1 ? "Día 1" : "Día 2";

  return (
    <Chip
      label={label}
      color={color}
      size="small"
      icon={dias <= 1 ? <CheckCircleOutlineIcon /> : <ErrorOutlineIcon />}
      sx={{ fontWeight: "bold" }}
    />
  );
}
