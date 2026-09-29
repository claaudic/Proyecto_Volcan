import { Link } from 'react-router-dom'

function Navbar() {
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
                        <li className="nav-item nav-cuenta" id="navCuenta"></li>
                        <li className="nav-item">
                            <button type="button" className="btn btn-carrito ms-lg-2" data-bs-toggle="offcanvas" data-bs-target="#panelCarrito" aria-controls="panelCarrito">
                                Carrito (<span className="carrito-total">0</span>)
                            </button>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>

  );
}

export default Navbar;
