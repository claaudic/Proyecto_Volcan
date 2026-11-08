import { Navigate, useLocation } from 'react-router-dom'

import { useSesion } from '../contexto/sesionContexto'
import SinPermiso from '../paginas/SinPermiso'

// Protege una ruta en App.jsx (antes cada pagina repetia esta revision).
//
//   <RutaProtegida roles={['ADMINISTRADOR']}><AdminUsuarios /></RutaProtegida>
//   <RutaProtegida><Perfil /></RutaProtegida>     (cualquiera con sesion)
//
// - Sin sesion: al login, recordando a donde queria ir (vuelve despues de entrar).
// - Con sesion pero otro rol: pagina "No tienes permiso" (403).
// El rol sale del token (ProveedorSesion), no de un dato editable del navegador.
// Es comodidad para la persona: la seguridad de verdad esta en el backend.

function RutaProtegida({ roles, children }) {
    const { usuario } = useSesion()
    const { pathname } = useLocation()

    if (!usuario) {
        return <Navigate to="/login" replace state={{ desde: pathname }} />
    }

    if (roles && !roles.includes(usuario.rol)) {
        return <SinPermiso />
    }

    return children
}

export default RutaProtegida
