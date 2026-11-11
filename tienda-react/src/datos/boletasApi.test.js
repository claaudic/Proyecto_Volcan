import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { pedir, API_URL } from '../utilidades/api'
import { prepararCompra, enviarIntentoCompra } from './boletasApi'
import { leerIntentoCompra, recuperarIntentoCompra } from './intentoCompra'

const usuario = { id: 7, rol: 'CLIENTE' }
const fecha = '2026-11-10T12:30:00'
const productos = [{ id: 71, codigo: 'CL001', activo: true, stock: 9 }, { id: 92, codigo: 'CL002', activo: true, stock: 9 }]
const opciones = () => ({ items: [{ codigo: 'CL001', cantidad: 1 }, { codigo: 'CL002', cantidad: 1 }],
  productos: structuredClone(productos), entrega: { direccion: 'Calle de prueba 123', comuna: 'Temuco' }, usuario, fecha })
const sesion = { usuario, llamarApi: (ruta, opciones) => pedir(ruta, { ...opciones, token: 'token-solo-de-prueba' }) }
function respuesta(clienteId = 7) {
  return { id: 51, clienteId, direccion: 'Calle de prueba 123', comuna: 'Temuco', estado: 'PENDIENTE', repartidorId: null,
    fecha, total: 17000, detalles: [{ id: 101, productoId: 71, cantidad: 1, precio: 6500 }, { id: 102, productoId: 92, cantidad: 1, precio: 10500 }] }
}
function http(status, datos) { return { status, ok: status >= 200 && status < 300, json: async () => datos } }
beforeEach(() => { sessionStorage.clear(); vi.stubGlobal('fetch', vi.fn()); vi.spyOn(crypto, 'randomUUID').mockReturnValue('a1b2c3d4-1111-4222-8333-123456789abc') })
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); sessionStorage.clear() })

describe('Boletas por Gateway con intento persistido', () => {
  it('convierte codigos a IDs reales sin precios ni total', () => {
    const datos = opciones()
    datos.items[0].precio = 1
    datos.entrega.total = 2
    const intento = prepararCompra(datos)
    expect(intento.cuerpo.detalles).toEqual([{ productoId: 71, cantidad: 1 }, { productoId: 92, cantidad: 1 }])
    expect(JSON.stringify(intento.cuerpo)).not.toMatch(/precio|total|stock|descuento|codigo/)
    expect(fetch).not.toHaveBeenCalled()
  })
  it('usa llamarApi, JWT y clave; marca enviado antes del HTTP', async () => {
    const intento = prepararCompra(opciones())
    fetch.mockImplementation(async () => {
      expect(leerIntentoCompra().estado).toBe('enviado')
      return http(201, respuesta())
    })
    const llamarApi = vi.fn(sesion.llamarApi)
    expect(await enviarIntentoCompra(intento.clave, { usuario, llamarApi })).toEqual(respuesta())
    expect(llamarApi).toHaveBeenCalledTimes(1)
    const [url, solicitud] = fetch.mock.calls[0]
    expect(url).toBe(API_URL + '/boletas')
    expect(solicitud.headers.Authorization).toBe('Bearer token-solo-de-prueba')
    expect(solicitud.headers['idempotency-key']).toBe(intento.clave)
    expect(solicitud.body).toBe(JSON.stringify(intento.cuerpo))
    expect(leerIntentoCompra()).toMatchObject({ estado: 'confirmado', boletaId: 51 })
  })
  it('envia invitado sin JWT ni llamarApi autenticado', async () => {
    const intento = prepararCompra({ ...opciones(), usuario: null, invitado: { nombre: 'Persona de prueba', correo: 'prueba@example.com', telefono: '+56912345678' } })
    const llamarApi = vi.fn()
    fetch.mockResolvedValue(http(201, respuesta(null)))
    await enviarIntentoCompra(intento.clave, { llamarApi })
    expect(llamarApi).not.toHaveBeenCalled()
    expect(fetch.mock.calls[0][1].headers.Authorization).toBeUndefined()
  })
  it.each([[400, 'incierto'], [401, 'bloqueado'], [403, 'bloqueado'], [409, 'conflicto'], [503, 'incierto']])(
    'HTTP %s conserva intento como %s', async (estado, esperado) => {
      const intento = prepararCompra(opciones())
      fetch.mockResolvedValue(http(estado, { mensaje: 'Error de prueba' }))
      await expect(enviarIntentoCompra(intento.clave, sesion)).rejects.toMatchObject({ estado })
      expect(fetch).toHaveBeenCalledTimes(1)
      expect(leerIntentoCompra()).toMatchObject({ clave: intento.clave, cuerpo: intento.cuerpo, estado: esperado })
      expect(() => prepararCompra(opciones())).toThrow()
      expect(crypto.randomUUID).toHaveBeenCalledTimes(1)
    })
  it.each(['red', 'timeout', 'respuesta perdida'])('recupera %s sin reconstruir UUID ni cuerpo', async motivo => {
    const datos = opciones()
    const intento = prepararCompra(datos)
    fetch.mockRejectedValueOnce(new Error(motivo)).mockResolvedValueOnce(http(201, respuesta()))
    await expect(enviarIntentoCompra(intento.clave, sesion)).rejects.toMatchObject({ estado: 0 })
    expect(leerIntentoCompra().estado).toBe('incierto')
    datos.productos.forEach(p => { p.stock = 0; p.activo = false })
    await enviarIntentoCompra(recuperarIntentoCompra(intento.identidad).clave, sesion)
    expect(fetch.mock.calls[0][1]).toEqual(fetch.mock.calls[1][1])
    expect(crypto.randomUUID).toHaveBeenCalledTimes(1)
  })
  it('reintenta 503 con la misma solicitud', async () => {
    const intento = prepararCompra(opciones())
    fetch.mockResolvedValueOnce(http(503, {})).mockResolvedValueOnce(http(201, respuesta()))
    await expect(enviarIntentoCompra(intento.clave, sesion)).rejects.toThrow()
    await enviarIntentoCompra(intento.clave, sesion)
    expect(fetch.mock.calls[0][1]).toEqual(fetch.mock.calls[1][1])
  })
  it.each([null, {}, { id: 51 }, { ...respuesta(), total: 1 }, { ...respuesta(), clienteId: 8 },
    { ...respuesta(), detalles: [] }, { ...respuesta(), detalles: [respuesta().detalles[0]] },
    { ...respuesta(), detalles: [{ ...respuesta().detalles[0], precio: -1 }, respuesta().detalles[1]] },
    { ...respuesta(), fecha: '2026-11-11T12:30:00' }, { ...respuesta(), direccion: 'Otra' }])(
    'no confirma respuesta incompleta %#', async datos => {
      const intento = prepararCompra(opciones())
      fetch.mockResolvedValue(http(201, datos))
      await expect(enviarIntentoCompra(intento.clave, sesion)).rejects.toMatchObject({ estado: 502 })
      expect(leerIntentoCompra()).toMatchObject({ estado: 'incierto', boletaId: null })
      expect(fetch).toHaveBeenCalledTimes(1)
    })
  it('JSON perdido despues del 201 permanece incierto', async () => {
    const intento = prepararCompra(opciones())
    fetch.mockResolvedValue({ status: 201, ok: true, json: async () => { throw new Error('cortado') } })
    await expect(enviarIntentoCompra(intento.clave, sesion)).rejects.toThrow()
    expect(leerIntentoCompra().estado).toBe('incierto')
  })
  it('exige HTTP 201', async () => {
    const intento = prepararCompra(opciones())
    fetch.mockResolvedValue(http(200, respuesta()))
    await expect(enviarIntentoCompra(intento.clave, sesion)).rejects.toMatchObject({ estado: 200 })
    expect(leerIntentoCompra().estado).toBe('incierto')
  })
  it('acepta segundos cero omitidos y detalles agrupados', async () => {
    const datos = opciones()
    datos.items.push({ codigo: 'CL001', cantidad: 1 })
    const intento = prepararCompra(datos)
    const r = respuesta()
    r.fecha = '2026-11-10T12:30'
    r.detalles[0].cantidad = 2
    r.total = 23500
    fetch.mockResolvedValue(http(201, r))
    expect((await enviarIntentoCompra(intento.clave, sesion)).id).toBe(51)
  })
  it('valida centavos sin confundir redondeo binario con precio invalido', async () => {
    const intento = prepararCompra(opciones())
    const r = respuesta()
    r.detalles[0].precio = 0.1
    r.detalles[1].precio = 0.2
    r.total = 0.3
    fetch.mockResolvedValue(http(201, r))
    expect((await enviarIntentoCompra(intento.clave, sesion)).total).toBe(0.3)
  })
  it.each([NaN, Infinity, -1, '6500', 1.001, Number.MAX_SAFE_INTEGER])('rechaza importe no representable %s', async precio => {
    const intento = prepararCompra(opciones())
    const r = respuesta()
    r.detalles[0].precio = precio
    fetch.mockResolvedValue(http(201, r))
    await expect(enviarIntentoCompra(intento.clave, sesion)).rejects.toThrow()
    expect(leerIntentoCompra().estado).toBe('incierto')
  })
  it('no cambia de identidad tras 401', async () => {
    const intento = prepararCompra(opciones())
    fetch.mockResolvedValue(http(401, {}))
    await expect(enviarIntentoCompra(intento.clave, sesion)).rejects.toThrow()
    await expect(enviarIntentoCompra(intento.clave)).rejects.toThrow('identidad')
    await expect(enviarIntentoCompra(intento.clave, { ...sesion, usuario: { ...usuario, id: 8 } })).rejects.toThrow('identidad')
    expect(fetch).toHaveBeenCalledTimes(1)
  })
  it('requiere llamarApi para autenticado', async () => {
    const intento = prepararCompra(opciones())
    await expect(enviarIntentoCompra(intento.clave, { usuario })).rejects.toThrow('llamarApi')
    expect(fetch).not.toHaveBeenCalled()
  })
  it('no envia si falla persistir enviado', async () => {
    const intento = prepararCompra(opciones())
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('sin espacio') })
    await expect(enviarIntentoCompra(intento.clave, sesion)).rejects.toThrow('sin espacio')
    expect(fetch).not.toHaveBeenCalled()
  })
  it('bloquea envios simultaneos y reenvio de confirmado', async () => {
    const intento = prepararCompra(opciones())
    let resolver
    fetch.mockImplementation(() => new Promise(resolve => { resolver = resolve }))
    const primero = enviarIntentoCompra(intento.clave, sesion)
    await expect(enviarIntentoCompra(intento.clave, sesion)).rejects.toThrow('ya se esta enviando')
    resolver(http(201, respuesta()))
    await primero
    await expect(enviarIntentoCompra(intento.clave, sesion)).rejects.toThrow('ya fue confirmada')
    expect(fetch).toHaveBeenCalledTimes(1)
  })
  it.each(['codigo', 'id', 'cantidad', 'stock', 'activo', 'direccion', 'invitado'])('valida %s antes de enviar', campo => {
    const datos = opciones()
    if (campo === 'codigo') datos.items[0].codigo = 'FALTA'
    if (campo === 'id') delete datos.productos[0].id
    if (campo === 'cantidad') datos.items[0].cantidad = 0
    if (campo === 'stock') datos.productos[0].stock = 0
    if (campo === 'activo') datos.productos[0].activo = false
    if (campo === 'direccion') datos.entrega.direccion = ''
    if (campo === 'invitado') datos.usuario = null
    expect(() => prepararCompra(datos)).toThrow()
    expect(fetch).not.toHaveBeenCalled()
    expect(leerIntentoCompra()).toBeNull()
  })
})
