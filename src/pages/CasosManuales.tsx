// src/components/CasosManueales.tsx
import React, { useMemo, useState } from "react";
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  Button,
  Typography,
} from "@mui/material";
import dayjs from "dayjs";
import Swal from "sweetalert2";
import { CASOS_KEY, notifyAprobaciones } from "../lib/aprobacionesStorage";

type CasoBase = {
  id: number | string;
  nombre: string;
  ruc: string;
  categoria?: string;
  metaCategoria?: string;
  [k: string]: any;
};

type Props = {
  /** Categoría que estás trabajando (la que se está buscando) */
  categoria: string;
  /** Casos aprobados reales que vienen de Verificación/Aprobación */
  baseRows?: CasoBase[];
  /** Cantidad mock si no hay baseRows (opcional) */
  cantidad?: number;
  /** Lista de auditores (opcional) */
  auditores?: string[];
  /** Callback al presionar REGRESAR (opcional) */
  onRegresar?: () => void;
  /** Callback al asignar un row (opcional) */
  onAsignarRow?: (row: any) => void;
};

type Fila = {
  id: number | string;
  categoria: string;
  nombre: string;
  ruc: string;
  fecha: string;
  auditor?: string;   // seleccionado en el combo
  asignado?: boolean; // si ya está asignado
};

function readStorageArray(): any[] {
  try {
    const raw = localStorage.getItem(CASOS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export const CasosManueales: React.FC<Props> = ({
  categoria,
  baseRows,
  cantidad = 0,
  auditores = ["Auditor 1", "Auditor 2", "Auditor 3"],
  onRegresar,
  onAsignarRow,
}) => {
  /** Mapa rápido de asignaciones existentes en storage (por id/ruc) */
  const storageMap = useMemo(() => {
    const arr = readStorageArray();
    const map = new Map<string, any>();
    for (const it of arr) {
      if (it?.id != null) map.set(`id:${String(it.id)}`, it);
      if (it?.ruc) map.set(`ruc:${String(it.ruc)}`, it);
    }
    return map;
  }, []);

  /** Construye filas desde datos reales (baseRows) o genera mocks si no hay */
  const filasIniciales: Fila[] = useMemo(() => {
    const hoy = dayjs();

    // Prioriza filas reales
    if (baseRows && baseRows.length > 0) {
      return baseRows.map((b, idx) => {
        const keyId = `id:${String(b.id)}`;
        const keyRuc = b.ruc ? `ruc:${String(b.ruc)}` : "";
        const stored = storageMap.get(keyId) ?? (keyRuc ? storageMap.get(keyRuc) : undefined);

        const asignado = Boolean(stored?.asignado === true);
        const auditorGuardado = stored?.auditorAsignado ?? stored?.auditor ?? "";

        return {
          id: b.id,
          categoria: categoria || b.metaCategoria || b.categoria || "",
          nombre: b.nombre,
          ruc: b.ruc,
          fecha: hoy.add(idx % 6, "day").format("DD/MM/YY"),
          auditor: asignado ? auditorGuardado : "",
          asignado,
        };
      });
    }

    // Fallback mock:
    const out: Fila[] = [];
    for (let i = 1; i <= Math.max(0, cantidad || 0); i++) {
      const suf = String(100 + i).slice(-3);
      const ruc = `1${suf}${suf}-${(i % 9) + 1}${suf}-${String(100000 + i).slice(-6)}`;
      out.push({
        id: i,
        categoria,
        nombre: `Contribuyente ${i}`,
        ruc,
        fecha: hoy.add(i % 6, "day").format("DD/MM/YY"),
        auditor: "",
        asignado: false,
      });
    }
    return out;
  }, [baseRows, cantidad, categoria, storageMap]);

  const [filas, setFilas] = useState<Fila[]>(filasIniciales);

  const handleChangeAuditor = (id: number | string, value: string) => {
    setFilas(prev => prev.map(f => (f.id === id ? { ...f, auditor: value } : f)));
  };

  const handleAsignar = async (row: Fila) => {
    if (!row.auditor) {
      await Swal.fire({
        icon: "info",
        title: "Selecciona un auditor",
        text: "Debes elegir un auditor antes de asignar.",
        confirmButtonText: "Ok",
      });
      return;
    }

    const reasignando = Boolean(row.asignado);

    // ✅ Confirmación (considera si es re-asignación)
    const { isConfirmed } = await Swal.fire({
      icon: "question",
      title: reasignando ? "¿Reasignar caso?" : "¿Confirmar asignación?",
      html: `<b>${row.nombre}</b><br/>RUC: ${row.ruc}<br/>Auditor: <b>${row.auditor}</b>`,
      showCancelButton: true,
      confirmButtonText: reasignando ? "Sí, reasignar" : "Sí, asignar",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
      focusCancel: true,
    });
    if (!isConfirmed) return;

    // UI local (marcamos asignado y dejamos auditor seleccionado)
    const asignada = { ...row, asignado: true };
    setFilas(prev => prev.map(f => (f.id === row.id ? asignada : f)));
    onAsignarRow?.(asignada);

    // 🔐 Persistir en localStorage y notificar
    try {
      const arr = readStorageArray();

      // Buscar por id o ruc
      const idx = arr.findIndex(
        (x) =>
          String(x?.id) === String(row.id) ||
          (x?.ruc && String(x.ruc) === String(row.ruc))
      );

      const payloadUpdate = {
        categoria,
        metaCategoria: categoria,
        auditor: row.auditor,
        auditorAsignado: row.auditor,
        fechaAsignacion: dayjs().format("YYYY-MM-DD"),
        asignado: true,
      };

      if (idx >= 0) {
        arr[idx] = { ...arr[idx], ...payloadUpdate };
      } else {
        arr.push({
          id: row.id,
          ruc: row.ruc,
          nombre: row.nombre,
          ...payloadUpdate,
        });
      }

      localStorage.setItem(CASOS_KEY, JSON.stringify(arr));
      notifyAprobaciones(); // 🔔 refresca pantallas que escuchen el evento
    } catch {
      // no romper UX si el storage falla
    }

    // 🎉 Éxito (sin ocultar la tabla, para permitir re-asignar si se quiere)
    await Swal.fire({
      icon: "success",
      title: reasignando ? "Reasignado" : "Asignado",
      text: reasignando
        ? "El caso fue reasignado correctamente."
        : "El caso fue asignado correctamente.",
      confirmButtonText: "Listo",
    });
  };

  return (
    <Box mt={4}>
      {/* Encabezado de Categoría (sin color de fila) */}
      <Box
        mb={2}
        display="inline-flex"
        alignItems="center"
        gap={2}
        sx={{ border: "1px solid #cfd8dc", p: 1.2, borderRadius: 1, backgroundColor: "#eef3f8" }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: "bold", color: "#455a64" }}>
          CATEGORÍA
        </Typography>
        <Typography variant="subtitle2">{categoria}</Typography>
      </Box>

      <TableContainer component={Paper} sx={{ border: "1px solid #b0bec5", width: "auto" }}>
        <Table>
          <TableHead>
            {/* ❌ Encabezado sin color especial */}
            <TableRow>
              <TableCell sx={{ fontWeight: "bold", border: "1px solid #b0bec5" }}>Categoría</TableCell>
              <TableCell sx={{ fontWeight: "bold", border: "1px solid #b0bec5" }}>Nombre o Razón Social</TableCell>
              <TableCell sx={{ fontWeight: "bold", border: "1px solid #b0bec5" }}>RUC</TableCell>
              <TableCell sx={{ fontWeight: "bold", border: "1px solid #b0bec5" }}>Fecha</TableCell>
              <TableCell sx={{ fontWeight: "bold", border: "1px solid #b0bec5" }} align="center">Auditor</TableCell>
              <TableCell sx={{ fontWeight: "bold", border: "1px solid #b0bec5" }} align="center">Acción</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {filas.map((row) => (
              <TableRow key={row.id}>
                <TableCell sx={{ border: "1px solid #b0bec5" }}>{row.categoria}</TableCell>
                <TableCell sx={{ border: "1px solid #b0bec5" }}>{row.nombre}</TableCell>
                <TableCell sx={{ border: "1px solid #b0bec5" }}>{row.ruc}</TableCell>
                <TableCell sx={{ border: "1px solid #b0bec5" }}>{row.fecha}</TableCell>

                {/* Auditor (Select) - SIEMPRE HABILITADO */}
                <TableCell sx={{ border: "1px solid #b0bec5" }} align="center">
                  <Select
                    size="small"
                    value={row.auditor ?? ""}
                    onChange={(e) => handleChangeAuditor(row.id, String(e.target.value))}
                    sx={{ minWidth: 150 }}
                  >
                    {auditores.map((a) => (
                      <MenuItem key={a} value={a}>{a}</MenuItem>
                    ))}
                  </Select>
                </TableCell>

                {/* Acción - SIEMPRE HABILITADA (permite re-asignar) */}
                <TableCell sx={{ border: "1px solid #b0bec5" }} align="center">
                  <Button variant="contained" onClick={() => handleAsignar(row)}>
                    {row.asignado ? "REASIGNAR" : "ASIGNAR"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>

        </Table>
      </TableContainer>

      <Box mt={2}>
        <Button variant="contained" onClick={onRegresar}>
          REGRESAR
        </Button>
      </Box>
    </Box>
  );
};
