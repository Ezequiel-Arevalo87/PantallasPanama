import React, { useState } from "react";
import { Box, Button } from "@mui/material";
import { Casos } from "./Casos";
import { CasosManueales } from "./CasosManuales";

type Caso = {
  id: number | string;
  nombre: string;
  ruc: string;
  categoria?: string;
  metaCategoria?: string;
};

type Props = {
  casosAprobados: Caso[]; // vienen de Asignación (filtrados o todos)
};

export const NuevosCasos: React.FC<Props> = ({ casosAprobados }) => {
  const [auto, setAuto] = useState(false);
  const [manual, setManual] = useState(false);

  return (
    <Box>
      <Box display="flex" gap={2}>
        <Button variant="contained" onClick={() => { setAuto(true); setManual(false); }}>
          ASIGNACIÓN AUTOMÁTICA
        </Button>
        <Button variant="contained" onClick={() => { setManual(true); setAuto(false); }}>
          ASIGNACIÓN MANUAL
        </Button>
      </Box>

      {auto && (
        <Box mt={2}>
          {/* Reparto equitativo real, con los casos aprobados */}
          <Casos casos={casosAprobados} onRegresar={() => setAuto(false)} />
        </Box>
      )}

      {manual && (
        <Box mt={2}>
          {/* Puedes pasar aquí la lista para que el usuario los arrastre/seleccione */}
          <CasosManueales
            categoria="(Listado aprobado)"
            cantidad={casosAprobados.length}
            auditores={["Auditor 1", "Auditor 2", "Auditor 3", "Auditor 4"]}
            onRegresar={() => setManual(false)}
            onAsignarRow={(row: any) => console.log("Asignado:", row)}
          />
        </Box>
      )}
    </Box>
  );
};
