import { beforeEach, describe, expect, it } from 'vitest'
import { pedir, API_URL } from '../utilidades/api'
import { simularCatalogoHttp } from '../test/catalogoHttp'
import { pedidoDeEjemplo } from '../test/renderizar'
import { gestionDe } from '../test/pedidosHttp'
import { obtenerPedidos, consultarGestion, asignarRepartidor, cambiarEstado, puedeCambiarEstado } from './pedidosGestionApi'

const llamarApi = (ruta, opciones) => pedir(ruta, { ...opciones, token: 'jwt-sintetico-pruebas' })
let g
beforeEach(() => { g = gestionDe(pedidoDeEjemplo()); localStorage.setItem('pedidos_volcan', 'datos-locales-no-utilizables') })
const backend = rutas => simularCatalogoHttp({ 'GET /boletas/gestion': () => [200, [g]], ...rutas })

describe('Contrato HTTP de gestión de pedidos', () => {
  it('adapta solo los datos oficiales y conserva los importes históricos del servidor', async () => {
    const api = backend()
    const r = await obtenerPedidos(llamarApi)
    expect(r.pedidos[0]).toMatchObject({ numero: 1, version: 0, estado: 'Pendiente', total: 6500,
      cliente: { nombre: 'Camila Rojas' }, productos: [{ nombre: 'Cilindro GLP 5 kg', cantidad: 1, precio: 6500 }] })
    expect(r.productos).toHaveLength(14)
    expect(api.mock.calls.find(([url]) => url === API_URL + '/boletas/gestion')[1].headers.Authorization).toBe('Bearer jwt-sintetico-pruebas')
    expect(localStorage.getItem('pedidos_volcan')).toBe('datos-locales-no-utilizables')
    expect(r.pedidos[0]).not.toHaveProperty('pago')
  })
  it.each([400, 401, 403, 404, 409, 503])('propaga HTTP %s sin usar pedidos locales', async estado => {
    backend({ 'GET /boletas/gestion': () => [estado, { mensaje: 'Error simulado' }] })
    await expect(obtenerPedidos(llamarApi)).rejects.toMatchObject({ estado, message: 'Error simulado' })
  })
  it.each(['lista', 'version', 'id', 'fecha', 'estado', 'total', 'detalles', 'contacto', 'entrega', 'duplicado'])('rechaza respuesta inválida: %s', async caso => {
    if (caso === 'version') g.version = -1
    if (caso === 'id') g.boleta.id = null
    if (caso === 'fecha') g.boleta.fecha = 'no es fecha'
    if (caso === 'estado') g.boleta.estado = 'DESCONOCIDO'
    if (caso === 'total') g.boleta.total = 1
    if (caso === 'detalles') g.boleta.detalles = []
    if (caso === 'contacto') g.cliente = null
    if (caso === 'entrega') g.entrega.direccion = 'Dirección inconsistente'
    backend({ 'GET /boletas/gestion': () => [200, caso === 'lista' ? {} : caso === 'duplicado' ? [g, g] : [g]] })
    await expect(obtenerPedidos(llamarApi)).rejects.toMatchObject({ estado: 502 })
  })
  it('rechaza una consulta individual con otro ID', async () => {
    backend({ 'GET /boletas/8/gestion': () => [200, g] })
    await expect(consultarGestion(llamarApi, 8)).rejects.toMatchObject({ estado: 502 })
  })
  it.each([null, 3])('asigna o desasigna con ID %s y versión 0 sin enviar contacto, stock ni detalles', async repartidorId => {
    const api = backend({ 'PUT /boletas/1/repartidor': cuerpo => [200, { boleta: { ...g.boleta, repartidorId: cuerpo.repartidorId }, version: 1 }] })
    const p = (await obtenerPedidos(llamarApi)).pedidos[0]
    const r = await asignarRepartidor(llamarApi, p, repartidorId)
    const put = api.mock.calls.find(([, o]) => o.method === 'PUT')
    expect(JSON.parse(put[1].body)).toEqual({ repartidorId, versionEsperada: 0 })
    expect(r.version).toBe(1); expect(p.version).toBe(0)
    expect(p.repartidor).toBe('')
  })
  it('el estado usa exclusivamente el endpoint parcial y una respuesta válida', async () => {
    const api = backend({ 'PUT /boletas/1/estado': () => [200, { ...g.boleta, estado: 'EN_CAMINO' }] })
    const p = (await obtenerPedidos(llamarApi)).pedidos[0]
    expect((await cambiarEstado(llamarApi, p, 'En camino')).estado).toBe('En camino')
    expect(JSON.parse(api.mock.calls.find(([, o]) => o.method === 'PUT')[1].body)).toEqual({ estado: 'EN_CAMINO' })
  })
  it('anula sin DELETE ni datos bancarios y conserva el pedido original', async () => {
    const api = backend({ 'PUT /boletas/1/anulacion': () => [200, { boleta: { ...g.boleta, estado: 'CANCELADO' }, version: 1 }] })
    const p = (await obtenerPedidos(llamarApi)).pedidos[0]
    expect((await cambiarEstado(llamarApi, p, 'Cancelado', true)).estado).toBe('Cancelado')
    const put = api.mock.calls.find(([, o]) => o.method === 'PUT')
    expect(JSON.parse(put[1].body)).toEqual({ versionEsperada: 0 })
    expect(put[1].body).not.toMatch(/tarjeta|cvv|stock|precio|cliente/)
    expect(p.estado).toBe('Pendiente')
    expect(api.mock.calls.some(([, o]) => ['DELETE', 'POST'].includes(o.method))).toBe(false)
  })
  it.each([201, 204])('no confirma escrituras con HTTP inesperado %s', async estado => {
    backend({ 'PUT /boletas/1/anulacion': () => [estado, { boleta: { ...g.boleta, estado: 'CANCELADO' }, version: 1 }] })
    const p = (await obtenerPedidos(llamarApi)).pedidos[0]
    await expect(cambiarEstado(llamarApi, p, 'Cancelado', true)).rejects.toMatchObject({ estado })
  })
  it('no confirma una respuesta que cambie precio o entrega además de asignar', async () => {
    backend({ 'PUT /boletas/1/repartidor': () => [200, { boleta: { ...g.boleta, repartidorId: 3, direccion: 'Otra dirección' }, version: 1 }] })
    const p = (await obtenerPedidos(llamarApi)).pedidos[0]
    await expect(asignarRepartidor(llamarApi, p, 3)).rejects.toMatchObject({ estado: 502 })
  })
  it.each([['Pendiente', 'En camino', true], ['Pendiente', 'Cancelado', true], ['Pendiente', 'Entregado', false],
    ['En camino', 'Pendiente', false], ['En camino', 'Entregado', true], ['Entregado', 'Pendiente', false], ['Cancelado', 'En camino', false]])(
    'valida la transición %s → %s', (actual, destino, permitido) => expect(puedeCambiarEstado(actual, destino)).toBe(permitido))
})
