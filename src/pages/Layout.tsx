// pages/Layout.tsx
import React, { useEffect, useMemo, useState } from 'react';
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

export const Layout: React.FC = () => {
  const [selectedPath, setSelectedPath] = useState<string>('');
  const [readOnly, setReadOnly] = useState<boolean>(false);

  const AUD_PATH = 'PROCESOS DE AUDITORIAS/AUDITOR';
  const SUP_PATH = 'PROCESOS DE AUDITORIAS/SUPERVISOR';

  // Toma el último segmento de la ruta
  const leaf = useMemo(() => {
    if (!selectedPath) return '';
    const parts = selectedPath.split('/');
    return parts[parts.length - 1] ?? '';
  }, [selectedPath]);

  // 🔁 Sincroniza ruta <-> readOnly
  useEffect(() => {
    if (!selectedPath) return;

    if (leaf === 'AUDITOR' && readOnly && selectedPath !== SUP_PATH) {
      setSelectedPath(SUP_PATH);        // aprobar -> ir a SUPERVISOR
    } else if (leaf === 'SUPERVISOR' && !readOnly && selectedPath !== AUD_PATH) {
      setSelectedPath(AUD_PATH);        // devolver -> volver a AUDITOR
    }
  }, [readOnly, leaf, selectedPath]);   // ojo con deps

  // Clicks desde el Sidebar (no fuerza saltos; solo refleja selección y setea readOnly si eligen SUPERVISOR)
  const handleSelect = (ruta: string) => {
    setSelectedPath(ruta);
    setReadOnly(ruta === SUP_PATH || ruta.endsWith('/SUPERVISOR'));
  };

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
        return <Apertura />;

      case 'AUDITOR':
        // Aquí el botón "APROBAR" de tu pantalla debe hacer setReadOnly(true)
        return (
          <ProgramacionAutoAperturaForm
            readOnly={readOnly}
            setReadOnly={setReadOnly}
          />
        );

      case 'SUPERVISOR':
        // Aquí el botón "DEVOLVER" debe hacer setReadOnly(false)
        return (
          <ProgramacionAutoAperturaForm
            readOnly={readOnly}
            setReadOnly={setReadOnly}
          />
        );

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
