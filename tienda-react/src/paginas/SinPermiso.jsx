import { Link } from 'react-router-dom'

import { useSesion } from '../contexto/sesionContexto'
import { nombreDeRol, panelDeRol } from '../datos/usuarios'

// Pagina 403: la persona SI inicio sesion, pero su rol no puede ver esta pagina.
// (Sin sesion es otra cosa: RutaProtegida la manda al login.)
// El backend igual responde 403 si intentan pedir los datos directo.

function SinPermiso() {
    const { usuario } = useSesion()
    const panel = panelDeRol(usuario?.rol)

    return (
        <main>
            <section className="detalle" aria-labelledby="tituloSinPermiso">
                <div className="container">
                    <div className="detalle-no-encontrado">
                        <h1 className="carrito-vacio-titulo" id="tituloSinPermiso">No tienes permiso para ver esta página</h1>
                        <p>
                            Ingresaste como <strong>{nombreDeRol(usuario?.rol)}</strong> y esta sección es de otro perfil.
                            Si crees que es un error, pide acceso al administrador.
                        </p>
                        <div className="d-flex flex-wrap justify-content-center gap-2 mt-4">
                            {panel && <Link className="btn btn-principal" to={panel}>Ir a mi panel</Link>}
                            <Link className={panel ? 'btn btn-secundario' : 'btn btn-principal'} to="/">Volver al inicio</Link>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    )
}

export default SinPermiso
