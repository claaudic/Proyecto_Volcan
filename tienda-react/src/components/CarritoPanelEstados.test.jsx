import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
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
    expect(screen.getByRole('list', { name: 'Articulos guardados pendientes de validar' })).toHaveTextContent('CL002: 2 unidades')
    expect(screen.queryByText(/Tu carrito/)).not.toBeInTheDocument()
    expect(screen.queryByText('$30.000')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Pagar' })).toBeDisabled()
    expect(screen.queryByRole('link', { name: 'Pagar' })).not.toBeInTheDocument()
    expect(guardados()).toEqual(articulos)
  })
  it('explica el error, no muestra importes anteriores y permite reintentar', async () => {
    const user = userEvent.setup()
    const recargar = vi.fn()
    abrir({ activos: [producto], error: 'Sin conexion', recargar })
    expect(screen.getByRole('alert')).toHaveTextContent('Tus articulos siguen guardados')
    expect(screen.getByRole('alert')).toHaveTextContent('Sin conexion')
    expect(screen.queryByText('$30.000')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Pagar' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Reintentar catalogo' }))
    expect(recargar).toHaveBeenCalledOnce()
    expect(guardados()).toEqual(articulos)
  })
  it('permite quitar articulos y vaciar sin conexion por accion del usuario', async () => {
    const user = userEvent.setup()
    abrir({ activos: [], error: 'Sin conexion' }, [...articulos, { codigo: 'OTRO', cantidad: 1 }])
    await user.click(screen.getByRole('button', { name: 'Quitar OTRO' }))
    expect(guardados()).toEqual(articulos)
    await user.click(screen.getByRole('button', { name: 'Vaciar carrito' }))
    expect(guardados()).toEqual([])
  })
  it('distingue stock insuficiente de un carrito vacio y no descarta cantidades', () => {
    abrir({ activos: [{ ...producto, stock: 1 }] })
    expect(screen.getByRole('alert')).toHaveTextContent('sin disponibilidad suficiente')
    expect(screen.getByRole('button', { name: 'Pagar' })).toBeDisabled()
    expect(screen.queryByRole('link', { name: 'Pagar' })).not.toBeInTheDocument()
    expect(guardados()).toEqual(articulos)
  })
  it('un producto ausente conserva su codigo y cantidad y no permite pagar', () => {
    abrir({ activos: [] })
    expect(screen.getByRole('list')).toHaveTextContent('CL002: 2 unidades')
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Pagar' })).toBeDisabled()
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
})
