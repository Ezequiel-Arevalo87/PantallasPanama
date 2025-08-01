import React from 'react';
import {
  Box, Typography, Button,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper
} from '@mui/material';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

type Props = {
  estado: string;
  categoria: string;
};

export const TablasResultadosSelector: React.FC<Props> = ({ estado, categoria }) => {
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
          <Typography variant="h6" color="error"> OMISOS</Typography>
          <TablaOmisos categoria={categoria} onExport={exportarExcel} />
        </Box>
      )}
      {mostrarInexacto && (
        <Box mb={4}>
          <Typography variant="h6" color="success.main"> INEXACTOS</Typography>
          <TablaInexactos categoria={categoria} onExport={exportarExcel} />
        </Box>
      )}
      {mostrarExtemporaneo && (
        <Box mb={4}>
          <Typography variant="h6" color="warning.main"> EXTEMPORÁNEO</Typography>
          <TablaExtemporaneo categoria={categoria} onExport={exportarExcel} />
        </Box>
      )}
    </Box>
  );
};


type TablaProps = {
  categoria: string;
  onExport: (nombre: string, data: any[], columns: string[]) => void;
};

const TablaOmisos: React.FC<TablaProps> = ({ categoria, onExport }) => {
  const datos = [
    {
      Categoria: categoria,
      RUC: 'Individual',
      Nombre: 'individual',
      Periodo: 'mm/aa',
    },
  ];

  const columnas = ['Categoria', 'RUC', 'Nombre', 'Periodo'];

  return (
    <Box>
      <Button
        variant="outlined"
        sx={{ mb: 1 }}
        onClick={() => onExport('Omisos', datos, columnas)}
      >
        DESCARGAR EXCEL
      </Button>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Categoría</TableCell>
              <TableCell>RUC</TableCell>
              <TableCell>Nombre o Razón Social</TableCell>
              <TableCell>Periodos no presentados</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>{categoria}</TableCell>
              <TableCell>Individual</TableCell>
              <TableCell>individual</TableCell>
              <TableCell>mm/aa</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

const TablaInexactos: React.FC<TablaProps> = ({ categoria, onExport }) => {
  const datos = [
    {
      Categoria: categoria,
      RUC: 'Individual',
      Nombre: 'individual',
      TipoImpuesto: '',
      ValorImpuesto: '$',
      Inconsistencias: 'Observación',
      ValorInconsistencia: '',
    },
  ];

  const columnas = [
    'Categoria', 'RUC', 'Nombre',
    'TipoImpuesto', 'ValorImpuesto',
    'Inconsistencias', 'ValorInconsistencia'
  ];

  return (
    <Box>
      <Button
        variant="outlined"
        sx={{ mb: 1 }}
        onClick={() => onExport('Inexactos', datos, columnas)}
      >
        DESCARGAR EXCEL
      </Button>

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

const TablaExtemporaneo: React.FC<TablaProps> = ({ categoria, onExport }) => {
  const datos = [
    {
      Categoria: categoria,
      RUC: 'Individual',
      Nombre: 'individual',
      Dias: '-1',
    },
  ];

  const columnas = ['Categoria', 'RUC', 'Nombre', 'Dias'];

  return (
    <Box>
      <Button
        variant="outlined"
        sx={{ mb: 1 }}
        onClick={() => onExport('Extemporaneo', datos, columnas)}
      >
        DESCARGAR EXCEL
      </Button>

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
