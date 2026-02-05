// src/pages/Tramite.tsx
import React, { useState } from "react";

/** ===================== TIPOS ===================== */
export type TramitePayload = {
  /** Datos del trámite */
  numeroTramite: string;
  red: string;
  actividad: string;
  estadoTramite: string;
  fechaInicio: string;
  usuarioGestion: string;

  /** Contribuyente */
  ruc: string;
  digitoVerificador?: string;
  razonSocial?: string;
  contribuyente: string;
  razonComercial?: string;

  /** Ubicación */
  ubicacionExpediente: string;

  /** Dirección (solo lectura) */
  direccionActual?: {
    provincia?: string;
    distrito?: string;
    corregimiento?: string;
    barrio?: string;
    calleAvenida?: string;
    nombreEdificio?: string;
    numeroCasaApto?: string;
    referencia?: string;
  };

  /** Contacto (solo lectura) */
  contactoActual?: {
    telFijo?: string;
    telMovil?: string;
    fax?: string;
    correo?: string;
  };

  /** Representante legal (solo lectura) */
  representanteLegal?: {
    nombre?: string;
    tipoDocumento?: string;
    cedula?: string;
    nacionalidad?: string;
  };

  /** Información del caso (solo lectura) */
  proceso?: string;
  origen?: string;
  programa?: string;
  numeroInformeAuditoria?: string;
  fechaInformeAuditoria?: string;

  /** Acta Inicio Fiscalización */
  actaInicioFiscalizacion?: {
    numero: string;
    fecha: string;
  };

  /** Obligaciones (solo lectura) */
  obligaciones?: Array<{
    impuesto: string;
    fechaDesde: string;
    fechaHasta?: string;
  }>;

  /** Acta Cierre */
  auditorAsignado?: string;
  supervisorAsignado?: string;
  aniosInvestigados?: string[];
  detalleInvestigacionInforme?: string;
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
  codigo: string; // OJO: lo tratamos como string SIEMPRE
  nombre: string;
};

type Props = {
  onGo: (ruta: string, state?: any) => void;
};

/** ===================== ESTILOS ===================== */
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

  /** ===================== DATA DEMO ===================== */
  const tramite: TramitePayload = {
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
    razonComercial: "TRANSPORTES Y SERVICIOS LOGÍSTICOS",

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

    actaInicioFiscalizacion: {
      numero: "723000001132",
      fecha: "18/02/2025",
    },

    obligaciones: [
      { impuesto: "202 - ITBMS", fechaDesde: "01/01/2009" },
      { impuesto: "102 - ISR", fechaDesde: "01/01/2012" },
      { impuesto: "140 - Aviso de Operación", fechaDesde: "01/01/2015" },
    ],

    auditorAsignado: "ZULEIMA ISABEL MORAN",
    supervisorAsignado: "LUIS BARTLETT",
    aniosInvestigados: ["2022", "2023", "2024"],
    detalleInvestigacionInforme:
      "Cruces con facturación electrónica y declaraciones juradas.",
  };

  /** ===================== DOCUMENTOS ===================== */
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

  /** ===================== FORMULARIOS ===================== */
  const formulariosCrear: FormularioCrear[] = [
    { codigo: "706", nombre: "INFORME FINAL AUDITORIA" },
    { codigo: "799", nombre: "ACTA DE CIERRE DE FISCALIZACIÓN" },
    { codigo: "720", nombre: "AUTO DE ARCHIVO" },
    { codigo: "725", nombre: "REQUERIMIENTO DE REGULARIZACIÓN (CONTROL EXTENSIVO)" },
  ];

  /** ✅ FIX: normalizamos el código (trim) y usamos switch */
  const crearFormulario = (codigoRaw: string) => {
    const codigo = String(codigoRaw).trim();
    console.log("[Tramite] crearFormulario:", { codigoRaw, codigo });

    switch (codigo) {
      case "706":
        onGo("PROCESOS DE AUDITORIAS/GESTIÓN/INFORME AUDITORIA", {
          tramite,
          formularioCodigo: "706",
        });
        return;

      case "799":
        onGo("PROCESOS DE AUDITORIAS/GESTIÓN/ACTA CIERRE", {
          tramite,
          formularioCodigo: "799",
        });
        return;

      case "720":
        onGo("PROCESOS DE AUDITORIAS/GESTIÓN/AUTO ARCHIVO", {
          tramite,
          formularioCodigo: "720",
        });
        return;

      // ✅ 725 => REQUERIMIENTO (esto ya lo tenías, lo dejo igual)
      case "725":
        onGo("PROCESOS DE AUDITORIAS/GESTIÓN/REQUERIMIENTO", {
          tramite,
          formularioCodigo: "725",
        });
        return;

      default:
        alert(`Formulario ${codigo} (demo)`);
        return;
    }
  };

  const guardar = () => alert("Nota guardada (demo)");
  const limpiar = () => setNota("");
  const enviar = () => {
    if (window.confirm("¿Enviar trámite?")) {
      alert("Trámite enviado (demo)");
    }
  };

  /** ===================== UI ===================== */
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
            <td style={tdStyle}>Estado: {tramite.estadoTramite}</td>
            <td style={tdStyle}>Inicio: {tramite.fechaInicio}</td>
            <td style={tdStyle}>Usuario: {tramite.usuarioGestion}</td>
          </tr>
          <tr>
            <td style={tdStyle}>
              RUC: {tramite.ruc}
              {tramite.digitoVerificador ? `-${tramite.digitoVerificador}` : ""}
            </td>
            <td style={tdStyle}>Contribuyente: {tramite.contribuyente}</td>
            <td style={tdStyle}>Ubicación: {tramite.ubicacionExpediente}</td>
          </tr>
        </tbody>
      </table>

      <h2 style={h2Style}>Documentos Asociados</h2>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Número</th>
            <th style={thStyle}>Nombre</th>
            <th style={thStyle}>Actividad</th>
            <th style={thStyle}>Estado</th>
            <th style={thStyle}>Fecha</th>
            <th style={thStyle}>Usuario</th>
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
      <table style={tableStyle}>
        <thead>
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

      <h2 style={h2Style}>Nota</h2>
      <textarea
        rows={4}
        style={{ width: "100%" }}
        value={nota}
        onChange={(e) => setNota(e.target.value)}
      />

      <div>
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
    </div>
  );
};

export default Tramite;
