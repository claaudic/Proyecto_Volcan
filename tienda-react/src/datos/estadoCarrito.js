import { detalleDelCarrito } from './carrito'

// Estado de lectura; no muta articulos ni almacenamiento y no reserva stock.
// Sin cargando/error se conserva la compatibilidad con el proveedor local actual.
export function estadoDelCarrito(items, catalogo, { cargando = false, error = '' } = {}) {
  const vacio = items.length === 0
  const pendientes = { lineas: [], total: null, unidades: items.reduce((total, item) => total + item.cantidad, 0) }
  if (cargando) return { estado: 'cargando', vacio, puedeConfirmar: false, detalle: pendientes }
  if (error) return { estado: 'error', vacio, puedeConfirmar: false, detalle: pendientes }
  if (vacio) return { estado: 'vacio', vacio: true, puedeConfirmar: false, detalle: detalleDelCarrito([], catalogo) }

  const cantidades = new Map()
  for (const item of items) cantidades.set(item.codigo, (cantidades.get(item.codigo) || 0) + item.cantidad)
  const verificables = items.every((item) => {
    const producto = catalogo.find((p) => p.codigo === item.codigo)
    return producto && producto.activo !== false && Number.isSafeInteger(item.cantidad) && item.cantidad > 0
      && Number.isSafeInteger(producto.stock) && producto.stock >= cantidades.get(item.codigo)
      && typeof producto.precioResidencial === 'number' && Number.isFinite(producto.precioResidencial)
      && producto.precioResidencial >= 0
      && (!Object.hasOwn(producto, 'precioOferta') || producto.precioOferta === null
        || (typeof producto.precioOferta === 'number' && Number.isFinite(producto.precioOferta) && producto.precioOferta >= 0))
  })
  if (!verificables) return { estado: 'no-disponible', vacio: false, puedeConfirmar: false, detalle: pendientes }
  // El unico calculo monetario sigue siendo el existente; incluye precioProducto.
  const detalle = detalleDelCarrito(items, catalogo)
  if (!Number.isFinite(detalle.total)) return { estado: 'no-disponible', vacio: false, puedeConfirmar: false, detalle: pendientes }
  return { estado: 'listo', vacio: false, puedeConfirmar: true, detalle }
}
