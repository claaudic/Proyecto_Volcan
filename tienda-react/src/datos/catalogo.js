// Catalogo de productos editable (CRUD) y su persistencia.
//
// La primera vez parte desde PRODUCTOS (datos/productos.js). Desde ahi,
// cualquier cambio del administrador o del stock se guarda en localStorage,
// con la misma clave que usaba el sitio en HTML (js/catalogo.js).
//
// Igual que en el carrito, las funciones son puras: reciben la lista
// actual y devuelven una lista NUEVA, sin modificar la original.

import { PRODUCTOS } from "./productos";

export const CLAVE_CATALOGO = "productosSistema";

// ---------- Persistencia ----------

// LEER: el catalogo guardado, o el inicial si no hay nada o esta danado
export function leerCatalogo() {
  try {
    const guardado = localStorage.getItem(CLAVE_CATALOGO);
    const lista = guardado ? JSON.parse(guardado) : null;

    if (Array.isArray(lista) && lista.length > 0) {
      return lista;
    }
  } catch {
    // si el dato esta danado, se parte desde el catalogo inicial
  }

  return PRODUCTOS;
}

export function guardarCatalogo(productos) {
  localStorage.setItem(CLAVE_CATALOGO, JSON.stringify(productos));
}

// ---------- Consultas ----------

// Solo los productos que se venden: los desactivados no aparecen en la tienda
export function productosActivos(productos) {
  return productos.filter((p) => p.activo !== false);
}

export function buscarEnCatalogo(productos, codigo) {
  return productos.find((p) => p.codigo === codigo) || null;
}

// ---------- CRUD ----------

// CREAR: agrega un producto. El codigo no se puede repetir.
export function crearProducto(productos, nuevo) {
  const codigo = String(nuevo.codigo || "").trim().toUpperCase();

  if (buscarEnCatalogo(productos, codigo)) {
    return { productos, ok: false, mensaje: "Ya existe un producto con el código " + codigo + "." };
  }

  const mayorId = productos.reduce((mayor, p) => Math.max(mayor, Number(p.id) || 0), 0);

  const producto = { activo: true, ...nuevo, codigo, id: mayorId + 1 };

  return { productos: [...productos, producto], ok: true, mensaje: "Producto creado." };
}

// ACTUALIZAR: cambia los datos de un producto existente
export function editarProducto(productos, codigo, cambios) {
  return productos.map((p) =>
    p.codigo === codigo ? { ...p, ...cambios, codigo: p.codigo, id: p.id } : p
  );
}

// ACTUALIZAR: activa o desactiva un producto (lo saca de la tienda sin borrarlo)
export function cambiarEstadoProducto(productos, codigo) {
  return productos.map((p) =>
    p.codigo === codigo ? { ...p, activo: p.activo === false } : p
  );
}

// ELIMINAR: quita el producto definitivamente
export function eliminarProducto(productos, codigo) {
  return productos.filter((p) => p.codigo !== codigo);
}

// ACTUALIZAR: resta lo comprado al stock. Nunca deja el stock en negativo.
// Recibe las lineas de un pedido: [{ codigo, cantidad }, ...]
export function descontarStock(productos, lineas) {
  const comprado = {};

  lineas.forEach((linea) => {
    comprado[linea.codigo] = (comprado[linea.codigo] || 0) + (Number(linea.cantidad) || 0);
  });

  return productos.map((p) => {
    if (!comprado[p.codigo]) {
      return p;
    }

    return { ...p, stock: Math.max(0, p.stock - comprado[p.codigo]) };
  });
}
