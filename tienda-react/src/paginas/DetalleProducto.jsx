import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import TarjetaProducto from '../components/TarjetaProducto'
import EtiquetaStock from '../components/EtiquetaStock'
import { formatearPrecio, imagenDe, IMAGEN_RESPALDO } from '../datos/productos'
import { useCatalogo } from '../contexto/catalogoContexto'
import { useCarrito } from '../contexto/carritoContexto'
import { abrirPanelCarrito } from '../utilidades/panelCarrito'
import { registrarVisto } from '../datos/vistos'

// Migrado desde detalle-producto.html y js/detalle-producto.js.
//
// La ruta es /producto/:codigo. El ":codigo" es un parametro:
// una sola ruta sirve para los 14 productos.

function DetalleProducto() {
  // Lee el parametro de la direccion: /producto/CL003 -> "CL003"
  const { codigo } = useParams()

  // La key hace que la ficha se reinicie al pasar de un producto a otro
  // (por ejemplo, desde los relacionados). Sin ella, la cantidad elegida
  // en un producto se arrastraria al siguiente.
  return <FichaProducto key={codigo} codigo={codigo} />
}

function FichaProducto({ codigo }) {
  const [cantidad, setCantidad] = useState(1)
  const [aviso, setAviso] = useState("")
  const { agregar } = useCarrito()
  const { activos } = useCatalogo()

  // Un producto desactivado no tiene pagina: aparece como no encontrado
  const producto = activos.find((p) => p.codigo === codigo.toUpperCase())

  // Despues de mostrar la ficha, se anota el producto como visto.
  // Va antes del "return" de abajo: los hooks no pueden ir despues de un return.
  const codigoVisto = producto ? producto.codigo : null

  useEffect(() => {
    if (codigoVisto) {
      registrarVisto(codigoVisto)
    }
  }, [codigoVisto])

  if (!producto) {
    return (
      <main>
        <section className="detalle">
          <div className="container">
            <div className="detalle-no-encontrado">
              <p className="carrito-vacio-titulo">No encontramos ese producto</p>
              <p>Puede que el código no exista o que ya no esté disponible.</p>
              <Link className="btn btn-principal" to="/productos">Volver al catálogo</Link>
            </div>
          </div>
        </section>
      </main>
    )
  }

  const sinStock = producto.stock === 0

  // La cantidad nunca baja de 1 ni supera el stock disponible
  function ajustar(valor) {
    let nueva = Number(valor) || 1

    if (nueva < 1) {
      nueva = 1
    }
    if (nueva > producto.stock) {
      nueva = producto.stock
    }

    setCantidad(nueva)
    setAviso("")
  }

  function anadir() {
    const resultado = agregar(producto.codigo, cantidad)

    if (resultado.ok) {
      setAviso("")
      abrirPanelCarrito()
    } else {
      setAviso(resultado.mensaje)
    }
  }

  function usarImagenRespaldo(evento) {
    if (evento.currentTarget.src.endsWith(IMAGEN_RESPALDO)) {
      return
    }

    evento.currentTarget.src = IMAGEN_RESPALDO
  }

  const relacionados = activos
    .filter((p) => p.categoria === producto.categoria && p.codigo !== producto.codigo)
    .slice(0, 4)

  return (
    <main>
      <section className="detalle" aria-labelledby="tituloProducto">
        <div className="container">
          <nav className="miga miga-detalle" aria-label="Ruta">
            <Link to="/">Inicio</Link>
            <span aria-hidden="true">/</span>
            <Link to="/productos">Productos</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{producto.nombre}</span>
          </nav>

          <div className="detalle-grid">
            <figure className="detalle-imagen">
              <img src={imagenDe(producto)} alt={producto.nombre} onError={usarImagenRespaldo} />
            </figure>

            <div className="detalle-datos">
              <p className="categoria">{producto.categoria}</p>
              <h1 id="tituloProducto">{producto.nombre}</h1>

              <p className="detalle-precio">{formatearPrecio(producto.precioResidencial)}</p>
              <EtiquetaStock stock={producto.stock} />

              <p className="detalle-descripcion">{producto.descripcion}</p>

              <dl className="detalle-ficha">
                <div>
                  <dt>Código</dt>
                  <dd>{producto.codigo}</dd>
                </div>
                <div>
                  <dt>Unidad</dt>
                  <dd>{producto.unidad}</dd>
                </div>
                <div>
                  <dt>Disponibles</dt>
                  <dd>{sinStock ? "Sin stock" : producto.stock + " unidades"}</dd>
                </div>
              </dl>

              <div className="detalle-compra">
                <div className="selector-cantidad">
                  <label htmlFor="cantidadProducto">Cantidad</label>
                  <div className="carrito-cantidad">
                    <button
                      type="button"
                      className="paso"
                      aria-label="Quitar una unidad"
                      disabled={sinStock || cantidad <= 1}
                      onClick={() => ajustar(cantidad - 1)}
                    >
                      −
                    </button>

                    <input
                      type="number"
                      id="cantidadProducto"
                      min="1"
                      max={producto.stock}
                      step="1"
                      inputMode="numeric"
                      value={cantidad}
                      disabled={sinStock}
                      onChange={(e) => ajustar(e.target.value)}
                    />

                    <button
                      type="button"
                      className="paso"
                      aria-label="Agregar una unidad"
                      disabled={sinStock || cantidad >= producto.stock}
                      onClick={() => ajustar(cantidad + 1)}
                    >
                      +
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-principal boton-comprar"
                  disabled={sinStock}
                  onClick={anadir}
                >
                  {sinStock ? "Sin stock disponible" : "Añadir al carrito"}
                </button>
              </div>

              {/* Solo aparece si no se pudo agregar, por ejemplo por stock */}
              <p className={aviso ? "detalle-aviso detalle-aviso-error" : "detalle-aviso"} role="status" aria-live="polite">
                {aviso}
              </p>
            </div>
          </div>

          {relacionados.length > 0 && (
            <section className="relacionados" aria-labelledby="tituloRelacionados">
              <div className="titulo-seccion titulo-relacionados">
                <p>También te puede servir</p>
                <h2 id="tituloRelacionados">Productos relacionados</h2>
              </div>

              <ul className="row g-4 list-unstyled">
                {relacionados.map((otro) => (
                  <li key={otro.codigo} className="col-12 col-sm-6 col-lg-3">
                    <TarjetaProducto
                      codigo={otro.codigo}
                      nombre={otro.nombre}
                      categoria={otro.categoria}
                      precio={formatearPrecio(otro.precioResidencial)}
                      imagen={imagenDe(otro)}
                    />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </section>
    </main>
  )
}

export default DetalleProducto
