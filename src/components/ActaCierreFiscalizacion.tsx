// src/pages/ActaCierreFiscalizacion.tsx
import React, { useMemo, useState } from "react";
import jsPDF from "jspdf";

import {TramitePayload} from "../pages/Tramite";


/** ===================== TIPOS ===================== */
type AccionConferencia =
  | "Concertar conferencia con el contribuyente"
  | "Suspender el caso improductivo"
  | "Omitir la conferencia por la siguiente razón";

type Props = {
  tramite?: TramitePayload;
};

/** ===================== ESTILOS ===================== */
const pageStyle: React.CSSProperties = { fontFamily: "Arial, sans-serif", margin: 20 };

const card: React.CSSProperties = {
  border: "1px solid #e5e5e5",
  borderRadius: 10,
  padding: 12,
  marginTop: 12,
  background: "#fff",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: 6,
  boxSizing: "border-box",
};

const tdStyle: React.CSSProperties = { border: "1px solid #ccc", padding: 8 };
const thStyle: React.CSSProperties = {
  border: "1px solid #ccc",
  padding: 8,
  background: "#f2f2f2",
  textAlign: "left",
};

const btnBase: React.CSSProperties = {
  padding: "10px 15px",
  margin: "10px 6px 0 0",
  cursor: "pointer",
  border: "none",
  borderRadius: 6,
  fontWeight: 700,
};

const btnSecondary: React.CSSProperties = { ...btnBase, background: "#6c757d", color: "#fff" };
const btnSuccess: React.CSSProperties = { ...btnBase, background: "#28a745", color: "#fff" };
const btnPrimary: React.CSSProperties = { ...btnBase, background: "#007bff", color: "#fff" };

const fmt = (v?: string) => (v && String(v).trim() ? String(v) : "-");

/** ===================== COMPONENTE ===================== */
export const ActaCierreFiscalizacion: React.FC<Props> = ({ tramite }) => {
  /** ===== PDF ===== */
  const [openPdf, setOpenPdf] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string>("");

  /** ===== Word + upload ===== */
  const [uploadedWord, setUploadedWord] = useState<File | null>(null);

  /** ===== Form ===== */
  const [accion, setAccion] = useState<AccionConferencia>(
    "Concertar conferencia con el contribuyente"
  );
  const [razonOmitir, setRazonOmitir] = useState<string>("");

  /** ===== Datos solo lectura (desde tramite) ===== */
  const ruc = fmt(tramite?.ruc);
  const dv = fmt(tramite?.digitoVerificador);
  const razonSocial = fmt(tramite?.razonSocial ?? tramite?.contribuyente);
  const auditor = fmt(tramite?.auditorAsignado ?? tramite?.usuarioGestion);
  const supervisor = fmt(tramite?.supervisorAsignado);
  const actaInicioNumero = fmt(tramite?.actaInicioFiscalizacion?.numero);
  const actaInicioFecha = fmt(tramite?.actaInicioFiscalizacion?.fecha);
  const aniosInvestigados = (tramite?.aniosInvestigados ?? []) as string[];

  const detalleInvestigacion = useMemo(() => {
    const v = tramite?.detalleInvestigacionInforme;
    return v && String(v).trim() ? String(v) : "-";
  }, [tramite?.detalleInvestigacionInforme]);

  const validar = (): boolean => {
    if (!tramite) {
      alert("No hay trámite seleccionado.");
      return false;
    }
    if (accion === "Omitir la conferencia por la siguiente razón") {
      if (!razonOmitir.trim()) {
        alert("Debe indicar la Razón para omitir la conferencia de cierre.");
        return false;
      }
    }
    return true;
  };

  /** ✅ Word: descarga plantilla (Word abre HTML sin problema) */
  const descargarWord = () => {
    if (!validar()) return;

    const aniosHtml = aniosInvestigados.length
      ? aniosInvestigados.map((x) => `<li>${x}</li>`).join("")
      : `<li>-</li>`;

    const html = `
      <html>
        <head><meta charset="utf-8"/></head>
        <body style="font-family: Arial, sans-serif;">
          <h2>ACTA DE CIERRE DE FISCALIZACIÓN</h2>

          <h3>Datos del Contribuyente</h3>
          <p><b>RUC:</b> ${ruc}</p>
          <p><b>Dígito Verificador:</b> ${dv}</p>
          <p><b>Razón Social:</b> ${razonSocial}</p>

          <h3>Datos del Caso</h3>
          <p><b>Años Investigados:</b></p>
          <ul>${aniosHtml}</ul>

          <p><b>Auditor:</b> ${auditor}</p>
          <p><b>Supervisor:</b> ${supervisor}</p>

          <h3>Acta de Inicio de Fiscalización</h3>
          <p><b>Número:</b> ${actaInicioNumero}</p>
          <p><b>Fecha:</b> ${actaInicioFecha}</p>

          <h3>Acción Conferencia de Cierre</h3>
          <p><b>Acción:</b> ${accion}</p>
          ${
            accion === "Omitir la conferencia por la siguiente razón"
              ? `<p><b>Razón para omitir la conferencia de cierre:</b><br/>${razonOmitir
                  .replace(/</g, "&lt;")
                  .replace(/>/g, "&gt;")
                  .replace(/\n/g, "<br/>")}</p>`
              : ""
          }

          <h3>Detalle de la Investigación (solo lectura)</h3>
          <p>${detalleInvestigacion.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br/>")}</p>

          <hr/>
          <p style="color:#666; font-size:12px;">
            Descargue este documento para incluir firmas y luego adjúntelo en el sistema.
          </p>

          <br/><br/>
          <div>
            <b>Firma Auditor:</b> ________________________________
          </div>
          <br/><br/>
          <div>
            <b>Firma Supervisor:</b> ______________________________
          </div>
        </body>
      </html>
    `.trim();

    const blob = new Blob([html], { type: "application/msword;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    const baseName = tramite?.numeroTramite ? `${tramite.numeroTramite}` : "SIN_TRAMITE";
    a.download = `ActaCierre_${baseName}.doc`;
    document.body.appendChild(a);
    a.click();
    a.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1500);
  };

  const vistaPreviaPdf = () => {
    if (!validar()) return;

    const doc = new jsPDF({ unit: "pt", format: "a4" });
    let y = 40;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("ACTA DE CIERRE DE FISCALIZACIÓN", 40, y);
    y += 18;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    const line = (label: string, value: string) => {
      if (y > 760) {
        doc.addPage();
        y = 60;
      }
      doc.setFont("helvetica", "bold");
      doc.text(`${label}:`, 40, (y += 14));
      doc.setFont("helvetica", "normal");
      doc.text(value, 200, y);
    };

    doc.setFont("helvetica", "bold");
    doc.text("Datos del Contribuyente", 40, (y += 14));
    doc.setFont("helvetica", "normal");

    line("RUC", ruc);
    line("Dígito Verificador", dv);
    line("Razón Social", razonSocial);

    doc.setFont("helvetica", "bold");
    doc.text("Datos del Caso", 40, (y += 18));
    doc.setFont("helvetica", "normal");

    const anios = aniosInvestigados.length ? aniosInvestigados.join(", ") : "-";
    line("Años Investigados", anios);
    line("Auditor", auditor);
    line("Supervisor", supervisor);

    doc.setFont("helvetica", "bold");
    doc.text("Acta de Inicio de Fiscalización", 40, (y += 18));
    doc.setFont("helvetica", "normal");
    line("Número", actaInicioNumero);
    line("Fecha", actaInicioFecha);

    doc.setFont("helvetica", "bold");
    doc.text("Acción Conferencia de Cierre", 40, (y += 18));
    doc.setFont("helvetica", "normal");
    line("Acción", accion);

    if (accion === "Omitir la conferencia por la siguiente razón") {
      doc.setFont("helvetica", "bold");
      doc.text("Razón para omitir la conferencia de cierre:", 40, (y += 16));
      doc.setFont("helvetica", "normal");
      const lines = doc.splitTextToSize(razonOmitir || "-", 520);
      doc.text(lines, 40, (y += 14));
      y += lines.length * 10;
    }

    doc.setFont("helvetica", "bold");
    doc.text("Detalle de la Investigación (solo lectura)", 40, (y += 18));
    doc.setFont("helvetica", "normal");
    const detLines = doc.splitTextToSize(detalleInvestigacion, 520);
    doc.text(detLines, 40, (y += 14));
    y += detLines.length * 10;

    doc.setFont("helvetica", "bold");
    doc.text("Firma Auditor: ________________________________", 40, (y += 28));
    doc.text("Firma Supervisor: _____________________________", 40, (y += 18));

    const blob = doc.output("blob");
    const url = URL.createObjectURL(blob);
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    setPdfUrl(url);
    setOpenPdf(true);
  };

  const guardar = () => {
    if (!validar()) return;
    alert("Guardado (demo).");
  };

  const enviar = () => {
    if (!validar()) return;
    const ok = window.confirm("¿Está seguro que desea enviar el acta de cierre al supervisor?");
    if (!ok) return;
    alert("Enviado (demo).");
  };

  return (
    <div style={pageStyle}>
      <h1>Acta de Cierre de Fiscalización</h1>

      {/* ===== Modal PDF ===== */}
      {openPdf && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            zIndex: 9999,
          }}
          onClick={() => setOpenPdf(false)}
        >
          <div
            style={{
              width: "min(980px, 96vw)",
              height: "min(720px, 92vh)",
              background: "#fff",
              borderRadius: 10,
              overflow: "hidden",
              boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
              display: "flex",
              flexDirection: "column",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: "10px 12px",
                borderBottom: "1px solid #e5e5e5",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <b>Vista previa PDF</b>
              <button
                style={{ ...btnBase, margin: 0, background: "#dc3545", color: "#fff" }}
                onClick={() => setOpenPdf(false)}
              >
                Cerrar
              </button>
            </div>
            <div style={{ flex: 1 }}>
              <iframe title="pdf-preview" src={pdfUrl} style={{ width: "100%", height: "100%" }} />
            </div>
          </div>
        </div>
      )}

      {/* ================= DATOS SOLO LECTURA ================= */}
      <div style={card}>
        <div style={{ fontWeight: 900, marginBottom: 8 }}>Datos del Contribuyente</div>

        {!tramite ? (
          <div style={{ color: "#b00", fontWeight: 700 }}>
            No hay trámite seleccionado. Regrese a Trámite y presione “Crear (799)”.
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              <tr>
                <td style={tdStyle}>
                  RUC: <b>{ruc}</b>
                </td>
                <td style={tdStyle}>
                  Dígito verificador: <b>{dv}</b>
                </td>
                <td style={tdStyle}>
                  Razón social: <b>{razonSocial}</b>
                </td>
              </tr>
            </tbody>
          </table>
        )}
      </div>

      <div style={card}>
        <div style={{ fontWeight: 900, marginBottom: 8 }}>Datos del Caso</div>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            <tr>
              <td style={tdStyle}>
                Años investigados:{" "}
                <b>{aniosInvestigados.length ? aniosInvestigados.join(", ") : "-"}</b>
              </td>
              <td style={tdStyle}>
                Auditor: <b>{auditor}</b>
              </td>
              <td style={tdStyle}>
                Supervisor: <b>{supervisor}</b>
              </td>
            </tr>
            <tr>
              <td style={tdStyle}>
                N° Acta de Inicio de Fiscalización: <b>{actaInicioNumero}</b>
              </td>
              <td style={tdStyle} colSpan={2}>
                Fecha Acta de Inicio de Fiscalización: <b>{actaInicioFecha}</b>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ================= ACCIÓN CONFERENCIA ================= */}
      <fieldset style={{ marginTop: 12 }}>
        <legend>Acción Conferencia de Cierre</legend>

        <label style={{ display: "block", fontWeight: 700 }}>Acción Conferencia de Cierre</label>
        <select
          style={inputStyle}
          value={accion}
          onChange={(e) => {
            const v = e.target.value as AccionConferencia;
            setAccion(v);
            if (v !== "Omitir la conferencia por la siguiente razón") setRazonOmitir("");
          }}
        >
          <option>Concertar conferencia con el contribuyente</option>
          <option>Suspender el caso improductivo</option>
          <option>Omitir la conferencia por la siguiente razón</option>
        </select>

        {accion === "Omitir la conferencia por la siguiente razón" && (
          <div style={{ marginTop: 10 }}>
            <label style={{ display: "block", fontWeight: 700 }}>
              Razón para omitir la conferencia de cierre
            </label>
            <textarea
              rows={4}
              style={inputStyle}
              value={razonOmitir}
              onChange={(e) => setRazonOmitir(e.target.value)}
              placeholder="Escriba la razón..."
            />
          </div>
        )}
      </fieldset>

      {/* ================= DETALLE INVESTIGACIÓN (SOLO LECTURA) ================= */}
      <div style={card}>
        <div style={{ fontWeight: 900, marginBottom: 8 }}>Detalle de la Investigación (solo lectura)</div>
        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: 8,
            padding: 10,
            background: "#fafafa",
            whiteSpace: "pre-wrap",
            lineHeight: 1.4,
          }}
        >
          {detalleInvestigacion}
        </div>
        <div style={{ marginTop: 6, color: "#666", fontSize: 12 }}>
          * Este campo se llena en el Informe de Auditoría y aquí solo se consulta.
        </div>
      </div>

      {/* ================= WORD: Descargar + Subir ================= */}
      <div style={card}>
        <div style={{ fontWeight: 900, marginBottom: 8 }}>Documento Word</div>

        <button style={btnSecondary} onClick={descargarWord}>
          Descargar acta en Word
        </button>

        <div style={{ marginTop: 10 }}>
          <label style={{ display: "block", fontWeight: 800, marginBottom: 6 }}>
            Adjuntar acta firmada
          </label>
          <input
            type="file"
            accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              setUploadedWord(f);
              if (f) alert(`Archivo cargado (demo): ${f.name}`);
            }}
          />
          <div style={{ marginTop: 6, color: "#666" }}>
            Archivo: <b>{uploadedWord ? uploadedWord.name : "Ninguno"}</b>
          </div>
        </div>
      </div>

      {/* ================= BOTONES ================= */}
      <hr style={{ marginTop: 16 }} />

      <button style={btnSecondary} onClick={vistaPreviaPdf}>
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

export default ActaCierreFiscalizacion;
