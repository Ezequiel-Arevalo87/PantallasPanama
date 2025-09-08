import React, { useMemo, useState } from 'react';
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Grid, Divider,
  Stack, Tooltip
} from '@mui/material';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

type Props = {
  estado: string;
  categoria: string;
  tipologia: string;
  programa?: string;
};

export const TablasResultadosSelector: React.FC<Props> = ({ estado, categoria, tipologia, programa }) => {
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
          <TablaOmisos categoria={categoria} tipologia={tipologia} programa={programa} onExport={exportarExcel} />
        </Box>
      )}

      {mostrarInexacto && (
        <Box mb={4}>
          <Typography variant="h6" color="success.main">INEXACTOS</Typography>
          <TablaInexactos categoria={categoria} tipologia={tipologia} programa={programa} onExport={exportarExcel} />
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

/* -------------------------- Tipos y mocks -------------------------- */
type TablaPropsBase = {
  categoria: string;
  onExport: (nombre: string, data: any[], columns: string[]) => void;
};
type TablaOmisosProps = TablaPropsBase & { programa?: string; tipologia?: string };
type TablaInexactosProps = TablaPropsBase & { programa?: string; tipologia?: string };

type FilaBase = {
  ruc: string;
  nombre: string;
  valoresPorPeriodo: Record<string, number>;
};

const MONEDA = new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0 });

const OMISOS_MOCK: FilaBase[] = [
  { ruc: '123456', nombre: 'compañía xyz', valoresPorPeriodo: { 'dic-20': 500000, 'dic-21': 1500000, 'dic-22': 700000, 'dic-23': 550000, 'dic-24': 800000, 'dic-25': 0 } },
  { ruc: '789-456-123', nombre: 'abc', valoresPorPeriodo: { 'ene-23': 100000, 'feb-23': 90000, 'mar-23': 80000 } },
];

const INEXACTOS_MOCK: FilaBase[] = [
  // Usa el mismo ejemplo de la imagen para que coincida
  { ruc: '123456', nombre: 'compañía xyz', valoresPorPeriodo: { 'dic-20': 500000, 'dic-21': 1500000, 'dic-22': 700000, 'dic-23': 550000, 'dic-24': 800000, 'dic-25': 0 } },
  { ruc: '789-012-345', nombre: 'klm', valoresPorPeriodo: { 'ene-23': 40000, 'feb-23': 50000 } },
];

/* -------------------------- Helpers -------------------------- */
const cantidadPeriodosConValor = (fila: FilaBase) =>
  Object.values(fila.valoresPorPeriodo).filter(v => (Number(v) || 0) > 0).length;

const totalFila = (fila: FilaBase) =>
  Object.values(fila.valoresPorPeriodo).reduce((acc, v) => acc + (Number(v) || 0), 0);

/* -------------------------- OMISOS -------------------------- */
const TablaOmisos: React.FC<TablaOmisosProps> = ({ categoria, programa, tipologia, onExport }) => {
  const filas = OMISOS_MOCK.map(f => ({
    ...f,
    cantidad: cantidadPeriodosConValor(f),
    total: totalFila(f)
  }));

  const [abierto, setAbierto] = useState(false);
  const [seleccion, setSeleccion] = useState<FilaBase | null>(null);

  const abrirDetalle = (f: FilaBase) => {
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
        <Button variant="outlined" onClick={handleExport}>EXCEL</Button>
        <Button variant="outlined">WORD</Button>
        <Button variant="outlined">PDF</Button>
      </Box>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>RUC</TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell align="right">Número de períodos</TableCell>
              <TableCell align="right">Valor total</TableCell>
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
                  <Tooltip title="Detalle de períodos omitidos" arrow>
                    <Button size="small" variant="contained" onClick={() => abrirDetalle(f)}>
                      Detalle
                    </Button>
                  </Tooltip>
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
        tipologia={tipologia}
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
  fila: FilaBase | null;
};

const DetalleOmisosModal: React.FC<DetalleProps> = ({ open, onClose, categoria, tipologia, programa, fila }) => {
  const periodosOrdenados = useMemo(() => (fila ? Object.keys(fila.valoresPorPeriodo) : []), [fila]);
  const total = useMemo(() => (fila ? totalFila(fila) : 0), [fila]);

  const handleExportExcel = () => {
    if (!fila) return;
    const meta = [
      ['Detalle de períodos omitidos'], [],
      ['Categoría', categoria],
      ['Inconsistencia', 'Omisos'],
      [programa ? 'Programa' : 'Grupo de impuesto', programa || (tipologia ?? '—')],
      ['RUC', fila.ruc],
      ['Nombre', fila.nombre], [],
      ['Cantidad periodos omitidos'],
    ];
    const headers = [...periodosOrdenados, 'Total'];
    const row = [...periodosOrdenados.map(p => Number(fila.valoresPorPeriodo[p] ?? 0)), Number(total)];
    const aoa = [...meta, headers, row];

    const ws = XLSX.utils.aoa_to_sheet(aoa);
    const colCount = Math.max(...aoa.map(r => r.length));
    ws['!cols'] = Array.from({ length: colCount }, (_, i) => {
      const maxLen = aoa.reduce((m, r) => Math.max(m, (r[i]?.toString()?.length ?? 0)), 0);
      return { wch: Math.min(Math.max(12, maxLen + 2), 40) };
    });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Detalle');
    const ts = new Date().toISOString().slice(0, 16).replace(':', '').replace('T', '_');
    XLSX.writeFile(wb, `Detalle_omisiones_${fila.ruc}_${ts}.xlsx`);
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
                  <Typography variant="caption" fontWeight={700}>Categoría</Typography>
                  <Typography>{categoria}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper variant="outlined" sx={{ p: 1.5 }}>
                  <Typography variant="caption" fontWeight={700}>Inconsistencia</Typography>
                  <Typography>Omisos</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper variant="outlined" sx={{ p: 1.5 }}>
                  <Typography variant="caption" fontWeight={700}>{programa ? 'Programa' : 'Grupo de impuesto'}</Typography>
                  <Typography>{programa || tipologia}</Typography>
                </Paper>
              </Grid>
            </Grid>

            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 1.5 }}>
                  <Typography variant="caption" fontWeight={700}>RUC</Typography>
                  <Typography>{fila.ruc}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 1.5 }}>
                  <Typography variant="caption" fontWeight={700}>Nombre</Typography>
                  <Typography>{fila.nombre}</Typography>
                </Paper>
              </Grid>
            </Grid>

            <Typography fontWeight={700} mb={1}>Cantidad periodos omitidos</Typography>

            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {periodosOrdenados.map((p) => <TableCell key={p} align="right">{p}</TableCell>)}
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    {periodosOrdenados.map((p) => (
                      <TableCell key={p} align="right">{MONEDA.format(fila.valoresPorPeriodo[p] || 0)}</TableCell>
                    ))}
                    <TableCell align="right" sx={{ fontWeight: 700 }}>{MONEDA.format(total)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>

            <Divider sx={{ my: 2 }} />
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button onClick={handleExportExcel} variant="outlined">Excel</Button>
              <Button variant="outlined">Word</Button>
              <Button variant="outlined">Pdf</Button>
              <Button onClick={onClose} variant="contained">Cerrar</Button>
            </Stack>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

/* -------------------------- INEXACTOS -------------------------- */
const TablaInexactos: React.FC<TablaInexactosProps> = ({ categoria, programa, tipologia, onExport }) => {
  const filas = INEXACTOS_MOCK.map(f => ({
    ...f,
    cantidad: cantidadPeriodosConValor(f),
    total: totalFila(f)
  }));

  const [abiertoIne, setAbiertoIne] = useState(false);
  const [seleccionIne, setSeleccionIne] = useState<FilaBase | null>(null);

  const abrirDetalleInexactos = (f: FilaBase) => {
    setSeleccionIne(f);
    setAbiertoIne(true);
  };

  const handleExport = () => {
    const columnas = ['RUC', 'Nombre contribuyente', 'Número periodos inexacto', 'Valor total inexactitud'];
    const data = filas.map(f => ({
      RUC: f.ruc,
      'Nombre contribuyente': f.nombre,
      'Número periodos inexacto': f.cantidad,
      'Valor total inexactitud': f.total
    }));
    onExport('Inexactos', data, columnas);
  };

  return (
    <Box>
      <Box display="flex" justifyContent="flex-end" mb={2}>
        <Button variant="outlined" onClick={handleExport}>EXCEL</Button>
        <Button variant="outlined">Word</Button>
        <Button variant="outlined">Pdf</Button>
      </Box>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>RUC</TableCell>
              <TableCell>Nombre contribuyente</TableCell>
              <TableCell align="right">Número periodos inexacto</TableCell>
              <TableCell align="right">Valor total inexactitud</TableCell>
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
                  <Tooltip title="Detalle de períodos inexactos" arrow>
                    <Button size="small" variant="contained" onClick={() => abrirDetalleInexactos(f)}>
                      Detalle
                    </Button>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <DetalleInexactosModal
        open={abiertoIne}
        onClose={() => setAbiertoIne(false)}
        categoria={categoria}
        programa={programa}
        tipologia={tipologia}
        fila={seleccionIne}
      />
    </Box>
  );
};

const DetalleInexactosModal: React.FC<DetalleProps> = ({ open, onClose, categoria, tipologia, programa, fila }) => {
  const periodosOrdenados = useMemo(() => (fila ? Object.keys(fila.valoresPorPeriodo) : []), [fila]);
  const total = useMemo(() => (fila ? totalFila(fila) : 0), [fila]);

  const handleExportExcel = () => {
    if (!fila) return;
    const meta = [
      ['Detalle de períodos inexactos'], [],
      ['Categoría', categoria],
      ['Inconsistencia', 'Inexactos'],
      [programa ? 'Programa' : 'Grupo de impuesto', programa || (tipologia ?? '—')],
      ['RUC', fila.ruc],
      ['Nombre', fila.nombre], [],
      ['Cantidad periodos inexacto'],
    ];
    const headers = [...periodosOrdenados, 'Total'];
    const row = [...periodosOrdenados.map(p => Number(fila.valoresPorPeriodo[p] ?? 0)), Number(total)];
    const aoa = [...meta, headers, row];

    const ws = XLSX.utils.aoa_to_sheet(aoa);
    const colCount = Math.max(...aoa.map(r => r.length));
    ws['!cols'] = Array.from({ length: colCount }, (_, i) => {
      const maxLen = aoa.reduce((m, r) => Math.max(m, (r[i]?.toString()?.length ?? 0)), 0);
      return { wch: Math.min(Math.max(12, maxLen + 2), 40) };
    });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Detalle');
    const ts = new Date().toISOString().slice(0, 16).replace(':', '').replace('T', '_');
    XLSX.writeFile(wb, `Detalle_inexactos_${fila.ruc}_${ts}.xlsx`);
  };

  return (
    <Dialog fullWidth maxWidth="md" open={open} onClose={onClose}>
      <DialogTitle>Detalle de períodos inexactos</DialogTitle>
      <DialogContent dividers>
        {fila && (
          <>
            {/* Encabezado estilo imagen */}
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} md={4}>
                <Paper variant="outlined" sx={{ p: 1.5 }}>
                  <Typography variant="caption" fontWeight={700}>Grandes Contribuyentes</Typography>
                  <Typography>{categoria}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper variant="outlined" sx={{ p: 1.5 }}>
                  <Typography variant="caption" fontWeight={700}>Inexactos</Typography>
                  <Typography>—</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper variant="outlined" sx={{ p: 1.5 }}>
                  <Typography variant="caption" fontWeight={700}>Costos y Gastos vs anexos</Typography>
                  <Typography>{programa || tipologia}</Typography>
                </Paper>
              </Grid>
            </Grid>

            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 1.5 }}>
                  <Typography variant="caption" fontWeight={700}>RUC</Typography>
                  <Typography>{fila.ruc}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 1.5 }}>
                  <Typography variant="caption" fontWeight={700}>NOMBRE</Typography>
                  <Typography>{fila.nombre}</Typography>
                </Paper>
              </Grid>
            </Grid>

            <Typography fontWeight={700} mb={1}>Cantidad periodos inexacto</Typography>

            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {periodosOrdenados.map((p) => <TableCell key={p} align="right">{p}</TableCell>)}
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    {periodosOrdenados.map((p) => (
                      <TableCell key={p} align="right">{MONEDA.format(fila.valoresPorPeriodo[p] || 0)}</TableCell>
                    ))}
                    <TableCell align="right" sx={{ fontWeight: 700 }}>{MONEDA.format(total)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>

            <Divider sx={{ my: 2 }} />
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button onClick={handleExportExcel} variant="outlined">Excel</Button>
              <Button variant="outlined">Word</Button>
              <Button variant="outlined">Pdf</Button>
              <Button onClick={onClose} variant="contained">Cerrar</Button>
            </Stack>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

/* -------------------------- EXTEMPORÁNEO -------------------------- */
const TablaExtemporaneo: React.FC<TablaPropsBase> = ({ categoria, onExport }) => {
  const datos = [{ Categoria: categoria, RUC: 'Individual', Nombre: 'individual', Dias: '-1' }];
  const columnas = ['Categoria', 'RUC', 'Nombre', 'Dias'];

  return (
    <Box>
      <Box display="flex" justifyContent="flex-end" mb={1}>
        <Button variant="outlined" sx={{ mb: 1 }} onClick={() => onExport('Extemporaneo', datos, columnas)}>EXCEL</Button>
        <Button variant="outlined" sx={{ mb: 1 }}>WORD</Button>
        <Button variant="outlined" sx={{ mb: 1 }}>PDF</Button>
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
