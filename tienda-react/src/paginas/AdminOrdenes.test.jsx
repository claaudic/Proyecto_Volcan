import { describe, it, expect } from 'vitest'
import { screen, within } from '@testing-library/react'
import AdminOrdenes from './AdminOrdenes'
import AdminDashboard from './AdminDashboard'
import { renderizar, ADMIN, CLIENTE, pedidoDeEjemplo } from '../test/renderizar'

// Pruebas de las vistas del administrador que leen los pedidos:
// Ordenes y el inicio del panel.

const PEDIDOS = [
  pedidoDeEjemplo({ numero: 1, fecha: '2026-10-01T12:00:00.000Z', estado: 'Entregado', total: 6500, repartidor: 'repartidor@gaselvolcan.cl' }),
  pedidoDeEjemplo({ numero: 2, fecha: '2026-10-03T12:00:00.000Z', estado: 'En camino', total: 12000, repartidor: 'repartidor@gaselvolcan.cl' }),
  pedidoDeEjemplo({ numero: 3, fecha: '2026-10-05T12:00:00.000Z', estado: 'Pendiente', total: 8990 }),
  pedidoDeEjemplo({ numero: 4, fecha: 'no es una fecha', estado: 'Cancelado', total: 50000 })
]

function filas() {
  return screen.getAllByRole('row').slice(1)
}

describe('Órdenes del administrador', () => {

  it('un cliente no puede entrar', () => {
    renderizar(<AdminOrdenes />, { usuario: CLIENTE })

    expect(screen.getByRole('heading', { name: 'Página de login' })).toBeInTheDocument()
  })

  it('lista todos los pedidos, del más reciente al más antiguo', () => {
    renderizar(<AdminOrdenes />, { usuario: ADMIN, pedidos: PEDIDOS })

    const numeros = filas().map((fila) => within(fila).getAllByRole('cell')[0].textContent)
    expect(numeros).toEqual(['#3', '#2', '#1', '#4'])
  })

  it('pinta cada estado con su color y avisa si falta el repartidor', () => {
    renderizar(<AdminOrdenes />, { usuario: ADMIN, pedidos: PEDIDOS })

    expect(screen.getByText('En camino')).toHaveClass('estado-camino')
    expect(screen.getByText('Pendiente')).toHaveClass('estado-pendiente')
    expect(screen.getAllByText('Sin asignar')).toHaveLength(2)
    expect(screen.getByText('Sin fecha')).toBeInTheDocument()
  })

  it('sin pedidos lo dice', () => {
    renderizar(<AdminOrdenes />, { usuario: ADMIN })

    expect(screen.getByText(/no hay pedidos|todavía no hay/i)).toBeInTheDocument()
  })

})

describe('Inicio del panel de administración', () => {

  it('calcula los indicadores con los pedidos guardados', () => {
    renderizar(<AdminDashboard />, { usuario: ADMIN, pedidos: PEDIDOS })

    // 1 pendiente, 2 sin repartidor, y el total sin contar el cancelado
    expect(screen.getByText('Pedidos pendientes').nextElementSibling).toHaveTextContent('1')
    expect(screen.getByText('Sin repartidor asignado').nextElementSibling).toHaveTextContent('2')
    expect(screen.getByText('$27.490')).toBeInTheDocument()
  })

  it('muestra los últimos pedidos con su estado', () => {
    renderizar(<AdminDashboard />, { usuario: ADMIN, pedidos: PEDIDOS })

    expect(screen.getByText('En camino')).toHaveClass('estado-camino')
    expect(screen.getByText('#3')).toBeInTheDocument()
  })

})
