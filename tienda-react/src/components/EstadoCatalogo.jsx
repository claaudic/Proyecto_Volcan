import { useCatalogo } from '../contexto/catalogoContexto'
import { SIN_CONEXION } from '../utilidades/api'

// No introduce elementos ni espacios cuando el catálogo está disponible.
function EstadoCatalogo({ children, recuperacion }) {
  const { cargando, actualizando, error } = useCatalogo()
  if (cargando) {
    return <p className="visually-hidden" role="status">{actualizando ? 'Actualizando catálogo oficial…' : 'Cargando catálogo oficial…'}</p>
  }
  if (error) {
    return (
      <div className="sin-resultados" role="alert">
        <p className="sin-resultados-titulo">{error === SIN_CONEXION ? SIN_CONEXION : 'Ocurrió un error inesperado. Intenta de nuevo.'}</p>
        {recuperacion}
      </div>
    )
  }
  return children
}

export default EstadoCatalogo
