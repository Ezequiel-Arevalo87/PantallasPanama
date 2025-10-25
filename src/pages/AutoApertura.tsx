// src/components/AutoApertura.tsx
import React, { useEffect, useState, useCallback } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
} from '@mui/material';
import jsPDF from 'jspdf';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { CASOS_KEY } from '../lib/aprobacionesStorage';
import Trazabilidad, { type TrazaItem } from '../components/Trazabilidad';

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
  trazas?: TrazaItem[];
};

type RowDisplay = {
  categoria: string;
  nombre: string;
  ruc: string;
  fecha: string;
  trazas: TrazaItem[];
};

interface Props {
  /** Resultado de la consulta (fallback si no hay aprobados en localStorage) */
  data?: RowDisplay[];
}

/* Mock de trazas por si no vienen desde storage/props */
const mockTrazas = (ruc: string): TrazaItem[] => [
  { id: `${ruc}-1`, fechaISO: new Date(Date.now() - 86400000 * 5).toISOString(), actor: 'Supervisor', accion: 'Revisión', estado: 'PENDIENTE' },
  { id: `${ruc}-2`, fechaISO: new Date(Date.now() - 86400000 * 2).toISOString(), actor: 'Auditor', accion: 'Asignación', estado: 'ASIGNADO' },
  { id: `${ruc}-3`, fechaISO: new Date().toISOString(), actor: 'Sistema', accion: 'Aprobación', estado: 'APROBADO' },
];

export const AutoApertura: React.FC<Props> = ({ data = [] }) => {
  const [seleccionados, setSeleccionados] = useState<number[]>([]);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [rows, setRows] = useState<RowDisplay[]>([]);

  // modal de trazabilidad
  const [trazasOpen, setTrazasOpen] = useState(false);
  const [trazasIndex, setTrazasIndex] = useState<number | null>(null);

  /** -------- Helpers: transformar storage -> filas de tabla -------- */
  const mapFromStorage = (items: RowAprobaciones[]): RowDisplay[] =>
    items
      .filter((r) => (r.estado ?? 'Pendiente') === 'Aprobado')
      .map<RowDisplay>((r) => ({
        categoria: r.metaCategoria ?? r.categoria ?? '—',
        nombre: r.nombre ?? '—',
        ruc: r.ruc ?? '—',
        fecha: 'dd/mm/aa', // placeholder como en tu UI
        trazas: r.trazas ?? mockTrazas(r.ruc ?? ''),
      }));

  const loadRows = useCallback(() => {
    try {
      const raw = localStorage.getItem(CASOS_KEY);
      const parsed: RowAprobaciones[] = raw ? JSON.parse(raw) : [];
      const fromStorage = mapFromStorage(parsed);

      if (fromStorage.length > 0) {
        setRows(fromStorage);
      } else {
        // Fallback a lo que llega por props (si trae trazas, las respetamos; si no, mock)
        const withTrazas = (data || []).map((d) => ({
          ...d,
          trazas: d.trazas ?? mockTrazas(d.ruc),
        }));
        setRows(withTrazas);
      }
      setSeleccionados([]);
    } catch {
      const withTrazas = (data || []).map((d) => ({
        ...d,
        trazas: d.trazas ?? mockTrazas(d.ruc),
      }));
      setRows(withTrazas);
      setSeleccionados([]);
    }
  }, [data]);

  /** Carga inicial y suscripción a cambios */
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

  /** -------- PDF: Generar Auto de Apertura -------- */
  const generarPDF = (index: number) => {
    const doc = new jsPDF();
    const numero = (index + 1).toString().padStart(4, '0');
    const r = rows[index];

    doc.text(`Auto de apertura ${numero}`, 20, 20);
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

  /** -------- Trazabilidad -------- */
  const abrirTrazas = (index: number) => {
    setTrazasIndex(index);
    setTrazasOpen(true);
  };
  const cerrarTrazas = () => {
    setTrazasOpen(false);
    setTrazasIndex(null);
  };

  /** -------- Render -------- */
  const hayFilas = rows.length > 0;
  const currentTrazas = trazasIndex != null ? rows[trazasIndex]?.trazas ?? [] : [];

  return (
    <Box mt={3}>
      <Typography variant="h6" align="center">
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
                    <Stack direction="row" spacing={1}>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => generarPDF(index)}
                      >
                        Generar Auto de Apertura
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={() => abrirTrazas(index)}
                      >
                        Trazabilidad
                      </Button>
                    </Stack>
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

      {/* Modal de Trazabilidad */}
      <Dialog open={trazasOpen} onClose={cerrarTrazas} maxWidth="md" fullWidth>
        <DialogTitle>Trazabilidad del caso</DialogTitle>
        <DialogContent dividers>
          <Trazabilidad rows={currentTrazas} height={420} />
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={cerrarTrazas}>CERRAR</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AutoApertura;
