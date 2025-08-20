export type Actividad = { code: string; label: string };

// Carga dinámica del JSON
export const loadActividades = async (): Promise<Actividad[]> => {
//   const mod = await import("../data/actividades.json");
  const mod = await import("../data/actividades.json");
  return (mod.default ?? []) as Actividad[];
};
