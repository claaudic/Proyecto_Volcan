import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import CarritoPanel from './CarritoPanel'
import ProveedorCarrito from '../contexto/ProveedorCarrito'
import { CatalogoContexto } from '../contexto/catalogoContexto'

const producto = { id: 2, codigo: 'CL002', nombre: 'Producto API', precioResidencial: 20000,
  precioOferta: 15000, etiquetaOferta: 'API', stock: 8, activo: true }
const articulos = [{ codigo: 'CL002', cantidad: 2 }]
const guardados = () => JSON.parse(localStorage.getItem('carritoVolcan'))

// Panel y proveedor reales; el contexto de entrada permite controlar carga/error.
// No se simula ni reemplaza ningun modulo del carrito ni las pruebas anteriores.
function abrir(inicial, items = articulos) {
  localStorage.setItem('carritoVolcan', JSON.stringify(items))
  let catalogo = inicial
  const arbol = () => (
    <MemoryRouter>
      <CatalogoContexto.Provider value={catalogo}>
        <ProveedorCarrito>
          <Routes>
            <Route path="/" element={<CarritoPanel />} />
            <Route path="/checkout" element={<h1>Destino checkout</h1>} />
          </Routes>
        </ProveedorCarrito>
      </CatalogoContexto.Provider>
    </MemoryRouter>
  )
  const vista = render(arbol())
  return { ...vista, actualizar: (nuevo) => { catalogo = nuevo; vista.rerender(arbol()) } }
}

describe('Panel real con disponibilidad del carrito', () => {
  it('conserva el estado vacio cuando el catalogo esta listo', () => {
    abrir({ activos: [producto] }, [])
    expect(screen.getByText(/Tu carrito/)).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Pagar' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Pagar' })).not.toBeInTheDocument()
  })
  it('muestra la carga sin afirmar que el carrito esta vacio ni exponer precios', () => {
    abrir({ activos: [producto], cargando: true })
    expect(screen.getByRole('status')).toHaveTextContent('Comprobando precios y stock')
    expect(screen.getByRole('status')).toHaveClass('visually-hidden')
    expect(screen.getByRole('heading', { name: 'CL002' })).toBeInTheDocument()
    expect(screen.getByRole('list')).toHaveClass('panel-lista')
    expect(document.querySelector('.cantidad-valor')).toHaveTextContent('2')
    expect(document.querySelector('.panel-total strong')).toHaveTextContent('—')
    expect(screen.queryByText(/Tu carrito/)).not.toBeInTheDocument()
    expect(screen.queryByText('$30.000')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Pagar' })).toHaveAttribute('aria-disabled', 'true')
    expect(screen.queryByRole('button', { name: 'Pagar' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Agregar una unidad' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Quitar una unidad' })).toBeDisabled()
    expect(guardados()).toEqual(articulos)
  })
  it('conserva filas y pie ante un error sin mostrar importes ni añadir controles', async () => {
    const user = userEvent.setup()
    const recargar = vi.fn()
    abrir({ activos: [producto], error: 'Sin conexion', recargar })
    expect(screen.getByRole('alert')).toHaveTextContent('Ocurrió un error inesperado. Intenta de nuevo.')
    expect(screen.getByRole('heading', { name: 'CL002' }).closest('li')).toHaveClass('panel-item')
    expect(screen.queryByText('$30.000')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Pagar' })).toHaveAttribute('aria-disabled', 'true')
    expect(screen.queryByRole('button', { name: /Reintentar|Pagar/ })).not.toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: 'Pagar' }))
    expect(screen.queryByRole('heading', { name: 'Destino checkout' })).not.toBeInTheDocument()
    expect(recargar).not.toHaveBeenCalled()
    expect(guardados()).toEqual(articulos)
  })
  it('permite quitar articulos y vaciar sin conexion por accion del usuario', async () => {
    const user = userEvent.setup()
    abrir({ activos: [], error: 'Sin conexion' }, [...articulos, { codigo: 'OTRO', cantidad: 1 }])
    const fila = screen.getByRole('heading', { name: 'OTRO' }).closest('li')
    await user.click(within(fila).getByRole('button', { name: 'Quitar' }))
    expect(guardados()).toEqual(articulos)
    await user.click(screen.getByRole('button', { name: 'Vaciar carrito' }))
    expect(guardados()).toEqual([])
  })
  it('distingue stock insuficiente de un carrito vacio y no descarta cantidades', () => {
    abrir({ activos: [{ ...producto, stock: 1 }] })
    expect(screen.getByRole('alert')).toHaveTextContent('Solo queda 1 unidad disponible.')
    expect(screen.getByRole('heading', { name: 'Producto API' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Pagar' })).toHaveAttribute('aria-disabled', 'true')
    expect(guardados()).toEqual(articulos)
  })
  it('un producto ausente conserva su codigo y cantidad y no permite pagar', () => {
    abrir({ activos: [] })
    expect(screen.getByRole('heading', { name: 'CL002' })).toBeInTheDocument()
    expect(document.querySelector('.cantidad-valor')).toHaveTextContent('2')
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Pagar' })).toHaveAttribute('aria-disabled', 'true')
    expect(guardados()).toEqual(articulos)
  })
  it('recupera el carrito tras el error con los nuevos precios API', () => {
    const recargar = vi.fn()
    const vista = abrir({ activos: [], error: 'Sin conexion', recargar })
    vista.actualizar({ activos: [], cargando: true, recargar })
    expect(screen.getByRole('status')).toBeInTheDocument()
    vista.actualizar({ activos: [{ ...producto, precioOferta: null, precioResidencial: 18000 }], cargando: false, error: '', recargar })
    expect(screen.getByText('$36.000', { selector: '.panel-total strong' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Pagar' })).toHaveAttribute('href', '/checkout')
    expect(guardados()).toEqual(articulos)
  })
  it('el estado listo usa el calculo de ofertas y permite navegar desde el panel', async () => {
    const user = userEvent.setup()
    abrir({ activos: [producto] })
    expect(screen.getByText('$30.000', { selector: '.panel-total strong' })).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: 'Pagar' }))
    expect(screen.getByRole('heading', { name: 'Destino checkout' })).toBeInTheDocument()
  })
  it('no ofrece un reintento ficticio si el catalogo no proporciona recargar', () => {
    abrir({ activos: [], error: 'Sin conexion' })
    expect(screen.queryByRole('button', { name: 'Reintentar catalogo' })).not.toBeInTheDocument()
  })
  it.each([{ cargando: true }, { error: 'Sin conexion' }])('el carrito vacío conserva la presentación original con %j', catalogo => {
    abrir({ activos: [], ...catalogo }, [])
    expect(screen.getByText('Tu carrito está vacío')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver el catálogo' })).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(document.querySelector('.panel-pie')).toBeNull()
  })
  it('permite corregir explícitamente la cantidad con stock vigente y recuperar Pagar', async () => {
    const user = userEvent.setup()
    abrir({ activos: [{ ...producto, stock: 1 }] })
    expect(guardados()).toEqual(articulos)
    await user.click(screen.getByRole('button', { name: 'Quitar una unidad' }))
    expect(guardados()).toEqual([{ codigo: 'CL002', cantidad: 1 }])
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Pagar' })).not.toHaveAttribute('aria-disabled')
    expect(document.querySelector('.panel-total strong')).toHaveTextContent('$15.000')
  })
  it.each([1, 2])('resta exactamente una unidad por clic cuando el stock es %i', async stock => {
    const user = userEvent.setup()
    let cantidad = stock + 3
    abrir({ activos: [{ ...producto, stock }] }, [{ codigo: 'CL002', cantidad }])
    expect(screen.getByRole('alert')).toHaveTextContent(stock === 1
      ? 'Solo queda 1 unidad disponible.' : 'Solo quedan 2 unidades disponibles.')
    while (cantidad > stock) {
      expect(screen.getByRole('link', { name: 'Pagar' })).toHaveAttribute('aria-disabled', 'true')
      await user.click(screen.getByRole('link', { name: 'Pagar' }))
      expect(screen.queryByRole('heading', { name: 'Destino checkout' })).not.toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: 'Quitar una unidad' }))
      cantidad -= 1
      expect(guardados()).toEqual([{ codigo: 'CL002', cantidad }])
      expect(document.querySelector('.cantidad-valor')).toHaveTextContent(String(cantidad))
    }
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Pagar' })).not.toHaveAttribute('aria-disabled')
    expect(document.querySelector('.panel-total strong')).toHaveTextContent(stock === 1 ? '$15.000' : '$30.000')
  })
  it('con stock cero permite restar de una en una sin habilitar Pagar', async () => {
    const user = userEvent.setup()
    abrir({ activos: [{ ...producto, stock: 0 }] }, [{ codigo: 'CL002', cantidad: 3 }])
    for (const cantidad of [2, 1]) {
      await user.click(screen.getByRole('button', { name: 'Quitar una unidad' }))
      expect(guardados()).toEqual([{ codigo: 'CL002', cantidad }])
      expect(screen.getByRole('link', { name: 'Pagar' })).toHaveAttribute('aria-disabled', 'true')
      expect(screen.getByRole('button', { name: 'Agregar una unidad' })).toBeDisabled()
    }
    expect(screen.getByRole('button', { name: 'Quitar una unidad' })).toBeDisabled()
  })
  it('bloquea la navegación por teclado cuando el total no está verificado', async () => {
    const user = userEvent.setup()
    abrir({ activos: [], error: 'Sin conexion' })
    const pagar = screen.getByRole('link', { name: 'Pagar' })
    pagar.focus()
    await user.keyboard('{Enter}')
    expect(screen.queryByRole('heading', { name: 'Destino checkout' })).not.toBeInTheDocument()
    expect(guardados()).toEqual(articulos)
  })
})
