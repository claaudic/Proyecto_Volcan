import { describe, it, expect, vi } from 'vitest'
import { obtenerCatalogo } from './catalogoApi'
import { ErrorContratoCatalogo } from './adaptadorCatalogo'
import { API_URL, ErrorApi, SIN_CONEXION } from '../utilidades/api'
import { simularApi } from '../test/api'

const categoria = { id: 91, nombre: 'Categoría HTTP sintética', descripcion: 'Prueba' }
const producto = {
  id: 901, codigo: 'HTTP901', nombre: 'Producto HTTP sintético', descripcion: 'Prueba',
  precioResidencial: 220, precioComercial: 200, precioOferta: null, stock: 3,
  activo: true, categoria, etiquetaOferta: null, stockCritico: null, unidad: 'Unidad', imagen: ''
}
const respuesta = (datos) => ({ ok: true, status: 200, json: async () => datos })

describe('Cliente HTTP de catálogo mediante pedir()', () => {
  it('consulta ambas rutas del Gateway con GET y conserva los IDs del backend', async () => {
    const fetch = simularApi({
      'GET /productos': () => [200, [producto]],
      'GET /categorias': () => [200, [categoria]]
    })
    const resultado = await obtenerCatalogo()
    expect(fetch).toHaveBeenCalledTimes(2)
    expect(fetch).toHaveBeenCalledWith(API_URL + '/productos', expect.objectContaining({ method: 'GET', body: undefined }))
    expect(fetch).toHaveBeenCalledWith(API_URL + '/categorias', expect.objectContaining({ method: 'GET', body: undefined }))
    expect(resultado.productos[0]).toMatchObject({ id: 901, codigo: 'HTTP901', categoriaId: 91, precioOferta: null })
    expect(resultado.categorias[0].id).toBe(91)
  })

  it('no lee ni escribe un catálogo manipulado en localStorage', async () => {
    localStorage.setItem('productosSistema', JSON.stringify([{ ...producto, precioResidencial: 1 }]))
    const leer = vi.spyOn(Storage.prototype, 'getItem')
    const guardar = vi.spyOn(Storage.prototype, 'setItem')
    simularApi({ 'GET /productos': () => [200, [producto]], 'GET /categorias': () => [200, [categoria]] })
    expect((await obtenerCatalogo()).productos[0].precioResidencial).toBe(220)
    expect(leer).not.toHaveBeenCalled()
    expect(guardar).not.toHaveBeenCalled()
  })

  it.each(['/productos', '/categorias'])('propaga el error HTTP de %s sin datos locales de respaldo', async (ruta) => {
    simularApi({
      'GET /productos': () => ruta === '/productos' ? [503, { estado: 503, mensaje: 'Catálogo no disponible' }] : [200, [producto]],
      'GET /categorias': () => ruta === '/categorias' ? [503, { estado: 503, mensaje: 'Catálogo no disponible' }] : [200, [categoria]]
    })
    await expect(obtenerCatalogo()).rejects.toMatchObject({ estado: 503, message: 'Catálogo no disponible' })
  })

  it('propaga la falta de conexión como ErrorApi', async () => {
    const solicitud = obtenerCatalogo()
    await expect(solicitud).rejects.toBeInstanceOf(ErrorApi)
    await expect(solicitud).rejects.toMatchObject({ estado: 0, message: SIN_CONEXION })
  })

  it('rechaza una respuesta exitosa con JSON inválido', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true, status: 200, json: async () => { throw new SyntaxError('JSON inválido') } })
    await expect(obtenerCatalogo()).rejects.toBeInstanceOf(ErrorContratoCatalogo)
  })

  it('espera las dos respuestas antes de publicar un catálogo completo', async () => {
    let resolverCategorias
    const pendiente = new Promise((resolve) => { resolverCategorias = resolve })
    vi.spyOn(globalThis, 'fetch').mockImplementation((url) => url.endsWith('/categorias') ? pendiente : Promise.resolve(respuesta([producto])))
    let terminado = false
    const solicitud = obtenerCatalogo().then((datos) => { terminado = true; return datos })
    await Promise.resolve()
    expect(terminado).toBe(false)
    resolverCategorias(respuesta([categoria]))
    expect((await solicitud).productos).toHaveLength(1)
  })

  it('acepta listas vacías del servidor como resultado real', async () => {
    simularApi({ 'GET /productos': () => [200, []], 'GET /categorias': () => [200, []] })
    await expect(obtenerCatalogo()).resolves.toEqual({ productos: [], categorias: [] })
  })
})
