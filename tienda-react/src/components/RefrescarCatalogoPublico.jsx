import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useCatalogo } from '../contexto/catalogoContexto'

// Al regresar del panel se relee la fuente oficial, sin modificar su CRUD.
function RefrescarCatalogoPublico() {
  const { pathname } = useLocation()
  const { recargar, error } = useCatalogo()
  const visitoAdministracion = useRef(false)
  const rutaAnterior = useRef(pathname)
  useEffect(() => {
    const cambioRuta = rutaAnterior.current !== pathname
    rutaAnterior.current = pathname
    if (pathname === '/admin' || pathname.startsWith('/admin/')) {
      visitoAdministracion.current = true
      return
    }
    const publica = pathname === '/' || ['/productos', '/categorias', '/producto/', '/ofertas']
      .some(ruta => pathname === ruta || pathname.startsWith(ruta.endsWith('/') ? ruta : ruta + '/'))
    if (publica && (visitoAdministracion.current || (error && cambioRuta))) {
      visitoAdministracion.current = false
      recargar()
    }
  }, [pathname, recargar, error])
  return null
}

export default RefrescarCatalogoPublico
