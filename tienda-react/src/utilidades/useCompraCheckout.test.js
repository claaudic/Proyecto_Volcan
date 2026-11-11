import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useCompraCheckout } from './useCompraCheckout'
import { prepararCompra } from '../datos/boletasApi'
import { CLAVE_INTENTO_COMPRA, leerIntentoCompra, cambiarEstadoIntento, registrarRespuestaIntento } from '../datos/intentoCompra'
import { pedir } from './api'
import { simularApi } from '../test/api'

const usuario = { id: 7, rol: 'CLIENTE' }
const identidad = { tipo: 'autenticado', clienteId: 7, rol: 'CLIENTE' }
const UUID = 'a1b2c3d4-1111-4222-8333-123456789abc'
const datos = () => ({ items: [{ codigo: 'PRUEBA', cantidad: 2 }],
  productos: [{ id: 71, codigo: 'PRUEBA', activo: true, stock: 4 }],
  entrega: { direccion: 'Calle de prueba 123', comuna: 'Temuco' },
  invitado: { nombre: 'Persona de prueba', correo: 'prueba@example.com', telefono: '+56912345678' },
  fecha: '2026-11-10T12:30:00' })
const llamarApi = (ruta, opciones) => pedir(ruta, { ...opciones, token: 'token-ficticio' })
const boleta = clienteId => ({ id: 51, clienteId, direccion: 'Calle de prueba 123', comuna: 'Temuco',
  fecha: '2026-11-10T12:30:00', estado: 'PENDIENTE', repartidorId: null, total: 440,
  detalles: [{ id: 101, productoId: 71, cantidad: 2, precio: 220 }] })
beforeEach(() => {
  sessionStorage.clear()
  vi.spyOn(crypto, 'randomUUID').mockReturnValue(UUID)
})
afterEach(() => { vi.restoreAllMocks(); sessionStorage.clear() })

describe('Preparacion y recuperacion aisladas de Checkout', () => {
  it('no prepara ni envia automaticamente al montar o renderizar de nuevo', () => {
    const api = simularApi({})
    const hook = renderHook(() => useCompraCheckout())
    hook.rerender()
    expect(hook.result.current).toMatchObject({ estado: 'sin-intento', puedePreparar: true, puedeEnviar: false })
    expect(api).not.toHaveBeenCalled()
    expect(crypto.randomUUID).not.toHaveBeenCalled()
  })
  it.each([null, usuario])('prepara y envia explicitamente con identidad %j', async cuenta => {
    const api = simularApi({ 'POST /boletas': () => [201, boleta(cuenta?.id ?? null)] })
    const { result } = renderHook(() => useCompraCheckout({ usuario: cuenta, llamarApi }))
    act(() => { result.current.preparar(datos()) })
    expect(result.current).toMatchObject({ estado: 'preparado', puedePreparar: false, puedeEnviar: true })
    expect(api).not.toHaveBeenCalled()
    let respuesta
    await act(async () => { respuesta = await result.current.enviar() })
    expect(respuesta.id).toBe(51)
    expect(result.current).toMatchObject({ estado: 'confirmado', boletaId: 51, puedeEnviar: false })
    const opciones = api.mock.calls[0][1]
    expect(opciones.headers.Authorization).toBe(cuenta ? 'Bearer token-ficticio' : undefined)
    expect(opciones.headers['idempotency-key']).toBe(UUID)
  })
  it.each(['preparado', 'enviado', 'incierto', 'bloqueado', 'conflicto', 'confirmado'])(
    'detecta %s al recargar sin enviar ni reemplazar', estado => {
      prepararCompra({ ...datos(), usuario })
      if (estado !== 'preparado') cambiarEstadoIntento(UUID, 'enviado')
      if (!['preparado', 'enviado'].includes(estado)) cambiarEstadoIntento(UUID, estado, { boletaId: estado === 'confirmado' ? 51 : null })
      const original = sessionStorage.getItem(CLAVE_INTENTO_COMPRA)
      const api = simularApi({})
      const { result, unmount } = renderHook(() => useCompraCheckout({ usuario, llamarApi }))
      expect(result.current.estado).toBe(estado)
      expect(result.current.puedePreparar).toBe(false)
      expect(() => result.current.preparar(datos())).toThrow()
      unmount()
      const recargado = renderHook(() => useCompraCheckout({ usuario, llamarApi }))
      expect(recargado.result.current.intento.cuerpo).toEqual(leerIntentoCompra().cuerpo)
      expect(sessionStorage.getItem(CLAVE_INTENTO_COMPRA)).toBe(original)
      expect(api).not.toHaveBeenCalled()
      expect(crypto.randomUUID).toHaveBeenCalledTimes(1)
    })
  it.each([[400, 'incierto'], [401, 'bloqueado'], [403, 'bloqueado'], [409, 'conflicto'], [503, 'incierto']])(
    'conserva HTTP %s como %s', async (estado, esperado) => {
      const api = simularApi({ 'POST /boletas': () => [estado, { mensaje: 'Error de prueba' }] })
      const { result } = renderHook(() => useCompraCheckout({ usuario, llamarApi }))
      act(() => { result.current.preparar(datos()) })
      const original = result.current.intento
      await act(async () => { await expect(result.current.enviar()).rejects.toMatchObject({ estado }) })
      expect(result.current).toMatchObject({ estado: esperado, puedePreparar: false, intento: { clave: original.clave, cuerpo: original.cuerpo } })
      expect(api).toHaveBeenCalledTimes(1)
    })
  it('recupera desconexion tras recargar sin consultar catalogo ni regenerar fecha o UUID', async () => {
    const api = simularApi({ 'POST /boletas': () => { throw new Error('respuesta perdida') } })
    const primero = renderHook(() => useCompraCheckout({ usuario, llamarApi }))
    act(() => { primero.result.current.preparar(datos()) })
    const original = primero.result.current.intento
    await act(async () => { await expect(primero.result.current.enviar()).rejects.toThrow() })
    primero.unmount()
    api.mockResolvedValue({ status: 201, ok: true, json: async () => boleta(7) })
    const segundo = renderHook(() => useCompraCheckout({ usuario, llamarApi }))
    expect(segundo.result.current.estado).toBe('incierto')
    expect(api).toHaveBeenCalledTimes(1)
    await act(async () => { await segundo.result.current.enviar() })
    expect(api).toHaveBeenCalledTimes(2)
    expect(api.mock.calls[0][1]).toEqual(api.mock.calls[1][1])
    expect(segundo.result.current.intento.cuerpo).toEqual(original.cuerpo)
    expect(crypto.randomUUID).toHaveBeenCalledTimes(1)
  })
  it('no confirma una respuesta incompleta', async () => {
    simularApi({ 'POST /boletas': () => [201, { id: 51 }] })
    const { result } = renderHook(() => useCompraCheckout())
    act(() => { result.current.preparar(datos()) })
    await act(async () => { await expect(result.current.enviar()).rejects.toThrow() })
    expect(result.current).toMatchObject({ estado: 'incierto', boleta: null, boletaId: null })
  })
  it('bloquea identidad ajena sin exponer el cuerpo', async () => {
    prepararCompra({ ...datos(), usuario })
    const api = simularApi({})
    const { result, rerender } = renderHook(props => useCompraCheckout(props), { initialProps: { usuario, llamarApi } })
    rerender({ usuario: null, llamarApi })
    expect(result.current).toMatchObject({ estado: 'identidad-no-coincide', intento: null, puedeEnviar: false, puedePreparar: false })
    await expect(result.current.enviar()).rejects.toThrow()
    expect(api).not.toHaveBeenCalled()
    rerender({ usuario, llamarApi })
    expect(result.current.intento.identidad).toEqual(identidad)
  })
  it.each([false, true])('no devuelve exito si cambia identidad durante HTTP, regreso=%s', async regresar => {
    let resolver
    const api = simularApi({ 'POST /boletas': () => new Promise(resolve => { resolver = resolve }) })
    const hook = renderHook(props => useCompraCheckout(props), { initialProps: { usuario, llamarApi } })
    act(() => { hook.result.current.preparar(datos()) })
    let pendiente
    act(() => { pendiente = hook.result.current.enviar() })
    const rechazo = expect(pendiente).rejects.toThrow('identidad')
    hook.rerender({ usuario: null, llamarApi })
    if (regresar) hook.rerender({ usuario, llamarApi })
    await act(async () => { resolver([201, boleta(7)]); await rechazo })
    expect(hook.result.current.boleta).toBeNull()
    expect(leerIntentoCompra()).toMatchObject({ estado: 'confirmado', boletaId: 51 })
    expect(api).toHaveBeenCalledTimes(1)
  })
  it('impide doble envio inmediato', async () => {
    let resolver
    const api = simularApi({ 'POST /boletas': () => new Promise(resolve => { resolver = resolve }) })
    const { result } = renderHook(() => useCompraCheckout())
    act(() => { result.current.preparar(datos()) })
    let primero
    act(() => { primero = result.current.enviar() })
    await expect(result.current.enviar()).rejects.toThrow('ya se esta enviando')
    expect(() => result.current.preparar(datos())).toThrow()
    await act(async () => { resolver([201, boleta(null)]); await primero })
    expect(api).toHaveBeenCalledTimes(1)
  })
  it.each(['{roto', JSON.stringify({ version: 1, jwt: 'prohibido' })])('bloquea almacenamiento corrupto sin reemplazarlo', texto => {
    sessionStorage.setItem(CLAVE_INTENTO_COMPRA, texto)
    const api = simularApi({})
    const { result } = renderHook(useCompraCheckout)
    expect(result.current).toMatchObject({ estado: 'almacenamiento-no-disponible', puedePreparar: false, puedeEnviar: false })
    expect(() => result.current.preparar(datos())).toThrow()
    expect(sessionStorage.getItem(CLAVE_INTENTO_COMPRA)).toBe(texto)
    expect(api).not.toHaveBeenCalled()
  })
  it('bloquea almacenamiento inaccesible', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('bloqueado') })
    const { result } = renderHook(useCompraCheckout)
    expect(result.current.estado).toBe('almacenamiento-no-disponible')
    expect(() => result.current.preparar(datos())).toThrow()
  })
  it('no envia si falla persistir', async () => {
    const api = simularApi({})
    const { result } = renderHook(useCompraCheckout)
    act(() => { result.current.preparar(datos()) })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('sin espacio') })
    await act(async () => { await expect(result.current.enviar()).rejects.toThrow('sin espacio') })
    expect(api).not.toHaveBeenCalled()
  })
  it.each([usuario, { id: 8, rol: 'CLIENTE' }, { id: 7, rol: 'ADMINISTRADOR' }])(
    'conserva el intento al cambiar de invitado a cuenta %j', async cuenta => {
      prepararCompra(datos())
      const original = sessionStorage.getItem(CLAVE_INTENTO_COMPRA)
      const api = simularApi({})
      const hook = renderHook(props => useCompraCheckout(props), { initialProps: { usuario: null, llamarApi } })
      hook.rerender({ usuario: cuenta, llamarApi })
      expect(hook.result.current).toMatchObject({ estado: 'identidad-no-coincide', intento: null, boleta: null, boletaId: null, puedeEnviar: false })
      await expect(hook.result.current.enviar()).rejects.toThrow('identidad')
      expect(sessionStorage.getItem(CLAVE_INTENTO_COMPRA)).toBe(original)
      expect(api).not.toHaveBeenCalled()
    })
  it.each([{ id: 8, rol: 'CLIENTE' }, { id: 7, rol: 'ADMINISTRADOR' }])(
    'bloquea otra cuenta o rol %j y permite recuperar la identidad original', async cuenta => {
      prepararCompra({ ...datos(), usuario })
      const original = sessionStorage.getItem(CLAVE_INTENTO_COMPRA)
      const api = simularApi({})
      const hook = renderHook(props => useCompraCheckout(props), { initialProps: { usuario, llamarApi } })
      hook.rerender({ usuario: cuenta, llamarApi })
      expect(hook.result.current).toMatchObject({ estado: 'identidad-no-coincide', intento: null, puedePreparar: false, puedeEnviar: false })
      await expect(hook.result.current.enviar()).rejects.toThrow('identidad')
      hook.rerender({ usuario, llamarApi })
      expect(hook.result.current).toMatchObject({ estado: 'preparado', puedeEnviar: true })
      expect(sessionStorage.getItem(CLAVE_INTENTO_COMPRA)).toBe(original)
      expect(api).not.toHaveBeenCalled()
    })
  it('usa llamarApi actualizado aunque se conserve la funcion enviar de un render anterior', async () => {
    const api = simularApi({ 'POST /boletas': () => [201, boleta(7)] })
    const anterior = vi.fn(llamarApi)
    const vigente = vi.fn(llamarApi)
    const hook = renderHook(props => useCompraCheckout(props), { initialProps: { usuario, llamarApi: anterior } })
    act(() => { hook.result.current.preparar(datos()) })
    const enviar = hook.result.current.enviar
    hook.rerender({ usuario: { ...usuario }, llamarApi: vigente })
    await act(async () => { await enviar() })
    expect(anterior).not.toHaveBeenCalled()
    expect(vigente).toHaveBeenCalledTimes(1)
    expect(api).toHaveBeenCalledTimes(1)
    expect(hook.result.current.boleta?.id).toBe(51)
  })
  it('no publica exito tras desmontar y recupera la confirmacion sin otro POST', async () => {
    let resolver
    const api = simularApi({ 'POST /boletas': () => new Promise(resolve => { resolver = resolve }) })
    const hook = renderHook(() => useCompraCheckout({ usuario, llamarApi }))
    act(() => { hook.result.current.preparar(datos()) })
    const original = hook.result.current.intento
    let pendiente
    act(() => { pendiente = hook.result.current.enviar() })
    const rechazo = expect(pendiente).rejects.toThrow('vista se cerro')
    const enviar = hook.result.current.enviar
    const preparar = hook.result.current.preparar
    hook.unmount()
    await expect(enviar()).rejects.toThrow('vista se cerro')
    expect(() => preparar(datos())).toThrow('vista ya se cerro')
    await act(async () => { resolver([201, boleta(7)]); await rechazo })
    const recargado = renderHook(() => useCompraCheckout({ usuario, llamarApi }))
    expect(recargado.result.current).toMatchObject({ estado: 'confirmado', boletaId: 51, boleta: null, puedeEnviar: false })
    expect(recargado.result.current.intento).toMatchObject({ clave: original.clave, cuerpo: original.cuerpo })
    expect(api).toHaveBeenCalledTimes(1)
    expect(crypto.randomUUID).toHaveBeenCalledTimes(1)
  })
  it('impide un segundo POST desde otra instancia mientras el primero esta pendiente', async () => {
    let resolver
    const api = simularApi({ 'POST /boletas': () => new Promise(resolve => { resolver = resolve }) })
    const primero = renderHook(useCompraCheckout)
    act(() => { primero.result.current.preparar(datos()) })
    let pendiente
    act(() => { pendiente = primero.result.current.enviar() })
    const segundo = renderHook(useCompraCheckout)
    await act(async () => { await expect(segundo.result.current.enviar()).rejects.toThrow('ya se esta enviando') })
    await act(async () => { resolver([201, boleta(null)]); await pendiente })
    expect(api).toHaveBeenCalledTimes(1)
    expect(leerIntentoCompra()).toMatchObject({ estado: 'confirmado', boletaId: 51 })
  })
  it('no almacena datos bancarios ni JWT ni modifica carrito o catalogo', () => {
    localStorage.setItem('carritoVolcan', 'conservar')
    const original = datos()
    const copia = structuredClone(original)
    const { result } = renderHook(() => useCompraCheckout({ usuario: { ...usuario, jwt: 'secreto' }, llamarApi }))
    act(() => { result.current.preparar({ ...original, cvv: '123', tarjeta: '4111111111111111', jwt: 'secreto' }) })
    expect(sessionStorage.getItem(CLAVE_INTENTO_COMPRA)).not.toMatch(/cvv|tarjeta|jwt|secreto|4111111111111111/)
    expect(localStorage.getItem('carritoVolcan')).toBe('conservar')
    expect(original).toEqual(copia)
  })
  it('una confirmacion recuperada conserva el ID y no se borra ni reenvia', async () => {
    prepararCompra({ ...datos(), usuario })
    cambiarEstadoIntento(UUID, 'enviado')
    registrarRespuestaIntento(UUID, 201, 51)
    const api = simularApi({})
    const { result } = renderHook(() => useCompraCheckout({ usuario, llamarApi }))
    expect(result.current).toMatchObject({ estado: 'confirmado', boletaId: 51, boleta: null })
    await act(async () => { await expect(result.current.enviar()).rejects.toThrow('confirmada') })
    expect(leerIntentoCompra().boletaId).toBe(51)
    expect(api).not.toHaveBeenCalled()
  })
})
