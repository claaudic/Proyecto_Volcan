import { useEffect, useState } from "react";
import { CatalogoContexto } from "./catalogoContexto";
import {
  leerCatalogo,
  guardarCatalogo,
  productosActivos,
  buscarEnCatalogo,
  crearProducto,
  editarProducto,
  cambiarEstadoProducto,
  eliminarProducto,
  descontarStock
} from "../datos/catalogo";

// Envuelve a la aplicacion y le entrega el catalogo.
// Mismo patron que el carrito y la sesion: estado + localStorage + Context.
//
// - La tienda usa "activos" y "buscar".
// - El panel de administracion usa "productos" y las funciones del CRUD.
// - El checkout usa "descontar" al confirmar una compra.

function ProveedorCatalogo({ children }) {
  const [productos, setProductos] = useState(leerCatalogo);

  // Cada cambio del catalogo se guarda
  useEffect(() => {
    guardarCatalogo(productos);
  }, [productos]);

  function crear(nuevo) {
    const resultado = crearProducto(productos, nuevo);
    setProductos(resultado.productos);
    return resultado;
  }

  const valor = {
    productos,
    activos: productosActivos(productos),
    buscar: (codigo) => buscarEnCatalogo(productos, codigo),
    crear,
    editar: (codigo, cambios) => setProductos(editarProducto(productos, codigo, cambios)),
    cambiarEstado: (codigo) => setProductos(cambiarEstadoProducto(productos, codigo)),
    eliminar: (codigo) => setProductos(eliminarProducto(productos, codigo)),
    descontar: (lineas) => setProductos(descontarStock(productos, lineas))
  };

  return (
    <CatalogoContexto.Provider value={valor}>
      {children}
    </CatalogoContexto.Provider>
  );
}

export default ProveedorCatalogo;
