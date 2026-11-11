import { describe, it, expect } from 'vitest'
import { adaptarCategoria, adaptarProducto, adaptarCatalogo, ErrorContratoCatalogo } from './adaptadorCatalogo'

const categoria = { id: 41, nombre: 'Categoría sintética', descripcion: null }
const producto = {
  id: 501, codigo: 'TEST501', nombre: 'Producto sintético', descripcion: null,
  precioResidencial: 125.50, precioComercial: 100, precioOferta: 110,
  stock: 7, activo: true, categoria, etiquetaOferta: 'Oferta de prueba',
  stockCritico: 2, unidad: 'Unidad', imagen: 'img/prueba.jpg'
}

describe('Adaptador del contrato real de catálogo', () => {
  it('conserva IDs reales y adapta la categoría sin cambiar los DTO de entrada', () => {
    const original = structuredClone(producto)
    const resultado = adaptarCatalogo([producto], [categoria])
    expect(resultado.productos[0]).toMatchObject({
      id: 501, codigo: 'TEST501', categoriaId: 41, categoria: categoria.nombre,
      categoriaDatos: { id: 41, nombre: categoria.nombre },
      precioResidencial: 125.50, precioComercial: 100, precioOferta: 110,
      etiquetaOferta: 'Oferta de prueba', stock: 7, stockCritico: 2,
      activo: true, imagen: 'img/prueba.jpg', unidad: 'Unidad', descripcion: ''
    })
    expect(resultado.categorias[0]).toEqual({ ...categoria, descripcion: '', slug: 'categoria-sintetica' })
    expect(producto).toEqual(original)
    expect(resultado.productos[0]).not.toBe(producto)
  })

  it('conserva precioOferta nulo, sin inventar ofertas ni precios', () => {
    const resultado = adaptarProducto({ ...producto, precioOferta: null, etiquetaOferta: null })
    expect(resultado.precioOferta).toBeNull()
    expect(resultado.etiquetaOferta).toBe('')
  })

  it('admite importes cero y conserva productos inactivos y sin stock', () => {
    expect(adaptarProducto({ ...producto, precioResidencial: 0, precioComercial: 0,
      precioOferta: 0, stock: 0, activo: false })).toMatchObject({ precioOferta: 0, stock: 0, activo: false })
  })

  it('normaliza campos opcionales nulos sin tocar los campos oficiales', () => {
    expect(adaptarProducto({ ...producto, imagen: null, stockCritico: null })).toMatchObject({ imagen: '', stockCritico: null })
  })

  it('mantiene categorías oficiales sin productos y admite catálogos vacíos', () => {
    expect(adaptarCatalogo([], [categoria]).categorias).toHaveLength(1)
    expect(adaptarCatalogo([], [])).toEqual({ productos: [], categorias: [] })
  })

  it.each([null, {}, { content: [] }])('rechaza respuestas que no son listas: %j', (valor) => {
    expect(() => adaptarCatalogo(valor, [])).toThrow(ErrorContratoCatalogo)
    expect(() => adaptarCatalogo([], valor)).toThrow(ErrorContratoCatalogo)
  })

  it.each([
    { id: 0 }, { id: Number.MAX_SAFE_INTEGER + 1 }, { codigo: '' }, { nombre: null },
    { precioResidencial: '125.50' }, { precioComercial: -1 }, { precioOferta: undefined },
    { precioOferta: -1 }, { precioOferta: Number.NaN }, { stock: -1 }, { stock: 1.5 },
    { activo: null }, { categoria: 'Categoría sintética' }, { unidad: '' }, { stockCritico: -1 }
  ])('rechaza producto fuera del contrato: %j', (cambios) => {
    expect(() => adaptarProducto({ ...producto, ...cambios })).toThrow(ErrorContratoCatalogo)
  })

  it('rechaza categorías inválidas y referencias inconsistentes', () => {
    expect(() => adaptarCategoria({ id: 0, nombre: 'X' })).toThrow(ErrorContratoCatalogo)
    expect(() => adaptarCatalogo([producto], [])).toThrow(ErrorContratoCatalogo)
    expect(() => adaptarCatalogo([producto], [{ ...categoria, nombre: 'Otro nombre' }])).toThrow(ErrorContratoCatalogo)
  })

  it('rechaza IDs y códigos duplicados sin renumerarlos', () => {
    expect(() => adaptarCatalogo([producto, producto], [categoria])).toThrow(ErrorContratoCatalogo)
    expect(() => adaptarCatalogo([producto], [categoria, categoria])).toThrow(ErrorContratoCatalogo)
    expect(() => adaptarCatalogo([producto, { ...producto, id: 502 }], [categoria])).toThrow(ErrorContratoCatalogo)
  })
})
