import { ErrorApi } from '../utilidades/api'
import { adaptarCategoria, adaptarProducto } from './adaptadorCatalogo'

const CAMPOS_PRODUCTO = ['codigo', 'nombre', 'descripcion', 'precioResidencial', 'precioComercial',
  'stock', 'activo', 'categoriaId', 'precioOferta', 'etiquetaOferta', 'stockCritico', 'unidad', 'imagen']
const OBLIGATORIOS = ['codigo', 'nombre', 'precioResidencial', 'precioComercial', 'stock', 'activo', 'categoriaId', 'unidad']
const OPCIONALES = ['descripcion', 'precioOferta', 'etiquetaOferta', 'stockCritico', 'imagen']
const esId = valor => Number.isSafeInteger(valor) && valor > 0
const entero = valor => Number.isInteger(valor) && valor >= 0 && valor <= 2147483647
function exigir(condicion, mensaje = 'Datos administrativos incompletos o inválidos.') {
  if (!condicion) throw new Error(mensaje)
}
function objeto(datos, permitidos) {
  exigir(datos && Object.getPrototypeOf(datos) === Object.prototype)
  exigir(Object.keys(datos).every(campo => permitidos.includes(campo)), 'La solicitud contiene campos no permitidos.')
}
function texto(valor, maximo, obligatorio = false) {
  return (!obligatorio && valor === null) || (typeof valor === 'string' && valor.length <= maximo
    && (!obligatorio || valor.trim().length > 0))
}
function importe(valor) {
  const centavos = valor * 100
  return typeof valor === 'number' && Number.isFinite(valor) && valor >= 0
    && Number.isSafeInteger(Math.round(centavos)) && Math.abs(centavos - Math.round(centavos)) < 0.000001
}
function productoSolicitud(datos, edicion) {
  objeto(datos, edicion ? [...CAMPOS_PRODUCTO, 'versionEsperada'] : CAMPOS_PRODUCTO)
  exigir(OBLIGATORIOS.every(campo => Object.hasOwn(datos, campo)))
  // Un PUT completo no puede borrar ofertas u opcionales por omisión accidental.
  if (edicion) exigir(OPCIONALES.every(campo => Object.hasOwn(datos, campo)), 'El PUT requiere todos los campos opcionales explícitos; utiliza null para retirarlos.')
  const cuerpo = Object.fromEntries(CAMPOS_PRODUCTO.map(campo => [campo, Object.hasOwn(datos, campo) ? datos[campo] : null]))
  if (edicion) {
    exigir(Number.isSafeInteger(datos.versionEsperada) && datos.versionEsperada >= 0,
      'La edición requiere versionEsperada válida de la lectura original. Recarga los datos antes de editar.')
    cuerpo.versionEsperada = datos.versionEsperada
  }
  exigir(texto(cuerpo.codigo, 255, true) && texto(cuerpo.nombre, 255, true) && texto(cuerpo.unidad, 255, true))
  exigir(texto(cuerpo.descripcion, 255) && texto(cuerpo.etiquetaOferta, 255) && texto(cuerpo.imagen, 2048))
  exigir(importe(cuerpo.precioResidencial) && importe(cuerpo.precioComercial)
    && (cuerpo.precioOferta === null || importe(cuerpo.precioOferta)))
  exigir(entero(cuerpo.stock) && (cuerpo.stockCritico === null || entero(cuerpo.stockCritico)))
  exigir(typeof cuerpo.activo === 'boolean' && esId(cuerpo.categoriaId))
  return cuerpo
}
function categoriaSolicitud(datos, edicion) {
  objeto(datos, ['nombre', 'descripcion'])
  exigir(Object.hasOwn(datos, 'nombre'))
  if (edicion) exigir(Object.hasOwn(datos, 'descripcion'), 'El PUT requiere descripcion explícita; utiliza null para retirarla.')
  const cuerpo = { nombre: datos.nombre, descripcion: Object.hasOwn(datos, 'descripcion') ? datos.descripcion : null }
  exigir(texto(cuerpo.nombre, 255, true) && texto(cuerpo.descripcion, 255))
  return cuerpo
}
function validarRespuesta(datos, adaptar, id) {
  try {
    const respuesta = adaptar(datos)
    if (adaptar === adaptarProducto && !(Number.isSafeInteger(respuesta.version) && respuesta.version >= 0)) {
      throw new Error('Falta version de producto')
    }
    if (id !== undefined && respuesta.id !== id) throw new Error('ID distinto')
    return respuesta
  } catch {
    throw new ErrorApi(502, 'Respuesta administrativa incompleta o inconsistente. Verifica el resultado antes de repetir la operación.')
  }
}

// Recibir llamarApi del contexto actual: sesión gestiona JWT, renovación y 401.
// Recrear este cliente si cambia llamarApi. No leer tokens ni persistir respuestas.
// No reintentar automáticamente escrituras, especialmente POST sin idempotencia.
// La interfaz debe conservar el formulario ante errores y recargar tras requiereRecarga.
// versionEsperada siempre procede de la lectura original, nunca de un GET automático al guardar.
export function crearClienteCatalogoAdmin({ llamarApi } = {}) {
  exigir(typeof llamarApi === 'function', 'Se requiere llamarApi de la sesión actual.')
  async function ejecutar(ruta, opciones) {
    try { return await llamarApi(ruta, opciones) } catch (error) {
      if (error.estado !== 409) throw error
      const conflicto = new ErrorApi(409, error.message + ' Recarga los datos antes de volver a editar; conserva el formulario.')
      conflicto.requiereRecarga = true
      throw conflicto
    }
  }
  async function guardar(tipo, datos, id) {
    if (id !== undefined) exigir(esId(id), 'El ID debe ser un entero positivo seguro.')
    const producto = tipo === 'productos'
    const cuerpo = producto ? productoSolicitud(datos, id !== undefined) : categoriaSolicitud(datos, id !== undefined)
    const respuesta = await ejecutar('/' + tipo + (id === undefined ? '' : '/' + id), {
      metodo: id === undefined ? 'POST' : 'PUT', cuerpo, estadoEsperado: id === undefined ? 201 : 200
    })
    const validada = validarRespuesta(respuesta, producto ? adaptarProducto : adaptarCategoria, id)
    if (producto && id !== undefined && validada.version < cuerpo.versionEsperada) {
      throw new ErrorApi(502, 'La respuesta contiene una versión anterior. Verifica el resultado antes de repetir.')
    }
    return validada
  }
  async function eliminar(tipo, id) {
    exigir(esId(id), 'El ID debe ser un entero positivo seguro.')
    const respuesta = await ejecutar('/' + tipo + '/' + id, { metodo: 'DELETE', estadoEsperado: 204 })
    if (respuesta !== null) throw new ErrorApi(502, 'Respuesta de eliminación inesperada. Verifica el resultado antes de repetir.')
    return null
  }
  return {
    crearProducto: datos => guardar('productos', datos),
    editarProducto: (id, datos) => {
      exigir(esId(id), 'El ID debe ser un entero positivo seguro.')
      return guardar('productos', datos, id)
    },
    eliminarProducto: id => eliminar('productos', id),
    cambiarEstadoProducto: async (id, activo) => {
      exigir(esId(id), 'El ID debe ser un entero positivo seguro.')
      exigir(typeof activo === 'boolean', 'activo debe ser booleano explícito.')
      const datos = await ejecutar('/productos/' + id + '/estado', {
        metodo: 'PUT', cuerpo: { activo }, estadoEsperado: 200
      })
      const respuesta = validarRespuesta(datos, adaptarProducto, id)
      if (respuesta.activo !== activo) throw new ErrorApi(502, 'El estado recibido no coincide con el solicitado. Verifica el resultado antes de repetir.')
      return respuesta
    },
    crearCategoria: datos => guardar('categorias', datos),
    editarCategoria: (id, datos) => {
      exigir(esId(id), 'El ID debe ser un entero positivo seguro.')
      return guardar('categorias', datos, id)
    },
    eliminarCategoria: id => eliminar('categorias', id),
  }
}
