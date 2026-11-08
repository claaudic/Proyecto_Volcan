import { describe, it, expect, beforeEach } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import Despachadora from './Despachadora'
import { leerPedidos } from '../datos/pedidos'
import { renderizar, pedidoDeEjemplo } from '../test/renderizar'
import { simularApiDeUsuarios, simularApiApagada } from '../test/api'

const DESPACHADORA = {
  nombre: 'Daniela Fuentes',
  correo: 'despachadora@gaselvolcan.cl',
  rol: 'DESPACHADORA'
}

const PEDIDOS = [
  pedidoDeEjemplo({ numero: 1, fecha: '2026-10-01T12:00:00.000Z', estado: 'Entregado', repartidor: 'repartidor@gaselvolcan.cl' }),
  pedidoDeEjemplo({ numero: 2, fecha: '2026-10-03T12:00:00.000Z', estado: 'En camino', repartidor: 'repartidor2@gaselvolcan.cl' }),
  pedidoDeEjemplo({ numero: 3, fecha: '2026-10-05T12:00:00.000Z', estado: 'Pendiente', repartidor: '' })
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

describe('Panel de despachadora', () => {

  // Los repartidores llegan de ms-usuarios (simulado)
  beforeEach(() => {
    simularApiDeUsuarios()
  })

  it('muestra resumen y pedidos para despacho', () => {
    renderizar(<Despachadora />, { usuario: DESPACHADORA, pedidos: PEDIDOS })

    expect(screen.getByRole('heading', { name: 'Gestión de pedidos' })).toBeInTheDocument()
    expect(valorDeTarjeta('Pedidos registrados')).toHaveTextContent('3')
    expect(valorDeTarjeta('Pendientes')).toHaveTextContent('1')
    expect(valorDeTarjeta('En camino')).toHaveTextContent('1')
    expect(valorDeTarjeta('Entregados')).toHaveTextContent('1')
    expect(filaConPedido(3)).toBeDefined()
  })

  it('asigna repartidor y cambia estado de un pedido', async () => {
    const user = userEvent.setup()
    renderizar(<Despachadora />, { usuario: DESPACHADORA, pedidos: PEDIDOS })

    // Espera a que lleguen los repartidores del backend
    await within(filaConPedido(3)).findByRole('option', { name: 'Matías Vera' })
    await user.selectOptions(
      within(filaConPedido(3)).getByLabelText('Asignar repartidor al pedido 3'),
      'repartidor@gaselvolcan.cl'
    )
    await user.selectOptions(
      within(filaConPedido(3)).getByLabelText('Cambiar estado del pedido 3'),
      'En camino'
    )

    const pedido = leerPedidos().find((uno) => uno.numero === 3)

    expect(pedido.repartidor).toBe('repartidor@gaselvolcan.cl')
    expect(pedido.estado).toBe('En camino')
    expect(valorDeTarjeta('Pendientes')).toHaveTextContent('0')
    expect(valorDeTarjeta('En camino')).toHaveTextContent('2')
  })

  it('si el backend no responde, avisa que faltan los repartidores', async () => {
    simularApiApagada()
    renderizar(<Despachadora />, { usuario: DESPACHADORA, pedidos: PEDIDOS })

    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo cargar la lista de repartidores.')
    // Los pedidos se siguen viendo
    expect(filas()).toHaveLength(3)
  })

  it('avisa si no hay pedidos', () => {
    renderizar(<Despachadora />, { usuario: DESPACHADORA })

    expect(screen.getByText('No hay pedidos registrados')).toBeInTheDocument()
  })

})
