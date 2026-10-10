import { describe, it, expect, vi } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import AdminReportes from './AdminReportes'
import { renderizar, ADMIN, CLIENTE, pedidoDeEjemplo } from '../test/renderizar'

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

  it('un cliente no puede entrar', () => {
    renderizar(<AdminReportes />, { usuario: CLIENTE })

    expect(screen.getByRole('heading', { name: 'Página de login' })).toBeInTheDocument()
  })

  it('muestra resumen de usuarios y pedidos', () => {
    renderizar(<AdminReportes />, { usuario: ADMIN, pedidos: PEDIDOS })

    expect(screen.getByRole('heading', { name: 'Reportes del sistema' })).toBeInTheDocument()
    expect(valorDeTarjeta('Usuarios registrados')).toHaveTextContent('5')
    expect(valorDeTarjeta('Usuarios activos')).toHaveTextContent('5')
    expect(valorDeTarjeta('Pedidos registrados')).toHaveTextContent('4')
    expect(valorDeTarjeta('Pedidos entregados')).toHaveTextContent('1')
    expect(screen.getByText('$27.490')).toBeInTheDocument()
  })

  it('agrupa usuarios por rol y pedidos por estado', () => {
    renderizar(<AdminReportes />, { usuario: ADMIN, pedidos: PEDIDOS })

    expect(within(filaCon('Administradores')).getByText('1')).toBeInTheDocument()
    expect(within(filaCon('Despachadoras')).getByText('1')).toBeInTheDocument()
    expect(within(filaCon('Repartidores')).getByText('2')).toBeInTheDocument()
    expect(within(filaCon('Clientes')).getByText('1')).toBeInTheDocument()

    expect(within(filaCon('Pendiente')).getByText('1')).toBeInTheDocument()
    expect(within(filaCon('En camino')).getByText('1')).toBeInTheDocument()
    expect(within(filaCon('Cancelado')).getByText('1')).toBeInTheDocument()
    expect(within(filaCon('Entregado')).getByText('1')).toBeInTheDocument()
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
