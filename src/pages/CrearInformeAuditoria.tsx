// src/pages/CrearInformeAuditoria.tsx
import React, { useMemo, useState } from "react";
import jsPDF from "jspdf";
import type { TramitePayload } from "./Tramite";

/** ===================== TIPOS ===================== */
type Impuesto = string;

type AlcanceRow = {
  id: string; // impuesto__periodo
  impuesto: Impuesto;
  periodo: string; // AAAAMM

  // moneda (enteros)
  monto1: number;
  recargo1: number;
  monto2: number;
  recargo2: number;
  multa: number;

  total: number;
  checked: boolean;
};

type Pager = { page: number; pageSize: number };

type Props = {
  tramite?: TramitePayload;
};

/** ===================== ESTILOS ===================== */
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
  border: "1px solid #e5e5e5",
  borderRadius: 10,
  padding: 12,
  marginTop: 12,
  background: "#fff",
};

/** ===================== HELPERS ===================== */
const isYYYYMM = (v: string) =>
  /^\d{6}$/.test(v) && Number(v.slice(4, 6)) >= 1 && Number(v.slice(4, 6)) <= 12;

const yyyymmToParts = (yyyymm: string) => {
  const y = Number(yyyymm.slice(0, 4));
  const m = Number(yyyymm.slice(4, 6));
  return { y, m };
};

const partsToYYYYMM = (y: number, m: number) => `${y}${String(m).padStart(2, "0")}`;

const compareYYYYMM = (a: string, b: string) => a.localeCompare(b);

/** genera todos los meses entre desde/hasta (incluye ambos) */
const buildPeriodRange = (desde: string, hasta: string): string[] => {
  const a = yyyymmToParts(desde);
  const b = yyyymmToParts(hasta);

  let y = a.y;
  let m = a.m;

  const out: string[] = [];
  while (true) {
    out.push(partsToYYYYMM(y, m));
    if (y === b.y && m === b.m) break;

    m += 1;
    if (m === 13) {
      m = 1;
      y += 1;
    }
    if (out.length > 240) break; // safety
  }
  return out;
};

const sumRow = (r: Omit<AlcanceRow, "total">): number =>
  r.monto1 + r.recargo1 + r.monto2 + r.recargo2 + r.multa;

const toIntMoney = (value: string): number => {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.trunc(n); // moneda enteros
};

/** ===================== UI PIEZAS ===================== */
const Accordion: React.FC<{
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}> = ({ title, defaultOpen = false, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={card}>
      <div
        onClick={() => setOpen((s) => !s)}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: "pointer",
          userSelect: "none",
          fontWeight: 900,
        }}
      >
        <div>{title}</div>
        <div>{open ? "▲" : "▼"}</div>
      </div>

      {open && <div style={{ marginTop: 12 }}>{children}</div>}
    </div>
  );
};

const Pagination: React.FC<{
  page: number;
  pageSize: number;
  total: number;
  onPage: (p: number) => void;
  onPageSize: (s: number) => void;
}> = ({ page, pageSize, total, onPage, onPageSize }) => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 10,
      }}
    >
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button
          style={{ ...btnBase, margin: 0, background: "#f2f2f2" }}
          disabled={!canPrev}
          onClick={() => onPage(page - 1)}
        >
          ◀
        </button>

        <div style={{ fontWeight: 700 }}>
          Página {page} / {totalPages}
        </div>

        <button
          style={{ ...btnBase, margin: 0, background: "#f2f2f2" }}
          disabled={!canNext}
          onClick={() => onPage(page + 1)}
        >
          ▶
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <span style={{ fontWeight: 700 }}>Filas:</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSize(Number(e.target.value))}
          style={{ padding: 6 }}
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={12}>12</option>
          <option value={20}>20</option>
        </select>
        <span style={{ color: "#666" }}>Total: {total}</span>
      </div>
    </div>
  );
};

/** ===================== COMPONENTE ===================== */
export const CrearInformeAuditoria: React.FC<Props> = ({ tramite }) => {
  /** ===== PDF ===== */
  const [openPdf, setOpenPdf] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string>("");

  /** ===== Resultado ===== */
  const [resultado, setResultado] = useState<
    "PRODUCTIVO" | "IMPRODUCTIVO" | "PRESENTACIÓN VOLUNTARIA"
  >("PRODUCTIVO");
  const [detalleInvestigacion, setDetalleInvestigacion] = useState("");

  /** ===== Datos actualizados (NUEVO y funcional) ===== */
  const [mostrarDatosActualizados, setMostrarDatosActualizados] = useState(false);

  const [avisoOperacionActualizado, setAvisoOperacionActualizado] = useState("");
  const [telFijo, setTelFijo] = useState("");
  const [telMovil, setTelMovil] = useState("");
  const [fax, setFax] = useState("");
  const [correo, setCorreo] = useState("");

  /** ===== Alcance: filtros para generar tablas ===== */
  const impuestosCatalogo: Impuesto[] = [
    "102 - ISR",
    "140 - Aviso de Operación",
    "202 - ITBMS",
    "316 - Multa Renta",
  ];

  const [impuestoSel, setImpuestoSel] = useState<Impuesto | "">("");
  const [desde, setDesde] = useState<string>("");
  const [hasta, setHasta] = useState<string>("");

  /** datos por impuesto (cada impuesto su propia tabla) */
  const [rowsByTax, setRowsByTax] = useState<Record<Impuesto, AlcanceRow[]>>({});

  /** filtros por tabla */
  const [tableFilterByTax, setTableFilterByTax] = useState<
    Record<Impuesto, { searchPeriodo: string }>
  >({});

  /** paginación por tabla */
  const [pagerByTax, setPagerByTax] = useState<Record<Impuesto, Pager>>({});

  const hasAnyTable = useMemo(() => Object.keys(rowsByTax).length > 0, [rowsByTax]);

  const addRange = () => {
    if (!impuestoSel) {
      alert("Seleccione un impuesto.");
      return;
    }
    if (!isYYYYMM(desde) || !isYYYYMM(hasta)) {
      alert("Desde/Hasta debe ser AAAAMM (ej: 202301).");
      return;
    }
    if (compareYYYYMM(desde, hasta) > 0) {
      alert("Desde no puede ser mayor que Hasta.");
      return;
    }

    const periodos = buildPeriodRange(desde, hasta);

    setRowsByTax((prev) => {
      const current = prev[impuestoSel] ?? [];
      const currentMap = new Map(current.map((r) => [r.periodo, r]));

      const next = [...current];

      for (const p of periodos) {
        if (currentMap.has(p)) continue;

        const id = `${impuestoSel}__${p}`;
        const base: Omit<AlcanceRow, "total"> = {
          id,
          impuesto: impuestoSel,
          periodo: p,
          monto1: 0,
          recargo1: 0,
          monto2: 0,
          recargo2: 0,
          multa: 0,
          checked: false,
        };
        next.push({ ...base, total: sumRow(base) });
      }

      next.sort((a, b) => a.periodo.localeCompare(b.periodo));
      return { ...prev, [impuestoSel]: next };
    });

    setTableFilterByTax((prev) => ({
      ...prev,
      [impuestoSel]: prev[impuestoSel] ?? { searchPeriodo: "" },
    }));

    setPagerByTax((prev) => ({
      ...prev,
      [impuestoSel]: prev[impuestoSel] ?? { page: 1, pageSize: 10 },
    }));
  };

  const setPager = (impuesto: Impuesto, next: Partial<Pager>) => {
    setPagerByTax((prev) => {
      const current = prev[impuesto] ?? { page: 1, pageSize: 10 };
      return { ...prev, [impuesto]: { ...current, ...next } };
    });
  };

  const setFilter = (impuesto: Impuesto, next: Partial<{ searchPeriodo: string }>) => {
    setTableFilterByTax((prev) => {
      const current = prev[impuesto] ?? { searchPeriodo: "" };
      return { ...prev, [impuesto]: { ...current, ...next } };
    });
  };

  const updateMoneyField = (
    impuesto: Impuesto,
    rowId: string,
    field: keyof Pick<AlcanceRow, "monto1" | "recargo1" | "monto2" | "recargo2" | "multa">,
    value: string
  ) => {
    const val = toIntMoney(value);

    setRowsByTax((prev) => {
      const arr = prev[impuesto] ?? [];
      const nextArr = arr.map((r) => {
        if (r.id !== rowId) return r;
        const updated = { ...r, [field]: val } as AlcanceRow;
        return { ...updated, total: sumRow(updated) };
      });
      return { ...prev, [impuesto]: nextArr };
    });
  };

  const toggleRow = (impuesto: Impuesto, rowId: string, checked: boolean) => {
    setRowsByTax((prev) => {
      const arr = prev[impuesto] ?? [];
      const nextArr = arr.map((r) => (r.id === rowId ? { ...r, checked } : r));
      return { ...prev, [impuesto]: nextArr };
    });
  };

  const toggleSelectAll = (
    impuesto: Impuesto,
    checked: boolean,
    visibleRowIds: Set<string>
  ) => {
    setRowsByTax((prev) => {
      const arr = prev[impuesto] ?? [];
      const nextArr = arr.map((r) => (visibleRowIds.has(r.id) ? { ...r, checked } : r));
      return { ...prev, [impuesto]: nextArr };
    });
  };

  const eliminarSeleccionados = () => {
    const anyChecked = Object.values(rowsByTax).some((arr) => arr.some((r) => r.checked));
    if (!anyChecked) return alert("No hay filas seleccionadas.");

    const ok = window.confirm("¿Está seguro que desea eliminar los seleccionados?");
    if (!ok) return;

    setRowsByTax((prev) => {
      const next: Record<Impuesto, AlcanceRow[]> = { ...prev };
      (Object.keys(next) as Impuesto[]).forEach((tax) => {
        next[tax] = next[tax].filter((r) => !r.checked);
        if (next[tax].length === 0) delete next[tax];
      });
      return next;
    });
  };

  const totalGeneral = useMemo(() => {
    return Object.values(rowsByTax)
      .flat()
      .reduce((acc, r) => acc + r.total, 0);
  }, [rowsByTax]);

  const generarPdf = () => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    let y = 40;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Informe de Auditoría", 40, y);
    y += 18;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    if (tramite) {
      doc.setFont("helvetica", "bold");
      doc.text("Datos del Trámite", 40, (y += 16));
      doc.setFont("helvetica", "normal");

      const t = [
        ["Número", tramite.numeroTramite],
        ["Actividad", tramite.actividad],
        ["RUC", tramite.ruc],
        ["Contribuyente", tramite.contribuyente],
      ];

      for (const [k, v] of t) {
        if (y > 760) {
          doc.addPage();
          y = 60;
        }
        doc.setFont("helvetica", "bold");
        doc.text(`${k}:`, 40, (y += 14));
        doc.setFont("helvetica", "normal");
        doc.text(String(v), 140, y);
      }
    }

    doc.setFont("helvetica", "bold");
    doc.text("Resultado", 40, (y += 18));
    doc.setFont("helvetica", "normal");
    doc.text(`Resultado: ${resultado}`, 40, (y += 14));

    const detalleLines = doc.splitTextToSize(detalleInvestigacion || "(Sin detalle)", 520);
    doc.text("Detalle:", 40, (y += 14));
    doc.text(detalleLines, 40, (y += 12));
    y += detalleLines.length * 10;

    doc.setFont("helvetica", "bold");
    doc.text("Resumen de Alcance por Impuesto", 40, (y += 18));
    doc.setFont("helvetica", "normal");

    const taxes = Object.keys(rowsByTax) as Impuesto[];
    if (!taxes.length) {
      doc.text("Sin alcance agregado.", 40, (y += 14));
    } else {
      for (const tax of taxes) {
        const sumTax = (rowsByTax[tax] ?? []).reduce((acc, r) => acc + r.total, 0);
        if (y > 760) {
          doc.addPage();
          y = 60;
        }
        doc.setFont("helvetica", "bold");
        doc.text(`${tax}`, 40, (y += 14));
        doc.setFont("helvetica", "normal");
        doc.text(`Total impuesto (B/.): ${sumTax.toFixed(2)}`, 60, (y += 14));
      }
    }

    doc.setFont("helvetica", "bold");
    doc.text(`Total general (B/.): ${totalGeneral.toFixed(2)}`, 40, (y += 18));

    const blob = doc.output("blob");
    const url = URL.createObjectURL(blob);
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    setPdfUrl(url);
    setOpenPdf(true);
  };

  const guardar = () => alert("Guardado (demo).");
  const enviar = () => {
    const ok = window.confirm("¿Está seguro que desea enviar el informe?");
    if (!ok) return;
    alert("Enviado (demo).");
  };

  return (
    <div style={{ fontFamily: "Arial, sans-serif", margin: 20 }}>
      <h1>Informe de Auditoría</h1>

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
              <iframe
                title="pdf-preview"
                src={pdfUrl}
                style={{ width: "100%", height: "100%", border: "none" }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ================= DATOS TRÁMITE ================= */}
      <div style={card}>
        <div style={{ fontWeight: 900, marginBottom: 8 }}>Datos del Trámite</div>
        {tramite ? (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              <tr>
                <td style={tdStyle}>
                  Número: <b>{tramite.numeroTramite}</b>
                </td>
                <td style={tdStyle}>
                  Estado: <b>{tramite.estadoTramite}</b>
                </td>
                <td style={tdStyle}>
                  Inicio: <b>{tramite.fechaInicio}</b>
                </td>
              </tr>
              <tr>
                <td style={tdStyle}>
                  Red: <b>{tramite.red}</b>
                </td>
                <td style={tdStyle} colSpan={2}>
                  Actividad: <b>{tramite.actividad}</b>
                </td>
              </tr>
              <tr>
                <td style={tdStyle}>
                  RUC: <b>{tramite.ruc}</b>
                </td>
                <td style={tdStyle} colSpan={2}>
                  Contribuyente: <b>{tramite.contribuyente}</b>
                </td>
              </tr>
            </tbody>
          </table>
        ) : (
          <div style={{ color: "#b00", fontWeight: 700 }}>
            No hay trámite seleccionado. Entra a TRÁMITE y presiona “Crear (706)”.
          </div>
        )}
      </div>

      {/* ================= DATOS ACTUALIZADOS (NUEVO, como HTML) ================= */}
      <div style={{ marginTop: 12 }}>
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
        <fieldset style={{ marginTop: 12 }}>
          <legend>Datos Actualizados</legend>

          <div style={{ marginTop: 10 }}>
            <label style={{ display: "block", fontWeight: 700 }}>
              Número de Aviso de Operación actualizado
            </label>
            <input
              type="text"
              style={inputStyle}
              value={avisoOperacionActualizado}
              onChange={(e) => setAvisoOperacionActualizado(e.target.value)}
            />
          </div>

          <div
            style={{
              marginTop: 16,
              border: "1px solid #ccc",
              padding: 10,
              borderRadius: 6,
            }}
          >
            <strong>Datos de contacto actualizados</strong>

            <div style={{ display: "flex", gap: 12, marginTop: 10, flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 260px" }}>
                <label style={{ display: "block", fontWeight: 700 }}>Teléfono fijo</label>
                <input
                  type="text"
                  style={inputStyle}
                  value={telFijo}
                  onChange={(e) => setTelFijo(e.target.value)}
                />
              </div>

              <div style={{ flex: "1 1 260px" }}>
                <label style={{ display: "block", fontWeight: 700 }}>Teléfono móvil</label>
                <input
                  type="text"
                  style={inputStyle}
                  value={telMovil}
                  onChange={(e) => setTelMovil(e.target.value)}
                />
              </div>

              <div style={{ flex: "1 1 260px" }}>
                <label style={{ display: "block", fontWeight: 700 }}>Fax</label>
                <input
                  type="text"
                  style={inputStyle}
                  value={fax}
                  onChange={(e) => setFax(e.target.value)}
                />
              </div>
            </div>

            <div style={{ marginTop: 10 }}>
              <label style={{ display: "block", fontWeight: 700 }}>Correo electrónico</label>
              <input
                type="email"
                style={inputStyle}
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
              />
            </div>
          </div>
        </fieldset>
      )}

      {/* ================= RESULTADO ================= */}
      <fieldset style={{ marginTop: 12 }}>
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

        <label style={{ display: "block", marginTop: 10, fontWeight: 700 }}>
          Detalle de la investigación
        </label>
        <textarea
          rows={5}
          style={inputStyle}
          value={detalleInvestigacion}
          onChange={(e) => setDetalleInvestigacion(e.target.value)}
        />
      </fieldset>

      {/* ================= ALCANCE ================= */}
      <fieldset style={{ marginTop: 12 }}>
        <legend>Alcance</legend>

        {/* filtros (NO mostramos tablas hasta agregar) */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "flex-end" }}>
          <label style={{ fontWeight: 700 }}>
            Impuesto
            <select
              style={{ ...inputStyle, width: 260 }}
              value={impuestoSel}
              onChange={(e) => setImpuestoSel(e.target.value as Impuesto)}
            >
              <option value="">Seleccione...</option>
              {impuestosCatalogo.map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
          </label>

          <label style={{ fontWeight: 700 }}>
            Desde (AAAAMM)
            <input
              style={{ ...inputStyle, width: 160 }}
              value={desde}
              onChange={(e) => setDesde(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="202301"
            />
          </label>

          <label style={{ fontWeight: 700 }}>
            Hasta (AAAAMM)
            <input
              style={{ ...inputStyle, width: 160 }}
              value={hasta}
              onChange={(e) => setHasta(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="202312"
            />
          </label>

          <button style={btnSuccess} onClick={addRange}>
            Agregar
          </button>

          {/* eliminar seleccionados (sin columna eliminar por fila) */}
          <button style={btnDanger} onClick={eliminarSeleccionados}>
            Eliminar seleccionados
          </button>

          <div style={{ marginLeft: "auto", fontWeight: 900 }}>
            Total general (B/.): {totalGeneral.toFixed(2)}
          </div>
        </div>

        {!hasAnyTable ? (
          <div style={{ marginTop: 12, color: "#666" }}>
            Seleccione un <b>Impuesto</b> y un rango de <b>Periodos</b>, luego presione{" "}
            <b>Agregar</b> para mostrar la tabla.
          </div>
        ) : (
          <div style={{ marginTop: 12 }}>
            {(Object.keys(rowsByTax) as Impuesto[]).map((tax) => {
              const allRows = rowsByTax[tax] ?? [];
              const filter = tableFilterByTax[tax] ?? { searchPeriodo: "" };
              const pager = pagerByTax[tax] ?? { page: 1, pageSize: 10 };

              const filteredRows = allRows.filter((r) =>
                filter.searchPeriodo ? r.periodo.includes(filter.searchPeriodo) : true
              );

              const start = (pager.page - 1) * pager.pageSize;
              const pageRows = filteredRows.slice(start, start + pager.pageSize);

              const visibleIds = new Set(pageRows.map((r) => r.id));
              const allVisibleChecked = pageRows.length > 0 && pageRows.every((r) => r.checked);
              const someVisibleChecked = pageRows.some((r) => r.checked) && !allVisibleChecked;

              const totalTax = allRows.reduce((acc, r) => acc + r.total, 0);

              return (
                <Accordion
                  key={tax}
                  title={`${tax} — Total (B/.): ${totalTax.toFixed(2)}`}
                  defaultOpen={tax === impuestoSel}
                >
                  {/* filtros dentro de la tabla */}
                  <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
                    <div style={{ fontWeight: 800 }}>Filtro periodo:</div>
                    <input
                      style={{ ...inputStyle, maxWidth: 220 }}
                      value={filter.searchPeriodo}
                      onChange={(e) => {
                        setFilter(tax, {
                          searchPeriodo: e.target.value.replace(/\D/g, "").slice(0, 6),
                        });
                        setPager(tax, { page: 1 });
                      }}
                      placeholder="Ej: 2023 o 202301"
                    />
                    <div style={{ color: "#666" }}>Mostrando {filteredRows.length} registros</div>
                  </div>

                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        <th style={thStyle} rowSpan={2}>
                          <input
                            type="checkbox"
                            checked={allVisibleChecked}
                            ref={(el) => {
                              if (el) el.indeterminate = someVisibleChecked;
                            }}
                            onChange={(e) => toggleSelectAll(tax, e.target.checked, visibleIds)}
                          />
                        </th>

                        <th style={thStyle} rowSpan={2}>
                          Periodo
                        </th>

                        <th style={thStyle} colSpan={2}>
                          Liquidación de Adición de Impuesto
                        </th>

                        <th style={thStyle} colSpan={2}>
                          Gravamen de Oficio
                        </th>

                        <th style={thStyle} rowSpan={2}>
                          Multa (B/.)
                        </th>

                        <th style={thStyle} rowSpan={2}>
                          Total (B/.)
                        </th>
                        {/* ❌ No existe columna "Eliminar" por fila */}
                      </tr>

                      <tr>
                        <th style={thStyle}>Monto (B/.)</th>
                        <th style={thStyle}>Recargo (B/.)</th>
                        <th style={thStyle}>Monto (B/.)</th>
                        <th style={thStyle}>Recargo (B/.)</th>
                      </tr>
                    </thead>

                    <tbody>
                      {pageRows.map((r) => (
                        <tr key={r.id}>
                          <td style={tdStyle}>
                            <input
                              type="checkbox"
                              checked={r.checked}
                              onChange={(e) => toggleRow(tax, r.id, e.target.checked)}
                            />
                          </td>

                          <td style={tdStyle}>{r.periodo}</td>

                          <td style={tdStyle}>
                            <input
                              type="number"
                              step={1}
                              inputMode="numeric"
                              style={inputStyle}
                              value={r.monto1}
                              onChange={(e) => updateMoneyField(tax, r.id, "monto1", e.target.value)}
                            />
                          </td>

                          <td style={tdStyle}>
                            <input
                              type="number"
                              step={1}
                              inputMode="numeric"
                              style={inputStyle}
                              value={r.recargo1}
                              onChange={(e) =>
                                updateMoneyField(tax, r.id, "recargo1", e.target.value)
                              }
                            />
                          </td>

                          <td style={tdStyle}>
                            <input
                              type="number"
                              step={1}
                              inputMode="numeric"
                              style={inputStyle}
                              value={r.monto2}
                              onChange={(e) => updateMoneyField(tax, r.id, "monto2", e.target.value)}
                            />
                          </td>

                          <td style={tdStyle}>
                            <input
                              type="number"
                              step={1}
                              inputMode="numeric"
                              style={inputStyle}
                              value={r.recargo2}
                              onChange={(e) =>
                                updateMoneyField(tax, r.id, "recargo2", e.target.value)
                              }
                            />
                          </td>

                          <td style={tdStyle}>
                            <input
                              type="number"
                              step={1}
                              inputMode="numeric"
                              style={inputStyle}
                              value={r.multa}
                              onChange={(e) => updateMoneyField(tax, r.id, "multa", e.target.value)}
                            />
                          </td>

                          <td style={tdStyle}>{r.total.toFixed(2)}</td>
                        </tr>
                      ))}

                      {!pageRows.length && (
                        <tr>
                          <td style={tdStyle} colSpan={8} align="center">
                            Sin resultados para el filtro.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                  <Pagination
                    page={pager.page}
                    pageSize={pager.pageSize}
                    total={filteredRows.length}
                    onPage={(p) => setPager(tax, { page: p })}
                    onPageSize={(s) => setPager(tax, { pageSize: s, page: 1 })}
                  />
                </Accordion>
              );
            })}
          </div>
        )}
      </fieldset>

      <hr style={{ marginTop: 16 }} />

      <button style={btnSecondary} onClick={generarPdf}>
        Vista Previa
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

export default CrearInformeAuditoria;
