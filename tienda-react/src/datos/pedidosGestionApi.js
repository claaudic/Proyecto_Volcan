import { ErrorApi } from '../utilidades/api'
import { obtenerCatalogo } from './catalogoApi'

const ESTADOS = Object.freeze({ PENDIENTE: 'Pendiente', EN_CAMINO: 'En camino', ENTREGADO: 'Entregado', CANCELADO: 'Cancelado' })
const id = n => Number.isSafeInteger(n) && n > 0
const versionValida = n => Number.isSafeInteger(n) && n >= 0
const fallo = () => new ErrorApi(502, 'Ocurrió un error inesperado. Intenta de nuevo.')
const exigir = condicion => { if (!condicion) throw fallo() }
const firmaBoleta = b => JSON.stringify([b.id, b.clienteId, b.direccion, b.comuna, b.estado,
  b.repartidorId, b.fecha, b.total,
  b.detalles.map(d => [d.id, d.productoId, d.cantidad, d.precio]).sort((a, b) => a[0] - b[0])])
const centavos = n => {
  exigir(typeof n === 'number' && Number.isFinite(n) && n >= 0)
  const c = Math.round(n * 100)
  exigir(Number.isSafeInteger(c) && Math.abs(n * 100 - c) < 0.000001)
  return c
}

export function validarBoleta(b) {
  exigir(b && id(b.id) && (b.clienteId === null || id(b.clienteId)) && (b.repartidorId === null || id(b.repartidorId)))
  exigir(Object.hasOwn(ESTADOS, b.estado) && typeof b.direccion === 'string' && typeof b.comuna === 'string')
  exigir(typeof b.fecha === 'string' && Number.isFinite(Date.parse(b.fecha)))
  exigir(Array.isArray(b.detalles) && b.detalles.length > 0)
  let suma = 0
  const ids = new Set()
  for (const d of b.detalles) {
    exigir(d && id(d.id) && !ids.has(d.id) && id(d.productoId) && id(d.cantidad))
    ids.add(d.id)
    const subtotal = centavos(d.precio) * d.cantidad
    exigir(Number.isSafeInteger(subtotal))
    suma += subtotal
    exigir(Number.isSafeInteger(suma))
  }
  exigir(suma === centavos(b.total))
  return b
}

function validarGestion(g) {
  validarBoleta(g?.boleta)
  exigir(versionValida(g.version) && g.entrega?.direccion === g.boleta.direccion && g.entrega?.comuna === g.boleta.comuna)
  exigir(g.cliente && ['nombre', 'correo', 'telefono'].every(k => g.cliente[k] === null || typeof g.cliente[k] === 'string'))
  return g
}

function adaptar(g, productos) {
  const b = g.boleta
  return {
    numero: b.id, version: g.version, fecha: b.fecha, estado: ESTADOS[b.estado],
    clienteId: b.clienteId, cliente: g.cliente, entrega: g.entrega,
    repartidor: b.repartidorId === null ? '' : String(b.repartidorId), total: b.total,
    productos: b.detalles.map(d => {
      const p = productos.find(p => p.id === d.productoId)
      return { codigo: p?.codigo ?? String(d.productoId), nombre: p?.nombre ?? 'Producto',
        productoId: d.productoId, cantidad: d.cantidad, precio: d.precio,
        subtotal: Math.round(d.precio * 100) * d.cantidad / 100 }
    }),
    boleta: b,
  }
}

export async function consultarGestion(llamarApi, numero) {
  exigir(id(numero))
  const g = validarGestion(await llamarApi(`/boletas/${numero}/gestion`, { estadoEsperado: 200 }))
  exigir(g.boleta.id === numero)
  return g
}

export async function obtenerPedidos(llamarApi) {
  const [datos, catalogo] = await Promise.all([
    llamarApi('/boletas/gestion', { estadoEsperado: 200 }), obtenerCatalogo(),
  ])
  exigir(Array.isArray(datos))
  const numeros = new Set()
  const pedidos = datos.map(g => {
    validarGestion(g)
    exigir(!numeros.has(g.boleta.id)); numeros.add(g.boleta.id)
    return adaptar(g, catalogo.productos)
  })
  return { pedidos: pedidos.sort((a, b) => Date.parse(b.fecha) - Date.parse(a.fecha)), productos: catalogo.productos }
}

export function aplicarRespuesta(pedido, b, version) {
  validarBoleta(b)
  exigir(b.id === pedido.numero && versionValida(version))
  return { ...pedido, version, boleta: b, estado: ESTADOS[b.estado],
    repartidor: b.repartidorId === null ? '' : String(b.repartidorId) }
}

export function puedeCambiarEstado(actual, destino) {
  return actual === destino || (actual === 'Pendiente' && ['En camino', 'Cancelado'].includes(destino))
    || (actual === 'En camino' && destino === 'Entregado')
}

export async function asignarRepartidor(llamarApi, pedido, repartidorId) {
  exigir(id(pedido.numero) && versionValida(pedido.version) && (repartidorId === null || id(repartidorId)))
  const r = await llamarApi(`/boletas/${pedido.numero}/repartidor`, { metodo: 'PUT',
    cuerpo: { repartidorId, versionEsperada: pedido.version }, estadoEsperado: 200 })
  const actual = aplicarRespuesta(pedido, r?.boleta, r?.version)
  exigir(actual.boleta.repartidorId === repartidorId)
  exigir(firmaBoleta({ ...actual.boleta, repartidorId: pedido.boleta.repartidorId }) === firmaBoleta(pedido.boleta))
  return actual
}

export async function cambiarEstado(llamarApi, pedido, destino, anular = false) {
  exigir(id(pedido.numero) && versionValida(pedido.version) && puedeCambiarEstado(pedido.estado, destino))
  const estado = Object.keys(ESTADOS).find(k => ESTADOS[k] === destino)
  exigir(Boolean(estado) && (!anular || destino === 'Cancelado'))
  const r = await llamarApi(`/boletas/${pedido.numero}/${anular ? 'anulacion' : 'estado'}`, { metodo: 'PUT',
    cuerpo: anular ? { versionEsperada: pedido.version } : { estado }, estadoEsperado: 200 })
  const b = anular ? r?.boleta : r
  validarBoleta(b)
  exigir(b.estado === estado && b.id === pedido.numero)
  exigir(firmaBoleta({ ...b, estado: pedido.boleta.estado }) === firmaBoleta(pedido.boleta))
  return aplicarRespuesta(pedido, b, anular ? r.version : pedido.version + (pedido.estado === destino ? 0 : 1))
}
