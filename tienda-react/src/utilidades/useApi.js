import { useCallback, useEffect, useState } from "react"
import { useSesion } from "../contexto/sesionContexto"

// Pide datos a ms-usuarios apenas se abre la pantalla, con el token de la sesion.
//
//   const { datos, error, cargando, recargar } = useApi("/usuarios/repartidores")
//
// Si la ruta es null no pide nada (por ejemplo, si el rol no corresponde).
// Mientras espera: cargando = true. Si falla: error trae el mensaje del backend.
// recargar() la vuelve a pedir (por ejemplo, despues de crear o eliminar algo).
export function useApi(ruta) {
  const { llamarApi } = useSesion()
  const [respuesta, setRespuesta] = useState({ ruta: null, datos: null, error: "" })
  // Cada vez que cambia, el efecto vuelve a pedir los datos
  const [version, setVersion] = useState(0)

  useEffect(() => {
    if (!ruta) {
      return
    }

    // Si se sale de la pantalla antes de que responda, no se toca el estado
    let vigente = true

    llamarApi(ruta)
      .then((datos) => vigente && setRespuesta({ ruta, datos, error: "" }))
      .catch((falla) => vigente && setRespuesta({ ruta, datos: null, error: falla.message }))

    return () => { vigente = false }
  }, [ruta, llamarApi, version])

  // useCallback: la funcion no cambia en cada render, asi se puede usar sin riesgo en un efecto
  const recargar = useCallback(() => setVersion((actual) => actual + 1), [])

  // La respuesta guardada sirve solo si es de esta misma ruta
  const llego = respuesta.ruta === ruta

  return {
    datos: llego ? respuesta.datos : null,
    error: llego ? respuesta.error : "",
    cargando: Boolean(ruta) && !llego,
    recargar
  }
}
