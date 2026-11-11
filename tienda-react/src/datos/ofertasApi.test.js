import { describe, it, expect } from 'vitest'
import { ofertaRecibida, ofertaDeProducto, precioProducto, productoEnOferta, productosEnOferta } from './ofertas'

const producto = { id: 72, codigo: 'CL002', activo: true, precioResidencial: 15000, precioOferta: 13000, etiquetaOferta: 'Promocion API' }

describe('Ofertas recibidas del backend', () => {
  it('prioriza el precio y etiqueta API incluso para un codigo con oferta local', () => {
    expect(ofertaDeProducto(producto)).toEqual({ codigo: 'CL002', precioOferta: 13000, etiqueta: 'Promocion API' })
    expect(precioProducto(producto)).toBe(13000)
  })
  it('precioOferta null anula la oferta local antigua', () => {
    const sinOferta = { ...producto, precioOferta: null }
    expect(ofertaRecibida(sinOferta)).toBeNull()
    expect(ofertaDeProducto(sinOferta)).toBeNull()
    expect(productoEnOferta(sinOferta)).toBe(false)
    expect(precioProducto(sinOferta)).toBe(15000)
  })
  it('reconoce ofertas para codigos nuevos y precio cero', () => {
    const nuevo = { ...producto, codigo: 'API072', precioOferta: 0 }
    expect(precioProducto(nuevo)).toBe(0)
    expect(productoEnOferta(nuevo)).toBe(true)
  })
  it('no inventa etiquetas de una oferta local cuando la API no envia texto', () => {
    expect(ofertaRecibida({ ...producto, etiquetaOferta: null }).etiqueta).toBe('')
  })
  it.each([undefined, -1, NaN, Infinity, '13000'])('no utiliza un importe API invalido: %s', (precioOferta) => {
    expect(ofertaDeProducto({ ...producto, precioOferta })).toBeNull()
    expect(precioProducto({ ...producto, precioOferta })).toBe(15000)
  })
  it('filtra por ofertas API y estado activo sin modificar productos', () => {
    const lista = [producto, { ...producto, id: 73, precioOferta: null }, { ...producto, id: 74, activo: false }]
    expect(productosEnOferta(lista)).toEqual([producto])
    expect(lista).toHaveLength(3)
  })
  it('mantiene compatibilidad explicita con codigo y producto historicos', () => {
    expect(ofertaDeProducto('CL002').precioOferta).toBe(10500)
    expect(precioProducto({ codigo: 'CL002', precioResidencial: 12000 })).toBe(10500)
  })
})
