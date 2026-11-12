import { describe, it, expect, vi } from 'vitest'
import { screen, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import AdminReportes from './AdminReportes'
import { pedidoDeEjemplo } from '../test/renderizar'
import { CUENTAS } from '../test/api'
import { abrirPedidos } from '../test/pedidosHttp'

// Los pedidos llegan de ms-pedidos (GET /boletas/gestion, simulado)
const PEDIDOS = [
  pedidoDeEjemplo({ numero: 1, estado: 'Pendiente', total: 6500, repartidor: '' }),
  pedidoDeEjemplo({ numero: 2, estado: 'En camino', total: 12000, repartidor: 'repartidor@gaselvolcan.cl' }),
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

  // Las cuentas llegan de ms-usuarios y los pedidos de ms-pedidos (simulados)
  function abrir(rutas = {}) {
    return abrirPedidos(<AdminReportes />, {
      pedidos: PEDIDOS,
      rutas: { 'GET /usuarios': () => [200, Object.values(CUENTAS)], ...rutas }
    })
  }

  it('muestra resumen de usuarios y pedidos', async () => {
    await abrir()

    expect(screen.getByRole('heading', { name: 'Reportes del sistema' })).toBeInTheDocument()
    await waitFor(() => expect(valorDeTarjeta('Usuarios registrados')).toHaveTextContent('5'))
    expect(valorDeTarjeta('Usuarios activos')).toHaveTextContent('5')
    expect(valorDeTarjeta('Pedidos registrados')).toHaveTextContent('4')
    expect(valorDeTarjeta('Pedidos entregados')).toHaveTextContent('1')
    expect(screen.getByText('$27.490')).toBeInTheDocument()
  })

  it('agrupa usuarios por rol y pedidos por estado', async () => {
    await abrir()

    expect(await within(filaCon('Administradores')).findByText('1')).toBeInTheDocument()
    expect(within(filaCon('Despachadoras')).getByText('1')).toBeInTheDocument()
    expect(within(filaCon('Repartidores')).getByText('2')).toBeInTheDocument()
    expect(within(filaCon('Clientes')).getByText('1')).toBeInTheDocument()

    expect(within(filaCon('Pendiente')).getByText('1')).toBeInTheDocument()
    expect(within(filaCon('En camino')).getByText('1')).toBeInTheDocument()
    expect(within(filaCon('Cancelado')).getByText('1')).toBeInTheDocument()
    expect(within(filaCon('Entregado')).getByText('1')).toBeInTheDocument()
  })

  it('si ms-usuarios no responde, avisa y muestra los pedidos igual', async () => {
    await abrir({ 'GET /usuarios': () => [503, { estado: 503, mensaje: 'Servicio no disponible.' }] })

    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo cargar la lista de usuarios.')
    expect(valorDeTarjeta('Pedidos registrados')).toHaveTextContent('4')
  })

  it('si ms-pedidos no responde, lo avisa', async () => {
    await abrir({ 'GET /boletas/gestion': () => [503, { estado: 503, mensaje: 'Servicio no disponible.' }] })

    expect(await screen.findByText(/No se pudieron cargar los pedidos/)).toBeInTheDocument()
    expect(valorDeTarjeta('Pedidos registrados')).toHaveTextContent('0')
  })

  it('el CSV muestra el nombre del repartidor asignado', async () => {
    let contenido = ''
    vi.spyOn(URL, 'createObjectURL').mockImplementation((blob) => { contenido = blob; return 'blob:reporte' })
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    const user = userEvent.setup()
    await abrir()
    await waitFor(() => expect(valorDeTarjeta('Usuarios registrados')).toHaveTextContent('5'))

    await user.click(screen.getByRole('button', { name: 'Descargar reporte' }))
    const texto = await contenido.text()

    expect(texto).toContain('Matías Vera')
    expect(texto).toContain('Sin asignar')
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

    await abrir()

    await user.click(screen.getByRole('button', { name: 'Descargar reporte' }))

    expect(crearUrl).toHaveBeenCalled()
    expect(click).toHaveBeenCalled()
    expect(revocarUrl).toHaveBeenCalledWith('blob:reporte')
    expect(screen.getByRole('status')).toHaveTextContent(
      /Se descargó reporte-gas-el-volcan-/
    )
  })

})
