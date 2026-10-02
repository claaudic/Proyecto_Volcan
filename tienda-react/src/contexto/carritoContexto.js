import { createContext, useContext } from "react";

// El "canal" por donde se comparte el carrito con toda la aplicacion.
export const CarritoContexto = createContext(null);

// Atajo para leer el carrito desde cualquier componente:
//   const { detalle, agregar } = useCarrito()
export function useCarrito() {
  const carrito = useContext(CarritoContexto);

  if (carrito === null) {
    throw new Error("useCarrito debe usarse dentro de <ProveedorCarrito>.");
  }

  return carrito;
}
