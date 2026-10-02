import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// En el sitio en HTML cada enlace cargaba una pagina nueva, que siempre
// empezaba arriba. Con React Router la pagina no se recarga, asi que el
// scroll se queda donde estaba. Este componente lo sube cada vez que
// cambia la direccion. No dibuja nada.

function SubirAlInicio() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}

export default SubirAlInicio
