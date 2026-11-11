import { afterEach, beforeEach, describe, it, expect } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Checkout from './Checkout'
import ProveedorSesion from '../contexto/ProveedorSesion'
import ProveedorCatalogo from '../contexto/ProveedorCatalogo'
import ProveedorCarrito from '../contexto/ProveedorCarrito'
import { simularApi, guardarSesionDePrueba, CUENTAS } from '../test/api'
import { leerIntentoCompra } from '../datos/intentoCompra'

beforeEach(() => { sessionStorage.clear() })
afterEach(() => { sessionStorage.clear() })

const categoria = { id: 91, nombre: 'Categoria de prueba' }
const producto = { id: 901, codigo: 'CL002', nombre: 'Producto oficial API', precioResidencial: 220,
  precioComercial: 200, precioOferta: null, stock: 3, activo: true, unidad: 'Unidad', categoria }
function abrir(items = [{ codigo: 'CL002', cantidad: 1 }]) {
  localStorage.setItem('carritoVolcan', JSON.stringify(items))
  return render(<MemoryRouter initialEntries={['/checkout']}><ProveedorSesion><ProveedorCatalogo>
    <ProveedorCarrito><Checkout /></ProveedorCarrito>
  </ProveedorCatalogo></ProveedorSesion></MemoryRouter>)
}
function apiCon(p = producto) {
  return simularApi({ 'GET /productos': () => [200, [p]], 'GET /categorias': () => [200, [categoria]] })
}
const confirmar = () => screen.getByRole('button', { name: 'Registrar boleta' })

describe('Checkout valida el catálogo oficial antes del registro', () => {
  it('bloquea durante carga, conserva articulos y oculta precios locales', () => {
    simularApi({ 'GET /productos': () => new Promise(() => {}), 'GET /categorias': () => new Promise(() => {}) })
    abrir()
    expect(screen.getByText('Cargando catálogo oficial…')).toBeInTheDocument()
    expect(screen.getByLabelText('Artículos conservados')).toHaveTextContent('CL002 × 1')
    expect(screen.getByText('No disponible')).toBeInTheDocument()
    expect(confirmar()).toBeDisabled()
    expect(JSON.parse(localStorage.getItem('carritoVolcan'))).toEqual([{ codigo: 'CL002', cantidad: 1 }])
  })
  it('muestra exclusivamente el producto oficial y valida el formulario antes del POST', async () => {
    const api = apiCon()
    abrir()
    await screen.findByText('Producto oficial API')
    expect(screen.getByText(/220/, { selector: 'span' })).toBeInTheDocument()
    expect(confirmar()).toBeEnabled()
    fireEvent.submit(document.getElementById('formCheckout'))
    expect(screen.getByLabelText('Nombre')).toHaveClass('campo-invalido')
    expect(leerIntentoCompra()).toBeNull()
    expect(localStorage.getItem('pedidos_volcan')).toBeNull()
    expect(JSON.parse(localStorage.getItem('carritoVolcan'))).toEqual([{ codigo: 'CL002', cantidad: 1 }])
    expect(api.mock.calls.every(([, opciones]) => opciones.method === 'GET')).toBe(true)
  })
  it('error y reintento no borran el carrito', async () => {
    let falla = true
    const api = simularApi({ 'GET /productos': () => falla ? [503, { mensaje: 'Sin conexion de prueba' }] : [200, [producto]],
      'GET /categorias': () => [200, [categoria]] })
    abrir()
    await screen.findByText(/Sin conexion de prueba/)
    expect(confirmar()).toBeDisabled()
    falla = false
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    await screen.findByText('Producto oficial API')
    expect(confirmar()).toBeEnabled()
    expect(api.mock.calls.every(([, opciones]) => opciones.method === 'GET')).toBe(true)
    expect(JSON.parse(localStorage.getItem('carritoVolcan'))).toHaveLength(1)
  })
  it.each([{ ...producto, activo: false }, { ...producto, stock: 0 }, { ...producto, codigo: 'OTRO' }])(
    'bloquea productos inactivos, agotados o inexistentes %#', async p => {
      const api = apiCon(p)
      abrir()
      await screen.findByText(/Hay productos inválidos/)
      expect(confirmar()).toBeDisabled()
      fireEvent.submit(document.getElementById('formCheckout'))
      expect(api.mock.calls.every(([, opciones]) => opciones.method === 'GET')).toBe(true)
      expect(leerIntentoCompra()).toBeNull()
      expect(screen.getByLabelText('Artículos conservados')).toHaveTextContent('CL002')
    })
  it('un ID ausente invalida el catalogo sin usar el local', async () => {
    apiCon({ ...producto, id: undefined })
    abrir()
    await screen.findByRole('button', { name: 'Reintentar' })
    expect(confirmar()).toBeDisabled()
    expect(screen.queryByText('Producto oficial API')).not.toBeInTheDocument()
  })
  it('protege acceso directo con carrito vacio', async () => {
    apiCon()
    abrir([])
    await waitFor(() => expect(screen.queryByText('Cargando catálogo oficial…')).not.toBeInTheDocument())
    expect(screen.getByText(/No hay productos en el carrito/)).toBeInTheDocument()
    expect(confirmar()).toBeDisabled()
  })
  it('conserva autocompletado pero bloquea una sesión sin ID real', async () => {
    guardarSesionDePrueba({ nombre: 'Camila Rojas', correo: 'camila@gmail.com', rol: 'CLIENTE' })
    simularApi({ 'GET /productos': () => [200, [producto]], 'GET /categorias': () => [200, [categoria]],
      'GET /usuarios/yo': () => [200, { ...CUENTAS.camila, direccion: 'Libertad 123', telefono: '+56912345678', comuna: 'chillan viejo' }] })
    abrir()
    await waitFor(() => expect(screen.getByLabelText('Dirección')).toHaveValue('Libertad 123'))
    expect(screen.getByLabelText('Nombre')).toHaveValue('Camila Rojas')
    expect(confirmar()).toBeDisabled()
  })
  it.each([null, { ...CUENTAS.camila, nombre: 'Camila Rojas' }])(
    'registra con formulario válido e identidad %j mediante el Gateway simulado', async usuario => {
      if (usuario) guardarSesionDePrueba(usuario)
      const api = simularApi({
        'GET /productos': () => [200, [producto]], 'GET /categorias': () => [200, [categoria]],
        'GET /usuarios/yo': () => [200, { ...CUENTAS.camila, telefono: '+56912345678', direccion: 'Libertad 123', comuna: 'Chillán' }],
        'POST /boletas': cuerpo => [201, { id: 81, clienteId: cuerpo.clienteId, direccion: cuerpo.direccion,
          comuna: cuerpo.comuna, estado: 'PENDIENTE', repartidorId: null, fecha: cuerpo.fecha, total: 220,
          detalles: [{ id: 101, productoId: 901, cantidad: 1, precio: 220 }] }],
      })
      abrir()
      await screen.findByText('Producto oficial API')
      if (usuario) await waitFor(() => expect(screen.getByLabelText('Dirección')).toHaveValue('Libertad 123'))
      for (const [campo, value] of [['Nombre', 'Camila Rojas'], ['Correo electrónico', 'camila@gmail.com'],
        ['Teléfono', '+56912345678'], ['Dirección', 'Libertad 123'], ['Comuna', 'Chillán']]) {
        fireEvent.change(screen.getByLabelText(campo), { target: { value } })
      }
      expect(confirmar()).toBeEnabled()
      expect(api.mock.calls.some(([, opciones]) => opciones.method === 'POST')).toBe(false)
      fireEvent.click(confirmar())
      await screen.findByText(/Boleta registrada N.º 81/)
      const solicitudes = api.mock.calls.filter(([, opciones]) => opciones.method === 'POST')
      expect(solicitudes).toHaveLength(1)
      const [url, opciones] = solicitudes[0]
      expect(String(url)).toMatch(/\/api\/v1\/boletas$/)
      expect(opciones.headers['idempotency-key']).toBe(leerIntentoCompra().clave)
      expect(Boolean(opciones.headers.Authorization?.startsWith('Bearer '))).toBe(Boolean(usuario))
      expect(JSON.parse(opciones.body)).toMatchObject({ clienteId: usuario?.id ?? null, detalles: [{ productoId: 901, cantidad: 1 }] })
      expect(opciones.body).not.toMatch(/numeroTarjeta|cvv|titular|vencimiento/)
      expect(document.querySelector('#numeroTarjeta')).toBeNull()
      expect(document.querySelector('#cvv')).toBeNull()
      expect(JSON.parse(localStorage.getItem('carritoVolcan'))).toEqual([{ codigo: 'CL002', cantidad: 1 }])
      expect(localStorage.getItem('pedidos_volcan')).toBeNull()
      expect(producto.stock).toBe(3)
    })
  it('rechaza cantidades que superan el stock sin preparar un intento', async () => {
    const api = apiCon()
    abrir([{ codigo: 'CL002', cantidad: 4 }])
    await screen.findByText(/Hay productos inválidos/)
    expect(confirmar()).toBeDisabled()
    fireEvent.submit(document.getElementById('formCheckout'))
    expect(leerIntentoCompra()).toBeNull()
    expect(api.mock.calls.every(([, opciones]) => opciones.method === 'GET')).toBe(true)
    expect(JSON.parse(localStorage.getItem('carritoVolcan'))).toEqual([{ codigo: 'CL002', cantidad: 4 }])
  })
})
