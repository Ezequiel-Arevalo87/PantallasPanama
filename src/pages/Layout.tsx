// pages/Layout.tsx
import React, { useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Box, Typography } from '@mui/material';
import { MenuFormulario } from './MenuFormulario';
import { InicioSelectorForm } from './InicioSelectorForm';
import logoDos from '../assets/logos/logoDos.png';
import { ProgramacionAutoAperturaForm } from './ProgramacionAutoAperturaForm';
import { Asignacion } from './Asignacion';
import { PresentacionVoluntaria } from './PresentacionVoluntaria';
import { Eliminaciones } from './Eliminaciones';
import { Rectificativa } from './Rectificativa';
import { Cierre } from './Cierre';
import { LiquidacionesAdicionales } from './LiquidacionesAdicionales';
import { Aprobacion } from './Aprobacion';
import { Apertura } from './Apertura';
import { Priorizacion } from './Priorizacion';
import { AsignacionesVarias } from './AsignacionesVarias';



export const Layout: React.FC = () => {
  const [opcionSeleccionada, setOpcionSeleccionada] = useState('');

  return (
    <Box display="flex" flexDirection="column" height="100vh" width="100vw" sx={{ overflow: 'hidden' }}>

      <Box sx={{ width: '100%' }}>
        <img src={logoDos} alt="Encabezado DGI" style={{ width: '100%', height: 'auto', display: 'block' }} />
      </Box>


      <Box display="flex" flexGrow={1} sx={{ minHeight: 0 }}>

        <Box
          sx={{
            width: 260,
            backgroundColor: '#fdfdf5',
            borderRight: '1px solid #ddd',
            p: 2
          }}
        >
          <Sidebar onSelect={(opcion) => setOpcionSeleccionada(opcion)} />
        </Box>


        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 4,
            backgroundColor: '#fff',
            overflowY: 'auto'
          }}
        >
          <Typography variant="h5" gutterBottom>
            {opcionSeleccionada || 'Selecciona una opción del menú'}
          </Typography>
          {opcionSeleccionada === 'SELECCIÓN DE CASOS' && <InicioSelectorForm />}
          {opcionSeleccionada === 'PRIORIZACIÓN' && <Priorizacion />}
          {opcionSeleccionada === 'APROBACIÓN' && <Aprobacion />}
          {/* {opcionSeleccionada === 'ASIGNACIÓN' && <Apertura />} */}
          {opcionSeleccionada === 'ASIGNACIÓN' && <Asignacion />}

          {opcionSeleccionada === 'PROGRAMACIÓN DE AUDITORIAS' && <ProgramacionAutoAperturaForm />}
          {/* {opcionSeleccionada === 'ASIGNACIÓN' && <Asignacion />} */}
       {opcionSeleccionada === 'REVISIÓN AUDITOR' && (
  <AsignacionesVarias tipo="REVISIÓN AUDITOR" />
)}
{opcionSeleccionada === 'REVISIÓN SUPERVISOR' && (
  <AsignacionesVarias tipo="REVISIÓN SUPERVISOR" />
)}
{opcionSeleccionada === 'REVISIÓN JEFE DE SECCIÓN' && (
  <AsignacionesVarias tipo="REVISIÓN JEFE DE SECCIÓN" />
)}
          {opcionSeleccionada === 'PRESENTACIÓN VOLUNTARIA' && <PresentacionVoluntaria />}
          {opcionSeleccionada === 'LIQUIDACIONES ADICIONALES' && <LiquidacionesAdicionales />}
          {opcionSeleccionada === 'ELIMINACIONES' && <Eliminaciones />}
          {opcionSeleccionada === 'RECTIFICATIVA' && <Rectificativa />}
          {opcionSeleccionada === 'CIERRE' && <Cierre />}
        </Box>
      </Box>
    </Box>
  );
};
