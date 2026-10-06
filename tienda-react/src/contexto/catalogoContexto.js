import { createContext, useContext } from "react";

// Canal por donde se comparte el catalogo con toda la aplicacion.
export const CatalogoContexto = createContext(null);

// Atajo para leer el catalogo desde cualquier componente:
//   const { activos, buscar } = useCatalogo()
export function useCatalogo() {
  const catalogo = useContext(CatalogoContexto);

  if (catalogo === null) {
    throw new Error("useCatalogo debe usarse dentro de <ProveedorCatalogo>.");
  }

  return catalogo;
}
