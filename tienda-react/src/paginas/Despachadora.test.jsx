import { describe, it, expect } from 'vitest'
import { screen, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import Despachadora from './Despachadora'
import { leerPedidos } from '../datos/pedidos'
import { pedidoDeEjemplo } from '../test/renderizar'
import { abrirPedidos as renderizar } from '../test/pedidosHttp'

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

  it('muestra resumen y pedidos para despacho', async () => {
    await renderizar(<Despachadora />, { usuario: DESPACHADORA, pedidos: PEDIDOS })

    expect(screen.getByRole('heading', { name: 'Gestión de pedidos' })).toBeInTheDocument()
    expect(valorDeTarjeta('Pedidos registrados')).toHaveTextContent('3')
    expect(valorDeTarjeta('Pendientes')).toHaveTextContent('1')
    expect(valorDeTarjeta('En camino')).toHaveTextContent('1')
    expect(valorDeTarjeta('Entregados')).toHaveTextContent('1')
    expect(filaConPedido(3)).toBeDefined()
  })

  it('asigna repartidor y cambia estado de un pedido', async () => {
    const user = userEvent.setup()
    const vista = await renderizar(<Despachadora />, { usuario: DESPACHADORA, pedidos: PEDIDOS })

    // Espera a que lleguen los repartidores del backend
    await within(filaConPedido(3)).findByRole('option', { name: 'Matías Vera' })
    await user.selectOptions(
      within(filaConPedido(3)).getByLabelText('Asignar repartidor al pedido 3'),
      '3'
    )
    await waitFor(() => expect(within(filaConPedido(3)).getByLabelText('Cambiar estado del pedido 3')).toBeEnabled())
    await user.selectOptions(
      within(filaConPedido(3)).getByLabelText('Cambiar estado del pedido 3'),
      'En camino'
    )

    await waitFor(() => expect(vista.gestiones.find(p => p.boleta.id === 3).boleta.estado).toBe('EN_CAMINO'))
    await waitFor(() => expect(valorDeTarjeta('Pendientes')).toHaveTextContent('0'))
    const pedido = vista.gestiones.find((uno) => uno.boleta.id === 3).boleta

    expect(pedido.repartidorId).toBe(3)
    expect(pedido.estado).toBe('EN_CAMINO')
    expect(leerPedidos()).toEqual(PEDIDOS)
    expect(valorDeTarjeta('Pendientes')).toHaveTextContent('0')
    expect(valorDeTarjeta('En camino')).toHaveTextContent('2')
  })

  it('si el backend no responde, avisa que faltan los repartidores', async () => {
    await renderizar(<Despachadora />, { usuario: DESPACHADORA, pedidos: PEDIDOS,
      rutas: { 'GET /usuarios/repartidores': () => [503, { mensaje: 'Sin conexión' }] } })

    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo cargar la lista de repartidores.')
    // Los pedidos se siguen viendo
    expect(filas()).toHaveLength(3)
  })

  it('avisa si no hay pedidos', async () => {
    await renderizar(<Despachadora />, { usuario: DESPACHADORA })

    expect(screen.getByText('No hay pedidos registrados')).toBeInTheDocument()
  })

})
