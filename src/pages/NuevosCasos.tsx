import React, { useState, useMemo } from "react";
import { Box, Button } from "@mui/material";
import { Casos } from "./Casos";
import { CasosManueales } from "./CasosManuales";

type Caso = {
  id: number | string;
  nombre: string;
  ruc: string;
  categoria?: string;
  metaCategoria?: string;
  [k: string]: any;
};

type Props = {
  casosAprobados: Caso[];
};

export const NuevosCasos: React.FC<Props> = ({ casosAprobados }) => {
  const [auto, setAuto] = useState(false);
  const [manual, setManual] = useState(false);

  const categoriaMostrada = useMemo(() => {
    const first = casosAprobados?.[0];
    return first?.metaCategoria || first?.categoria || "(Listado aprobado)";
  }, [casosAprobados]);

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
          <Casos casos={casosAprobados} onRegresar={() => setAuto(false)} />
        </Box>
      )}

      {manual && (
        <Box mt={2}>
          <CasosManueales
            categoria={categoriaMostrada}
            baseRows={casosAprobados}
            auditores={["Auditor 1", "Auditor 2", "Auditor 3", "Auditor 4"]}
            onRegresar={() => setManual(false)}
            onAsignarRow={(row: any) => console.log("Asignado:", row)}
          />
        </Box>
      )}
    </Box>
  );
};
