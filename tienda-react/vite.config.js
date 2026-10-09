import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Configuracion de Vite y de las pruebas con Vitest.
// Sigue la configuracion del proyecto GameTech del curso.
export default defineConfig({
  plugins: [react()],
  test: {
    // jsdom: un navegador simulado para que React pueda dibujar los componentes
    environment: 'jsdom',
    // Se ejecuta antes de cada archivo de pruebas (limpieza y matchers)
    setupFiles: ['./src/test/setup.js'],
    include: ['src/**/*.test.{js,jsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{js,jsx}'],
      // No se mide: el punto de entrada, la ayuda y la configuracion de pruebas, y las pruebas mismas
      exclude: [
        'src/main.jsx',
        'src/test/**',
        'src/**/*.test.{js,jsx}',
      ],
      // Cada archivo debe tener al menos 80 % de lineas y sentencias
      // cubiertas; si alguno baja, npm run test:coverage falla
      thresholds: {
        lines: 80,
        statements: 80,
        perFile: true,
      },
    },
  },
})
