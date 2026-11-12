import { pedir } from '../utilidades/api'
import { adaptarCatalogo } from './adaptadorCatalogo'

// Lectura publica mediante el Gateway configurado en api.js. No usa localStorage.
// Los errores HTTP/de conexion se propagan sin reemplazarlos por datos locales.
export async function obtenerCatalogo() {
  const [productos, categorias] = await Promise.all([
    pedir('/productos'),
    pedir('/categorias')
  ])
  return adaptarCatalogo(productos, categorias)
}
