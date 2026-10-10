import { Link } from 'react-router-dom'

import TarjetaProducto from '../components/TarjetaProducto'
import { useCarrito } from '../contexto/carritoContexto'
import { useCatalogo } from '../contexto/catalogoContexto'
import { formatearPrecio, imagenDe } from '../datos/productos'
import {
  ofertaDeProducto,
  precioProducto,
  productosEnOferta
} from '../datos/ofertas'
import { abrirPanelCarrito } from '../utilidades/panelCarrito'

function Ofertas() {
  const { activos } = useCatalogo()
  const { agregar } = useCarrito()
  const ofertas = productosEnOferta(activos)

  function anadirAlCarrito(codigo) {
    const resultado = agregar(codigo, 1)

    if (resultado.ok) {
      abrirPanelCarrito()
    }

    return resultado
  }

  return (
    <main>
      <section className="pagina-encabezado" aria-labelledby="titulo-ofertas">
        <div className="encabezado-fondo" aria-hidden="true">
          <span className="luz luz-encabezado-verde"></span>
          <span className="luz luz-encabezado-celeste"></span>
          <span className="encabezado-arco"></span>
        </div>

        <div className="container">
          <nav className="miga" aria-label="Ruta">
            <Link to="/">Inicio</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">Ofertas</span>
          </nav>

          <h1 id="titulo-ofertas">Ofertas</h1>

          <p className="pagina-bajada">
            Productos seleccionados con precio especial por tiempo limitado.
          </p>
        </div>

        <svg className="encabezado-monte" viewBox="0 0 1440 60" preserveAspectRatio="none" aria-hidden="true" focusable="false">
          <path d="M0 60 L0 38 L110 22 L214 40 L318 16 L430 36 L536 20 L648 38 L764 18 L876 36 L992 22 L1104 40 L1216 20 L1330 34 L1440 22 L1440 60 Z" />
        </svg>
      </section>

      <section className="catalogo" aria-labelledby="titulo-listado-ofertas">
        <div className="container">
          <div className="titulo-seccion">
            <p>Precios destacados</p>
            <h2 id="titulo-listado-ofertas">Productos en oferta</h2>
          </div>

          {ofertas.length === 0 ? (
            <div className="sin-resultados">
              <p className="sin-resultados-titulo">
                No hay ofertas disponibles
              </p>
              <p>Revisa el catálogo completo mientras actualizamos promociones.</p>
              <Link className="btn btn-secundario" to="/productos">
                Ver catálogo
              </Link>
            </div>
          ) : (
            <ul className="row g-4 list-unstyled">
              {ofertas.map((producto) => {
                const oferta = ofertaDeProducto(producto.codigo)

                return (
                  <li key={producto.codigo} className="col-12 col-sm-6 col-lg-3">
                    <TarjetaProducto
                      codigo={producto.codigo}
                      nombre={producto.nombre}
                      categoria={producto.categoria}
                      precio={formatearPrecio(precioProducto(producto))}
                      precioAnterior={formatearPrecio(producto.precioResidencial)}
                      etiquetaOferta={oferta.etiqueta}
                      imagen={imagenDe(producto)}
                      stock={producto.stock}
                      alAnadir={() => anadirAlCarrito(producto.codigo)}
                    />
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </section>
    </main>
  )
}

export default Ofertas
