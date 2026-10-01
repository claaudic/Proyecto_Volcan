import { Link } from 'react-router-dom'

// Migrado desde contacto.html del sitio en HTML.
function Contacto() {
  return (
    <main>
      <section className="pagina-encabezado" aria-labelledby="titulo-contacto">
      <div className="encabezado-fondo" aria-hidden="true">
      <span className="luz luz-encabezado-verde"></span>
      <span className="luz luz-encabezado-celeste"></span>
      <span className="encabezado-arco"></span>
      </div>

      <div className="container">
      <nav className="miga" aria-label="Ruta">
      <Link to="/">Inicio</Link>
      <span aria-hidden="true">/</span>
      <span aria-current="page">Contacto</span>
      </nav>
      <h1 id="titulo-contacto">Escríbenos</h1>
      <p className="pagina-bajada">Cuéntanos qué necesitas y te respondemos a la brevedad.</p>
      </div>

      <svg className="encabezado-monte" viewBox="0 0 1440 60" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path d="M0 60 L0 38 L110 22 L214 40 L318 16 L430 36 L536 20 L648 38 L764 18 L876 36 L992 22 L1104 40 L1216 20 L1330 34 L1440 22 L1440 60 Z"/>
      </svg>
      </section>

      <section className="contacto" aria-labelledby="titulo-formulario">
      <div className="container contacto-grid" data-revelar>

      <div className="tarjeta-panel">
      <h2 id="titulo-formulario">Formulario de contacto</h2>
      <p className="panel-bajada">Todos los campos marcados con asterisco son obligatorios.</p>

      <form id="formContacto" novalidate>
      <div className="campo">
      <label htmlFor="nombre">Nombre <abbr title="obligatorio">*</abbr></label>
      <input type="text" id="nombre" name="nombre" autoComplete="name" maxLength="100" placeholder="Tu nombre completo" required />
      <small className="mensaje-error-campo" id="errorNombre" role="status"></small>
      </div>

      <div className="campo">
      <label htmlFor="correoContacto">Correo electrónico <abbr title="obligatorio">*</abbr></label>
      <input type="email" id="correoContacto" name="correo" autoComplete="email" maxLength="100" placeholder="nombre@gmail.com" required />
      <small className="mensaje-error-campo" id="errorCorreoContacto" role="status"></small>
      </div>

      <div className="campo">
      <label htmlFor="asunto">Asunto</label>
      <input type="text" id="asunto" name="asunto" maxLength="100" placeholder="Sobre qué nos escribes" list="asuntosFrecuentes" />
      <datalist id="asuntosFrecuentes">
      <option value="Consulta por un pedido"></option>
      <option value="Cobertura en mi comuna"></option>
      <option value="Precios y disponibilidad"></option>
      <option value="Cuenta comercial"></option>
      </datalist>
      </div>

      <div className="campo">
      <label htmlFor="comentario">Mensaje <abbr title="obligatorio">*</abbr></label>
      <textarea id="comentario" name="comentario" rows="6" maxLength="500" placeholder="Cuéntanos qué necesitas" required></textarea>
      <div className="campo-pie">
      <small className="mensaje-error-campo" id="errorComentario" role="status"></small>
      <small className="contador" id="contadorComentario">0 / 500</small>
      </div>
      </div>

      <div className="mensaje-exito d-none" id="mensajeExito" role="alert"></div>

      <button type="submit" className="btn btn-principal">Enviar mensaje</button>
      </form>
      </div>

      <aside className="contacto-lateral">
      <div className="tarjeta-panel">
      <h2>Datos de la distribuidora</h2>
      <ul className="pie-contacto lista-datos">
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

      <div className="tarjeta-panel">
      <h2>¿Prefieres pedir directamente?</h2>
      <p className="panel-bajada">Revisa el catálogo y coordina tu despacho.</p>
      <Link className="btn btn-principal boton-ancho" to="/productos">Ver productos</Link>
      </div>
      </aside>

      </div>
      </section>


    </main>
  )
}

export default Contacto
