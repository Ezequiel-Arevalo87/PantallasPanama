import React, { useState } from "react";

type DocumentoAsociado = {
  numero: string;
  nombre: string;
  actividad: string;
  estado: string;
  fecha: string;
  usuario: string;
};

type FormularioCrear = {
  codigo: string;
  nombre: string;
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
  padding: "8px 12px",
  margin: "5px",
  border: "none",
  cursor: "pointer",
  borderRadius: 5,
  fontWeight: 600,
};

const btnPrimary: React.CSSProperties = {
  ...btnBase,
  background: "#007bff",
  color: "#fff",
};

const btnSecondary: React.CSSProperties = {
  ...btnBase,
  background: "#6c757d",
  color: "#fff",
};

export const Tramite: React.FC = () => {
  const [nota, setNota] = useState("");

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

  const formulariosCrear: FormularioCrear[] = [
    { codigo: "706", nombre: "INFORME FINAL AUDITORIA" },
    { codigo: "720", nombre: "AUTO DE ARCHIVO" },
    {
      codigo: "725",
      nombre: "REQUERIMIENTO DE REGULARIZACIÓN (CONTROL EXTENSIVO)",
    },
  ];

  const crearFormulario = (codigo: string) => {
    alert(`Crear formulario código ${codigo} (pendiente integración)`);
    // aquí luego navegas o abres el componente correspondiente
  };

  const guardar = () => {
    alert("Nota guardada (demo)");
  };

  const limpiar = () => {
    setNota("");
  };

  const enviar = () => {
    const ok = window.confirm("¿Está seguro que desea enviar el trámite?");
    if (!ok) return;

    alert("Trámite enviado (demo)");
  };

  return (
    <div style={{ fontFamily: "Arial, sans-serif", margin: 20 }}>
      <h1>Pantalla BPM - Gestión de la Actividad</h1>

      {/* ================= DATOS GENERALES ================= */}
      <h2>Datos Generales del Proceso</h2>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <tbody>
          <tr>
            <td style={tdStyle}>Número de Trámite: <b>675000001027</b></td>
            <td style={tdStyle}>Red: <b>Control Extensivo v2</b></td>
            <td style={tdStyle}>
              Actividad: <b>2 - Análisis Auditor Control Extensivo</b>
            </td>
          </tr>
          <tr>
            <td style={tdStyle}>Estado del Trámite: <b>ASIGNADO</b></td>
            <td style={tdStyle}>Fecha de Inicio: <b>17/02/2025</b></td>
            <td style={tdStyle}>
              Usuario de Gestión: <b>ZULEIMA ISABEL MORAN</b>
            </td>
          </tr>
          <tr>
            <td style={tdStyle}>RUC: <b>987654321-2-2021</b></td>
            <td style={tdStyle}>
              Contribuyente: <b>TRANSPORTES Y SERVICIOS LOGISTICOS S A</b>
            </td>
            <td style={tdStyle}>
              Ubicación Expediente Físico:
              <b> SECCIÓN DE CONTROL DE SERVICIO AL CONTRIBUYENTE</b>
            </td>
          </tr>
        </tbody>
      </table>

      {/* ================= DOCUMENTOS ASOCIADOS ================= */}
      <h2>Documentos Asociados</h2>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={thStyle} colSpan={6}>
              Lista de documentos asociados al proceso
            </th>
          </tr>
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

      {/* ================= GESTIÓN DE DOCUMENTOS ================= */}
      <h2>Gestión de Documentos</h2>

      {/* Crear */}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={thStyle} colSpan={3}>
              Lista de formularios para creación
            </th>
          </tr>
          <tr>
            <th style={thStyle}>Crear</th>
            <th style={thStyle}>Código</th>
            <th style={thStyle}>Nombre</th>
          </tr>
        </thead>
        <tbody>
          {formulariosCrear.map((f) => (
            <tr key={f.codigo}>
              <td style={tdStyle}>
                <button
                  style={btnPrimary}
                  onClick={() => crearFormulario(f.codigo)}
                >
                  Crear
                </button>
              </td>
              <td style={tdStyle}>{f.codigo}</td>
              <td style={tdStyle}>{f.nombre}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Gestión */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginTop: 15,
        }}
      >
        <thead>
          <tr>
            <th style={thStyle} colSpan={7}>
              Lista de formularios para gestión
            </th>
          </tr>
          <tr>
            <th style={thStyle}>Editar</th>
            <th style={thStyle}>Aprobar</th>
            <th style={thStyle}>Eliminar</th>
            <th style={thStyle}>Número</th>
            <th style={thStyle}>Nombre</th>
            <th style={thStyle}>Estado</th>
            <th style={thStyle}>Fecha</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={tdStyle} colSpan={7} align="center">
              No hay formularios pendientes de gestión
            </td>
          </tr>
        </tbody>
      </table>

      {/* ================= NOTA ================= */}
      <h2>Nota</h2>
      <textarea
        rows={4}
        style={{ width: "100%", padding: 8 }}
        value={nota}
        onChange={(e) => setNota(e.target.value)}
      />

      {/* ================= BOTONES ================= */}
      <div style={{ marginTop: 15 }}>
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
