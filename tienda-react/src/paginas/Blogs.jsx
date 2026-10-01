import { Link } from 'react-router-dom'

// Migrado desde blogs.html del sitio en HTML.
function Blogs() {
  return (
    <main>
      <section className="pagina-encabezado" aria-labelledby="titulo-blogs">
        <div className="encabezado-fondo" aria-hidden="true">
          <span className="luz luz-encabezado-verde"></span>
          <span className="luz luz-encabezado-celeste"></span>
          <span className="encabezado-arco"></span>
        </div>

        <div className="container">
          <nav className="miga" aria-label="Ruta">
            <Link to="/">Inicio</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">Blogs</span>
          </nav>
          <h1 id="titulo-blogs">Guías del gas</h1>
          <p className="pagina-bajada">Cómo usar, elegir y cuidar tu cilindro. Contenido práctico para el día a día.</p>
        </div>

        <svg className="encabezado-monte" viewBox="0 0 1440 60" preserveAspectRatio="none" aria-hidden="true" focusable="false">
          <path d="M0 60 L0 38 L110 22 L214 40 L318 16 L430 36 L536 20 L648 38 L764 18 L876 36 L992 22 L1104 40 L1216 20 L1330 34 L1440 22 L1440 60 Z"/>
        </svg>
      </section>

      <section className="listado-blogs" aria-labelledby="titulo-listado">
        <div className="container" data-revelar>
          <h2 id="titulo-listado" className="visually-hidden">Artículos publicados</h2>

          <ul className="row g-4 list-unstyled">
            <li className="col-12 col-md-6 col-lg-4">
              <article className="tarjeta-blog">
                <Link className="blog-imagen" to="/blogs/1">
                  <img src="/img/cl002.jpg" alt="Cilindro de gas licuado de 11 kilogramos" loading="lazy" />
                </Link>
                <div className="blog-cuerpo">
                  <p className="blog-etiqueta">Seguridad</p>
                  <h3><Link to="/blogs/1">Cómo cambiar tu cilindro de forma segura</Link></h3>
                  <p className="blog-resumen">Seis pasos para reemplazar el cilindro sin riesgos, revisando el regulador, la manguera y las abrazaderas.</p>
                  <Link className="blog-enlace" to="/blogs/1">Leer el artículo</Link>
                </div>
              </article>
            </li>

            <li className="col-12 col-md-6 col-lg-4">
              <article className="tarjeta-blog">
                <Link className="blog-imagen" to="/blogs/2">
                  <img src="/img/cl004.jpg" alt="Cilindro de gas licuado industrial de 45 kilogramos" loading="lazy" />
                </Link>
                <div className="blog-cuerpo">
                  <p className="blog-etiqueta">Guía de compra</p>
                  <h3><Link to="/blogs/2">Qué cilindro necesitas según tu consumo</Link></h3>
                  <p className="blog-resumen">De 5 a 45 kilos: para qué sirve cada formato y cuál conviene según el tamaño de tu hogar o negocio.</p>
                  <Link className="blog-enlace" to="/blogs/2">Leer el artículo</Link>
                </div>
              </article>
            </li>

            <li className="col-12 col-md-6 col-lg-4">
              <article className="tarjeta-blog">
                <Link className="blog-imagen" to="/blogs/3">
                  <img src="/img/ac003.jpg" alt="Detector de gas a batería con alarma sonora y visual" loading="lazy" />
                </Link>
                <div className="blog-cuerpo">
                  <p className="blog-etiqueta">Prevención</p>
                  <h3><Link to="/blogs/3">Cuándo conviene tener un detector de gas</Link></h3>
                  <p className="blog-resumen">Qué hace un sensor electroquímico, dónde instalarlo y en qué casos deja de ser opcional.</p>
                  <Link className="blog-enlace" to="/blogs/3">Leer el artículo</Link>
                </div>
              </article>
            </li>

          </ul>
        </div>
      </section>


    </main>
  )
}

export default Blogs
