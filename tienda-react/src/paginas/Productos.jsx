import { useState } from 'react'
import { Link } from 'react-router-dom'
import TarjetaProducto from '../components/TarjetaProducto'
import { formatearPrecio, imagenDe } from '../datos/productos'
import { ofertaDeProducto, precioProducto } from '../datos/ofertas'
import { useCatalogo } from '../contexto/catalogoContexto'
import { useCarrito } from '../contexto/carritoContexto'
import { abrirPanelCarrito } from '../utilidades/panelCarrito'
import { normalizar } from '../datos/zonas'

// Migrado desde productos.html y js/productos-catalogo.js.

function Productos() {
  const [busqueda, setBusqueda] = useState("")
  const [categoria, setCategoria] = useState("")
  const { agregar } = useCarrito()

  // Solo los productos activos: los que el administrador desactiva no se muestran
  const { activos } = useCatalogo()

  // Agrega una unidad y, si se pudo, abre el panel del carrito
  function anadirAlCarrito(codigo) {
    const resultado = agregar(codigo, 1)
    if (resultado.ok) {
      abrirPanelCarrito()
    }
    return resultado
  }

  // Las categorias salen de los propios productos, sin repetir
  const categorias = [...new Set(activos.map((p) => p.categoria))]

  // Busca en nombre, codigo, descripcion y categoria, sin importar tildes
  // ni mayusculas, igual que el catalogo del sitio en HTML
  const texto = normalizar(busqueda)

  const filtrados = activos.filter((producto) => {
    if (categoria !== "" && producto.categoria !== categoria) {
      return false
    }

    const datos = normalizar(
      producto.nombre + " " + producto.codigo + " " + producto.descripcion + " " + producto.categoria
    )

    return datos.includes(texto)
  })

  function limpiarFiltros() {
    setBusqueda("")
    setCategoria("")
  }

  return (
    <main>
      <section className="pagina-encabezado" aria-labelledby="titulo-catalogo">
        <div className="encabezado-fondo" aria-hidden="true">
          <span className="luz luz-encabezado-verde"></span>
          <span className="luz luz-encabezado-celeste"></span>
          <span className="encabezado-arco"></span>
        </div>

        <div className="container">
          <nav className="miga" aria-label="Ruta">
            <Link to="/">Inicio</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">Productos</span>
          </nav>
          <h1 id="titulo-catalogo">Catálogo de productos</h1>
          <p className="pagina-bajada">Cilindros, reguladores, mangueras y accesorios con despacho a domicilio.</p>
        </div>

        <svg className="encabezado-monte" viewBox="0 0 1440 60" preserveAspectRatio="none" aria-hidden="true" focusable="false">
          <path d="M0 60 L0 38 L110 22 L214 40 L318 16 L430 36 L536 20 L648 38 L764 18 L876 36 L992 22 L1104 40 L1216 20 L1330 34 L1440 22 L1440 60 Z" />
        </svg>
      </section>

      <section className="catalogo" aria-labelledby="titulo-listado">
        <div className="container">
          <h2 id="titulo-listado" className="visually-hidden">Listado de productos</h2>

          <div className="barra-filtros">
            <div className="buscador">
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
                <path d="M16.5 16.5 L21 21" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <label htmlFor="buscarProducto" className="visually-hidden">Buscar producto</label>
              <input
                type="search"
                id="buscarProducto"
                placeholder="Buscar por nombre, código o descripción"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>

            {/* La pildora de la categoria elegida se pinta segun el estado */}
            <div className="pildoras" role="group" aria-label="Filtrar por categoría">
              {["", ...categorias].map((cat) => (
                <button
                  key={cat || "todas"}
                  type="button"
                  className={categoria === cat ? "pildora pildora-activa" : "pildora"}
                  aria-pressed={categoria === cat}
                  onClick={() => setCategoria(cat)}
                >
                  {cat || "Todas"}
                </button>
              ))}
            </div>

            <p className="contador-resultados" role="status" aria-live="polite">
              {filtrados.length === 0
                ? ""
                : filtrados.length === activos.length
                  ? activos.length + " productos"
                  : filtrados.length + " de " + activos.length + " productos"}
            </p>
          </div>

          {filtrados.length === 0 ? (
            <div className="sin-resultados">
              <p className="sin-resultados-titulo">No encontramos productos</p>
              <p>Prueba con otra palabra o revisa todas las categorías.</p>
              <button type="button" className="btn btn-secundario" onClick={limpiarFiltros}>
                Ver todo el catálogo
              </button>
            </div>
          ) : (
            <ul className="row g-4 list-unstyled">
              {filtrados.map((producto) => (
                <li key={producto.codigo} className="col-12 col-sm-6 col-lg-3">
                  {(() => {
                    const oferta = ofertaDeProducto(producto.codigo)

                    return (
                      <TarjetaProducto
                        codigo={producto.codigo}
                        nombre={producto.nombre}
                        categoria={producto.categoria}
                        precio={formatearPrecio(precioProducto(producto))}
                        precioAnterior={
                          oferta
                            ? formatearPrecio(producto.precioResidencial)
                            : null
                        }
                        etiquetaOferta={oferta?.etiqueta}
                        imagen={imagenDe(producto)}
                        stock={producto.stock}
                        alAnadir={() => anadirAlCarrito(producto.codigo)}
                      />
                    )
                  })()}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  )
}

export default Productos
