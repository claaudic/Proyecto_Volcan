import { Link } from 'react-router-dom'
import TarjetaProducto from '../components/TarjetaProducto'
import { formatearPrecio, imagenDe } from '../datos/productos'
import { useCatalogo } from '../contexto/catalogoContexto'

// Migrado desde index.html del sitio en HTML.
// Los mismos ocho productos que destacaba js/productos-publico.js
const CODIGOS_DESTACADOS = ["CL001", "CL002", "CL003", "CL004", "RG001", "MG004", "AC001", "AC003"]

function Inicio() {
  const { activos } = useCatalogo()

  const destacados = CODIGOS_DESTACADOS
    .map((codigo) => activos.find((p) => p.codigo === codigo))
    .filter((producto) => producto !== undefined)

  return (
    <main>
      <section className="hero" aria-labelledby="titulo-hero">
        <div className="hero-fondo" aria-hidden="true">
          <span className="luz luz-verde" data-profundidad="26"></span>
          <span className="luz luz-celeste" data-profundidad="34"></span>
          <span className="forma-arco"></span>
          <svg className="silueta silueta-uno" data-profundidad="18" viewBox="0 0 80 150" focusable="false">
            <path d="M18 140 L18 50 Q18 28 40 28 Q62 28 62 50 L62 140 Q62 146 56 146 L24 146 Q18 146 18 140 Z" fill="currentColor"/>
            <rect x="33" y="6" width="14" height="24" rx="4" fill="currentColor"/>
            <path d="M24 18 Q40 2 56 18" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round"/>
          </svg>
          <svg className="silueta silueta-dos" data-profundidad="11" viewBox="0 0 80 150" focusable="false">
            <path d="M18 140 L18 50 Q18 28 40 28 Q62 28 62 50 L62 140 Q62 146 56 146 L24 146 Q18 146 18 140 Z" fill="currentColor"/>
            <rect x="33" y="6" width="14" height="24" rx="4" fill="currentColor"/>
            <path d="M24 18 Q40 2 56 18" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round"/>
          </svg>
        </div>

        <div className="container hero-contenido">
          <div>
            <p className="hero-etiqueta">Chillán · Región de Ñuble</p>
            <h1 id="titulo-hero">Tu cilindro llega hasta la puerta de tu casa</h1>
            <p>
              Pide en línea a cualquier hora y revisa el día
              de reparto de tu comuna antes de comprar.
            </p>

            <p className="hero-lema">Por ti, por las Pymes, por Chillán</p>

            <div className="hero-botones">
              <Link className="btn btn-principal" to="/productos">
                Ver productos
              </Link>
              <Link className="btn btn-secundario" to="/contacto">
                Contáctanos
              </Link>
            </div>
          </div>

          <div className="hero-imagen">
            <span className="hero-piso" aria-hidden="true"></span>

            <div id="carruselHero" className="carousel slide carousel-fade hero-carrusel" data-bs-ride="carousel" data-bs-interval="6500" data-bs-pause="hover">

              <div className="carousel-indicators">
                <button type="button" data-bs-target="#carruselHero" data-bs-slide-to="0" className="active" aria-current="true" aria-label="Foto 1 de 3"></button>
                <button type="button" data-bs-target="#carruselHero" data-bs-slide-to="1" aria-label="Foto 2 de 3"></button>
                <button type="button" data-bs-target="#carruselHero" data-bs-slide-to="2" aria-label="Foto 3 de 3"></button>
              </div>

              <div className="carousel-inner">
                <div className="carousel-item active">
                  <img src="/img/hero-entrega.jpg" alt="Repartidor entregando un cilindro de 15 kg a una clienta en la puerta de su casa" />
                </div>
                <div className="carousel-item">
                  <img src="/img/hero-calle.jpg" loading="lazy" alt="Camión de Gas El Volcán recorriendo una calle de Chillán con cilindros cargados" />
                </div>
                <div className="carousel-item">
                  <img src="/img/hero-carga.jpg" loading="lazy" alt="Dos trabajadores cargando cilindros en el camión de reparto" />
                </div>
              </div>

              <button className="carousel-control-prev" type="button" data-bs-target="#carruselHero" data-bs-slide="prev">
                <span className="carousel-control-prev-icon" aria-hidden="true"></span>
                <span className="visually-hidden">Foto anterior</span>
              </button>

              <button className="carousel-control-next" type="button" data-bs-target="#carruselHero" data-bs-slide="next">
                <span className="carousel-control-next-icon" aria-hidden="true"></span>
                <span className="visually-hidden">Foto siguiente</span>
              </button>

            </div>

            <div className="hero-insignia" data-profundidad="-10">
              <p className="hero-insignia-numero">1–3 h</p>
              <p className="hero-insignia-texto">Entrega en Chillán centro</p>
            </div>
          </div>
        </div>
      </section>

      <div className="relieve" aria-hidden="true">
        <svg viewBox="0 0 1440 80" preserveAspectRatio="none" focusable="false">
          <path d="M0 80 L0 48 L96 30 L188 46 L286 22 L384 42 L472 26 L566 44 L664 24 L762 42 L862 28 L960 46 L1072 26 L1172 44 L1272 28 L1362 42 L1440 30 L1440 80 Z"/>
        </svg>
      </div>

      <section className="productos-destacados" aria-labelledby="titulo-destacados">
        <div className="container" data-revelar>
          <div className="titulo-seccion">
            <p>Nuestro catálogo</p>
            <h2 id="titulo-destacados">Productos destacados</h2>
          </div>

          <ul className="row g-4 list-unstyled">
            {destacados.map((producto) => (
              <li key={producto.codigo} className="col-12 col-sm-6 col-lg-3">
                <TarjetaProducto
                  codigo={producto.codigo}
                  nombre={producto.nombre}
                  categoria={producto.categoria}
                  precio={formatearPrecio(producto.precioResidencial)}
                  imagen={imagenDe(producto.codigo)}
                />
              </li>
            ))}
          </ul>

          <div className="text-center mt-5">
            <Link className="btn btn-principal" to="/productos">
              Ver catálogo completo
            </Link>
          </div>
        </div>
      </section>

    </main>
  )
}

export default Inicio
