// Datos exclusivamente de prueba: el proveedor de producción no importa este archivo.
import { PRODUCTOS } from '../datos/productos'
import { OFERTAS } from '../datos/ofertas'
import { simularApi } from './api'

export const CATEGORIAS_HTTP = [...new Set(PRODUCTOS.map(p => p.categoria))]
  .map((nombre, i) => ({ id: i + 1, nombre, descripcion: null }))
export const PRODUCTOS_HTTP = PRODUCTOS.map(producto => {
  const oferta = OFERTAS.find(o => o.codigo === producto.codigo)
  return { ...producto, version: 0,
    categoria: CATEGORIAS_HTTP.find(c => c.nombre === producto.categoria),
    precioOferta: oferta?.precioOferta ?? null, etiquetaOferta: oferta?.etiqueta ?? null }
})

export function simularCatalogoHttp(rutas = {}) {
  return simularApi({
    'GET /productos': () => [200, PRODUCTOS_HTTP],
    'GET /categorias': () => [200, CATEGORIAS_HTTP],
    ...rutas
  })
}
