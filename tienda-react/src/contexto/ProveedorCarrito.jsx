import { useEffect, useState } from "react";
import { CarritoContexto } from "./carritoContexto";
import { useCatalogo } from "./catalogoContexto";
import {
  leerCarrito,
  guardarCarrito,
  agregarItem,
  cambiarCantidadItem,
  quitarItem
} from "../datos/carrito";
import { estadoDelCarrito } from "../datos/estadoCarrito";

// Envuelve a toda la aplicacion y le entrega el carrito.
// Cualquier componente de adentro puede leerlo con useCarrito().

function ProveedorCarrito({ children }) {
  // El valor inicial sale de localStorage, para no perder el carrito al recargar
  const [items, setItems] = useState(leerCarrito);

  // Precios y stock salen del catalogo vivo. Solo se venden los activos.
  const { activos, cargando = false, error = '', recargar } = useCatalogo();
  const disponibilidad = estadoDelCarrito(items, activos, { cargando, error });

  // Cada vez que el carrito cambia, se guarda
  useEffect(() => {
    guardarCarrito(items);
  }, [items]);

  function agregar(codigo, cantidad) {
    if (cargando || error) {
      return { ok: false, mensaje: 'El catalogo no esta disponible. Intenta nuevamente.' };
    }
    const resultado = agregarItem(items, codigo, cantidad, activos);
    setItems(resultado.items);
    return resultado;
  }

  function cambiarCantidad(codigo, cantidad) {
    if (cargando || error) return;
    setItems(anteriores => {
      const articulo = anteriores.find(item => item.codigo === codigo);
      const producto = activos.find(item => item.codigo === codigo);
      // Corregir de una en una las unidades excedidas no permite confirmar stock inválido.
      if (articulo && producto && Number.isSafeInteger(articulo.cantidad)
          && Number.isSafeInteger(producto.stock) && producto.stock >= 0
          && articulo.cantidad > producto.stock && cantidad === articulo.cantidad - 1 && cantidad >= 1) {
        return anteriores.map(item => item.codigo === codigo ? { ...item, cantidad } : item);
      }
      return cambiarCantidadItem(anteriores, codigo, cantidad, activos);
    });
  }

  function quitar(codigo) {
    setItems(quitarItem(items, codigo));
  }

  function vaciar() {
    setItems([]);
  }

  const valor = {
    items,
    ...disponibilidad,
    // Solo lectura para las filas originales; nunca usar datos durante error/carga.
    productos: cargando || error ? [] : activos,
    errorCatalogo: typeof error === 'string' ? error : error?.message || '',
    recargarCatalogo: recargar,
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
