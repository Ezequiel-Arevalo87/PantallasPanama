export type NormaCatalogo = {
  id: string;            // único
  titulo: string;        // "Ley N° 337 de 14 de noviembre de 2022 - ..."
  vigente: 'SI' | 'NO';  // default
  desde: string;         // "FEB/13/2019"
  anio?: number;         // opcional
};

export type NormaSeleccionada = {
  id: string;
  titulo: string;
  vigente: 'SI' | 'NO';
  desde: string;
};
