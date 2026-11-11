// Un intento por pestana. Tras recargar: leerIntentoCompra() y recuperarIntentoCompra(identidad).
// Recuperar no envia HTTP. El futuro cliente marcara enviado antes de hacer la peticion
// y reutilizara cuerpo y clave. Nunca se guarda el JWT ni se cambia de identidad.
// Sin caducidad automatica: una respuesta perdida podria corresponder a una compra confirmada.
export const CLAVE_INTENTO_COMPRA = 'gasVolcan.intentoCompra.v1'
export const TRANSICIONES_INTENTO = Object.freeze({
  preparado: Object.freeze(['enviado']),
  enviado: Object.freeze(['enviado', 'incierto', 'bloqueado', 'conflicto', 'confirmado']),
  incierto: Object.freeze(['enviado', 'confirmado']),
  bloqueado: Object.freeze(['enviado', 'confirmado']),
  conflicto: Object.freeze(['enviado', 'confirmado']),
  confirmado: Object.freeze(['confirmado']),
})
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const FECHA = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/
const CORREO = /^[^\s@]+@[^\s@]+$/
const TELEFONO = /^[+0-9() -]{6,30}$/
const idValido = valor => Number.isSafeInteger(valor) && valor > 0
function exigir(condicion, mensaje = 'Intento de compra invalido.') {
  if (!condicion) throw new Error(mensaje)
}
function claves(objeto, esperadas) {
  exigir(objeto && Object.getPrototypeOf(objeto) === Object.prototype)
  exigir(Object.keys(objeto).length === esperadas.length && esperadas.every(k => Object.hasOwn(objeto, k)),
    'Campos inesperados o ausentes. No se permiten credenciales ni datos bancarios.')
}
function congelar(objeto) {
  Object.values(objeto).forEach(v => { if (v && typeof v === 'object') congelar(v) })
  return Object.freeze(objeto)
}
function validarIdentidad(identidad) {
  if (identidad?.tipo === 'invitado') claves(identidad, ['tipo'])
  else {
    claves(identidad, ['tipo', 'clienteId', 'rol'])
    exigir(identidad.tipo === 'autenticado' && idValido(identidad.clienteId))
    exigir(typeof identidad.rol === 'string' && /^[A-Z_]{1,40}$/.test(identidad.rol))
  }
}
function texto(valor, maximo) {
  exigir(typeof valor === 'string' && valor.trim().length > 0 && valor.length <= maximo)
}
function validarCuerpo(cuerpo, identidad) {
  const campos = ['clienteId', 'direccion', 'comuna', 'estado', 'repartidorId', 'fecha', 'detalles']
  if (identidad.tipo === 'invitado') campos.push('nombreInvitado', 'correoInvitado', 'telefonoInvitado')
  claves(cuerpo, campos)
  exigir(cuerpo.clienteId === (identidad.tipo === 'invitado' ? null : identidad.clienteId), 'La identidad no coincide con la solicitud.')
  texto(cuerpo.direccion, 300)
  texto(cuerpo.comuna, 100)
  exigir(cuerpo.estado === 'PENDIENTE' && cuerpo.repartidorId === null)
  // LocalDateTime conservado literalmente, sin recalcular ni cambiar zona horaria.
  exigir(typeof cuerpo.fecha === 'string' && FECHA.test(cuerpo.fecha))
  const fecha = new Date(cuerpo.fecha + 'Z')
  exigir(Number.isFinite(fecha.getTime()) && fecha.toISOString().slice(0, 19) === cuerpo.fecha)
  exigir(Array.isArray(cuerpo.detalles) && cuerpo.detalles.length > 0 && cuerpo.detalles.length <= 500)
  cuerpo.detalles.forEach(d => {
    claves(d, ['productoId', 'cantidad'])
    exigir(idValido(d.productoId) && Number.isInteger(d.cantidad) && d.cantidad > 0 && d.cantidad <= 2147483647)
  })
  if (identidad.tipo === 'invitado') {
    texto(cuerpo.nombreInvitado, 150)
    texto(cuerpo.correoInvitado, 254)
    exigir(CORREO.test(cuerpo.correoInvitado))
    exigir(typeof cuerpo.telefonoInvitado === 'string' && TELEFONO.test(cuerpo.telefonoInvitado))
  }
}
function validarRegistro(registro) {
  claves(registro, ['version', 'clave', 'identidad', 'cuerpo', 'estado', 'boletaId'])
  exigir(registro.version === 1 && typeof registro.clave === 'string' && UUID.test(registro.clave))
  exigir(typeof registro.estado === 'string' && Object.hasOwn(TRANSICIONES_INTENTO, registro.estado))
  validarIdentidad(registro.identidad)
  validarCuerpo(registro.cuerpo, registro.identidad)
  exigir(registro.estado === 'confirmado' ? idValido(registro.boletaId) : registro.boletaId === null)
  return congelar(registro)
}
export function leerIntentoCompra() {
  // Fallar cerrado ante almacenamiento inaccesible o corrupto. Nunca reemplazarlo.
  const contenido = sessionStorage.getItem(CLAVE_INTENTO_COMPRA)
  return contenido === null ? null : validarRegistro(JSON.parse(contenido))
}
function guardar(registro) {
  const validado = validarRegistro(registro)
  sessionStorage.setItem(CLAVE_INTENTO_COMPRA, JSON.stringify(validado))
  return validado
}
export function crearIntentoCompra(cuerpo, identidad) {
  exigir(leerIntentoCompra() === null, 'Ya existe un intento. Debe resolverse antes de crear otro.')
  validarIdentidad(identidad)
  validarCuerpo(cuerpo, identidad)
  const copia = JSON.parse(JSON.stringify({ cuerpo, identidad }))
  return guardar({ version: 1, clave: crypto.randomUUID(), ...copia, estado: 'preparado', boletaId: null })
}
export function recuperarIntentoCompra(identidad) {
  validarIdentidad(identidad)
  const intento = leerIntentoCompra()
  exigir(intento, 'No existe un intento guardado.')
  exigir(intento.identidad.tipo === identidad.tipo &&
    (identidad.tipo === 'invitado' || (intento.identidad.clienteId === identidad.clienteId && intento.identidad.rol === identidad.rol)),
  'La identidad cambio. No se puede convertir la compra ni reintentar con otra cuenta.')
  return intento
}
export function cambiarEstadoIntento(clave, estado, { boletaId = null } = {}) {
  const actual = leerIntentoCompra()
  exigir(actual && actual.clave === clave, 'El intento activo no coincide.')
  exigir(TRANSICIONES_INTENTO[actual.estado].includes(estado), 'Transicion de intento no permitida.')
  // Omitir boletaId al repetir una confirmacion conserva el identificador existente.
  const id = actual.estado === 'confirmado' && boletaId === null ? actual.boletaId : boletaId
  exigir(actual.estado !== 'confirmado' || id === actual.boletaId, 'La boleta confirmada no puede cambiar.')
  return guardar({ ...actual, estado, boletaId: id })
}
export function registrarRespuestaIntento(clave, estadoHttp, boletaId = null) {
  exigir(Number.isInteger(estadoHttp) && estadoHttp >= 0 && estadoHttp <= 599)
  // El futuro cliente solo pasara 201 tras validar el cuerpo de la respuesta real.
  // Red/503 y otros errores se conservan sin permitir descartar la operacion.
  const estado = estadoHttp === 201 ? 'confirmado'
    : [401, 403].includes(estadoHttp) ? 'bloqueado'
      : estadoHttp === 409 ? 'conflicto' : 'incierto'
  return cambiarEstadoIntento(clave, estado, { boletaId })
}
export function descartarIntentoCompra(clave) {
  const actual = leerIntentoCompra()
  exigir(actual && actual.clave === clave && ['preparado', 'confirmado'].includes(actual.estado),
    'No se puede descartar una operacion potencialmente confirmada sin resolver.')
  sessionStorage.removeItem(CLAVE_INTENTO_COMPRA)
}
