export const OFERTAS = [
  {
    codigo: "CL002",
    precioOferta: 10500,
    etiqueta: "Oferta hogar"
  },
  {
    codigo: "CL003",
    precioOferta: 14500,
    etiqueta: "Ahorro familiar"
  },
  {
    codigo: "MG004",
    precioOferta: 10990,
    etiqueta: "Kit recomendado"
  },
  {
    codigo: "AC003",
    precioOferta: 17990,
    etiqueta: "Seguridad"
  }
];

export function ofertaDeProducto(codigo) {
  return OFERTAS.find((oferta) => oferta.codigo === codigo) || null;
}

export function productoEnOferta(producto) {
  return Boolean(producto && producto.activo !== false && ofertaDeProducto(producto.codigo));
}

export function precioProducto(producto) {
  const oferta = producto ? ofertaDeProducto(producto.codigo) : null;

  return oferta ? oferta.precioOferta : Number(producto?.precioResidencial || 0);
}

export function productosEnOferta(productos) {
  return productos.filter(productoEnOferta);
}
