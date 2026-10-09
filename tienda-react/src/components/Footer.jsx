import { Link } from 'react-router-dom'

function Footer(){
    return(
         <footer>
        <div className="container pie-grid">
            <div className="pie-marca">
                <div className="pie-logo">
                    <img src="/img/logo.svg" alt=""/>
                    <span>Gas El Volcán</span>
                </div>
                <p>Distribuidora familiar de gas licuado en Chillán, Región de Ñuble. En operación desde 1998.</p>
            </div>

            <div>
                <h2>Navegación</h2>
                <ul className="footer-enlaces">
                    <li><Link to="/">Inicio</Link></li>
                    <li><Link to="/productos">Productos</Link></li>
                    <li><Link to="/nosotros">Nosotros</Link></li>
                    <li><Link to="/blogs">Blogs</Link></li>
                    <li><Link to="/contacto">Contacto</Link></li>
                </ul>
            </div>

            <div>
                <h2>Productos</h2>
                <ul className="footer-enlaces">
                    <li><Link to="/categorias/cilindros-de-gas">Cilindros de Gas</Link></li>
                    <li><Link to="/categorias/reguladores">Reguladores</Link></li>
                    <li><Link to="/categorias/mangueras-y-conexiones">Mangueras y Conexiones</Link></li>
                    <li><Link to="/categorias/accesorios">Accesorios</Link></li>
                </ul>
            </div>

            <div>
                <h2>Contacto</h2>
                <ul className="pie-contacto">
                    <li>
                        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                            <path d="M12 21s7-5.5 7-11a7 7 0 10-14 0c0 5.5 7 11 7 11z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                            <circle cx="12" cy="10" r="2.5" fill="none" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                        <span>Chillán, Región de Ñuble</span>
                    </li>
                    <li>
                        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                            <path d="M5 4h4l2 5-2.5 1.5a12 12 0 005 5L15 13l5 2v4a1 1 0 01-1 1A16 16 0 014 5a1 1 0 011-1z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                        </svg>
                        <a href="tel:+56973214560">+56 9 7321 4560</a>
                    </li>
                    <li>
                        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                            <rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="2"/>
                            <path d="M3 7l9 6 9-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                        </svg>
                        <a href="mailto:contacto@gaselvolcan.cl">contacto@gaselvolcan.cl</a>
                    </li>
                    <li>
                        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                            <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2"/>
                            <path d="M12 7v5l3.5 2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                        <span>Lunes a sábado, 08:00 a 20:00</span>
                    </li>
                </ul>
            </div>
        </div>

        <div className="container">
            <p className="copyright">© 2026 Gas El Volcán. Todos los derechos reservados.</p>
        </div>
    </footer>
  );
 }

export default Footer;
