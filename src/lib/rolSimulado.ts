// src/lib/rolSimulado.ts

export type RolSimulado = "JEFE_SECCION" | "JEFE_DEPARTAMENTO";

const ROL_SIMULADO_KEY = "rolSimulado";

export const getRolSimulado = (): RolSimulado => {
  if (typeof window === "undefined") return "JEFE_SECCION";
  const raw = window.localStorage.getItem(ROL_SIMULADO_KEY);
  return raw === "JEFE_DEPARTAMENTO" ? "JEFE_DEPARTAMENTO" : "JEFE_SECCION";
};

export const setRolSimulado = (rol: RolSimulado) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ROL_SIMULADO_KEY, rol);
};
