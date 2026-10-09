import { describe, it, expect } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DetalleProducto from './DetalleProducto'
import { renderizar } from '../test/renderizar'
import { PRODUCTOS } from '../datos/productos'

// Pruebas de estado y eventos del detalle: elegir la cantidad y añadir al carrito

// RG002 tiene poco stock: sirve para probar el limite
const conPocoStock = PRODUCTOS.find((p) => p.codigo === 'RG002')

function abrir(codigo, opciones = {}) {
  return renderizar(<DetalleProducto />, { ruta: '/producto/' + codigo, patron: '/producto/:codigo', ...opciones })
}

function carritoGuardado() {
  return JSON.parse(localStorage.getItem('carritoVolcan') || '[]')
}

describe('Detalle del producto: cantidad', () => {

  it('sube y baja la cantidad con los botones', async () => {
    const user = userEvent.setup()
    abrir('CL001')
    const cantidad = screen.getByLabelText('Cantidad')

    await user.click(screen.getByRole('button', { name: 'Agregar una unidad' }))
    await user.click(screen.getByRole('button', { name: 'Agregar una unidad' }))
    expect(cantidad).toHaveValue(3)

    await user.click(screen.getByRole('button', { name: 'Quitar una unidad' }))
    expect(cantidad).toHaveValue(2)
  })

  it('no deja escribir más que el stock ni menos que 1', () => {
    abrir(conPocoStock.codigo)
    const cantidad = screen.getByLabelText('Cantidad')

    fireEvent.change(cantidad, { target: { value: '999' } })
    expect(cantidad).toHaveValue(conPocoStock.stock)

    fireEvent.change(cantidad, { target: { value: '-4' } })
    expect(cantidad).toHaveValue(1)
  })

})

describe('Detalle del producto: añadir al carrito', () => {

  it('añade la cantidad elegida', async () => {
    // 1 Preparar
    const user = userEvent.setup()
    abrir('CL001')

    // 2 Actuar: elegir 2 unidades y añadir
    await user.click(screen.getByRole('button', { name: 'Agregar una unidad' }))
    await user.click(screen.getByRole('button', { name: 'Añadir al carrito' }))

    // 3 Comprobar
    expect(carritoGuardado()).toEqual([{ codigo: 'CL001', cantidad: 2 }])
  })

  it('avisa si ya tienes todo el stock en el carrito', async () => {
    const user = userEvent.setup()
    abrir(conPocoStock.codigo, { carrito: [{ codigo: conPocoStock.codigo, cantidad: conPocoStock.stock }] })

    await user.click(screen.getByRole('button', { name: 'Añadir al carrito' }))

    expect(screen.getByRole('status')).toHaveTextContent('Ya tienes todo el stock disponible')
  })

  it('un producto sin stock no se puede comprar', () => {
    const sinStock = PRODUCTOS.map((p) => (p.codigo === 'CL001' ? { ...p, stock: 0 } : p))
    localStorage.setItem('productosSistema', JSON.stringify(sinStock))
    abrir('CL001')

    expect(screen.getByRole('button', { name: 'Sin stock disponible' })).toBeDisabled()
    expect(screen.getByText('Sin stock', { selector: 'dd' })).toBeInTheDocument()
  })

  it('muestra productos relacionados de la misma categoría', () => {
    abrir('CL001')

    expect(screen.getByText('También te puede servir')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Cilindro GLP 11 kg' })).toBeInTheDocument()
  })

  it('si la imagen no carga, muestra el logo', () => {
    abrir('CL001')
    const imagen = screen.getAllByRole('img', { name: 'Cilindro GLP 5 kg' })[0]

    fireEvent.error(imagen)
    fireEvent.error(imagen)

    expect(imagen.getAttribute('src')).toBe('/img/logo.svg')
  })

})
