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
  // 👇 AUTOMÁTICO SE MUESTRA DE ENTRADA
  const [auto, setAuto] = useState(true);
  const [manual, setManual] = useState(false);

  const categoriaMostrada = useMemo(() => {
    const first = casosAprobados?.[0];
    return first?.metaCategoria || first?.categoria || "(Listado aprobado)";
  }, [casosAprobados]);

  console.log({casosAprobados})

  return (
    <Box>
      {/* SOLO BOTÓN DE ASIGNACIÓN MANUAL */}
      <Box display="flex" gap={2}>
        <Button
          variant="contained"
          onClick={() => {
            setManual(true);
            setAuto(false);
          }}
        >
          ASIGNACIÓN MANUAL
        </Button>
      </Box>

      {/* =============================
            VISTA AUTOMÁTICA (DEFAULT)
         ============================= */}
      {auto && (
        <Box mt={2}>
          <Casos
            casos={casosAprobados}
            onRegresar={() => {
              // 👇 Al regresar, volvemos a mostrar AUTOMÁTICO
              setAuto(true);
              setManual(false);
            }}
          />
        </Box>
      )}

      {/* =============================
            VISTA MANUAL
         ============================= */}
      {manual && (
        <Box mt={2}>
          <CasosManueales
            categoria={categoriaMostrada}
            baseRows={casosAprobados}
            auditores={["Auditor 1", "Auditor 2", "Auditor 3", "Auditor 4"]}
            onRegresar={() => {
              // 👇 Regreso → mostrar automático otra vez
              setManual(false);
              setAuto(true);
            }}
            onAsignarRow={(row: any) => console.log("Asignado:", row)}
          />
        </Box>
      )}
    </Box>
  );
};