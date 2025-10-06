// Clave única para localStorage
export const CASOS_KEY = 'casosAprobacion' as const;

// Evento custom para avisar a otros componentes en el mismo tab
export const notifyAprobaciones = () =>
  window.dispatchEvent(new Event('casosAprobacion:update'));
