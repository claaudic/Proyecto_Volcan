import { pedir, ErrorApi } from '../utilidades/api'
import { crearIntentoCompra, recuperarIntentoCompra, cambiarEstadoIntento, registrarRespuestaIntento } from './intentoCompra'

const enCurso = new Set()
const esId = n => Number.isSafeInteger(n) && n > 0
function exigir(condicion, mensaje) { if (!condicion) throw new Error(mensaje) }
function identidadDe(usuario) {
  if (usuario == null) return { tipo: 'invitado' }
  exigir(esId(usuario.id) && typeof usuario.rol === 'string', 'Sesion invalida.')
  return { tipo: 'autenticado', clienteId: usuario.id, rol: usuario.rol }
}
function fechaLocal() {
  const d = new Date()
  const dos = n => String(n).padStart(2, '0')
  return d.getFullYear() + '-' + dos(d.getMonth() + 1) + '-' + dos(d.getDate()) + 'T' + dos(d.getHours()) + ':' + dos(d.getMinutes()) + ':' + dos(d.getSeconds())
}
// Preparar es exclusivo para compras nuevas. Los reintentos no consultan catalogo.
export function prepararCompra({ items, productos, entrega, usuario = null, invitado, fecha = fechaLocal() }) {
  exigir(Array.isArray(items) && items.length > 0 && items.length <= 500 && Array.isArray(productos), 'Carrito o catalogo invalido.')
  const acumuladas = new Map()
  const detalles = items.map(item => {
    exigir(item && typeof item.codigo === 'string', 'Codigo invalido.')
    const encontrados = productos.filter(p => p && p.codigo === item.codigo)
    exigir(encontrados.length === 1, 'Codigo ausente o ambiguo.')
    const p = encontrados[0]
    exigir(esId(p.id) && productos.filter(otro => otro?.id === p.id).length === 1, 'ID real invalido o ambiguo.')
    exigir(Number.isInteger(item.cantidad) && item.cantidad > 0 && item.cantidad <= 2147483647, 'Cantidad invalida.')
    const cantidad = (acumuladas.get(p.id) ?? 0) + item.cantidad
    exigir(cantidad <= 2147483647 && p.activo === true && Number.isInteger(p.stock) && p.stock >= cantidad, 'Producto inactivo o sin stock.')
    acumuladas.set(p.id, cantidad)
    return { productoId: p.id, cantidad: item.cantidad }
  })
  const identidad = identidadDe(usuario)
  const cuerpo = { clienteId: usuario?.id ?? null, direccion: entrega?.direccion, comuna: entrega?.comuna,
    estado: 'PENDIENTE', repartidorId: null, fecha, detalles }
  if (identidad.tipo === 'invitado') Object.assign(cuerpo, {
    nombreInvitado: invitado?.nombre, correoInvitado: invitado?.correo, telefonoInvitado: invitado?.telefono,
  })
  return crearIntentoCompra(cuerpo, identidad)
}
function centavos(valor) {
  if (typeof valor !== 'number' || !Number.isFinite(valor) || valor < 0) return null
  const escalado = valor * 100
  const redondeado = Math.round(escalado)
  return Number.isSafeInteger(redondeado) && Math.abs(escalado - redondeado) < 0.000001 ? redondeado : null
}
function validarRespuesta(r, cuerpo) {
  const fallo = () => { throw new ErrorApi(502, 'Respuesta de boleta incompleta o inconsistente. Resultado sin resolver.') }
  if (!r || !esId(r.id) || r.clienteId !== cuerpo.clienteId ||
      r.direccion !== cuerpo.direccion.trim() || r.comuna !== cuerpo.comuna.trim() ||
      !['PENDIENTE', 'EN_CAMINO', 'ENTREGADO', 'CANCELADO'].includes(r.estado) ||
      !(r.repartidorId === null || esId(r.repartidorId)) ||
      typeof r.fecha !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(r.fecha) ||
      Date.parse(r.fecha + 'Z') !== Date.parse(cuerpo.fecha + 'Z') ||
      !Array.isArray(r.detalles) || r.detalles.length === 0 || centavos(r.total) === null) fallo()
  const esperados = new Map()
  cuerpo.detalles.forEach(d => esperados.set(d.productoId, (esperados.get(d.productoId) ?? 0) + d.cantidad))
  const ids = new Set()
  let suma = 0
  for (const d of r.detalles) {
    if (!d || !esId(d.id) || ids.has(d.id) || !esId(d.productoId) ||
        !Number.isInteger(d.cantidad) || d.cantidad <= 0 || esperados.get(d.productoId) !== d.cantidad || centavos(d.precio) === null) fallo()
    ids.add(d.id)
    esperados.delete(d.productoId)
    const subtotal = centavos(d.precio) * d.cantidad
    if (!Number.isSafeInteger(subtotal)) fallo()
    suma += subtotal
  }
  if (esperados.size !== 0 || !Number.isSafeInteger(suma) || suma !== centavos(r.total)) fallo()
}
// Recibe usuario y llamarApi del contexto de sesion actual, nunca el JWT.
// No navega, vacia el carrito ni modifica el catalogo.
export async function enviarIntentoCompra(clave, { usuario = null, llamarApi } = {}) {
  const intento = recuperarIntentoCompra(identidadDe(usuario))
  exigir(intento.clave === clave, 'El intento activo no coincide.')
  exigir(intento.estado !== 'confirmado', 'La compra ya fue confirmada.')
  exigir(!enCurso.has(clave), 'Este intento ya se esta enviando.')
  const autenticado = intento.identidad.tipo === 'autenticado'
  exigir(!autenticado || typeof llamarApi === 'function', 'Se requiere llamarApi de la sesion.')
  enCurso.add(clave)
  try {
    cambiarEstadoIntento(clave, 'enviado')
    let respuesta
    try {
      const ejecutar = autenticado ? llamarApi : pedir
      respuesta = await ejecutar('/boletas', { metodo: 'POST', cuerpo: intento.cuerpo,
        encabezados: { 'Idempotency-Key': intento.clave }, estadoEsperado: 201 })
      validarRespuesta(respuesta, intento.cuerpo)
    } catch (error) {
      const estado = Number.isInteger(error?.estado) && error.estado >= 0 && error.estado <= 599 ? error.estado : 0
      registrarRespuestaIntento(clave, estado === 201 ? 0 : estado)
      throw error
    }
    // Si persistir falla, queda enviado; recuperar siempre conserva el mismo UUID.
    registrarRespuestaIntento(clave, 201, respuesta.id)
    return respuesta
  } finally {
    enCurso.delete(clave)
  }
}
