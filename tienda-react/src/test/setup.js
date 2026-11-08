import '@testing-library/jest-dom/vitest'
import { afterEach, beforeEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// Cada prueba parte con localStorage vacio y, al terminar, se limpia
// la pantalla y se restauran los espias. Asi una prueba no cambia
// el resultado de la siguiente.
beforeEach(() => {
  localStorage.clear()
  // Las pruebas NUNCA llaman al backend de verdad: por defecto esta "apagado".
  // Cada prueba que necesita respuestas las simula con simularApi() (test/api.js).
  vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Sin backend en las pruebas'))
})
afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.restoreAllMocks()
})
