import React from "react";
import { Box, Paper, Typography } from "@mui/material";
import dayjs from "dayjs";

export default function ActaInicioPreview({ form }: { form: any }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 3,
        bgcolor: "white",
        minHeight: 900,
        maxWidth: 800,
        mx: "auto",
      }}
    >
      <Typography>Panamá, {dayjs(form.fecha).format("DD/MM/YYYY")}</Typography>

      <Typography fontWeight={700} mt={2}>
        Señor(es)
      </Typography>
      <Typography>{form.senores}</Typography>

      <Typography mt={1}>RUC: {form.ruc}</Typography>

      <Typography mt={2} fontWeight={700}>
        Estimado señor(a):
      </Typography>

      <Typography mt={1}>
        Aquí va el texto completo del documento, que ya tienes en tu plantilla PDF.
      </Typography>
    </Paper>
  );
}
