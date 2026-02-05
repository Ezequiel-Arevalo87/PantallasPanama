import React, { useMemo } from "react";
import type { TramitePayload } from "../pages/Tramite";

type Props = {
  tramite?: TramitePayload;
};

/** ===================== ESTILOS (mismo look que Tramite.tsx) ===================== */
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
  verticalAlign: "top",
};

const muted: React.CSSProperties = { color: "#666", fontSize: 12 };

const safe = (v?: string) => (v && v.trim() ? v : "—");

export const RequerimientoRegularizacion: React.FC<Props> = ({ tramite }) => {
  // ✅ fallback demo para que nunca crashee (usa el MISMO shape que TramitePayload actual)
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

      contactoActual: {
        telFijo: "203-4455",
        telMovil: "6677-8899",
        fax: "203-4400",
        correo: "contacto@transportes.com",
      },

      direccionActual: {
        provincia: "Panamá",
        distrito: "Panamá",
        corregimiento: "Bella Vista",
        // ✅ en tu tipo actual esto se llama "referencia"
        referencia: "Frente a farmacia X, Vía España",
      },

      representanteLegal: {
        nombre: "JUAN PÉREZ",
        tipoDocumento: "CÉDULA",
        // ✅ en tu tipo actual esto se llama "cedula"
        cedula: "8-123-456",
        nacionalidad: "PANAMEÑA",
      },

      actaInicioFiscalizacion: {
        numero: "723000001132",
        fecha: "18/02/2025",
      },
    }),
    []
  );

  const t = tramite ?? demo;

  // ✅ SIN DAÑAR NADA: leemos estos campos “nuevos” como opcionales vía any
  // (cuando quieras, luego los agregamos formalmente a TramitePayload)
  const extra = (t as any) as {
    fechaActaCierreFiscalizacion?: string;
    alcance?: string;
  };

  // ✅ Adaptación HU:
  // - Dirección descriptiva => usamos direccionActual.referencia (ya existe)
  // - Número de documento => usamos representanteLegal.cedula (ya existe)
  const direccionDescriptiva = t.direccionActual?.referencia;
  const numeroDocumento = t.representanteLegal?.cedula;

  return (
    <div style={pageStyle}>
      <h1>REQUERIMIENTO DE REGULARIZACIÓN</h1>
      <div style={muted}>
        Los siguientes campos son de solo lectura y no pueden ser modificados por el auditor.
      </div>

      {/* ===================== INFO CONTRIBUYENTE ===================== */}
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
            <td style={tdStyle}>Dígito verificador</td>
            <td style={tdStyle}>{safe(t.digitoVerificador)}</td>
          </tr>
          <tr>
            <td style={tdStyle}>Razón social</td>
            <td style={tdStyle}>{safe(t.razonSocial ?? t.contribuyente)}</td>
          </tr>
        </tbody>
      </table>

      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle} colSpan={2}>
              Información de Contacto (solo lectura)
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
            <td style={tdStyle}>Dirección descriptiva</td>
            <td style={tdStyle}>{safe(direccionDescriptiva)}</td>
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
            <td style={tdStyle}>Número de Documento</td>
            <td style={tdStyle}>{safe(numeroDocumento)}</td>
          </tr>
        </tbody>
      </table>

      {/* ===================== INFO CASO ===================== */}
      <h2 style={h2Style}>Información relacionada al caso (solo lectura)</h2>
      <table style={tableStyle}>
        <tbody>
          <tr>
            <td style={tdStyle} width="30%">
              Número de Acta de Inicio de Fiscalización
            </td>
            <td style={tdStyle}>{safe(t.actaInicioFiscalizacion?.numero)}</td>
          </tr>
          <tr>
            <td style={tdStyle}>Fecha de Acta de Inicio de Fiscalización</td>
            <td style={tdStyle}>{safe(t.actaInicioFiscalizacion?.fecha)}</td>
          </tr>
          <tr>
            <td style={tdStyle}>Fecha de Acta de Cierre de Fiscalización</td>
            <td style={tdStyle}>{safe(extra.fechaActaCierreFiscalizacion)}</td>
          </tr>
          <tr>
            <td style={tdStyle}>Alcance</td>
            <td style={tdStyle}>{safe(extra.alcance)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default RequerimientoRegularizacion;
