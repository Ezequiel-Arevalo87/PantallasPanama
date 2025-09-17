import React, { useMemo, useState } from 'react';
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Grid, Divider,
  Stack, Tooltip, Chip
} from '@mui/material';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

/* ===================== Tipos ===================== */
type ActividadEco = { codigo?: string; nombre: string };

type Props = {
  estado: string;
  categoria: string;
  tipologia: string;
  programa?: string;
  actividad?: ActividadEco[];
};

type TablaPropsBase = {
  categoria: string;
  onExport: (nombre: string, data: any[], columns: string[]) => void;
};

type TablaOmisosProps = TablaPropsBase & {
  programa?: string;
  tipologia?: string;
  actividad?: ActividadEco[];
};

type TablaInexactosProps = TablaPropsBase & {
  programa?: string;
  tipologia?: string;
  actividad?: ActividadEco[]; // ← AHORA incluye actividad
};

type TablaExtemporaneoProps = TablaPropsBase & {
  actividad?: ActividadEco[];
};

type FilaBase = {
  ruc: string;
  nombre: string;
  valoresPorPeriodo: Record<string, number>;
};

type FilaExtemporaneo = {
  categoria: string;
  ruc: string;
  nombre: string;
  dias: number;
  valoresPorPeriodo: Record<string, number>; // ← períodos para el modal
};

const MONEDA = new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0 });

/* ===================== Mocks ===================== */
const OMISOS_MOCK: FilaBase[] = [
  { ruc: '123456', nombre: 'compañía xyz', valoresPorPeriodo: { 'dic-20': 500000, 'dic-21': 1500000, 'dic-22': 700000, 'dic-23': 550000, 'dic-24': 800000, 'dic-25': 0 } },
  { ruc: '789-456-123', nombre: 'abc', valoresPorPeriodo: { 'ene-23': 100000, 'feb-23': 90000, 'mar-23': 80000 } },
];

const INEXACTOS_MOCK: FilaBase[] = [
  { ruc: '123456', nombre: 'compañía xyz', valoresPorPeriodo: { 'dic-20': 500000, 'dic-21': 1500000, 'dic-22': 700000, 'dic-23': 550000, 'dic-24': 800000, 'dic-25': 0 } },
  { ruc: '789-012-345', nombre: 'klm', valoresPorPeriodo: { 'ene-23': 40000, 'feb-23': 50000 } },
];

const EXTEMPORANEO_MOCK: FilaExtemporaneo[] = [
  {
    categoria: '—',
    ruc: 'Individual',
    nombre: 'individual',
    dias: -1,
    valoresPorPeriodo: { 'dic-20': 1, 'dic-21': 0, 'dic-22': 2, 'dic-23': 0, 'dic-24': 3, 'dic-25': 0 }
  },
];

/* ===================== Helpers ===================== */
const cantidadPeriodosConValor = (fila: FilaBase) =>
  Object.values(fila.valoresPorPeriodo).filter(v => (Number(v) || 0) > 0).length;

const totalFila = (fila: FilaBase) =>
  Object.values(fila.valoresPorPeriodo).reduce((acc, v) => acc + (Number(v) || 0), 0);

/* ===================== Componente principal ===================== */
export const TablasResultadosSelector: React.FC<Props> = ({ estado, categoria, tipologia, programa, actividad }) => {
  const mostrarOmiso = estado === 'omiso' || estado === 'Todos';
  const mostrarInexacto = estado === 'inexacto' || estado === 'Todos';
  const mostrarExtemporaneo = estado === 'Extemporáneo' || estado === 'Todos';

  const exportarExcel = (nombreArchivo: string, datos: any[], columnas: string[]) => {
    const ws = XLSX.utils.json_to_sheet(datos, { header: columnas });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Datos');
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([buf], { type: 'application/octet-stream' }), `${nombreArchivo}.xlsx`);
  };

  return (
    <Box mt={4}>
      {mostrarOmiso && (
        <Box mb={4}>
          <Typography variant="h6" color="error">OMISOS</Typography>
          <TablaOmisos
            categoria={categoria}
            tipologia={tipologia}
            programa={programa}
            actividad={actividad}
            onExport={exportarExcel}
          />
        </Box>
      )}

      {mostrarInexacto && (
        <Box mb={4}>
          <Typography variant="h6" color="success.main">INEXACTOS</Typography>
          <TablaInexactos
            categoria={categoria}
            tipologia={tipologia}
            programa={programa}
            actividad={actividad}  // ← se pasa actividad
            onExport={exportarExcel}
          />
        </Box>
      )}

      {mostrarExtemporaneo && (
        <Box mb={4}>
          <Typography variant="h6" color="warning.main">EXTEMPORÁNEO</Typography>
          <TablaExtemporaneo
            categoria={categoria}
            actividad={actividad}
            onExport={exportarExcel}
          />
        </Box>
      )}
    </Box>
  );
};

/* ===================== OMISOS ===================== */
const TablaOmisos: React.FC<TablaOmisosProps> = ({ categoria, programa, tipologia, actividad, onExport }) => {
  const filas = OMISOS_MOCK.map(f => ({ ...f, cantidad: cantidadPeriodosConValor(f), total: totalFila(f) }));

  const [abierto, setAbierto] = useState(false);
  const [seleccion, setSeleccion] = useState<FilaBase | null>(null);

  const abrirDetalle = (f: FilaBase) => { setSeleccion(f); setAbierto(true); };

  const handleExport = () => {
    const columnas = ['RUC', 'Nombre', 'Cantidad periodos omitidos', 'Valor total periodos omitidos'];
    const data = filas.map(f => ({
      RUC: f.ruc, Nombre: f.nombre, 'Cantidad periodos omitidos': f.cantidad, 'Valor total periodos omitidos': f.total
    }));
    onExport('Omisos', data, columnas);
  };

  return (
    <Box>
      <Box display="flex" justifyContent="flex-end" mb={1} gap={1}>
        <Button variant="outlined" onClick={handleExport}>EXCEL</Button>
        <Button variant="outlined">WORD</Button>
        <Button variant="outlined">PDF</Button>
      </Box>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>RUC</TableCell>
              <TableCell>Actividad(es)</TableCell>
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
                <TableCell>
                  {actividad?.length ? (
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                      {actividad.map((a, idx) => <Chip key={`${f.ruc}-${idx}`} size="small" label={a.nombre} />)}
                    </Stack>
                  ) : '—'}
                </TableCell>
                <TableCell>{f.nombre}</TableCell>
                <TableCell align="right">{f.cantidad}</TableCell>
                <TableCell align="right">{MONEDA.format(f.total)}</TableCell>
                <TableCell align="center">
                  <Tooltip title="Detalle de períodos omitidos" arrow>
                    <Button size="small" variant="contained" onClick={() => abrirDetalle(f)}>Detalle</Button>
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
        actividad={actividad}
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
  actividad?: ActividadEco[];
  fila: FilaBase | null;
};

const DetalleOmisosModal: React.FC<DetalleProps> = ({ open, onClose, categoria, tipologia, programa, actividad, fila }) => {
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
      ['Actividad(es)', actividad?.length ? actividad.map(a => a.nombre).join(', ') : '—'],
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
              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 1.5 }}>
                  <Typography variant="caption" fontWeight={700}>Actividad(es) económica(s)</Typography>
                  <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap mt={0.5}>
                    {actividad?.length
                      ? actividad.map((a, i) => <Chip key={`om-act-${i}`} size="small" label={a.nombre} />)
                      : <Typography sx={{ opacity: 0.7 }}>—</Typography>}
                  </Stack>
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

/* ===================== INEXACTOS ===================== */
const TablaInexactos: React.FC<TablaInexactosProps> = ({ categoria, programa, tipologia, actividad, onExport }) => {
  const filas = INEXACTOS_MOCK.map(f => ({ ...f, cantidad: cantidadPeriodosConValor(f), total: totalFila(f) }));

  const [abiertoIne, setAbiertoIne] = useState(false);
  const [seleccionIne, setSeleccionIne] = useState<FilaBase | null>(null);

  const abrirDetalleInexactos = (f: FilaBase) => { setSeleccionIne(f); setAbiertoIne(true); };

  const handleExport = () => {
    const columnas = ['RUC', 'Nombre contribuyente', 'Número periodos inexacto', 'Valor total inexactitud'];
    const data = filas.map(f => ({
      RUC: f.ruc, 'Nombre contribuyente': f.nombre, 'Número periodos inexacto': f.cantidad, 'Valor total inexactitud': f.total
    }));
    onExport('Inexactos', data, columnas);
  };

  return (
    <Box>
      <Box display="flex" justifyContent="flex-end" mb={2} gap={1}>
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
                    <Button size="small" variant="contained" onClick={() => abrirDetalleInexactos(f)}>Detalle</Button>
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
        actividad={actividad} // ← se pasa al modal
      />
    </Box>
  );
};

const DetalleInexactosModal: React.FC<DetalleProps> = ({ open, onClose, categoria, tipologia, programa, fila, actividad }) => {
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
      ['Actividad(es)', actividad?.length ? actividad.map(a => a.nombre).join(', ') : '—'],
      ['Nombre', fila.nombre], [],
      ['Cantidad periodos inexacto'],
    ];
    const headers = [...periodosOrdenados, 'Total'];
    const row = [...periodosOrdenados.map(p => Number(fila.valoresPorPeriodo[p] ?? 0)), Number(total)];
    const aoa = [...meta, headers, row];

    const ws = XLSX.utils.aoa_to_sheet(aoa);
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
                  <Typography>Inexactos</Typography>
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
              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 1.5 }}>
                  <Typography variant="caption" fontWeight={700}>Actividad(es) económica(s)</Typography>
                  <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap mt={0.5}>
                    {actividad?.length
                      ? actividad.map((a, i) => <Chip key={`ine-act-${i}`} size="small" label={a.nombre} />)
                      : <Typography sx={{ opacity: 0.7 }}>—</Typography>}
                  </Stack>
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

/* ===================== EXTEMPORÁNEO ===================== */
const TablaExtemporaneo: React.FC<TablaExtemporaneoProps> = ({ categoria, actividad, onExport }) => {
  const filas = EXTEMPORANEO_MOCK.map(f => ({ ...f, categoria }));

  const columnas = ['Categoria', 'RUC', 'Nombre', 'Dias'];
  const datos = filas.map(f => ({ Categoria: f.categoria, RUC: f.ruc, Nombre: f.nombre, Dias: f.dias }));

  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState<FilaExtemporaneo | null>(null);

  const abrirDetalle = (f: FilaExtemporaneo) => { setSel(f); setOpen(true); };

  return (
    <Box>
      <Box display="flex" justifyContent="flex-end" mb={1} gap={1}>
        <Button variant="outlined" onClick={() => onExport('Extemporaneo', datos, columnas)}>EXCEL</Button>
        <Button variant="outlined">WORD</Button>
        <Button variant="outlined">PDF</Button>
      </Box>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Categoría</TableCell>
              <TableCell>RUC</TableCell>
              <TableCell>Actividad(es)</TableCell>
              <TableCell>Nombre o Razón Social</TableCell>
              <TableCell>Número de días (hasta presentación)</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filas.map((f, i) => (
              <TableRow key={i} hover>
                <TableCell>{f.categoria}</TableCell>
                <TableCell>{f.ruc}</TableCell>
                <TableCell>
                  {actividad?.length ? (
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                      {actividad.map((a, idx) => <Chip key={`ext-act-${idx}`} size="small" label={a.nombre} />)}
                    </Stack>
                  ) : '—'}
                </TableCell>
                <TableCell>{f.nombre}</TableCell>
                <TableCell>{f.dias}</TableCell>
                <TableCell align="center">
                  <Tooltip title="Detalle de extemporaneidad" arrow>
                    <Button size="small" variant="contained" onClick={() => abrirDetalle(f)}>Detalle</Button>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <DetalleExtemporaneoModal
        open={open}
        onClose={() => setOpen(false)}
        categoria={categoria}
        fila={sel}
        actividad={actividad}
      />
    </Box>
  );
};

const DetalleExtemporaneoModal: React.FC<{
  open: boolean;
  onClose: () => void;
  categoria: string;
  fila: FilaExtemporaneo | null;
  actividad?: ActividadEco[];
}> = ({ open, onClose, categoria, fila, actividad }) => {

  const periodosOrdenados = useMemo(
    () => (fila ? Object.keys(fila.valoresPorPeriodo ?? {}) : []),
    [fila]
  );
  const total = useMemo(
    () => (fila ? Object.values(fila.valoresPorPeriodo ?? {}).reduce((a, b) => a + (Number(b) || 0), 0) : 0),
    [fila]
  );

  const handleExportExcel = () => {
    if (!fila) return;
    const meta = [
      ['Detalle de extemporáneo'], [],
      ['Categoría', categoria],
      ['Inconsistencia', 'Extemporáneo'],
      ['RUC', fila.ruc],
      ['Nombre', fila.nombre],
      ['Actividad(es)', actividad?.length ? actividad.map(a => a.nombre).join(', ') : '—'],
      [], ['Cantidad periodos extemporáneo'],
    ];
    const headers = [...periodosOrdenados, 'Total'];
    const row = [...periodosOrdenados.map(p => Number(fila.valoresPorPeriodo[p] ?? 0)), Number(total)];
    const aoa = [...meta, headers, row];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Detalle');
    const ts = new Date().toISOString().slice(0, 16).replace(':', '').replace('T', '_');
    XLSX.writeFile(wb, `Detalle_extemporaneo_${fila.ruc}_${ts}.xlsx`);
  };

  return (
    <Dialog fullWidth maxWidth="md" open={open} onClose={onClose}>
      <DialogTitle>Detalle de extemporáneo</DialogTitle>
      <DialogContent dividers>
        {fila && (
          <>
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
                  <Typography>Extemporáneo</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper variant="outlined" sx={{ p: 1.5 }}>
                  <Typography variant="caption" fontWeight={700}>Grupo de impuesto</Typography>
                  <Typography>—</Typography>
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
              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 1.5 }}>
                  <Typography variant="caption" fontWeight={700}>Actividad(es) económica(s)</Typography>
                  <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap mt={0.5}>
                    {actividad?.length
                      ? actividad.map((a, i) => <Chip key={`extm-act-${i}`} size="small" label={a.nombre} />)
                      : <Typography sx={{ opacity: 0.7 }}>—</Typography>}
                  </Stack>
                </Paper>
              </Grid>
            </Grid>

            <Typography fontWeight={700} mb={1}>Cantidad periodos extemporáneo</Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {periodosOrdenados.map(p => <TableCell key={p} align="right">{p}</TableCell>)}
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    {periodosOrdenados.map(p => (
                      <TableCell key={p} align="right">{fila.valoresPorPeriodo[p] ?? 0}</TableCell>
                    ))}
                    <TableCell align="right" sx={{ fontWeight: 700 }}>{total}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>

            {/* Resumen opcional de días */}
            <Box mt={2}>
              <Typography variant="caption" sx={{ fontWeight: 700, mr: 1 }}>Días hasta presentación</Typography>
              <Typography component="span">{fila.dias}</Typography>
            </Box>

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
