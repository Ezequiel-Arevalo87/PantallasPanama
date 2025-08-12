export type CasoAsignado = {
  id: string;
  categoria: string;
  nombre: string;
  ruc: string;
  fecha: string; // dd/mm/aa
};

export type FichaContribuyente = {
  nombre?: string;
  identificacion?: string;
  domicilio?: string;
  numAuto?: string;
  fecha?: string;   // dd/mm/aa
  hora?: string;    // 1:00, 13:30, etc
  antecedentes?: string;
  fundamentos?: string;
};
export type ObjeticoInvestigacion = {

  investigacion?: string;
  fundamentos?: string;
};
export type Alcance = {

  alcance?: string;
  fundamentos?: string;
};
