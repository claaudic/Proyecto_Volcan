import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import AdminReportes from './AdminReportes'
import { renderizar, ADMIN, CLIENTE, pedidoDeEjemplo } from '../test/renderizar'
import { simularApiDeUsuarios, simularApiApagada } from '../test/api'

const PEDIDOS = [
  pedidoDeEjemplo({ numero: 1, estado: 'Pendiente', total: 6500 }),
  pedidoDeEjemplo({ numero: 2, estado: 'En camino', total: 12000 }),
  pedidoDeEjemplo({ numero: 3, estado: 'Entregado', total: 8990 }),
  pedidoDeEjemplo({ numero: 4, estado: 'Cancelado', total: 50000 })
]

function valorDeTarjeta(etiqueta) {
  return screen.getByText(etiqueta).nextElementSibling
}

function filaCon(texto) {
  return screen.getAllByRole('row').find((fila) =>
    fila.textContent.includes(texto)
  )
}

describe('Reportes del administrador', () => {

  // Las cuentas llegan de ms-usuarios (simulado)
  beforeEach(() => {
    simularApiDeUsuarios()
  })

  it('un cliente no puede entrar', () => {
    renderizar(<AdminReportes />, { usuario: CLIENTE })

    expect(screen.getByRole('heading', { name: 'Página de login' })).toBeInTheDocument()
  })

  it('muestra resumen de usuarios y pedidos', async () => {
    renderizar(<AdminReportes />, { usuario: ADMIN, pedidos: PEDIDOS })

    expect(screen.getByRole('heading', { name: 'Reportes del sistema' })).toBeInTheDocument()
    await waitFor(() => expect(valorDeTarjeta('Usuarios registrados')).toHaveTextContent('5'))
    expect(valorDeTarjeta('Usuarios activos')).toHaveTextContent('5')
    expect(valorDeTarjeta('Pedidos registrados')).toHaveTextContent('4')
    expect(valorDeTarjeta('Pedidos entregados')).toHaveTextContent('1')
    expect(screen.getByText('$27.490')).toBeInTheDocument()
  })

  it('agrupa usuarios por rol y pedidos por estado', async () => {
    renderizar(<AdminReportes />, { usuario: ADMIN, pedidos: PEDIDOS })

    expect(await within(filaCon('Administradores')).findByText('1')).toBeInTheDocument()
    expect(within(filaCon('Despachadoras')).getByText('1')).toBeInTheDocument()
    expect(within(filaCon('Repartidores')).getByText('2')).toBeInTheDocument()
    expect(within(filaCon('Clientes')).getByText('1')).toBeInTheDocument()

    expect(within(filaCon('Pendiente')).getByText('1')).toBeInTheDocument()
    expect(within(filaCon('En camino')).getByText('1')).toBeInTheDocument()
    expect(within(filaCon('Cancelado')).getByText('1')).toBeInTheDocument()
    expect(within(filaCon('Entregado')).getByText('1')).toBeInTheDocument()
  })

  it('si el backend no responde, avisa y muestra los pedidos igual', async () => {
    simularApiApagada()
    renderizar(<AdminReportes />, { usuario: ADMIN, pedidos: PEDIDOS })

    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo cargar la lista de usuarios.')
    expect(valorDeTarjeta('Pedidos registrados')).toHaveTextContent('4')
  })

  it('descarga un reporte CSV', async () => {
    const user = userEvent.setup()
    const crearUrl = vi
      .spyOn(URL, 'createObjectURL')
      .mockReturnValue('blob:reporte')
    const revocarUrl = vi
      .spyOn(URL, 'revokeObjectURL')
      .mockImplementation(() => {})
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {})

    renderizar(<AdminReportes />, { usuario: ADMIN, pedidos: PEDIDOS })

    await user.click(screen.getByRole('button', { name: 'Descargar reporte' }))

    expect(crearUrl).toHaveBeenCalled()
    expect(click).toHaveBeenCalled()
    expect(revocarUrl).toHaveBeenCalledWith('blob:reporte')
    expect(screen.getByRole('status')).toHaveTextContent(
      /Se descargó reporte-gas-el-volcan-/
    )
  })

})
