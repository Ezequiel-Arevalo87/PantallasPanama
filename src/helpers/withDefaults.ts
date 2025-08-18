import dayjs from 'dayjs';
import { Alcance, FichaContribuyente, ObjeticoInvestigacion, ObjeticoInvestigacionDos } from './types';

export const withDefaults = (f: Partial<FichaContribuyente>, ruc: string): Required<FichaContribuyente> => ({
  nombre: f.nombre ?? '—',
  identificacion: f.identificacion ?? ruc,
  domicilio: f.domicilio ?? 'No registrado',
  numAuto: f.numAuto ?? '—',
  fecha: f.fecha ?? dayjs().format('DD/MM/YY'),
  hora: f.hora ?? '—',
  antecedentes:
    f.antecedentes ??
    'Antecedentes: Registre breve descripción de los antecedentes que motivan la apertura de la investigación o auditoría.',
  fundamentos:
    f.fundamentos ??
    'Fundamentos de Derecho: Liste las normas legales que fundamentan la apertura de la investigación o auditoría.',
});

export const withDefaultsDos = (f: Partial<ObjeticoInvestigacion>, _ruc: string): Required<ObjeticoInvestigacion> => ({
  investigacion:
    f.investigacion ??
    'Determinar la veracidad y exactitud de la información contenida en las declaraciones juradas de impuestos sobre la renta, ITBMS y demás tributos administrados por la Dirección General de Ingresos...',
  fundamentos:
    f.fundamentos ??
    'Objeto de la Investigación o Auditoría [Descripción detallada del objeto de la investigación o auditoría, incluyendo los períodos y los impuestos].',
});
export const withDefaultsCuatro = (f: Partial<ObjeticoInvestigacionDos>, _ruc: string): Required<ObjeticoInvestigacionDos> => ({
  investigacionDos:
    f.investigacionDos ??
      'La presente auditoría comprenderá las operaciones económicas declaradas por el contribuyente, así como cualquier otra información que la Dirección General de Ingresos considere pertinente, como:',
  fundamentos:
    f.fundamentos ??
    'Alcance de la Investigación o Auditoria [Descripción del alcance de la investigación o auditoría, incluyendo los libros y registros que se revisarán]',
});
export const withDefaultsTres = (f: Partial<Alcance>, _ruc: string): Required<Alcance> => ({
  alcance:
    f.alcance ??
    'La presente auditoría comprenderá las operaciones económicas declaradas por el contribuyente, así como cualquier otra información que la Dirección General de Ingresos considere pertinente, como:',
  fundamentos:
    f.fundamentos ??
    'Alcance de la Investigación o Auditoria [Descripción del alcance de la investigación o auditoría, incluyendo los libros y registros que se revisarán]',
});
