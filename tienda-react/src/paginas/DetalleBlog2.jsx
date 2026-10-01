import { Link } from 'react-router-dom'

// Migrado desde detalle-blog-2.html del sitio en HTML.
function DetalleBlog2() {
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
            <span aria-current="page">Guía de compra</span>
          </nav>
          <p className="hero-etiqueta">Guía de compra</p>
          <h1 id="titulo-articulo">Qué cilindro necesitas según tu consumo</h1>
          <p className="pagina-bajada">De 5 a 45 kilos: para qué sirve cada formato.</p>
        </div>

        <svg className="encabezado-monte" viewBox="0 0 1440 60" preserveAspectRatio="none" aria-hidden="true" focusable="false">
          <path d="M0 60 L0 38 L110 22 L214 40 L318 16 L430 36 L536 20 L648 38 L764 18 L876 36 L992 22 L1104 40 L1216 20 L1330 34 L1440 22 L1440 60 Z"/>
        </svg>
      </section>

      <section className="articulo">
        <div className="container">
          <figure className="articulo-portada">
            <img src="/img/cl004.jpg" alt="Cilindro de gas licuado industrial de 45 kilogramos" />
          </figure>

          <div className="articulo-cuerpo">
            <p className="articulo-entrada">
              Elegir el cilindro correcto no es cosa de gustos: depende de cuánta gente vive
              en la casa, qué artefactos usas y con qué frecuencia. Un cilindro demasiado chico
              obliga a cambiarlo cada dos semanas; uno demasiado grande es plata inmovilizada.
            </p>

            <h2>Los cuatro formatos</h2>

            <h3>5 kilos</h3>
            <p>
              Para uso residencial acotado: una cocina de uso ocasional o una calefacción
              pequeña. Es el más liviano y el más fácil de transportar, así que también es
              el que se lleva a la parcela o al camping.
            </p>

            <h3>11 kilos</h3>
            <p>
              El estándar doméstico y <strong>el más utilizado en los hogares chilenos</strong>.
              Es compatible con cualquier regulador estándar. Si tienes dudas y vives en una
              casa o departamento normal, este es el que buscas.
            </p>

            <h3>15 kilos</h3>
            <p>
              Para hogares de alto consumo o locales pequeños. Conviene cuando el gas alimenta
              cocina y calefón al mismo tiempo, o cuando en la casa viven cinco personas o más
              y el de 11 kilos se acaba demasiado seguido.
            </p>

            <h3>45 kilos</h3>
            <p>
              Cilindro industrial. Uso comercial: restaurantes, talleres y calefacción de
              locales. No está pensado para una casa, y su manipulación requiere un carro
              porta cilindro por peso.
            </p>

            <div className="articulo-nota">
              <p>
                <strong>Regla práctica:</strong> si cambias el cilindro más de una vez al mes,
                te conviene subir de formato. Si te dura más de cuatro meses, probablemente
                estás pagando por capacidad que no usas.
              </p>
            </div>

            <h2>Un detalle sobre los reguladores</h2>
            <p>
              Los tres primeros formatos comparten el mismo regulador doméstico. Si tienes dos
              artefactos que necesitan gas simultáneamente, existe un regulador dual de dos
              salidas que permite conectarlos al mismo cilindro sin instalar una segunda línea.
            </p>
          </div>

          <nav className="articulo-navegacion" aria-label="Otros artículos">
            <Link className="articulo-salto" to="/blogs/1"><span>Anterior</span><strong>Cómo cambiar tu cilindro de forma segura</strong></Link>
            <Link className="articulo-salto" to="/blogs/3"><span>Siguiente</span><strong>Cuándo conviene tener un detector de gas</strong></Link>
          </nav>
        </div>
      </section>


    </main>
  )
}

export default DetalleBlog2
