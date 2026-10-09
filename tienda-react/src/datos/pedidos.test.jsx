import { describe, it, expect } from 'vitest'
import { leerPedidos, crearPedido, obtenerSiguienteNumeroPedido } from './pedidos'

// Pruebas de los datos de pedidos: numeracion, estado inicial y datos danados

describe('Pedidos', () => {

  it('parte sin pedidos y el primero es el número 1', () => {
    expect(leerPedidos()).toEqual([])
    expect(obtenerSiguienteNumeroPedido()).toBe(1)
  })

  it('cada pedido nuevo toma el número siguiente y parte Pendiente', () => {
    // 1 Preparar y 2 Actuar: dos compras seguidas
    crearPedido({ total: 6500 })
    const segundo = crearPedido({ total: 12000 })

    // 3 Comprobar
    expect(segundo.numero).toBe(2)
    expect(segundo.estado).toBe('Pendiente')
    expect(leerPedidos()).toHaveLength(2)
  })

  it('si lo guardado está dañado, parte sin pedidos', () => {
    localStorage.setItem('pedidos_volcan', '{ esto no es json')

    expect(leerPedidos()).toEqual([])
  })

})
