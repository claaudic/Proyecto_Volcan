import { describe, it, expect } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CarritoPanel from './CarritoPanel'
import { renderizar } from '../test/renderizar'
import { abrirPanelCarrito, cerrarPanelCarrito } from '../utilidades/panelCarrito'

// Pruebas del panel lateral del carrito: estado vacio,
// cambiar cantidades, quitar, vaciar e ir a pagar.
// Siguen el patron Preparar -> Actuar -> Comprobar.

const DOS_PRODUCTOS = [
  { codigo: 'CL001', cantidad: 1 },
  { codigo: 'RG001', cantidad: 2 }
]

function carritoGuardado() {
  return JSON.parse(localStorage.getItem('carritoVolcan'))
}

describe('Panel del carrito', () => {

  it('vacío invita a ver el catálogo', () => {
    renderizar(<CarritoPanel />)

    expect(screen.getByText('Tu carrito está vacío')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver el catálogo' })).toHaveAttribute('href', '/productos')
  })

  it('muestra cada producto y el total', () => {
    renderizar(<CarritoPanel />, { carrito: DOS_PRODUCTOS })

    expect(screen.getByRole('heading', { name: 'Cilindro GLP 5 kg' })).toBeInTheDocument()
    expect(screen.getByText('$24.480')).toBeInTheDocument()
  })

  it('suma y resta unidades con los botones', async () => {
    // 1 Preparar
    const user = userEvent.setup()
    renderizar(<CarritoPanel />, { carrito: DOS_PRODUCTOS })

    // 2 Actuar: una unidad mas del cilindro y una menos del regulador
    const sumar = screen.getAllByRole('button', { name: 'Agregar una unidad' })
    const restar = screen.getAllByRole('button', { name: 'Quitar una unidad' })
    await user.click(sumar[0])
    await user.click(restar[1])

    // 3 Comprobar
    expect(carritoGuardado()).toEqual([
      { codigo: 'CL001', cantidad: 2 },
      { codigo: 'RG001', cantidad: 1 }
    ])
  })

  it('quita un producto y vacía el carrito', async () => {
    const user = userEvent.setup()
    renderizar(<CarritoPanel />, { carrito: DOS_PRODUCTOS })

    await user.click(screen.getAllByRole('button', { name: 'Quitar' })[0])
    expect(carritoGuardado()).toEqual([{ codigo: 'RG001', cantidad: 2 }])

    await user.click(screen.getByRole('button', { name: 'Vaciar carrito' }))
    expect(screen.getByText('Tu carrito está vacío')).toBeInTheDocument()
  })

  it('el botón Pagar lleva al checkout', async () => {
    const user = userEvent.setup()
    renderizar(<CarritoPanel />, { carrito: DOS_PRODUCTOS })

    await user.click(screen.getByRole('link', { name: 'Pagar' }))

    expect(screen.getByRole('heading', { name: 'Página de checkout' })).toBeInTheDocument()
  })

  it('si una imagen no carga, muestra el logo', () => {
    renderizar(<CarritoPanel />, { carrito: DOS_PRODUCTOS })

    const imagen = screen.getByRole('img', { name: 'Cilindro GLP 5 kg' })
    fireEvent.error(imagen)

    expect(imagen.getAttribute('src')).toBe('/img/logo.svg')
  })

})

describe('Abrir y cerrar el panel desde el código', () => {

  it('no falla si el panel no está en la página', () => {
    expect(() => abrirPanelCarrito()).not.toThrow()
    expect(() => cerrarPanelCarrito()).not.toThrow()
  })

  it('abre el panel cuando existe', () => {
    renderizar(<CarritoPanel />)

    abrirPanelCarrito()

    expect(document.getElementById('panelCarrito').classList.contains('showing') ||
      document.getElementById('panelCarrito').classList.contains('show')).toBe(true)
  })

})
