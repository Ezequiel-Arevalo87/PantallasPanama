import React, { useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { Alcance, FichaContribuyente, ObjeticoInvestigacion, ObjeticoInvestigacionDos } from '../helpers/types';
import { withDefaults, withDefaultsCuatro, withDefaultsDos, withDefaultsTres } from '../helpers/withDefaults';
import { TablaCasosAsignados } from './TablaCasosAsignados';
import { FormAutoApertura } from './FormAutoApertura';
import { DetalleAutoApertura } from './DetalleAutoApertura';
import { ALCANCE, FICHAS, INVESTIGACIONOBJETO, INVESTIGACIONOBJETODOS } from '../helpers/data'; // 👈 importa aquí

type Paso = 'inicio' | 'tabla' | 'form' | 'detalle';

export default function AutoAperturaFlow({readOnly, setReadOnly}:{readOnly:any; setReadOnly:any}) {
  const [paso, setPaso] = useState<Paso>('inicio');
  const [rucSeleccionado, setRucSeleccionado] = useState<string>('');
  const [ficha, setFicha] = useState<Required<FichaContribuyente> | null>(null);
  const [investigacionObtejo, setInvestigacionObtejo] = useState<Required<ObjeticoInvestigacion> | null>(null);
  const [investigacionObtejoDos, setInvestigacionObtejoDos] = useState<Required<ObjeticoInvestigacionDos> | null>(null);
  const [alcance, setAlcance] = useState<Required<Alcance> | null>(null);

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

    // 2) Objeto de la investigación (👈 AHORA sí desde INVESTIGACIONOBJETO)
    const baseObj = INVESTIGACIONOBJETO[ruc] ?? {};
    const objCompleto = withDefaultsDos(baseObj, ruc);

    setInvestigacionObtejo(objCompleto);
    
    // 2) Objeto de la investigación (👈 AHORA sí desde INVESTIGACIONOBJETO)
    const baseObjDos = INVESTIGACIONOBJETODOS[ruc] ?? {};
    const objCompletoDos = withDefaultsCuatro(baseObjDos, ruc);
    setInvestigacionObtejoDos(objCompletoDos);

    // 3) Objeto de la investigación (👈 AHORA sí desde INVESTIGACIONOBJETO)
    const baseAlcance = ALCANCE[ruc] ?? {};
    const alcanceCompleto = withDefaultsTres(baseAlcance, ruc);
    setAlcance(alcanceCompleto);

    setPaso('detalle');
  };

  return (
    <Box>
      <Typography variant="h6" color="error" align="center" sx={{ mb: 2 }}>
        PROGRAMACIÓN DE AUTO DE APERTURA
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
            readOnly = {readOnly}
            setReadOnly = {setReadOnly}
         
          />
          <Box mt={2} display="flex" justifyContent="space-between">
            <Button onClick={() => setPaso('form')}>Volver</Button>
          </Box>
        </>
      )}
    </Box>
  );
}
