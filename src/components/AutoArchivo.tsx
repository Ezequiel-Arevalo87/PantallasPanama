// src/pages/AutoArchivo.tsx
import React, { useMemo, useState } from "react";
import jsPDF from "jspdf";
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
  padding: "10px 14px",
  margin: "10px 6px 0 0",
  cursor: "pointer",
  border: "none",
  borderRadius: 8,
  fontWeight: 800,
};

const btnSecondary: React.CSSProperties = {
  ...btnBase,
  background: "#6c757d",
  color: "#fff",
};

const btnSuccess: React.CSSProperties = {
  ...btnBase,
  background: "#28a745",
  color: "#fff",
};

const btnPrimary: React.CSSProperties = {
  ...btnBase,
  background: "#007bff",
  color: "#fff",
};

const btnDanger: React.CSSProperties = {
  ...btnBase,
  background: "#dc3545",
  color: "#fff",
};

const muted: React.CSSProperties = { color: "#666", fontSize: 12 };

const card: React.CSSProperties = {
  border: "none",
  borderRadius: 10,
  padding: 12,
  marginTop: 12,
  background: "#fff",
  boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
};

const sectionTitle: React.CSSProperties = {
  fontWeight: 900,
  marginBottom: 10,
  fontSize: 14,
};

const modalOverlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.55)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 16,
  zIndex: 9999,
};

const modalCard: React.CSSProperties = {
  width: "min(980px, 96vw)",
  height: "min(760px, 92vh)",
  background: "#fff",
  borderRadius: 12,
  overflow: "hidden",
  boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
  display: "flex",
  flexDirection: "column",
};

const modalHeader: React.CSSProperties = {
  padding: "12px 14px",
  borderBottom: "1px solid #e5e5e5",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const safe = (v?: string) => (v && v.trim() ? v : "—");

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1200);
}

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

  /** ===== Motivo ===== */
  const [motivo, setMotivo] = useState("");
  const maxChars = 8000;

  const onChangeMotivo = (val: string) => {
    if (val.length <= maxChars) setMotivo(val);
    else setMotivo(val.slice(0, maxChars));
  };

  /** ===== Word upload ===== */
  const [uploadedWord, setUploadedWord] = useState<File | null>(null);

  /** ===== PDF Preview ===== */
  const [openPdf, setOpenPdf] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string>("");

  const descargarWord = () => {
    // Word abre HTML como .doc sin problema (demo)
    const html = `
      <html>
        <head><meta charset="utf-8"/></head>
        <body style="font-family: Arial, sans-serif;">
          <h2>AUTO DE ARCHIVO</h2>
          <p><b>RUC:</b> ${safe(t.ruc)} &nbsp; <b>DV:</b> ${safe(t.digitoVerificador)}</p>
          <p><b>Razón social:</b> ${safe(t.razonSocial ?? t.contribuyente)}</p>
          <p><b>Proceso:</b> ${safe(t.proceso)} | <b>Origen:</b> ${safe(t.origen)} | <b>Programa:</b> ${safe(
      t.programa
    )}</p>
          <p><b>N° Informe auditoría:</b> ${safe(t.numeroInformeAuditoria)}</p>
          <p><b>Fecha informe auditoría:</b> ${safe(t.fechaInformeAuditoria)}</p>
          <hr/>
          <h3>Motivo para archivar</h3>
          <p>${(motivo || "—").replace(/\n/g, "<br/>")}</p>
          <p style="color:#666; font-size:12px;">Plantilla para completar y adjuntar al sistema.</p>
        </body>
      </html>
    `.trim();

    const blob = new Blob([html], { type: "application/msword;charset=utf-8" });
    const ruc = (t.ruc ?? "SIN_RUC").replace(/\s+/g, "_");
    downloadBlob(blob, `AutoArchivo_${ruc}.doc`);
  };

  const generarPdf = () => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    let y = 44;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("AUTO DE ARCHIVO", 40, y);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    const line = (label: string, value: string) => {
      y += 18;
      doc.setFont("helvetica", "bold");
      doc.text(`${label}:`, 40, y);
      doc.setFont("helvetica", "normal");
      doc.text(value || "—", 240, y);
    };

    line("RUC", safe(t.ruc));
    line("DV", safe(t.digitoVerificador));
    line("Razón social", safe(t.razonSocial ?? t.contribuyente));
    line("Proceso", safe(t.proceso));
    line("Origen", safe(t.origen));
    line("Programa", safe(t.programa));
    line("N° Informe auditoría", safe(t.numeroInformeAuditoria));
    line("Fecha informe auditoría", safe(t.fechaInformeAuditoria));

    y += 26;
    doc.setFont("helvetica", "bold");
    doc.text("Motivo para archivar", 40, y);

    y += 14;
    doc.setFont("helvetica", "normal");
    const motivoTxt = motivo.trim() ? motivo.trim() : "—";
    const lines = doc.splitTextToSize(motivoTxt, 515);
    doc.text(lines, 40, y);

    const blob = doc.output("blob");
    const url = URL.createObjectURL(blob);
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    setPdfUrl(url);
    setOpenPdf(true);
  };

  const guardar = () => alert("Guardado (demo).");

  const limpiar = () => setMotivo("");

  const enviar = () => {
    if (!window.confirm("¿Está seguro que desea enviar el Auto de Archivo?")) return;

    // Si quieres obligar Word/PDF adjunto, descomenta:
    // if (!uploadedWord) return alert("Debe subir el documento completado.");

    alert("Auto de Archivo enviado (demo).");
  };

  const volver = () => {
    if (!onGo) return;
    onGo("TRAMITE", { tramite: t });
  };

  return (
    <div style={pageStyle}>
      <h1>AUTO DE ARCHIVO</h1>
      <div style={muted}>Estos campos son de solo lectura y no pueden ser modificados por el auditor.</div>

      {/* ===== Modal PDF (igual patrón que tu ejemplo) ===== */}
      {openPdf && (
        <div style={modalOverlay} onClick={() => setOpenPdf(false)}>
          <div style={modalCard} onClick={(e) => e.stopPropagation()}>
            <div style={modalHeader}>
              <b>Vista previa PDF</b>
              <button style={{ ...btnDanger, margin: 0 }} onClick={() => setOpenPdf(false)}>
                Cerrar
              </button>
            </div>
            <div style={{ flex: 1 }}>
              <iframe
                title="pdf-preview"
                src={pdfUrl}
                style={{ width: "100%", height: "100%", border: "none" }}
              />
            </div>
          </div>
        </div>
      )}

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
          style={{
            width: "100%",
            padding: 10,
            boxSizing: "border-box",
            borderRadius: 8,
            border: "1px solid #ccc",
          }}
          value={motivo}
          onChange={(e) => onChangeMotivo(e.target.value)}
          placeholder="Escriba el motivo del archivo del expediente..."
        />
      </div>

      {/* ===================== ✅ ABAJO como tu ejemplo ===================== */}
      <div style={card}>
        <div style={sectionTitle}>Documento Word</div>

        <button style={btnSecondary} onClick={descargarWord}>
          Descargar en Word
        </button>

        <div style={{ marginTop: 10 }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Subir documento completado</div>
          <input
            type="file"
            accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.pdf"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              setUploadedWord(f);
            }}
          />
          <div style={{ marginTop: 6, color: "#666", fontSize: 12 }}>
            Archivo: <b>{uploadedWord ? uploadedWord.name : "Ninguno"}</b>
          </div>
        </div>
      </div>

      <hr style={{ marginTop: 16 }} />

      <button style={btnSecondary} onClick={generarPdf}>
        Vista Previa (PDF)
      </button>
      <button style={btnSuccess} onClick={guardar}>
        Guardar
      </button>
      <button style={btnPrimary} onClick={enviar}>
        Enviar
      </button>
      <button style={btnSecondary} onClick={limpiar}>
        Limpiar
      </button>

      {onGo && (
        <button style={btnSecondary} onClick={volver}>
          Volver
        </button>
      )}
    </div>
  );
};

export default AutoArchivo;
