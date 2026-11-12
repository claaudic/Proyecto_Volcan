import { beforeEach, describe, expect, it, vi } from 'vitest'
import { crearClienteCatalogoAdmin } from './catalogoAdminApi'
import { pedir, API_URL, ErrorApi, SIN_CONEXION } from '../utilidades/api'
import { simularApi } from '../test/api'

const categoria = { id: 71, nombre: 'Categoría HTTP', descripcion: 'Descripción original' }
const producto = { id: 901, codigo: 'CL002', nombre: 'Producto HTTP', descripcion: 'Texto original',
  precioResidencial: 220.25, precioComercial: 200, stock: 3, activo: true, categoria,
  precioOferta: 190.5, etiquetaOferta: 'Oferta original', stockCritico: 2, unidad: 'Unidad', imagen: '/img/original.jpg', version: 7 }
function datosProducto(edicion = false) {
  const campos = Object.fromEntries(Object.entries(producto).filter(([campo]) => !['id', 'categoria', 'version'].includes(campo)))
  return { ...campos, categoriaId: 71, ...(edicion ? { versionEsperada: producto.version } : {}) }
}
const datosCategoria = () => ({ nombre: categoria.nombre, descripcion: categoria.descripcion })
// Solo el sustituto de sesión de las pruebas conoce este valor ficticio.
const llamarApi = (ruta, opciones) => pedir(ruta, { ...opciones, token: 'jwt-administrador-sintetico' })
const cliente = () => crearClienteCatalogoAdmin({ llamarApi })
const operaciones = ['crearProducto', 'editarProducto', 'eliminarProducto', 'crearCategoria', 'editarCategoria', 'eliminarCategoria', 'cambiarEstadoProducto']
function parametros(operacion) {
  if (operacion === 'cambiarEstadoProducto') return [901, true]
  const datos = operacion.endsWith('Producto') ? datosProducto(operacion.startsWith('editar')) : datosCategoria()
  return operacion.startsWith('crear') ? [datos] : operacion.startsWith('editar') ? [operacion.endsWith('Producto') ? 901 : 71, datos]
    : [operacion.endsWith('Producto') ? 901 : 71]
}
function ruta(operacion) {
  if (operacion === 'cambiarEstadoProducto') return 'PUT /productos/901/estado'
  return (operacion.startsWith('crear') ? 'POST ' : operacion.startsWith('editar') ? 'PUT ' : 'DELETE ')
    + (operacion.endsWith('Producto') ? '/productos' : '/categorias')
    + (operacion.startsWith('crear') ? '' : operacion.endsWith('Producto') ? '/901' : '/71')
}
beforeEach(() => { localStorage.clear(); sessionStorage.clear() })

describe('Cliente HTTP administrativo aislado', () => {
  it.each(['crearProducto', 'editarProducto'])('%s acepta exactamente 255 caracteres de descripción', async operacion => {
    const descripcion = 'á'.repeat(255)
    const entrada = { ...datosProducto(operacion === 'editarProducto'), descripcion }
    const api = simularApi({ [ruta(operacion)]: () => [operacion === 'crearProducto' ? 201 : 200, { ...producto, descripcion }] })
    const resultado = await cliente()[operacion](...(operacion === 'crearProducto' ? [entrada] : [901, entrada]))
    expect(api).toHaveBeenCalledTimes(1)
    expect(JSON.parse(api.mock.calls[0][1].body).descripcion).toBe(descripcion)
    expect(resultado.descripcion).toBe(descripcion)
  })
  it('no acepta una sesión ausente y no realiza solicitudes al construirlo', () => {
    const api = simularApi({})
    expect(() => crearClienteCatalogoAdmin()).toThrow(/sesión/)
    const c = cliente()
    expect(Object.keys(c).sort()).toEqual([...operaciones].sort())
    expect(c.cambiarEstado).toBeUndefined()
    expect(api).not.toHaveBeenCalled()
  })
  it.each(operaciones)('%s usa método, ID, JWT y código de éxito del contrato', async operacion => {
    const eliminacion = operacion.startsWith('eliminar')
    const esperado = operacion.startsWith('crear') ? 201 : eliminacion ? 204 : 200
    const datos = operacion.endsWith('Producto') ? producto : categoria
    const api = simularApi({ [ruta(operacion)]: () => [esperado, eliminacion ? null : datos] })
    const respuesta = await cliente()[operacion](...parametros(operacion))
    const [url, opciones] = api.mock.calls[0]
    expect(api).toHaveBeenCalledTimes(1)
    expect(url).toBe(API_URL + ruta(operacion).split(' ')[1])
    expect(opciones.method).toBe(ruta(operacion).split(' ')[0])
    expect(opciones.headers.Authorization).toBe('Bearer jwt-administrador-sintetico')
    if (eliminacion) expect(opciones.body).toBeUndefined()
    else expect(JSON.parse(opciones.body)).toEqual(operacion === 'cambiarEstadoProducto' ? { activo: true }
      : operacion.endsWith('Producto') ? datosProducto(operacion.startsWith('editar')) : datosCategoria())
    expect(respuesta === null ? null : respuesta.id).toBe(eliminacion ? null : datos.id)
    expect(localStorage.length).toBe(0)
    expect(sessionStorage.length).toBe(0)
  })
  it('PUT conserva stock, categoría, ofertas y cada opcional, sin mutar el cuerpo original', async () => {
    const entrada = Object.freeze({ ...datosProducto(true), nombre: 'Nombre editado' })
    const api = simularApi({ 'PUT /productos/901': () => [200, { ...producto, nombre: entrada.nombre }] })
    await cliente().editarProducto(901, entrada)
    expect(JSON.parse(api.mock.calls[0][1].body)).toEqual(entrada)
    expect(entrada).toEqual({ ...datosProducto(true), nombre: 'Nombre editado' })
  })
  it('permite retirar opcionales explícitamente con null, sin inventar valores', async () => {
    const entrada = { ...datosProducto(true), descripcion: null, precioOferta: null, etiquetaOferta: null, stockCritico: null, imagen: null }
    const api = simularApi({ 'PUT /productos/901': () => [200, { ...producto, ...entrada }] })
    await cliente().editarProducto(901, entrada)
    expect(JSON.parse(api.mock.calls[0][1].body)).toEqual(entrada)
  })
  it.each(['descripcion', 'precioOferta', 'etiquetaOferta', 'stockCritico', 'imagen', 'stock', 'activo', 'categoriaId', 'unidad'])(
    'rechaza PUT sin %s antes de enviar', async campo => {
      const api = simularApi({})
      const datos = datosProducto(true); delete datos[campo]
      await expect(Promise.resolve().then(() => cliente().editarProducto(901, datos))).rejects.toThrow()
      expect(api).not.toHaveBeenCalled()
    })
  it('al crear, opcionales omitidos se envían como null', async () => {
    const datos = datosProducto()
    for (const campo of ['descripcion', 'precioOferta', 'etiquetaOferta', 'stockCritico', 'imagen']) delete datos[campo]
    const api = simularApi({ 'POST /productos': () => [201, producto] })
    await cliente().crearProducto(datos)
    expect(JSON.parse(api.mock.calls[0][1].body)).toMatchObject({ descripcion: null, precioOferta: null, etiquetaOferta: null, stockCritico: null, imagen: null })
  })
  it.each([0, -1, 1.5, '901', null, undefined, Number.MAX_SAFE_INTEGER + 1])('rechaza ID %s sin invocar HTTP', async id => {
    const api = simularApi({})
    for (const metodo of ['editarProducto', 'eliminarProducto', 'editarCategoria', 'eliminarCategoria', 'cambiarEstadoProducto']) {
      await expect(Promise.resolve().then(() => cliente()[metodo](id, metodo.endsWith('Producto') ? datosProducto() : datosCategoria()))).rejects.toThrow(/ID/)
    }
    expect(api).not.toHaveBeenCalled()
  })
  it.each([{ stock: -1 }, { stock: 1.2 }, { stock: 2147483648 }, { activo: 'true' }, { categoriaId: 0 },
    { precioResidencial: NaN }, { precioOferta: -1 }, { precioComercial: 1.234 }, { codigo: '' },
    { nombre: 'x'.repeat(256) }, { descripcion: 'x'.repeat(256) }, { unidad: '' }, { imagen: 'x'.repeat(2049) },
    { token: 'no-permitido' }, { total: 1 }, { precioOferta: undefined }])('valida tipos y campos no permitidos %j', async cambio => {
    const api = simularApi({})
    await expect(cliente().crearProducto({ ...datosProducto(), ...cambio })).rejects.toThrow()
    expect(api).not.toHaveBeenCalled()
  })
  it('categoría exige nombre y PUT con descripción explícita', async () => {
    const api = simularApi({})
    await expect(cliente().crearCategoria({ nombre: '' })).rejects.toThrow()
    await expect(cliente().editarCategoria(71, { nombre: 'Nuevo' })).rejects.toThrow(/descripcion/)
    await expect(cliente().crearCategoria({ nombre: 'Nueva', descripcion: 'x'.repeat(256) })).rejects.toThrow()
    expect(api).not.toHaveBeenCalled()
  })
  it.each(operaciones)('%s propaga errores HTTP sin reintentar ni persistir', async operacion => {
    for (const estado of [400, 401, 403, 404, 409, 500, 503]) {
      const api = simularApi({ [ruta(operacion)]: () => [estado, { mensaje: 'Error administrativo simulado' }] })
      await expect(cliente()[operacion](...parametros(operacion))).rejects.toMatchObject({ estado, message: expect.stringContaining('Error administrativo simulado'),
        ...(estado === 409 ? { requiereRecarga: true } : {}) })
      expect(api).toHaveBeenCalledTimes(1)
      api.mockRestore()
    }
    expect(localStorage.length).toBe(0)
    expect(sessionStorage.length).toBe(0)
  })
  it('propaga el error original de sesión para que el contexto gestione 401', async () => {
    const error = new ErrorApi(401, 'Sesión vencida')
    const sesion = vi.fn().mockRejectedValue(error)
    await expect(crearClienteCatalogoAdmin({ llamarApi: sesion }).eliminarCategoria(71)).rejects.toBe(error)
    expect(sesion).toHaveBeenCalledTimes(1)
  })
  it.each(operaciones)('%s propaga desconexión sin reintento automático', async operacion => {
    const api = simularApi({ [ruta(operacion)]: () => { throw new TypeError('Sin conexión') } })
    await expect(cliente()[operacion](...parametros(operacion))).rejects.toMatchObject({ estado: 0, message: SIN_CONEXION })
    expect(api).toHaveBeenCalledTimes(1)
  })
  it.each(operaciones)('%s rechaza códigos de éxito inesperados', async operacion => {
    const api = simularApi({ [ruta(operacion)]: () => [202, operacion.endsWith('Producto') ? producto : categoria] })
    await expect(cliente()[operacion](...parametros(operacion))).rejects.toMatchObject({ estado: 202 })
    expect(api).toHaveBeenCalledTimes(1)
  })
  it.each(['crearProducto', 'editarProducto', 'crearCategoria', 'editarCategoria'])('%s rechaza respuestas incompletas', async operacion => {
    const api = simularApi({ [ruta(operacion)]: () => [operacion.startsWith('crear') ? 201 : 200, { id: 901 }] })
    await expect(cliente()[operacion](...parametros(operacion))).rejects.toMatchObject({ estado: 502 })
    expect(api).toHaveBeenCalledTimes(1)
  })
  it('rechaza una respuesta PUT con ID distinto sin repetir la escritura', async () => {
    const api = simularApi({ 'PUT /productos/901': () => [200, { ...producto, id: 999 }] })
    await expect(cliente().editarProducto(901, datosProducto(true))).rejects.toMatchObject({ estado: 502 })
    expect(api).toHaveBeenCalledTimes(1)
  })
  it.each([0, 7, Number.MAX_SAFE_INTEGER])('PUT admite versionEsperada %s y no envía version', async versionEsperada => {
    const api = simularApi({ 'PUT /productos/901': () => [200, { ...producto, version: versionEsperada }] })
    const datos = { ...datosProducto(true), versionEsperada }
    const respuesta = await cliente().editarProducto(901, datos)
    expect(JSON.parse(api.mock.calls[0][1].body)).toEqual(datos)
    expect(JSON.parse(api.mock.calls[0][1].body)).not.toHaveProperty('version')
    expect(respuesta.version).toBe(versionEsperada)
  })
  it.each([undefined, null, -1, 0.5, '7', NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])('rechaza versionEsperada inválida %s sin HTTP', async versionEsperada => {
    const api = simularApi({})
    await expect(cliente().editarProducto(901, { ...datosProducto(true), versionEsperada })).rejects.toThrow(/versionEsperada/)
    expect(api).not.toHaveBeenCalled()
  })
  it('rechaza ausencia de versionEsperada y no permite enviarla en creación', async () => {
    const api = simularApi({})
    await expect(cliente().editarProducto(901, datosProducto())).rejects.toThrow(/versionEsperada/)
    await expect(cliente().crearProducto(datosProducto(true))).rejects.toThrow(/no permitidos/)
    expect(api).not.toHaveBeenCalled()
  })
  it.each([false, true])('estado %s envía exclusivamente activo y conserva versión recibida', async activo => {
    const api = simularApi({ 'PUT /productos/901/estado': () => [200, { ...producto, activo, version: 8 }] })
    const resultado = await cliente().cambiarEstadoProducto(901, activo)
    expect(JSON.parse(api.mock.calls[0][1].body)).toEqual({ activo })
    expect(Object.keys(JSON.parse(api.mock.calls[0][1].body))).toEqual(['activo'])
    expect(resultado).toMatchObject({ activo, version: 8, stock: 3, precioOferta: 190.5, categoriaId: 71 })
    expect(api).toHaveBeenCalledTimes(1)
  })
  it.each([null, undefined, 0, 1, 'false', { activo: false, stock: 99 }])('rechaza estado inválido %j sin HTTP', async activo => {
    const api = simularApi({})
    await expect(cliente().cambiarEstadoProducto(901, activo)).rejects.toThrow(/booleano/)
    expect(api).not.toHaveBeenCalled()
  })
  it('un 409 exige recarga y conserva el cuerpo original sin repetir el PUT', async () => {
    const api = simularApi({ 'PUT /productos/901': () => [409, { mensaje: 'El producto cambió.' }] })
    const datos = Object.freeze(datosProducto(true))
    await expect(cliente().editarProducto(901, datos)).rejects.toMatchObject({ estado: 409, requiereRecarga: true,
      message: expect.stringContaining('Recarga los datos') })
    expect(datos).toEqual(datosProducto(true))
    expect(api).toHaveBeenCalledTimes(1)
    expect(api.mock.calls.some(([, opciones]) => opciones.method === 'GET')).toBe(false)
    expect(localStorage.length).toBe(0)
    expect(sessionStorage.length).toBe(0)
  })
  it.each([null, -1, 1.5, '8', undefined, Number.MAX_SAFE_INTEGER + 1])('rechaza versión inválida en respuesta administrativa %s', async version => {
    const api = simularApi({ 'PUT /productos/901/estado': () => [200, { ...producto, version }] })
    await expect(cliente().cambiarEstadoProducto(901, true)).rejects.toMatchObject({ estado: 502 })
    expect(api).toHaveBeenCalledTimes(1)
  })
  it('rechaza respuesta PUT con versión anterior y estado que no coincide', async () => {
    const api = simularApi({ 'PUT /productos/901': () => [200, { ...producto, version: 6 }],
      'PUT /productos/901/estado': () => [200, { ...producto, activo: true }] })
    await expect(cliente().editarProducto(901, datosProducto(true))).rejects.toMatchObject({ estado: 502 })
    await expect(cliente().cambiarEstadoProducto(901, false)).rejects.toMatchObject({ estado: 502 })
    expect(api).toHaveBeenCalledTimes(2)
  })
})
