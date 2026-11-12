import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import ProveedorCarrito from './ProveedorCarrito'
import { CatalogoContexto } from './catalogoContexto'
import { useCarrito } from './carritoContexto'

const producto = { id: 2, codigo: 'CL002', nombre: 'Producto de prueba', precioResidencial: 200,
  precioOferta: 150, stock: 8, activo: true }
const articulos = [{ codigo: 'CL002', cantidad: 2 }]
const guardados = () => JSON.parse(localStorage.getItem('carritoVolcan'))

// Se prueba el proveedor real. El contexto de entrada aporta estados explicitos;
// no se reemplaza ProveedorCatalogo ni se altera ninguna prueba historica.
function abrir(inicial, items = articulos) {
  localStorage.setItem('carritoVolcan', JSON.stringify(items))
  let catalogo = inicial
  const wrapper = ({ children }) => (
    <CatalogoContexto.Provider value={catalogo}>
      <ProveedorCarrito>{children}</ProveedorCarrito>
    </CatalogoContexto.Provider>
  )
  const hook = renderHook(() => useCarrito(), { wrapper })
  return { ...hook, actualizar: (nuevo) => { catalogo = nuevo; hook.rerender() } }
}

describe('ProveedorCarrito real y estados del catalogo', () => {
  it('mantiene metodos y calculo cuando no existen cargando/error', () => {
    const { result } = abrir({ activos: [producto] })
    expect(result.current).toMatchObject({ estado: 'listo', puedeConfirmar: true, errorCatalogo: '', detalle: { total: 300 } })
    for (const nombre of ['agregar', 'cambiarCantidad', 'quitar', 'vaciar']) expect(result.current[nombre]).toBeTypeOf('function')
    act(() => { expect(result.current.agregar('CL002', 1).ok).toBe(true) })
    expect(result.current.detalle.total).toBe(450)
    act(() => result.current.cambiarCantidad('CL002', 1))
    expect(guardados()).toEqual([{ codigo: 'CL002', cantidad: 1 }])
  })
  it('conserva items y contador durante carga sin entregar un precio', () => {
    const { result } = abrir({ activos: [], cargando: true })
    expect(result.current).toMatchObject({ estado: 'cargando', puedeConfirmar: false, items: articulos,
      detalle: { lineas: [], total: null, unidades: 2 } })
    expect(guardados()).toEqual(articulos)
  })
  it('un error despues de cargar no elimina articulos ni reescribe el almacenamiento', () => {
    const hook = abrir({ activos: [producto] })
    const guardar = vi.spyOn(Storage.prototype, 'setItem')
    hook.actualizar({ activos: [], error: 'Sin conexion' })
    expect(hook.result.current).toMatchObject({ estado: 'error', errorCatalogo: 'Sin conexion', items: articulos, puedeConfirmar: false })
    expect(guardados()).toEqual(articulos)
    expect(guardar).not.toHaveBeenCalled()
  })
  it.each([{ cargando: true }, { error: 'Sin conexion' }])('no agrega ni cambia cantidades con datos no disponibles: %j', (estado) => {
    const { result } = abrir({ activos: [producto], ...estado })
    act(() => { expect(result.current.agregar('CL002', 1).ok).toBe(false) })
    act(() => result.current.cambiarCantidad('CL002', 4))
    expect(result.current.items).toEqual(articulos)
    expect(guardados()).toEqual(articulos)
  })
  it('permite quitar y vaciar sin conexion, solo por accion explicita', () => {
    const { result } = abrir({ activos: [], error: 'Sin conexion' }, [...articulos, { codigo: 'OTRO', cantidad: 1 }])
    act(() => result.current.quitar('OTRO'))
    expect(guardados()).toEqual(articulos)
    act(() => result.current.vaciar())
    expect(guardados()).toEqual([])
  })
  it('expone el reintento real y recupera el carrito con los precios nuevos', () => {
    const recargar = vi.fn()
    const hook = abrir({ activos: [], error: 'Sin conexion', recargar })
    act(() => hook.result.current.recargarCatalogo())
    expect(recargar).toHaveBeenCalledOnce()
    hook.actualizar({ activos: [], cargando: true, recargar })
    expect(hook.result.current.estado).toBe('cargando')
    hook.actualizar({ activos: [{ ...producto, precioOferta: null, precioResidencial: 250 }], cargando: false, error: '', recargar })
    expect(hook.result.current).toMatchObject({ estado: 'listo', puedeConfirmar: true, detalle: { total: 500 } })
    expect(guardados()).toEqual(articulos)
  })
  it('producto no disponible no se borra ni permite pagar', () => {
    const { result } = abrir({ activos: [] })
    expect(result.current).toMatchObject({ estado: 'no-disponible', vacio: false, puedeConfirmar: false, items: articulos })
    expect(guardados()).toEqual(articulos)
  })
  it('distingue vacio real cuando el catalogo esta listo', () => {
    const { result } = abrir({ activos: [producto] }, [])
    expect(result.current).toMatchObject({ estado: 'vacio', vacio: true, puedeConfirmar: false })
  })
})
