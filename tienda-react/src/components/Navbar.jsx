import { Link, useNavigate } from 'react-router-dom'
import { useCarrito } from '../contexto/carritoContexto'
import { useSesion } from '../contexto/sesionContexto'
import { iniciales, nombreDeRol } from '../datos/usuarios'

function Navbar() {
  const { detalle } = useCarrito()
  const { usuario, cerrarSesion } = useSesion()
  const navegar = useNavigate()

  function salir() {
    cerrarSesion()
    navegar("/")
  }

  return (
      <nav className="navbar navbar-expand-lg" data-bs-theme="dark" aria-label="Navegación principal">
            <div className="container">
                <Link className="navbar-brand" to="/">
                    <img className="marca-logo" src="/img/logo.svg" alt="Logo de Gas El Volcán"/>
                    <span>Gas El Volcán</span>
                </Link>

                <button
                    className="navbar-toggler"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#menuPrincipal"
                    aria-controls="menuPrincipal"
                    aria-expanded="false"
                    aria-label="Abrir menú"
                >
                    <span className="navbar-toggler-icon"></span>
                </button>

                <div className="collapse navbar-collapse" id="menuPrincipal">
                    <ul className="navbar-nav ms-auto align-items-lg-center">
                        <li className="nav-item">
                            <Link className="nav-link active" aria-current="page" to="/">Inicio</Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="/productos">Productos</Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="/nosotros">Nosotros</Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="/blogs">Blogs</Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="/contacto">Contacto</Link>
                        </li>
                        {/* Antes lo rellenaba js/sesion.js; ahora depende de la sesion */}
                        <li className="nav-item nav-cuenta">
                            {usuario ? (
                                <div className="cuenta-activa">
                                    <span className="avatar-cuenta" title={usuario.nombre + " (" + nombreDeRol(usuario.rol) + ")"}>
                                        <span aria-hidden="true">{iniciales(usuario.nombre)}</span>
                                        <span className="visually-hidden">Sesión iniciada: {usuario.nombre}</span>
                                    </span>
                                    {usuario.rol !== "CLIENTE" && (
                                        <span className="rol-insignia">{nombreDeRol(usuario.rol)}</span>
                                    )}
                                    <button type="button" className="btn btn-cuenta" onClick={salir}>Salir</button>
                                </div>
                            ) : (
                                <Link className="btn btn-cuenta" to="/login">Ingresar</Link>
                            )}
                        </li>
                        <li className="nav-item">
                            <button type="button" className="btn btn-carrito ms-lg-2" data-bs-toggle="offcanvas" data-bs-target="#panelCarrito" aria-controls="panelCarrito">
                                Carrito (<span className="carrito-total">{detalle.unidades}</span>)
                            </button>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>

  );
}

export default Navbar;
