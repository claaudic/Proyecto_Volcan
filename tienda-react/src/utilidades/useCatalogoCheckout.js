import { useCallback, useEffect, useState } from 'react'
import { obtenerCatalogo } from '../datos/catalogoApi'

// Lectura aislada: nunca publica ni modifica el catalogo global o localStorage.
export function useCatalogoCheckout() {
  const [version, setVersion] = useState(0)
  const [respuesta, setRespuesta] = useState({ version: -1, productos: [], categorias: [], error: '' })
  useEffect(() => {
    let vigente = true
    obtenerCatalogo().then(datos => {
      if (vigente) setRespuesta({ version, ...datos, error: '' })
    }).catch(error => {
      if (vigente) setRespuesta({ version, productos: [], categorias: [], error: error.message || 'No se pudo cargar el catalogo oficial.' })
    })
    return () => { vigente = false }
  }, [version])
  const recargar = useCallback(() => setVersion(actual => actual + 1), [])
  const cargando = respuesta.version !== version
  const error = cargando ? '' : respuesta.error
  return {
    productos: cargando ? [] : respuesta.productos,
    categorias: cargando ? [] : respuesta.categorias,
    cargando, error, disponible: !cargando && !error,
    estado: cargando ? 'cargando' : error ? 'error' : 'disponible', recargar,
  }
}
