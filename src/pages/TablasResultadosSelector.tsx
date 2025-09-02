import React, { useMemo, useState } from 'react';
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Grid, Divider,
  Stack
} from '@mui/material';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

type Props = {
  estado: string;
  categoria: string;
  tipologia: string;
  programa?: string; // 👈 NUEVO (para el encabezado del detalle)
};

export const TablasResultadosSelector: React.FC<Props> = ({ estado, categoria, tipologia, programa }) => {
  console.log('ver tipo', tipologia)
  const mostrarOmiso = estado === 'omiso' || estado === 'Todos';
  const mostrarInexacto = estado === 'inexacto' || estado === 'Todos';
  const mostrarExtemporaneo = estado === 'Extemporáneo' || estado === 'Todos';

  const exportarExcel = (nombreArchivo: string, datos: any[], columnas: string[]) => {
    const worksheet = XLSX.utils.json_to_sheet(datos, { header: columnas });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, `${nombreArchivo}.xlsx`);
  };

  return (
    <Box mt={4}>
      {mostrarOmiso && (
        <Box mb={4}>
          <Typography variant="h6" color="error">OMISOS</Typography>
          <TablaOmisos categoria={categoria} tipologia={tipologia}  programa={programa}  onExport={exportarExcel} />
        </Box>
      )}

      {mostrarInexacto && (
        <Box mb={4}>
          <Typography variant="h6" color="success.main">INEXACTOS</Typography>
          <TablaInexactos categoria={categoria} onExport={exportarExcel} />
        </Box>
      )}

      {mostrarExtemporaneo && (
        <Box mb={4}>
          <Typography variant="h6" color="warning.main">EXTEMPORÁNEO</Typography>
          <TablaExtemporaneo categoria={categoria} onExport={exportarExcel} />
        </Box>
      )}
    </Box>
  );
};


type TablaPropsBase = {
  categoria: string;
  onExport: (nombre: string, data: any[], columns: string[]) => void;
};
type TablaOmisosProps = TablaPropsBase & { programa?: string; tipologia?: string };

type OmisoFila = {
  ruc: string;
  nombre: string;
  valoresPorPeriodo: Record<string, number>; // ej: { 'ene-23': 120000, ... }
};

const MONEDA = new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0 });

const OMISOS_MOCK: OmisoFila[] = [
  {
    ruc: '123-456-789',
    nombre: 'xyz',
    valoresPorPeriodo: { 'ene-23': 120000, 'feb-23': 80000, 'mar-23': 50000, 'abr-23': 25000, 'may-23': 35000, 'jun-23': 190000 }
  },
  {
    ruc: '789-456-123',
    nombre: 'abc',
    valoresPorPeriodo: { 'ene-23': 100000, 'feb-23': 90000, 'mar-23': 80000, 'abr-23': 70000, 'may-23': 60000 }
  },
  {
    ruc: '456-456-123',
    nombre: 'def',
    valoresPorPeriodo: { 'mar-23': 150000, 'abr-23': 120000, 'may-23': 80000, 'jun-23': 0 }
  },
  {
    ruc: '789-012-345',
    nombre: 'klm',
    valoresPorPeriodo: { 'ene-23': 40000, 'feb-23': 50000, 'may-23': 60000, 'jun-23': 100000, 'jul-23': 0, 'ago-23': 0, 'sep-23': 0, 'oct-23': 0 }
  }
];

const totalDeFila = (f: OmisoFila) =>
  Object.values(f.valoresPorPeriodo).reduce((acc, v) => acc + (Number(v) || 0), 0);

const TablaOmisos: React.FC<TablaOmisosProps> = ({ categoria, programa, tipologia,  onExport }) => {
  const filas = OMISOS_MOCK.map(f => ({
    ...f,
    cantidad: Object.entries(f.valoresPorPeriodo).filter(([_, v]) => (Number(v) || 0) > 0).length,
    total: totalDeFila(f)
  }));

  const [abierto, setAbierto] = useState(false);
  const [seleccion, setSeleccion] = useState<OmisoFila | null>(null);

  const abrirDetalle = (f: OmisoFila) => {
    setSeleccion(f);
    setAbierto(true);
  };


  const handleExport = () => {
    const columnas = ['RUC', 'Nombre', 'Cantidad periodos omitidos', 'Valor total periodos omitidos'];
    const data = filas.map(f => ({
      RUC: f.ruc,
      Nombre: f.nombre,
      'Cantidad periodos omitidos': f.cantidad,
      'Valor total periodos omitidos': f.total
    }));
    onExport('Omisos', data, columnas);
  };



  return (
    <Box>
      <Box display="flex" justifyContent="flex-end" mb={1}>
        <Button variant="outlined" onClick={handleExport}>DESCARGAR EXCEL</Button>
      </Box>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>RUC</TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell align="right">Cantidad períodos omitidos</TableCell>
              <TableCell align="right">Valor total períodos omitidos</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filas.map((f) => (
              <TableRow key={f.ruc} hover>
                <TableCell>{f.ruc}</TableCell>
                <TableCell>{f.nombre}</TableCell>
                <TableCell align="right">{f.cantidad}</TableCell>
                <TableCell align="right">{MONEDA.format(f.total)}</TableCell>
                <TableCell align="center">
                  <Button size="small" variant="contained" onClick={() => abrirDetalle(f)}>Detalle</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
<DetalleOmisosModal
  open={abierto}
  onClose={() => setAbierto(false)}
  categoria={categoria}
  programa={programa}
  tipologia={tipologia}   // 👈 ahora sí viaja al modal
  fila={seleccion}
/>
    </Box>
  );
};

type DetalleProps = {
  open: boolean;
  onClose: () => void;
  categoria: string;
  programa?: string;
  tipologia?: string;
  fila: OmisoFila | null;
};

const DetalleOmisosModal: React.FC<DetalleProps> = ({ open, onClose, categoria, tipologia, programa, fila }) => {
  const periodosOrdenados = useMemo(() => {
    if (!fila) return [];
    return Object.keys(fila.valoresPorPeriodo); // mantener orden recibido
  }, [fila]);

  const total = useMemo(() => (fila ? totalDeFila(fila) : 0), [fila]);



  const handleExportExcel = () => {
    if (!fila) return;

console.log({tipologia})
const meta = [
  ['Detalle de períodos omitidos'],
  [],
  ['Categoría', categoria],
  ['Inconsistencia', 'Omisos'],
  [programa ? 'Programa' : 'Grupo de impuesto', programa || (tipologia ?? '—')], // 👈 usar tipología si no hay programa
  ['RUC', fila.ruc],
  ['Nombre', fila.nombre],
  [],
  ['Cantidad periodos omitidos'],
];

    // Tabla (periodos + total) con valores numéricos crudos
    const headers = [...periodosOrdenados, 'Total'];
    const row = [
      ...periodosOrdenados.map(p => Number(fila.valoresPorPeriodo[p] ?? 0)),
      Number(total),
    ];

    const aoa = [...meta, headers, row];

    const ws = XLSX.utils.aoa_to_sheet(aoa);

    // Ancho de columnas aproximado
    const colCount = Math.max(...aoa.map(r => r.length));
    ws['!cols'] = Array.from({ length: colCount }, (_, i) => {
      const maxLen = aoa.reduce((m, r) => Math.max(m, (r[i]?.toString()?.length ?? 0)), 0);
      return { wch: Math.min(Math.max(12, maxLen + 2), 40) };
    });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Detalle');

    const ts = new Date().toISOString().slice(0, 16).replace(':', '').replace('T', '_');
    const fileName = `Detalle_omisiones_${fila.ruc}_${ts}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  return (
    <Dialog fullWidth maxWidth="md" open={open} onClose={onClose}>
      <DialogTitle>Detalle de períodos omitidos</DialogTitle>
      <DialogContent dividers>
        {fila && (
          <>
            {/* Encabezado */}
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} md={4}>
                <Paper variant="outlined" sx={{ p: 1.5 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>Categoría</Typography>
                  <Typography>{categoria}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper variant="outlined" sx={{ p: 1.5 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>Inconsistencia</Typography>
                  <Typography>Omisos</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper variant="outlined" sx={{ p: 1.5 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>
                    {programa ? 'Programa' : 'Grupo de impuesto'}
                  </Typography>
                  <Typography>{programa || tipologia}</Typography>
                </Paper>
              </Grid>
            </Grid>

            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 1.5 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>RUC</Typography>
                  <Typography>{fila.ruc}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 1.5 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>Nombre</Typography>
                  <Typography>{fila.nombre}</Typography>
                </Paper>
              </Grid>
            </Grid>

            <Typography sx={{ fontWeight: 700, mb: 1 }}>Cantidad periodos omitidos</Typography>

            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {periodosOrdenados.map((p) => (
                      <TableCell key={p} align="right">{p}</TableCell>
                    ))}
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    {periodosOrdenados.map((p) => (
                      <TableCell key={p} align="right">
                        {MONEDA.format(fila.valoresPorPeriodo[p] || 0)}
                      </TableCell>
                    ))}
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      {MONEDA.format(total)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>

            <Divider sx={{ my: 2 }} />

            <Box>
              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Button onClick={handleExportExcel} variant="outlined">
                  Descargar Excel
                </Button>
                <Button onClick={onClose} variant="contained">
                  Cerrar
                </Button>
              </Stack>
            </Box>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};


/* ---------------- Inexactos & Extemporáneo (sin cambios de UI) ---------------- */

const TablaInexactos: React.FC<TablaPropsBase> = ({ categoria, onExport }) => {
  const datos = [{
    Categoria: categoria, RUC: 'Individual', Nombre: 'individual',
    TipoImpuesto: '', ValorImpuesto: '$', Inconsistencias: 'Observación', ValorInconsistencia: ''
  }];
  const columnas = ['Categoria', 'RUC', 'Nombre', 'TipoImpuesto', 'ValorImpuesto', 'Inconsistencias', 'ValorInconsistencia'];

  return (
    <Box>
      <Box display="flex" justifyContent="flex-end" mb={1}>
        <Button variant="outlined" sx={{ mb: 1 }} onClick={() => onExport('Inexactos', datos, columnas)}>
          DESCARGAR EXCEL
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Categoría</TableCell>
              <TableCell>RUC</TableCell>
              <TableCell>Nombre o Razón Social</TableCell>
              <TableCell>Tipo de impuesto</TableCell>
              <TableCell>Valor Impuesto</TableCell>
              <TableCell>Inconsistencias</TableCell>
              <TableCell>Valor Inconsistencia</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>{categoria}</TableCell>
              <TableCell>Individual</TableCell>
              <TableCell>individual</TableCell>
              <TableCell></TableCell>
              <TableCell>$</TableCell>
              <TableCell>Observación</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

const TablaExtemporaneo: React.FC<TablaPropsBase> = ({ categoria, onExport }) => {
  const datos = [{ Categoria: categoria, RUC: 'Individual', Nombre: 'individual', Dias: '-1' }];
  const columnas = ['Categoria', 'RUC', 'Nombre', 'Dias'];

  return (
    <Box>
      <Box display="flex" justifyContent="flex-end" mb={1}>
        <Button variant="outlined" sx={{ mb: 1 }} onClick={() => onExport('Extemporaneo', datos, columnas)}>
          DESCARGAR EXCEL
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Categoría</TableCell>
              <TableCell>RUC</TableCell>
              <TableCell>Nombre o Razón Social</TableCell>
              <TableCell>Número de días (hasta presentación)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>{categoria}</TableCell>
              <TableCell>Individual</TableCell>
              <TableCell>individual</TableCell>
              <TableCell>-1</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};
