import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useCarrito } from './carritoContexto'
import { useSesion } from './sesionContexto'
import { useCatalogo } from './catalogoContexto'

// Los hooks de Context avisan con un error claro si un componente
// los usa fuera de su proveedor (por ejemplo, si se olvida en main.jsx)

describe('Hooks de Context fuera de su proveedor', () => {

  it.each([
    [useCarrito, 'useCarrito debe usarse dentro de <ProveedorCarrito>.'],
    [useSesion, 'useSesion debe usarse dentro de <ProveedorSesion>.'],
    [useCatalogo, 'useCatalogo debe usarse dentro de <ProveedorCatalogo>.']
  ])('%o lanza un error que explica el problema', (hook, mensaje) => {
    // React tambien escribe el error en la consola: se silencia para no ensuciar la salida
    vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => renderHook(() => hook())).toThrow(mensaje)
  })

})
