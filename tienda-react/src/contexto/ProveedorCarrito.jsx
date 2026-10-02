import { useEffect, useState } from "react";
import { CarritoContexto } from "./carritoContexto";
import {
  leerCarrito,
  guardarCarrito,
  agregarItem,
  cambiarCantidadItem,
  quitarItem,
  detalleDelCarrito
} from "../datos/carrito";

// Envuelve a toda la aplicacion y le entrega el carrito.
// Cualquier componente de adentro puede leerlo con useCarrito().

function ProveedorCarrito({ children }) {
  // El valor inicial sale de localStorage, para no perder el carrito al recargar
  const [items, setItems] = useState(leerCarrito);

  // Cada vez que el carrito cambia, se guarda
  useEffect(() => {
    guardarCarrito(items);
  }, [items]);

  function agregar(codigo, cantidad) {
    const resultado = agregarItem(items, codigo, cantidad);
    setItems(resultado.items);
    return resultado;
  }

  function cambiarCantidad(codigo, cantidad) {
    setItems(cambiarCantidadItem(items, codigo, cantidad));
  }

  function quitar(codigo) {
    setItems(quitarItem(items, codigo));
  }

  function vaciar() {
    setItems([]);
  }

  const valor = {
    items,
    detalle: detalleDelCarrito(items),
    agregar,
    cambiarCantidad,
    quitar,
    vaciar
  };

  return (
    <CarritoContexto.Provider value={valor}>
      {children}
    </CarritoContexto.Provider>
  );
}

export default ProveedorCarrito;
