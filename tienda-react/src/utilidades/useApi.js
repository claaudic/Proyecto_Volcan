import { useEffect, useState } from "react"
import { useSesion } from "../contexto/sesionContexto"

// Pide datos a ms-usuarios apenas se abre la pantalla, con el token de la sesion.
//
//   const { datos, error, cargando } = useApi("/usuarios/repartidores")
//
// Si la ruta es null no pide nada (por ejemplo, si el rol no corresponde).
// Mientras espera: cargando = true. Si falla: error trae el mensaje del backend.
export function useApi(ruta) {
  const { llamarApi } = useSesion()
  const [respuesta, setRespuesta] = useState({ ruta: null, datos: null, error: "" })

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
  }, [ruta, llamarApi])

  // La respuesta guardada sirve solo si es de esta misma ruta
  const llego = respuesta.ruta === ruta

  return {
    datos: llego ? respuesta.datos : null,
    error: llego ? respuesta.error : "",
    cargando: Boolean(ruta) && !llego
  }
}
