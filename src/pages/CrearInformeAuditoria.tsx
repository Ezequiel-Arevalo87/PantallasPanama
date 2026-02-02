// src/pages/CrearInformeAuditoria.tsx
import React, { useMemo, useState } from "react";
import jsPDF from "jspdf";
import type { TramitePayload } from "./Tramite";

/** ===================== TIPOS ===================== */
type Impuesto = string;

type Periodicidad = "MENSUAL" | "ANUAL";

type TaxConfig = {
  label: Impuesto;
  periodicidad: Periodicidad;
};

type AlcanceRow = {
  id: string; // impuesto__periodo
  impuesto: Impuesto;
  periodo: string; // AAAAMM o AAAA

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

  /**
   * ✅ Para reutilizar este mismo componente en:
   * - Informe Auditoría (706 / como ya lo tienes)
   * - Acta de Cierre (799)
   */
  documentType?: "INFORME_AUDITORIA" | "ACTA_CIERRE";
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

const isYYYY = (v: string) => /^\d{4}$/.test(v);

const yyyymmToParts = (yyyymm: string) => {
  const y = Number(yyyymm.slice(0, 4));
  const m = Number(yyyymm.slice(4, 6));
  return { y, m };
};

const partsToYYYYMM = (y: number, m: number) => `${y}${String(m).padStart(2, "0")}`;

const compareString = (a: string, b: string) => a.localeCompare(b);

/** genera todos los meses entre desde/hasta (incluye ambos) */
const buildMonthlyRange = (desde: string, hasta: string): string[] => {
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

/** genera todos los años entre desde/hasta (incluye ambos) */
const buildYearRange = (desdeYYYY: string, hastaYYYY: string): string[] => {
  const a = Number(desdeYYYY);
  const b = Number(hastaYYYY);

  const out: string[] = [];
  for (let y = a; y <= b; y += 1) {
    out.push(String(y));
    if (out.length > 60) break; // safety
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

const fmt = (v?: string) => (v && String(v).trim() ? String(v) : "-");

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
export const CrearInformeAuditoria: React.FC<Props> = ({
  tramite,
  documentType = "INFORME_AUDITORIA",
}) => {
  const isActaCierre = documentType === "ACTA_CIERRE";
  const pageTitle = isActaCierre ? "Acta de Cierre de Fiscalización" : "Informe de Auditoría";

  /** ===== PDF ===== */
  const [openPdf, setOpenPdf] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string>("");

  /** ===== Word + upload ===== */
  const [uploadedWord, setUploadedWord] = useState<File | null>(null);

  /** ===== Resultado ===== */
  const [resultado, setResultado] = useState<
    "PRODUCTIVO" | "IMPRODUCTIVO" | "PRESENTACIÓN VOLUNTARIA"
  >("PRODUCTIVO");
  const [detalleInvestigacion, setDetalleInvestigacion] = useState("");

  /** ===== Datos actualizados ===== */
  const [mostrarDatosActualizados, setMostrarDatosActualizados] = useState(false);

  // ✅ QUITADO: avisoOperacionActualizado (ya no va)
  // const [avisoOperacionActualizado, setAvisoOperacionActualizado] = useState("");

  // contacto actualizado
  const [telFijo, setTelFijo] = useState("");
  const [telMovil, setTelMovil] = useState("");
  const [fax, setFax] = useState("");
  const [correo, setCorreo] = useState("");

  // dirección actualizada
  const [provincia, setProvincia] = useState("");
  const [distrito, setDistrito] = useState("");
  const [corregimiento, setCorregimiento] = useState("");
  const [barrio, setBarrio] = useState("");
  const [calleAvenida, setCalleAvenida] = useState("");
  const [nombreEdificio, setNombreEdificio] = useState("");
  const [numeroCasaApto, setNumeroCasaApto] = useState("");
  const [referencia, setReferencia] = useState("");

  /** ✅ NUEVO: Razón Comercial (texto abierto) */
  const [razonComercial, setRazonComercial] = useState<string>(
    (tramite?.razonComercial as any) ?? ""
  );

  /** ===== Alcance: impuestos con periodicidad ===== */
  const impuestosCatalogo: TaxConfig[] = [
    { label: "202 - ITBMS", periodicidad: "MENSUAL" },
    { label: "Retenciones ITBMS", periodicidad: "MENSUAL" },

    // ejemplos anuales (ajusta a tu catálogo real)
    { label: "102 - ISR", periodicidad: "ANUAL" },
    { label: "140 - Aviso de Operación", periodicidad: "ANUAL" },
    { label: "316 - Multa Renta", periodicidad: "ANUAL" },
  ];

  const taxByLabel = useMemo(() => {
    const m = new Map<Impuesto, TaxConfig>();
    impuestosCatalogo.forEach((x) => m.set(x.label, x));
    return m;
  }, []);

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

    const cfg = taxByLabel.get(impuestoSel);
    const periodicidad: Periodicidad = cfg?.periodicidad ?? "MENSUAL";

    // ✅ validación según periodicidad
    if (periodicidad === "MENSUAL") {
      if (!isYYYYMM(desde) || !isYYYYMM(hasta)) {
        alert("Desde/Hasta debe ser AAAAMM (ej: 202301) para este impuesto.");
        return;
      }
      if (compareString(desde, hasta) > 0) {
        alert("Desde no puede ser mayor que Hasta.");
        return;
      }
    } else {
      if (!isYYYY(desde) || !isYYYY(hasta)) {
        alert("Desde/Hasta debe ser AAAA (ej: 2023) para este impuesto.");
        return;
      }
      if (Number(desde) > Number(hasta)) {
        alert("Desde no puede ser mayor que Hasta.");
        return;
      }
    }

    const periodos =
      periodicidad === "MENSUAL" ? buildMonthlyRange(desde, hasta) : buildYearRange(desde, hasta);

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

  const toggleSelectAll = (impuesto: Impuesto, checked: boolean, visibleRowIds: Set<string>) => {
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

  /** ✅ Word: descarga plantilla (Word abre HTML sin problema) */
  const descargarWord = () => {
    const actaNumero = fmt(tramite?.actaInicioFiscalizacion?.numero);
    const actaFecha = fmt(tramite?.actaInicioFiscalizacion?.fecha);

    const obligaciones = (tramite?.obligaciones ?? []) as Array<{
      impuesto: string;
      fechaDesde: string;
      fechaHasta?: string;
    }>;

    const obligacionesHtml = obligaciones.length
      ? `
        <table border="1" cellspacing="0" cellpadding="6" style="border-collapse:collapse; width:100%;">
          <thead>
            <tr style="background:#f2f2f2;">
              <th align="left">Impuesto</th>
              <th align="left">Fecha Desde</th>
              <th align="left">Fecha Hasta</th>
            </tr>
          </thead>
          <tbody>
            ${obligaciones
              .map(
                (o) => `
                <tr>
                  <td>${fmt(o.impuesto)}</td>
                  <td>${fmt(o.fechaDesde)}</td>
                  <td>${fmt(o.fechaHasta)}</td>
                </tr>
              `
              )
              .join("")}
          </tbody>
        </table>
      `
      : `<div style="color:#666;">(Sin obligaciones)</div>`;

    const html = `
      <html>
        <head><meta charset="utf-8"/></head>
        <body style="font-family: Arial, sans-serif;">
          <h2>${pageTitle}</h2>

          <h3>Datos del Trámite</h3>
          <p><b>Número:</b> ${fmt(tramite?.numeroTramite)}</p>
          <p><b>Actividad:</b> ${fmt(tramite?.actividad)}</p>
          <p><b>RUC:</b> ${fmt(tramite?.ruc)}</p>
          <p><b>Contribuyente:</b> ${fmt(tramite?.contribuyente)}</p>

          <p><b>Número de Acta de Inicio de Fiscalización:</b> ${actaNumero}</p>
          <p><b>Fecha de Acta de Inicio de Fiscalización:</b> ${actaFecha}</p>

          <h3>Datos del contribuyente</h3>
          <p><b>Razón Comercial:</b> ${fmt(razonComercial)}</p>

          <h4>Obligaciones</h4>
          ${obligacionesHtml}

          <h3>Datos actuales (contribuyente)</h3>
          <p><b>Aviso de Operación (actual):</b> ${fmt(tramite?.avisoOperacionActual)}</p>

          <p><b>Contacto actual:</b>
            Tel fijo: ${fmt(tramite?.contactoActual?.telFijo)} |
            Tel móvil: ${fmt(tramite?.contactoActual?.telMovil)} |
            Fax: ${fmt(tramite?.contactoActual?.fax)} |
            Correo: ${fmt(tramite?.contactoActual?.correo)}
          </p>

          <p><b>Dirección actual:</b>
            Provincia: ${fmt(tramite?.direccionActual?.provincia)} |
            Distrito: ${fmt(tramite?.direccionActual?.distrito)} |
            Corregimiento: ${fmt(tramite?.direccionActual?.corregimiento)} |
            Barrio: ${fmt(tramite?.direccionActual?.barrio)} |
            Calle/Avenida: ${fmt(tramite?.direccionActual?.calleAvenida)} |
            Edificio: ${fmt(tramite?.direccionActual?.nombreEdificio)} |
            Casa/Apto: ${fmt(tramite?.direccionActual?.numeroCasaApto)} |
            Referencia: ${fmt(tramite?.direccionActual?.referencia)}
          </p>

          <h3>Resultado</h3>
          <p><b>Resultado:</b> ${resultado}</p>
          <p><b>Detalle:</b><br/>${(detalleInvestigacion || "(Sin detalle)").replace(/\n/g, "<br/>")}</p>

          <h3>Alcance</h3>
          <p><b>Total general (B/.):</b> ${totalGeneral.toFixed(2)}</p>

          <p style="color:#666; font-size:12px;">
            Nota: esta plantilla se descarga en Word para completar y luego subir al sistema.
          </p>
        </body>
      </html>
    `.trim();

    const blob = new Blob([html], { type: "application/msword;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    const baseName = tramite?.numeroTramite ? `${tramite.numeroTramite}` : "SIN_TRAMITE";
    const name = isActaCierre ? `ActaCierre_${baseName}.doc` : `InformeAuditoria_${baseName}.doc`;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1500);
  };

  const generarPdf = () => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    let y = 40;

    const actaNumero = fmt(tramite?.actaInicioFiscalizacion?.numero);
    const actaFecha = fmt(tramite?.actaInicioFiscalizacion?.fecha);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(pageTitle, 40, y);
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
        ["N° Acta Inicio Fiscalización", actaNumero],
        ["Fecha Acta Inicio Fiscalización", actaFecha],
      ];

      for (const [k, v] of t) {
        if (y > 760) {
          doc.addPage();
          y = 60;
        }
        doc.setFont("helvetica", "bold");
        doc.text(`${k}:`, 40, (y += 14));
        doc.setFont("helvetica", "normal");
        doc.text(String(v), 220, y);
      }

      // ✅ Datos del contribuyente (nuevo)
      doc.setFont("helvetica", "bold");
      doc.text("Datos del contribuyente", 40, (y += 18));
      doc.setFont("helvetica", "normal");
      doc.text(`Razón Comercial: ${fmt(razonComercial)}`, 40, (y += 14));

      const obligaciones = (tramite?.obligaciones ?? []) as Array<{
        impuesto: string;
        fechaDesde: string;
        fechaHasta?: string;
      }>;

      doc.setFont("helvetica", "bold");
      doc.text("Obligaciones", 40, (y += 16));
      doc.setFont("helvetica", "normal");

      if (!obligaciones.length) {
        doc.text("(Sin obligaciones)", 40, (y += 14));
      } else {
        for (const o of obligaciones) {
          if (y > 760) {
            doc.addPage();
            y = 60;
          }
          doc.text(
            `• ${fmt(o.impuesto)} | Desde: ${fmt(o.fechaDesde)} | Hasta: ${fmt(o.fechaHasta)}`,
            40,
            (y += 14)
          );
        }
      }

      // ✅ datos actuales en PDF (para comparación)
      doc.setFont("helvetica", "bold");
      doc.text("Datos actuales (contribuyente)", 40, (y += 18));
      doc.setFont("helvetica", "normal");
      doc.text(`Aviso operación (actual): ${fmt(tramite.avisoOperacionActual)}`, 40, (y += 14));
      doc.text(
        `Tel fijo: ${fmt(tramite.contactoActual?.telFijo)}  |  Tel móvil: ${fmt(
          tramite.contactoActual?.telMovil
        )}  |  Fax: ${fmt(tramite.contactoActual?.fax)}`,
        40,
        (y += 14)
      );
      doc.text(`Correo: ${fmt(tramite.contactoActual?.correo)}`, 40, (y += 14));
      doc.text(
        `Dirección: Prov ${fmt(tramite.direccionActual?.provincia)}, Dist ${fmt(
          tramite.direccionActual?.distrito
        )}, Corr ${fmt(tramite.direccionActual?.corregimiento)}, Barrio ${fmt(
          tramite.direccionActual?.barrio
        )}`,
        40,
        (y += 14)
      );
      doc.text(
        `Calle/Av: ${fmt(tramite.direccionActual?.calleAvenida)}  |  Edif: ${fmt(
          tramite.direccionActual?.nombreEdificio
        )}  |  Casa/Apto: ${fmt(tramite.direccionActual?.numeroCasaApto)}`,
        40,
        (y += 14)
      );
      doc.text(`Ref: ${fmt(tramite.direccionActual?.referencia)}`, 40, (y += 14));
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
    const ok = window.confirm(`¿Está seguro que desea enviar el ${isActaCierre ? "acta" : "informe"}?`);
    if (!ok) return;
    alert("Enviado (demo).");
  };

  const cfgSel = impuestoSel ? taxByLabel.get(impuestoSel) : undefined;
  const periodicidadSel: Periodicidad = cfgSel?.periodicidad ?? "MENSUAL";
  const placeDesde = periodicidadSel === "MENSUAL" ? "202301" : "2023";
  const placeHasta = periodicidadSel === "MENSUAL" ? "202312" : "2025";

  /** obligaciones (solo lectura) */
  const obligaciones = (tramite?.obligaciones ?? []) as Array<{
    impuesto: string;
    fechaDesde: string;
    fechaHasta?: string;
  }>;

  return (
    <div style={{ fontFamily: "Arial, sans-serif", margin: 20 }}>
      <h1>{pageTitle}</h1>

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

              {/* ✅ NUEVO: Acta Inicio Fiscalización (solo lectura) */}
              <tr>
                <td style={tdStyle}>
                  N° Acta Inicio de Fiscalización:{" "}
                  <b>{fmt(tramite.actaInicioFiscalizacion?.numero) || "723000001132"}</b>
                </td>
                <td style={tdStyle} colSpan={2}>
                  Fecha Acta Inicio de Fiscalización:{" "}
                  <b>{fmt(tramite.actaInicioFiscalizacion?.fecha) || "18/02/2025"}</b>
                </td>
              </tr>
            </tbody>
          </table>
        ) : (
          <div style={{ color: "#b00", fontWeight: 700 }}>
            No hay trámite seleccionado. Entra a TRÁMITE y presiona “Crear”.
          </div>
        )}
      </div>

      {/* ================= DATOS DEL CONTRIBUYENTE (NUEVO) ================= */}
      <div style={card}>
        <div style={{ fontWeight: 900, marginBottom: 8 }}>Datos del contribuyente</div>

        {!tramite ? (
          <div style={{ color: "#666" }}>Seleccione un trámite para ver los datos del contribuyente.</div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            <div>
              <label style={{ display: "block", fontWeight: 800, marginBottom: 6 }}>
                Razón Comercial
              </label>
              <input
                type="text"
                style={inputStyle}
                value={razonComercial}
                onChange={(e) => setRazonComercial(e.target.value)}
                placeholder="Escriba la razón comercial..."
              />
            </div>

            <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 10 }}>
              <b>Obligaciones (solo lectura)</b>

              <div style={{ marginTop: 10 }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Impuesto</th>
                      <th style={thStyle}>Fecha Desde</th>
                      <th style={thStyle}>Fecha Hasta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {obligaciones.length ? (
                      obligaciones.map((o, idx) => (
                        <tr key={`${o.impuesto}-${idx}`}>
                          <td style={tdStyle}>{fmt(o.impuesto)}</td>
                          <td style={tdStyle}>{fmt(o.fechaDesde)}</td>
                          <td style={tdStyle}>{fmt(o.fechaHasta)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td style={tdStyle} colSpan={3} align="center">
                          Sin obligaciones registradas
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                <div style={{ marginTop: 6, color: "#666", fontSize: 12 }}>
                  * “Fecha Hasta” suele estar vacía si la obligación está activa.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ================= DATOS ACTUALES (SIEMPRE) ================= */}
      <div style={card}>
        <div style={{ fontWeight: 900, marginBottom: 8 }}>Datos actuales del contribuyente</div>

        {!tramite ? (
          <div style={{ color: "#666" }}>Seleccione un trámite para ver los datos actuales.</div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            <div>
              <b>Número de Aviso de Operación (actual):</b> {fmt(tramite.avisoOperacionActual)}
            </div>

            <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 10 }}>
              <b>Datos de contacto (actual)</b>
              <div style={{ display: "flex", gap: 12, marginTop: 8, flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 220px" }}>
                  <div style={{ color: "#666", fontSize: 12 }}>Teléfono fijo</div>
                  <div style={{ fontWeight: 800 }}>{fmt(tramite.contactoActual?.telFijo)}</div>
                </div>
                <div style={{ flex: "1 1 220px" }}>
                  <div style={{ color: "#666", fontSize: 12 }}>Teléfono móvil</div>
                  <div style={{ fontWeight: 800 }}>{fmt(tramite.contactoActual?.telMovil)}</div>
                </div>
                <div style={{ flex: "1 1 220px" }}>
                  <div style={{ color: "#666", fontSize: 12 }}>Fax</div>
                  <div style={{ fontWeight: 800 }}>{fmt(tramite.contactoActual?.fax)}</div>
                </div>
              </div>

              <div style={{ marginTop: 8 }}>
                <div style={{ color: "#666", fontSize: 12 }}>Correo electrónico</div>
                <div style={{ fontWeight: 800 }}>{fmt(tramite.contactoActual?.correo)}</div>
              </div>
            </div>

            <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 10 }}>
              <b>Dirección (actual)</b>

              <div style={{ display: "flex", gap: 12, marginTop: 8, flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 220px" }}>
                  <div style={{ color: "#666", fontSize: 12 }}>Provincia</div>
                  <div style={{ fontWeight: 800 }}>{fmt(tramite.direccionActual?.provincia)}</div>
                </div>
                <div style={{ flex: "1 1 220px" }}>
                  <div style={{ color: "#666", fontSize: 12 }}>Distrito</div>
                  <div style={{ fontWeight: 800 }}>{fmt(tramite.direccionActual?.distrito)}</div>
                </div>
                <div style={{ flex: "1 1 220px" }}>
                  <div style={{ color: "#666", fontSize: 12 }}>Corregimiento</div>
                  <div style={{ fontWeight: 800 }}>{fmt(tramite.direccionActual?.corregimiento)}</div>
                </div>
                <div style={{ flex: "1 1 220px" }}>
                  <div style={{ color: "#666", fontSize: 12 }}>Barrio</div>
                  <div style={{ fontWeight: 800 }}>{fmt(tramite.direccionActual?.barrio)}</div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, marginTop: 8, flexWrap: "wrap" }}>
                <div style={{ flex: "2 1 260px" }}>
                  <div style={{ color: "#666", fontSize: 12 }}>Calle o Avenida</div>
                  <div style={{ fontWeight: 800 }}>{fmt(tramite.direccionActual?.calleAvenida)}</div>
                </div>
                <div style={{ flex: "1 1 220px" }}>
                  <div style={{ color: "#666", fontSize: 12 }}>Nombre de Edificio</div>
                  <div style={{ fontWeight: 800 }}>{fmt(tramite.direccionActual?.nombreEdificio)}</div>
                </div>
                <div style={{ flex: "1 1 220px" }}>
                  <div style={{ color: "#666", fontSize: 12 }}>Número Apartamento/Casa</div>
                  <div style={{ fontWeight: 800 }}>{fmt(tramite.direccionActual?.numeroCasaApto)}</div>
                </div>
              </div>

              <div style={{ marginTop: 8 }}>
                <div style={{ color: "#666", fontSize: 12 }}>Referencia</div>
                <div style={{ fontWeight: 800 }}>{fmt(tramite.direccionActual?.referencia)}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ================= DATOS ACTUALIZADOS (como HTML) ================= */}
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

          {/* ✅ QUITADO: “Número de Aviso de Operación actualizado” */}

          <div
            style={{
              marginTop: 10,
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

          <div
            style={{
              marginTop: 16,
              border: "1px solid #ccc",
              padding: 10,
              borderRadius: 6,
            }}
          >
            <strong>Dirección actualizada</strong>

            <div style={{ display: "flex", gap: 12, marginTop: 10, flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 220px" }}>
                <label style={{ display: "block", fontWeight: 700 }}>Provincia</label>
                <input
                  type="text"
                  style={inputStyle}
                  value={provincia}
                  onChange={(e) => setProvincia(e.target.value)}
                />
              </div>

              <div style={{ flex: "1 1 220px" }}>
                <label style={{ display: "block", fontWeight: 700 }}>Distrito</label>
                <input
                  type="text"
                  style={inputStyle}
                  value={distrito}
                  onChange={(e) => setDistrito(e.target.value)}
                />
              </div>

              <div style={{ flex: "1 1 220px" }}>
                <label style={{ display: "block", fontWeight: 700 }}>Corregimiento</label>
                <input
                  type="text"
                  style={inputStyle}
                  value={corregimiento}
                  onChange={(e) => setCorregimiento(e.target.value)}
                />
              </div>

              <div style={{ flex: "1 1 220px" }}>
                <label style={{ display: "block", fontWeight: 700 }}>Barrio</label>
                <input
                  type="text"
                  style={inputStyle}
                  value={barrio}
                  onChange={(e) => setBarrio(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 10, flexWrap: "wrap" }}>
              <div style={{ flex: "2 1 260px" }}>
                <label style={{ display: "block", fontWeight: 700 }}>Calle o Avenida</label>
                <input
                  type="text"
                  style={inputStyle}
                  value={calleAvenida}
                  onChange={(e) => setCalleAvenida(e.target.value)}
                />
              </div>

              <div style={{ flex: "1 1 260px" }}>
                <label style={{ display: "block", fontWeight: 700 }}>Nombre de Edificio</label>
                <input
                  type="text"
                  style={inputStyle}
                  value={nombreEdificio}
                  onChange={(e) => setNombreEdificio(e.target.value)}
                />
              </div>

              <div style={{ flex: "1 1 260px" }}>
                <label style={{ display: "block", fontWeight: 700 }}>
                  Número de Apartamento/Casa
                </label>
                <input
                  type="text"
                  style={inputStyle}
                  value={numeroCasaApto}
                  onChange={(e) => setNumeroCasaApto(e.target.value)}
                />
              </div>
            </div>

            <div style={{ marginTop: 10 }}>
              <label style={{ display: "block", fontWeight: 700 }}>Referencia</label>
              <input
                type="text"
                style={inputStyle}
                value={referencia}
                onChange={(e) => setReferencia(e.target.value)}
              />
            </div>
          </div>
        </fieldset>
      )}

      {/* ================= RESULTADO ================= */}
      <fieldset style={{ marginTop: 12 }}>
        <legend>Resultado</legend>

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

        {!hasAnyTable && (
          <div style={{ marginBottom: 10, color: "#666" }}>
            Seleccione un <b>Impuesto</b> y un rango de <b>Períodos</b>, luego presione{" "}
            <b>Agregar</b> para mostrar la tabla.
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "minmax(260px, 1.2fr) minmax(160px, 0.6fr) minmax(160px, 0.6fr) auto auto 1fr",
            gap: 10,
            alignItems: "end",
          }}
        >
          <label style={{ fontWeight: 700 }}>
            Impuesto
            <select
              style={inputStyle}
              value={impuestoSel}
              onChange={(e) => {
                const v = e.target.value as Impuesto;
                setImpuestoSel(v);
                setDesde("");
                setHasta("");
              }}
            >
              <option value="">Seleccione...</option>
              {impuestosCatalogo.map((x) => (
                <option key={x.label} value={x.label}>
                  {x.label} {x.periodicidad === "ANUAL" ? "(Anual)" : "(Mensual)"}
                </option>
              ))}
            </select>
          </label>

          <label style={{ fontWeight: 700 }}>
            Desde ({periodicidadSel === "MENSUAL" ? "AAAAMM" : "AAAA"})
            <input
              style={inputStyle}
              value={desde}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "");
                setDesde(periodicidadSel === "MENSUAL" ? digits.slice(0, 6) : digits.slice(0, 4));
              }}
              placeholder={placeDesde}
            />
          </label>

          <label style={{ fontWeight: 700 }}>
            Hasta ({periodicidadSel === "MENSUAL" ? "AAAAMM" : "AAAA"})
            <input
              style={inputStyle}
              value={hasta}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "");
                setHasta(periodicidadSel === "MENSUAL" ? digits.slice(0, 6) : digits.slice(0, 4));
              }}
              placeholder={placeHasta}
            />
          </label>

          <button style={{ ...btnSuccess, margin: 0 }} onClick={addRange}>
            Agregar
          </button>

          {hasAnyTable ? (
            <button style={{ ...btnDanger, margin: 0 }} onClick={eliminarSeleccionados}>
              Eliminar seleccionados
            </button>
          ) : (
            <div />
          )}

          <div style={{ justifySelf: "end", fontWeight: 900 }}>
            Total general (B/.): {totalGeneral.toFixed(2)}
          </div>
        </div>

        {hasAnyTable && (
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

              const cfg = taxByLabel.get(tax);
              const periodicidad: Periodicidad = cfg?.periodicidad ?? "MENSUAL";

              return (
                <Accordion
                  key={tax}
                  title={`${tax} — Total (B/.): ${totalTax.toFixed(2)}`}
                  defaultOpen={tax === impuestoSel}
                >
                  <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
                    <div style={{ fontWeight: 800 }}>
                      Filtro período ({periodicidad === "MENSUAL" ? "AAAAMM" : "AAAA"}):
                    </div>
                    <input
                      style={{ ...inputStyle, maxWidth: 220 }}
                      value={filter.searchPeriodo}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, "");
                        setFilter(tax, {
                          searchPeriodo:
                            periodicidad === "MENSUAL" ? digits.slice(0, 6) : digits.slice(0, 4),
                        });
                        setPager(tax, { page: 1 });
                      }}
                      placeholder={periodicidad === "MENSUAL" ? "Ej: 2023 o 202301" : "Ej: 2023"}
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
                          Período
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

      {/* ================= WORD: Descargar + Subir ================= */}
      <div style={card}>
        <div style={{ fontWeight: 900, marginBottom: 8 }}>Documento Word</div>

        <button style={btnSecondary} onClick={descargarWord}>
          Descargar en Word
        </button>

        <div style={{ marginTop: 10 }}>
          <label style={{ display: "block", fontWeight: 800, marginBottom: 6 }}>
            Subir documento completado
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

export default CrearInformeAuditoria;
