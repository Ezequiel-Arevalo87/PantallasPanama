import React, { useMemo, useState } from "react";
import jsPDF from "jspdf";

type Fila = {
  id: number;
  impuesto: string;
  periodo: string;
  monto1: string;
  recargo1: string;
  monto2: string;
  recargo2: string;
  multa: string;
  total: number;
  checked: boolean;
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: 6,
  boxSizing: "border-box",
};

const thStyle: React.CSSProperties = {
  border: "1px solid #ccc",
  padding: 8,
  background: "#f2f2f2",
  textAlign: "left",
};

const tdStyle: React.CSSProperties = {
  border: "1px solid #ccc",
  padding: 8,
};

const btnBase: React.CSSProperties = {
  padding: "10px 15px",
  margin: "10px 6px 0 0",
  cursor: "pointer",
  border: "none",
  borderRadius: 6,
  fontWeight: 700,
};

const btnPreview: React.CSSProperties = {
  ...btnBase,
  background: "#6c757d",
  color: "#fff",
};

const btnSave: React.CSSProperties = {
  ...btnBase,
  background: "#28a745",
  color: "#fff",
};

const btnSend: React.CSSProperties = {
  ...btnBase,
  background: "#007bff",
  color: "#fff",
};

export const CrearInformeAuditoria: React.FC = () => {
  const [mostrarDatosActualizados, setMostrarDatosActualizados] = useState(false);
  const [selectAll, setSelectAll] = useState(false);

  // PDF preview modal
  const [openPdf, setOpenPdf] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string>("");

  const [resultado, setResultado] = useState<"PRODUCTIVO" | "IMPRODUCTIVO" | "PRESENTACIÓN VOLUNTARIA">("PRODUCTIVO");
  const [detalleInvestigacion, setDetalleInvestigacion] = useState("");

  const [filas, setFilas] = useState<Fila[]>(
    Array.from({ length: 12 }, (_, i) => {
      const periodo = `2023${String(i + 1).padStart(2, "0")}`;
      return {
        id: i,
        impuesto: "202 - ITBMS",
        periodo,
        monto1: "",
        recargo1: "",
        monto2: "",
        recargo2: "",
        multa: "",
        total: 0,
        checked: false,
      };
    })
  );

  const totalGeneral = useMemo(() => {
    return filas.reduce((acc, f) => acc + (Number.isFinite(f.total) ? f.total : 0), 0);
  }, [filas]);

  const calcularTotal = (filaId: number, campo: keyof Omit<Fila, "id" | "impuesto" | "periodo" | "total" | "checked">, valor: string) => {
    setFilas((prev) =>
      prev.map((f) => {
        if (f.id !== filaId) return f;

        const nueva = { ...f, [campo]: valor } as Fila;

        const total =
          (parseFloat(nueva.monto1) || 0) +
          (parseFloat(nueva.recargo1) || 0) +
          (parseFloat(nueva.monto2) || 0) +
          (parseFloat(nueva.recargo2) || 0) +
          (parseFloat(nueva.multa) || 0);

        return { ...nueva, total };
      })
    );
  };

  const toggleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    setFilas((prev) => prev.map((f) => ({ ...f, checked })));
  };

  const toggleFila = (id: number, checked: boolean) => {
    setFilas((prev) =>
      prev.map((f) => (f.id === id ? { ...f, checked } : f))
    );
  };

  const eliminarSeleccionados = () => {
    const haySeleccion = filas.some((f) => f.checked);
    if (!haySeleccion) {
      alert("No hay filas seleccionadas.");
      return;
    }

    const ok = window.confirm("¿Está seguro que desea eliminar los seleccionados?");
    if (!ok) return;

    setFilas((prev) => prev.filter((f) => !f.checked));
    setSelectAll(false);
  };

  const generarPdf = () => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });

    let y = 40;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Informe de Auditoría", 40, y);
    y += 20;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text("Datos del Contribuyente", 40, (y += 18));

    // Datos contribuyente (mock igual al HTML)
    const contribuyente = [
      ["Número de RUC", "987654321-2-2021"],
      ["Dígito Verificador", "2"],
      ["Razón Social", "TRANSPORTES Y SERVICIOS LOGÍSTICOS S.A."],
      ["Razón Comercial", "TRANSPORTES LOGÍSTICOS"],
      ["Teléfono", "2222-3333"],
      ["Correo", "info@transporteslog.com"],
      ["Provincia", "Panamá"],
      ["Distrito", "Panamá"],
      ["Corregimiento", "Bella Vista"],
      ["Dirección", "Av. Balboa - Edificio Torre Azul, Apto 12B"],
    ];

    // Render simple tabla (sin autotable para no depender de otra lib)
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    y += 10;
    contribuyente.forEach(([k, v]) => {
      doc.setFont("helvetica", "bold");
      doc.text(`${k}:`, 40, (y += 14));
      doc.setFont("helvetica", "normal");
      doc.text(String(v), 160, y);
    });

    y += 18;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Resultado de la Auditoría", 40, y);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Resultado: ${resultado}`, 40, (y += 16));

    // Detalle (partir en líneas)
    const detalleLines = doc.splitTextToSize(detalleInvestigacion || "(Sin detalle)", 520);
    doc.text("Detalle de la investigación:", 40, (y += 16));
    doc.text(detalleLines, 40, (y += 14));
    y += detalleLines.length * 10;

    y += 12;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Alcance (Resumen)", 40, y);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    y += 16;

    const filasActivas = filas.length ? filas : [];
    if (!filasActivas.length) {
      doc.text("No hay registros en alcance.", 40, y);
      y += 14;
    } else {
      // Encabezados
      doc.setFont("helvetica", "bold");
      doc.text("Impuesto", 40, y);
      doc.text("Periodo", 160, y);
      doc.text("Total (B/.)", 260, y);
      doc.setFont("helvetica", "normal");

      y += 14;

      filasActivas.forEach((f) => {
        if (y > 760) {
          doc.addPage();
          y = 60;
        }
        doc.text(f.impuesto, 40, y);
        doc.text(f.periodo, 160, y);
        doc.text(f.total.toFixed(2), 260, y);
        y += 14;
      });
    }

    y += 18;
    doc.setFont("helvetica", "bold");
    doc.text(`Total general (B/.): ${totalGeneral.toFixed(2)}`, 40, y);

    // Pasar a blob url para iframe
    const blob = doc.output("blob");
    const url = URL.createObjectURL(blob);

    // Limpia URL anterior
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);

    setPdfUrl(url);
    setOpenPdf(true);
  };

  const guardar = () => {
    alert("Guardado (demo). Aquí conectamos tu API cuando quieras.");
  };

  const enviar = () => {
    const ok = window.confirm("¿Está seguro que desea enviar el informe?");
    if (!ok) return;

    alert("Enviado (demo). Aquí conectamos tu API cuando quieras.");
  };

  return (
    <div style={{ fontFamily: "Arial, sans-serif", margin: 20 }}>
      <h1>Crear Informe de Auditoría</h1>
      <p>Esta es la página para crear un informe de auditoría.</p>

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
                alignItems: "center",
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
              {pdfUrl ? (
                <iframe
                  title="pdf-preview"
                  src={pdfUrl}
                  style={{ width: "100%", height: "100%", border: "none" }}
                />
              ) : (
                <div style={{ padding: 16 }}>Generando PDF…</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= DATOS CONTRIBUYENTE ================= */}
      <fieldset>
        <legend>Datos del Contribuyente</legend>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            {[
              ["Número de RUC", "987654321-2-2021"],
              ["Dígito Verificador", "2"],
              ["Razón Social", "TRANSPORTES Y SERVICIOS LOGÍSTICOS S.A."],
              ["Razón Comercial", "TRANSPORTES LOGÍSTICOS"],
              ["Número de Aviso de Operación", "123456"],
              ["Teléfono fijo", "2222-3333"],
              ["Teléfono móvil", "6000-1234"],
              ["Correo electrónico", "info@transporteslog.com"],
              ["Provincia", "Panamá"],
              ["Distrito", "Panamá"],
              ["Corregimiento", "Bella Vista"],
              ["Calle o Avenida", "Av. Balboa"],
              ["Dirección descriptiva", "Edificio Torre Azul, Apto 12B"],
            ].map(([k, v]) => (
              <tr key={k}>
                <td style={tdStyle}>
                  <strong>{k}:</strong>
                </td>
                <td style={tdStyle}>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </fieldset>

      {/* ================= DATOS ACTUALIZADOS ================= */}
      <div style={{ marginTop: 20 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 600 }}>
          <input
            type="checkbox"
            checked={mostrarDatosActualizados}
            onChange={(e) => setMostrarDatosActualizados(e.target.checked)}
          />
          Durante la investigación se encontró información más actualizada del contribuyente
        </label>
      </div>

      {mostrarDatosActualizados && (
        <div style={{ marginTop: 15 }}>
          <fieldset>
            <legend>Datos Actualizados</legend>

            <div style={{ marginTop: 10 }}>
              <label style={{ display: "block", fontWeight: 700 }}>Número de Aviso de Operación actualizado</label>
              <input type="text" style={inputStyle} />
            </div>

            <div style={{ marginTop: 16, border: "1px solid #ccc", padding: 10 }}>
              <strong>Datos de contacto actualizados</strong>
              <div style={{ display: "flex", gap: 12, marginTop: 10 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontWeight: 700 }}>Teléfono fijo</label>
                  <input type="text" style={inputStyle} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontWeight: 700 }}>Teléfono móvil</label>
                  <input type="text" style={inputStyle} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontWeight: 700 }}>Fax</label>
                  <input type="text" style={inputStyle} />
                </div>
              </div>

              <div style={{ marginTop: 10 }}>
                <label style={{ display: "block", fontWeight: 700 }}>Correo electrónico</label>
                <input type="email" style={inputStyle} />
              </div>
            </div>
          </fieldset>
        </div>
      )}

      {/* ================= RESULTADO ================= */}
      <fieldset style={{ marginTop: 20 }}>
        <legend>Resultado de la Auditoría</legend>

        <label style={{ display: "block", fontWeight: 700 }}>Resultado</label>
        <select
          style={inputStyle}
          value={resultado}
          onChange={(e) => setResultado(e.target.value as any)}
        >
          <option>PRODUCTIVO</option>
          <option>IMPRODUCTIVO</option>
          <option>PRESENTACIÓN VOLUNTARIA</option>
        </select>

        <label style={{ display: "block", marginTop: 10, fontWeight: 700 }}>Detalle de la investigación</label>
        <textarea
          rows={5}
          style={inputStyle}
          value={detalleInvestigacion}
          onChange={(e) => setDetalleInvestigacion(e.target.value)}
        />
      </fieldset>

      {/* ================= ALCANCE ================= */}
      <fieldset style={{ marginTop: 20 }}>
        <legend>Alcance</legend>

        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 10 }}>
          <thead>
            <tr>
              <th style={thStyle}>
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={(e) => toggleSelectAll(e.target.checked)}
                />
              </th>
              <th style={thStyle}>Impuesto</th>
              <th style={thStyle}>Periodo</th>
              <th style={thStyle}>Monto (B/.)</th>
              <th style={thStyle}>Recargo (B/.)</th>
              <th style={thStyle}>Monto (B/.)</th>
              <th style={thStyle}>Recargo (B/.)</th>
              <th style={thStyle}>Multa (B/.)</th>
              <th style={thStyle}>Total (B/.)</th>
            </tr>
          </thead>

          <tbody>
            {filas.map((f) => (
              <tr key={f.id}>
                <td style={tdStyle}>
                  <input
                    type="checkbox"
                    checked={f.checked}
                    onChange={(e) => toggleFila(f.id, e.target.checked)}
                  />
                </td>
                <td style={tdStyle}>{f.impuesto}</td>
                <td style={tdStyle}>{f.periodo}</td>

                <td style={tdStyle}>
                  <input
                    style={inputStyle}
                    value={f.monto1}
                    onChange={(e) => calcularTotal(f.id, "monto1", e.target.value)}
                  />
                </td>
                <td style={tdStyle}>
                  <input
                    style={inputStyle}
                    value={f.recargo1}
                    onChange={(e) => calcularTotal(f.id, "recargo1", e.target.value)}
                  />
                </td>
                <td style={tdStyle}>
                  <input
                    style={inputStyle}
                    value={f.monto2}
                    onChange={(e) => calcularTotal(f.id, "monto2", e.target.value)}
                  />
                </td>
                <td style={tdStyle}>
                  <input
                    style={inputStyle}
                    value={f.recargo2}
                    onChange={(e) => calcularTotal(f.id, "recargo2", e.target.value)}
                  />
                </td>
                <td style={tdStyle}>
                  <input
                    style={inputStyle}
                    value={f.multa}
                    onChange={(e) => calcularTotal(f.id, "multa", e.target.value)}
                  />
                </td>

                <td style={tdStyle}>{f.total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ marginTop: 10, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <button style={{ ...btnBase, background: "#dc3545", color: "#fff" }} onClick={eliminarSeleccionados}>
            Eliminar seleccionados
          </button>

          <div style={{ fontWeight: 800 }}>
            Total general (B/.): {totalGeneral.toFixed(2)}
          </div>
        </div>
      </fieldset>

      <hr style={{ marginTop: 20 }} />

      <button style={btnPreview} onClick={generarPdf}>
        Vista Previa
      </button>
      <button style={btnSave} onClick={guardar}>
        Guardar
      </button>
      <button style={btnSend} onClick={enviar}>
        Enviar
      </button>
    </div>
  );
};

export default CrearInformeAuditoria;
