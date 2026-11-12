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
export function agruparPorCategoria(productos, categorias) {
  // En HTTP, también se conservan categorías oficiales sin productos activos.
  if (Array.isArray(categorias)) {
    return categorias.map(categoria => ({
      id: categoria.id,
      nombre: categoria.nombre,
      slug: categoria.slug ?? slugCategoria(categoria.nombre),
      productos: productos.filter(producto => producto.categoriaId === categoria.id)
    }));
  }
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
