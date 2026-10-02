// Operaciones del carrito de compras (CRUD) y su persistencia.
//
// Mismas reglas que el sitio en HTML (js/carrito.js):
// - El carrito guarda solo { codigo, cantidad }. El precio y el stock
//   se leen siempre del catalogo, asi nunca quedan desactualizados.
// - Nunca se puede pedir mas que el stock disponible.
//
// Las funciones son puras: reciben la lista actual y devuelven una lista
// NUEVA, sin modificar la original. React necesita eso para darse cuenta
// de que algo cambio y volver a dibujar.

import { PRODUCTOS } from "./productos";

export const CLAVE_CARRITO = "carritoVolcan";

function buscarProducto(codigo) {
  return PRODUCTOS.find((p) => p.codigo === codigo) || null;
}

// ---------- Persistencia ----------

// LEER: trae el carrito guardado. Si no hay nada o esta danado, parte vacio.
export function leerCarrito() {
  try {
    const guardado = localStorage.getItem(CLAVE_CARRITO);
    const lista = guardado ? JSON.parse(guardado) : [];
    return Array.isArray(lista) ? lista : [];
  } catch {
    return [];
  }
}

export function guardarCarrito(items) {
  localStorage.setItem(CLAVE_CARRITO, JSON.stringify(items));
}

// ---------- CRUD ----------

// CREAR o ACTUALIZAR: agrega unidades. Si el producto ya estaba, suma.
// Devuelve la lista nueva y un mensaje para mostrar.
export function agregarItem(items, codigo, cantidad = 1) {
  const producto = buscarProducto(codigo);

  if (!producto || producto.stock === 0) {
    return { items, ok: false, mensaje: "Este producto no tiene stock disponible." };
  }

  const pedida = Math.max(1, Number(cantidad) || 1);
  const existente = items.find((item) => item.codigo === codigo);
  const yaEnCarrito = existente ? existente.cantidad : 0;

  if (yaEnCarrito + pedida > producto.stock) {
    const disponible = producto.stock - yaEnCarrito;

    const mensaje = disponible <= 0
      ? "Ya tienes todo el stock disponible de este producto en el carrito."
      : "Solo quedan " + disponible + " unidades disponibles.";

    return { items, ok: false, mensaje };
  }

  const nuevos = existente
    ? items.map((item) =>
        item.codigo === codigo ? { ...item, cantidad: yaEnCarrito + pedida } : item
      )
    : [...items, { codigo, cantidad: pedida }];

  return { items: nuevos, ok: true, mensaje: producto.nombre + " agregado al carrito." };
}

// ACTUALIZAR: fija la cantidad de un producto, entre 1 y su stock.
export function cambiarCantidadItem(items, codigo, cantidad) {
  const producto = buscarProducto(codigo);
  const nueva = Number(cantidad);

  if (!producto || nueva < 1 || nueva > producto.stock) {
    return items;
  }

  return items.map((item) =>
    item.codigo === codigo ? { ...item, cantidad: nueva } : item
  );
}

// ELIMINAR: quita un producto completo del carrito.
export function quitarItem(items, codigo) {
  return items.filter((item) => item.codigo !== codigo);
}

// ---------- Calculos ----------

// Cruza el carrito con el catalogo: arma cada linea con su subtotal,
// y calcula el total y la cantidad de unidades.
export function detalleDelCarrito(items) {
  const lineas = [];
  let total = 0;
  let unidades = 0;

  items.forEach((item) => {
    const producto = buscarProducto(item.codigo);

    if (!producto) {
      return;
    }

    const cantidad = Math.min(item.cantidad, producto.stock);
    const subtotal = producto.precioResidencial * cantidad;

    total += subtotal;
    unidades += cantidad;

    lineas.push({
      codigo: producto.codigo,
      nombre: producto.nombre,
      precio: producto.precioResidencial,
      stock: producto.stock,
      cantidad,
      subtotal
    });
  });

  return { lineas, total, unidades };
}
