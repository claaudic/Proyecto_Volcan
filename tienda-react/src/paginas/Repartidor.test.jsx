import { describe, it, expect } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import Repartidor from './Repartidor'
import { leerPedidos } from '../datos/pedidos'
import { renderizar, CLIENTE, pedidoDeEjemplo } from '../test/renderizar'

const REPARTIDOR = {
  nombre: 'Matías Vera',
  correo: 'repartidor@gaselvolcan.cl',
  rol: 'REPARTIDOR'
}

const PEDIDOS = [
  pedidoDeEjemplo({ numero: 1, fecha: '2026-10-01T12:00:00.000Z', estado: 'Entregado', repartidor: 'repartidor@gaselvolcan.cl' }),
  pedidoDeEjemplo({ numero: 2, fecha: '2026-10-03T12:00:00.000Z', estado: 'En camino', repartidor: 'repartidor@gaselvolcan.cl' }),
  pedidoDeEjemplo({ numero: 3, fecha: '2026-10-05T12:00:00.000Z', estado: 'Pendiente', repartidor: 'repartidor2@gaselvolcan.cl' }),
  pedidoDeEjemplo({ numero: 4, fecha: '2026-10-06T12:00:00.000Z', estado: 'Pendiente', repartidor: 'repartidor@gaselvolcan.cl' }),
  pedidoDeEjemplo({ numero: 5, fecha: '2026-10-07T12:00:00.000Z', estado: 'Cancelado', repartidor: 'repartidor@gaselvolcan.cl' })
]

function filas() {
  return screen.getAllByRole('row').slice(1)
}

function filaConPedido(numero) {
  return filas().find((fila) => fila.textContent.includes(`#${numero}`))
}

function valorDeTarjeta(etiqueta) {
  const textos = screen.getAllByText(etiqueta)
  const tarjeta = textos.find((texto) =>
    texto.classList.contains('tarjeta-dato-texto')
  )

  return tarjeta.nextElementSibling
}

describe('Panel de repartidor', () => {

  it('un cliente no puede entrar', () => {
    renderizar(<Repartidor />, { usuario: CLIENTE })

    expect(screen.getByRole('heading', { name: 'Página de login' })).toBeInTheDocument()
  })

  it('muestra solo los pedidos asignados al repartidor', () => {
    renderizar(<Repartidor />, { usuario: REPARTIDOR, pedidos: PEDIDOS })

    expect(screen.getByRole('heading', { name: 'Mis pedidos asignados' })).toBeInTheDocument()
    expect(filaConPedido(4)).toBeDefined()
    expect(filaConPedido(2)).toBeDefined()
    expect(filaConPedido(1)).toBeDefined()
    expect(filaConPedido(3)).toBeUndefined()
    expect(filaConPedido(5)).toBeUndefined()
    expect(valorDeTarjeta('Pendientes')).toHaveTextContent('1')
    expect(valorDeTarjeta('En camino')).toHaveTextContent('1')
    expect(valorDeTarjeta('Entregados')).toHaveTextContent('1')
  })

  it('actualiza el estado de un pedido asignado', async () => {
    const user = userEvent.setup()
    renderizar(<Repartidor />, { usuario: REPARTIDOR, pedidos: PEDIDOS })

    await user.selectOptions(
      within(filaConPedido(4)).getByLabelText('Cambiar el estado del pedido 4'),
      'En camino'
    )

    const pedido = leerPedidos().find((uno) => uno.numero === 4)

    expect(pedido.estado).toBe('En camino')
    expect(valorDeTarjeta('Pendientes')).toHaveTextContent('0')
    expect(valorDeTarjeta('En camino')).toHaveTextContent('2')
  })

  it('bloquea la edición de pedidos entregados', () => {
    renderizar(<Repartidor />, { usuario: REPARTIDOR, pedidos: PEDIDOS })

    expect(
      within(filaConPedido(1)).getByLabelText('Cambiar el estado del pedido 1')
    ).toBeDisabled()
  })

  it('avisa si no tiene pedidos asignados', () => {
    renderizar(<Repartidor />, { usuario: REPARTIDOR })

    expect(screen.getByText('No tienes pedidos asignados')).toBeInTheDocument()
  })

})
