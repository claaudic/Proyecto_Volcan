import { Link } from 'react-router-dom'

// Migrado desde detalle-blog-3.html del sitio en HTML.
function DetalleBlog3() {
  return (
    <main>
      <section className="pagina-encabezado" aria-labelledby="titulo-articulo">
        <div className="encabezado-fondo" aria-hidden="true">
          <span className="luz luz-encabezado-verde"></span>
          <span className="luz luz-encabezado-celeste"></span>
          <span className="encabezado-arco"></span>
        </div>

        <div className="container">
          <nav className="miga" aria-label="Ruta">
            <Link to="/">Inicio</Link>
            <span aria-hidden="true">/</span>
            <Link to="/blogs">Blogs</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">Prevención</span>
          </nav>
          <p className="hero-etiqueta">Prevención</p>
          <h1 id="titulo-articulo">Cuándo conviene tener un detector de gas</h1>
          <p className="pagina-bajada">Qué hace un sensor electroquímico y dónde instalarlo.</p>
        </div>

        <svg className="encabezado-monte" viewBox="0 0 1440 60" preserveAspectRatio="none" aria-hidden="true" focusable="false">
          <path d="M0 60 L0 38 L110 22 L214 40 L318 16 L430 36 L536 20 L648 38 L764 18 L876 36 L992 22 L1104 40 L1216 20 L1330 34 L1440 22 L1440 60 Z"/>
        </svg>
      </section>

      <section className="articulo">
        <div className="container">
          <figure className="articulo-portada">
            <img src="/img/ac003.jpg" alt="Detector de gas a batería con alarma sonora y visual" />
          </figure>

          <div className="articulo-cuerpo">
            <p className="articulo-entrada">
              Un detector de gas es un aparato barato que resuelve el único problema que el
              olfato no siempre alcanza a resolver a tiempo: una fuga lenta mientras duermes
              o cuando no hay nadie en la casa.
            </p>

            <h2>Cómo funciona</h2>
            <p>
              El sensor es electroquímico. Detecta concentraciones de gas licuado o metano en
              el aire mucho antes de que lleguen a un nivel peligroso, y avisa con alarma
              sonora y visual. Funciona con batería, así que sigue operando durante un corte
              de luz, que es justamente cuando más artefactos a gas se encienden.
            </p>

            <h2>Dónde instalarlo</h2>
            <p>
              El gas licuado es más pesado que el aire, así que se acumula abajo. El detector
              va <strong>cerca del suelo</strong>, a unos 30 centímetros, y a no más de tres
              metros del artefacto o del cilindro. Ponerlo en el techo, como se hace con los
              detectores de humo, es un error frecuente: ahí no llega.
            </p>

            <h2>Cuándo deja de ser opcional</h2>
            <ul className="articulo-lista">
              <li>Cuando el cilindro está dentro de la vivienda y no en un espacio ventilado.</li>
              <li>Cuando hay dormitorios cerca de la cocina o del calefón.</li>
              <li>Cuando en la casa viven adultos mayores, niños pequeños o alguien con el olfato disminuido.</li>
              <li>En locales comerciales, donde el consumo es mayor y hay público.</li>
            </ul>

            <div className="articulo-nota">
              <p>
                <strong>Si el detector suena:</strong> no enciendas ni apagues nada eléctrico.
                Cierra la válvula del cilindro, abre puertas y ventanas, y sal del lugar.
                El interruptor de la luz produce una chispa suficiente para encender gas acumulado.
              </p>
            </div>
          </div>

          <nav className="articulo-navegacion" aria-label="Otros artículos">
            <Link className="articulo-salto" to="/blogs/2"><span>Anterior</span><strong>Qué cilindro necesitas según tu consumo</strong></Link>
          </nav>
        </div>
      </section>


    </main>
  )
}

export default DetalleBlog3
