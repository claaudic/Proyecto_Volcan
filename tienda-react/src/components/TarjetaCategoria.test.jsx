import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import TarjetaCategoria from './TarjetaCategoria'

// Pruebas de props de la tarjeta de categoria

function montar(cantidad) {
  render(
    <MemoryRouter>
      <TarjetaCategoria nombre="Reguladores" imagen="/img/rg001.jpg" cantidad={cantidad} enlace="/categorias/reguladores" />
    </MemoryRouter>
  )
}

describe('Tarjeta de categoría', () => {

  it('muestra el nombre, la cantidad y enlaza a la categoría', () => {
    montar(3)

    expect(screen.getByRole('heading', { name: 'Reguladores' })).toBeInTheDocument()
    expect(screen.getByText('3 productos')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver categoría' })).toHaveAttribute('href', '/categorias/reguladores')
  })

  it('usa el singular cuando hay un solo producto', () => {
    montar(1)

    expect(screen.getByText('1 producto')).toBeInTheDocument()
  })

  it('si la imagen no carga, muestra el logo una sola vez', () => {
    montar(3)
    const imagen = document.querySelector('img')

    fireEvent.error(imagen)
    expect(imagen.getAttribute('src')).toBe('/img/logo.svg')

    // Si el logo tampoco cargara, no vuelve a cambiarla (evita un ciclo)
    fireEvent.error(imagen)
    expect(imagen.getAttribute('src')).toBe('/img/logo.svg')
  })

})
