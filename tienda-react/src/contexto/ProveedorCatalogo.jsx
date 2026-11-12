import { useCallback, useEffect, useState } from "react";
import { CatalogoContexto } from "./catalogoContexto";
import { obtenerCatalogo } from "../datos/catalogoApi";
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
// La exportación predeterminada conserva temporalmente el CRUD local.
// Checkout ya no descuenta stock mediante este proveedor.

// Etapa 3A: lectura HTTP aislada. No está montada en main.jsx ni App.jsx.
// No expone mutaciones locales sobre datos oficiales ni persiste el catálogo.
export function ProveedorCatalogoHttp({ children }) {
  const [version, setVersion] = useState(0);
  const [respuesta, setRespuesta] = useState({
    version: -1, productos: [], categorias: [], error: "", recibida: false
  });

  useEffect(() => {
    let vigente = true;
    obtenerCatalogo().then(datos => {
      if (vigente) setRespuesta({ version, ...datos, error: "", recibida: true });
    }).catch(error => {
      if (vigente) setRespuesta(anterior => ({
        ...anterior, version, error: error.message || "No se pudo cargar el catálogo oficial."
      }));
    });
    return () => { vigente = false; };
  }, [version]);

  const recargar = useCallback(() => setVersion(actual => actual + 1), []);
  const cargando = respuesta.version !== version;
  const actualizando = cargando && respuesta.recibida;
  const error = cargando ? "" : respuesta.error;
  const disponible = !cargando && !error;
  // Los datos anteriores permanecen solo en memoria, sin ofrecerse como vigentes.
  const productos = disponible ? respuesta.productos : [];
  const categorias = disponible ? respuesta.categorias : [];
  const vacio = disponible && productos.length === 0;
  const estado = cargando ? (actualizando ? "actualizando" : "cargando")
    : error ? "error" : vacio ? "vacio" : "disponible";

  return (
    <CatalogoContexto.Provider value={{
      productos, categorias, activos: productos.filter(producto => producto.activo === true),
      buscar: codigo => productos.find(producto => producto.codigo === codigo) ?? null,
      estado, cargando, actualizando, error, disponible, vacio, recargar, soloLectura: true
    }}>
      {children}
    </CatalogoContexto.Provider>
  );
}

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
