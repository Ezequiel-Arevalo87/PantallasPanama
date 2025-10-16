import React, { useEffect, useMemo, useState } from "react";
import { Box, Grid, TextField, MenuItem, Button, Stack } from "@mui/material";
import { NuevosCasos } from "./NuevosCasos";
import { readAprobados } from "../lib/aprobacionesStorage";

// Tipos mínimos para entender la data
type Caso = {
  id: number | string;
  categoria?: string;              // fallback si no hay metaCategoria
  metaCategoria?: string;          // preferida
  ruc: string;
  nombre: string;
  estado?: "Pendiente" | "Aprobado";
};

const CATEGORIAS = [
  "Todos",
  "Fiscalización Masiva",
  "Grandes Contribuyentes",
  "Auditoría Sectorial",
] as const;

export const Aprobacion: React.FC = () => {
  const [categoriaSel, setCategoriaSel] = useState<string>("Todos");
  const [mostrar, setMostrar] = useState(false);
  const [aprobados, setAprobados] = useState<Caso[]>([]);

  // Carga inicial y escucha cambios desde Aprobaciones
  useEffect(() => {
    const cargar = () => setAprobados(readAprobados<Caso>());
    cargar();
    const onUpd = () => cargar();
    window.addEventListener("casosAprobacion:update", onUpd);
    window.addEventListener("storage", onUpd);
    return () => {
      window.removeEventListener("casosAprobacion:update", onUpd);
      window.removeEventListener("storage", onUpd);
    };
  }, []);

  // Filtra por categoría seleccionada (o todas)
  const casosFiltrados = useMemo(() => {
    if (categoriaSel === "Todos") return aprobados;
    return aprobados.filter((c) => (c.metaCategoria ?? c.categoria) === categoriaSel);
  }, [aprobados, categoriaSel]);

  const handleConsultar = () => setMostrar(true);
  const handleLimpiar = () => {
    setCategoriaSel("Todos");
    setMostrar(false);
  };

  return (
    <Box>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          {/* Supervisor -> ahora selección de Categoría */}
          <TextField
            select
            fullWidth
            label="CATEGORÍA"
            value={categoriaSel}
            onChange={(e) => setCategoriaSel(e.target.value)}
          >
            {CATEGORIAS.map((c) => (
              <MenuItem key={c} value={c}>{c}</MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* Se elimina FECHA y colores de fondo */}

        <Grid item xs={12}>
          <Stack direction="row" justifyContent="flex-end" spacing={2}>
            <Button variant="contained" onClick={handleConsultar}>
              Consultar
            </Button>
            <Button variant="contained" onClick={handleLimpiar}>
              Limpiar
            </Button>
          </Stack>
        </Grid>
      </Grid>

      {/* NUEVOS CASOS -> sólo botones / y al automático le pasamos lo aprobado */}
      {mostrar && (
        <Box mt={4}>
          <NuevosCasos casosAprobados={casosFiltrados} />
        </Box>
      )}
    </Box>
  );
};
