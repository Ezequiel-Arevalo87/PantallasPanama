// ===============================================
// src/layout/Layout.tsx  (VERSIÓN COMPLETA)
// ===============================================
import React, { useEffect, useMemo, useState } from "react";
import { Sidebar } from "../components/Sidebar";
import { Box, Typography } from "@mui/material";

import logoDos from "../assets/logos/logoDos.png";

// Páginas del sistema
import { ProgramacionAutoAperturaForm } from "./ProgramacionAutoAperturaForm";
import { PresentacionVoluntaria } from "./PresentacionVoluntaria";
import { Eliminaciones } from "./Eliminaciones";
import { Rectificativa } from "./Rectificativa";
import { Cierre } from "./Cierre";
import { LiquidacionesAdicionales } from "./LiquidacionesAdicionales";
import { Priorizacion } from "./Priorizacion";
import { AsignacionesVarias } from "./AsignacionesVarias";
import VariacionesIngreso from "./VariacionesIngreso";
import AnalisisFiscal from "./AnalisisFiscal";
import Aprobaciones from "./Aprobaciones";
import VerificacionPage from "./VerificacionPage";
import TrazabilidadBusqueda from "./TrazabilidadBusqueda";
import ConsultasDeEstado from "./ConsultasDeEstado";
import PantallaControNotificacion from "../components/PantallaControNotificacion";

// ✅ NUEVO: Comunicaciones


// HOMES
import Home from "./Home";

import { NuevosCasos } from "./NuevosCasos";
import { readAprobados } from "../lib/workflowStorage";
import ActaInicio from "./ActaInicio";
import ComunicacionesForm from "./ComunicacionesForm";
import { CrearInformeAuditoria } from "./CrearInformeAuditoria";
import { Tramite } from "./Tramite";
import ComunicacionesEnviosPage from "./ComunicacionesEnviosPage";


// Rutas base
const AUD_PATH = "PROCESOS DE AUDITORIAS/AUDITOR";
const SUP_PATH = "PROCESOS DE AUDITORIAS/SUPERVISOR";
const DIR_PATH = "PROCESOS DE AUDITORIAS/DIRECTOR";

export const Layout: React.FC = () => {
  const [selectedPath, setSelectedPath] = useState<string>("HOME");
  const [readOnly, setReadOnly] = useState<boolean>(false);
const [routeState, setRouteState] = useState<any>(null);
  const leaf = useMemo(() => {
    if (!selectedPath) return "";
    const parts = selectedPath.split("/");
    return parts[parts.length - 1] ?? "";
  }, [selectedPath]);

  useEffect(() => {
    if (!selectedPath) return;

    if (
      leaf === "PROCESO DE AUDITORIA" &&
      readOnly &&
      selectedPath !== SUP_PATH
    ) {
      setSelectedPath(SUP_PATH);
    } else if (
      leaf === "SUPERVISOR" &&
      !readOnly &&
      selectedPath !== AUD_PATH
    ) {
      setSelectedPath(AUD_PATH);
    } else if (leaf === "DIRECTOR" && !readOnly && selectedPath !== DIR_PATH) {
      setSelectedPath(DIR_PATH);
    }
  }, [readOnly, leaf, selectedPath]);

  
const handleGo = (ruta: string, state?: any) => {
  setSelectedPath(ruta);
  setRouteState(state ?? null);
  setReadOnly(
    ruta === SUP_PATH ||
      ruta.endsWith("/SUPERVISOR") ||
      ruta === DIR_PATH ||
      ruta.endsWith("/DIRECTOR")
  );
};
 const handleSelect = (ruta: string) => {
  handleGo(ruta);
};

  const renderContent = () => {
    switch (leaf) {
      // HOMES
      case "HOME":
        return <Home onGo={handleSelect} contexto={selectedPath} />;

      // ✅ NUEVO: COMUNICACIONES
      case "COMUNICACIONES":
        return <ComunicacionesForm />;
      case "ENVIOS":
        return <ComunicacionesEnviosPage />;

      // RESTO DE PANTALLAS
      case "TRAZABILIDAD":
        return <TrazabilidadBusqueda />;

      case "SELECTOR DE CASOS Y PRIORIZACIÓN":
        return <Priorizacion />;

      case "VERIFICACION":
      case "VERIFICACIÓN":
        return <VerificacionPage />;

      case "APROBACION":
      case "APROBACIÓN":
        return <Aprobaciones />;

      case "ASIGNACION":
      case "ASIGNACIÓN": {
        const aprobados = readAprobados();
        return <NuevosCasos casosAprobados={aprobados} />;
      }

      case "SEGUIMIENTO Y CONTROL":
        return <ConsultasDeEstado />;

      /*   case 'INICIO DE AUDITORIA':
        return <Apertura />;*/

      case "PROCESO DE AUDITORIA":
      case "SUPERVISOR":
      case "DIRECTOR":
        return (
          <ProgramacionAutoAperturaForm
            readOnly={readOnly}
            setReadOnly={setReadOnly}
          />
        );

      case "TRAMITE":
  return <Tramite onGo={handleGo} />;

case "INFORME AUDITORIA":
  return <CrearInformeAuditoria tramite={routeState?.tramite} />;


      case "ACTA DE INICIO":
        return <ActaInicio />;

      case "NOTIFICACIÓN ACTA DE INICIO":
        return (
          <PantallaControNotificacion tipo="NOTIFICACIÓN ACTA DE INICIO" />
        );

      case "REVISIÓN SUPERVISOR":
        return <AsignacionesVarias tipo="REVISIÓN SUPERVISOR" />;

      case "REVISIÓN JEFE DE SECCIÓN":
        return <AsignacionesVarias tipo="REVISIÓN JEFE DE SECCIÓN" />;

      case "VARIACIÓN EN INGRESOS":
        return <VariacionesIngreso />;

      // case "HISTORIAL CUMPLIMIENTO":
      //   return <HistorialCumplimiento />;

      case "ANALISIS FISCAL":
        return <AnalisisFiscal />;

      case "PRESENTACIÓN VOLUNTARIA":
        return <PresentacionVoluntaria />;

      case "LIQUIDACIONES ADICIONALES":
        return <LiquidacionesAdicionales />;

      case "ELIMINACIONES":
        return <Eliminaciones />;

      case "RECTIFICATIVA":
        return <Rectificativa />;

      case "CIERRE":
        return <Cierre />;

      default:
        return null;
    }
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      height="100vh"
      sx={{ overflow: "hidden" }}
    >
      {/* ENCABEZADO */}
      <Box sx={{ width: "100%" }}>
        <img
          src={logoDos}
          alt="Encabezado DGI"
          style={{ width: "100%", height: "auto", display: "block" }}
        />
      </Box>

      {/* CONTENIDO */}
      <Box display="flex" flexGrow={1} sx={{ minHeight: 0 }}>
        {/* SIDEBAR */}
        <Box
          sx={{
            width: 300,
            backgroundColor: "#fdfdf5",
            borderRight: "2px solid #b5b5b5", // ⭐ línea clara y visible
            p: 2,
            height: "100%",
            overflowY: "auto",
            minHeight: 0,
            flexShrink: 0,
            position: "relative",
            zIndex: 2,
          }}
        >
          <Sidebar onSelect={handleSelect} selected={selectedPath} />
        </Box>

        {/* MAIN */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 4,
            pl: 5, // ⭐ separación estética
            backgroundColor: "#fff",
            overflowY: "auto",
            overflowX: "hidden",
            minWidth: 0,
            position: "relative",
            zIndex: 1,
          }}
        >
          <Typography variant="h5" gutterBottom>
            {selectedPath || "Selecciona una opción del menú"}
          </Typography>

          {renderContent()}
        </Box>
      </Box>
    </Box>
  );
};
