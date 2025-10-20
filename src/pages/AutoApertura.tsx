// src/components/AutoApertura.tsx
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Typography,
  Paper,
  Checkbox,
} from '@mui/material';
import jsPDF from 'jspdf';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { CASOS_KEY } from '../lib/aprobacionesStorage';

type RowAprobaciones = {
  id: number | string;
  categoria: string;
  ruc: string;
  nombre: string;
  periodos: string;
  valor?: number | string | null;
  monto?: number | string | null;
  total?: number | string | null;
  estado?: 'Pendiente' | 'Aprobado';
  // meta (opcionales)
  metaCategoria?: string;
  metaInconsistencia?: string;
  metaPrograma?: string | null;
  metaActividadEconomica?: string[];
  metaPeriodoInicial?: string | null;
  metaPeriodoFinal?: string | null;
};

type RowDisplay = {
  categoria: string;
  nombre: string;
  ruc: string;
  fecha: string;
  accion: string;
};

interface Props {
  /** Resultado de la consulta (se mantiene). Se usa si no hay aprobados en localStorage */
  data?: RowDisplay[];
}

export const AutoApertura: React.FC<Props> = ({ data = [] }) => {
  const [seleccionados, setSeleccionados] = useState<number[]>([]);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [rows, setRows] = useState<RowDisplay[]>([]);

  /** -------- Helpers: transformar storage -> filas de tabla -------- */
  const mapFromStorage = (items: RowAprobaciones[]): RowDisplay[] => {
    // Solo los aprobados y con campos mínimos
    return items
      .filter((r) => (r.estado ?? 'Pendiente') === 'Aprobado')
      .map<RowDisplay>((r) => ({
        categoria: r.metaCategoria ?? r.categoria ?? '—',
        nombre: r.nombre ?? '—',
        ruc: r.ruc ?? '—',
        // La fecha no viene del storage. Mostramos placeholder como en tu UI.
        fecha: 'dd/mm/aa',
        accion: 'Generar Auto de Apertura',
      }));
  };

  const loadRows = useCallback(() => {
    try {
      const raw = localStorage.getItem(CASOS_KEY);
      const parsed: RowAprobaciones[] = raw ? JSON.parse(raw) : [];
      const fromStorage = mapFromStorage(parsed);

      if (fromStorage.length > 0) {
        setRows(fromStorage);
      } else {
        // Fallback a lo que llega por consulta
        setRows(data);
      }
      // Reset selección cuando cambia el origen
      setSeleccionados([]);
    } catch {
      // Si algo falla, usa la consulta
      setRows(data);
      setSeleccionados([]);
    }
  }, [data]);

  /** Carga inicial y suscripción a cambios (storage + evento custom) */
  useEffect(() => {
    loadRows();
  }, [loadRows]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === CASOS_KEY) loadRows();
    };
    const onCustom = () => loadRows();

    window.addEventListener('storage', onStorage);
    window.addEventListener('casosAprobacion:update', onCustom);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('casosAprobacion:update', onCustom);
    };
  }, [loadRows]);

  /** -------- PDF -------- */
  const generarPDF = (index: number) => {
    const doc = new jsPDF();
    const numero = (index + 1).toString().padStart(4, '0');
    doc.text(`Auto de apertura ${numero}`, 20, 20);

    const r = rows[index];
    doc.text(`Categoría: ${r.categoria}`, 20, 32);
    doc.text(`Nombre: ${r.nombre}`, 20, 40);
    doc.text(`RUC: ${r.ruc}`, 20, 48);
    doc.save(`auto_apertura_${numero}.pdf`);
  };

  /** -------- Selección y continuar -------- */
  const handleCheckboxChange = (index: number) => {
    setSeleccionados((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const handleContinuar = () => {
    const categoriasSeleccionadas = seleccionados.map((i) => rows[i].categoria);
    setMensaje(
      `Apertura realizada con éxito. Categorías: ${categoriasSeleccionadas.join(', ')}`
    );
    setTimeout(() => setMensaje(null), 4000);
  };

  /** -------- Render -------- */
  const hayFilas = rows.length > 0;

  return (
    <Box mt={3}>
      <Typography variant="h6"  align="center">
        AUTO DE APERTURA 
      </Typography>

      <TableContainer component={Paper} sx={{ mt: 1 }}>
        <Table>
          <TableHead>
            <TableRow style={{ backgroundColor: '#f1eee3ff' }}>
              <TableCell width={48}></TableCell>
              <TableCell>Categoría</TableCell>
              <TableCell>Nombre o Razón Social</TableCell>
              <TableCell>RUC</TableCell>
              <TableCell>Fecha</TableCell>
              <TableCell>Acción</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {hayFilas ? (
              rows.map((row, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Checkbox
                      checked={seleccionados.includes(index)}
                      onChange={() => handleCheckboxChange(index)}
                    />
                  </TableCell>
                  <TableCell>{row.categoria}</TableCell>
                  <TableCell>{row.nombre}</TableCell>
                  <TableCell>{row.ruc}</TableCell>
                  <TableCell>{row.fecha || 'dd/mm/aa'}</TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => generarPDF(index)}
                    >
                      {row.accion || 'Generar Auto de Apertura'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6}>
                  <Typography align="center" color="text.secondary">
                    No hay casos aprobados en Aprobaciones. Realiza una consulta o aprueba casos para verlos aquí.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box display="flex" justifyContent="center" mt={2}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleContinuar}
          disabled={seleccionados.length === 0}
        >
          CONTINUAR
        </Button>
      </Box>

      {mensaje && (
        <Box display="flex" alignItems="center" mt={2} mb={2} color="green">
          <CheckCircleIcon sx={{ mr: 1 }} />
          <Typography fontWeight="bold">{mensaje}</Typography>
        </Box>
      )}
    </Box>
  );
};
