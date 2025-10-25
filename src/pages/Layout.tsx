import React, { useEffect, useMemo, useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Box, Typography } from '@mui/material';

import logoDos from '../assets/logos/logoDos.png';
import { ProgramacionAutoAperturaForm } from './ProgramacionAutoAperturaForm';
import { PresentacionVoluntaria } from './PresentacionVoluntaria';
import { Eliminaciones } from './Eliminaciones';
import { Rectificativa } from './Rectificativa';
import { Cierre } from './Cierre';
import { LiquidacionesAdicionales } from './LiquidacionesAdicionales';
import { Aprobacion } from './Aprobacion';
import { Apertura } from './Apertura';
import { Priorizacion } from './Priorizacion';
import { AsignacionesVarias } from './AsignacionesVarias';
import VariacionesIngreso from './VariacionesIngreso';
import HistorialCumplimiento from './HistorialCumplimiento';
import AnalisisFiscal from './AnalisisFiscal';
import Aprobaciones from './Aprobaciones';
import { InicioSelectorForm } from './InicioSelectorForm';
import Verificacion from './Verificacion';
import Home from './Home'; // ✅ import correcto (no el ícono)
import TrazabilidadBusqueda from './TrazabilidadBusqueda';
import ConsultasDeEstado from './ConsultasDeEstado';

const AUD_PATH = 'PROCESOS DE AUDITORIAS/AUDITOR';
const SUP_PATH = 'PROCESOS DE AUDITORIAS/SUPERVISOR';
const DIR_PATH = 'PROCESOS DE AUDITORIAS/DIRECTOR';

export const Layout: React.FC = () => {
  const [selectedPath, setSelectedPath] = useState<string>('HOME');
  const [readOnly, setReadOnly] = useState<boolean>(false);

  const leaf = useMemo(() => {
    if (!selectedPath) return '';
    const parts = selectedPath.split('/');
    return parts[parts.length - 1] ?? '';
  }, [selectedPath]);

  useEffect(() => {
    if (!selectedPath) return;

    if (leaf === 'AUDITOR' && readOnly && selectedPath !== SUP_PATH) {
      setSelectedPath(SUP_PATH);
    } else if (leaf === 'SUPERVISOR' && !readOnly && selectedPath !== AUD_PATH) {
      setSelectedPath(AUD_PATH);
    } else if (leaf === 'DIRECTOR' && !readOnly && selectedPath !== DIR_PATH) {
      setSelectedPath(DIR_PATH);
    }
  }, [readOnly, leaf, selectedPath]);

  const handleSelect = (ruta: string) => {
    setSelectedPath(ruta);
    setReadOnly(
      ruta === SUP_PATH || ruta.endsWith('/SUPERVISOR') ||
      ruta === DIR_PATH || ruta.endsWith('/DIRECTOR')
    );
  };

  const renderContent = () => {
    switch (leaf) {
      case 'HOME':
        return <Home onGo={handleSelect} />; 
        case 'TRAZABILIDAD':
  return <TrazabilidadBusqueda />;  // ✅ se pasa el callback
      case 'SELECTOR DE CASOS Y PRIORIZACIÓN':
        return <Priorizacion />;
      case 'VERIFICACIÓN':
        return <Verificacion />;
      case 'APROBACIÓN':
        return <Aprobaciones />;
      case 'ASIGNACIÓN':
        return <Aprobacion />;
      case 'HISTORIAL CUMPLIMIENTO':
        return <HistorialCumplimiento />;
      case 'ANALISIS FISCAL':
        return <AnalisisFiscal />;
      case 'VARIACIÓN EN INGRESOS':
        return <VariacionesIngreso />;
      case 'CONSULTAS DE ESTADOS':
        return <ConsultasDeEstado/>
      case 'INICIO DE AUDITORIA':
        return <Apertura />;
      case 'AUDITOR':
      case 'SUPERVISOR':
      case 'DIRECTOR':
        return <ProgramacionAutoAperturaForm readOnly={readOnly} setReadOnly={setReadOnly} />;
      case 'REVISIÓN AUDITOR':
        return <AsignacionesVarias tipo="REVISIÓN AUDITOR" />;
      case 'REVISIÓN SUPERVISOR':
        return <AsignacionesVarias tipo="REVISIÓN SUPERVISOR" />;
      case 'REVISIÓN JEFE DE SECCIÓN':
        return <AsignacionesVarias tipo="REVISIÓN JEFE DE SECCIÓN" />;
      case 'PRESENTACIÓN VOLUNTARIA':
        return <PresentacionVoluntaria />;
      case 'LIQUIDACIONES ADICIONALES':
        return <LiquidacionesAdicionales />;
      case 'ELIMINACIONES':
        return <Eliminaciones />;
      case 'RECTIFICATIVA':
        return <Rectificativa />;
      case 'CIERRE':
        return <Cierre />;
      default:
        return null;
    }
  };

  return (
    <Box display="flex" flexDirection="column" height="100vh" sx={{ overflow: 'hidden' }}>
      <Box sx={{ width: '100%' }}>
        <img
          src={logoDos}
          alt="Encabezado DGI"
          style={{ width: '100%', height: 'auto', display: 'block' }}
        />
      </Box>

      <Box display="flex" flexGrow={1} sx={{ minHeight: 0 }}>
        <Box
          sx={{
            width: 300,
            backgroundColor: '#fdfdf5',
            borderRight: '1px solid #ddd',
            p: 2,
            height: '100%',
            overflowY: 'auto',
            minHeight: 0,
            flexShrink: 0,
            position: 'relative',
            zIndex: 2,
          }}
        >
          <Sidebar onSelect={handleSelect} selected={selectedPath} />
        </Box>

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 4,
            backgroundColor: '#fff',
            overflowY: 'auto',
            overflowX: 'hidden',
            minWidth: 0,
            position: 'relative',
            zIndex: 1,
          }}
        >
          <Typography variant="h5" gutterBottom>
            {selectedPath || 'Selecciona una opción del menú'}
          </Typography>
          {renderContent()}
        </Box>
      </Box>
    </Box>
  );
};
