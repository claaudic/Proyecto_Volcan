import { describe, it, expect, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useCatalogoCheckout } from './useCatalogoCheckout'
import { simularApi } from '../test/api'

const categoria = { id: 91, nombre: 'Categoria de prueba' }
const producto = { id: 901, codigo: 'CL002', nombre: 'Producto oficial', precioResidencial: 220,
  precioComercial: 200, precioOferta: null, stock: 3, activo: true, unidad: 'Unidad', categoria }
const respuesta = datos => ({ ok: true, status: 200, json: async () => datos })

describe('Catalogo aislado de Checkout', () => {
  it('espera ambas respuestas y conserva IDs y precios oficiales', async () => {
    let resolver
    vi.spyOn(globalThis, 'fetch').mockImplementation(url => url.endsWith('/categorias')
      ? new Promise(resolve => { resolver = resolve }) : Promise.resolve(respuesta([producto])))
    const { result } = renderHook(useCatalogoCheckout)
    expect(result.current).toMatchObject({ cargando: true, disponible: false, productos: [] })
    await act(async () => { resolver(respuesta([categoria])) })
    expect(result.current).toMatchObject({ estado: 'disponible', productos: [expect.objectContaining({ id: 901, precioResidencial: 220 })] })
  })
  it('error sin respaldo local y reintento exitoso', async () => {
    let falla = true
    simularApi({ 'GET /productos': () => falla ? [503, { mensaje: 'Sin catalogo' }] : [200, [producto]],
      'GET /categorias': () => [200, [categoria]] })
    const { result } = renderHook(useCatalogoCheckout)
    await waitFor(() => expect(result.current.error).toBe('Sin catalogo'))
    expect(result.current.productos).toEqual([])
    falla = false
    act(() => result.current.recargar())
    expect(result.current).toMatchObject({ cargando: true, disponible: false, productos: [] })
    await waitFor(() => expect(result.current.disponible).toBe(true))
  })
  it('rechaza IDs ausentes mediante el adaptador real', async () => {
    simularApi({ 'GET /productos': () => [200, [{ ...producto, id: undefined }]], 'GET /categorias': () => [200, [categoria]] })
    const { result } = renderHook(useCatalogoCheckout)
    await waitFor(() => expect(result.current.estado).toBe('error'))
    expect(result.current.productos).toEqual([])
  })
  it('oculta datos anteriores inmediatamente al recargar', async () => {
    const api = simularApi({ 'GET /productos': () => [200, [producto]], 'GET /categorias': () => [200, [categoria]] })
    const { result } = renderHook(useCatalogoCheckout)
    await waitFor(() => expect(result.current.disponible).toBe(true))
    api.mockImplementation(() => new Promise(() => {}))
    act(() => result.current.recargar())
    expect(result.current).toMatchObject({ estado: 'cargando', productos: [], categorias: [] })
  })
  it('ignora una respuesta anterior despues de reintentar', async () => {
    let resolverAnterior
    let llamadas = 0
    vi.spyOn(globalThis, 'fetch').mockImplementation(url => {
      if (url.endsWith('/categorias')) return Promise.resolve(respuesta([categoria]))
      llamadas += 1
      return llamadas === 1 ? new Promise(resolve => { resolverAnterior = resolve })
        : Promise.resolve(respuesta([{ ...producto, precioResidencial: 330 }]))
    })
    const { result } = renderHook(useCatalogoCheckout)
    act(() => result.current.recargar())
    await waitFor(() => expect(result.current.productos[0]?.precioResidencial).toBe(330))
    await act(async () => { resolverAnterior(respuesta([producto])) })
    expect(result.current.productos[0].precioResidencial).toBe(330)
  })
  it('ignora respuestas despues de desmontar sin escribir almacenamiento', async () => {
    let resolver
    vi.spyOn(globalThis, 'fetch').mockImplementation(() => new Promise(resolve => { resolver = resolve }))
    const guardar = vi.spyOn(Storage.prototype, 'setItem')
    const { unmount } = renderHook(useCatalogoCheckout)
    unmount()
    await act(async () => { resolver(respuesta([categoria])) })
    expect(guardar).not.toHaveBeenCalled()
  })
})
