// pages/Layout.tsx
import React, { useMemo, useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Box, Typography } from '@mui/material';
import { InicioSelectorForm } from './InicioSelectorForm';
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
// Si DetalleAutoApertura se usa en esta vista y debe bloquear "AGREGAR":


export const Layout: React.FC = () => {
  const [selectedPath, setSelectedPath] = useState<string>('');
  const [readOnly, setReadOnly] = useState(false);

  const AUD_PATH = 'PROCESOS DE AUDITORIAS/AUDITOR';
  const SUP_PATH = 'PROCESOS DE AUDITORIAS/SUPERVISOR';

  const handleSelect = (ruta: string) => {
    // Si navega a AUDITOR -> saltar a SUPERVISOR y bloquear edición
    if (ruta === AUD_PATH || ruta.endsWith('/AUDITOR')) {
      setSelectedPath(SUP_PATH);
 
      return;
    }
    // En cualquier otra ruta, decide si es supervisor para bloquear
    setSelectedPath(ruta);
    setReadOnly(ruta === SUP_PATH || ruta.endsWith('/SUPERVISOR'));
  };
console.log('laya, readOnly', readOnly)
  const leaf = useMemo(() => {
    if (!selectedPath) return '';
    const parts = selectedPath.split('/');
    return parts[parts.length - 1] ?? '';
  }, [selectedPath]);

  const renderContent = () => {
    switch (leaf) {
      case 'VARIACIÓN EN INGRESOS':
        return <VariacionesIngreso />;

      case 'SELECCIÓN DE CASOS':
        return <InicioSelectorForm />;

      case 'PRIORIZACIÓN':
        return <Priorizacion />;

      case 'ASIGNACIÓN':
        return <Aprobacion />;

      case 'INICIO DE AUDITORIA':
        // Si aquí usas DetalleAutoApertura, pásale readOnly para bloquear AGREGAR cuando vengas desde SUPERVISOR
        return <Apertura />; // o <DetalleAutoApertura readOnly={readOnly} ... />

      case 'SUPERVISOR':
        // Contenido de la pestaña supervisor (readOnly ya está en true por handleSelect)
        // Si aquí también muestras componentes con "AGREGAR", pásales readOnly={readOnly}
        return <ProgramacionAutoAperturaForm readOnly = {readOnly} setReadOnly = {setReadOnly} />;

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
    <Box display="flex" flexDirection="column" height="100vh" width="100vw" sx={{ overflow: 'hidden' }}>
      <Box sx={{ width: '100%' }}>
        <img src={logoDos} alt="Encabezado DGI" style={{ width: '100%', height: 'auto', display: 'block' }} />
      </Box>

      <Box display="flex" flexGrow={1} sx={{ minHeight: 0 }}>
        <Box sx={{ width: 300, backgroundColor: '#fdfdf5', borderRight: '1px solid #ddd', p: 2 }}>
          <Sidebar onSelect={handleSelect} selected={selectedPath} />
        </Box>

        <Box component="main" sx={{ flexGrow: 1, p: 4, backgroundColor: '#fff', overflowY: 'auto' }}>
          <Typography variant="h5" gutterBottom>
            {selectedPath || 'Selecciona una opción del menú'}
          </Typography>
          {renderContent()}
        </Box>
      </Box>
    </Box>
  );
};
