import { Link } from 'react-router-dom'

// Migrado desde detalle-blog-1.html del sitio en HTML.
function DetalleBlog1() {
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
            <span aria-current="page">Seguridad</span>
          </nav>
          <p className="hero-etiqueta">Seguridad</p>
          <h1 id="titulo-articulo">Cómo cambiar tu cilindro de forma segura</h1>
          <p className="pagina-bajada">Seis pasos para reemplazar el cilindro sin riesgos.</p>
        </div>

        <svg className="encabezado-monte" viewBox="0 0 1440 60" preserveAspectRatio="none" aria-hidden="true" focusable="false">
          <path d="M0 60 L0 38 L110 22 L214 40 L318 16 L430 36 L536 20 L648 38 L764 18 L876 36 L992 22 L1104 40 L1216 20 L1330 34 L1440 22 L1440 60 Z"/>
        </svg>
      </section>

      <section className="articulo">
        <div className="container">
          <figure className="articulo-portada">
            <img src="/img/cl002.jpg" alt="Cilindro de gas licuado de 11 kilogramos" />
          </figure>

          <div className="articulo-cuerpo">
            <p className="articulo-entrada">
              Cambiar un cilindro es simple, pero hay seis pasos que conviene no saltarse.
              La mayoría de las fugas domésticas no vienen del cilindro, sino de una conexión
              mal apretada o de una manguera vencida.
            </p>

            <h2>Antes de empezar</h2>
            <p>
              Apaga todos los artefactos conectados y cualquier llama cercana. No fumes ni
              enciendas luces mientras haces el cambio. Trabaja en un lugar ventilado, con
              la puerta o la ventana abierta.
            </p>

            <h2>Los seis pasos</h2>
            <ol className="articulo-pasos">
              <li><strong>Cierra la válvula</strong> del cilindro que vas a retirar, girándola hasta el tope.</li>
              <li><strong>Suelta el regulador</strong> con cuidado. No fuerces la rosca ni uses herramientas si no hace falta.</li>
              <li><strong>Revisa la manguera.</strong> Si está dura, agrietada o lleva más de dos años puesta, cámbiala. Una manguera de 1,5 metros cuesta bastante menos que un accidente.</li>
              <li><strong>Conecta el regulador</strong> al cilindro nuevo y ajusta las abrazaderas metálicas en los dos extremos de la manguera.</li>
              <li><strong>Comprueba con agua jabonosa.</strong> Pásala por las uniones con la válvula abierta: si aparecen burbujas, hay fuga. Cierra y vuelve a ajustar.</li>
              <li><strong>Enciende un artefacto</strong> y confirma que la llama sea azul y estable. Una llama amarilla o irregular indica un problema en la mezcla.</li>
            </ol>

            <div className="articulo-nota">
              <p>
                <strong>Si hueles gas y no encuentras el origen:</strong> cierra la válvula,
                ventila, no acciones interruptores eléctricos y sal del lugar antes de llamar.
              </p>
            </div>

            <h2>Qué necesitas tener a mano</h2>
            <p>
              Un regulador doméstico estándar sirve para los cilindros de 5, 11 y 15 kilos.
              Para cocinas industriales o equipos de mayor consumo se usa un regulador de alta
              presión. Si vas a instalar un cilindro por primera vez, el kit de conexión trae
              el regulador, la manguera de 1,5 metros y las abrazaderas en un solo paquete.
            </p>
          </div>

          <nav className="articulo-navegacion" aria-label="Otros artículos">
            <Link className="articulo-salto" to="/blogs/2"><span>Siguiente</span><strong>Qué cilindro necesitas según tu consumo</strong></Link>
          </nav>
        </div>
      </section>


    </main>
  )
}

export default DetalleBlog1
