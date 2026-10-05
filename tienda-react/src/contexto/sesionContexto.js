import { createContext, useContext } from "react";

// Canal por donde se comparte quien tiene la sesion iniciada.
export const SesionContexto = createContext(null);

// Atajo para leer la sesion desde cualquier componente:
//   const { usuario, cerrarSesion } = useSesion()
export function useSesion() {
  const sesion = useContext(SesionContexto);

  if (sesion === null) {
    throw new Error("useSesion debe usarse dentro de <ProveedorSesion>.");
  }

  return sesion;
}
