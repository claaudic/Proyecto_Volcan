import { describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { Link, MemoryRouter } from 'react-router-dom'
import App from '../App'
import ProveedorSesion from '../contexto/ProveedorSesion'
import { ProveedorCatalogoHttp } from '../contexto/ProveedorCatalogo'
import ProveedorCarrito from '../contexto/ProveedorCarrito'
import { useCatalogo } from '../contexto/catalogoContexto'
import { useCarrito } from '../contexto/carritoContexto'
import RefrescarCatalogoPublico from '../components/RefrescarCatalogoPublico'
import { CATEGORIAS_HTTP, PRODUCTOS_HTTP, simularCatalogoHttp } from '../test/catalogoHttp'
import { CUENTAS, guardarSesionDePrueba } from '../test/api'
import { API_URL } from '../utilidades/api'

function diferida() {
  let resolver
  const promesa = new Promise(resolve => { resolver = resolve })
  return { promesa, resolver }
}
function ControlCatalogo() {
  const catalogo = useCatalogo()
  const carrito = useCarrito()
  return <>
    <output data-testid="estado-http">{JSON.stringify({ catalogo: catalogo.estado,
      productos: catalogo.productos.length, categorias: catalogo.categorias.length,
      carrito: carrito.estado, items: carrito.items, total: carrito.detalle.total })}</output>
    <button onClick={catalogo.recargar}>Recargar catálogo de prueba</button>
    <button onClick={() => carrito.agregar('CL002', 1)}>Añadir CL002 de prueba</button>
    <Link to="/productos">Volver a tienda de prueba</Link>
    <Link to="/admin/productos">Ir a administración de prueba</Link>
  </>
}
function abrir(ruta = '/productos') {
  return render(<MemoryRouter initialEntries={[ruta]}>
    <ProveedorSesion><ProveedorCatalogoHttp>
      <RefrescarCatalogoPublico />
      <ProveedorCarrito><App /><ControlCatalogo /></ProveedorCarrito>
    </ProveedorCatalogoHttp></ProveedorSesion>
  </MemoryRouter>)
}
const estado = () => JSON.parse(screen.getByTestId('estado-http').textContent)
const main = () => screen.getByRole('main')
const cargaCompleta = async (valor = 'disponible') => waitFor(() => expect(estado().catalogo).toBe(valor))
const escrituras = api => api.mock.calls.filter(([, opciones]) => opciones.method !== 'GET')
const rutas = ['/', '/productos', '/categorias', '/categorias/cilindros-de-gas', '/producto/CL002', '/ofertas']

describe('Catálogo público HTTP con las rutas y proveedores de la aplicación', () => {
  it.each(rutas)('%s espera el catálogo oficial sin mostrar falsos vacíos ni no encontrados', async ruta => {
    const pendiente = diferida()
    const api = simularCatalogoHttp({ 'GET /productos': () => pendiente.promesa })
    abrir(ruta)
    expect(within(main()).getByText('Cargando catálogo oficial…')).toHaveClass('visually-hidden')
    if (ruta === '/productos') expect(within(main()).getByRole('searchbox')).toBeInTheDocument()
    expect(within(main()).queryByRole('button', { name: /Reintentar catálogo|Actualizar catálogo/ })).not.toBeInTheDocument()
    expect(main()).not.toHaveTextContent(/No encontramos|No hay ofertas|No hay productos/)
    expect(main().querySelector('.tarjeta-producto')).toBeNull()
    await act(async () => { pendiente.resolver([200, PRODUCTOS_HTTP]) })
    await cargaCompleta()
    expect(estado()).toMatchObject({ productos: 14, categorias: 4 })
    expect(main()).not.toHaveTextContent('Cargando catálogo oficial…')
    expect(api.mock.calls.filter(([url]) => url === API_URL + '/productos')).toHaveLength(1)
    expect(api.mock.calls.filter(([url]) => url === API_URL + '/categorias')).toHaveLength(1)
    expect(escrituras(api)).toHaveLength(0)
    if (ruta === '/') expect(main().querySelectorAll('.tarjeta-producto')).toHaveLength(8)
    if (ruta === '/productos') expect(main().querySelectorAll('.tarjeta-producto')).toHaveLength(14)
    if (ruta === '/categorias') expect(main().querySelectorAll('.tarjeta-categoria')).toHaveLength(4)
    if (ruta.includes('/categorias/')) expect(main().querySelectorAll('.tarjeta-producto:not(.tarjeta-categoria)')).toHaveLength(4)
    if (ruta.includes('/producto/')) expect(within(main()).getByRole('heading', { level: 1 })).toHaveTextContent('Cilindro GLP 11 kg')
    if (ruta === '/ofertas') expect(main().querySelectorAll('.tarjeta-producto')).toHaveLength(4)
  })

  it.each(rutas)('%s muestra el error y reintenta solo GET sin respaldo local', async ruta => {
    localStorage.setItem('productosSistema', JSON.stringify([{ ...PRODUCTOS_HTTP[0], nombre: 'Respaldo prohibido' }]))
    let falla = true
    const api = simularCatalogoHttp({ 'GET /productos': () => falla ? [503, { mensaje: 'Catálogo no disponible' }] : [200, PRODUCTOS_HTTP] })
    const leer = vi.spyOn(Storage.prototype, 'getItem')
    const escribir = vi.spyOn(Storage.prototype, 'setItem')
    abrir(ruta); await cargaCompleta('error')
    expect(within(main()).getByRole('alert')).toHaveTextContent('Ocurrió un error inesperado. Intenta de nuevo.')
    expect(main()).not.toHaveTextContent('Catálogo no disponible')
    expect(main()).not.toHaveTextContent('Respaldo prohibido')
    expect(estado()).toMatchObject({ productos: 0, categorias: 0 })
    expect(leer.mock.calls.some(([clave]) => clave === 'productosSistema')).toBe(false)
    expect(escribir.mock.calls.some(([clave]) => clave === 'productosSistema')).toBe(false)
    falla = false
    const acciones = {
      '/': ['link', 'Ver catálogo completo'], '/productos': ['button', 'Ver todo el catálogo'],
      '/categorias': ['link', 'Inicio'], '/categorias/cilindros-de-gas': ['link', 'Ver todas las categorías'],
      '/producto/CL002': ['link', 'Volver al catálogo'], '/ofertas': ['link', 'Ver catálogo']
    }
    const [rol, nombre] = acciones[ruta]
    fireEvent.click(within(main()).getByRole(rol, { name: nombre }))
    await cargaCompleta()
    expect(estado()).toMatchObject({ productos: 14, categorias: 4 })
    expect(api.mock.calls.filter(([url]) => url === API_URL + '/productos')).toHaveLength(2)
    expect(escrituras(api)).toHaveLength(0)
  })

  it.each([null, [{ ...PRODUCTOS_HTTP[0], stock: -1 }], [PRODUCTOS_HTTP[0], PRODUCTOS_HTTP[0]]])(
    'rechaza respuestas inválidas sin publicar tarjetas parciales %#', async productos => {
      simularCatalogoHttp({ 'GET /productos': () => [200, productos] })
      abrir(); await cargaCompleta('error')
      expect(within(main()).getByRole('alert')).toHaveTextContent('Ocurrió un error inesperado. Intenta de nuevo.')
      expect(main()).not.toHaveTextContent('formato inesperado')
      expect(main().querySelector('.tarjeta-producto')).toBeNull()
    }
  )

  it.each([
    ['/', null],
    ['/productos', 'No encontramos productos'],
    ['/categorias', null],
    ['/ofertas', 'No hay ofertas disponibles'],
    ['/producto/CL002', 'No encontramos ese producto']
  ])('%s distingue el catálogo vacío de un error', async (ruta, mensaje) => {
    const api = simularCatalogoHttp({ 'GET /productos': () => [200, []], 'GET /categorias': () => [200, []] })
    abrir(ruta); await cargaCompleta('vacio')
    if (mensaje) expect(main()).toHaveTextContent(mensaje)
    expect(main().querySelector('.tarjeta-producto')).toBeNull()
    expect(within(main()).queryByRole('button', { name: 'Actualizar catálogo' })).not.toBeInTheDocument()
    if (ruta === '/productos') {
      expect(within(main()).getByRole('searchbox')).toBeInTheDocument()
      expect(within(main()).getByRole('button', { name: 'Ver todo el catálogo' })).toBeInTheDocument()
    }
    expect(within(main()).queryByRole('alert')).not.toBeInTheDocument()
    expect(escrituras(api)).toHaveLength(0)
  })

  it('conserva la presentación original sin tarjetas de categorías vacías', async () => {
    const categorias = [...CATEGORIAS_HTTP, { id: 77, nombre: 'Nueva oficial' }]
    simularCatalogoHttp({ 'GET /categorias': () => [200, categorias] })
    const vista = abrir('/categorias'); await cargaCompleta()
    expect(estado().categorias).toBe(5)
    expect(main().querySelectorAll('.tarjeta-categoria')).toHaveLength(4)
    expect(within(main()).queryByRole('heading', { name: 'Nueva oficial' })).not.toBeInTheDocument()
    vista.unmount()
    abrir('/categorias/nueva-oficial'); await cargaCompleta()
    expect(main()).toHaveTextContent('No encontramos esa categoría')
    expect(within(main()).getByRole('link', { name: 'Ver todas las categorías' })).toBeInTheDocument()
  })

  it('los filtros recuperan la agrupación original usando solo productos oficiales activos', async () => {
    const categorias = CATEGORIAS_HTTP.map(c => c.id === 1 ? { ...c, nombre: 'Gas oficial' } : c)
    categorias.push({ id: 77, nombre: 'Sin productos' })
    const productos = PRODUCTOS_HTTP.map(p => p.categoria.id === 1 ? { ...p, categoria: categorias[0] } : p)
    simularCatalogoHttp({ 'GET /productos': () => [200, productos], 'GET /categorias': () => [200, categorias] })
    abrir(); await cargaCompleta()
    fireEvent.click(within(main()).getByRole('button', { name: 'Gas oficial' }))
    expect(main().querySelectorAll('.tarjeta-producto')).toHaveLength(4)
    expect(within(main()).queryByRole('button', { name: 'Sin productos' })).not.toBeInTheDocument()
    fireEvent.change(within(main()).getByRole('searchbox'), { target: { value: 'No existe' } })
    expect(main()).toHaveTextContent('No encontramos productos')
    expect(main().querySelector('.tarjeta-producto')).toBeNull()
    fireEvent.click(within(main()).getByRole('button', { name: 'Ver todo el catálogo' }))
    expect(main().querySelectorAll('.tarjeta-producto')).toHaveLength(14)
  })

  it('conserva búsqueda y filtro durante la actualización sin mostrar datos antiguos', async () => {
    const pendiente = diferida()
    let veces = 0
    simularCatalogoHttp({ 'GET /productos': () => ++veces === 1 ? [200, PRODUCTOS_HTTP] : pendiente.promesa })
    abrir(); await cargaCompleta()
    fireEvent.change(within(main()).getByRole('searchbox'), { target: { value: '11 kg' } })
    fireEvent.click(within(main()).getByRole('button', { name: 'Cilindros de Gas' }))
    fireEvent.click(screen.getByRole('button', { name: 'Recargar catálogo de prueba' }))
    expect(main()).toHaveTextContent('Actualizando catálogo oficial…')
    expect(main().querySelector('.tarjeta-producto')).toBeNull()
    expect(main()).not.toHaveTextContent('No encontramos productos')
    await act(async () => { pendiente.resolver([200, PRODUCTOS_HTTP]) })
    await cargaCompleta()
    expect(within(main()).getByRole('searchbox')).toHaveValue('11 kg')
    expect(within(main()).getByRole('button', { name: 'Cilindros de Gas' })).toHaveAttribute('aria-pressed', 'true')
    expect(main().querySelectorAll('.tarjeta-producto')).toHaveLength(1)
  })

  it('Ofertas y Detalle respetan precioOferta=null y no recuperan promociones locales', async () => {
    const productos = PRODUCTOS_HTTP.map(p => ({ ...p, precioOferta: null, etiquetaOferta: null, precioResidencial: p.codigo === 'CL002' ? 22222 : p.precioResidencial }))
    simularCatalogoHttp({ 'GET /productos': () => [200, productos] })
    const vista = abrir('/ofertas'); await cargaCompleta()
    expect(main()).toHaveTextContent('No hay ofertas disponibles')
    expect(main().querySelector('.tarjeta-producto')).toBeNull()
    vista.unmount()
    abrir('/producto/CL002'); await cargaCompleta()
    expect(main()).toHaveTextContent('$22.222')
    expect(main()).not.toHaveTextContent('$10.500')
  })

  it('el detalle no muestra productos inactivos y mantiene el historial como preferencia local', async () => {
    const productos = PRODUCTOS_HTTP.map(p => p.codigo === 'CL002' ? { ...p, activo: false } : p)
    simularCatalogoHttp({ 'GET /productos': () => [200, productos] })
    abrir('/producto/CL002'); await cargaCompleta()
    expect(main()).toHaveTextContent('No encontramos ese producto')
    expect(localStorage.getItem('productosVistos')).toBeNull()
  })

  it('conserva y valida el carrito durante carga, error y cambios de stock', async () => {
    localStorage.setItem('carritoVolcan', JSON.stringify([{ codigo: 'CL002', cantidad: 2 }]))
    const pendiente = diferida()
    let falla = false
    let productos = PRODUCTOS_HTTP
    let veces = 0
    const api = simularCatalogoHttp({ 'GET /productos': () => ++veces === 1 ? pendiente.promesa : falla ? [503, { mensaje: 'Sin catálogo' }] : [200, productos] })
    abrir()
    expect(estado().carrito).toBe('cargando')
    fireEvent.click(screen.getByRole('button', { name: 'Añadir CL002 de prueba' }))
    expect(estado().items).toEqual([{ codigo: 'CL002', cantidad: 2 }])
    await act(async () => { pendiente.resolver([200, PRODUCTOS_HTTP]) })
    await cargaCompleta()
    expect(estado()).toMatchObject({ carrito: 'listo', total: 21000 })
    falla = true
    fireEvent.click(screen.getByRole('button', { name: 'Recargar catálogo de prueba' }))
    await cargaCompleta('error')
    expect(estado().carrito).toBe('error')
    expect(JSON.parse(localStorage.getItem('carritoVolcan'))).toEqual([{ codigo: 'CL002', cantidad: 2 }])
    falla = false
    productos = PRODUCTOS_HTTP.map(p => p.codigo === 'CL002' ? { ...p, stock: 1 } : p)
    fireEvent.click(within(main()).getByRole('button', { name: 'Ver todo el catálogo' }))
    await cargaCompleta()
    expect(estado().carrito).toBe('no-disponible')
    expect(estado().items).toEqual([{ codigo: 'CL002', cantidad: 2 }])
    expect(escrituras(api)).toHaveLength(0)
  })

  it('conserva la administración HTTP y refresca la tienda al volver del panel', async () => {
    guardarSesionDePrueba(CUENTAS.admin)
    let productos = PRODUCTOS_HTTP
    const api = simularCatalogoHttp({ 'GET /productos': () => [200, productos], 'GET /usuarios/yo': () => [200, CUENTAS.admin] })
    abrir('/admin/productos'); await cargaCompleta()
    await screen.findByText('Cilindro GLP 11 kg')
    expect(within(main()).getByRole('heading', { level: 1 })).toHaveTextContent('Gestión de productos')
    expect(within(main()).getAllByRole('columnheader')).toHaveLength(9)
    expect(within(main()).queryByRole('button', { name: 'Actualizar catálogo' })).not.toBeInTheDocument()
    productos = PRODUCTOS_HTTP.map(p => p.codigo === 'CL002' ? { ...p, nombre: 'Nombre actualizado en API', version: 1 } : p)
    fireEvent.click(screen.getByRole('link', { name: 'Volver a tienda de prueba' }))
    await cargaCompleta()
    await within(main()).findByText('Nombre actualizado en API')
    expect(main()).not.toHaveTextContent('Cilindro GLP 11 kg')
    expect(escrituras(api)).toHaveLength(0)
  })
})
