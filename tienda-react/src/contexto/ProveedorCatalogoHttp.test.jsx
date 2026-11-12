import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import ProveedorCatalogo, { ProveedorCatalogoHttp } from './ProveedorCatalogo'
import { useCatalogo } from './catalogoContexto'
import ProveedorCarrito from './ProveedorCarrito'
import { useCarrito } from './carritoContexto'
import { simularApi } from '../test/api'
import { API_URL } from '../utilidades/api'

const categoria = { id: 71, nombre: 'Categoría HTTP' }
const producto = { id: 901, codigo: 'CL002', nombre: 'Producto HTTP', precioResidencial: 220,
  precioComercial: 200, precioOferta: null, stock: 3, activo: true, unidad: 'Unidad', categoria }
const wrapper = ({ children }) => <ProveedorCatalogoHttp>{children}</ProveedorCatalogoHttp>
function diferida() {
  let resolver
  const promesa = new Promise(resolve => { resolver = resolve })
  return { promesa, resolver }
}
function backend(rutas = {}) {
  return simularApi({ 'GET /productos': () => [200, [producto]], 'GET /categorias': () => [200, [categoria]], ...rutas })
}
async function disponible(result) { await waitFor(() => expect(result.current.estado).toBe('disponible')) }
let leer, escribir
beforeEach(() => {
  localStorage.setItem('productosSistema', JSON.stringify([{ ...producto, nombre: 'No usar respaldo local', precioResidencial: 1 }]))
  leer = vi.spyOn(Storage.prototype, 'getItem')
  escribir = vi.spyOn(Storage.prototype, 'setItem')
})
afterEach(() => { vi.restoreAllMocks() })

describe('Proveedor HTTP aislado, sin activación global', () => {
  it('carga ambos recursos mediante el Gateway sin leer ni escribir almacenamiento', async () => {
    const api = backend()
    const { result } = renderHook(useCatalogo, { wrapper })
    expect(result.current).toMatchObject({ estado: 'cargando', cargando: true, disponible: false, vacio: false })
    await disponible(result)
    expect(api.mock.calls.map(([url]) => url).sort()).toEqual([API_URL + '/categorias', API_URL + '/productos'])
    expect(api.mock.calls.every(([, opciones]) => opciones.method === 'GET' && opciones.body === undefined)).toBe(true)
    expect(result.current.productos[0]).toMatchObject({ id: 901, categoria: categoria.nombre, categoriaId: 71, precioOferta: null })
    expect(result.current.categorias[0]).toMatchObject({ id: 71, slug: 'categoria-http' })
    expect(result.current.buscar('CL002')).toEqual(result.current.productos[0])
    expect(result.current.buscar('AUSENTE')).toBeNull()
    expect(result.current.soloLectura).toBe(true)
    for (const metodo of ['crear', 'editar', 'cambiarEstado', 'eliminar', 'descontar']) expect(result.current[metodo]).toBeUndefined()
    expect(leer).not.toHaveBeenCalled()
    expect(escribir).not.toHaveBeenCalled()
  })
  it('publica productos y categorías atómicamente y filtra productos inactivos', async () => {
    const pendiente = diferida()
    backend({ 'GET /productos': () => [200, [producto, { ...producto, id: 902, codigo: 'OTRO', activo: false }]],
      'GET /categorias': () => pendiente.promesa })
    const { result } = renderHook(useCatalogo, { wrapper })
    await act(async () => {})
    expect(result.current.productos).toEqual([])
    expect(result.current.categorias).toEqual([])
    await act(async () => { pendiente.resolver([200, [categoria]]) })
    await disponible(result)
    expect(result.current.productos).toHaveLength(2)
    expect(result.current.activos).toHaveLength(1)
  })
  it('distingue respuesta vacía de error y conserva categorías sin productos', async () => {
    backend({ 'GET /productos': () => [200, []] })
    const { result } = renderHook(useCatalogo, { wrapper })
    await waitFor(() => expect(result.current.estado).toBe('vacio'))
    expect(result.current).toMatchObject({ disponible: true, vacio: true, error: '', cargando: false })
    expect(result.current.categorias).toHaveLength(1)
  })
  it.each([400, 401, 403, 500, 503])('HTTP %s no utiliza respaldo local y permite reintentar', async estado => {
    let falla = true
    const api = backend({ 'GET /productos': () => falla ? [estado, { mensaje: 'Error HTTP simulado' }] : [200, [producto]] })
    const { result } = renderHook(useCatalogo, { wrapper })
    await waitFor(() => expect(result.current.estado).toBe('error'))
    expect(result.current).toMatchObject({ productos: [], activos: [], categorias: [], vacio: false, disponible: false })
    expect(result.current.error).toBe('Error HTTP simulado')
    falla = false
    act(() => { result.current.recargar() })
    await disponible(result)
    expect(api).toHaveBeenCalledTimes(4)
    expect(leer).not.toHaveBeenCalled()
    expect(escribir).not.toHaveBeenCalled()
  })
  it('un error de red no usa productosSistema', async () => {
    backend({ 'GET /categorias': () => { throw new TypeError('Sin red') } })
    const { result } = renderHook(useCatalogo, { wrapper })
    await waitFor(() => expect(result.current.estado).toBe('error'))
    expect(result.current.productos).toEqual([])
    expect(leer).not.toHaveBeenCalled()
    expect(escribir).not.toHaveBeenCalled()
  })
  it.each([
    [null, [categoria]], [[{ ...producto, id: null }], [categoria]],
    [[producto, producto], [categoria]], [[{ ...producto, stock: -1 }], [categoria]],
    [[producto], []], [[producto], [categoria, categoria]],
  ])('rechaza contrato inválido sin publicar datos parciales %#', async (productos, categorias) => {
    backend({ 'GET /productos': () => [200, productos], 'GET /categorias': () => [200, categorias] })
    const { result } = renderHook(useCatalogo, { wrapper })
    await waitFor(() => expect(result.current.estado).toBe('error'))
    expect(result.current.error).toMatch(/formato inesperado/)
    expect(result.current.productos).toEqual([])
    expect(result.current.categorias).toEqual([])
  })
  it('actualiza con una función estable y no ofrece el stock anterior como vigente', async () => {
    const pendiente = diferida()
    let numero = 0
    backend({ 'GET /productos': () => ++numero === 1 ? [200, [producto]] : pendiente.promesa })
    const { result } = renderHook(useCatalogo, { wrapper })
    await disponible(result)
    const recargar = result.current.recargar
    act(() => { recargar() })
    expect(result.current).toMatchObject({ estado: 'actualizando', actualizando: true, cargando: true, disponible: false, productos: [] })
    await act(async () => { pendiente.resolver([200, [{ ...producto, stock: 1, precioResidencial: 330 }]]) })
    await disponible(result)
    expect(result.current.productos[0]).toMatchObject({ stock: 1, precioResidencial: 330 })
    expect(result.current.recargar).toBe(recargar)
  })
  it('si falla una actualización, bloquea datos anteriores hasta un reintento válido', async () => {
    let falla = false
    backend({ 'GET /productos': () => falla ? [503, { mensaje: 'No disponible' }] : [200, [producto]] })
    const { result } = renderHook(useCatalogo, { wrapper })
    await disponible(result)
    falla = true
    act(() => { result.current.recargar() })
    await waitFor(() => expect(result.current.estado).toBe('error'))
    expect(result.current.productos).toEqual([])
    expect(result.current.buscar('CL002')).toBeNull()
    falla = false
    act(() => { result.current.recargar() })
    await disponible(result)
  })
  it('ignora respuestas antiguas después de una recarga más reciente', async () => {
    const vieja = diferida()
    let numero = 0
    backend({ 'GET /productos': () => ++numero === 1 ? vieja.promesa : [200, [{ ...producto, stock: 2 }]] })
    const { result } = renderHook(useCatalogo, { wrapper })
    act(() => { result.current.recargar() })
    await disponible(result)
    await act(async () => { vieja.resolver([200, [{ ...producto, stock: 100 }]]) })
    expect(result.current.productos[0].stock).toBe(2)
  })
  it('ignora respuestas tras desmontar sin escribir almacenamiento', async () => {
    const pendiente = diferida()
    const api = backend({ 'GET /productos': () => pendiente.promesa })
    const { unmount } = renderHook(useCatalogo, { wrapper })
    unmount()
    await act(async () => { pendiente.resolver([200, [producto]]) })
    expect(api).toHaveBeenCalledTimes(2)
    expect(escribir).not.toHaveBeenCalled()
  })
  it('conserva validación, cantidades y persistencia del carrito durante carga y error', async () => {
    localStorage.setItem('carritoVolcan', JSON.stringify([{ codigo: 'CL002', cantidad: 2 }]))
    const pendiente = diferida()
    let numero = 0
    backend({ 'GET /productos': () => ++numero === 1 ? pendiente.promesa : [503, { mensaje: 'Catálogo caído' }] })
    const proveedor = ({ children }) => <ProveedorCatalogoHttp><ProveedorCarrito>{children}</ProveedorCarrito></ProveedorCatalogoHttp>
    const { result } = renderHook(() => ({ catalogo: useCatalogo(), carrito: useCarrito() }), { wrapper: proveedor })
    expect(result.current.carrito.puedeConfirmar).toBe(false)
    act(() => { expect(result.current.carrito.agregar('CL002', 1).ok).toBe(false) })
    await act(async () => { pendiente.resolver([200, [producto]]) })
    await waitFor(() => expect(result.current.carrito.puedeConfirmar).toBe(true))
    act(() => { expect(result.current.carrito.agregar('CL002', 2).ok).toBe(false) })
    act(() => { result.current.catalogo.recargar() })
    expect(result.current.carrito.puedeConfirmar).toBe(false)
    await waitFor(() => expect(result.current.catalogo.estado).toBe('error'))
    expect(result.current.carrito.items).toEqual([{ codigo: 'CL002', cantidad: 2 }])
    expect(JSON.parse(localStorage.getItem('carritoVolcan'))).toEqual(result.current.carrito.items)
    expect(escribir.mock.calls.some(([clave]) => clave === 'productosSistema')).toBe(false)
  })
  it('la exportación predeterminada conserva el comportamiento local y no activa HTTP', () => {
    const api = backend()
    const local = ({ children }) => <ProveedorCatalogo>{children}</ProveedorCatalogo>
    const { result } = renderHook(useCatalogo, { wrapper: local })
    expect(typeof result.current.crear).toBe('function')
    expect(result.current.productos[0].nombre).toBe('No usar respaldo local')
    expect(api).not.toHaveBeenCalled()
  })
})
