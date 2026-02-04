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

type Contacto = {
  telFijo?: string;
  telMovil?: string;
  fax?: string;
  correo?: string;
};

type Direccion = {
  provincia?: string;
  distrito?: string;
  corregimiento?: string;
  barrio?: string;
  calleAvenida?: string;
  nombreEdificio?: string;
  numeroCasaApto?: string;
  referencia?: string;
};

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
  padding: 8,
  boxSizing: "border-box",
  border: "1px solid #cfcfcf",
  borderRadius: 6,
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
  // ✅ sin bordes (pedido)
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

const labelStyle: React.CSSProperties = {
  display: "block",
  fontWeight: 800,
  marginBottom: 6,
};

const helpStyle: React.CSSProperties = {
  color: "#666",
  fontSize: 12,
};

const fieldGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(12, 1fr)",
  gap: 10,
};

const col = (span: number): React.CSSProperties => ({
  gridColumn: `span ${span}`,
});

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

const modalBody: React.CSSProperties = {
  padding: 14,
  overflow: "auto",
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
          style={{ ...btnBase, margin: 0, background: "#f2f2f2", color: "#111" }}
          disabled={!canPrev}
          onClick={() => onPage(page - 1)}
        >
          ◀
        </button>

        <div style={{ fontWeight: 800 }}>
          Página {page} / {totalPages}
        </div>

        <button
          style={{ ...btnBase, margin: 0, background: "#f2f2f2", color: "#111" }}
          disabled={!canNext}
          onClick={() => onPage(page + 1)}
        >
          ▶
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <span style={{ fontWeight: 800 }}>Filas:</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSize(Number(e.target.value))}
          style={{ padding: 6, borderRadius: 6, border: "1px solid #cfcfcf" }}
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
  const [conclusiones, setConclusiones] = useState("");

  /** ✅ Razón Comercial (texto abierto) */
  const [razonComercial, setRazonComercial] = useState<string>(
    (tramite?.razonComercial as any) ?? ""
  );

  /** ===== Datos actualizados (en campos ocultos) ===== */
  const [deseaActualizar, setDeseaActualizar] = useState<"NO" | "SI">("NO");
  const [openModalActualizado, setOpenModalActualizado] = useState(false);

  // ✅ valores "guardados" (ocultos)
  const [contactoActualizado, setContactoActualizado] = useState<Contacto>({});
  const [direccionActualizada, setDireccionActualizada] = useState<Direccion>({});

  // ✅ valores temporales del modal (edición)
  const [tmpContacto, setTmpContacto] = useState<Contacto>({});
  const [tmpDireccion, setTmpDireccion] = useState<Direccion>({});

  const openModalPrefill = () => {
    const baseContacto: Contacto = {
      telFijo: contactoActualizado.telFijo ?? tramite?.contactoActual?.telFijo ?? "",
      telMovil: contactoActualizado.telMovil ?? tramite?.contactoActual?.telMovil ?? "",
      fax: contactoActualizado.fax ?? tramite?.contactoActual?.fax ?? "",
      correo: contactoActualizado.correo ?? tramite?.contactoActual?.correo ?? "",
    };

    const baseDireccion: Direccion = {
      provincia: direccionActualizada.provincia ?? tramite?.direccionActual?.provincia ?? "",
      distrito: direccionActualizada.distrito ?? tramite?.direccionActual?.distrito ?? "",
      corregimiento:
        direccionActualizada.corregimiento ?? tramite?.direccionActual?.corregimiento ?? "",
      barrio: direccionActualizada.barrio ?? tramite?.direccionActual?.barrio ?? "",
      calleAvenida:
        direccionActualizada.calleAvenida ?? tramite?.direccionActual?.calleAvenida ?? "",
      nombreEdificio:
        direccionActualizada.nombreEdificio ?? tramite?.direccionActual?.nombreEdificio ?? "",
      numeroCasaApto:
        direccionActualizada.numeroCasaApto ?? tramite?.direccionActual?.numeroCasaApto ?? "",
      referencia: direccionActualizada.referencia ?? tramite?.direccionActual?.referencia ?? "",
    };

    setTmpContacto(baseContacto);
    setTmpDireccion(baseDireccion);
    setOpenModalActualizado(true);
  };

  const onChangeDeseaActualizar = (v: "NO" | "SI") => {
    setDeseaActualizar(v);
    if (v === "SI") {
      openModalPrefill();
    } else {
      setOpenModalActualizado(false);
      // Nota: NO limpiamos lo guardado, por si el usuario vuelve a poner "SI" y quiere conservar
    }
  };

  const guardarActualizado = () => {
    setContactoActualizado(tmpContacto);
    setDireccionActualizada(tmpDireccion);
    setOpenModalActualizado(false);
  };

  const cancelarActualizado = () => {
    setOpenModalActualizado(false);
  };

  const hayDatosActualizadosGuardados =
    Object.values(contactoActualizado).some((x) => String(x ?? "").trim() !== "") ||
    Object.values(direccionActualizada).some((x) => String(x ?? "").trim() !== "");

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

  /** obligaciones (solo lectura) */
  const obligaciones = (tramite?.obligaciones ?? []) as Array<{
    impuesto: string;
    fechaDesde: string;
    fechaHasta?: string;
  }>;

  /** ✅ Word: descarga plantilla (Word abre HTML sin problema) */
  const descargarWord = () => {
    const actaNumero = fmt(tramite?.actaInicioFiscalizacion?.numero);
    const actaFecha = fmt(tramite?.actaInicioFiscalizacion?.fecha);

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

    const cAct = tramite?.contactoActual ?? {};
    const dAct = tramite?.direccionActual ?? {};

    const cUpd = contactoActualizado;
    const dUpd = direccionActualizada;

    const html = `
      <html>
        <head><meta charset="utf-8"/></head>
        <body style="font-family: Arial, sans-serif;">
          <h2>${pageTitle}</h2>

          <h3>Datos del Trámite</h3>
          <p><b>N° Acta Inicio de Fiscalización:</b> ${actaNumero}</p>
          <p><b>Fecha Acta Inicio de Fiscalización:</b> ${actaFecha}</p>

          <h3>Datos del contribuyente</h3>
          <p><b>RUC:</b> ${fmt(tramite?.ruc)} &nbsp; <b>DV:</b> ${fmt(tramite?.digitoVerificador)}</p>
          <p><b>Razón social:</b> ${fmt(tramite?.razonSocial ?? tramite?.contribuyente)}</p>
          <p><b>Razón comercial:</b> ${fmt(razonComercial)}</p>

          <h4>Datos de contacto</h4>
          <p>
            Tel fijo: ${fmt(cAct.telFijo)} |
            Tel móvil: ${fmt(cAct.telMovil)} |
            Fax: ${fmt(cAct.fax)} |
            Correo: ${fmt(cAct.correo)}
          </p>

          <h4>Dirección</h4>
          <p>
            Provincia: ${fmt(dAct.provincia)} |
            Distrito: ${fmt(dAct.distrito)} |
            Corregimiento: ${fmt(dAct.corregimiento)} |
            Barrio: ${fmt(dAct.barrio)}
          </p>
          <p>
            Calle/Avenida: ${fmt(dAct.calleAvenida)} |
            Edificio: ${fmt(dAct.nombreEdificio)} |
            Apto/Casa: ${fmt(dAct.numeroCasaApto)} |
            Referencia: ${fmt(dAct.referencia)}
          </p>

          <h4>Obligaciones</h4>
          ${obligacionesHtml}

          <h3>Información de contacto y/o dirección actualizada</h3>
          <p><b>¿Desea registrar información actualizada?</b> ${deseaActualizar}</p>
          ${
            deseaActualizar === "SI"
              ? `
              <p style="color:#666;">(Se guardó en campos internos del formulario)</p>
              <p><b>Contacto actualizado:</b>
                Tel fijo: ${fmt(cUpd.telFijo)} |
                Tel móvil: ${fmt(cUpd.telMovil)} |
                Fax: ${fmt(cUpd.fax)} |
                Correo: ${fmt(cUpd.correo)}
              </p>
              <p><b>Dirección actualizada:</b>
                Prov: ${fmt(dUpd.provincia)} |
                Dist: ${fmt(dUpd.distrito)} |
                Corr: ${fmt(dUpd.corregimiento)} |
                Barrio: ${fmt(dUpd.barrio)} |
                Calle/Av: ${fmt(dUpd.calleAvenida)} |
                Edif: ${fmt(dUpd.nombreEdificio)} |
                Apto/Casa: ${fmt(dUpd.numeroCasaApto)} |
                Ref: ${fmt(dUpd.referencia)}
              </p>
              `
              : `<p style="color:#666;">No aplica.</p>`
          }

          <h3>Resultado</h3>
          <p><b>Resultado:</b> ${resultado}</p>
          <p><b>Conclusiones:</b><br/>${(conclusiones || "(Sin conclusiones)").replace(
            /\n/g,
            "<br/>"
          )}</p>

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

    // ✅ Datos del Trámite (solo 2 campos)
    doc.setFont("helvetica", "bold");
    doc.text("Datos del Trámite", 40, (y += 16));
    doc.setFont("helvetica", "normal");

    const t = [
      ["N° Acta Inicio de Fiscalización", actaNumero],
      ["Fecha Acta Inicio de Fiscalización", actaFecha],
    ];

    for (const [k, v] of t) {
      if (y > 760) {
        doc.addPage();
        y = 60;
      }
      doc.setFont("helvetica", "bold");
      doc.text(`${k}:`, 40, (y += 14));
      doc.setFont("helvetica", "normal");
      doc.text(String(v), 280, y);
    }

    // ✅ Datos del contribuyente (fusionado)
    doc.setFont("helvetica", "bold");
    doc.text("Datos del contribuyente", 40, (y += 18));
    doc.setFont("helvetica", "normal");

    doc.text(`RUC: ${fmt(tramite?.ruc)}   DV: ${fmt(tramite?.digitoVerificador)}`, 40, (y += 14));
    doc.text(
      `Razón social: ${fmt(tramite?.razonSocial ?? tramite?.contribuyente)}`,
      40,
      (y += 14)
    );
    doc.text(`Razón comercial: ${fmt(razonComercial)}`, 40, (y += 14));

    const cAct = tramite?.contactoActual ?? {};
    doc.setFont("helvetica", "bold");
    doc.text("Datos de contacto", 40, (y += 16));
    doc.setFont("helvetica", "normal");
    doc.text(
      `Tel fijo: ${fmt(cAct.telFijo)}  |  Tel móvil: ${fmt(cAct.telMovil)}  |  Fax: ${fmt(
        cAct.fax
      )}`,
      40,
      (y += 14)
    );
    doc.text(`Correo: ${fmt(cAct.correo)}`, 40, (y += 14));

    const dAct = tramite?.direccionActual ?? {};
    doc.setFont("helvetica", "bold");
    doc.text("Dirección", 40, (y += 16));
    doc.setFont("helvetica", "normal");
    doc.text(
      `Provincia: ${fmt(dAct.provincia)}  |  Distrito: ${fmt(dAct.distrito)}  |  Corregimiento: ${fmt(
        dAct.corregimiento
      )}`,
      40,
      (y += 14)
    );
    doc.text(`Barrio: ${fmt(dAct.barrio)}  |  Calle/Avenida: ${fmt(dAct.calleAvenida)}`, 40, (y += 14));
    doc.text(
      `Edificio: ${fmt(dAct.nombreEdificio)}  |  Apto/Casa: ${fmt(
        dAct.numeroCasaApto
      )}  |  Ref: ${fmt(dAct.referencia)}`,
      40,
      (y += 14)
    );

    // Obligaciones (listado simple en PDF)
    doc.setFont("helvetica", "bold");
    doc.text("Obligaciones", 40, (y += 18));
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

    // Info actualizada (si aplica)
    doc.setFont("helvetica", "bold");
    doc.text("Información actualizada", 40, (y += 18));
    doc.setFont("helvetica", "normal");
    doc.text(`¿Desea registrar información actualizada?: ${deseaActualizar}`, 40, (y += 14));
    if (deseaActualizar === "SI") {
      const cUpd = contactoActualizado;
      const dUpd = direccionActualizada;
      doc.text(
        `Contacto actualizado: Fijo ${fmt(cUpd.telFijo)} | Móvil ${fmt(cUpd.telMovil)} | Fax ${fmt(
          cUpd.fax
        )} | Correo ${fmt(cUpd.correo)}`,
        40,
        (y += 14)
      );
      doc.text(
        `Dirección actualizada: Prov ${fmt(dUpd.provincia)}, Dist ${fmt(dUpd.distrito)}, Corr ${fmt(
          dUpd.corregimiento
        )}, Barrio ${fmt(dUpd.barrio)}`,
        40,
        (y += 14)
      );
      doc.text(
        `Calle/Av ${fmt(dUpd.calleAvenida)} | Edif ${fmt(dUpd.nombreEdificio)} | Apto/Casa ${fmt(
          dUpd.numeroCasaApto
        )} | Ref ${fmt(dUpd.referencia)}`,
        40,
        (y += 14)
      );
    } else {
      doc.text("No aplica.", 40, (y += 14));
    }

    // Resultado
    doc.setFont("helvetica", "bold");
    doc.text("Resultado", 40, (y += 18));
    doc.setFont("helvetica", "normal");
    doc.text(`Resultado: ${resultado}`, 40, (y += 14));

    const concLines = doc.splitTextToSize(conclusiones || "(Sin conclusiones)", 520);
    doc.text("Conclusiones:", 40, (y += 14));
    doc.text(concLines, 40, (y += 12));
    y += concLines.length * 10;

    // Alcance
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

  const actaNumero = fmt(tramite?.actaInicioFiscalizacion?.numero);
  const actaFecha = fmt(tramite?.actaInicioFiscalizacion?.fecha);

  const ruc = fmt(tramite?.ruc);
  const dv = fmt(tramite?.digitoVerificador);
  const razonSocial = fmt(tramite?.razonSocial ?? tramite?.contribuyente);

  const cAct = tramite?.contactoActual ?? {};
  const dAct = tramite?.direccionActual ?? {};

  return (
    <div style={{ fontFamily: "Arial, sans-serif", margin: 20 }}>
      <h1>{pageTitle}</h1>

      {/* ===== Modal PDF ===== */}
      {openPdf && (
        <div style={modalOverlay} onClick={() => setOpenPdf(false)}>
          <div style={modalCard} onClick={(e) => e.stopPropagation()}>
            <div style={modalHeader}>
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

      {/* ===== Modal Información Actualizada ===== */}
      {openModalActualizado && (
        <div style={modalOverlay} onClick={() => setOpenModalActualizado(false)}>
          <div style={modalCard} onClick={(e) => e.stopPropagation()}>
            <div style={modalHeader}>
              <b>Actualizar información de contacto y dirección</b>
              <button
                style={{ ...btnBase, margin: 0, background: "#dc3545", color: "#fff" }}
                onClick={() => setOpenModalActualizado(false)}
              >
                ✕
              </button>
            </div>

            <div style={modalBody}>
              <div style={{ ...card, marginTop: 0 }}>
                <div style={sectionTitle}>Datos de contacto</div>
                <div style={fieldGrid}>
                  <div style={col(3)}>
                    <label style={labelStyle}>Teléfono fijo</label>
                    <input
                      style={inputStyle}
                      value={tmpContacto.telFijo ?? ""}
                      onChange={(e) => setTmpContacto((p) => ({ ...p, telFijo: e.target.value }))}
                    />
                  </div>
                  <div style={col(3)}>
                    <label style={labelStyle}>Teléfono móvil</label>
                    <input
                      style={inputStyle}
                      value={tmpContacto.telMovil ?? ""}
                      onChange={(e) => setTmpContacto((p) => ({ ...p, telMovil: e.target.value }))}
                    />
                  </div>
                  <div style={col(3)}>
                    <label style={labelStyle}>Fax</label>
                    <input
                      style={inputStyle}
                      value={tmpContacto.fax ?? ""}
                      onChange={(e) => setTmpContacto((p) => ({ ...p, fax: e.target.value }))}
                    />
                  </div>
                  <div style={col(12)}>
                    <label style={labelStyle}>Correo electrónico</label>
                    <input
                      type="email"
                      style={inputStyle}
                      value={tmpContacto.correo ?? ""}
                      onChange={(e) => setTmpContacto((p) => ({ ...p, correo: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <div style={card}>
                <div style={sectionTitle}>Dirección</div>
                <div style={fieldGrid}>
                  <div style={col(3)}>
                    <label style={labelStyle}>Provincia</label>
                    <input
                      style={inputStyle}
                      value={tmpDireccion.provincia ?? ""}
                      onChange={(e) => setTmpDireccion((p) => ({ ...p, provincia: e.target.value }))}
                    />
                  </div>
                  <div style={col(3)}>
                    <label style={labelStyle}>Distrito</label>
                    <input
                      style={inputStyle}
                      value={tmpDireccion.distrito ?? ""}
                      onChange={(e) => setTmpDireccion((p) => ({ ...p, distrito: e.target.value }))}
                    />
                  </div>
                  <div style={col(3)}>
                    <label style={labelStyle}>Corregimiento</label>
                    <input
                      style={inputStyle}
                      value={tmpDireccion.corregimiento ?? ""}
                      onChange={(e) =>
                        setTmpDireccion((p) => ({ ...p, corregimiento: e.target.value }))
                      }
                    />
                  </div>
                  <div style={col(3)}>
                    <label style={labelStyle}>Barrio</label>
                    <input
                      style={inputStyle}
                      value={tmpDireccion.barrio ?? ""}
                      onChange={(e) => setTmpDireccion((p) => ({ ...p, barrio: e.target.value }))}
                    />
                  </div>

                  <div style={col(6)}>
                    <label style={labelStyle}>Calle o Avenida</label>
                    <input
                      style={inputStyle}
                      value={tmpDireccion.calleAvenida ?? ""}
                      onChange={(e) =>
                        setTmpDireccion((p) => ({ ...p, calleAvenida: e.target.value }))
                      }
                    />
                  </div>
                  <div style={col(3)}>
                    <label style={labelStyle}>Nombre de Edificio</label>
                    <input
                      style={inputStyle}
                      value={tmpDireccion.nombreEdificio ?? ""}
                      onChange={(e) =>
                        setTmpDireccion((p) => ({ ...p, nombreEdificio: e.target.value }))
                      }
                    />
                  </div>
                  <div style={col(3)}>
                    <label style={labelStyle}>Número Apartamento/Casa</label>
                    <input
                      style={inputStyle}
                      value={tmpDireccion.numeroCasaApto ?? ""}
                      onChange={(e) =>
                        setTmpDireccion((p) => ({ ...p, numeroCasaApto: e.target.value }))
                      }
                    />
                  </div>

                  <div style={col(12)}>
                    <label style={labelStyle}>Referencia</label>
                    <input
                      style={inputStyle}
                      value={tmpDireccion.referencia ?? ""}
                      onChange={(e) =>
                        setTmpDireccion((p) => ({ ...p, referencia: e.target.value }))
                      }
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button style={{ ...btnSecondary, marginTop: 0 }} onClick={cancelarActualizado}>
                  Cancelar
                </button>
                <button style={{ ...btnSuccess, marginTop: 0 }} onClick={guardarActualizado}>
                  Guardar
                </button>
              </div>

              <div style={{ marginTop: 10, ...helpStyle }}>
                * Los cambios se guardan internamente en el formulario (campos ocultos).
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= DATOS TRÁMITE (solo 2 campos, sin bordes) ================= */}
      <div style={card}>
        <div style={sectionTitle}>Datos del trámite</div>

        {!tramite ? (
          <div style={{ color: "#b00", fontWeight: 800 }}>
            No hay trámite seleccionado. Entra a TRÁMITE y presiona “Crear”.
          </div>
        ) : (
          <div style={fieldGrid}>
            <div style={col(6)}>
              <div style={helpStyle}>N° Acta Inicio de Fiscalización</div>
              <div style={{ fontWeight: 900 }}>{actaNumero}</div>
            </div>
            <div style={col(6)}>
              <div style={helpStyle}>Fecha Acta Inicio de Fiscalización</div>
              <div style={{ fontWeight: 900 }}>{actaFecha}</div>
            </div>
          </div>
        )}
      </div>

      {/* ================= DATOS CONTRIBUYENTE (FUSIONADO con datos actuales) ================= */}
      <div style={card}>
        <div style={sectionTitle}>Datos del contribuyente</div>

        {!tramite ? (
          <div style={{ color: "#666" }}>Seleccione un trámite para ver los datos.</div>
        ) : (
          <>
            <div style={fieldGrid}>
              <div style={col(4)}>
                <div style={helpStyle}>RUC</div>
                <div style={{ fontWeight: 900 }}>{ruc}</div>
              </div>
              <div style={col(2)}>
                <div style={helpStyle}>DV</div>
                <div style={{ fontWeight: 900 }}>{dv}</div>
              </div>
              <div style={col(6)}>
                <div style={helpStyle}>Razón social</div>
                <div style={{ fontWeight: 900 }}>{razonSocial}</div>
              </div>

              <div style={col(12)}>
                <label style={labelStyle}>Razón comercial</label>
                <input
                  type="text"
                  style={inputStyle}
                  value={razonComercial}
                  onChange={(e) => setRazonComercial(e.target.value)}
                  placeholder="Escriba la razón comercial..."
                />
              </div>
            </div>

            {/* Datos de contacto */}
            <div style={{ marginTop: 10 }}>
              <div style={{ fontWeight: 900, marginBottom: 8 }}>Datos de contacto</div>
              <div style={fieldGrid}>
                <div style={col(3)}>
                  <div style={helpStyle}>Teléfono fijo</div>
                  <div style={{ fontWeight: 900 }}>{fmt(cAct.telFijo)}</div>
                </div>
                <div style={col(3)}>
                  <div style={helpStyle}>Teléfono móvil</div>
                  <div style={{ fontWeight: 900 }}>{fmt(cAct.telMovil)}</div>
                </div>
                <div style={col(3)}>
                  <div style={helpStyle}>Fax</div>
                  <div style={{ fontWeight: 900 }}>{fmt(cAct.fax)}</div>
                </div>
                <div style={col(3)}>
                  <div style={helpStyle}>Correo electrónico</div>
                  <div style={{ fontWeight: 900 }}>{fmt(cAct.correo)}</div>
                </div>
              </div>
            </div>

            {/* Dirección */}
            <div style={{ marginTop: 12 }}>
              <div style={{ fontWeight: 900, marginBottom: 8 }}>Dirección</div>
              <div style={fieldGrid}>
                <div style={col(3)}>
                  <div style={helpStyle}>Provincia</div>
                  <div style={{ fontWeight: 900 }}>{fmt(dAct.provincia)}</div>
                </div>
                <div style={col(3)}>
                  <div style={helpStyle}>Distrito</div>
                  <div style={{ fontWeight: 900 }}>{fmt(dAct.distrito)}</div>
                </div>
                <div style={col(3)}>
                  <div style={helpStyle}>Corregimiento</div>
                  <div style={{ fontWeight: 900 }}>{fmt(dAct.corregimiento)}</div>
                </div>
                <div style={col(3)}>
                  <div style={helpStyle}>Barrio</div>
                  <div style={{ fontWeight: 900 }}>{fmt(dAct.barrio)}</div>
                </div>

                <div style={col(6)}>
                  <div style={helpStyle}>Calle o Avenida</div>
                  <div style={{ fontWeight: 900 }}>{fmt(dAct.calleAvenida)}</div>
                </div>
                <div style={col(3)}>
                  <div style={helpStyle}>Nombre de Edificio</div>
                  <div style={{ fontWeight: 900 }}>{fmt(dAct.nombreEdificio)}</div>
                </div>
                <div style={col(3)}>
                  <div style={helpStyle}>Número Apartamento/Casa</div>
                  <div style={{ fontWeight: 900 }}>{fmt(dAct.numeroCasaApto)}</div>
                </div>
                <div style={col(12)}>
                  <div style={helpStyle}>Referencia</div>
                  <div style={{ fontWeight: 900 }}>{fmt(dAct.referencia)}</div>
                </div>
              </div>
            </div>

            {/* Obligaciones (✅ con bordes) */}
            <div style={{ marginTop: 14 }}>
              <div style={{ fontWeight: 900, marginBottom: 8 }}>Obligaciones</div>
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

              <div style={{ marginTop: 6, ...helpStyle }}>
                * “Fecha Hasta” suele estar vacía si la obligación está activa.
              </div>
            </div>

            {/* Pregunta + select + modal */}
            <div style={{ marginTop: 16 }}>
              <label style={labelStyle}>
                Desea registrar información de contacto y/o dirección actualizada?
              </label>

              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <select
                  style={{ ...inputStyle, maxWidth: 220 }}
                  value={deseaActualizar}
                  onChange={(e) => onChangeDeseaActualizar(e.target.value as "NO" | "SI")}
                >
                  <option value="NO">No</option>
                  <option value="SI">Sí</option>
                </select>

                {deseaActualizar === "SI" && (
                  <button style={{ ...btnPrimary, margin: 0 }} onClick={openModalPrefill}>
                    Ver Información actualizada
                  </button>
                )}

                {deseaActualizar === "SI" && hayDatosActualizadosGuardados && (
                  <span style={{ ...helpStyle, fontWeight: 700 }}>
                    (Información actualizada guardada)
                  </span>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ================= RESULTADO (sin legend repetido, select angosto, conclusiones) ================= */}
      <div style={card}>
        <div style={sectionTitle}>Resultado</div>

        <div style={{ display: "grid", gap: 10 }}>
          <div>
            <label style={labelStyle}>Resultado</label>
            <select
              style={{ ...inputStyle, maxWidth: 320 }} // ✅ no 100%
              value={resultado}
              onChange={(e) => setResultado(e.target.value as any)}
            >
              <option>PRODUCTIVO</option>
              <option>IMPRODUCTIVO</option>
              <option>PRESENTACIÓN VOLUNTARIA</option>
            </select>
          </div>

          <div>
            <label style={labelStyle}>Conclusiones</label>
            <textarea
              rows={5}
              style={inputStyle}
              value={conclusiones}
              onChange={(e) => setConclusiones(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* ================= ALCANCE ================= */}
      <div style={card}>
        <div style={sectionTitle}>Alcance</div>

        {!hasAnyTable && (
          <div style={{ marginBottom: 10, color: "#666" }}>
            Seleccione un <b>Impuesto</b> y un rango de <b>Períodos</b>, luego presione <b>Agregar</b>{" "}
            para mostrar la tabla.
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
          <label style={{ fontWeight: 800 }}>
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

          <label style={{ fontWeight: 800 }}>
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

          <label style={{ fontWeight: 800 }}>
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
                    <div style={{ fontWeight: 900 }}>
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
      </div>

      {/* ================= WORD: Descargar + Subir ================= */}
      <div style={card}>
        <div style={sectionTitle}>Documento Word</div>

        <button style={btnSecondary} onClick={descargarWord}>
          Descargar en Word
        </button>

        <div style={{ marginTop: 10 }}>
          <label style={labelStyle}>Subir documento completado</label>
          <input
            type="file"
            accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              setUploadedWord(f);
              if (f) alert(`Archivo cargado (demo): ${f.name}`);
            }}
          />
          <div style={{ marginTop: 6, ...helpStyle }}>
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
