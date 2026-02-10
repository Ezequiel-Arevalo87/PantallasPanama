// src/pages/RequerimientoRegularizacion.tsx
import React, { useMemo, useState } from "react";
import jsPDF from "jspdf";
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

/** ===== Botones (mismo patrón que tu ejemplo) ===== */
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

/** ===== Modal PDF ===== */
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
  const extra = (t as any) as {
    fechaActaCierreFiscalizacion?: string;
    alcance?: string;
  };

  const direccionDescriptiva = t.direccionActual?.referencia;
  const numeroDocumento = t.representanteLegal?.cedula;

  /** ===== Word + upload ===== */
  const [uploadedWord, setUploadedWord] = useState<File | null>(null);

  /** ===== PDF preview ===== */
  const [openPdf, setOpenPdf] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string>("");

  const descargarWord = () => {
    // Word abre HTML como .doc (demo)
    const html = `
      <html>
        <head><meta charset="utf-8"/></head>
        <body style="font-family: Arial, sans-serif;">
          <h2>REQUERIMIENTO DE REGULARIZACIÓN</h2>

          <h3>Información básica del contribuyente</h3>
          <p><b>RUC:</b> ${safe(t.ruc)} &nbsp; <b>DV:</b> ${safe(t.digitoVerificador)}</p>
          <p><b>Razón social:</b> ${safe(t.razonSocial ?? t.contribuyente)}</p>

          <h3>Contacto</h3>
          <p>
            <b>Tel fijo:</b> ${safe(t.contactoActual?.telFijo)} |
            <b>Tel móvil:</b> ${safe(t.contactoActual?.telMovil)} |
            <b>Fax:</b> ${safe(t.contactoActual?.fax)} |
            <b>Correo:</b> ${safe(t.contactoActual?.correo)}
          </p>

          <h3>Dirección</h3>
          <p>
            <b>Provincia:</b> ${safe(t.direccionActual?.provincia)} |
            <b>Distrito:</b> ${safe(t.direccionActual?.distrito)} |
            <b>Corregimiento:</b> ${safe(t.direccionActual?.corregimiento)}
          </p>
          <p><b>Dirección descriptiva:</b> ${safe(direccionDescriptiva)}</p>

          <h3>Representante legal</h3>
          <p><b>Nombre:</b> ${safe(t.representanteLegal?.nombre)}</p>
          <p><b>Tipo Doc:</b> ${safe(t.representanteLegal?.tipoDocumento)}</p>
          <p><b>N° Documento:</b> ${safe(numeroDocumento)}</p>

          <h3>Información del caso</h3>
          <p><b>N° Acta Inicio Fiscalización:</b> ${safe(t.actaInicioFiscalizacion?.numero)}</p>
          <p><b>Fecha Acta Inicio Fiscalización:</b> ${safe(t.actaInicioFiscalizacion?.fecha)}</p>
          <p><b>Fecha Acta Cierre Fiscalización:</b> ${safe(extra.fechaActaCierreFiscalizacion)}</p>
          <p><b>Alcance:</b> ${safe(extra.alcance)}</p>

          <p style="color:#666; font-size:12px;">
            Nota: esta plantilla se descarga en Word para completar y luego subir al sistema.
          </p>
        </body>
      </html>
    `.trim();

    const blob = new Blob([html], { type: "application/msword;charset=utf-8" });
    const baseName = (t.numeroTramite ?? "SIN_TRAMITE").replace(/\s+/g, "_");
    downloadBlob(blob, `RequerimientoRegularizacion_${baseName}.doc`);
  };

  const generarPdf = () => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    let y = 44;

    const title = "REQUERIMIENTO DE REGULARIZACIÓN";

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(title, 40, y);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    const line = (label: string, value: string) => {
      y += 18;
      if (y > 780) {
        doc.addPage();
        y = 60;
      }
      doc.setFont("helvetica", "bold");
      doc.text(`${label}:`, 40, y);
      doc.setFont("helvetica", "normal");
      const v = value?.trim() ? value : "—";
      const parts = doc.splitTextToSize(v, 360);
      doc.text(parts, 240, y);
      y += (parts.length - 1) * 12;
    };

    // Contribuyente
    y += 10;
    doc.setFont("helvetica", "bold");
    doc.text("Información básica del contribuyente", 40, y);

    line("RUC", safe(t.ruc));
    line("DV", safe(t.digitoVerificador));
    line("Razón social", safe(t.razonSocial ?? t.contribuyente));

    // Contacto
    y += 14;
    doc.setFont("helvetica", "bold");
    doc.text("Contacto", 40, y);

    line("Tel fijo", safe(t.contactoActual?.telFijo));
    line("Tel móvil", safe(t.contactoActual?.telMovil));
    line("Fax", safe(t.contactoActual?.fax));
    line("Correo", safe(t.contactoActual?.correo));

    // Dirección
    y += 14;
    doc.setFont("helvetica", "bold");
    doc.text("Dirección", 40, y);

    line("Provincia", safe(t.direccionActual?.provincia));
    line("Distrito", safe(t.direccionActual?.distrito));
    line("Corregimiento", safe(t.direccionActual?.corregimiento));
    line("Dirección descriptiva", safe(direccionDescriptiva));

    // Representante
    y += 14;
    doc.setFont("helvetica", "bold");
    doc.text("Representante legal", 40, y);

    line("Nombre", safe(t.representanteLegal?.nombre));
    line("Tipo de documento", safe(t.representanteLegal?.tipoDocumento));
    line("Número de documento", safe(numeroDocumento));

    // Caso
    y += 14;
    doc.setFont("helvetica", "bold");
    doc.text("Información relacionada al caso", 40, y);

    line("N° Acta Inicio Fiscalización", safe(t.actaInicioFiscalizacion?.numero));
    line("Fecha Acta Inicio Fiscalización", safe(t.actaInicioFiscalizacion?.fecha));
    line("Fecha Acta Cierre Fiscalización", safe(extra.fechaActaCierreFiscalizacion));
    line("Alcance", safe(extra.alcance));

    const blob = doc.output("blob");
    const url = URL.createObjectURL(blob);
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    setPdfUrl(url);
    setOpenPdf(true);
  };

  const guardar = () => alert("Guardado (demo).");

  const enviar = () => {
    if (!window.confirm("¿Está seguro que desea enviar el Requerimiento de Regularización?")) return;

    // Si quieres obligar adjunto:
    // if (!uploadedWord) return alert("Debe subir el documento completado.");

    alert("Requerimiento enviado (demo).");
  };

  return (
    <div style={pageStyle}>
      <h1>REQUERIMIENTO DE REGULARIZACIÓN</h1>
      <div style={muted}>
        Los siguientes campos son de solo lectura y no pueden ser modificados por el auditor.
      </div>

      {/* ===== Modal PDF ===== */}
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

      {/* ===================== ✅ ABAJO: Documento Word + Botonera final ===================== */}
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
    </div>
  );
};

export default RequerimientoRegularizacion;
