import { normalizar } from "./zonas";

// Las categorias no se guardan aparte: salen de los productos del catalogo.
// Asi, si el administrador agrega o desactiva productos, las categorias
// se actualizan solas.

// "Cilindros de Gas" -> "cilindros-de-gas", para usarlo en la URL
export function slugCategoria(nombre) {
  return normalizar(nombre).replace(/\s+/g, "-");
}

// Agrupa los productos por categoria, en el orden en que aparecen:
// [{ nombre, slug, productos: [...] }, ...]
export function agruparPorCategoria(productos) {
  const grupos = [];

  productos.forEach((producto) => {
    let grupo = grupos.find((g) => g.nombre === producto.categoria);

    if (!grupo) {
      grupo = { nombre: producto.categoria, slug: slugCategoria(producto.categoria), productos: [] };
      grupos.push(grupo);
    }

    grupo.productos.push(producto);
  });

  return grupos;
}
