// src/pages/Tramite.tsx
import React, { useState } from "react";

/** ===================== TIPOS ===================== */
export type TramitePayload = {
  numeroTramite: string;
  red: string;
  actividad: string;
  estadoTramite: string;
  fechaInicio: string;
  usuarioGestion: string;
  ruc: string;
  contribuyente: string;
  ubicacionExpediente: string;
};

type DocumentoAsociado = {
  numero: string;
  nombre: string;
  actividad: string;
  estado: string;
  fecha: string;
  usuario: string;
};

type FormularioCrear = {
  codigo: string;
  nombre: string;
};

type Props = {
  onGo: (ruta: string, state?: any) => void;
};

/** ===================== ESTILOS (igual HTML) ===================== */
const pageStyle: React.CSSProperties = {
  fontFamily: "Arial, sans-serif",
  margin: 20,
};

const h2Style: React.CSSProperties = {
  marginTop: 30,
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  marginTop: 10,
};

const thStyle: React.CSSProperties = {
  border: "1px solid #ccc",
  padding: 8,
  textAlign: "left",
  backgroundColor: "#f2f2f2",
};

const tdStyle: React.CSSProperties = {
  border: "1px solid #ccc",
  padding: 8,
  textAlign: "left",
};

const btnBase: React.CSSProperties = {
  padding: "8px 12px",
  margin: "5px",
  cursor: "pointer",
  border: "none",
};

const btnPrimary: React.CSSProperties = {
  ...btnBase,
  backgroundColor: "#007bff",
  color: "white",
};

const btnSecondary: React.CSSProperties = {
  ...btnBase,
  backgroundColor: "#6c757d",
  color: "white",
};

/** ===================== COMPONENTE ===================== */
export const Tramite: React.FC<Props> = ({ onGo }) => {
  const [nota, setNota] = useState("");

  // ✅ Igual al HTML
  const tramite: TramitePayload = {
    numeroTramite: "675000001027",
    red: "Control Extensivo v2",
    actividad: "2 - Análisis Auditor Control Extensivo",
    estadoTramite: "ASIGNADO",
    fechaInicio: "17/02/2025",
    usuarioGestion: "ZULEIMA ISABEL MORAN",
    ruc: "987654321-2-2021",
    contribuyente: "TRANSPORTES Y SERVICIOS LOGISTICOS S A",
    ubicacionExpediente: "SECCIÓN DE CONTROL DE SERVICIO AL CONTRIBUYENTE",
  };

  const documentosAsociados: DocumentoAsociado[] = [
    {
      numero: "101600001131",
      nombre: "AUTO DE APERTURA FISCALIZACIÓN DIGITAL",
      actividad: "1 - Asignación de Casos",
      estado: "APROBADO",
      fecha: "17/02/2025",
      usuario: "JOANNA VIVIAN MUÑOZ DELGADO",
    },
    {
      numero: "723000001132",
      nombre: "ACTA DE INICIO DE FISCALIZACIÓN",
      actividad: "2 - Análisis Auditor Control Extensivo",
      estado: "APROBADO",
      fecha: "18/02/2025",
      usuario: "ZULEIMA ISABEL MORAN",
    },
  ];

  const formulariosCrear: FormularioCrear[] = [
    { codigo: "706", nombre: "INFORME FINAL AUDITORIA" },
    { codigo: "720", nombre: "AUTO DE ARCHIVO" },
    { codigo: "725", nombre: "REQUERIMIENTO DE REGULARIZACIÓN (CONTROL EXTENSIVO)" },
  ];

  const crearFormulario = (codigo: string) => {
    // ✅ flujo que pediste: Trámite -> Informe de auditoría al crear 706
    if (codigo === "706") {
      onGo("PROCESOS DE AUDITORIAS/GESTIÓN DE AUDITORIA/INFORME AUDITORIA", {
        tramite,
      });
      return;
    }

    // otros formularios (simulación)
    alert(`Crear formulario código ${codigo} (demo)`);
  };

  const guardar = () => {
    alert("Nota guardada (demo).");
  };

  const limpiar = () => {
    setNota("");
  };

  const enviar = () => {
    const ok = window.confirm("¿Está seguro que desea enviar el trámite?");
    if (!ok) return;
    alert("Trámite enviado (demo).");
  };

  return (
    <div style={pageStyle}>
      <h1>Pantalla BPM - Gestión de la Actividad</h1>

      <h2 style={h2Style}>Datos Generales del Proceso</h2>
      <table style={tableStyle}>
        <tbody>
          <tr>
            <td style={tdStyle}>Número de Trámite: {tramite.numeroTramite}</td>
            <td style={tdStyle}>Red: {tramite.red}</td>
            <td style={tdStyle}>Actividad: {tramite.actividad}</td>
          </tr>
          <tr>
            <td style={tdStyle}>Estado del Trámite: {tramite.estadoTramite}</td>
            <td style={tdStyle}>Fecha de Inicio: {tramite.fechaInicio}</td>
            <td style={tdStyle}>Usuario de Gestión: {tramite.usuarioGestion}</td>
          </tr>
          <tr>
            <td style={tdStyle}>RUC: {tramite.ruc}</td>
            <td style={tdStyle}>Contribuyente: {tramite.contribuyente}</td>
            <td style={tdStyle}>
              Ubicación Expediente Físico: {tramite.ubicacionExpediente}
            </td>
          </tr>
        </tbody>
      </table>

      <h2 style={h2Style}>Documentos Asociados</h2>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle} colSpan={6}>
              Lista de documentos asociados al proceso
            </th>
          </tr>
          <tr>
            <th style={thStyle}>Número del documento</th>
            <th style={thStyle}>Nombre del documento</th>
            <th style={thStyle}>Actividad</th>
            <th style={thStyle}>Estado</th>
            <th style={thStyle}>Fecha de creación</th>
            <th style={thStyle}>Usuario de creación</th>
          </tr>
        </thead>
        <tbody>
          {documentosAsociados.map((d) => (
            <tr key={d.numero}>
              <td style={tdStyle}>{d.numero}</td>
              <td style={tdStyle}>{d.nombre}</td>
              <td style={tdStyle}>{d.actividad}</td>
              <td style={tdStyle}>{d.estado}</td>
              <td style={tdStyle}>{d.fecha}</td>
              <td style={tdStyle}>{d.usuario}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 style={h2Style}>Gestión de Documentos</h2>

      {/* Lista de formularios para creación */}
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle} colSpan={3}>
              Lista de formularios para creación
            </th>
          </tr>
          <tr>
            <th style={thStyle}>Crear</th>
            <th style={thStyle}>Código del formulario</th>
            <th style={thStyle}>Nombre del formulario</th>
          </tr>
        </thead>
        <tbody>
          {formulariosCrear.map((f) => (
            <tr key={f.codigo}>
              <td style={tdStyle}>
                <button style={btnPrimary} onClick={() => crearFormulario(f.codigo)}>
                  Crear
                </button>
              </td>
              <td style={tdStyle}>{f.codigo}</td>
              <td style={tdStyle}>{f.nombre}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Lista de formularios para gestión */}
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle} colSpan={7}>
              Lista de formularios para gestión
            </th>
          </tr>
          <tr>
            <th style={thStyle}>Editar</th>
            <th style={thStyle}>Aprobar</th>
            <th style={thStyle}>Eliminar</th>
            <th style={thStyle}>Número del documento</th>
            <th style={thStyle}>Nombre del documento</th>
            <th style={thStyle}>Estado</th>
            <th style={thStyle}>Fecha de creación</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={tdStyle} colSpan={7} align="center">
              No hay formularios pendientes de gestión
            </td>
          </tr>
        </tbody>
      </table>

      <h2 style={h2Style}>Nota</h2>
      <div>
        <textarea
          rows={4}
          cols={80}
          style={{ width: "100%" }}
          value={nota}
          onChange={(e) => setNota(e.target.value)}
        />
      </div>

      <button style={btnSecondary} onClick={guardar}>
        Guardar
      </button>
      <button style={btnSecondary} onClick={limpiar}>
        Limpiar
      </button>
      <button style={btnPrimary} onClick={enviar}>
        Enviar
      </button>
    </div>
  );
};

export default Tramite;
