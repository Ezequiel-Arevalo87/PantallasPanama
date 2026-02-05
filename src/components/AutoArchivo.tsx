// src/pages/AutoArchivo.tsx
import React, { useMemo, useState } from "react";
import { TramitePayload } from "../pages/Tramite";


type Props = {
  tramite?: TramitePayload;
  onGo?: (ruta: string, state?: any) => void;
};

const pageStyle: React.CSSProperties = {
  fontFamily: "Arial, sans-serif",
  margin: 20,
};

const h2Style: React.CSSProperties = { marginTop: 30 };

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
  verticalAlign: "top",
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

const muted: React.CSSProperties = { color: "#666", fontSize: 12 };

const safe = (v?: string) => (v && v.trim() ? v : "—");

export const AutoArchivo: React.FC<Props> = ({ tramite, onGo }) => {
  const demo: TramitePayload = useMemo(
    () => ({
      numeroTramite: "675000001027",
      red: "Control Extensivo v2",
      actividad: "2 - Análisis Auditor Control Extensivo",
      estadoTramite: "ASIGNADO",
      fechaInicio: "17/02/2025",
      usuarioGestion: "ZULEIMA ISABEL MORAN",

      ruc: "987654321",
      digitoVerificador: "02",
      razonSocial: "TRANSPORTES Y SERVICIOS LOGISTICOS S A",
      contribuyente: "TRANSPORTES Y SERVICIOS LOGISTICOS S A",
      ubicacionExpediente: "SECCIÓN DE CONTROL DE SERVICIO AL CONTRIBUYENTE",

      direccionActual: {
        provincia: "Panamá",
        distrito: "Panamá",
        corregimiento: "Bella Vista",
        barrio: "El Cangrejo",
        calleAvenida: "Vía España",
        nombreEdificio: "Edif. Torre Centro",
        numeroCasaApto: "Apto 12B",
        referencia: "Frente a farmacia X",
      },

      contactoActual: {
        telFijo: "203-4455",
        telMovil: "6677-8899",
        fax: "203-4400",
        correo: "contacto@transportes.com",
      },

      representanteLegal: {
        nombre: "JUAN PÉREZ",
        tipoDocumento: "CÉDULA",
        cedula: "8-123-456",
        nacionalidad: "PANAMEÑA",
      },

      proceso: "PROCESOS DE AUDITORIAS",
      origen: "CONTROL EXTENSIVO",
      programa: "CONTROL EXTENSIVO v2",
      numeroInformeAuditoria: "INF-2025-000123",
      fechaInformeAuditoria: "18/02/2025",
    }),
    []
  );

  const t = tramite ?? demo;

  const [motivo, setMotivo] = useState("");
  const maxChars = 8000;

  const onChangeMotivo = (val: string) => {
    if (val.length <= maxChars) setMotivo(val);
    else setMotivo(val.slice(0, maxChars));
  };

  const guardar = () => alert("Motivo guardado (demo).");
  const limpiar = () => setMotivo("");
  const enviar = () => {
    if (!window.confirm("¿Está seguro que desea enviar el Auto de Archivo?")) return;
    alert("Auto de Archivo enviado (demo).");
  };

  const volver = () => {
    if (!onGo) return;
    onGo("TRAMITE", { tramite: t });
  };

  return (
    <div style={pageStyle}>
      <h1>AUTO DE ARCHIVO</h1>
      <div style={muted}>
        Estos campos son de solo lectura y no pueden ser modificados por el auditor.
      </div>

      <h2 style={h2Style}>Información básica del contribuyente (solo lectura)</h2>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle} colSpan={2}>
              Identificación
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={tdStyle} width="30%">
              Número de RUC
            </td>
            <td style={tdStyle}>{safe(t.ruc)}</td>
          </tr>
          <tr>
            <td style={tdStyle}>Dígito Verificador</td>
            <td style={tdStyle}>{safe(t.digitoVerificador)}</td>
          </tr>
          <tr>
            <td style={tdStyle}>Razón Social</td>
            <td style={tdStyle}>{safe(t.razonSocial ?? t.contribuyente)}</td>
          </tr>
        </tbody>
      </table>

      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle} colSpan={2}>
              Datos de la dirección (solo lectura)
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={tdStyle} width="30%">
              Provincia
            </td>
            <td style={tdStyle}>{safe(t.direccionActual?.provincia)}</td>
          </tr>
          <tr>
            <td style={tdStyle}>Distrito</td>
            <td style={tdStyle}>{safe(t.direccionActual?.distrito)}</td>
          </tr>
          <tr>
            <td style={tdStyle}>Corregimiento</td>
            <td style={tdStyle}>{safe(t.direccionActual?.corregimiento)}</td>
          </tr>
          <tr>
            <td style={tdStyle}>Barrio</td>
            <td style={tdStyle}>{safe(t.direccionActual?.barrio)}</td>
          </tr>
          <tr>
            <td style={tdStyle}>Calle o Avenida</td>
            <td style={tdStyle}>{safe(t.direccionActual?.calleAvenida)}</td>
          </tr>
          <tr>
            <td style={tdStyle}>Nombre de Edificio</td>
            <td style={tdStyle}>{safe(t.direccionActual?.nombreEdificio)}</td>
          </tr>
          <tr>
            <td style={tdStyle}>Número de Casa/Apartamento</td>
            <td style={tdStyle}>{safe(t.direccionActual?.numeroCasaApto)}</td>
          </tr>
          <tr>
            <td style={tdStyle}>Dirección descriptiva</td>
            <td style={tdStyle}>{safe(t.direccionActual?.referencia)}</td>
          </tr>
        </tbody>
      </table>

      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle} colSpan={2}>
              Datos de contacto (solo lectura)
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={tdStyle} width="30%">
              Teléfono fijo
            </td>
            <td style={tdStyle}>{safe(t.contactoActual?.telFijo)}</td>
          </tr>
          <tr>
            <td style={tdStyle}>Teléfono móvil</td>
            <td style={tdStyle}>{safe(t.contactoActual?.telMovil)}</td>
          </tr>
          <tr>
            <td style={tdStyle}>Fax</td>
            <td style={tdStyle}>{safe(t.contactoActual?.fax)}</td>
          </tr>
          <tr>
            <td style={tdStyle}>Correo electrónico</td>
            <td style={tdStyle}>{safe(t.contactoActual?.correo)}</td>
          </tr>
        </tbody>
      </table>

      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle} colSpan={2}>
              Representante legal (solo lectura)
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={tdStyle} width="30%">
              Nombre
            </td>
            <td style={tdStyle}>{safe(t.representanteLegal?.nombre)}</td>
          </tr>
          <tr>
            <td style={tdStyle}>Tipo de Documento</td>
            <td style={tdStyle}>{safe(t.representanteLegal?.tipoDocumento)}</td>
          </tr>
          <tr>
            <td style={tdStyle}>Cédula</td>
            <td style={tdStyle}>{safe(t.representanteLegal?.cedula)}</td>
          </tr>
          <tr>
            <td style={tdStyle}>Nacionalidad</td>
            <td style={tdStyle}>{safe(t.representanteLegal?.nacionalidad)}</td>
          </tr>
        </tbody>
      </table>

      <h2 style={h2Style}>Información del caso (solo lectura)</h2>
      <table style={tableStyle}>
        <tbody>
          <tr>
            <td style={tdStyle} width="30%">
              Proceso
            </td>
            <td style={tdStyle}>{safe(t.proceso)}</td>
          </tr>
          <tr>
            <td style={tdStyle}>Origen</td>
            <td style={tdStyle}>{safe(t.origen)}</td>
          </tr>
          <tr>
            <td style={tdStyle}>Programa</td>
            <td style={tdStyle}>{safe(t.programa)}</td>
          </tr>
          <tr>
            <td style={tdStyle}>Número del informe de auditoría</td>
            <td style={tdStyle}>{safe(t.numeroInformeAuditoria)}</td>
          </tr>
          <tr>
            <td style={tdStyle}>Fecha del informe de auditoría</td>
            <td style={tdStyle}>{safe(t.fechaInformeAuditoria)}</td>
          </tr>
        </tbody>
      </table>

      <h2 style={h2Style}>Motivo para archivar el expediente (editable)</h2>
      <div style={muted}>
        Máximo {maxChars} caracteres. {motivo.length}/{maxChars}
      </div>
      <div style={{ marginTop: 10 }}>
        <textarea
          rows={10}
          style={{ width: "100%", padding: 10, boxSizing: "border-box" }}
          value={motivo}
          onChange={(e) => onChangeMotivo(e.target.value)}
          placeholder="Escriba el motivo del archivo del expediente..."
        />
      </div>

      <div style={{ marginTop: 10 }}>
        <button style={btnSecondary} onClick={guardar}>
          Guardar
        </button>
        <button style={btnSecondary} onClick={limpiar}>
          Limpiar
        </button>
        <button style={btnPrimary} onClick={enviar}>
          Enviar
        </button>
        {onGo && (
          <button style={btnSecondary} onClick={volver}>
            Volver
          </button>
        )}
      </div>
    </div>
  );
};

export default AutoArchivo;
