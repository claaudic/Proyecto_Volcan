import { describe, it, expect, vi } from 'vitest'
import { estadoDelCarrito } from './estadoCarrito'
import { detalleDelCarrito } from './carrito'

const producto = { id: 70, codigo: 'CL002', nombre: 'Producto de prueba', precioResidencial: 15000,
  precioOferta: 13000, etiquetaOferta: 'API', stock: 5, activo: true }
const items = [{ codigo: 'CL002', cantidad: 2 }]

describe('Estado puro del carrito', () => {
  it('cargando no es vacio y no ofrece precios almacenados o parciales', () => {
    expect(estadoDelCarrito(items, [producto], { cargando: true })).toEqual({
      estado: 'cargando', vacio: false, puedeConfirmar: false, detalle: { lineas: [], total: null, unidades: 2 }
    })
  })
  it('error no significa producto eliminado ni carrito vacio', () => {
    expect(estadoDelCarrito(items, [], { error: 'Sin conexion' })).toMatchObject({ estado: 'error', vacio: false, puedeConfirmar: false, detalle: { total: null } })
  })
  it('reconoce un carrito realmente vacio', () => {
    expect(estadoDelCarrito([], [producto])).toMatchObject({ estado: 'vacio', vacio: true, puedeConfirmar: false, detalle: { total: 0, lineas: [] } })
  })
  it('da prioridad al estado de carga sobre un error anterior', () => {
    expect(estadoDelCarrito(items, [], { cargando: true, error: 'Anterior' }).estado).toBe('cargando')
  })
  it('delega importes y ofertas al calculo existente', () => {
    const resultado = estadoDelCarrito(items, [producto])
    expect(resultado.estado).toBe('listo')
    expect(resultado.puedeConfirmar).toBe(true)
    expect(resultado.detalle).toEqual(detalleDelCarrito(items, [producto]))
    expect(resultado.detalle.total).toBe(26000)
  })
  it('respeta precioOferta null y no recupera la antigua oferta local', () => {
    expect(estadoDelCarrito(items, [{ ...producto, precioOferta: null }]).detalle.total).toBe(30000)
  })
  it('admite precio de oferta cero', () => {
    expect(estadoDelCarrito(items, [{ ...producto, precioOferta: 0 }])).toMatchObject({ estado: 'listo', detalle: { total: 0 } })
  })
  it('mantiene el calculo historico si no hay propiedades de estado', () => {
    const { precioOferta: _oferta, ...historico } = producto
    expect(_oferta).toBe(13000)
    expect(estadoDelCarrito(items, [historico]).detalle).toEqual(detalleDelCarrito(items, [historico]))
  })
  it.each([{ stock: 0 }, { stock: 1 }, { activo: false }, { precioResidencial: NaN },
    { precioResidencial: -1 }, { precioOferta: '13000' }, { stock: 2.5 }])('bloquea datos no verificables: %j', (cambios) => {
    expect(estadoDelCarrito(items, [{ ...producto, ...cambios }])).toMatchObject({
      estado: 'no-disponible', vacio: false, puedeConfirmar: false, detalle: { total: null, lineas: [] }
    })
  })
  it('un producto ausente de un catalogo cargado no es un carrito vacio', () => {
    expect(estadoDelCarrito(items, []).estado).toBe('no-disponible')
  })
  it('no permite pagar solo las lineas que si pudo resolver', () => {
    expect(estadoDelCarrito([...items, { codigo: 'AUSENTE', cantidad: 1 }], [producto]).puedeConfirmar).toBe(false)
  })
  it('acumula cantidades repetidas para verificar existencias', () => {
    expect(estadoDelCarrito([...items, ...items], [{ ...producto, stock: 3 }]).estado).toBe('no-disponible')
  })
  it('no muta ni persiste los codigos y cantidades recibidos', () => {
    const originales = Object.freeze([Object.freeze({ codigo: 'CL002', cantidad: 2 })])
    const guardar = vi.spyOn(Storage.prototype, 'setItem')
    for (const estado of [{ cargando: true }, { error: 'Sin conexion' }, {}]) estadoDelCarrito(originales, [], estado)
    expect(originales).toEqual(items)
    expect(guardar).not.toHaveBeenCalled()
  })
})
