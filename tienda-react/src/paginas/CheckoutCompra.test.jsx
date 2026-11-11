import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Checkout from './Checkout'
import { CarritoContexto } from '../contexto/carritoContexto'
import { SesionContexto } from '../contexto/sesionContexto'
import { pedir, API_URL } from '../utilidades/api'
import { simularApi } from '../test/api'
import { prepararCompra } from '../datos/boletasApi'
import { cambiarEstadoIntento, CLAVE_INTENTO_COMPRA, leerIntentoCompra } from '../datos/intentoCompra'

const categoria = { id: 91, nombre: 'Categoría oficial' }
const producto = { id: 901, codigo: 'CL002', nombre: 'Producto oficial HTTP', precioResidencial: 220,
  precioComercial: 200, precioOferta: null, stock: 8, activo: true, unidad: 'Unidad', categoria }
const items = [{ codigo: 'CL002', cantidad: 2 }]
const usuario = { id: 7, rol: 'CLIENTE', nombre: 'Camila Rojas', correo: 'camila@gmail.com' }
const UUID = 'a1b2c3d4-1111-4222-8333-123456789abc'
const llamarApi = (ruta, opciones) => pedir(ruta, { ...opciones, token: 'jwt-sintetico' })
function boleta(cuerpo, precio = 220) {
  return { id: 51, clienteId: cuerpo.clienteId, direccion: cuerpo.direccion, comuna: cuerpo.comuna,
    estado: 'PENDIENTE', repartidorId: null, fecha: cuerpo.fecha, total: precio * 2,
    detalles: [{ id: 101, productoId: cuerpo.detalles[0].productoId, cantidad: 2, precio }] }
}
function diferida() {
  let resolver
  const promesa = new Promise(resolve => { resolver = resolve })
  return { promesa, resolver }
}
function backend(rutas = {}) {
  return simularApi({ 'GET /productos': () => [200, [producto]], 'GET /categorias': () => [200, [categoria]],
    'GET /usuarios/yo': () => [200, { ...usuario, telefono: '+56912345678', direccion: 'Libertad 123', comuna: 'chillan' }],
    'POST /boletas': cuerpo => [201, boleta(cuerpo)], ...rutas })
}
function abrir(inicial = {}) {
  let datos = { items, usuario: null, ...inicial }
  const vaciar = vi.fn()
  const descontar = vi.fn()
  const vista = () => <MemoryRouter><SesionContexto.Provider value={{ usuario: datos.usuario, llamarApi }}>
    <CarritoContexto.Provider value={{ items: datos.items, vaciar, descontar }}><Checkout /></CarritoContexto.Provider>
  </SesionContexto.Provider></MemoryRouter>
  const renderizado = render(vista())
  return { ...renderizado, vaciar, descontar, cambiar: cambios => { datos = { ...datos, ...cambios }; renderizado.rerender(vista()) } }
}
function llenar() {
  for (const [etiqueta, value] of [['Nombre', 'Camila Rojas'], ['Correo electrónico', 'camila@gmail.com'],
    ['Teléfono', '+56912345678'], ['Dirección', 'Libertad 123'], ['Comuna', 'Chillán']]) {
    fireEvent.change(screen.getByLabelText(etiqueta), { target: { value } })
  }
}
const enviar = () => fireEvent.submit(document.getElementById('formCheckout'))
const posts = api => api.mock.calls.filter(([, opciones]) => opciones.method === 'POST')
async function listo() { await screen.findByText('Producto oficial HTTP') }
async function confirmado() { return screen.findByText(/Boleta registrada N.º 51/) }
function prepararGuardado(estado = 'incierto', cuenta = null) {
  prepararCompra({ items, productos: [producto], usuario: cuenta, fecha: '2026-11-10T12:30:00',
    entrega: { direccion: 'Original 123', comuna: 'Chillán' },
    invitado: { nombre: 'Persona original', correo: 'original@example.test', telefono: '+56912345678' } })
  if (estado !== 'preparado') cambiarEstadoIntento(UUID, 'enviado')
  if (!['preparado', 'enviado'].includes(estado)) cambiarEstadoIntento(UUID, estado, { boletaId: estado === 'confirmado' ? 51 : null })
}
beforeEach(() => {
  sessionStorage.clear()
  vi.spyOn(crypto, 'randomUUID').mockReturnValue(UUID)
  localStorage.setItem('carritoVolcan', JSON.stringify(items))
  localStorage.setItem('productosSistema', JSON.stringify([producto]))
})
afterEach(() => { sessionStorage.clear() })

describe('Checkout registra por HTTP simulado con catálogo oficial', () => {
  it('montar y renderizar de nuevo no prepara ni envía compras', async () => {
    const api = backend()
    const vista = abrir()
    await listo()
    vista.cambiar({ items: [...items] })
    expect(posts(api)).toHaveLength(0)
    expect(leerIntentoCompra()).toBeNull()
    expect(crypto.randomUUID).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Registrar boleta' })).toBeEnabled()
  })
  it.each([null, usuario])('registra explícitamente como %j, conserva carrito y no simula pagos', async cuenta => {
    const api = backend()
    const vista = abrir({ usuario: cuenta })
    await listo()
    if (cuenta) await waitFor(() => expect(screen.getByLabelText('Dirección')).toHaveValue('Libertad 123'))
    llenar()
    fireEvent.click(screen.getByRole('button', { name: 'Registrar boleta' }))
    await confirmado()
    const [[url, opciones]] = posts(api)
    expect(url).toBe(API_URL + '/boletas')
    expect(opciones.headers['idempotency-key']).toBe(UUID)
    expect(opciones.headers.Authorization).toBe(cuenta ? 'Bearer jwt-sintetico' : undefined)
    const cuerpo = JSON.parse(opciones.body)
    expect(cuerpo).toMatchObject({ clienteId: cuenta?.id ?? null, detalles: [{ productoId: 901, cantidad: 2 }] })
    expect(Object.keys(cuerpo).sort()).toEqual((cuenta
      ? ['clienteId', 'direccion', 'comuna', 'estado', 'repartidorId', 'fecha', 'detalles']
      : ['clienteId', 'direccion', 'comuna', 'estado', 'repartidorId', 'fecha', 'detalles', 'nombreInvitado', 'correoInvitado', 'telefonoInvitado']).sort())
    expect(api.mock.calls.filter(([, o]) => o.method === 'GET' && String(o.body) === 'undefined').length).toBeGreaterThanOrEqual(4)
    expect(api.mock.calls.filter(([u]) => u === API_URL + '/productos')).toHaveLength(2)
    expect(api.mock.calls.filter(([u]) => u === API_URL + '/categorias')).toHaveLength(2)
    expect(screen.getByRole('button', { name: 'Boleta registrada' })).toBeDisabled()
    expect(screen.getByText(/Esto no confirma un pago bancario/)).toBeInTheDocument()
    expect(document.querySelector('[autocomplete="cc-number"]')).toBeNull()
    expect(document.querySelector('#cvv')).toBeNull()
    expect(vista.vaciar).not.toHaveBeenCalled()
    expect(vista.descontar).not.toHaveBeenCalled()
    expect(JSON.parse(localStorage.getItem('carritoVolcan'))).toEqual(items)
    expect(JSON.parse(localStorage.getItem('productosSistema'))).toEqual([producto])
    expect(localStorage.getItem('pedidos_volcan')).toBeNull()
    expect(sessionStorage.getItem(CLAVE_INTENTO_COMPRA)).not.toMatch(/numeroTarjeta|cvv|jwt-sintetico/)
    enviar()
    expect(posts(api)).toHaveLength(1)
  })
  it('valida el formulario antes de consultar nuevamente o preparar', async () => {
    const api = backend()
    abrir(); await listo(); enviar()
    expect(screen.getByLabelText('Nombre').className).toContain('campo-invalido')
    expect(api).toHaveBeenCalledTimes(2)
    expect(leerIntentoCompra()).toBeNull()
  })
  it.each([{ ...usuario, id: null }, { ...usuario, rol: 'ADMINISTRADOR' }])('bloquea identidad no válida %j', async cuenta => {
    const api = backend()
    abrir({ usuario: cuenta }); await listo(); llenar(); enviar()
    expect(posts(api)).toHaveLength(0)
    expect(leerIntentoCompra()).toBeNull()
  })
  it('espera ambos GET nuevos antes de preparar y bloquea doble submit durante el GET y el POST', async () => {
    const productos = diferida(), categorias = diferida(), respuesta = diferida()
    let numeroProductos = 0, numeroCategorias = 0, cuerpo
    const api = backend({ 'GET /productos': () => ++numeroProductos === 1 ? [200, [producto]] : productos.promesa,
      'GET /categorias': () => ++numeroCategorias === 1 ? [200, [categoria]] : categorias.promesa,
      'POST /boletas': c => { cuerpo = c; return respuesta.promesa } })
    abrir(); await listo(); llenar()
    act(() => { enviar(); enviar() })
    expect(screen.getByText('Comprobando catálogo oficial…')).toBeInTheDocument()
    expect(leerIntentoCompra()).toBeNull()
    await act(async () => { productos.resolver([200, [producto]]) })
    expect(posts(api)).toHaveLength(0)
    await act(async () => { categorias.resolver([200, [categoria]]) })
    await waitFor(() => expect(posts(api)).toHaveLength(1))
    expect(screen.getByText('Registrando boleta…')).toBeInTheDocument()
    enviar(); enviar()
    expect(posts(api)).toHaveLength(1)
    await act(async () => { respuesta.resolver([201, boleta(cuerpo)]) })
    await confirmado()
    expect(crypto.randomUUID).toHaveBeenCalledTimes(1)
  })
  it.each([{ precioResidencial: 330 }, { id: 902 }, { precioOferta: 180 }])('reconfirma cambios del catálogo %j', async cambio => {
    let llamadas = 0
    const nuevo = { ...producto, ...cambio }
    const api = backend({ 'GET /productos': () => [200, [++llamadas === 1 ? producto : nuevo]] })
    abrir(); await listo(); llenar(); enviar()
    await screen.findByText(/Los precios o productos cambiaron/)
    expect(posts(api)).toHaveLength(0)
    expect(leerIntentoCompra()).toBeNull()
    expect(screen.getByRole('button', { name: 'Registrar boleta' })).toBeEnabled()
    enviar()
    await confirmado()
    expect(JSON.parse(posts(api)[0][1].body).detalles[0].productoId).toBe(nuevo.id)
    expect(llamadas).toBe(3)
  })
  it.each([{ stock: 1 }, { activo: false }, { codigo: 'OTRO' }, { id: null }, { precioResidencial: -1 }])(
    'bloquea datos nuevos no disponibles o inválidos %j', async cambio => {
      let llamadas = 0
      const api = backend({ 'GET /productos': () => [200, [++llamadas === 1 ? producto : { ...producto, ...cambio }]] })
      abrir(); await listo(); llenar(); enviar()
      await waitFor(() => expect(document.body.textContent).toMatch(/actualizado no permite|formato inesperado/))
      expect(posts(api)).toHaveLength(0)
      expect(leerIntentoCompra()).toBeNull()
    })
  it('un fallo al refrescar no usa datos antiguos para enviar', async () => {
    let llamadas = 0
    const api = backend({ 'GET /productos': () => ++llamadas === 1 ? [200, [producto]] : [503, { mensaje: 'Catálogo caído' }] })
    abrir(); await listo(); llenar(); enviar()
    await screen.findByText('Catálogo caído')
    expect(posts(api)).toHaveLength(0)
    expect(leerIntentoCompra()).toBeNull()
  })
  it.each(['carrito', 'formulario', 'identidad', 'identidad-ida-vuelta', 'desmontaje'])('cancela si cambia %s durante GET', async cambio => {
    const pendiente = diferida()
    let llamadas = 0
    const api = backend({ 'GET /productos': () => ++llamadas === 1 ? [200, [producto]] : pendiente.promesa })
    const vista = abrir(); await listo(); llenar(); enviar()
    if (cambio === 'carrito') vista.cambiar({ items: [{ codigo: 'CL002', cantidad: 1 }] })
    if (cambio === 'formulario') fireEvent.change(screen.getByLabelText('Dirección'), { target: { value: 'Otra 456' } })
    if (cambio.startsWith('identidad')) vista.cambiar({ usuario })
    if (cambio === 'identidad-ida-vuelta') vista.cambiar({ usuario: null })
    if (cambio === 'desmontaje') vista.unmount()
    await act(async () => { pendiente.resolver([200, [producto]]) })
    expect(posts(api)).toHaveLength(0)
    expect(leerIntentoCompra()).toBeNull()
  })
  it('muestra el total confirmado por el backend, aunque difiera de la estimación', async () => {
    backend({ 'POST /boletas': c => [201, boleta(c, 250)] })
    abrir(); await listo(); llenar(); enviar(); await confirmado()
    const total = screen.getByText('Total boleta').parentElement
    expect(total).toHaveTextContent(/500/)
    expect(within(screen.getByLabelText('Datos del intento guardado')).getByText('Producto 901 × 2')).toBeInTheDocument()
  })
  it('permite actualizar el catálogo y registrar después de recuperar stock', async () => {
    let llamadas = 0
    const api = backend({ 'GET /productos': () => [200, [{ ...producto, stock: ++llamadas === 2 ? 1 : 8 }]] })
    abrir(); await listo(); llenar(); enviar()
    await screen.findByText(/El catálogo actualizado no permite/)
    expect(screen.getByRole('button', { name: 'Registrar boleta' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Actualizar catálogo' }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Registrar boleta' })).toBeEnabled())
    enviar(); await confirmado()
    expect(posts(api)).toHaveLength(1)
  })
})

describe('Checkout recupera sin reemplazar intentos', () => {
  it.each(['preparado', 'enviado', 'incierto', 'bloqueado', 'conflicto'])('recupera %s con carrito vacío, formulario vacío y catálogo caído', async estado => {
    prepararGuardado(estado)
    const anterior = leerIntentoCompra()
    const api = backend({ 'GET /productos': () => [503, { mensaje: 'Sin catálogo' }] })
    abrir({ items: [] })
    await screen.findByText(/Sin catálogo/)
    expect(posts(api)).toHaveLength(0)
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar registro' }))
    await confirmado()
    expect(JSON.parse(posts(api)[0][1].body)).toEqual(anterior.cuerpo)
    expect(posts(api)[0][1].headers['idempotency-key']).toBe(anterior.clave)
    expect(api.mock.calls.filter(([u]) => u === API_URL + '/productos')).toHaveLength(1)
    expect(crypto.randomUUID).toHaveBeenCalledTimes(1)
  })
  it('un intento confirmado no se vuelve a enviar al recargar', async () => {
    prepararGuardado('confirmado')
    const api = backend()
    abrir(); await listo(); enviar()
    expect(screen.getByRole('button', { name: 'Boleta registrada' })).toBeDisabled()
    expect(posts(api)).toHaveLength(0)
  })
  it('no permite recuperar con otra identidad ni convertir a invitado', async () => {
    prepararGuardado('incierto', usuario)
    const original = sessionStorage.getItem(CLAVE_INTENTO_COMPRA)
    const api = backend()
    const vista = abrir({ usuario: { ...usuario, id: 9 } })
    await listo(); enviar()
    vista.cambiar({ usuario: null }); enviar()
    expect(posts(api)).toHaveLength(0)
    expect(sessionStorage.getItem(CLAVE_INTENTO_COMPRA)).toBe(original)
    expect(screen.getByRole('button', { name: 'Registrar boleta' })).toBeDisabled()
  })
  it.each([400, 401, 403, 409, 500, 503, 200, 202])('HTTP %s no confirma y permite reintentar con el mismo cuerpo, UUID y fecha', async estado => {
    let numero = 0
    const api = backend({ 'POST /boletas': c => ++numero === 1 ? [estado, boleta(c)] : [201, boleta(c)] })
    const vista = abrir(); await listo(); llenar(); enviar()
    await screen.findByRole('button', { name: 'Reintentar registro' })
    const original = leerIntentoCompra()
    expect(original.estado).not.toBe('confirmado')
    vista.unmount()
    abrir({ items: [] })
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar registro' }))
    await confirmado()
    expect(posts(api)[0][1]).toEqual(posts(api)[1][1])
    expect(leerIntentoCompra().cuerpo).toEqual(original.cuerpo)
    expect(crypto.randomUUID).toHaveBeenCalledTimes(1)
  })
  it.each(['red', 'incompleta', 'total-incoherente'])('conserva resultado incierto ante %s', async tipo => {
    const api = backend({ 'POST /boletas': c => {
      if (tipo === 'red') throw new TypeError('Respuesta perdida')
      return [201, tipo === 'incompleta' ? { id: 51 } : { ...boleta(c), total: 1 }]
    } })
    abrir(); await listo(); llenar(); enviar()
    await screen.findByRole('button', { name: 'Reintentar registro' })
    expect(leerIntentoCompra().estado).toBe('incierto')
    expect(screen.queryByText(/Boleta registrada N.º/)).not.toBeInTheDocument()
    expect(posts(api)).toHaveLength(1)
  })
  it.each(['identidad', 'desmontaje'])('no muestra una confirmación obsoleta tras %s durante POST', async cambio => {
    const pendiente = diferida()
    let cuerpo
    const api = backend({ 'POST /boletas': c => { cuerpo = c; return pendiente.promesa } })
    const vista = abrir(); await listo(); llenar(); enviar()
    await waitFor(() => expect(posts(api)).toHaveLength(1))
    if (cambio === 'identidad') vista.cambiar({ usuario })
    else vista.unmount()
    await act(async () => { pendiente.resolver([201, boleta(cuerpo)]) })
    expect(screen.queryByText(/Boleta registrada N.º/)).not.toBeInTheDocument()
    expect(leerIntentoCompra()).toMatchObject({ estado: 'confirmado', cuerpo })
  })
  it('almacenamiento corrupto bloquea sin reemplazar ni enviar', async () => {
    sessionStorage.setItem(CLAVE_INTENTO_COMPRA, '{corrupto')
    const api = backend()
    abrir(); await listo(); enviar()
    expect(posts(api)).toHaveLength(0)
    expect(sessionStorage.getItem(CLAVE_INTENTO_COMPRA)).toBe('{corrupto')
  })
})
