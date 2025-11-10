// src/components/AutoAperturaFlow.tsx
import React, { useEffect, useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import {
  Alcance,
  FichaContribuyente,
  ObjeticoInvestigacion,
  ObjeticoInvestigacionDos,
} from '../helpers/types';
import {
  withDefaults,
  withDefaultsCuatro,
  withDefaultsDos,
  withDefaultsTres,
} from '../helpers/withDefaults';
import { TablaCasosAsignados } from './TablaCasosAsignados';
import { FormAutoApertura } from './FormAutoApertura';
import { DetalleAutoApertura } from './DetalleAutoApertura';
import {
  ALCANCE,
  FICHAS,
  INVESTIGACIONOBJETO,
  INVESTIGACIONOBJETODOS,
} from '../helpers/data';

type Paso = 'inicio' | 'tabla' | 'form' | 'detalle';
export type Nivel = 'AUDITOR' | 'SUPERVISOR' | 'DIRECTOR';

type Props = {
  readOnly?: boolean;
  setReadOnly?: (v: boolean) => void;

  // Nuevo: permitir control externo del nivel
  nivel?: Nivel;
  setNivel?: React.Dispatch<React.SetStateAction<Nivel>>;
};

export default function AutoAperturaFlow({
  readOnly,
  setReadOnly,
  nivel: nivelProp,
  setNivel: setNivelProp,
}: Props) {
  const [paso, setPaso] = useState<Paso>('inicio');
  const [rucSeleccionado, setRucSeleccionado] = useState<string>('');

  const [ficha, setFicha] =
    useState<Required<FichaContribuyente> | null>(null);
  const [investigacionObtejo, setInvestigacionObtejo] =
    useState<Required<ObjeticoInvestigacion> | null>(null);
  const [investigacionObtejoDos, setInvestigacionObtejoDos] =
    useState<Required<ObjeticoInvestigacionDos> | null>(null);
  const [alcance, setAlcance] =
    useState<Required<Alcance> | null>(null);

  // === CONTROL de nivel: soporta controlado y no-controlado
  const isControlled = nivelProp !== undefined && setNivelProp !== undefined;
  const [nivelLocal, setNivelLocal] = useState<Nivel>(nivelProp ?? 'AUDITOR');

  // si viene nivelProp desde fuera, sincronizamos el espejo local
  useEffect(() => {
    if (nivelProp !== undefined) setNivelLocal(nivelProp);
  }, [nivelProp]);

  const nivel: Nivel = isControlled ? (nivelProp as Nivel) : nivelLocal;
  const setNivelUnified = (n: Nivel) => {
    if (isControlled) setNivelProp!(n);
    else setNivelLocal(n);
  };

  // (Opcional) sincroniza con tus props legacy readOnly/setReadOnly
  useEffect(() => {
    if (typeof setReadOnly === 'function') {
      setReadOnly(nivel !== 'AUDITOR');
    }
  }, [nivel, setReadOnly]);

  const handleCasosAsignados = () => setPaso('tabla');

  const handleAutoApertura = (ruc: string) => {
    setRucSeleccionado(ruc);
    setPaso('form');
  };

  const handleConsultar = (ruc: string) => {
    // 1) Ficha del contribuyente
    const baseFicha = FICHAS[ruc] ?? {};
    const fichaCompleta = withDefaults(baseFicha, ruc);
    setFicha(fichaCompleta);

    // 2) Objeto de la investigación
    const baseObj = INVESTIGACIONOBJETO[ruc] ?? {};
    const objCompleto = withDefaultsDos(baseObj, ruc);
    setInvestigacionObtejo(objCompleto);

    // 3) Objeto 2
    const baseObjDos = INVESTIGACIONOBJETODOS[ruc] ?? {};
    const objCompletoDos = withDefaultsCuatro(baseObjDos, ruc);
    setInvestigacionObtejoDos(objCompletoDos);

    // 4) Alcance
    const baseAlcance = ALCANCE[ruc] ?? {};
    const alcanceCompleto = withDefaultsTres(baseAlcance, ruc);
    setAlcance(alcanceCompleto);

    // Entrar al detalle siempre como AUDITOR
    setNivelUnified('AUDITOR');
    setPaso('detalle');
  };

  return (
    <Box>
      <Typography variant="h6" color="succes" align="center" sx={{ mb: 2 }}>
        INFORME DE AUDITORIA
      </Typography>

      {paso === 'inicio' && (
        <Box textAlign="center">
          <Button variant="contained" onClick={handleCasosAsignados}>
            Casos asignados
          </Button>
        </Box>
      )}

      {paso === 'tabla' && (
        <>
          <TablaCasosAsignados onAutoApertura={handleAutoApertura} />
          <Box mt={2} display="flex" justifyContent="space-between">
            <Button onClick={() => setPaso('inicio')}>Volver</Button>
            <Box />
          </Box>
        </>
      )}

      {paso === 'form' && (
        <FormAutoApertura
          rucInicial={rucSeleccionado}
          onConsultar={handleConsultar}
          onVolver={() => setPaso('tabla')}
        />
      )}

      {paso === 'detalle' && ficha && (
        <>
          <DetalleAutoApertura
            ficha={ficha}
            investigacionObtejo={investigacionObtejo}
            investigacionObtejoDos={investigacionObtejoDos}
            alcance={alcance}
            // Control de flujo por nivel (unificado)
            nivel={nivel}
            setNivel={setNivelUnified}
            // Compatibilidad legacy
            readOnly={nivel !== 'AUDITOR'}
            setReadOnly={() => { /* legacy no-op */ }}
          />

          <Box mt={2} display="flex" justifyContent="space-between">
            <Button onClick={() => setPaso('form')}>Volver</Button>
          </Box>
        </>
      )}
    </Box>
  );
}
