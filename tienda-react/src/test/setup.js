import '@testing-library/jest-dom/vitest'
import { afterEach, beforeEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// Cada prueba parte con localStorage vacio y, al terminar, se limpia
// la pantalla y se restauran los espias. Asi una prueba no cambia
// el resultado de la siguiente.
beforeEach(() => localStorage.clear())
afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.restoreAllMocks()
})
