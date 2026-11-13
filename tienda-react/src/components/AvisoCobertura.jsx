import { buscarZona } from '../datos/zonas'

// Aviso bajo el campo comuna: dice si llegamos y qué días se reparte.
// Solo avisa, no impide guardar. Lo usan Registro y Perfil.
function AvisoCobertura({ comuna }) {
    if (comuna.trim() === '') {
        return null
    }

    const zona = buscarZona(comuna)

    if (!zona) {
        return (
            <small className="mensaje-ayuda aviso-cobertura-no">
                Todavía no tenemos reparto en esa comuna.
            </small>
        )
    }

    return (
        <small className="mensaje-ayuda aviso-cobertura-ok">
            Llegamos a tu comuna: {zona.zona}, {zona.dias.toLowerCase()} de {zona.horario}.
        </small>
    )
}

export default AvisoCobertura
