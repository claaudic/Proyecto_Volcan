import { describe, it, expect } from 'vitest'
import { screen, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AdminOrdenes from './AdminOrdenes'
import AdminDashboard from './AdminDashboard'
import { ADMIN, pedidoDeEjemplo } from '../test/renderizar'
import { abrirPedidos as renderizar } from '../test/pedidosHttp'

// Pruebas de las vistas del administrador que leen los pedidos:
// Ordenes y el inicio del panel.

const PEDIDOS = [
  pedidoDeEjemplo({ numero: 1, fecha: '2026-10-01T12:00:00.000Z', estado: 'Entregado', total: 6500, repartidor: 'repartidor@gaselvolcan.cl' }),
  pedidoDeEjemplo({ numero: 2, fecha: '2026-10-03T12:00:00.000Z', estado: 'En camino', total: 12000, repartidor: 'repartidor@gaselvolcan.cl' }),
  pedidoDeEjemplo({ numero: 3, fecha: '2026-10-05T12:00:00.000Z', estado: 'Pendiente', total: 8990 }),
  pedidoDeEjemplo({ numero: 4, fecha: '2026-09-30T12:00:00', estado: 'Cancelado', total: 50000 })
]

function filas() {
  return screen.getAllByRole('row').slice(1)
}

function filaConPedido(numero) {
  return filas().find((fila) => fila.textContent.includes(`#${numero}`))
}

describe('Órdenes del administrador', () => {

  it('lista todos los pedidos, del más reciente al más antiguo', async () => {
    await renderizar(<AdminOrdenes />, { usuario: ADMIN, pedidos: PEDIDOS })

    const numeros = filas().map((fila) => within(fila).getAllByRole('cell')[0].textContent)
    expect(numeros).toEqual(['#3', '#2', '#1', '#4'])
  })

  it('pinta cada estado con su color y avisa si falta el repartidor', async () => {
    await renderizar(<AdminOrdenes />, { usuario: ADMIN, pedidos: PEDIDOS })

    expect(screen.getByText('En camino')).toHaveClass('estado-camino')
    expect(screen.getByText('Pendiente')).toHaveClass('estado-pendiente')
    expect(screen.getAllByText('Sin asignar')).toHaveLength(2)
    expect(screen.queryByText('Sin fecha')).not.toBeInTheDocument()
  })

  it('sin pedidos lo dice', async () => {
    await renderizar(<AdminOrdenes />, { usuario: ADMIN })

    expect(screen.getByText(/no hay pedidos|todavía no hay/i)).toBeInTheDocument()
  })

  it('muestra la boleta con productos, entrega y total', async () => {
    const user = userEvent.setup()
    await renderizar(<AdminOrdenes />, { usuario: ADMIN, pedidos: PEDIDOS })

    await user.click(
      within(filaConPedido(3)).getByRole('button', { name: /Ver boleta/ })
    )

    const boleta = screen.getByRole('dialog', {
      name: /Boleta del pedido #3/
    })

    expect(within(boleta).getByRole('heading', { name: /Boleta del pedido #3/ })).toBeInTheDocument()
    expect(within(boleta).getByText('Pedido')).toBeInTheDocument()
    expect(within(boleta).getByText('Fecha')).toBeInTheDocument()
    expect(within(boleta).getByText('Estado')).toBeInTheDocument()
    expect(within(boleta).getByText('Pendiente')).toHaveClass('estado-pendiente')
    expect(within(boleta).getByText('Repartidor')).toBeInTheDocument()
    expect(within(boleta).getByText('Sin asignar')).toBeInTheDocument()
    expect(within(boleta).getByText('Pago')).toBeInTheDocument()
    expect(within(boleta).getByText('Sin registrar')).toBeInTheDocument()
    expect(within(boleta).queryByText('•••• 1111')).not.toBeInTheDocument()
    expect(within(boleta).getByText('Camila Rojas')).toBeInTheDocument()
    expect(within(boleta).getByText('Libertad 123')).toBeInTheDocument()
    expect(within(boleta).getByText('Cilindro GLP 5 kg')).toBeInTheDocument()
    expect(within(boleta).getByText(/Total:/)).toHaveTextContent('$8.990')
  })

  it('edita estado y asigna repartidor activo', async () => {
    const user = userEvent.setup()
    const vista = await renderizar(<AdminOrdenes />, { usuario: ADMIN, pedidos: PEDIDOS })

    await user.click(
      within(filaConPedido(3)).getByRole('button', { name: /Editar/ })
    )
    await user.selectOptions(screen.getByLabelText('Estado'), 'En camino')
    await screen.findByRole('option', { name: /Matías Vera/ })
    await user.selectOptions(
      screen.getByLabelText('Repartidor'),
      '3'
    )
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    const pedido = vista.gestiones.find((uno) => uno.boleta.id === 3).boleta

    expect(pedido.estado).toBe('EN_CAMINO')
    expect(pedido.repartidorId).toBe(3)
    expect(JSON.parse(localStorage.getItem('pedidos_volcan')).find(p => p.numero === 3).estado).toBe('Pendiente')
    expect(within(filaConPedido(3)).getByText('En camino')).toHaveClass('estado-camino')
    expect(within(filaConPedido(3)).getByText('Matías Vera')).toBeInTheDocument()
  })

  it('si el backend no responde, avisa que faltan los repartidores', async () => {
    await renderizar(<AdminOrdenes />, { usuario: ADMIN, pedidos: PEDIDOS,
      rutas: { 'GET /usuarios/repartidores': () => [503, { mensaje: 'Sin conexión' }] } })

    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo cargar la lista de repartidores.')
    expect(filas()).toHaveLength(4)
  })

  it('anula una orden pendiente solo después de confirmar y conserva su historial', async () => {
    const user = userEvent.setup()
    const vista = await renderizar(<AdminOrdenes />, { usuario: ADMIN, pedidos: PEDIDOS })

    await user.click(
      within(filaConPedido(3)).getByRole('button', { name: /Eliminar/ })
    )
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(vista.escrituras()).toHaveLength(0)

    await user.click(
      within(filaConPedido(3)).getByRole('button', { name: /Eliminar/ })
    )
    await user.click(screen.getByRole('button', { name: 'Sí, eliminar' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(filaConPedido(3)).toHaveTextContent('Cancelado')
    expect(vista.gestiones).toHaveLength(4)
    expect(vista.escrituras()).toHaveLength(1)
    expect(vista.escrituras()[0][0]).toMatch(/\/boletas\/3\/anulacion$/)
    expect(JSON.parse(vista.escrituras()[0][1].body)).toEqual({ versionEsperada: 0 })
    expect(JSON.parse(localStorage.getItem('pedidos_volcan'))).toEqual(PEDIDOS)
  })

})

describe('Inicio del panel de administración', () => {

  it('calcula los indicadores con los pedidos HTTP', async () => {
    await renderizar(<AdminDashboard />, { usuario: ADMIN, pedidos: PEDIDOS })

    // 1 pendiente, 2 sin repartidor, y el total sin contar el cancelado
    expect(screen.getByText('Pedidos pendientes').nextElementSibling).toHaveTextContent('1')
    expect(screen.getByText('Sin repartidor asignado').nextElementSibling).toHaveTextContent('2')
    expect(screen.getByText('$27.490')).toBeInTheDocument()
  })

  it('muestra los últimos pedidos con su estado', async () => {
    await renderizar(<AdminDashboard />, { usuario: ADMIN, pedidos: PEDIDOS })

    expect(screen.getByText('En camino')).toHaveClass('estado-camino')
    expect(screen.getByText('#3')).toBeInTheDocument()
  })

})

describe('Órdenes: pedidos con otros formatos', () => {

  // Pedido guardado como en el sitio de la EP1: cliente y dirección sueltos
  // y un solo producto. La vista de órdenes debe poder mostrarlo igual.
  const PEDIDO_ANTIGUO = {
    numero: 7,
    fecha: '2026-10-06T12:00:00.000Z',
    estado: 'Pendiente',
    cliente: 'Felipe González',
    correo: 'felipe@gmail.com',
    direccion: 'Los Puelches 430',
    comuna: 'Chillán Viejo',
    producto: 'Cilindro GLP 11 kg',
    cantidad: 2,
    total: 24000,
    pago: 'Efectivo'
  }

  it('muestra un pedido histórico mediante contacto y entrega del servidor', async () => {
    // 1 Preparar
    const user = userEvent.setup()
    await renderizar(<AdminOrdenes />, { usuario: ADMIN, pedidos: [PEDIDO_ANTIGUO] })

    // 2 Actuar: abrir su boleta
    expect(filaConPedido(7)).toHaveTextContent('Felipe González')
    await user.click(within(filaConPedido(7)).getByRole('button', { name: /Ver boleta/ }))

    // 3 Comprobar: los datos sueltos aparecen en su lugar
    const boleta = screen.getByRole('dialog', { name: /Boleta del pedido #7/ })
    expect(within(boleta).getByText('felipe@gmail.com')).toBeInTheDocument()
    expect(within(boleta).getByText('Los Puelches 430')).toBeInTheDocument()
    expect(within(boleta).getByText('Sin registrar')).toBeInTheDocument()
    expect(within(boleta).queryByText('Efectivo')).not.toBeInTheDocument()
    expect(within(boleta).getByText('Cilindro GLP 11 kg')).toBeInTheDocument()
  })

  it('resume varios productos y avisa cuando faltan datos históricos opcionales', async () => {
    const conVarios = pedidoDeEjemplo({
      numero: 8,
      total: 15490,
      productos: [
        { codigo: 'CL001', nombre: 'Cilindro GLP 5 kg', cantidad: 1, precio: 6500, subtotal: 6500 },
        { codigo: 'RG001', nombre: 'Regulador doméstico estándar', cantidad: 1, precio: 8990, subtotal: 8990 }
      ]
    })
    const sinDatos = { numero: 9, estado: 'Pendiente', total: 0 }

    await renderizar(<AdminOrdenes />, { usuario: ADMIN, pedidos: [conVarios, sinDatos] })

    expect(filaConPedido(8)).toHaveTextContent('Cilindro GLP 5 kg y 1 más')
    expect(filaConPedido(9)).toHaveTextContent('Producto')
    expect(filaConPedido(9)).toHaveTextContent('Sin nombre')
    expect(filaConPedido(9)).toHaveTextContent('Sin comuna')
  })

  it('las ventanas se cierran sin cambiar nada', async () => {
    const user = userEvent.setup()
    const vista = await renderizar(<AdminOrdenes />, { usuario: ADMIN, pedidos: PEDIDOS })

    // Boleta: abrir y cerrar
    await user.click(within(filaConPedido(3)).getByRole('button', { name: /Ver boleta/ }))
    await user.click(within(screen.getByRole('dialog')).getAllByRole('button', { name: /Cerrar/ })[0])
    expect(screen.queryByRole('dialog')).toBeNull()

    // Eliminar: abrir la confirmación y cerrarla con la X
    await user.click(within(filaConPedido(3)).getByRole('button', { name: /Eliminar/ }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cerrar' }))
    expect(screen.queryByRole('dialog')).toBeNull()

    expect(JSON.parse(localStorage.getItem('pedidos_volcan'))).toHaveLength(4)
    expect(vista.escrituras()).toHaveLength(0)
  })

})
