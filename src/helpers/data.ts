import dayjs from 'dayjs';
import { CasoAsignado, FichaContribuyente, ObjeticoInvestigacion, Alcance, ObjeticoInvestigacionDos } from './types';

export const CASOS: CasoAsignado[] = [
  { id: '1', categoria: 'Fiscalización Masiva', nombre: 'Grupo ABC', ruc: '1233445', fecha: '12/03/25' },
  { id: '2', categoria: 'Grandes Contribuyentes', nombre: 'Comercial XYZ', ruc: '9876543', fecha: '05/02/25' },
  { id: '3', categoria: 'Auditoría Sectorial', nombre: 'Importadora Pérez', ruc: '4567890', fecha: '27/01/25' },
];

export const FICHAS: Record<string, FichaContribuyente> = {
  '1233445': {
    nombre: 'AAAAAA',
    identificacion: '1233445',
    domicilio: 'CALLE 10, PISO 2',
    numAuto: '345',
    fecha: dayjs().format('DD/MM/YY'),
    hora: '1:00',
    antecedentes:
      'Se identificaron inconsistencias en declaraciones juradas del contribuyente SEÑOR JUAN PÉREZ GÓMEZ, cédula No. 8-765-432, representante legal de COMERCIALIZADORA PANAMEÑA, S.A., RUC 987654-1-123456, correspondientes a los periodos 2022 y 2023.',
    fundamentos:
      'Código de Procedimiento Tributario y demás normas aplicables que facultan a la DGI para iniciar, dirigir y concluir procesos de fiscalización tributaria.',
     
  },
  '9876543': {
    nombre: 'COMERCIAL XYZ S.A.',
    identificacion: '9876543',
    domicilio: 'AV. CENTRAL 123',
    numAuto: '812',
    fecha: '10/04/25',
    hora: '10:30',
  },
  // Si un RUC no existe aquí, se usarán placeholders
};
export const INVESTIGACIONOBJETO: Record<string, ObjeticoInvestigacion> = {
  '1233445': {
    investigacion:
      'Determinar la veracidad y exactitud de la información contenida en las declaraciones juradas de impuestos sobre la renta, ITBMS y demás tributos administrados por la Dirección General de Ingresos, verificar el cumplimiento de las obligaciones tributarias por parte del contribuyente, correspondientes a los periodos fiscales:',
    fundamentos:
      'Objeto de la Investigación o Auditoría [Descripción detallada del objeto de la investigación o auditoría, incluyendo los períodos y los impuestos involucrados]',
  },


};
export const INVESTIGACIONOBJETODOS: Record<string, ObjeticoInvestigacionDos> = {
  '1233445': {
    investigacionDos:
      'La presente auditoría comprenderá las operaciones económicas declaradas por el contribuyente, así como cualquier otra información que la Dirección General de Ingresos considere pertinente, como:',
    fundamentos:
     'Alcance de la Investigación o Auditoria [Descripción del alcance de la investigación o auditoría, incluyendo los libros y registros que se revisarán]',
  },


};
export const ALCANCE: Record<string, Alcance> = {
  '1233445': {
    alcance:
      'La presente auditoría comprenderá las operaciones económicas declaradas por el contribuyente, así como cualquier otra información que la Dirección General de Ingresos considere pertinente, como:',
    fundamentos:
      'Alcance de la Investigación o Auditoria [Descripción del alcance de la investigación o auditoría, incluyendo los libros y registros que se revisarán]',
  },
}