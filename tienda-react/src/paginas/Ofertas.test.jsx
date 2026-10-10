import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import Ofertas from './Ofertas'
import { renderizar } from '../test/renderizar'

describe('Ofertas', () => {

  it('muestra solo productos con precio especial', () => {
    renderizar(<Ofertas />)

    expect(screen.getByRole('heading', { name: 'Ofertas' })).toBeInTheDocument()
    expect(screen.getAllByRole('article')).toHaveLength(4)
    expect(screen.getByRole('heading', { name: 'Cilindro GLP 11 kg' })).toBeInTheDocument()
    expect(screen.getByText('$10.500')).toBeInTheDocument()
    expect(screen.getByText('$12.000')).toBeInTheDocument()
    expect(screen.getByText('Oferta hogar')).toBeInTheDocument()
  })

  it('agrega al carrito usando el código del producto en oferta', async () => {
    const user = userEvent.setup()
    renderizar(<Ofertas />)

    await user.click(screen.getAllByRole('button', { name: 'Añadir' })[0])

    expect(JSON.parse(localStorage.getItem('carritoVolcan'))).toEqual([
      { codigo: 'CL002', cantidad: 1 }
    ])
    expect(screen.getAllByRole('button', { name: 'Agregado' })).toHaveLength(1)
  })

})
