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

// Para DTO API: nunca consultar la tabla local, ni siquiera si la oferta es nula.
export function ofertaRecibida(producto) {
  const precio = producto?.precioOferta;
  if (typeof precio !== 'number' || !Number.isFinite(precio) || precio < 0) return null;
  return {
    codigo: producto.codigo,
    precioOferta: precio,
    etiqueta: producto.etiquetaOferta ?? ''
  };
}

export function ofertaDeProducto(productoOCodigo) {
  if (productoOCodigo && typeof productoOCodigo === 'object') {
    if (Object.hasOwn(productoOCodigo, 'precioOferta')) return ofertaRecibida(productoOCodigo);
    // Compatibilidad temporal con productos historicos que no tienen precioOferta.
    return OFERTAS.find((oferta) => oferta.codigo === productoOCodigo.codigo) || null;
  }
  // Compatibilidad con consumidores antiguos por codigo; no usar con productos API.
  return OFERTAS.find((oferta) => oferta.codigo === productoOCodigo) || null;
}

export function productoEnOferta(producto) {
  return Boolean(producto && producto.activo !== false && ofertaDeProducto(producto));
}

export function precioProducto(producto) {
  const oferta = producto ? ofertaDeProducto(producto) : null;

  return oferta ? oferta.precioOferta : Number(producto?.precioResidencial || 0);
}

export function productosEnOferta(productos) {
  return productos.filter(productoEnOferta);
}
